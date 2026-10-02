import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, Link, Outlet, useChildMatches, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Crown,
  LayoutDashboard,
  Bot,
  Webhook,
  Landmark,
  TrendingUp,
  DollarSign,
  Users,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Sparkles,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  Wallet,
  Activity,
  Calendar,
  AlertCircle,
  BellRing,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, CeoBadge, DevBadge } from "@/components/ui-kit";
import { usePanelTheme } from "@/lib/panelTheme";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, useSales, useCashMovements } from "@/hooks/useData";
import { useUrlTab } from "@/hooks/useUrlTab";
import { CeoGuard } from "@/guards/CeoGuard";
import { DevBotManageCard } from "@/components/dev/DevBotManageCard";
import { DevWebhooksConfigCard } from "@/components/dev/DevWebhooksConfigCard";
import { CeoNotificationsManager } from "@/components/notifications/CeoNotificationsManager";
import {
  getCeoConfiguration,
  type CeoConfiguration,
  DEFAULT_CEO_CONFIG,
} from "@/services/devService";
import { currency, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ceo")({
  component: CeoPageWrapper,
});

function CeoPageWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return (
    <CeoGuard>
      <CeoPageContent />
    </CeoGuard>
  );
}

export type CeoTab = "dashboard" | "bot" | "webhooks" | "financas";
export const VALID_CEO_TABS: readonly CeoTab[] = ["dashboard", "bot", "webhooks", "financas"] as const;

export function CeoPageContent({ initialTab }: { initialTab?: string } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, level, isCeoUser, isDevUser, hasPermission } = useAuth();
  const { ceoStyle, CeoIcon } = usePanelTheme();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: cashMovements = [], isLoading: loadingCash } = useCashMovements();

  // Configuração da Tag CEO definida no Painel Dev
  const [ceoConfig, setCeoConfig] = useState<CeoConfiguration>(DEFAULT_CEO_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Filtro de movimentações de finanças
  const [financeFilter, setFinanceFilter] = useState<"all" | "entrada" | "saida">("all");

  useEffect(() => {
    let isMounted = true;
    getCeoConfiguration(user, profile, level)
      .then((cfg) => {
        if (isMounted && cfg) setCeoConfig(cfg);
      })
      .catch((err) => {
        console.warn("Falha ao carregar configurações do CEO:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, profile, level]);

  // Resolução 100% reativa da aba atual a partir de rota, params ou query
  const activeTab = useMemo<CeoTab>(() => {
    if (initialTab === "dashboard" || initialTab === "executivo") return "dashboard";
    if (initialTab && (VALID_CEO_TABS as readonly string[]).includes(initialTab)) {
      return initialTab as CeoTab;
    }
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart === "dashboard" || lastPart === "executivo") return "dashboard";
    if ((VALID_CEO_TABS as readonly string[]).includes(lastPart)) {
      return lastPart as CeoTab;
    }
    const q = (location.search as any)?.tab;
    if (q === "dashboard" || q === "executivo") return "dashboard";
    if (q && (VALID_CEO_TABS as readonly string[]).includes(q)) {
      return q as CeoTab;
    }
    return "dashboard";
  }, [initialTab, location.pathname, location.search]);

  // Troca de aba com navegação reativa do TanStack Router
  const setTab = useCallback(
    (newTab: CeoTab) => {
      navigate({
        to: "/ceo/$tab",
        params: { tab: newTab },
      });
    },
    [navigate]
  );

  // Métricas do Painel Executivo
  const totalSalesRevenue = useMemo(() => {
    return sales
      .filter((s) => s.status === "concluida")
      .reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
  }, [sales]);

  const activeCashMovements = useMemo(() => {
    return cashMovements.filter((m) => m.status !== "estornado");
  }, [cashMovements]);

  const totalEntradas = useMemo(() => {
    return activeCashMovements
      .filter((m) => m.type === "entrada")
      .reduce((acc, m) => acc + Number(m.amount || 0), 0);
  }, [activeCashMovements]);

  const totalSaidas = useMemo(() => {
    return activeCashMovements
      .filter((m) => m.type === "saida")
      .reduce((acc, m) => acc + Number(m.amount || 0), 0);
  }, [activeCashMovements]);

  const cashBalance = useMemo(() => {
    return Math.round((totalEntradas - totalSaidas) * 100) / 100;
  }, [totalEntradas, totalSaidas]);

  const activeMembersCount = useMemo(() => {
    return members.filter((m) => m.status === "ativo").length;
  }, [members]);

  // Permissões granulares de módulos do Painel CEO (integradas com /dev/permissoes)
  const canManageBot = isDevUser || (hasPermission("manage_ceo_bot") && ceoConfig.allowManageBot !== false);
  const canUseWebhooks = isDevUser || (hasPermission("manage_ceo_webhooks") && ceoConfig.allowWebhooks !== false);
  const canViewFinancials = isDevUser || (hasPermission("view_ceo_financials") && ceoConfig.allowFinancials !== false);

  const filteredMovements = useMemo(() => {
    if (financeFilter === "all") return cashMovements;
    return cashMovements.filter((m) => m.type === financeFilter);
  }, [cashMovements, financeFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14 animate-in fade-in-50 duration-300">
      {/* HEADER EXECUTIVO CEO */}
      <PageHeader
        title="Painel Executivo — Tag CEO"
        description="Centro de comando da diretoria da Twin Wheels. Gerenciamento do bot, webhooks do Discord, fundo de caixa e operações estratégicas."
        actions={
          <div className="flex items-center gap-2">
            {isDevUser && <DevBadge text="Acesso Dev Master" />}
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs py-1.5 px-3 font-black gap-1.5 shadow-sm shadow-amber-500/10">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Diretoria Executiva
            </Badge>
          </div>
        }
      />

      {/* BANNER EXECUTIVO CEO */}
      <Card
        className="surface-card relative overflow-hidden transition-all duration-300"
        style={{
          borderColor: `${ceoStyle.primaryHex}40`,
          background: ceoStyle.isGradient && ceoStyle.gradient
            ? `linear-gradient(135deg, ${ceoStyle.primaryHex}20 0%, ${ceoStyle.primaryHex}06 50%, transparent 100%)`
            : `linear-gradient(to right, ${ceoStyle.primaryHex}18, ${ceoStyle.primaryHex}05, transparent)`,
        }}
      >
        <div
          className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none transition-transform duration-500 group-hover:scale-105"
          style={{ color: ceoStyle.primaryHex }}
        >
          <CeoIcon className="h-64 w-64" />
        </div>

        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className="p-3.5 rounded-2xl shrink-0 shadow-md transition-all duration-300"
                style={{
                  backgroundColor: `${ceoStyle.primaryHex}25`,
                  color: ceoStyle.primaryHex,
                  borderColor: `${ceoStyle.primaryHex}50`,
                  borderWidth: "1px",
                  boxShadow: `0 4px 16px ${ceoStyle.primaryHex}25`,
                }}
              >
                <CeoIcon className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    Diretoria Executiva · Twin Wheels
                  </h2>
                  <CeoBadge size="sm">CEO Access</CeoBadge>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Bem-vindo à sala de controle executivo. Aqui você comanda as automações do Discord,
                  transmissão de comunicados via Webhooks e acompanha a saúde financeira e operacional do grupo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div
                className="px-4 py-2 rounded-xl bg-background/80 text-center shadow-xs"
                style={{ borderColor: `${ceoStyle.primaryHex}35`, borderWidth: "1px" }}
              >
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Efetivo Ativo
                </span>
                <span className="text-lg font-black" style={{ color: ceoStyle.primaryHex }}>
                  {activeMembersCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NAVEGAÇÃO DE ABAS EXECUTIVAS CEO (Rápida troca por toque no mobile e desktop) */}
      <Tabs value={activeTab} onValueChange={(val: any) => setTab(val)} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <TabsList
            className="bg-secondary/60 p-1 rounded-2xl inline-flex w-full sm:w-auto min-w-max gap-1"
            style={{ borderColor: `${ceoStyle.primaryHex}35`, borderWidth: "1px" }}
          >
            <TabsTrigger
              value="dashboard"
              className="gap-2 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all"
              style={
                activeTab === "dashboard"
                  ? {
                      backgroundColor: `${ceoStyle.primaryHex}25`,
                      color: ceoStyle.primaryHex,
                      borderColor: `${ceoStyle.primaryHex}50`,
                      borderWidth: "1px",
                    }
                  : undefined
              }
            >
              <LayoutDashboard className="h-4 w-4" style={{ color: activeTab === "dashboard" ? ceoStyle.primaryHex : undefined }} />
              <span>Visão Geral</span>
            </TabsTrigger>

            <TabsTrigger
              value="bot"
              className="gap-2 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all"
              style={
                activeTab === "bot"
                  ? {
                      backgroundColor: `${ceoStyle.primaryHex}25`,
                      color: ceoStyle.primaryHex,
                      borderColor: `${ceoStyle.primaryHex}50`,
                      borderWidth: "1px",
                    }
                  : undefined
              }
            >
              <Bot className="h-4 w-4" style={{ color: activeTab === "bot" ? ceoStyle.primaryHex : undefined }} />
              <span>Gerenciar Bot</span>
            </TabsTrigger>

            <TabsTrigger
              value="webhooks"
              className="gap-2 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all"
              style={
                activeTab === "webhooks"
                  ? {
                      backgroundColor: `${ceoStyle.primaryHex}25`,
                      color: ceoStyle.primaryHex,
                      borderColor: `${ceoStyle.primaryHex}50`,
                      borderWidth: "1px",
                    }
                  : undefined
              }
            >
              <Webhook className="h-4 w-4" style={{ color: activeTab === "webhooks" ? ceoStyle.primaryHex : undefined }} />
              <span>Webhooks Discord</span>
            </TabsTrigger>

            <TabsTrigger
              value="financas"
              className="gap-2 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all"
              style={
                activeTab === "financas"
                  ? {
                      backgroundColor: `${ceoStyle.primaryHex}25`,
                      color: ceoStyle.primaryHex,
                      borderColor: `${ceoStyle.primaryHex}50`,
                      borderWidth: "1px",
                    }
                  : undefined
              }
            >
              <Landmark className="h-4 w-4" style={{ color: activeTab === "financas" ? ceoStyle.primaryHex : undefined }} />
              <span>Finanças</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =====================================================================
            ABA 1: VISÃO GERAL & MÉTRICAS
            ===================================================================== */}
        <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 duration-200">
          {/* CARDS DE MÉTRICAS EXECUTIVAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Faturamento Total */}
            <Card
              className="surface-card hover:shadow-md transition-all shadow-xs"
              style={{ borderColor: `${ceoStyle.primaryHex}35` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Faturamento de Vendas
                  </span>
                  <div
                    className="p-2 rounded-xl"
                    style={{
                      backgroundColor: `${ceoStyle.primaryHex}15`,
                      color: ceoStyle.primaryHex,
                      borderColor: `${ceoStyle.primaryHex}30`,
                      borderWidth: "1px",
                    }}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black" style={{ color: ceoStyle.primaryHex }}>
                  {currency(totalSalesRevenue)}
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">{sales.length}</span> vendas concluídas registradas
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Saldo Fundo de Caixa */}
            <Card className="surface-card border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Saldo do Fundo de Caixa
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-400">
                  {ceoConfig.showRealBalance || hasPermission("view_ceo_financials") ? currency(cashBalance) : "••••••••"}
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1 flex items-center gap-1">
                  Reserva estratégica do grupo
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Efetivo do grupo */}
            <Card className="surface-card border-border/80 hover:border-primary/50 transition-all shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Efetivo Total
                  </span>
                  <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">
                  {members.length} membros
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1 font-medium">{activeMembersCount} membros ativos</p>
              </CardContent>
            </Card>

            {/* Card 4: Status do Bot no Servidor VPS */}
            <Card className="surface-card border-indigo-500/30 hover:border-indigo-500/50 transition-all shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Bot Twin Wheels
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-black text-indigo-300 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bot Online & Operacional
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  Automação e logs Discord ativos em tempo real
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AÇÕES RÁPIDAS DE DIRETORIA & OPERAÇÕES RECENTES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bloco 1: Ações Rápidas de Comando */}
            <Card className="surface-card border-border/80">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <CeoIcon className="h-4 w-4" style={{ color: ceoStyle.primaryHex }} />
                  Ações Rápidas do CEO
                </CardTitle>
                <CardDescription className="text-xs">
                  Atalhos de comando direto para a diretoria.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {canUseWebhooks && (
                  <Button
                    type="button"
                    onClick={() => setTab("webhooks")}
                    className="w-full justify-start text-xs font-bold h-11 bg-gradient-to-r from-violet-600/20 to-pink-600/20 hover:from-violet-600/30 hover:to-pink-600/30 text-violet-300 border border-violet-500/40"
                  >
                    <Webhook className="h-4 w-4 mr-2 text-pink-400" />
                    Enviar Comunicado / Webhook no Discord
                  </Button>
                )}

                {canManageBot && (
                  <Button
                    type="button"
                    onClick={() => setTab("bot")}
                    className="w-full justify-start text-xs font-bold h-11 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-300 border border-indigo-500/40"
                  >
                    <Bot className="h-4 w-4 mr-2 text-indigo-400" />
                    Acessar Gestão do Bot Discord
                  </Button>
                )}

                {canViewFinancials && (
                  <Button
                    type="button"
                    onClick={() => setTab("financas")}
                    className="w-full justify-start text-xs font-bold h-11 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-300 border border-emerald-500/40"
                  >
                    <Landmark className="h-4 w-4 mr-2 text-emerald-400" />
                    Balanço do Fundo de Caixa
                  </Button>
                )}

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start text-xs font-bold h-11 border-border/80 hover:bg-secondary/60"
                >
                  <Link to="/membros">
                    <Users className="h-4 w-4 mr-2 text-amber-400" />
                    Gerenciamento Geral de Membros
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start text-xs font-bold h-11 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-300"
                >
                  <Link to="/lives">
                    <Radio className="h-4 w-4 mr-2 text-rose-400" />
                    Central de Lives & Streamers
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Bloco 2: Últimas Vendas do grupo */}
            <Card className="surface-card border-border/80 lg:col-span-2">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Últimas Vendas & Movimentações Comerciais
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Histórico em tempo real de negócios fechados pelo grupo.
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-xs font-bold h-8">
                    <Link to="/vendas">
                      Ver Todas <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loadingSales ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Carregando vendas...
                  </div>
                ) : sales.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhuma venda registrada até o momento.
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              Comprador: {sale.buyer_name}
                            </p>
                            <p className="text-[0.7rem] text-muted-foreground">
                              {dateTime(sale.created_at)} · {sale.quantity}x unidades
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400 font-mono block">
                            {currency(sale.total_price)}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            {sale.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =====================================================================
            ABA 2: GERENCIAR BOT DISCORD
            ===================================================================== */}
        {canManageBot ? (
          <TabsContent value="bot" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="surface-card border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      Gestão & Automação do Bot Discord
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                        Twin Wheels Bot
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Supervisione o status da aplicação, reinicie serviços e personalize mensagens e atividades em tempo real.
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono border-indigo-500/40 text-indigo-300 bg-indigo-500/10 self-start sm:self-auto py-1 px-3">
                  Host: Bot Discord Ativo
                </Badge>
              </CardContent>
            </Card>

            <DevBotManageCard isCeoView={true} />
          </TabsContent>
        ) : (
          <TabsContent value="bot" className="p-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-bold text-foreground">Acesso ao Módulo de Bot Restrito</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              O módulo de gerenciamento do bot está restrito para a sua conta ou desativado nas configurações do Painel Dev.
            </p>
          </TabsContent>
        )}

        {/* =====================================================================
            ABA 3: WEBHOOK DISCORD
            ===================================================================== */}
        {canUseWebhooks ? (
          <TabsContent value="webhooks" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="surface-card border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-pink-500/5 to-transparent">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/20">
                    <Webhook className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      Transmissão Executiva & Webhooks Discord
                      <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-[10px] font-bold">
                        Embeds Ricos
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Dispare avisos estratégicos, comunicados do grupo e sincronize registros diretamente nos canais de texto do Discord.
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono border-violet-500/40 text-violet-300 bg-violet-500/10 self-start sm:self-auto py-1 px-3">
                  Live Discord API
                </Badge>
              </CardContent>
            </Card>

            <DevWebhooksConfigCard isCeoView={true} />
          </TabsContent>
        ) : (
          <TabsContent value="webhooks" className="p-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-bold text-foreground">Acesso ao Módulo de Webhooks Restrito</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              O envio e gerenciamento de Webhooks do Discord está desativado para a sua conta ou restrito no Painel Dev.
            </p>
          </TabsContent>
        )}

        {/* =====================================================================
            ABA 4: FUNDO DE CAIXA & FINANÇAS
            ===================================================================== */}
        {canViewFinancials ? (
          <TabsContent value="financas" className="space-y-6 animate-in fade-in-50 duration-200">
            {/* CARDS DE RESUMO FINANCEIRO EXECUTIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="surface-card border-emerald-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Saldo Reservado
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-emerald-400">
                    {ceoConfig.showRealBalance || hasPermission("view_ceo_financials") ? currency(cashBalance) : "••••••••"}
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground mt-1">
                    Fundo de reserva disponível
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-card border-emerald-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Total de Entradas
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-emerald-400">
                    +{currency(totalEntradas)}
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground mt-1">
                    Depósitos e aportes acumulados
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-card border-rose-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Total de Retiradas
                    </span>
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-rose-400">
                    -{currency(totalSaidas)}
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground mt-1">
                    Saques e pagamentos realizados
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-card border-amber-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Receita de Vendas
                    </span>
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Crown className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-amber-300">
                    {currency(totalSalesRevenue)}
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground mt-1">
                    Faturamento comercial bruto
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* EXTRATO EXECUTIVO COM FILTRO */}
            <Card className="surface-card border-border/80">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black">
                        Extrato do Fundo de Caixa Executivo
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Auditagem completa de movimentações financeiras, depósitos e retiradas.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Filtros por tipo de movimentação */}
                    <div className="flex items-center bg-secondary/50 border border-border/60 p-1 rounded-xl gap-1">
                      <Button
                        type="button"
                        variant={financeFilter === "all" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFinanceFilter("all")}
                        className="text-xs h-7 px-2.5 font-bold"
                      >
                        Todas ({cashMovements.length})
                      </Button>
                      <Button
                        type="button"
                        variant={financeFilter === "entrada" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFinanceFilter("entrada")}
                        className="text-xs h-7 px-2.5 font-bold text-emerald-400"
                      >
                        Entradas (+)
                      </Button>
                      <Button
                        type="button"
                        variant={financeFilter === "saida" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFinanceFilter("saida")}
                        className="text-xs h-7 px-2.5 font-bold text-rose-400"
                      >
                        Saídas (-)
                      </Button>
                    </div>

                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8">
                      <Link to="/fundo-caixa">
                        Abrir Fundo de Caixa <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loadingCash ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Carregando movimentações de caixa...
                  </div>
                ) : filteredMovements.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhuma movimentação encontrada para o filtro selecionado.
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {filteredMovements.slice(0, 20).map((mov) => {
                      const isEntrada = mov.type === "entrada";

                      return (
                        <div key={mov.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "p-2 rounded-xl border",
                                isEntrada
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              )}
                            >
                              <DollarSign className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {(mov as any).reason || mov.motive || (isEntrada ? "Depósito no Caixa" : "Retirada do Caixa")}
                              </p>
                              <p className="text-[0.7rem] text-muted-foreground">
                                {dateTime(mov.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={cn(
                                "text-xs font-black font-mono block",
                                isEntrada ? "text-emerald-400" : "text-rose-400"
                              )}
                            >
                              {isEntrada ? "+" : "-"}{currency(mov.amount)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Saldo: {mov.status === "estornado" ? <span className="text-rose-400 italic">(Anulado)</span> : currency(mov.resulting_balance)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <TabsContent value="financas" className="p-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-bold text-foreground">Acesso ao Módulo Financeiro Restrito</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              A auditoria e visualização do fundo de caixa executivo está restrita para sua conta ou desativada no Painel Dev.
            </p>
          </TabsContent>
        )}
      </Tabs>

    </div>
  );
}
