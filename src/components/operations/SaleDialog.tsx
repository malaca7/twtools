import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { submitSale } from "@/lib/app-api";
import { currency, formatCurrencyInput, parseCurrencyInput, errorMessage, num } from "@/lib/format";

export const PAYMENT_METHODS = ["dinheiro", "pix", "transferencia", "fiado", "troca"] as const;

export const PAYMENT_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  transferencia: "Transferência",
  fiado: "Fiado",
  troca: "Troca",
};

export function SaleDialog({ trigger }: { trigger: ReactNode }) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [buyer, setBuyer] = useState("");
  const [payment, setPayment] = useState<string>("dinheiro");
  const [notes, setNotes] = useState("");
  const { data: products } = useProducts();
  const queryClient = useQueryClient();

  const activeProducts = (products ?? []).filter((p) => p.ativo);
  const selected = activeProducts.find((p) => p.id === productId);
  const parsedUnitPrice = parseCurrencyInput(unitPrice);
  const total = Number(quantity || 0) * parsedUnitPrice;
  const insufficient = !!selected && Number(quantity || 0) > Number(selected.estoque_atual);

  const handleSelectProduct = (id: string) => {
    setProductId(id);
    const prod = activeProducts.find((p) => p.id === id);
    if (prod && prod.preco_sugerido) {
      setUnitPrice(formatCurrencyInput(prod.preco_sugerido));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!hasPermission("create_sale")) {
        throw new Error("Você não possui permissão para lançar vendas.");
      }
      const qty = Number(quantity);
      const price = parseCurrencyInput(unitPrice);
      if (!productId) throw new Error("Selecione um produto válido.");
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("A quantidade deve ser um número maior que zero.");
      if (!Number.isFinite(price) || price < 0)
        throw new Error("Informe um valor unitário válido.");
      if (!buyer.trim()) throw new Error("Informe o nome do comprador.");
      await submitSale({
        data: {
          productId,
          quantity: qty,
          unitPrice: price,
          buyerName: buyer.trim(),
          paymentMethod: payment,
          notes: notes.trim() || "",
        },
      });
    },
    onSuccess: () => {
      toast.success("Venda registrada e saída de estoque gerada.");
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setOpen(false);
      setProductId("");
      setQuantity("");
      setUnitPrice("");
      setBuyer("");
      setNotes("");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova venda</DialogTitle>
          <DialogDescription>
            A saída de estoque é gerada automaticamente ao confirmar a venda.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select
              value={productId}
              onValueChange={handleSelectProduct}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <ProductThumbnail src={p.imagem_url} name={p.nome} size="xs" />
                      <span>{p.nome} · {num(p.estoque_atual)} {p.unidade}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selected && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-primary/20 bg-primary/5 mt-1.5">
                <ProductThumbnail src={selected.imagem_url} name={selected.nome} size="sm" className="rounded-lg border" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{selected.nome}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Estoque disponível: {num(selected.estoque_atual)} {selected.unidade} · Sugerido: {currency(selected.preco_sugerido || 0)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sale-qtd">Quantidade</Label>
              <Input
                id="sale-qtd"
                type="number"
                min="1"
                placeholder="Qtd"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-price">Valor Unitário (R$)</Label>
              <Input
                id="sale-price"
                type="text"
                placeholder="R$ 0,00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(formatCurrencyInput(e.target.value))}
                className="font-mono text-sm font-bold text-emerald-400"
              />
            </div>
          </div>

          {insufficient ? (
            <p className="text-xs text-destructive">
              Estoque insuficiente: disponível {num(selected?.estoque_atual)} {selected?.unidade}.
            </p>
          ) : null}

          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
            Total: <span className="font-semibold text-accent">{currency(total)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-buyer">Comprador</Label>
            <Input
              id="sale-buyer"
              value={buyer}
              maxLength={80}
              onChange={(e) => setBuyer(e.target.value)}
              placeholder="Nome do comprador no jogo"
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-notes">Observação</Label>
            <Textarea
              id="sale-notes"
              value={notes}
              maxLength={280}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-gradient-brand text-primary-foreground hover:opacity-90"
            disabled={mutation.isPending || insufficient}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
