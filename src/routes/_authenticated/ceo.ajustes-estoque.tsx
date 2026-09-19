import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sliders,
  Crown,
  Boxes,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Sparkles,
  History,
  Check,
  Search,
  Lock,
  Layers,
} from "lucide-react";
import { CeoGuard } from "@/guards/CeoGuard";
import { BauIcon } from "@/components/ui/bau-icon";
import { PageHeader, ProductThumbnail, NoAccess } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useBaus,
  useProducts,
  useMovements,
  useProductBaus,
  useDiscordStockConfig,
} from "@/hooks/useData";
import { num, formatDate } from "@/lib/format";
import { adjustStockDev } from "@/lib/app-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ceo/ajustes-estoque")({
  component: CeoAjustesEstoquePage,
});

export function CeoAjustesEstoquePage() {
  return (
    <CeoGuard>
      <CeoAjustesEstoqueContent />
    </CeoGuard>
  );
}

export function CeoAjustesEstoqueContent() {
  const { user, profile, hasPermission, isDevUser, isCeoUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: baus = [], isLoading: loadingBaus } = useBaus();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: productBaus = [] } = useProductBaus();
  const { data: movements = [] } = useMovements();
  const { data: config } = useDiscordStockConfig();

  // Permissões granulares do módulo
  const canView = isDevUser || isCeoUser || hasPermission("view_ceo_stock_adjustments") || hasPermission("manage_ceo_stock_adjustments");
  const canManageAll = isDevUser || hasPermission("manage_ceo_stock_adjustments");
  const canSetExact = canManageAll || hasPermission("ceo_adjust_stock_balance");
  const canAdd = canManageAll || hasPermission("ceo_stock_add");
  const canRemove = canManageAll || hasPermission("ceo_stock_remove");

  const [bauId, setBauId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"definir" | "entrada" | "saida">("definir");
  const [quantityInput, setQuantityInput] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");

  const activeBaus = useMemo(() => baus.filter((b) => b.ativo), [baus]);
  const activeProducts = useMemo(() => products.filter((p) => p.ativo), [products]);

  const selectedBau = activeBaus.find((b) => b.id === bauId);
  const selectedProduct = activeProducts.find((p) => p.id === productId);

  // Saldos correntes
  const currentBauBalance = useMemo(() => {
    if (!bauId || !productId) return 0;
    const pb = productBaus.find((item: any) => item.bau_id === bauId && item.product_id === productId);
    return pb ? Number(pb.quantidade) : 0;
  }, [bauId, productId, productBaus]);

  const currentGlobalBalance = selectedProduct ? Number(selectedProduct.estoque_atual || 0) : 0;

  const parsedQty = parseFloat(quantityInput);
  const validQty = !isNaN(parsedQty) && parsedQty >= 0 ? parsedQty : 0;

  // Cálculo projetado em tempo real
  const projectedBauBalance = useMemo(() => {
    if (adjustmentType === "definir") return validQty;
    if (adjustmentType === "entrada") return currentBauBalance + validQty;
    if (adjustmentType === "saida") return Math.max(0, currentBauBalance - validQty);
    return currentBauBalance;
  }, [adjustmentType, validQty, currentBauBalance]);

  const delta = projectedBauBalance - currentBauBalance;
  const projectedGlobalBalance = Math.max(0, currentGlobalBalance + delta);

  // Recentes ajustes feitos via painel
  const recentAdjustments = useMemo(() => {
    return movements
      .filter((m) => {
        const isAdj = m.origin === "painel_dev" || m.origin === "painel_ceo" || m.type === "ajuste" || (m.reason && m.reason.length > 0);
        if (!isAdj) return false;
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        const prod = products.find((p) => p.id === m.product_id);
        const chest = baus.find((b) => b.id === m.bau_id);
        const prodName = (prod?.nome || "").toLowerCase();
        const chestName = (chest?.nome || "").toLowerCase();
        const rsn = (m.reason || "").toLowerCase();
        return prodName.includes(q) || chestName.includes(q) || rsn.includes(q);
      })
      .slice(0, 10);
  }, [movements, products, baus, historySearch]);

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!bauId) throw new Error("Selecione o baú alvo.");
      if (!productId) throw new Error("Selecione o produto.");
      if (isNaN(parsedQty) || parsedQty < 0) throw new Error("Informe uma quantidade válida.");
      if (adjustmentType !== "definir" && parsedQty <= 0) {
        throw new Error("A quantidade de adição ou remoção deve ser maior que zero.");
      }
      if (!reason.trim() || reason.trim().length < 5) {
        throw new Error("O motivo do ajuste é obrigatório e deve ter pelo menos 5 caracteres.");
      }

      // Validação de permissão específica da operação
      if (adjustmentType === "definir" && !canSetExact) {
        throw new Error("Você não possui permissão para definir o saldo exato (recalibração).");
      }
      if (adjustmentType === "entrada" && !canAdd) {
        throw new Error("Você não possui permissão para adicionar saldo manual ao baú.");
      }
      if (adjustmentType === "saida" && !canRemove) {
        throw new Error("Você não possui permissão para remover saldo manual do baú.");
      }

      return await adjustStockDev({
        bauId,
        productId,
        adjustmentType,
        quantity: parsedQty,
        reason: `[Ajuste CEO] ${reason.trim()}`,
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Estoque de ${selectedProduct?.nome} ajustado com sucesso no baú ${selectedBau?.nome}! Novo saldo: ${num(res.resulting_balance)} ${selectedProduct?.unidade || "un"}.`,
        { icon: "👑" }
      );
      setConfirmModalOpen(false);
      setQuantityInput("");
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Falha ao realizar ajuste de estoque.");
    },
  });

  const canExecuteCurrentType = useMemo(() => {
    if (adjustmentType === "definir") return canSetExact;
    if (adjustmentType === "entrada") return canAdd;
    if (adjustmentType === "saida") return canRemove;
    return false;
  }, [adjustmentType, canSetExact, canAdd, canRemove]);

  if (!canView) {
    return <NoAccess />;
  }

  const autoBausCount = activeBaus.filter((b) => b.tipo_gestao !== "manual").length;
  const manualBausCount = activeBaus.filter((b) => b.tipo_gestao === "manual").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* HEADER DA PÁGINA COM ESTILO CEO DOURADO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Ajustes de Estoque & Recalibração de Baús"
          description="Terminal executivo da Diretoria CEO para auditoria, correção de inventário físico e ajustes manuais perpétuos de saldo."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-300 border-amber-500/30 gap-1.5 py-1 px-3 font-bold"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Diretoria CEO
          </Badge>
          <Badge
            variant="outline"
            className="bg-sky-500/10 text-sky-400 border-sky-500/30 gap-1.5 py-1 px-3"
          >
            <Boxes className="w-3.5 h-3.5" />
            {autoBausCount} Auto Discord • {manualBausCount} Manual
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FORMULÁRIO PRINCIPAL DE AJUSTE (COLUNA 1 E 2) */}
        <Card className="surface-card lg:col-span-2 border-amber-500/30 bg-gradient-to-b from-amber-500/[0.03] to-transparent shadow-md">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Lançar Ajuste Manual de Estoque
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajuste o saldo físico de depósitos e baús. O lançamento requer justificativa obrigatória e gera histórico auditado.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-xs py-1 self-start sm:self-auto font-mono"
              >
                👑 Auditado [Ajuste CEO]
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* SELEÇÃO DE BAÚ E PRODUTO */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Baú Alvo
                </Label>
                <Select value={bauId} onValueChange={setBauId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o baú..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBaus.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <BauIcon icon={b.icone} className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{b.nome}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] py-0 px-1.5 font-mono ml-1",
                              b.tipo_gestao === "manual"
                                ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                                : "border-sky-500/40 text-sky-400 bg-sky-500/10"
                            )}
                          >
                            {b.tipo_gestao === "manual" ? "✋ Manual" : "🤖 Discord"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBau && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {selectedBau.tipo_gestao === "manual"
                      ? "Baú manual: operado via lançamentos na plataforma."
                      : "Baú automático: sincronizado via mensagens do Discord."}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Item / Insumo
                </Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o produto..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {activeProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <ProductThumbnail src={p.imagem_url} alt={p.nome} className="w-5 h-5 rounded" />
                          <span>{p.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            (Total: {num(p.estoque_atual)} {p.unidade})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <p className="text-[11px] text-muted-foreground">
                    Unidade: <strong className="text-foreground">{selectedProduct.unidade}</strong> • Saldo Global:{" "}
                    <strong className="text-foreground">{num(selectedProduct.estoque_atual)}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* OPERAÇÃO E QUANTIDADE */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  3. Operação de Ajuste
                </Label>
                <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="definir" disabled={!canSetExact}>
                      <div className="flex items-center gap-2">
                        <Equal className="w-4 h-4 text-sky-400" />
                        <span>Definir Saldo Específico (Recalibrar)</span>
                        {!canSetExact && <Lock className="w-3 h-3 text-muted-foreground ml-1" />}
                      </div>
                    </SelectItem>
                    <SelectItem value="entrada" disabled={!canAdd}>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <span>Adicionar Quantidade (+)</span>
                        {!canAdd && <Lock className="w-3 h-3 text-muted-foreground ml-1" />}
                      </div>
                    </SelectItem>
                    <SelectItem value="saida" disabled={!canRemove}>
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-rose-400" />
                        <span>Remover Quantidade (-)</span>
                        {!canRemove && <Lock className="w-3 h-3 text-muted-foreground ml-1" />}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!canExecuteCurrentType && (
                  <p className="text-[11px] text-destructive font-medium">
                    Você não possui a permissão necessária para esta operação de ajuste.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  4. Quantidade
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  className="h-11 font-mono text-base font-bold"
                  placeholder="Ex: 50"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                />
              </div>
            </div>

            {/* DEMONSTRATIVO / PRÉVIA EM TEMPO REAL */}
            {selectedProduct && selectedBau && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-amber-500/20 pb-2">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Demonstrativo Pré-Ajuste
                  </span>
                  <span className="font-mono text-[11px] text-foreground font-semibold">
                    {selectedBau.nome}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-background/60 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Saldo no Baú Antes
                    </span>
                    <span className="text-base font-black font-mono text-foreground">
                      {num(currentBauBalance)} {selectedProduct.unidade}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background/60 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Variação
                    </span>
                    <span
                      className={cn(
                        "text-base font-black font-mono",
                        delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-sky-400"
                      )}
                    >
                      {delta > 0 ? `+${num(delta)}` : delta < 0 ? num(delta) : "0"} {selectedProduct.unidade}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">
                      Novo Saldo no Baú
                    </span>
                    <span className="text-base font-black font-mono text-amber-300">
                      {num(projectedBauBalance)} {selectedProduct.unidade}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background/60 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Novo Total Global
                    </span>
                    <span className="text-base font-black font-mono text-foreground">
                      {num(projectedGlobalBalance)} {selectedProduct.unidade}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* JUSTIFICATIVA OBRIGATÓRIA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  5. Motivo Obrigatório do Ajuste (Auditoria)
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {reason.trim().length} / 5 caracs mín.
                </span>
              </div>
              <Textarea
                placeholder="Descreva a justificativa para este ajuste manual de estoque (ex: Contagem física de inventário, estorno de duplicidade)..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none text-xs"
              />
            </div>

            {/* BOTÃO DE REVISÃO E APLICAÇÃO */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              disabled={
                !canExecuteCurrentType ||
                !bauId ||
                !productId ||
                !quantityInput ||
                reason.trim().length < 5
              }
              onClick={() => setConfirmModalOpen(true)}
            >
              <Crown className="w-5 h-5" />
              Revisar e Aplicar Ajuste de Estoque
            </Button>
          </CardContent>
        </Card>

        {/* PAINEL LATERAL: POLÍTICA E HISTÓRICO RECENTE */}
        <div className="space-y-6">
          {/* POLÍTICA DE AUDITORIA */}
          <Card className="surface-card border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Auditoria & Integridade CEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                • Os ajustes executados pelo <strong>Painel CEO</strong> são gravados permanentemente no livro razão de movimentações com a tag de auditoria <strong>[Ajuste CEO]</strong>.
              </p>
              <p>
                • Em baús automatizados via Discord, realize ajustes manuais apenas para recalibração de contagens reais ou correções pontuais de divergências.
              </p>
              <p>
                • Todas as alterações recalculam automaticamente o saldo patrimonial físico e a soma global do grupo.
              </p>
            </CardContent>
          </Card>

          {/* HISTÓRICO RECENTE DE AJUSTES */}
          <Card className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  Últimos Ajustes Realizados
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono py-0">
                  {recentAdjustments.length}
                </Badge>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filtrar histórico..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background/50"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentAdjustments.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Nenhum ajuste manual registrado recentemente.
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[360px] overflow-y-auto">
                  {recentAdjustments.map((m) => {
                    const prod = products.find((p) => p.id === m.product_id);
                    const chest = baus.find((b) => b.id === m.bau_id);
                    return (
                      <div key={m.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
                        <div className="space-y-1 min-w-0">
                          <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                            <span>{prod?.nome || "Item"}</span>
                            {m.origin === "painel_ceo" && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] py-0 px-1 font-bold">
                                CEO
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <span className="font-medium text-foreground/80">{chest?.nome || "Baú"}</span>
                            <span>•</span>
                            <span>{formatDate(m.created_at)}</span>
                          </div>
                          {m.reason && (
                            <div className="text-[10px] text-amber-400/90 italic truncate max-w-[200px]">
                              {m.reason}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-xs shrink-0",
                            m.type === "entrada"
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                          )}
                        >
                          {m.type === "entrada" ? `+${num(m.quantity)}` : `-${num(m.quantity)}`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO EXECUTIVA ANTES DO AJUSTE */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md surface-card border-amber-500/40">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Confirmar Ajuste de Estoque CEO
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Revise atentamente os dados antes de gravar a alteração no banco de dados.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Diretor Responsável:</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  {profile?.nickname || profile?.nome || user?.email || "CEO"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Baú Alvo:</span>
                <span className="font-bold text-foreground">{selectedBau?.nome}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Item / Insumo:</span>
                <span className="font-bold text-foreground">{selectedProduct?.nome}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Operação Solicitada:</span>
                <Badge variant="outline" className="text-[11px] uppercase border-amber-500/40 text-amber-300 bg-amber-500/10">
                  {adjustmentType === "definir"
                    ? "Definir Saldo Exato"
                    : adjustmentType === "entrada"
                    ? "Adicionar (+)"
                    : "Remover (-)"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Saldo Anterior no Baú:</span>
                <span className="font-mono font-bold text-muted-foreground">
                  {num(currentBauBalance)} {selectedProduct?.unidade}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-500/20 pt-2">
                <span className="text-foreground font-bold">Novo Saldo Resultante:</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {num(projectedBauBalance)} {selectedProduct?.unidade}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Motivo Auditado:
              </span>
              <p className="text-foreground italic whitespace-pre-wrap">{reason}</p>
            </div>

            <div className="text-[11px] text-amber-300 flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Esta ação grava imediatamente um registro auditado perpétuo com a tag <strong>[Ajuste CEO]</strong> e atualiza o saldo global do grupo.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold gap-2 cursor-pointer shadow-md"
              disabled={adjustMutation.isPending}
              onClick={() => adjustMutation.mutate()}
            >
              {adjustMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar e Gravar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
