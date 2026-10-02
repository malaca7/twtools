import { supabase } from "@/integrations/supabase/client";
import type {
  RawMaterial,
  Production,
  ProductionRawMaterial,
  WarehouseStock,
  WarehouseMovement,
  RawMaterialMovement,
  Product,
} from "@/lib/app-types";

// ==========================================
// 1. MATÉRIAS-PRIMAS (RAW MATERIALS)
// ==========================================

export async function getRawMaterials(): Promise<RawMaterial[]> {
  const { data, error } = await supabase
    .from("raw_materials" as any)
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao carregar matérias-primas:", error);
    throw new Error(error.message || "Erro ao carregar matérias-primas");
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    unit: row.unit || "un",
    stock_quantity: Number(row.stock_quantity || 0),
    image_url: row.image_url || null,
    product_id: row.product_id || null,
    is_active: row.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createRawMaterial(input: {
  name: string;
  description?: string;
  unit: string;
  stock_quantity?: number;
  image_url?: string | null;
  product_id?: string | null;
  is_active?: boolean;
}): Promise<RawMaterial> {
  const { data, error } = await supabase
    .from("raw_materials" as any)
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unit: input.unit.trim() || "un",
      stock_quantity: Math.max(0, Number(input.stock_quantity || 0)),
      image_url: input.image_url?.trim() || null,
      product_id: input.product_id || null,
      is_active: input.is_active !== false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Erro ao criar matéria-prima");
  }

  return {
    id: (data as any).id,
    name: (data as any).name,
    description: (data as any).description,
    unit: (data as any).unit,
    stock_quantity: Number((data as any).stock_quantity || 0),
    image_url: (data as any).image_url || null,
    product_id: (data as any).product_id || null,
    is_active: (data as any).is_active,
    created_at: (data as any).created_at,
    updated_at: (data as any).updated_at,
  };
}

export async function updateRawMaterial(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    unit?: string;
    image_url?: string | null;
    product_id?: string | null;
    is_active?: boolean;
  }
): Promise<void> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.unit !== undefined) payload.unit = input.unit.trim();
  if (input.image_url !== undefined) payload.image_url = input.image_url?.trim() || null;
  if (input.product_id !== undefined) payload.product_id = input.product_id;
  if (input.is_active !== undefined) payload.is_active = input.is_active;

  const { error } = await supabase
    .from("raw_materials" as any)
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Erro ao atualizar matéria-prima");
  }
}

/**
 * Garante que todas as matérias-primas cadastradas estejam presentes na tabela de produtos de estoque.
 * Se alguma matéria-prima não possuir produto correspondente, ela é cadastrada automaticamente como produto.
 */
export async function syncRawMaterialsAsProducts(): Promise<{ createdCount: number }> {
  const { data: materials, error: matErr } = await supabase
    .from("raw_materials" as any)
    .select("*");
  if (matErr || !materials) return { createdCount: 0 };

  const { data: prods, error: prodErr } = await supabase
    .from("products")
    .select("id, nome, unidade, categoria_id");
  if (prodErr || !prods) return { createdCount: 0 };

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .ilike("nome", "Outros")
    .maybeSingle();
  const defaultCatId = cat?.id || null;

  let createdCount = 0;
  for (const mat of materials) {
    let matched = (prods as any[]).find((p: any) => p.id === mat.product_id) ||
      (prods as any[]).find((p: any) => p.nome.trim().toLowerCase() === mat.name.trim().toLowerCase());

    if (!matched) {
      const { data: newProd, error: insErr } = await supabase
        .from("products")
        .insert({
          nome: mat.name.trim(),
          descricao: mat.description?.trim() || `Matéria-prima: ${mat.name.trim()}`,
          unidade: mat.unit?.trim() || "un",
          categoria_id: defaultCatId,
          estoque_atual: Number(mat.stock_quantity || 0),
          estoque_minimo: 0,
          preco_sugerido: 0,
          imagem_url: mat.image_url?.trim() || null,
          can_be_produced: false,
          can_be_sold: false,
          ativo: true,
        })
        .select()
        .single();

      if (!insErr && newProd) {
        matched = newProd;
        createdCount++;
      }
    }

    if (matched) {
      const prodId = (matched as any).id;
      // Garante existência de registro em warehouse_stock
      await supabase
        .from("warehouse_stock" as any)
        .upsert(
          {
            product_id: prodId,
            quantity: Number(mat.stock_quantity || 0),
          },
          { onConflict: "product_id", ignoreDuplicates: true }
        );

      if (mat.product_id !== prodId) {
        await supabase
          .from("raw_materials" as any)
          .update({ product_id: prodId, updated_at: new Date().toISOString() })
          .eq("id", mat.id);
      }
    }
  }

  return { createdCount };
}

export async function deleteRawMaterial(
  id: string
): Promise<{ success: boolean; action: string; message: string }> {
  const { data, error } = await supabase.rpc("delete_raw_material_rpc", {
    p_raw_material_id: id,
  });

  if (error) {
    throw new Error(error.message || "Erro ao excluir matéria-prima");
  }

  return data as any;
}

export async function adjustRawMaterialStock(
  rawMaterialId: string,
  quantityDelta: number,
  reason?: string
): Promise<{ success: boolean; new_balance: number }> {
  const cleanDelta = Math.round(Number(quantityDelta) || 0);
  const { data, error } = await supabase.rpc("adjust_raw_material_stock_rpc", {
    p_raw_material_id: rawMaterialId,
    p_quantity_delta: cleanDelta,
    p_reason: reason ? reason.trim() : null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao ajustar estoque de matéria-prima");
  }

  return data as any;
}

// ==========================================
// 1.1 RECEITAS DE PRODUÇÃO (PRODUCT RECIPES)
// ==========================================

export async function getProductRecipes(productId?: string): Promise<import("@/lib/app-types").ProductRecipeItem[]> {
  let query = supabase
    .from("product_recipes" as any)
    .select(`
      *,
      raw_materials:raw_material_id (id, name, unit, stock_quantity, image_url)
    `);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar receitas de produto:", error);
    throw new Error(error.message || "Erro ao carregar receitas");
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    raw_material_id: row.raw_material_id,
    quantity_required: Number(row.quantity_required || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    raw_material: row.raw_materials
      ? {
          id: row.raw_materials.id,
          name: row.raw_materials.name,
          unit: row.raw_materials.unit,
          stock_quantity: Number(row.raw_materials.stock_quantity || 0),
          image_url: row.raw_materials.image_url || null,
          description: null,
          is_active: true,
          created_at: "",
          updated_at: "",
        }
      : undefined,
  }));
}

export async function saveProductRecipe(
  productId: string,
  productionYield: number,
  items: { raw_material_id: string; quantity_required: number }[]
): Promise<{ success: boolean; product_id: string; production_yield: number; items_count: number }> {
  const cleanYield = Math.max(1, Math.round(Number(productionYield) || 1));
  const cleanItems = (items || []).map((i) => ({
    raw_material_id: i.raw_material_id,
    quantity_required: Math.max(1, Math.round(Number(i.quantity_required) || 1)),
  }));

  const { data, error } = await supabase.rpc("save_product_recipe", {
    p_product_id: productId,
    p_production_yield: cleanYield,
    p_items: cleanItems,
  });

  if (error) {
    throw new Error(error.message || "Erro ao salvar receita de produção");
  }

  return data as any;
}

export async function getRawMaterialMovements(
  rawMaterialId?: string,
  limit = 100
): Promise<RawMaterialMovement[]> {
  let query = supabase
    .from("raw_material_movements" as any)
    .select(`
      *,
      raw_materials:raw_material_id (id, name, unit)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (rawMaterialId) {
    query = query.eq("raw_material_id", rawMaterialId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar movimentações de matéria-prima:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    raw_material_id: row.raw_material_id,
    type: row.type,
    quantity: Number(row.quantity || 0),
    previous_balance: Number(row.previous_balance || 0),
    resulting_balance: Number(row.resulting_balance || 0),
    production_id: row.production_id,
    user_id: row.user_id,
    observation: row.observation,
    created_at: row.created_at,
    raw_material: row.raw_materials
      ? {
          id: row.raw_materials.id,
          name: row.raw_materials.name,
          unit: row.raw_materials.unit,
          description: null,
          stock_quantity: 0,
          is_active: true,
          created_at: "",
          updated_at: "",
        }
      : undefined,
  }));
}


// ==========================================
// 2. PRODUÇÕES (PRODUCTIONS)
// ==========================================

export async function executeProduction(input: {
  productId: string;
  quantity: number;
  rawMaterials: { raw_material_id: string; quantity_used: number }[];
  observation?: string;
}): Promise<{
  success: boolean;
  production_id: string;
  quantity: number;
  product_name: string;
  warehouse_balance: number;
}> {
  const cleanQty = Math.max(1, Math.round(Number(input.quantity) || 1));
  const cleanMats = (input.rawMaterials || []).map((m) => ({
    raw_material_id: m.raw_material_id,
    quantity_used: Math.max(1, Math.round(Number(m.quantity_used) || 1)),
  }));

  const { data, error } = await supabase.rpc("execute_production_rpc", {
    p_product_id: input.productId,
    p_quantity: cleanQty,
    p_raw_materials: cleanMats,
    p_observation: input.observation?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao registrar produção");
  }

  return data as any;
}

export async function getProductions(limit = 100): Promise<Production[]> {
  const { data, error } = await supabase
    .from("productions" as any)
    .select(`
      *,
      products:product_id (id, nome, unidade, imagem_url, categoria_id, preco_sugerido),
      production_raw_materials (
        id,
        raw_material_id,
        quantity_used,
        created_at,
        raw_materials:raw_material_id (id, name, unit)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao carregar produções:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    quantity: Number(row.quantity || 0),
    user_id: row.user_id,
    observation: row.observation,
    status: row.status || "COMPLETED",
    created_at: row.created_at,
    updated_at: row.updated_at,
    product: row.products
      ? {
          id: row.products.id,
          nome: row.products.nome,
          unidade: row.products.unidade,
          imagem_url: row.products.imagem_url,
          categoria_id: row.products.categoria_id,
          preco_sugerido: Number(row.products.preco_sugerido || 0),
          descricao: null,
          estoque_atual: 0,
          estoque_minimo: 0,
          ativo: true,
          created_at: "",
          updated_at: "",
          bau_id: null,
        }
      : undefined,
    consumed_materials: (row.production_raw_materials || []).map((prm: any) => ({
      id: prm.id,
      production_id: row.id,
      raw_material_id: prm.raw_material_id,
      quantity_used: Number(prm.quantity_used || 0),
      created_at: prm.created_at,
      raw_material: prm.raw_materials
        ? {
            id: prm.raw_materials.id,
            name: prm.raw_materials.name,
            unit: prm.raw_materials.unit,
            description: null,
            stock_quantity: 0,
            is_active: true,
            created_at: "",
            updated_at: "",
          }
        : undefined,
    })),
  }));
}


// ==========================================
// 3. ARMAZÉM (WAREHOUSE STOCK & MOVEMENTS)
// ==========================================

export async function getWarehouseStock(): Promise<WarehouseStock[]> {
  const { data, error } = await supabase
    .from("warehouse_stock" as any)
    .select(`
      *,
      products:product_id (
        id,
        nome,
        descricao,
        categoria_id,
        unidade,
        estoque_atual,
        estoque_minimo,
        preco_sugerido,
        imagem_url,
        ativo,
        can_be_produced,
        can_be_sold,
        sale_available_quantity,
        bau_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar estoque do armazém:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    quantity: Number(row.quantity || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    product: row.products
      ? {
          id: row.products.id,
          nome: row.products.nome,
          descricao: row.products.descricao,
          categoria_id: row.products.categoria_id,
          unidade: row.products.unidade,
          estoque_atual: Number(row.products.estoque_atual || 0),
          estoque_minimo: Number(row.products.estoque_minimo || 0),
          preco_sugerido: Number(row.products.preco_sugerido || 0),
          imagem_url: row.products.imagem_url,
          ativo: row.products.ativo !== false,
          can_be_produced: row.products.can_be_produced === true,
          can_be_sold: row.products.can_be_sold === true,
          sale_available_quantity: Number(row.products.sale_available_quantity || 0),
          bau_id: row.products.bau_id,
          created_at: "",
          updated_at: "",
        }
      : undefined,
  }));
}

export async function transferWarehouseToStorage(
  productId: string,
  quantity: number,
  bauId?: string | null,
  observation?: string
): Promise<{ success: boolean; transferred: number; warehouse_balance: number; destination: string }> {
  const { data, error } = await supabase.rpc("transfer_warehouse_to_storage_rpc", {
    p_product_id: productId,
    p_quantity: quantity,
    p_bau_id: bauId || null,
    p_observation: observation?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao transferir produtos do armazém para o baú");
  }

  return data as any;
}

export async function transferWarehouseToSale(
  productId: string,
  quantity: number,
  observation?: string
): Promise<{ success: boolean; transferred: number; warehouse_balance: number; sale_available_balance: number }> {
  const { data, error } = await supabase.rpc("transfer_warehouse_to_sale_rpc", {
    p_product_id: productId,
    p_quantity: quantity,
    p_observation: observation?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao transferir produtos do armazém para disponibilidade de venda");
  }

  return data as any;
}

export async function adjustWarehouseStock(
  productId: string,
  newQuantity: number,
  reason: string
): Promise<{ success: boolean; previous: number; new_balance: number }> {
  const { data, error } = await supabase.rpc("adjust_warehouse_stock_rpc", {
    p_product_id: productId,
    p_new_quantity: newQuantity,
    p_reason: reason.trim(),
  });

  if (error) {
    throw new Error(error.message || "Erro ao ajustar saldo do armazém");
  }

  return data as any;
}

export async function getWarehouseMovements(
  productId?: string,
  limit = 150
): Promise<WarehouseMovement[]> {
  let query = supabase
    .from("warehouse_movements" as any)
    .select(`
      *,
      products:product_id (id, nome, unidade, imagem_url)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar movimentações do armazém:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    type: row.type,
    quantity: Number(row.quantity || 0),
    previous_balance: Number(row.previous_balance || 0),
    resulting_balance: Number(row.resulting_balance || 0),
    source: row.source,
    destination: row.destination,
    reference_id: row.reference_id,
    user_id: row.user_id,
    observation: row.observation,
    created_at: row.created_at,
    product: row.products
      ? {
          id: row.products.id,
          nome: row.products.nome,
          unidade: row.products.unidade,
          imagem_url: row.products.imagem_url,
          descricao: null,
          categoria_id: null,
          estoque_atual: 0,
          estoque_minimo: 0,
          preco_sugerido: 0,
          ativo: true,
          created_at: "",
          updated_at: "",
          bau_id: null,
        }
      : undefined,
  }));
}


// ==========================================
// 4. CONFIGURAÇÃO DE PRODUTOS PARA PRODUÇÃO
// ==========================================

export async function updateProductProductionSettings(
  productId: string,
  settings: {
    can_be_produced?: boolean;
    can_be_sold?: boolean;
    sale_available_quantity?: number;
    production_yield?: number;
    ativo?: boolean;
    nome?: string;
    descricao?: string | null;
    preco_sugerido?: number;
  }
): Promise<void> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (settings.can_be_produced !== undefined) payload.can_be_produced = settings.can_be_produced;
  if (settings.can_be_sold !== undefined) payload.can_be_sold = settings.can_be_sold;
  if (settings.sale_available_quantity !== undefined) payload.sale_available_quantity = settings.sale_available_quantity;
  if (settings.production_yield !== undefined) payload.production_yield = Math.max(0.001, Number(settings.production_yield));
  if (settings.ativo !== undefined) payload.ativo = settings.ativo;
  if (settings.nome !== undefined) payload.nome = settings.nome.trim();
  if (settings.descricao !== undefined) payload.descricao = settings.descricao?.trim() || null;
  if (settings.preco_sugerido !== undefined) payload.preco_sugerido = Math.max(0, Number(settings.preco_sugerido));

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId);

  if (error) {
    throw new Error(error.message || "Erro ao atualizar configurações do produto");
  }
}

// ==========================================
// 5. GESTÃO E TRANSFERÊNCIA DE SALDOS (ARMAZÉM / BAÚS / VENDAS)
// ==========================================

export type ManageStockAction = "TRANSFER" | "REMOVE" | "ADJUST";
export type StockLocation = "WAREHOUSE" | "SALE" | "BAU";

export async function manageProductionStock(params: {
  productId: string;
  action: ManageStockAction;
  origin: StockLocation;
  destination?: StockLocation;
  originBauId?: string | null;
  destinationBauId?: string | null;
  quantity: number;
  reason?: string;
}): Promise<{
  success: boolean;
  product_id: string;
  action: string;
  warehouse_balance: number;
  sale_balance: number;
  chest_orig_balance: number;
  chest_dest_balance: number;
}> {
  const cleanQty = Math.max(
    params.action === "ADJUST" ? 0 : 1,
    Math.round(Number(params.quantity) || 0)
  );

  const { data, error } = await supabase.rpc("manage_production_stock_rpc", {
    p_product_id: params.productId,
    p_action: params.action,
    p_origin: params.origin,
    p_destination: params.destination || null,
    p_origin_bau_id: params.originBauId || null,
    p_destination_bau_id: params.destinationBauId || null,
    p_quantity: cleanQty,
    p_reason: params.reason?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao processar gestão de saldo do produto");
  }

  return data as any;
}

