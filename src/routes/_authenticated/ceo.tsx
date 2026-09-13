import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, useSales, useCashMovements } from "@/hooks/useData";
import { useUrlTab } from "@/hooks/useUrlTab";
import { CeoGuard } from "@/guards/CeoGuard";
import { DevBotManageCard } from "@/components/dev/DevBotManageCard";
import { DevWebhooksConfigCard } from "@/components/dev/DevWebhooksConfigCard";
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
  return (
    <CeoGuard>
      <CeoPageContent />
    </CeoGuard>
  );
}

function CeoPageContent() {
  const { user, profile, level, isDevUser, isCeoUser } = useAuth();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: cashMovements = [], isLoading: loadingCash } = useCashMovements();

  // Configuração da Tag CEO definida no Painel Dev
  const [ceoConfig, setCeoConfig] = useState<CeoConfiguration>(DEFAULT_CEO_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);

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

  // Abas do Painel CEO com sincronização de URL
  const { activeTab, setTab } = useUrlTab<"dashboard" | "bot" | "webhooks" | "financas">({
    paramName: "tab",
    defaultTab: "dashboard",
    allowedTabs: ["dashboard", "bot", "webhooks", "financas"],
  });

  // Métricas do Painel Executivo
  const totalSalesRevenue = useMemo(() => {
    return sales
      .filter((s) => s.status === "concluida")
      .reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
  }, [sales]);

  const cashBalance = useMemo(() => {
    if (!cashMovements.length) return 0;
    // O primeiro registro da lista é a movimentação mais recente com o saldo resultante
    return Number(cashMovements[0]?.resulting_balance || 0);
  }, [cashMovements]);

  const activeMembersCount = useMemo(() => {
    return members.filter((m) => m.status === "ativo").length;
  }, [members]);

  const onlineMembersCount = useMemo(() => {
    return members.filter((m) => m.presence_status === "online").length;
  }, [members]);

  // Permissões de módulos no Painel CEO (desenvolvedores sempre têm bypass)
  const canManageBot = isDevUser || ceoConfig.allowManageBot !== false;
  const canUseWebhooks = isDevUser || ceoConfig.allowWebhooks !== false;
  const canViewFinancials = isDevUser || ceoConfig.allowFinancials !== false;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14 animate-in fade-in-50 duration-300">
      {/* HEADER EXECUTIVO VIP OURO */}
      <PageHeader
        title="Painel Executivo — Tag CEO"
        description="Centro de comando da diretoria da Twin Wheels. Gerenciamento do bot, webhooks do Discord, fundo de caixa e operações estratégicas."
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs py-1.5 px-3 font-black gap-1.5 shadow-sm shadow-amber-500/10">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Diretoria Executiva VIP
            </Badge>

            {isDevUser && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs h-8 font-bold border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              >
                <Link to="/dev/permissoes">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Configurar no Painel Dev
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* BANNER VIP EXECUTIVO */}
      <Card className="surface-card border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Crown className="h-64 w-64 text-amber-400" />
        </div>

        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/20 shrink-0">
                <Crown className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    Diretoria Executiva · Twin Wheels
                  </h2>
                  <Badge className="bg-amber-500/25 text-amber-200 border-amber-500/50 text-[10px] font-extrabold uppercase">
                    👑 CEO Access
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Bem-vindo à sala de controle executivo. Aqui você comanda as automações do Discord,
                  transmissão de comunicados via Webhooks e acompanha a saúde financeira e operacional da facção.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-xl bg-background/80 border border-amber-500/30 text-center shadow-xs">
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Online Agora
                </span>
                <span className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  {onlineMembersCount}
                </span>
              </div>

              <div className="px-4 py-2 rounded-xl bg-background/80 border border-amber-500/30 text-center shadow-xs">
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Efetivo Ativo
                </span>
                <span className="text-lg font-black text-amber-300">
                  {activeMembersCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS NAVEGÁVEIS DO PAINEL CEO (Visível em telas mobile/tablet quando o menu lateral está recolhido) */}
      <Tabs value={activeTab} onValueChange={(val: any) => setTab(val)} className="space-y-6">
        <TabsList className="flex lg:hidden bg-secondary/40 border border-border/60 p-1 rounded-2xl flex-wrap h-auto gap-1">
          <TabsTrigger
            value="dashboard"
            className="text-xs font-bold gap-2 py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black"
          >
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral & Métricas
          </TabsTrigger>

          {canManageBot ? (
            <TabsTrigger
              value="bot"
              className="text-xs font-bold gap-2 py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Bot className="h-4 w-4" />
              Gerenciar Bot
            </TabsTrigger>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed">
              <Lock className="h-3 w-3" />
              Gerenciar Bot (Desativado pelo Dev)
            </div>
          )}

          {canUseWebhooks ? (
            <TabsTrigger
              value="webhooks"
              className="text-xs font-bold gap-2 py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Webhook className="h-4 w-4" />
              WebHook Discord
            </TabsTrigger>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed">
              <Lock className="h-3 w-3" />
              Webhooks (Desativado pelo Dev)
            </div>
          )}

          {canViewFinancials ? (
            <TabsTrigger
              value="financas"
              className="text-xs font-bold gap-2 py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
            >
              <Landmark className="h-4 w-4" />
              Fundo de Caixa & Finanças
            </TabsTrigger>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed">
              <Lock className="h-3 w-3" />
              Finanças (Desativado pelo Dev)
            </div>
          )}
        </TabsList>

        {/* =====================================================================
            ABA 1: VISÃO GERAL & MÉTRICAS
            ===================================================================== */}
        <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 duration-200">
          {/* CARDS DE MÉTRICAS EXECUTIVAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Faturamento Total */}
            <Card className="surface-card border-amber-500/30 hover:border-amber-500/50 transition-all shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Faturamento de Vendas
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-300">
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
                  {ceoConfig.showRealBalance || isDevUser ? currency(cashBalance) : "••••••••"}
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1 flex items-center gap-1">
                  Reserva estratégica da facção
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Efetivo da Facção */}
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
                <p className="text-[0.7rem] text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">{onlineMembersCount}</span> conectados agora
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Discloud Bot Status */}
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
                  Online no Discloud
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  Automação e logs Discord ativos
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
                  <Sparkles className="h-4 w-4 text-amber-400" />
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
              </CardContent>
            </Card>

            {/* Bloco 2: Últimas Vendas da Facção */}
            <Card className="surface-card border-border/80 lg:col-span-2">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Últimas Vendas & Movimentações Comerciais
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Histórico em tempo real de negócios fechados pela facção.
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
        {canManageBot && (
          <TabsContent value="bot" className="space-y-6 animate-in fade-in-50 duration-200">
            <DevBotManageCard />
          </TabsContent>
        )}

        {/* =====================================================================
            ABA 3: WEBHOOK DISCORD
            ===================================================================== */}
        {canUseWebhooks && (
          <TabsContent value="webhooks" className="space-y-6 animate-in fade-in-50 duration-200">
            <DevWebhooksConfigCard />
          </TabsContent>
        )}

        {/* =====================================================================
            ABA 4: FUNDO DE CAIXA & FINANÇAS
            ===================================================================== */}
        {canViewFinancials && (
          <TabsContent value="financas" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="surface-card border-border/80">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black">
                        Extrato do Fundo de Caixa Executivo
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Acompanhe os depósitos, saques e saldo reservado da facção.
                      </CardDescription>
                    </div>
                  </div>

                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8">
                    <Link to="/fundo-caixa">
                      Abrir Fundo de Caixa Completo <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loadingCash ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Carregando movimentações de caixa...
                  </div>
                ) : cashMovements.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhuma movimentação de caixa registrada.
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {cashMovements.slice(0, 8).map((mov) => {
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
                                {mov.reason || (isEntrada ? "Depósito no Caixa" : "Retirada do Caixa")}
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
                              Saldo: {currency(mov.resulting_balance)}
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
        )}
      </Tabs>
    </div>
  );
}
