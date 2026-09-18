import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { PageHeader, ProductThumbnail } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBaus, useProducts } from "@/hooks/useData";
import { num } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dev/estoque")({
  component: DevEstoquePage,
});

function DevEstoquePage() {
  return (
    <DeveloperGuard requiredPermissions={["estoque.configurar", "estoque.ajustar"]}>
      <PageHeader
        title="Ajustes de Estoque"
        description="Área restrita de desenvolvimento e gerência avançada para correções no inventário."
      />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <StockAdjustmentForm />
        
        <Card className="surface-card border-rose-500/30">
          <CardHeader>
            <CardTitle className="text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Auditoria de Ajustes
            </CardTitle>
            <CardDescription>
              Toda alteração feita por esta interface fica registrada permanentemente com a tag [Ajuste Dev]. O motor automático do Discord continua processando o saldo em paralelo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Apenas usuários com as permissões <strong>estoque.ajustar</strong> e <strong>estoque.configurar</strong> possuem acesso a esta tela. O abuso desta ferramenta pode corromper a paridade com o Discord.
            </p>
          </CardContent>
        </Card>
      </div>
    </DeveloperGuard>
  );
}

function StockAdjustmentForm() {
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const queryClient = useQueryClient();

  const [bauId, setBauId] = useState("");
  const [productId, setProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"entrada" | "saida" | "definir">("definir");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const activeProducts = products.filter(p => p.ativo);
  const selectedProduct = activeProducts.find(p => p.id === productId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!bauId) throw new Error("Selecione um baú.");
      if (!productId) throw new Error("Selecione um produto.");
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 0) throw new Error("Quantidade inválida.");
      if (adjustmentType !== "definir" && qty === 0) throw new Error("A quantidade de entrada/saída deve ser maior que 0.");
      if (!reason.trim()) throw new Error("O motivo é obrigatório para auditoria.");

      const { data: userResp } = await supabase.auth.getUser();
      if (!userResp.user) throw new Error("Não autenticado");

      // Pegar estoque atual para calcular
      const { data: prodData } = await supabase.from("products").select("estoque_atual").eq("id", productId).single();
      if (!prodData) throw new Error("Produto não encontrado.");

      let currentStock = Number(prodData.estoque_atual);
      let newStock = currentStock;
      let movType = "entrada";
      let movQty = qty;

      if (adjustmentType === "definir") {
        if (qty >= currentStock) {
          movType = "entrada";
          movQty = qty - currentStock;
        } else {
          movType = "saida";
          movQty = currentStock - qty;
        }
        newStock = qty;
      } else if (adjustmentType === "entrada") {
        movType = "entrada";
        newStock = currentStock + qty;
      } else if (adjustmentType === "saida") {
        movType = "saida";
        newStock = currentStock - qty;
        if (newStock < 0) newStock = 0;
      }

      if (movQty === 0 && adjustmentType === "definir") {
        throw new Error("O estoque já possui essa quantidade.");
      }

      // Atualiza produto
      const { error: pErr } = await supabase.from("products").update({ estoque_atual: newStock, updated_at: new Date().toISOString() }).eq("id", productId);
      if (pErr) throw pErr;

      // Atualiza product_baus
      await supabase.from("product_baus").upsert({ product_id: productId, bau_id: bauId, quantidade: newStock });

      // Insere movimento auditado
      const { error: mErr } = await supabase.from("stock_movements").insert({
        product_id: productId,
        bau_id: bauId,
        user_id: userResp.user.id,
        type: movType as "entrada" | "saida",
        quantity: movQty,
        previous_balance: currentStock,
        resulting_balance: newStock,
        reason: "[Ajuste Dev] " + reason.trim(),
        origin: "painel_dev",
        adjustment_type: adjustmentType,
        status: "success"
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      toast.success("Estoque ajustado com sucesso!");
      setQuantity("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao ajustar estoque");
    }
  });

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle>Ajuste Manual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Baú Alvo</Label>
          <Select value={bauId} onValueChange={setBauId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {baus.filter(b => b.ativo).map(b => (
                <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Produto</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {activeProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} (Atual: {num(p.estoque_atual)} {p.unidade})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Ajuste</Label>
            <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="definir">Definir Exato</SelectItem>
                <SelectItem value="entrada">Adicionar (+)</SelectItem>
                <SelectItem value="saida">Remover (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Motivo (Auditoria)</Label>
          <Textarea placeholder="Descreva o motivo do ajuste manual (obrigatório)" value={reason} onChange={e => setReason(e.target.value)} />
        </div>

        <Button 
          className="w-full font-bold bg-rose-600 hover:bg-rose-700 text-white" 
          disabled={mutation.isPending} 
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Aplicar Ajuste de Estoque
        </Button>
      </CardContent>
    </Card>
  );
}
