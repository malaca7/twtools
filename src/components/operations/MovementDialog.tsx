import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Box } from "lucide-react";
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
import { useProducts, useBaus } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { submitMovement } from "@/lib/app-api";
import { errorMessage } from "@/lib/format";
import { ProductThumbnail } from "@/components/ui-kit";

export function MovementDialog({
  trigger,
  defaultType = "entrada",
}: {
  trigger: ReactNode;
  defaultType?: "entrada" | "saida";
}) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"entrada" | "saida">(defaultType);
  const [bauId, setBauId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const { data: products } = useProducts();
  const { data: baus = [] } = useBaus();
  const queryClient = useQueryClient();

  const activeProducts = (products ?? []).filter((p) => p.ativo);
  const selectedProd = activeProducts.find((p) => p.id === productId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!hasPermission("create_movement")) {
        throw new Error("Você não possui permissão para lançar movimentações.");
      }
      if (!bauId) throw new Error("Selecione obrigatoriamente um baú para lançar a movimentação.");
      if (!productId) throw new Error("Selecione um produto válido.");
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("A quantidade deve ser um número maior que zero.");

      await submitMovement({
        data: {
          productId,
          bauId,
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
        if (next) {
          setType(defaultType);
          if (baus.length > 0 && !bauId) setBauId(baus[0]?.id || "");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>
            O saldo do produto é atualizado automaticamente no baú selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as "entrada" | "saida")}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (+)</SelectItem>
                  <SelectItem value="saida">Saída (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Baú Operacional <span className="text-rose-500">*</span></Label>
              <Select value={bauId} onValueChange={setBauId}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione o baú..." />
                </SelectTrigger>
                <SelectContent>
                  {baus.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-1.5">
                        <Box className="h-3.5 w-3.5 text-primary" /> {b.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">Produto <span className="text-rose-500">*</span></Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <ProductThumbnail src={p.imagem_url} name={p.nome} size="xs" />
                      <span>{p.nome} ({p.unidade})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum produto ativo cadastrado ainda.
              </p>
            ) : null}

            {selectedProd && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-primary/20 bg-primary/5 mt-1.5">
                <ProductThumbnail src={selectedProd.imagem_url} name={selectedProd.nome} size="sm" className="rounded-lg border" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{selectedProd.nome}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Unidade: {selectedProd.unidade} | Mínimo: {selectedProd.estoque_minimo}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-qtd" className="text-xs font-bold">Quantidade <span className="text-rose-500">*</span></Label>
            <Input
              id="mov-qtd"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-reason" className="text-xs font-bold">Motivo / observação</Label>
            <Textarea
              id="mov-reason"
              value={reason}
              maxLength={280}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: reposição da run, repasse para membro..."
              className="text-xs rounded-xl resize-none h-16"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
            Cancelar
          </Button>
          <Button
            className="h-9 text-xs bg-gradient-brand text-primary-foreground font-bold hover:opacity-90 rounded-xl"
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
