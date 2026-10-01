import { useState, useId, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShoppingCart, Tag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { ProductThumbnail } from "@/components/ui-kit";
import { submitMultiSale } from "@/lib/app-api";
import { currency, formatCurrencyInput, parseCurrencyInput, errorMessage, num } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const PAYMENT_METHODS = ["dinheiro", "dinheiro_sujo", "parceria"] as const;

export const PAYMENT_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  dinheiro_sujo: "Dinheiro Sujo",
  parceria: "Parceria",
  // Fallbacks de compatibilidade para registros legados
  pix: "Pix",
  transferencia: "Transferência",
  fiado: "Fiado",
  troca: "Troca",
};

export type SaleItemState = {
  rowId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

export function SaleDialog({ trigger }: { trigger: ReactNode }) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  // Múltiplos produtos na venda
  const [items, setItems] = useState<SaleItemState[]>([
    { rowId: "item-1", productId: "", quantity: "1", unitPrice: "" },
  ]);

  const [buyer, setBuyer] = useState("");
  const [payment, setPayment] = useState<string>("dinheiro");
  const [discountInput, setDiscountInput] = useState("");
  const [notes, setNotes] = useState("");

  const { data: products } = useProducts();
  const queryClient = useQueryClient();

  // Filtrar estritamente: ativo, can_be_sold marcado como habilitado na gestão e estoque disponível > 0
  const activeProducts = (products ?? []).filter((p) => {
    const isActive = p.ativo !== false;
    const canBeSold = p.can_be_sold === true;
    const availableStock = Number(p.sale_available_quantity ?? p.estoque_atual ?? 0);
    return isActive && canBeSold && availableStock > 0;
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { rowId: `item-${Date.now()}-${Math.random()}`, productId: "", quantity: "1", unitPrice: "" },
    ]);
  };

  const handleRemoveItem = (rowId: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.rowId !== rowId));
  };

  const handleUpdateItem = (rowId: string, updates: Partial<SaleItemState>) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.rowId !== rowId) return i;
        const updated = { ...i, ...updates };

        // Se alterou o produto, preenche automaticamente o preço sugerido
        if (updates.productId && updates.productId !== i.productId) {
          const prod = activeProducts.find((p) => p.id === updates.productId);
          if (prod && prod.preco_sugerido) {
            updated.unitPrice = formatCurrencyInput(prod.preco_sugerido);
          }
        }
        return updated;
      })
    );
  };

  // Cálculo financeiro
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseCurrencyInput(item.unitPrice);
    return sum + Math.max(0, qty * price);
  }, 0);

  const discountValue = Math.max(0, parseCurrencyInput(discountInput));
  const finalTotal = Math.max(0, subtotal - discountValue);

  // Validação de estoque e itens
  const hasInsufficientStock = items.some((item) => {
    if (!item.productId) return false;
    const prod = activeProducts.find((p) => p.id === item.productId);
    if (!prod) return true;
    const avail = Number(prod.sale_available_quantity ?? prod.estoque_atual ?? 0);
    const qty = parseFloat(item.quantity) || 0;
    return qty > avail;
  });

  const hasInvalidItems = items.some((item) => {
    const qty = parseFloat(item.quantity);
    const price = parseCurrencyInput(item.unitPrice);
    return !item.productId || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0;
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!hasPermission("create_sale")) {
        throw new Error("Você não possui permissão para lançar vendas.");
      }
      if (!buyer.trim()) {
        throw new Error("Informe o nome do comprador.");
      }
      if (items.length === 0 || hasInvalidItems) {
        throw new Error("Preencha todos os produtos, quantidades e valores da venda.");
      }
      if (hasInsufficientStock) {
        throw new Error("Um ou mais produtos selecionados não possuem estoque suficiente.");
      }

      await submitMultiSale({
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: parseFloat(i.quantity),
            unitPrice: parseCurrencyInput(i.unitPrice),
          })),
          buyerName: buyer.trim(),
          paymentMethod: payment,
          notes: notes.trim() || undefined,
          totalDiscount: discountValue,
        },
      });
    },
    onSuccess: () => {
      toast.success(
        items.length > 1
          ? `Venda multi-produto (${items.length} itens) registrada com sucesso!`
          : "Venda registrada com sucesso e estoque abatido!"
      );
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });

      setOpen(false);
      setItems([{ rowId: "item-1", productId: "", quantity: "1", unitPrice: "" }]);
      setBuyer("");
      setPayment("dinheiro");
      setDiscountInput("");
      setNotes("");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden surface-card border-border/80">
        <DialogHeader className="p-5 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <span>Lançar Nova Venda</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lançamento direto de um ou múltiplos produtos do armazém disponível para venda comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 mobile-touch-scroll text-xs">
          {/* LISTA DE PRODUTOS SELECIONADOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Produtos da Venda ({items.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Outro Produto
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const prod = activeProducts.find((p) => p.id === item.productId);
                const avail = Number(prod?.sale_available_quantity ?? prod?.estoque_atual ?? 0);
                const qtyNum = parseFloat(item.quantity) || 0;
                const rowTotal = qtyNum * parseCurrencyInput(item.unitPrice);
                const isOverStock = !!prod && qtyNum > avail;

                return (
                  <div
                    key={item.rowId}
                    className="p-3 rounded-xl border border-border/60 bg-secondary/20 space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.rowId)}
                          className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                          title="Remover produto da lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold">Produto</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(val) => handleUpdateItem(item.rowId, { productId: val })}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background/60">
                          <SelectValue placeholder="Selecione o produto disponível..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {activeProducts.map((p) => {
                            const pAvail = Number(p.sale_available_quantity ?? p.estoque_atual ?? 0);
                            return (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <ProductThumbnail src={p.imagem_url} name={p.nome} size="xs" />
                                  <span className="font-semibold">{p.nome}</span>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    · {num(pAvail)} {p.unidade} disp.
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {prod && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                          <span>
                            Estoque disponível:{" "}
                            <strong className="text-emerald-400 font-mono">
                              {num(avail)} {prod.unidade}
                            </strong>
                          </span>
                          <span>
                            Sugerido:{" "}
                            <span className="font-mono">{currency(prod.preco_sugerido || 0)}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.rowId, { quantity: e.target.value })}
                          placeholder="1"
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Preço Unitário (R$)</Label>
                        <Input
                          type="text"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(item.rowId, {
                              unitPrice: formatCurrencyInput(e.target.value),
                            })
                          }
                          placeholder="R$ 0,00"
                          className="h-8 text-xs font-mono font-bold text-emerald-400"
                        />
                      </div>
                    </div>

                    {isOverStock && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Quantidade solicitada ({qtyNum}) excede o saldo disponível ({avail} {prod.unidade}).
                      </p>
                    )}

                    <div className="flex items-center justify-end text-[11px] font-medium pt-0.5 border-t border-border/40">
                      <span className="text-muted-foreground">Subtotal do item: </span>
                      <span className="ml-1.5 font-bold font-mono text-foreground">
                        {currency(rowTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DADOS DA TRANSAÇÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Comprador *</Label>
              <Input
                value={buyer}
                maxLength={80}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Nome ou passaporte do cliente"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Forma de Pagamento *</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="h-9 text-xs bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {PAYMENT_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DESCONTO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Desconto no Valor (R$)</span>
              </Label>
              {discountValue > 0 && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                  -{currency(discountValue)}
                </Badge>
              )}
            </div>
            <Input
              type="text"
              placeholder="R$ 0,00 (opcional)"
              value={discountInput}
              onChange={(e) => setDiscountInput(formatCurrencyInput(e.target.value))}
              className="h-9 text-xs font-mono font-bold text-amber-400"
            />
          </div>

          {/* OBSERVAÇÕES */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Observações / Detalhes</Label>
            <Textarea
              value={notes}
              maxLength={280}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais sobre a negociação (opcional)"
              className="text-xs min-h-[55px] resize-none"
            />
          </div>

          {/* RESUMO FINANCEIRO */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal dos Itens:</span>
              <span>{currency(subtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex items-center justify-between text-amber-400 font-semibold">
                <span>Desconto Aplicado:</span>
                <span>- {currency(discountValue)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold text-emerald-400 pt-1 border-t border-border/40">
              <span>Total a Pagar:</span>
              <span className="text-base">{currency(finalTotal)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/40 bg-secondary/10 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={mutation.isPending || hasInsufficientStock || hasInvalidItems || !buyer.trim()}
            onClick={() => mutation.mutate()}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs gap-1.5"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Confirmar Venda ({currency(finalTotal)})</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
