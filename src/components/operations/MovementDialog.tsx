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
import { submitMovement } from "@/lib/app-api";
import { errorMessage, num } from "@/lib/format";

export function MovementDialog({
  trigger,
  defaultType = "entrada",
}: {
  trigger: ReactNode;
  defaultType?: "entrada" | "saida";
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"entrada" | "saida">(defaultType);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const { data: products } = useProducts();
  const queryClient = useQueryClient();

  const activeProducts = (products ?? []).filter((p) => p.ativo);
  const selected = activeProducts.find((p) => p.id === productId);

  const mutation = useMutation({
    mutationFn: async () => {
      const qty = Number(quantity);
      if (!productId) throw new Error("Selecione um produto válido.");
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("A quantidade deve ser um número maior que zero.");
      await submitMovement({
        data: {
          productId,
          type,
          quantity: qty,
          reason: reason.trim() || "Sem observação",
        },
      });
    },
    onSuccess: () => {
      toast.success(type === "entrada" ? "Entrada registrada." : "Saída registrada.");
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setOpen(false);
      setProductId("");
      setQuantity("");
      setReason("");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setType(defaultType);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>
            O saldo do produto é atualizado automaticamente e o histórico fica registrado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "entrada" | "saida")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
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
            {activeProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum produto ativo cadastrado ainda.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-qtd">Quantidade</Label>
            <Input
              id="mov-qtd"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
            {selected && type === "saida" && Number(quantity) > Number(selected.estoque_atual) ? (
              <p className="text-xs text-destructive">
                Saldo disponível é {num(selected.estoque_atual)} {selected.unidade}. Reduza a
                quantidade.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-reason">Motivo / observação</Label>
            <Textarea
              id="mov-reason"
              value={reason}
              maxLength={280}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: reposição da run, repasse para membro..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-gradient-brand text-primary-foreground hover:opacity-90"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
