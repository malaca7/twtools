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
import { submitSale } from "@/lib/app-api";
import { currency, errorMessage, num } from "@/lib/format";

export const PAYMENT_METHODS = ["dinheiro", "pix", "transferencia", "fiado", "troca"] as const;

export const PAYMENT_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  transferencia: "Transferência",
  fiado: "Fiado",
  troca: "Troca",
};

export function SaleDialog({ trigger }: { trigger: ReactNode }) {
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
  const total = Number(quantity || 0) * Number(unitPrice || 0);
  const insufficient = !!selected && Number(quantity || 0) > Number(selected.estoque_atual);

  const mutation = useMutation({
    mutationFn: async () => {
      const qty = Number(quantity);
      const price = Number(unitPrice);
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
              onValueChange={(value) => {
                setProductId(value);
                const p = activeProducts.find((x) => x.id === value);
                if (p && !unitPrice) setUnitPrice(String(p.preco_sugerido || ""));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} · {num(p.estoque_atual)} {p.unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sale-qtd">Quantidade</Label>
              <Input
                id="sale-qtd"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-price">Valor unitário</Label>
              <Input
                id="sale-price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
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
