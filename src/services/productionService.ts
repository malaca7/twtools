import { supabase } from "@/integrations/supabase/client";
import { rtdb } from "@/integrations/firebase/rtdb";
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
    min_stock: Number(row.min_stock || 0),
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
  min_stock?: number;
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
      min_stock: Math.max(0, Number(input.min_stock || 0)),
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
    min_stock: Number((data as any).min_stock || 0),
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
    min_stock?: number;
    image_url?: string | null;
    product_id?: string | null;
    is_active?: boolean;
  }
): Promise<void> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.unit !== undefined) payload.unit = input.unit.trim();
  if (input.min_stock !== undefined) payload.min_stock = Math.max(0, Number(input.min_stock || 0));
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

export async function pullRawMaterialFromBau(
  rawMaterialId: string,
  bauId: string,
  quantity: number,
  reason?: string
): Promise<{
  success: boolean;
  is_manual: boolean;
  bau_nome: string;
  quantity: number;
  bau_previous: number;
  bau_balance: number;
  raw_material_previous: number;
  raw_material_balance: number;
}> {
  const cleanQty = Math.max(1, Math.round(Number(quantity) || 1));
  const { data, error } = await supabase.rpc("pull_raw_material_from_bau_rpc", {
    p_raw_material_id: rawMaterialId,
    p_bau_id: bauId,
    p_quantity: cleanQty,
    p_reason: reason?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao puxar matérias-primas do baú");
  }

  return data as any;
}

export async function transferRawMaterialToBau(
  rawMaterialId: string,
  bauId: string,
  quantity: number,
  reason?: string
): Promise<{
  success: boolean;
  bau_nome: string;
  quantity: number;
  raw_material_balance: number;
  bau_balance: number;
}> {
  const cleanQty = Math.max(1, Math.round(Number(quantity) || 1));
  const { data, error } = await supabase.rpc("transfer_raw_material_to_bau_rpc", {
    p_raw_material_id: rawMaterialId,
    p_bau_id: bauId,
    p_quantity: cleanQty,
    p_reason: reason?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao transferir matéria-prima para o baú");
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
    production_yield: Number(row.production_yield || 1),
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
  rawMaterials?: { raw_material_id: string; quantity_used: number }[];
  observation?: string;
  bauId?: string;
}): Promise<{
  success: boolean;
  production_id: string;
  quantity: number;
  product_name: string;
  warehouse_balance: number;
}> {
  const cleanQty = Math.max(1, Math.round(Number(input.quantity) || 1));
  const rawMaterials = input.rawMaterials || [];
  const cleanMats = rawMaterials.map((m) => ({
    raw_material_id: m.raw_material_id,
    quantity_used: Math.max(1, Math.round(Number(m.quantity_used) || 1)),
  }));

  // 1. Se informou matérias-primas, tenta a RPC padrão
  if (cleanMats.length > 0) {
    try {
      const { data, error } = await supabase.rpc("execute_production_rpc", {
        p_product_id: input.productId,
        p_quantity: cleanQty,
        p_raw_materials: cleanMats,
        p_observation: input.observation?.trim() || null,
      });

      if (!error && data) {
        const rpcResult = data as any;
        const now = new Date().toISOString();
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || "system";

        await rtdb.set(`productions/${rpcResult.production_id}`, {
          id: rpcResult.production_id,
          product_id: input.productId,
          quantity: cleanQty,
          user_id: userId,
          observation: input.observation?.trim() || null,
          status: "COMPLETED",
          created_at: now,
        }).catch(() => {});

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("tw_production_created", {
            detail: { id: rpcResult.production_id, productId: input.productId, quantity: cleanQty },
          }));
          window.dispatchEvent(new CustomEvent("tw_stock_updated"));
          window.dispatchEvent(new CustomEvent("tw_products_updated"));
        }

        return rpcResult;
      }
      console.warn("RPC execute_production_rpc avisou:", error?.message);
    } catch (rpcErr) {
      console.warn("Falha na chamada RPC de produção (prosseguindo com registro direto):", rpcErr);
    }
  }

  // 2. Registro direto e resiliente (sem bloquear por múltiplos de receitas ou falta de insumos)
  const now = new Date().toISOString();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || "system";
  const prodId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `prod_${Date.now()}`;

  // Buscar detalhes do produto no Supabase ou RTDB
  const { data: prodData } = await supabase
    .from("products")
    .select("id, nome, unidade, estoque_atual, bau_id")
    .eq("id", input.productId)
    .maybeSingle();

  let prodName = prodData?.nome;
  let prodUnit = prodData?.unidade || "un";
  let currentStock = Number(prodData?.estoque_atual || 0);

  if (!prodName) {
    const fbProd = await rtdb.get<any>(`products/${input.productId}`).catch(() => null);
    if (fbProd) {
      prodName = fbProd.nome;
      prodUnit = fbProd.unidade || "un";
      currentStock = Number(fbProd.estoque_atual || 0);
    } else {
      prodName = "Produto";
    }
  }

  // Gravar no Supabase (tabela productions)
  const { data: insertedProd } = await supabase
    .from("productions" as any)
    .insert({
      id: prodId,
      product_id: input.productId,
      quantity: cleanQty,
      user_id: userId,
      observation: input.observation?.trim() || null,
      status: "COMPLETED",
      created_at: now,
      updated_at: now,
    })
    .select()
    .maybeSingle();

  const finalProdId = (insertedProd as any)?.id || prodId;

  // Gravar no Firebase RTDB (productions)
  await rtdb.set(`productions/${finalProdId}`, {
    id: finalProdId,
    product_id: input.productId,
    quantity: cleanQty,
    user_id: userId,
    observation: input.observation?.trim() || null,
    status: "COMPLETED",
    created_at: now,
    updated_at: now,
  }).catch(() => {});

  // Atualizar Armazém (warehouse_stock) no Supabase
  const { data: whRow } = await supabase
    .from("warehouse_stock" as any)
    .select("quantity")
    .eq("product_id", input.productId)
    .maybeSingle();

  const prevWh = Number(whRow?.quantity || 0);
  const newWh = prevWh + cleanQty;

  await supabase
    .from("warehouse_stock" as any)
    .upsert({
      product_id: input.productId,
      quantity: newWh,
      updated_at: now,
    }, { onConflict: "product_id" })
    .catch(() => {});

  // Registrar movimentação de armazém no Supabase
  await supabase
    .from("warehouse_movements" as any)
    .insert({
      product_id: input.productId,
      type: "PRODUCTION",
      quantity: cleanQty,
      previous_balance: prevWh,
      resulting_balance: newWh,
      source: "PRODUCAO",
      destination: "ARMAZEM",
      reference_id: finalProdId,
      user_id: userId,
      observation: input.observation?.trim() || `Produção direta de ${cleanQty} ${prodUnit}`,
      created_at: now,
    })
    .catch(() => {});

  // Registrar insumos consumidos se foram informados
  if (cleanMats.length > 0) {
    for (const matItem of cleanMats) {
      await supabase.from("production_raw_materials" as any).insert({
        production_id: finalProdId,
        raw_material_id: matItem.raw_material_id,
        quantity_used: matItem.quantity_used,
        created_at: now,
      }).catch(() => {});

      try {
        const { data: matData } = await supabase
          .from("raw_materials" as any)
          .select("stock_quantity")
          .eq("id", matItem.raw_material_id)
          .maybeSingle();

        if (matData) {
          const prevMatStock = Number(matData.stock_quantity || 0);
          const newMatStock = Math.max(0, prevMatStock - matItem.quantity_used);
          await supabase
            .from("raw_materials" as any)
            .update({ stock_quantity: newMatStock, updated_at: now })
            .eq("id", matItem.raw_material_id);

          await supabase.from("raw_material_movements" as any).insert({
            raw_material_id: matItem.raw_material_id,
            type: "CONSUMPTION",
            quantity: matItem.quantity_used,
            previous_balance: prevMatStock,
            resulting_balance: newMatStock,
            production_id: finalProdId,
            user_id: userId,
            observation: `Consumo na produção ${finalProdId}`,
            created_at: now,
          });
        }
      } catch (matErr) {
        console.warn("Aviso ao abater matéria-prima:", matErr);
      }
    }
  }

  // Atualizar estoque geral e baús
  const newCatalogStock = currentStock + cleanQty;
  await supabase
    .from("products")
    .update({ estoque_atual: newCatalogStock, updated_at: now })
    .eq("id", input.productId)
    .catch(() => {});

  await rtdb.update(`products/${input.productId}`, {
    estoque_atual: newCatalogStock,
    updated_at: now,
  }).catch(() => {});

  const targetBauId = input.bauId || prodData?.bau_id;
  if (targetBauId) {
    const pbKey = `${input.productId}_${targetBauId}`;
    const pbData = await rtdb.get<any>(`product_baus/${pbKey}`).catch(() => null);
    const prevPb = Number(pbData?.quantidade || pbData?.estoque_atual || 0);
    const newPb = prevPb + cleanQty;
    await rtdb.set(`product_baus/${pbKey}`, {
      product_id: input.productId,
      bau_id: targetBauId,
      quantidade: newPb.toFixed(2),
      updated_at: now,
    }).catch(() => {});
  }

  // Registrar movimentação de estoque
  const movId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `mov_${Date.now()}`;
  await rtdb.set(`stock_movements/${movId}`, {
    id: movId,
    product_id: input.productId,
    user_id: userId,
    bau_id: targetBauId || null,
    type: "entrada",
    quantity: cleanQty,
    previous_balance: currentStock,
    resulting_balance: newCatalogStock,
    reason: input.observation?.trim() || `Produção registrada (${cleanQty} ${prodUnit})`,
    origin: "producao",
    status: "completed",
    created_at: now,
  }).catch(() => {});

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_production_created", {
      detail: { id: finalProdId, productId: input.productId, quantity: cleanQty },
    }));
    window.dispatchEvent(new CustomEvent("tw_stock_updated"));
    window.dispatchEvent(new CustomEvent("tw_products_updated"));
  }

  return {
    success: true,
    production_id: finalProdId,
    quantity: cleanQty,
    product_name: prodName,
    warehouse_balance: newWh,
  };
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

  let results: Production[] = [];

  if (!error && Array.isArray(data)) {
    results = data.map((row: any) => ({
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

  // Mesclar também com Firebase RTDB para resiliência máxima
  try {
    const fbList = await rtdb.getList<any>("productions");
    if (fbList && fbList.length > 0) {
      const existingIds = new Set(results.map((r) => r.id));
      for (const item of fbList) {
        if (!item || !item.id || existingIds.has(item.id)) continue;
        results.push({
          id: item.id,
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          user_id: item.user_id || "system",
          observation: item.observation || null,
          status: item.status || "COMPLETED",
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
        });
      }
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch {}

  return results.slice(0, limit);
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
  if (settings.production_yield !== undefined) payload.production_yield = Math.max(1, Math.round(Number(settings.production_yield) || 1));
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

