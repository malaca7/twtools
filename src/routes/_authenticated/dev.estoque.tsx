import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Boxes,
  Bot,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Copy,
  ExternalLink,
  Search,
  Terminal,
  Eye,
  Sparkles,
  Send,
  HelpCircle,
  Check,
  Trash2,
  Plus,
  Sliders,
  Radio,
  FileCode,
  Layers,
  History,
  Info,
  Save,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { BauIcon } from "@/components/ui/bau-icon";
import { PageHeader, ProductThumbnail, EmptyState } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  useDiscordStockLogs,
} from "@/hooks/useData";
import { num, dateTime, formatDate } from "@/lib/format";
import {
  adjustStockDev,
  updateDiscordStockConfig,
  updateBau,
} from "@/lib/app-api";
import { useUrlTab } from "@/hooks/useUrlTab";
import type { DiscordStockLog, DiscordStockConfig } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dev/estoque")({
  component: DevEstoquePage,
});

export type DevEstoqueTabType = "discord" | "logs" | "ajustes";
export const VALID_DEV_ESTOQUE_TABS = ["discord", "logs", "ajustes"] as const;

export function DevEstoquePageContent({ initialTab }: { initialTab?: string } = {}) {
  const { hasPermission } = useAuth();
  const { data: baus = [] } = useBaus();
  const { data: config } = useDiscordStockConfig();

  const defaultInitialTab: DevEstoqueTabType =
    initialTab && (VALID_DEV_ESTOQUE_TABS as readonly string[]).includes(initialTab)
      ? (initialTab as DevEstoqueTabType)
      : "discord";

  const [activeTab, setActiveTab] = useUrlTab<DevEstoqueTabType>(defaultInitialTab, {
    allowedTabs: VALID_DEV_ESTOQUE_TABS,
    usePath: true,
    paramName: "tab",
  });

  const autoBausCount = baus.filter((b) => b.ativo && b.tipo_gestao !== "manual").length;
  const manualBausCount = baus.filter((b) => b.ativo && b.tipo_gestao === "manual").length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Gestão Técnica de Estoque & Integração Discord"
          description="Controle avançado de sincronização automática de baús via logs do Discord, regras e terminal de ajustes manuais auditados."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-3">
            <Bot className="w-3.5 h-3.5" />
            {config?.is_active ? "Bot Discord Ativo" : "Bot em Pausa"}
          </Badge>
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 gap-1.5 py-1 px-3">
            <Boxes className="w-3.5 h-3.5" />
            {autoBausCount} Baús Auto • {manualBausCount} Manual
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-secondary/60 p-1 border border-border/60">
          <TabsTrigger value="discord" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bot className="w-4 h-4" />
            Integração Discord & Regras
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <History className="w-4 h-4" />
            Logs Técnicas & Auditoria
          </TabsTrigger>
          <TabsTrigger value="ajustes" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Sliders className="w-4 h-4" />
            Ajustes de Estoque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discord" className="space-y-6">
          <DiscordIntegrationTab />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <DiscordLogsTab />
        </TabsContent>

        <TabsContent value="ajustes" className="space-y-6">
          <StockAdjustmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DevEstoquePage() {
  return (
    <DeveloperGuard>
      <DevEstoquePageContent />
    </DeveloperGuard>
  );
}

// ============================================================================
// TAB 1: AJUSTES DE ESTOQUE NO PAINEL DEV (EXCLUSIVO)
// ============================================================================
function StockAdjustmentsTab() {
  const { user, profile, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: productBaus = [] } = useProductBaus();
  const { data: movements = [] } = useMovements();

  const [bauId, setBauId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"definir" | "entrada" | "saida">("definir");
  const [quantityInput, setQuantityInput] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const activeBaus = baus.filter((b) => b.ativo);
  const activeProducts = products.filter((p) => p.ativo);

  const selectedBau = activeBaus.find((b) => b.id === bauId);
  const selectedProduct = activeProducts.find((p) => p.id === productId);

  // Balances
  const currentBauBalance = useMemo(() => {
    if (!bauId || !productId) return 0;
    const pb = productBaus.find((item: any) => item.bau_id === bauId && item.product_id === productId);
    return pb ? Number(pb.quantidade) : 0;
  }, [bauId, productId, productBaus]);

  const currentGlobalBalance = selectedProduct ? Number(selectedProduct.estoque_atual || 0) : 0;

  const parsedQty = parseFloat(quantityInput);
  const validQty = !isNaN(parsedQty) && parsedQty >= 0 ? parsedQty : 0;

  // Calculo projetado
  const projectedBauBalance = useMemo(() => {
    if (adjustmentType === "definir") return validQty;
    if (adjustmentType === "entrada") return currentBauBalance + validQty;
    if (adjustmentType === "saida") return Math.max(0, currentBauBalance - validQty);
    return currentBauBalance;
  }, [adjustmentType, validQty, currentBauBalance]);

  const delta = projectedBauBalance - currentBauBalance;
  const projectedGlobalBalance = Math.max(0, currentGlobalBalance + delta);

  // Recentes ajustes feitos pelo painel dev
  const devMovements = movements
    .filter((m) => m.origin === "painel_dev")
    .slice(0, 5);

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

      return await adjustStockDev({
        bauId,
        productId,
        adjustmentType,
        quantity: parsedQty,
        reason: reason.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Estoque de ${selectedProduct?.nome} ajustado com sucesso no baú ${selectedBau?.nome}! Novo saldo: ${num(res.resulting_balance)} ${selectedProduct?.unidade || "un"}.`,
        { icon: "✅" }
      );
      setConfirmModalOpen(false);
      setQuantityInput("");
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao realizar ajuste de estoque.");
    },
  });

  const canAdjust = hasPermission("estoque.ajustar") || hasPermission("estoque.corrigir") || hasPermission("estoque.adicionar") || hasPermission("estoque.remover");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="surface-card lg:col-span-2 border-border/80 shadow-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                Lançar Ajuste Manual de Inventário
              </CardTitle>
              <CardDescription>
                Esta é a única via autorizada de alteração manual para depósitos. O lançamento exige motivo e confirmação com registro perpétuo de auditoria.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10 text-xs py-1">
              Auditado [Ajuste Dev]
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Baú Alvo</Label>
              <Select value={bauId} onValueChange={setBauId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o baú..." />
                </SelectTrigger>
                <SelectContent>
                  {activeBaus.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <div className="flex items-center gap-2">
                        <span>{b.nome}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 px-1.5 font-mono",
                            b.tipo_gestao === "manual"
                              ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
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
                <p className="text-[11px] text-muted-foreground">
                  {selectedBau.tipo_gestao === "manual"
                    ? "Este baú opera em modo manual pela plataforma."
                    : "Este baú opera sincronizado automaticamente com as logs do Discord."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Item / Produto</Label>
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
                  Unidade: <strong className="text-foreground">{selectedProduct.unidade}</strong> • Estoque global total:{" "}
                  <strong className="text-foreground">{num(selectedProduct.estoque_atual)}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3. Operação de Ajuste</Label>
              <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="definir">
                    <div className="flex items-center gap-2">
                      <Equal className="w-4 h-4 text-sky-400" />
                      <span>Definir Saldo Específico (Recalibrar)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      <span>Adicionar Quantidade (+)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="saida">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                      <span>Remover Quantidade (-)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">4. Quantidade</Label>
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

          {/* SIMULADOR / PREVIEW DE SALDOS EM TEMPO REAL */}
          {selectedProduct && selectedBau && (
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Demonstrativo Pré-Ajuste
                </span>
                <span className="font-mono text-[11px]">{selectedBau.nome}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Saldo no Baú Antes</span>
                  <span className="text-base font-black font-mono text-foreground">
                    {num(currentBauBalance)} {selectedProduct.unidade}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Variação</span>
                  <span
                    className={cn(
                      "text-base font-black font-mono",
                      delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-sky-400"
                    )}
                  >
                    {delta > 0 ? `+${num(delta)}` : delta < 0 ? num(delta) : "0"} {selectedProduct.unidade}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="text-[10px] uppercase font-bold text-primary block">Novo Saldo Baú</span>
                  <span className="text-base font-black font-mono text-primary">
                    {num(projectedBauBalance)} {selectedProduct.unidade}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Novo Total Global</span>
                  <span className="text-base font-black font-mono text-foreground">
                    {num(projectedGlobalBalance)} {selectedProduct.unidade}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                5. Motivo Obrigatório do Ajuste (Auditoria)
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {reason.trim().length} / 5 caracs mín.
              </span>
            </div>
            <Textarea
              placeholder="Descreva detalhadamente a justificativa para este ajuste manual de estoque..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
            />
          </div>

          <Button
            size="lg"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 shadow-lg shadow-rose-600/20"
            disabled={!canAdjust || !bauId || !productId || !quantityInput || reason.trim().length < 5}
            onClick={() => setConfirmModalOpen(true)}
          >
            <ShieldAlert className="w-5 h-5" />
            Revisar e Aplicar Ajuste de Estoque
          </Button>
        </CardContent>
      </Card>

      {/* PAINEL LATERAL DE AUDITORIA & ORIENTAÇÕES */}
      <div className="space-y-6">
        <Card className="surface-card border-rose-500/30 bg-rose-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              Política de Integridade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              • Em baús configurados como <strong>100% Automáticos</strong>, todas as movimentações normais devem ocorrer estritamente através das logs do Discord.
            </p>
            <p>
              • Os ajustes manuais através desta tela devem ser utilizados unicamente para <strong>correções de inventário físico</strong>, inventários periódicos ou estorno de irregularidades.
            </p>
            <p>
              • O sistema recalcula automaticamente a soma global em tempo real e bloqueia concorrência através de travas transacionais no banco de dados.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Últimos Ajustes Dev Realizados
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico recente dos ajustes executados por administradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {devMovements.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Nenhum ajuste manual registrado recentemente.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {devMovements.map((m) => {
                  const prod = products.find((p) => p.id === m.product_id);
                  const chest = baus.find((b) => b.id === m.bau_id);
                  return (
                    <div key={m.id} className="p-3 text-xs flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {prod?.nome || "Item"}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span>{chest?.nome || "Baú"}</span>
                          <span>•</span>
                          <span>{formatDate(m.created_at)}</span>
                        </div>
                        {m.reason && (
                          <div className="text-[10px] text-rose-400/90 italic truncate max-w-[200px]">
                            {m.reason}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-xs",
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

      {/* MODAL DE CONFIRMAÇÃO OBRIGATÓRIA ANTES DO AJUSTE */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md surface-card border-rose-500/40">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Confirmar Ajuste Manual de Estoque
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Revise atentamente os dados antes de gravar a alteração no banco de dados.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Administrador Responsável:</span>
                <span className="font-bold text-foreground">
                  {profile?.nickname || profile?.nome || user?.email || "Dev"}
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
                <Badge variant="outline" className="text-[11px] uppercase">
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
              <div className="flex items-center justify-between border-t border-rose-500/20 pt-2">
                <span className="text-foreground font-bold">Novo Saldo Resultante:</span>
                <span className="font-mono font-black text-rose-400 text-sm">
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

            <div className="text-[11px] text-amber-400 flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Esta ação grava imediatamente um registro auditado não-removível com a tag <strong>[Ajuste Dev]</strong> e atualiza o saldo global da facção.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2"
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

// ============================================================================
// TAB 2: INTEGRAÇÃO COM DISCORD & CONFIGURAÇÃO
// ============================================================================
function DiscordIntegrationTab() {
  const queryClient = useQueryClient();
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: config, isLoading } = useDiscordStockConfig();

  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultBauId, setDefaultBauId] = useState("");
  const [itemMappings, setItemMappings] = useState<Record<string, string>>({});
  const [bauMappings, setBauMappings] = useState<Record<string, string>>({});

  type BauFormState = {
    tipo_gestao: "automatico" | "manual";
    discord_channel_id: string;
    discord_guild_id: string;
    is_saving?: boolean;
  };
  const [bauConfigs, setBauConfigs] = useState<Record<string, BauFormState>>({});
  const [isSavingAllBaus, setIsSavingAllBaus] = useState(false);
  const [isSavingItemMappings, setIsSavingItemMappings] = useState(false);
  const [isSavingBauMappings, setIsSavingBauMappings] = useState(false);

  // Novo mapping state
  const [newAliasKey, setNewAliasKey] = useState("");
  const [newAliasTargetProduct, setNewAliasTargetProduct] = useState("");

  // Simulador de logs state (resolvido por canal exclusivo do baú)
  const [selectedSimBauId, setSelectedSimBauId] = useState("");
  const [testLogText, setTestLogText] = useState(
    "Andrew Delucca Ferreira • ID 274\n📦 Baú\n\n📊 Saldo líquido\nMetanfetamina -72\nCocaína -126\n\n🧾 Detalhes da movimentação\nMetanfetamina\n↳ -72 removidos\nCocaína\n↳ -126 removidos\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 19:21"
  );
  const [simulatedResult, setSimulatedResult] = useState<any>(null);

  // Define baú padrão para o simulador
  useEffect(() => {
    if (baus.length > 0 && !selectedSimBauId) {
      const firstAuto = baus.find((b) => b.ativo && b.tipo_gestao !== "manual");
      setSelectedSimBauId(firstAuto ? firstAuto.id : baus[0].id);
    }
  }, [baus, selectedSimBauId]);

  // Sincroniza dados da configuração global
  useEffect(() => {
    if (config) {
      setGuildId((prev) => (prev ? prev : config.guild_id || ""));
      setChannelId((prev) => (prev ? prev : config.channel_id || ""));
      setIsActive(config.is_active ?? true);
      setAllowNegativeStock(config.allow_negative_stock ?? false);
      setDefaultBauId((prev) => (prev ? prev : config.default_bau_id || ""));
      setItemMappings(config.item_mappings || {});
      setBauMappings(config.bau_mappings || {});
    }
  }, [config]);

  // Sincroniza dados individuais dos baús
  useEffect(() => {
    if (baus.length > 0) {
      setBauConfigs((prev) => {
        const next = { ...prev };
        for (const b of baus) {
          const existing = next[b.id];
          const cfgBau = config?.bau_channels?.[b.id];
          next[b.id] = {
            tipo_gestao: existing?.tipo_gestao ?? b.tipo_gestao ?? cfgBau?.tipo_gestao ?? "automatico",
            discord_channel_id:
              existing?.discord_channel_id !== undefined
                ? existing.discord_channel_id
                : (b.discord_channel_id ?? cfgBau?.channel_id ?? ""),
            discord_guild_id:
              existing?.discord_guild_id !== undefined
                ? existing.discord_guild_id
                : (b.discord_guild_id ?? cfgBau?.guild_id ?? ""),
            is_saving: false,
          };
        }
        return next;
      });
    }
  }, [baus, config]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      return await updateDiscordStockConfig({
        guild_id: guildId.trim() || null,
        channel_id: channelId.trim() || null,
        is_active: isActive,
        allow_negative_stock: allowNegativeStock,
        default_bau_id: defaultBauId || null,
        item_mappings: itemMappings,
        bau_mappings: bauMappings,
      });
    },
    onSuccess: () => {
      toast.success("Configuração de integração do Discord salva com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar configuração.");
    },
  });

  const handleAddItemMapping = async () => {
    if (!newAliasKey.trim() || !newAliasTargetProduct) {
      toast.error("Informe o nome do item no Discord e selecione o produto correspondente.");
      return;
    }
    const cleanKey = newAliasKey.trim().toLowerCase();
    const updated = {
      ...itemMappings,
      [cleanKey]: newAliasTargetProduct,
    };
    setItemMappings(updated);
    setNewAliasKey("");
    setNewAliasTargetProduct("");

    try {
      await updateDiscordStockConfig({ item_mappings: updated });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success(`Mapeamento "${cleanKey}" associado a "${newAliasTargetProduct}" salvo!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar mapeamento no servidor.");
    }
  };

  const handleRemoveItemMapping = async (key: string) => {
    const updated = { ...itemMappings };
    delete updated[key];
    setItemMappings(updated);

    try {
      await updateDiscordStockConfig({ item_mappings: updated });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success(`Mapeamento "${key}" removido com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover mapeamento.");
    }
  };

  const handleSaveAllItemMappings = async () => {
    setIsSavingItemMappings(true);
    try {
      await updateDiscordStockConfig({ item_mappings: itemMappings });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success("Todos os mapeamentos de itens foram salvos!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar mapeamentos de itens.");
    } finally {
      setIsSavingItemMappings(false);
    }
  };

  const handleAddBauMapping = async () => {
    if (!newBauAliasKey.trim() || !newBauAliasTarget) {
      toast.error("Informe o texto do baú e selecione o baú correspondente.");
      return;
    }
    const cleanKey = newBauAliasKey.trim().toLowerCase();
    const updated = {
      ...bauMappings,
      [cleanKey]: newBauAliasTarget,
    };
    setBauMappings(updated);
    setNewBauAliasKey("");
    setNewBauAliasTarget("");

    try {
      await updateDiscordStockConfig({ bau_mappings: updated });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success(`Alias de baú "${cleanKey}" associado a "${newBauAliasTarget}" salvo!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar alias de baú no servidor.");
    }
  };

  const handleRemoveBauMapping = async (key: string) => {
    const updated = { ...bauMappings };
    delete updated[key];
    setBauMappings(updated);

    try {
      await updateDiscordStockConfig({ bau_mappings: updated });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success(`Alias "${key}" removido com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover alias.");
    }
  };

  const handleSaveAllBauMappings = async () => {
    setIsSavingBauMappings(true);
    try {
      await updateDiscordStockConfig({ bau_mappings: bauMappings });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success("Todos os aliases de baús foram salvos!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar aliases de baús.");
    } finally {
      setIsSavingBauMappings(false);
    }
  };

  const handleSaveSingleBau = async (bauId: string) => {
    const current = bauConfigs[bauId];
    if (!current) return;

    setBauConfigs((prev) => ({
      ...prev,
      [bauId]: { ...prev[bauId], is_saving: true },
    }));

    try {
      const cleanChannelId = current.discord_channel_id?.trim() || null;
      const cleanGuildId = current.discord_guild_id?.trim() || guildId?.trim() || null;

      await updateBau({
        id: bauId,
        tipo_gestao: current.tipo_gestao,
        discord_channel_id: cleanChannelId,
        discord_guild_id: cleanGuildId,
      });

      const updatedBauChannels = {
        ...(config?.bau_channels || {}),
        [bauId]: {
          bau_id: bauId,
          channel_id: cleanChannelId || "",
          guild_id: cleanGuildId || "",
          tipo_gestao: current.tipo_gestao,
          is_active: baus.find((b) => b.id === bauId)?.ativo ?? true,
        },
      };

      await updateDiscordStockConfig({
        bau_channels: updatedBauChannels,
      });

      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });

      const targetBau = baus.find((b) => b.id === bauId);
      toast.success(`Configuração do baú "${targetBau?.nome || bauId}" salva com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações do baú.");
    } finally {
      setBauConfigs((prev) => ({
        ...prev,
        [bauId]: { ...prev[bauId], is_saving: false },
      }));
    }
  };

  const handleSaveAllBaus = async () => {
    setIsSavingAllBaus(true);
    try {
      const updatedBauChannels = { ...(config?.bau_channels || {}) };

      for (const b of baus) {
        const current = bauConfigs[b.id] || {
          tipo_gestao: b.tipo_gestao || "automatico",
          discord_channel_id: b.discord_channel_id || "",
          discord_guild_id: b.discord_guild_id || "",
        };

        const cleanChannelId = current.discord_channel_id?.trim() || null;
        const cleanGuildId = current.discord_guild_id?.trim() || guildId?.trim() || null;

        await updateBau({
          id: b.id,
          tipo_gestao: current.tipo_gestao,
          discord_channel_id: cleanChannelId,
          discord_guild_id: cleanGuildId,
        });

        updatedBauChannels[b.id] = {
          bau_id: b.id,
          channel_id: cleanChannelId || "",
          guild_id: cleanGuildId || "",
          tipo_gestao: current.tipo_gestao,
          is_active: b.ativo,
        };
      }

      await updateDiscordStockConfig({
        bau_channels: updatedBauChannels,
      });

      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success("Todos os baús foram configurados com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar todos os baús.");
    } finally {
      setIsSavingAllBaus(false);
    }
  };


  // Parser local no cliente para testes e simulação com resolução de baú por canal
  const handleTestParser = () => {
    const raw = testLogText || "";
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // 1. Identificar Jogador (Nome e ID)
    let authorName: string | null = null;
    let playerId: string | null = null;

    const authorPattern = /(?:^|\n)\s*([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s*[•\|\-]\s*(?:ID|Passaporte)?\s*(\d+)/i;
    const authorMatch = raw.match(authorPattern);
    if (authorMatch) {
      authorName = authorMatch[1].trim();
      playerId = authorMatch[2].trim();
    } else {
      const idMatch = raw.match(/ID\s*[:#]?\s*(\d+)/i) || raw.match(/Passaporte\s*[:#]?\s*(\d+)/i);
      if (idMatch) playerId = idMatch[1];
    }

    // 2. Resolução de Baú pelo Canal Selecionado na Simulação
    let isTransfer = false;
    let fromBau = null;
    let toBau = null;

    const targetBauObj = baus.find((b) => b.id === selectedSimBauId) || baus[0];
    const detectedBau = targetBauObj ? targetBauObj.nome : "Baú Desconhecido";
    const isBauManual = targetBauObj?.tipo_gestao === "manual";
    const channelBound = targetBauObj?.discord_channel_id || "";

    // Padrão de transferência explícita entre baús
    const transferMatch =
      raw.match(/(?:origem|de)\s*[:\-]\s*([^\n\r\|]+).*?(?:destino|para)\s*[:\-]\s*([^\n\r\|]+)/i) ||
      raw.match(/transfer(?:ência|ido)?\s*(?:de)?\s*([^\n\r\->]+)\s*(?:->|para)\s*([^\n\r]+)/i);

    if (transferMatch) {
      isTransfer = true;
      fromBau = transferMatch[1].replace(/📦/g, "").trim();
      toBau = transferMatch[2].replace(/📦/g, "").trim();
    }

    // 3. Interpretação de Itens (Saldo Líquido e Detalhes da Movimentação)
    const items: Array<{ name: string; qtyChange: number; mappedTo?: string }> = [];
    let inSaldoLiquido = false;
    let inDetalhes = false;
    let lastItemPendingQty: string | null = null;

    const cleanItem = (rawItemName: string) => {
      const clean = rawItemName.replace(/^[\s\-•\*\>]+/, "").trim();
      const lower = clean.toLowerCase();
      if (itemMappings[lower]) return itemMappings[lower];
      for (const [k, v] of Object.entries(itemMappings)) {
        if (k.trim().toLowerCase() === lower) return v;
      }
      return clean;
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/[\*\_`]/g, "").trim();

      if (/saldo\s*l[ií]quido/i.test(line)) {
        inSaldoLiquido = true;
        inDetalhes = false;
        const inline = line.match(/saldo\s*l[ií]quido\s*[:\-]?\s*(.+?)\s*([+-]\s*\d+)$/i);
        if (inline) {
          const rawItem = inline[1].trim();
          const q = parseInt(inline[2].replace(/\s+/g, ""), 10);
          items.push({
            name: rawItem,
            qtyChange: q,
            mappedTo: cleanItem(rawItem),
          });
        }
        continue;
      }

      if (/detalhes\s*da\s*movimenta[cç][aã]o/i.test(line)) {
        inSaldoLiquido = false;
        inDetalhes = true;
        continue;
      }

      if (/movimenta[cç][oõ]es\s*agrupadas|data|hor[aá]rio|respons[aá]vel/i.test(line)) {
        inSaldoLiquido = false;
        inDetalhes = false;
        continue;
      }

      if (inSaldoLiquido) {
        const m = line.match(/^(.+?)\s*[:\-]?\s*([+-]\s*\d+)$/);
        if (m) {
          const rawItem = m[1].trim();
          const q = parseInt(m[2].replace(/\s+/g, ""), 10);
          if (!isNaN(q) && rawItem.length > 1) {
            items.push({
              name: rawItem,
              qtyChange: q,
              mappedTo: cleanItem(rawItem),
            });
          }
        }
      } else if (inDetalhes && items.length === 0) {
        const arrowMatch = line.match(/^[↳\->]+\s*([+-]?\s*\d+)\s*(removid[oa]s?|retirad[oa]s?|adicionad[oa]s?|colocad[oa]s?|guardad[oa]s?)?/i);
        if (arrowMatch && lastItemPendingQty) {
          let q = parseInt(arrowMatch[1].replace(/\s+/g, ""), 10);
          const actionWord = (arrowMatch[2] || "").toLowerCase();
          if (/removid|retirad/.test(actionWord) && q > 0) {
            q = -q;
          }
          items.push({
            name: lastItemPendingQty,
            qtyChange: q,
            mappedTo: cleanItem(lastItemPendingQty),
          });
          lastItemPendingQty = null;
        } else if (!/^[↳\->]/.test(line)) {
          lastItemPendingQty = line;
        }
      } else {
        const m = line.match(/^([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s+([+-]\d+)$/);
        if (m && !/saldo|detalhe|ba[uú]|id|data/i.test(m[1])) {
          const rawItem = m[1].trim();
          const q = parseInt(m[2], 10);
          if (!isNaN(q) && rawItem.length > 1) {
            items.push({
              name: rawItem,
              qtyChange: q,
              mappedTo: cleanItem(rawItem),
            });
          }
        }
      }
    }

    setSimulatedResult({
      authorName,
      playerId,
      isTransfer,
      fromBau,
      toBau,
      detectedBau,
      isBauManual,
      channelBound,
      targetBauObj,
      items,
      valid: items.length > 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* CARD STATUS DA CONEXÃO & ÚLTIMA LOG */}
        <Card className="surface-card border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Telemetria & Status do Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/60">
              <span className="text-muted-foreground font-medium">Status do Ingestion:</span>
              {isActive && channelId ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold">
                  🟢 Monitorando Canal
                </Badge>
              ) : (
                <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold">
                  🔴 Desativado
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Última Mensagem Processada:</span>
                <span className="font-mono text-foreground font-bold">
                  {config?.last_message_id ? `${config.last_message_id.slice(0, 10)}...` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Último Processamento:</span>
                <span className="text-foreground">
                  {config?.last_processed_at ? formatDate(config.last_processed_at) : "Nunca"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Status da Última Log:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-mono",
                    config?.last_status === "success"
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : config?.last_status === "error"
                      ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {config?.last_status || "Nenhum"}
                </Badge>
              </div>
            </div>

            {config?.last_error && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] break-words">
                <strong>Último Erro:</strong> {config.last_error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD CONFIGURAÇÃO DO DISCORD */}
        <Card className="surface-card md:col-span-2 border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              Parâmetros do Canal de Logs
            </CardTitle>
            <CardDescription className="text-xs">
              Defina o canal oficial onde o bot captura logs de movimentação de baú.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">ID do Servidor Discord (Guild ID)</Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">ID do Canal de Logs de Baú</Label>
                <Input
                  placeholder="Ex: 998877665544332211"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Baú Padrão (Fallback quando não especificado)</Label>
                <Select value={defaultBauId} onValueChange={setDefaultBauId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o baú padrão..." />
                  </SelectTrigger>
                  <SelectContent>
                    {baus.filter((b) => b.ativo).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome} ({b.tipo_gestao === "manual" ? "Manual" : "Auto"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col justify-end space-y-3 pt-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Processamento Automático</Label>
                    <p className="text-[10px] text-muted-foreground">Lê e processa mensagens novas</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Permitir Saldo Negativo</Label>
                    <p className="text-[10px] text-muted-foreground">Permite que saldo fique menor que 0</p>
                  </div>
                  <Switch checked={allowNegativeStock} onCheckedChange={setAllowNegativeStock} />
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 font-bold"
              disabled={saveConfigMutation.isPending}
              onClick={() => saveConfigMutation.mutate()}
            >
              {saveConfigMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Parâmetros de Integração
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* MAPEAMENTO DE CANAIS E GESTÃO POR BAÚ */}
      <Card className="surface-card border-border/80">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                Canais do Discord & Modo de Movimentação por Baú
              </CardTitle>
              <CardDescription className="text-xs">
                Defina para cada baú se a movimentação é <strong>Automática (via canal exclusivo do Discord)</strong> ou <strong>Manual (via painel web na página de movimentações)</strong>, e configure os IDs do canal e servidor.
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 font-bold gap-1.5 shrink-0"
              disabled={isSavingAllBaus || baus.length === 0}
              onClick={handleSaveAllBaus}
            >
              {isSavingAllBaus ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Salvar Todos os Baús
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {baus.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Nenhum baú cadastrado no sistema. Crie um baú antes de configurar a integração.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {baus.map((b) => {
                const bCfg = bauConfigs[b.id] || {
                  tipo_gestao: b.tipo_gestao || "automatico",
                  discord_channel_id: b.discord_channel_id || "",
                  discord_guild_id: b.discord_guild_id || "",
                  is_saving: false,
                };
                const isAuto = bCfg.tipo_gestao === "automatico";

                return (
                  <div
                    key={b.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all space-y-3.5 flex flex-col justify-between",
                      isAuto
                        ? "bg-secondary/20 border-primary/30 hover:border-primary/50 shadow-sm"
                        : "bg-secondary/10 border-border/60 hover:border-border"
                    )}
                  >
                    {/* Cabeçalho do Baú */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BauIcon icone={b.icone} className="w-5 h-5 text-primary" />
                          <strong className="text-sm text-foreground font-bold tracking-tight">
                            {b.nome}
                          </strong>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            b.ativo
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-muted text-muted-foreground"
                          )}
                        >
                          {b.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {b.descricao && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {b.descricao}
                        </p>
                      )}
                    </div>

                    {/* Modo de Movimentação */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Modo de Movimentação:</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold",
                            isAuto
                              ? "text-cyan-400 bg-cyan-950/40 border border-cyan-800/40"
                              : "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                          )}
                        >
                          {isAuto ? "🤖 Automático (Discord)" : "✍️ Manual (Painel Web)"}
                        </Badge>
                      </Label>
                      <Select
                        value={bCfg.tipo_gestao}
                        onValueChange={(val: "automatico" | "manual") => {
                          setBauConfigs((prev) => ({
                            ...prev,
                            [b.id]: {
                              ...(prev[b.id] || {
                                tipo_gestao: "automatico",
                                discord_channel_id: "",
                                discord_guild_id: "",
                              }),
                              tipo_gestao: val,
                            },
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatico">
                            🤖 Automático (Mensagens no canal Discord)
                          </SelectItem>
                          <SelectItem value="manual">
                            ✍️ Manual (Lançamentos no Painel Web)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        {isAuto
                          ? "O bot monitora o canal exclusivo deste baú para registrar entradas, saídas e transferências automaticamente."
                          : "Movimentações realizadas manualmente no painel web. O bot não ingere mensagens deste baú."}
                      </p>
                    </div>

                    {/* Campos de Canal e Servidor */}
                    <div className="space-y-2 pt-1 border-t border-border/40">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-foreground flex items-center justify-between">
                          <span>ID do Canal do Discord:</span>
                          {bCfg.discord_channel_id ? (
                            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Vinculado
                            </span>
                          ) : isAuto ? (
                            <span className="text-[9px] text-rose-400 font-mono">
                              Obrigatório p/ Bot
                            </span>
                          ) : null}
                        </Label>
                        <Input
                          placeholder={isAuto ? "Ex: 112233445566778899" : "Opcional no modo manual"}
                          value={bCfg.discord_channel_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBauConfigs((prev) => ({
                              ...prev,
                              [b.id]: {
                                ...(prev[b.id] || {
                                  tipo_gestao: "automatico",
                                  discord_channel_id: "",
                                  discord_guild_id: "",
                                }),
                                discord_channel_id: val,
                              },
                            }));
                          }}
                          className="h-8 text-xs font-mono bg-background/60"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                          <span>ID do Servidor (Guild ID):</span>
                          <span className="text-[9px] text-muted-foreground">
                            {bCfg.discord_guild_id ? "Customizado" : "Usa Servidor Geral"}
                          </span>
                        </Label>
                        <Input
                          placeholder={guildId || "Ex: 998877665544332211"}
                          value={bCfg.discord_guild_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBauConfigs((prev) => ({
                              ...prev,
                              [b.id]: {
                                ...(prev[b.id] || {
                                  tipo_gestao: "automatico",
                                  discord_channel_id: "",
                                  discord_guild_id: "",
                                }),
                                discord_guild_id: val,
                              },
                            }));
                          }}
                          className="h-8 text-xs font-mono bg-background/60"
                        />
                      </div>
                    </div>

                    {/* Ação individual de salvar */}
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant={isAuto ? "default" : "secondary"}
                        className="w-full h-8 text-xs font-semibold gap-1.5"
                        disabled={bCfg.is_saving}
                        onClick={() => handleSaveSingleBau(b.id)}
                      >
                        {bCfg.is_saving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Salvar Configuração do Baú
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MAPEAMENTO DE ITENS E BAÚS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MAPEAMENTO DE ITENS */}
        <Card className="surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Mapeamento de Nomes de Itens (Aliases)
              </span>
              <Badge variant="outline" className="text-[10px]">
                {Object.keys(itemMappings).length} aliases
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Mapeie como os itens são chamados no Discord para os produtos cadastrados no sistema. (Salva automaticamente ao adicionar ou remover)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Texto Discord (ex: 'Micro Uzi')"
                value={newAliasKey}
                onChange={(e) => setNewAliasKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddItemMapping();
                  }
                }}
                className="text-xs flex-1 min-w-[120px]"
              />
              <Select value={newAliasTargetProduct} onValueChange={setNewAliasTargetProduct} className="w-56 shrink-0">
                <SelectTrigger className="text-xs w-full">
                  <SelectValue placeholder="Produto..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {products.filter((p) => p.ativo !== false && p.nome && p.nome.trim() !== "." && p.nome.trim() !== "").length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Nenhum produto cadastrado
                    </div>
                  ) : (
                    products
                      .filter((p) => p.ativo !== false && p.nome && p.nome.trim() !== "." && p.nome.trim() !== "")
                      .map((p) => (
                        <SelectItem key={p.id} value={p.nome}>
                          {p.nome}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => void handleAddItemMapping()} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40 text-xs">
              {Object.keys(itemMappings).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-[11px]">
                  Nenhum mapeamento customizado. Itens com mesmo nome são associados automaticamente.
                </div>
              ) : (
                Object.entries(itemMappings).map(([k, v]) => (
                  <div key={k} className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-muted-foreground">{k}</span>
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <strong className="text-foreground">{v}</strong>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                      onClick={() => void handleRemoveItemMapping(k)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
            <span className="text-[11px] text-muted-foreground">
              Sincronizado diretamente com a base de dados.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              disabled={isSavingItemMappings}
              onClick={() => void handleSaveAllItemMappings()}
            >
              {isSavingItemMappings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Mapeamentos
            </Button>
          </CardFooter>
        </Card>

        {/* MAPEAMENTO EXCLUSIVO DE BAÚS POR CANAL DISCORD */}
        <Card className="surface-card border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                Canais dos Baús no Discord (Mapeamento Exclusivo)
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold">
                {baus.filter((b) => b.ativo).length} baús ativos
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Cada baú possui seu <strong>canal exclusivo no Discord</strong>. As logs do Cidade Alta trazem apenas o texto genérico <code>📦 Baú</code>, de modo que o canal onde a mensagem foi postada determina qual baú recebe a movimentação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40 text-xs">
              {baus.filter((b) => b.ativo).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-[11px]">
                  Nenhum baú cadastrado. Crie baús para vincular canais exclusivos.
                </div>
              ) : (
                baus
                  .filter((b) => b.ativo)
                  .map((b) => {
                    const cfg = bauConfigs[b.id];
                    const isAuto = (cfg?.tipo_gestao ?? b.tipo_gestao) !== "manual";
                    const chId = cfg?.discord_channel_id ?? b.discord_channel_id;

                    return (
                      <div key={b.id} className="p-2.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <BauIcon icone={b.icone} className="w-4 h-4 text-amber-400" />
                            <strong className="text-foreground font-semibold">{b.nome}</strong>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] px-1.5 py-0 font-bold",
                                isAuto
                                  ? "text-cyan-400 bg-cyan-950/40 border border-cyan-800/40"
                                  : "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                              )}
                            >
                              {isAuto ? "🤖 Automático (Discord)" : "✍️ Manual"}
                            </Badge>
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                            <span>Canal:</span>
                            {chId ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> {chId}
                              </span>
                            ) : (
                              <span className="text-rose-400 italic">Nenhum canal vinculado</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {b.capacidade_maxima ? `${b.capacidade_maxima} slots` : "Capac. Livre"}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
            <span className="text-[11px] text-muted-foreground">
              Configure os canais e modos no card acima.
            </span>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              Resolução por Canal Ativa
            </Badge>
          </CardFooter>
        </Card>
      </div>

      {/* SIMULADOR DE INTERPRETAÇÃO DE LOGS */}
      <Card className="surface-card border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <Terminal className="w-4 h-4" />
                Simulador & Validador de Interpretação de Logs (Estilo Cidade Alta)
              </CardTitle>
              <CardDescription className="text-xs">
                Simule como o motor de estoque interpreta mensagens de logs do Cidade Alta APP no canal exclusivo de cada baú.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestParser}
              className="gap-1.5 text-xs font-bold border-primary/40 hover:bg-primary/10 text-primary shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Interpretar Log
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SELETOR DE CANAL / BAÚ ALVO DA SIMULAÇÃO */}
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Canal / Baú Alvo da Mensagem:</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Como a log traz apenas "📦 Baú", o canal exclusivo determina o baú de destino)
              </span>
            </Label>
            <Select value={selectedSimBauId} onValueChange={setSelectedSimBauId}>
              <SelectTrigger className="text-xs w-full bg-background/60 font-medium">
                <SelectValue placeholder="Selecione o baú simulado..." />
              </SelectTrigger>
              <SelectContent>
                {baus
                  .filter((b) => b.ativo)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-1.5">
                        <BauIcon icone={b.icone} className="w-3.5 h-3.5 text-primary" />
                        <span>{b.nome}</span>
                        <span className="text-[10px] text-muted-foreground">
                          — {b.tipo_gestao === "manual" ? "✍️ Manual" : "🤖 Automático"} {b.discord_channel_id ? `(Canal: ${b.discord_channel_id})` : "(Sem canal)"}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Exemplo / Conteúdo da Mensagem</Label>
              <Textarea
                rows={9}
                value={testLogText}
                onChange={(e) => setTestLogText(e.target.value)}
                className="font-mono text-xs resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2 text-muted-foreground hover:text-cyan-400"
                  onClick={() =>
                    setTestLogText(
                      "Andrew Delucca Ferreira • ID 274\n📦 Baú\n\n📊 Saldo líquido\nMetanfetamina -72\nCocaína -126\n\n🧾 Detalhes da movimentação\nMetanfetamina\n↳ -72 removidos\nCocaína\n↳ -126 removidos\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 19:21"
                    )
                  }
                >
                  Template: Cidade Alta (Metanfetamina & Cocaína)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2 text-muted-foreground hover:text-cyan-400"
                  onClick={() =>
                    setTestLogText(
                      "Macaé Dacoro • ID 590\n📦 Baú\n\n📊 Saldo líquido\nBarra Maciça -1\nHacking -1\n\n🧾 Detalhes da movimentação\nBarra Maciça\n↳ -1 removido\nHacking\n↳ -1 removido\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 17:03"
                    )
                  }
                >
                  Template: Cidade Alta (Barra Maciça & Hacking)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2 text-muted-foreground hover:text-emerald-400"
                  onClick={() =>
                    setTestLogText(
                      "Andrew Delucca Ferreira • ID 274\n📦 Baú\n\n📊 Saldo líquido\nLockpick +50\nColete Balístico +10\n\n🧾 Detalhes da movimentação\nLockpick\n↳ +50 adicionados\nColete Balístico\n↳ +10 adicionados\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 20:15"
                    )
                  }
                >
                  Template: Cidade Alta (Entrada +)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2 text-muted-foreground hover:text-amber-400"
                  onClick={() =>
                    setTestLogText("Transferência: BAÚ QG -> Baú Casa\nSaldo líquido: Micro Uzi +2\nID: 88")
                  }
                >
                  Template: Transferência
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Diagnóstico da Interpretação</Label>
              <div className="rounded-lg border border-border/80 bg-background/50 p-3 min-h-[220px] text-xs space-y-2">
                {!simulatedResult ? (
                  <p className="text-muted-foreground italic text-center pt-16">
                    Clique em "Interpretar Log" para ver como o motor processará esta mensagem.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">Resultado Geral:</span>
                      {simulatedResult.valid ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Válido para Processar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 gap-1 font-bold">
                          <XCircle className="w-3 h-3" /> Nenhum item identificado
                        </Badge>
                      )}
                    </div>

                    {/* Alerta de Modo de Movimentação do Baú */}
                    {simulatedResult.isBauManual ? (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>Modo Manual:</strong> O baú selecionado está configurado como manual. O bot ignorará mensagens no Discord e <strong>não fará movimentação automática</strong>.
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-start gap-1.5">
                        <Bot className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>Modo Automático:</strong> O bot capturará esta mensagem no canal e registrará a movimentação imediatamente.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-muted-foreground block">Jogador Identificado:</span>
                        <strong className="text-foreground">
                          {simulatedResult.authorName ? `${simulatedResult.authorName} ` : ""}
                          {simulatedResult.playerId ? `(ID: ${simulatedResult.playerId})` : "Não detectado"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Baú Resolvido:</span>
                        <strong className="text-foreground">
                          {simulatedResult.isTransfer
                            ? `${simulatedResult.fromBau} ➔ ${simulatedResult.toBau}`
                            : simulatedResult.detectedBau}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Canal do Baú:</span>
                        <strong className="text-foreground font-mono">
                          {simulatedResult.channelBound || "Nenhum canal vinculado"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Qtd. Itens Detectados:</span>
                        <strong className="text-foreground">{simulatedResult.items.length} itens</strong>
                      </div>
                    </div>

                    {simulatedResult.items.length > 0 && (
                      <div className="pt-2 border-t border-border/40 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Itens Identificados na Log:
                        </span>
                        {simulatedResult.items.map((item: any, idx: number) => {
                          const isSaida = item.qtyChange < 0;
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px] font-mono bg-secondary/30 px-2 py-1.5 rounded border border-border/40">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={cn("text-[9px] px-1 py-0 uppercase font-bold", isSaida ? "border-rose-500/30 text-rose-400 bg-rose-500/10" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10")}>
                                  {isSaida ? "Saída" : "Entrada"}
                                </Badge>
                                <span>
                                  {item.name} {item.mappedTo !== item.name ? <>➔ <span className="text-primary font-bold">{item.mappedTo}</span></> : null}
                                </span>
                              </div>
                              <span className={cn("font-bold text-xs", isSaida ? "text-rose-400" : "text-emerald-400")}>
                                {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// TAB 3: LOGS TÉCNICAS & AUDITORIA (LIVE 20 MENSAGENS + HISTÓRICO DB)
// ============================================================================
function DiscordLogsTab() {
  const queryClient = useQueryClient();
  const { data: logs = [], isLoading: isLoadingDbLogs, isRefetching: isRefetchingDbLogs } = useDiscordStockLogs(60);
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: discordConfig } = useDiscordStockConfig();

  const itemMappings = useMemo(() => {
    return (discordConfig?.item_mappings as Record<string, string>) || {};
  }, [discordConfig]);

  const [logTab, setLogTab] = useState<"live" | "db">("live");

  // Live Messages State
  const autoBausWithChannel = useMemo(() => {
    return baus.filter((b) => b.ativo && b.discord_channel_id?.trim());
  }, [baus]);

  const [selectedLiveBauId, setSelectedLiveBauId] = useState<string>("");

  useEffect(() => {
    if (!selectedLiveBauId && autoBausWithChannel.length > 0) {
      setSelectedLiveBauId(autoBausWithChannel[0]!.id);
    }
  }, [autoBausWithChannel, selectedLiveBauId]);

  const selectedLiveBau = baus.find((b) => b.id === selectedLiveBauId);
  const targetChannelId = selectedLiveBau?.discord_channel_id?.trim() || "";

  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastLiveFetchTime, setLastLiveFetchTime] = useState<Date | null>(null);
  const [selectedLiveMsgForInspect, setSelectedLiveMsgForInspect] = useState<any | null>(null);

  // DB Logs Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLogForInspect, setSelectedLogForInspect] = useState<DiscordStockLog | null>(null);

  // Parser client-side para as mensagens do canal
  const parseClientMessage = (msg: any) => {
    const rawContent = msg.content || "";
    const embeds = Array.isArray(msg.embeds) ? msg.embeds : [];
    const firstEmbed = embeds[0] || null;

    let authorName = firstEmbed?.author?.name || msg.author?.displayName || msg.author?.username || "";
    let playerId: string | null = null;

    const authorPattern = /(?:^|\n)\s*([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s*[•\|\-]\s*(?:ID|Passaporte)?\s*(\d+)/i;
    const authorMatch = (authorName || rawContent).match(authorPattern);
    if (authorMatch) {
      if (!authorName) authorName = authorMatch[1].trim();
      playerId = authorMatch[2].trim();
    } else {
      const idMatch = (authorName || rawContent).match(/ID\s*[:#]?\s*(\d+)/i) || (authorName || rawContent).match(/Passaporte\s*[:#]?\s*(\d+)/i);
      if (idMatch) playerId = idMatch[1];
    }

    const cleanItemName = (rawItem: string) => {
      const clean = rawItem.replace(/^[\s\-•\*\>]+/, "").trim();
      const lower = clean.toLowerCase();
      if (itemMappings[lower]) return itemMappings[lower];
      for (const [k, v] of Object.entries(itemMappings)) {
        if (k.trim().toLowerCase() === lower) return v;
      }
      const matchedProd = products.find(
        (p) =>
          p.ativo !== false &&
          ((p.cda_name && p.cda_name.trim().toLowerCase() === lower) ||
            p.nome.trim().toLowerCase() === lower)
      );
      if (matchedProd) return matchedProd.nome;
      return clean;
    };

    const parsedItems: Array<{ name: string; mappedTo: string; qtyChange: number }> = [];

    // 1. Processar campos de Embeds (Cidade Alta APP)
    if (firstEmbed && Array.isArray(firstEmbed.fields)) {
      for (const field of firstEmbed.fields) {
        const fieldName = (field.name || "").toLowerCase();
        const fieldValue = field.value || "";

        if (fieldName.includes("saldo") || fieldName.includes("líquido") || fieldName.includes("liquido")) {
          const lines = fieldValue.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            const cleanLine = line.replace(/[\*\_`]/g, "").trim();
            const m = cleanLine.match(/^(.+?)\s*([+-]\s*\d+)$/);
            if (m) {
              const rawItem = m[1].trim();
              const qty = parseInt(m[2].replace(/\s+/g, ""), 10);
              if (!isNaN(qty) && rawItem.length > 1) {
                parsedItems.push({
                  name: rawItem,
                  mappedTo: cleanItemName(rawItem),
                  qtyChange: qty,
                });
              }
            }
          }
        }
      }
    }

    // 2. Se não encontrou nos fields, processar o corpo da mensagem ou descrição do embed
    if (parsedItems.length === 0) {
      const fullText = [rawContent, firstEmbed?.description || ""].filter(Boolean).join("\n");
      const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      let inSaldo = false;
      for (const rawLine of lines) {
        const line = rawLine.replace(/[\*\_`]/g, "").trim();
        if (/saldo\s*l[ií]quido/i.test(line)) {
          inSaldo = true;
          const inline = line.match(/saldo\s*l[ií]quido\s*[:\-]?\s*(.+?)\s*([+-]\s*\d+)$/i);
          if (inline) {
            const rawItem = inline[1].trim();
            const q = parseInt(inline[2].replace(/\s+/g, ""), 10);
            if (!isNaN(q)) {
              parsedItems.push({
                name: rawItem,
                mappedTo: cleanItemName(rawItem),
                qtyChange: q,
              });
            }
          }
          continue;
        }

        if (/detalhes\s*da\s*movimenta[cç][aã]o/i.test(line)) {
          inSaldo = false;
          continue;
        }

        if (inSaldo) {
          const m = line.match(/^(.+?)\s*[:\-]?\s*([+-]\s*\d+)$/);
          if (m) {
            const rawItem = m[1].trim();
            const q = parseInt(m[2].replace(/\s+/g, ""), 10);
            if (!isNaN(q) && rawItem.length > 1) {
              parsedItems.push({
                name: rawItem,
                mappedTo: cleanItemName(rawItem),
                qtyChange: q,
              });
            }
          }
        } else {
          const m = line.match(/^([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s+([+-]\d+)$/);
          if (m && !/saldo|detalhe|ba[uú]|id|data/i.test(m[1])) {
            const rawItem = m[1].trim();
            const q = parseInt(m[2], 10);
            if (!isNaN(q) && rawItem.length > 1) {
              parsedItems.push({
                name: rawItem,
                mappedTo: cleanItemName(rawItem),
                qtyChange: q,
              });
            }
          }
        }
      }
    }

    return {
      authorName,
      playerId,
      parsedItems,
      isValidMovement: parsedItems.length > 0,
    };
  };

  // Buscar as últimas 20 mensagens do canal no Discord sem salvar no BD
  const handleFetchLiveMessages = async () => {
    if (!targetChannelId) {
      toast.error("Selecione um baú com ID de canal do Discord configurado.");
      return;
    }

    setIsLoadingLive(true);
    setLiveError(null);

    try {
      // 1. Tenta buscar via endpoint do bot Discloud
      let messages: any[] = [];
      // 1. Consulta via endpoint do bot Discloud
      try {
        const res = await fetch(`https://twin.discloud.app/api/channel-messages?channelId=${targetChannelId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            messages = data.messages;
          }
        }
      } catch {}

      // 2. Fallback via proxy ou env se disponível
      if (messages.length === 0) {
        const clientToken = (import.meta as any).env?.VITE_DISCORD_BOT_TOKEN;
        if (clientToken) {
          const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages?limit=20`, {
            headers: {
              Authorization: `Bot ${clientToken}`,
            },
          });
          if (res.ok) {
            messages = await res.json();
          }
        }
      }

      if (messages.length === 0 && !liveMessages.length) {
        // Se o bot estiver iniciando na Discloud, exibe aviso amigavel
        setLiveError("O bot na Discloud está iniciando ou o canal não possui mensagens recentes.");
      }

      setLiveMessages(Array.isArray(messages) ? messages : []);
      setLastLiveFetchTime(new Date());
      toast.success(`${messages.length} mensagens recuperadas em tempo real do canal!`);
    } catch (err: any) {
      setLiveError(err.message || "Não foi possível carregar as mensagens do canal.");
      toast.error(err.message || "Erro ao consultar mensagens do canal.");
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (logTab === "live" && targetChannelId) {
      void handleFetchLiveMessages();
    }
  }, [targetChannelId, logTab]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesMsgId = log.message_id?.toLowerCase().includes(term);
        const matchesPlayer = log.game_player_id?.toLowerCase().includes(term);
        const matchesAuthor = log.author_name?.toLowerCase().includes(term);
        const matchesContent = log.raw_content?.toLowerCase().includes(term);
        if (!matchesMsgId && !matchesPlayer && !matchesAuthor && !matchesContent) return false;
      }
      return true;
    });
  }, [logs, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* SELETOR DE MODO DE AUDITORIA: LIVE VS BANCO DE DADOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/60">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={logTab === "live" ? "default" : "outline"}
            onClick={() => setLogTab("live")}
            className={cn(
              "gap-2 text-xs font-bold rounded-xl cursor-pointer transition-all",
              logTab === "live" ? "bg-primary text-primary-foreground shadow-md" : ""
            )}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            📡 Mensagens em Tempo Real (Últimas 20 do Canal — Sem Salvar no BD)
          </Button>

          <Button
            size="sm"
            variant={logTab === "db" ? "default" : "outline"}
            onClick={() => setLogTab("db")}
            className={cn(
              "gap-2 text-xs font-bold rounded-xl cursor-pointer transition-all",
              logTab === "db" ? "bg-primary text-primary-foreground shadow-md" : ""
            )}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            💾 Histórico Persistido no Banco ({logs.length})
          </Button>
        </div>

        {logTab === "live" && lastLiveFetchTime && (
          <span className="text-[11px] text-muted-foreground font-mono">
            Última leitura: {lastLiveFetchTime.toLocaleTimeString("pt-BR")}
          </span>
        )}
      </div>

      {logTab === "live" ? (
        /* ========================================================================= */
        /* MODO 1: LIVE 20 MENSAGENS EM TEMPO REAL DO CANAL (SEM PERSISTÊNCIA NO BD) */
        /* ========================================================================= */
        <Card className="surface-card border-border/80 shadow-lg">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Feed Live do Canal do Discord (Últimas 20 Mensagens)
                </CardTitle>
                <CardDescription className="text-xs">
                  Consulta direta à API do Discord sem gravar registros no banco de dados. Ideal para conferência e auditoria ao vivo.
                </CardDescription>
              </div>

              {/* Seletor de Baú / Canal + Botão de Atualização */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-64">
                  <Select value={selectedLiveBauId} onValueChange={setSelectedLiveBauId}>
                    <SelectTrigger className="h-9 text-xs bg-background/60 font-medium">
                      <SelectValue placeholder="Selecione o baú..." />
                    </SelectTrigger>
                    <SelectContent>
                      {autoBausWithChannel.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Nenhum baú com canal vinculado
                        </div>
                      ) : (
                        autoBausWithChannel.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            <span className="flex items-center gap-1.5">
                              <BauIcon icone={b.icone} className="w-3.5 h-3.5 text-primary" />
                              <span>{b.nome}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ({b.discord_channel_id})
                              </span>
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchLiveMessages}
                  disabled={isLoadingLive || !targetChannelId}
                  className="h-9 text-xs gap-1.5 font-bold border-primary/40 hover:bg-primary/10 text-primary cursor-pointer"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoadingLive && "animate-spin")} />
                  {isLoadingLive ? "Consultando Discord..." : "Buscar 20 Mensagens"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoadingLive ? (
              <div className="p-14 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span>Carregando as 20 mensagens mais recentes do canal no Discord...</span>
              </div>
            ) : liveError ? (
              <div className="p-8 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-400 font-semibold">{liveError}</p>
                <Button size="sm" variant="outline" onClick={handleFetchLiveMessages} className="text-xs mt-2">
                  Tentar Novamente
                </Button>
              </div>
            ) : liveMessages.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <Radio className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>Nenhuma mensagem retornada para o canal selecionado ({targetChannelId || "Nenhum canal"}).</p>
                <p className="text-[10px]">Certifique-se de que o bot possui permissão de leitura de mensagens e histórico no canal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-secondary/20">
                      <TableHead className="text-xs">Data/Hora</TableHead>
                      <TableHead className="text-xs">ID Mensagem</TableHead>
                      <TableHead className="text-xs">Jogador / Autor</TableHead>
                      <TableHead className="text-xs">Itens / Saldo Detectado</TableHead>
                      <TableHead className="text-xs">Status do Parser</TableHead>
                      <TableHead className="text-xs text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveMessages.map((msg: any) => {
                      const parsed = parseClientMessage(msg);
                      const msgDate = msg.createdTimestamp ? new Date(msg.createdTimestamp) : msg.createdAt ? new Date(msg.createdAt) : new Date();

                      return (
                        <TableRow key={msg.id} className="border-border/30 hover:bg-secondary/20 transition-colors">
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground font-mono">
                            {formatDate(msgDate.toISOString())}
                          </TableCell>

                          <TableCell className="text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <span className="text-foreground">{msg.id?.slice(0, 10)}...</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.id || "");
                                  toast.success("ID da mensagem copiado!");
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="space-y-0.5">
                              {parsed.playerId ? (
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30">
                                    ID {parsed.playerId}
                                  </Badge>
                                  <span className="text-foreground font-semibold truncate max-w-[140px]">
                                    {parsed.authorName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground font-medium truncate max-w-[150px] block">
                                  {parsed.authorName || msg.author?.username || "Autor Desconhecido"}
                                </span>
                              )}
                              {msg.author?.bot && (
                                <Badge variant="secondary" className="text-[8.5px] px-1 py-0 uppercase bg-secondary/80 text-muted-foreground">
                                  BOT / APP
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            {parsed.parsedItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {parsed.parsedItems.map((it, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] font-mono",
                                      it.qtyChange > 0
                                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                        : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                    )}
                                  >
                                    {it.mappedTo} {it.qtyChange > 0 ? `+${it.qtyChange}` : it.qtyChange}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px] truncate max-w-[200px] block italic">
                                {msg.content || (msg.embeds?.[0]?.title ? `Embed: ${msg.embeds[0].title}` : "(Sem texto de saldo)")}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-xs">
                            {parsed.isValidMovement ? (
                              <Badge variant="outline" className="text-[10px] font-mono uppercase border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Movimentação Válida
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-mono uppercase border-muted text-muted-foreground bg-secondary/40">
                                Informativo / Outro
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs hover:text-primary cursor-pointer"
                              onClick={() => setSelectedLiveMsgForInspect(msg)}
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              JSON Raw
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-3 border-t border-border/40 bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Exibindo <strong>{liveMessages.length}</strong> mensagens live do canal <code>{targetChannelId || "—"}</code>.
            </span>
            <span className="text-[11px] text-emerald-400/90 font-medium">
              🔒 100% em memória (sem inserção no banco de dados).
            </span>
          </CardFooter>
        </Card>
      ) : (
        /* ========================================================================= */
        /* MODO 2: LOGS PERSISTIDAS NO BANCO DE DADOS (discord_stock_logs)          */
        /* ========================================================================= */
        <Card className="surface-card border-border/80">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Auditoria de Logs Gravadas no Banco (discord_stock_logs)
                </CardTitle>
                <CardDescription className="text-xs">
                  Histórico persistido com auditoria técnica de sucesso e erro no banco de dados.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por ID, Jogador ou Conteúdo..."
                    className="pl-8 h-9 text-xs w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="success">🟢 Sucesso</SelectItem>
                    <SelectItem value="error">🔴 Erro</SelectItem>
                    <SelectItem value="ignored">⚪ Ignorados</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["discord_stock_logs"] })}
                  disabled={isRefetchingDbLogs}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefetchingDbLogs && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoadingDbLogs ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Carregando logs de auditoria...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Nenhuma log técnica encontrada com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40">
                      <TableHead className="text-xs">Data/Hora</TableHead>
                      <TableHead className="text-xs">ID da Mensagem</TableHead>
                      <TableHead className="text-xs">Jogador / Autor</TableHead>
                      <TableHead className="text-xs">Itens / Alteração</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((l) => (
                      <TableRow key={l.id} className="border-border/30 hover:bg-secondary/20">
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {formatDate(l.created_at)}
                        </TableCell>

                        <TableCell className="text-xs font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-foreground">{l.message_id?.slice(0, 12)}...</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                navigator.clipboard.writeText(l.message_id || "");
                                toast.success("ID copiado!");
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          {l.game_player_id ? (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              ID {l.game_player_id}
                            </Badge>
                          ) : l.author_name ? (
                            <span className="text-muted-foreground truncate max-w-[120px] block">
                              {l.author_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          {Array.isArray(l.parsed_items) && l.parsed_items.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {l.parsed_items.map((it: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-mono",
                                    it.quantity_change > 0
                                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                      : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                  )}
                                >
                                  {it.item_name} {it.quantity_change > 0 ? `+${it.quantity_change}` : it.quantity_change}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px] truncate max-w-[200px] block">
                              {l.raw_content ? l.raw_content.slice(0, 40) : "—"}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono uppercase",
                              l.status === "success"
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : l.status === "error"
                                ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                                : "border-muted text-muted-foreground bg-secondary/30"
                            )}
                          >
                            {l.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-xs"
                            onClick={() => setSelectedLogForInspect(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            Inspecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL DE INSPEÇÃO TÉCNICA RAW (MENSAGEM LIVE) */}
      <Dialog open={Boolean(selectedLiveMsgForInspect)} onOpenChange={(open) => !open && setSelectedLiveMsgForInspect(null)}>
        <DialogContent className="max-w-2xl surface-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Inspeção Raw de Mensagem Live do Discord
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ID: <span className="font-mono text-foreground">{selectedLiveMsgForInspect?.id}</span> • Canal:{" "}
                  <span className="font-mono text-foreground">{targetChannelId}</span>
                </DialogDescription>
              </div>

              <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                TEMPO REAL (DISCORD API)
              </Badge>
            </div>
          </DialogHeader>

          {selectedLiveMsgForInspect && (
            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Resultado da Interpretação Client-Side</Label>
                <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs overflow-x-auto">
                  {JSON.stringify(parseClientMessage(selectedLiveMsgForInspect), null, 2)}
                </pre>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Objeto Completo da Mensagem (JSON)</Label>
                <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs overflow-x-auto">
                  {JSON.stringify(selectedLiveMsgForInspect, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLiveMsgForInspect(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE INSPEÇÃO TÉCNICA RAW (LOG DO BANCO) */}
      <Dialog open={Boolean(selectedLogForInspect)} onOpenChange={(open) => !open && setSelectedLogForInspect(null)}>
        <DialogContent className="max-w-2xl surface-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  Inspeção Técnica de Log do Banco
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ID: <span className="font-mono text-foreground">{selectedLogForInspect?.message_id}</span> • Registrado em:{" "}
                  {selectedLogForInspect?.created_at && formatDate(selectedLogForInspect.created_at)}
                </DialogDescription>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] uppercase font-mono",
                  selectedLogForInspect?.status === "success"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : selectedLogForInspect?.status === "error"
                    ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                    : "border-muted text-muted-foreground"
                )}
              >
                {selectedLogForInspect?.status}
              </Badge>
            </div>
          </DialogHeader>

          {selectedLogForInspect && (
            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {selectedLogForInspect.error_message && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-1">
                  <strong className="block text-[11px]">Erro durante a interpretação ou gravação:</strong>
                  <p className="font-mono text-xs">{selectedLogForInspect.error_message}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Conteúdo Bruto (Raw Content)</Label>
                <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs whitespace-pre-wrap">
                  {selectedLogForInspect.raw_content || "(Sem texto bruto no corpo da mensagem)"}
                </pre>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Itens Interpretados (JSON)</Label>
                <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs overflow-x-auto">
                  {JSON.stringify(selectedLogForInspect.parsed_items, null, 2)}
                </pre>
              </div>

              {selectedLogForInspect.raw_embeds && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Embeds da Mensagem (JSON)</Label>
                  <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs overflow-x-auto">
                    {JSON.stringify(selectedLogForInspect.raw_embeds, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLogForInspect(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

