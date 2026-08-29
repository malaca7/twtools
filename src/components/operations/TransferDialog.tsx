import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft, Loader2, Box, Package } from "lucide-react";
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
import { useBaus, useProducts, useMovements } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { ProductThumbnail } from "@/components/ui-kit";
import { submitChestTransfer } from "@/lib/app-api";
import { errorMessage, num } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TransferDialog({
  trigger,
}: {
  trigger?: ReactNode;
}) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useMovements();

  const [open, setOpen] = useState(false);
  const [fromBauId, setFromBauId] = useState("");
  const [toBauId, setToBauId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");

  const activeProducts = products.filter((p) => p.ativo);
  const selectedProd = activeProducts.find((p) => p.id === productId);

  // Compute stock of selected item in the selected Source Chest
  const getProductStockInChest = (pId: string, bId: string): number => {
    if (!pId || !bId) return 0;
    const prod = products.find((p) => p.id === pId);
    const globalStock = prod ? Number(prod.estoque_atual || 0) : 0;
    if (globalStock <= 0) return 0;

    if (baus.length <= 1) {
      return globalStock;
    }

    const chestMovements = movements.filter(
      (m) => m.product_id === pId && m.bau_id === bId
    );
    if (chestMovements.length === 0) return 0;

    const sum = chestMovements.reduce(
      (acc, m) => acc + (m.type === "entrada" ? Number(m.quantity) : -Number(m.quantity)),
      0
    );
    return Math.max(0, sum);
  };

  const currentStock = selectedProd && fromBauId ? getProductStockInChest(selectedProd.id, fromBauId) : 0;

  const handleSetMax = () => {
    if (!fromBauId) {
      toast.error("Selecione o baú de origem primeiro.");
      return;
    }
    if (!selectedProd) {
      toast.error("Selecione o produto primeiro.");
      return;
    }
    if (currentStock <= 0) {
      toast.error(`Sem saldo disponível de ${selectedProd.nome} no baú de origem.`);
      setQuantity(1);
    } else {
      setQuantity(currentStock);
    }
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!hasPermission("create_movement")) {
        throw new Error("Você não possui permissão para realizar transferências entre baús.");
      }
      if (!fromBauId) throw new Error("Selecione o baú de origem.");
      if (!toBauId) throw new Error("Selecione o baú de destino.");
      if (fromBauId === toBauId) throw new Error("O baú de destino deve ser diferente do baú de origem.");
      if (!productId) throw new Error("Selecione o produto que deseja transferir.");
      if (!quantity || quantity <= 0) throw new Error("A quantidade deve ser maior que zero.");
      if (quantity > currentStock) {
        throw new Error(`Saldo insuficiente no baú de origem. Disponível: ${num(currentStock)}`);
      }

      await submitChestTransfer({
        fromBauId,
        toBauId,
        productId,
        quantity,
        reason,
      });
    },
    onSuccess: () => {
      const fromName = baus.find((b) => b.id === fromBauId)?.nome || "Baú";
      const toName = baus.find((b) => b.id === toBauId)?.nome || "Baú";
      toast.success(`Transferência realizada! ${num(quantity)}x ${selectedProd?.nome || "Item"} movidos do ${fromName} para o ${toName}.`);
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setOpen(false);
      setProductId("");
      setQuantity(1);
      setReason("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const quickValues = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs border-sky-500/40 text-sky-400 hover:bg-sky-500/10 font-bold rounded-xl"
          >
            <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Transferir entre Baús
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sky-400">
            <ArrowRightLeft className="h-5 w-5" /> Transferência Entre Baús
          </DialogTitle>
          <DialogDescription className="text-xs">
            Mova itens diretamente de um baú de origem para um baú de destino.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* FROM AND TO CHEST SELECTION */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Baú de Origem <span className="text-rose-500">*</span>
              </Label>
              <Select value={fromBauId} onValueChange={(v) => { setFromBauId(v); if (toBauId === v) setToBauId(""); }}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione origem..." />
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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Baú de Destino <span className="text-rose-500">*</span>
              </Label>
              <Select value={toBauId} onValueChange={setToBauId}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione destino..." />
                </SelectTrigger>
                <SelectContent>
                  {baus
                    .filter((b) => b.id !== fromBauId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-1.5">
                          <Box className="h-3.5 w-3.5 text-emerald-400" /> {b.nome}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PRODUCT SELECTION */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Produto a Transferir <span className="text-rose-500">*</span>
            </Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => {
                  const pStockInFrom = fromBauId ? getProductStockInChest(p.id, fromBauId) : 0;
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2 w-full">
                        <ProductThumbnail src={p.imagem_url} name={p.nome} size="xs" />
                        <span>{p.nome}</span>
                        {fromBauId && (
                          <span className="text-[10px] font-mono opacity-70 ml-auto">
                            (Disp: {num(pStockInFrom)} {p.unidade})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* STOCK BADGE */}
          {selectedProd && fromBauId && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/50 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ProductThumbnail src={selectedProd.imagem_url} name={selectedProd.nome} size="xs" />
                <span>Saldo na Origem:</span>
              </div>
              <span className={cn("font-bold font-mono", currentStock > 0 ? "text-emerald-400" : "text-rose-400")}>
                {num(currentStock)} {selectedProd.unidade}
              </span>
            </div>
          )}

          {/* QUANTITY INPUT & QUICK BUTTONS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Quantidade a Transferir <span className="text-rose-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetMax}
                className="h-6 text-[10px] px-2 font-bold border-sky-500/40 text-sky-400 hover:bg-sky-500/10 rounded-lg"
              >
                Transferir Máximo
              </Button>
            </div>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-10 font-mono font-bold text-center text-sm rounded-xl"
            />

            {/* QUICK BUTTONS */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickValues.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(q)}
                  className="h-7 text-xs font-mono font-bold px-2 rounded-lg"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          {/* REASON / OBSERVATION */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Observação (Opcional)
            </Label>
            <Textarea
              placeholder="Ex: Remanejamento para ação, organização de estoque..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs rounded-xl resize-none h-16"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-9 text-xs rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => transferMutation.mutate()}
            disabled={transferMutation.isPending}
            className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
          >
            {transferMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
