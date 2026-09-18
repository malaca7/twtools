import React, { useState, useMemo } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import {
  Radio,
  Tv,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Gamepad2,
  Users,
  ExternalLink,
  Sparkles,
  Play,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  STREAM_PLATFORMS,
  type StreamSession,
  type StreamPlatform,
  type MemberStreamAccount,
} from "@/types/lives";
import {
  useStreamSessions,
  useMemberStreamAccounts,
  useEndStreamSession,
  useStartQuickStreamSession,
  useAutoLiveStreamPoller,
} from "@/hooks/useLives";
import { LiveCard } from "@/components/lives/LiveCard";
import { LinkStreamAccountModal } from "@/components/lives/LinkStreamAccountModal";
import { LiveStreamPlayerModal } from "@/components/lives/LiveStreamPlayerModal";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/lives")({
  component: LivesWrapper,
});

function LivesWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <LivesPage />;
}

export function LivesPage() {
  const { user, isDeveloper, hasPermission } = useAuth();

  if (!hasPermission("view_lives")) {
    return <NoAccess />;
  }
  const { data: allSessions = [], isLoading: isLoadingSessions, refetch: refetchSessions, isRefetching } = useStreamSessions();
  const { data: allAccounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useMemberStreamAccounts();
  const endLiveMutation = useEndStreamSession();
  const startQuickMutation = useStartQuickStreamSession();

  // Ativa o poller autônomo de detecção de lives em background
  useAutoLiveStreamPoller(45000);

  // Estados de Interface
  const [activeTab, setActiveTab] = useState<"online" | "history" | "streamers">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<"all" | StreamPlatform>("all");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedLinkPlatform, setSelectedLinkPlatform] = useState<StreamPlatform | null>(null);
  const [playerModalSession, setPlayerModalSession] = useState<StreamSession | null>(null);

  // Transmissão Rápida / Entrar Ao Vivo
  const [quickLiveOpen, setQuickLiveOpen] = useState(false);
  const [quickPlatform, setQuickPlatform] = useState<StreamPlatform>("twitch");
  const [quickChannel, setQuickChannel] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState("Grand Theft Auto V");

  // Filtra sessões ativas e histórico
  const activeSessions = useMemo(() => {
    return allSessions.filter((s) => s.is_live);
  }, [allSessions]);

  // Live ativa do membro atual e contas vinculadas
  const myActiveSession = useMemo(() => {
    return allSessions.find((s) => s.user_id === user?.id && s.is_live);
  }, [allSessions, user?.id]);

  const myLinkedAccounts = useMemo(() => {
    return allAccounts.filter((a) => a.user_id === user?.id);
  }, [allAccounts, user?.id]);

  const handleStartQuickLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickChannel.trim()) return;

    const cleanChannel = quickChannel.trim().replace(/^@/, "");
    const linkedAcc = myLinkedAccounts.find(
      (a) => a.platform === quickPlatform && a.channel_name.toLowerCase() === cleanChannel.toLowerCase()
    );

    await startQuickMutation.mutateAsync({
      platform: quickPlatform,
      channel_name: cleanChannel,
      streamer_name: user?.name || user?.email?.split("@")[0] || "Membro",
      title: quickTitle.trim() || `Transmissão de ${user?.name || "Membro"} • Twin Wheels GTA RP`,
      category: quickCategory.trim() || "Grand Theft Auto V",
      stream_account_id: linkedAcc?.id,
    });

    setQuickLiveOpen(false);
    setQuickTitle("");
  };

  const pastSessions = useMemo(() => {
    return allSessions.filter((s) => !s.is_live);
  }, [allSessions]);

  // Agrupamento de streamers vinculados por membro
  const memberStreamersGrouped = useMemo(() => {
    const map = new Map<string, { memberInfo: any; accounts: MemberStreamAccount[] }>();

    allAccounts.forEach((acc) => {
      const existing = map.get(acc.user_id);
      if (existing) {
        existing.accounts.push(acc);
      } else {
        map.set(acc.user_id, {
          memberInfo: {
            user_id: acc.user_id,
            name: acc.streamer_name || acc.display_name || "Membro",
            nickname: acc.streamer_nickname,
            avatar: acc.streamer_avatar,
            role: acc.streamer_role,
            gameId: acc.streamer_game_id,
          },
          accounts: [acc],
        });
      }
    });

    return Array.from(map.values());
  }, [allAccounts]);

  // Filtro de sessões ativas por busca e plataforma
  const filteredActiveSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      if (selectedPlatformFilter !== "all" && s.platform !== selectedPlatformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (s.title || "").toLowerCase().includes(q);
        const matchStreamer = (s.streamer_name || "").toLowerCase().includes(q);
        const matchChannel = (s.channel_name || "").toLowerCase().includes(q);
        const matchCategory = (s.category || "").toLowerCase().includes(q);
        return matchTitle || matchStreamer || matchChannel || matchCategory;
      }
      return true;
    });
  }, [activeSessions, selectedPlatformFilter, searchQuery]);

  // Filtro de histórico
  const filteredPastSessions = useMemo(() => {
    return pastSessions.filter((s) => {
      if (selectedPlatformFilter !== "all" && s.platform !== selectedPlatformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (s.title || "").toLowerCase().includes(q);
        const matchStreamer = (s.streamer_name || "").toLowerCase().includes(q);
        const matchChannel = (s.channel_name || "").toLowerCase().includes(q);
        const matchCategory = (s.category || "").toLowerCase().includes(q);
        return matchTitle || matchStreamer || matchChannel || matchCategory;
      }
      return true;
    });
  }, [pastSessions, selectedPlatformFilter, searchQuery]);

  // Filtro de streamers
  const filteredStreamers = useMemo(() => {
    return memberStreamersGrouped.filter((group) => {
      if (selectedPlatformFilter !== "all") {
        if (!group.accounts.some((a) => a.platform === selectedPlatformFilter)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (group.memberInfo.name || "").toLowerCase().includes(q);
        const matchNick = (group.memberInfo.nickname || "").toLowerCase().includes(q);
        const matchChannel = group.accounts.some((a) => a.channel_name.toLowerCase().includes(q));
        return matchName || matchNick || matchChannel;
      }
      return true;
    });
  }, [memberStreamersGrouped, selectedPlatformFilter, searchQuery]);

  const handleRefreshAll = () => {
    void refetchSessions();
    void refetchAccounts();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Lives & Transmissões"
          description="Acompanhe os membros da Twin Wheels ao vivo em diversas plataformas de streaming com detecção automática e alertas instantâneos."
        />

        <div className="flex flex-wrap items-center gap-2">
          {myActiveSession ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => endLiveMutation.mutate(myActiveSession.id)}
              disabled={endLiveMutation.isPending}
              className="h-9 text-xs font-extrabold gap-1.5 shadow-md shadow-rose-950/40"
            >
              <Radio className="h-4 w-4 animate-pulse text-white" />
              {endLiveMutation.isPending ? "Encerrando..." : "Encerrar Minha Live"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const defaultAcc = myLinkedAccounts[0];
                if (defaultAcc) {
                  setQuickPlatform(defaultAcc.platform);
                  setQuickChannel(defaultAcc.channel_name);
                }
                setQuickLiveOpen(true);
              }}
              className="h-9 text-xs font-bold gap-1.5 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 shadow-xs"
            >
              <Radio className="h-3.5 w-3.5 text-rose-500" />
              Entrar Ao Vivo
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefetching}
            className="h-9 text-xs font-bold gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setLinkModalOpen(true)}
            className="h-9 text-xs font-extrabold gap-1.5 bg-gradient-brand text-primary-foreground shadow-md hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Vincular Minha Live
          </Button>
        </div>
      </div>

      {/* STATUS DE MONITORAMENTO AUTOMÁTICO */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-300 font-bold">Detecção 100% Automática e Autônoma:</strong> Suporte nativo à Twitch, Kick, YouTube e TikTok sem exigir credenciais privadas. Suas transmissões são notificadas instantaneamente!
          </span>
        </div>
        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono font-bold shrink-0">
          Auto Online Monitor
        </Badge>
      </div>

      {/* MEUS CANAIS DE TRANSMISSÃO • VINCULAR CONTAS */}
      <div className="p-4 rounded-2xl bg-card/70 border border-border/70 backdrop-blur-md shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
              Meus Canais de Transmissão • Vincular Contas
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Vincule seus canais da Twitch, Kick, YouTube e TikTok para detecção automática de lives
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
            const p = STREAM_PLATFORMS[pKey];
            const linkedAcc = myLinkedAccounts.find((a) => a.platform === pKey && a.is_active);

            return (
              <button
                key={pKey}
                type="button"
                onClick={() => {
                  setSelectedLinkPlatform(pKey);
                  setLinkModalOpen(true);
                }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 group cursor-pointer hover:scale-[1.01] shadow-xs",
                  linkedAcc
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20"
                    : "bg-secondary/30 border-border/60 hover:bg-secondary/50 hover:border-primary/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: p.brandHex }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-black block truncate text-foreground">{p.name}</span>
                    <span className="text-[10px] block truncate font-mono">
                      {linkedAcc ? (
                        <span className="text-emerald-400 font-bold">@{linkedAcc.channel_name}</span>
                      ) : (
                        <span className="text-muted-foreground">Não conectado</span>
                      )}
                    </span>
                  </div>
                </div>

                {linkedAcc ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BANNER DE STATUS AO VIVO */}
      {activeSessions.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-red-900/20 to-zinc-900/50 border border-rose-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30 shrink-0">
              <Radio className="h-6 w-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {activeSessions.length} {activeSessions.length === 1 ? "Membro Ao Vivo" : "Membros Ao Vivo"} Agora
                </h3>
                <Badge className="bg-rose-500 text-white font-mono text-[10px] font-extrabold uppercase py-0.5">
                  ON AIR
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Integrantes da facção transmitindo operações, patrulhas e momentos na cidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("online")}
              className="h-8 text-xs font-bold border-rose-500/40 text-rose-300 hover:bg-rose-500/20 gap-1.5"
            >
              <Play className="h-3 w-3" />
              Ver Transmissões Ativas ({activeSessions.length})
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
            <span>Nenhum membro está ao vivo no momento. Assim que uma live iniciar, ela aparecerá aqui automaticamente.</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLinkModalOpen(true)}
            className="h-7 text-[11px] font-bold text-primary hover:underline"
          >
            Vincule seu canal
          </Button>
        </div>
      )}

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/70 shadow-xs">
        {/* BUSCA POR TEXTO */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por streamer, título da live ou jogo..."
            className="h-9 pl-9 text-xs bg-secondary/50 border-border/60"
          />
        </div>

        {/* CHIPS DE FILTRO DE PLATAFORMA */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedPlatformFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
              selectedPlatformFilter === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/70"
            )}
          >
            Todas ({activeTab === "online" ? activeSessions.length : activeTab === "history" ? pastSessions.length : memberStreamersGrouped.length})
          </button>

          {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
            const p = STREAM_PLATFORMS[pKey];
            const isSelected = selectedPlatformFilter === pKey;

            return (
              <button
                key={pKey}
                type="button"
                onClick={() => setSelectedPlatformFilter(pKey)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
                  isSelected
                    ? "bg-secondary/90 border-primary text-foreground shadow-xs ring-1 ring-primary/40"
                    : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.brandHex }}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ABAS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="bg-secondary/60 border border-border/60 p-1 rounded-xl inline-flex w-full sm:w-auto">
          <TabsTrigger
            value="online"
            className="gap-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs px-4 py-2"
          >
            <Radio className="h-3.5 w-3.5 text-rose-500" />
            Ao Vivo Agora ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs px-4 py-2"
          >
            <Clock className="h-3.5 w-3.5" />
            Últimas Lives ({pastSessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="streamers"
            className="gap-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs px-4 py-2"
          >
            <Users className="h-3.5 w-3.5" />
            Streamers da Facção ({memberStreamersGrouped.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: LIVES ONLINE AGORA */}
        <TabsContent value="online" className="space-y-6 animate-in fade-in-50 duration-200">
          {isLoadingSessions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video rounded-2xl bg-secondary/30 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : filteredActiveSessions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-3">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground">
                <Radio className="h-7 w-7 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Nenhuma transmissão ao vivo no momento</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {searchQuery || selectedPlatformFilter !== "all"
                    ? "Nenhuma live corresponde aos filtros selecionados. Tente limpar os filtros."
                    : "Os integrantes da Twin Wheels avisarão automaticamente quando iniciarem suas lives aqui."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkModalOpen(true)}
                className="text-xs font-bold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Vincular Meu Canal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActiveSessions.map((session) => (
                <LiveCard
                  key={session.id}
                  session={session}
                  onWatchModal={(s) => setPlayerModalSession(s)}
                  onEndLive={(id) => endLiveMutation.mutate(id)}
                  canManage={Boolean(isDeveloper || session.user_id === user?.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: HISTÓRICO DE TRANSMISSÕES */}
        <TabsContent value="history" className="space-y-6 animate-in fade-in-50 duration-200">
          {filteredPastSessions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-2">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
              <p className="text-sm font-bold text-foreground">Nenhuma transmissão no histórico recente</p>
              <p className="text-xs text-muted-foreground">
                O histórico das transmissões finalizadas ficará armazenado aqui para consulta.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastSessions.map((session) => (
                <LiveCard
                  key={session.id}
                  session={session}
                  onWatchModal={(s) => setPlayerModalSession(s)}
                  canManage={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 3: STREAMERS DA FACÇÃO */}
        <TabsContent value="streamers" className="space-y-6 animate-in fade-in-50 duration-200">
          {filteredStreamers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-2">
              <Users className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
              <p className="text-sm font-bold text-foreground">Nenhum streamer encontrado</p>
              <p className="text-xs text-muted-foreground">
                Seja o primeiro a vincular seu canal de streaming clicando em "Vincular Minha Live".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStreamers.map(({ memberInfo, accounts }) => {
                const isMemberLive = activeSessions.some((s) => s.user_id === memberInfo.user_id);

                return (
                  <Card
                    key={memberInfo.user_id}
                    className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 hover:border-primary/40 transition-all p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-12 w-12 border border-border shadow-xs shrink-0">
                          <AvatarImage src={memberInfo.avatar} alt={memberInfo.name} />
                          <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                            {memberInfo.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-foreground truncate">
                              {memberInfo.name}
                            </h4>
                            {isMemberLive && (
                              <Badge className="bg-rose-600 text-white font-mono text-[9px] py-0 px-1.5 animate-pulse">
                                AO VIVO
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {memberInfo.role || "Membro"}
                            </span>
                            {memberInfo.gameId && (
                              <span className="text-[10px] text-muted-foreground/70 font-mono">
                                • ID {memberInfo.gameId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CANAIS VINCULADOS DO MEMBRO */}
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Canais Cadastrados ({accounts.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {accounts.map((acc) => {
                          const pMeta = STREAM_PLATFORMS[acc.platform] || STREAM_PLATFORMS.twitch;

                          return (
                            <a
                              key={acc.id}
                              href={acc.channel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all hover:scale-102",
                                pMeta.badgeBg,
                                pMeta.badgeColor,
                                pMeta.borderColor
                              )}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: pMeta.brandHex }}
                              />
                              <span className="font-bold">{pMeta.name}</span>
                              <span className="font-mono text-[10px] opacity-80">@{acc.channel_name}</span>
                              <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL DE VINCULAÇÃO */}
      <LinkStreamAccountModal
        open={linkModalOpen}
        onOpenChange={(open) => {
          setLinkModalOpen(open);
          if (!open) setSelectedLinkPlatform(null);
        }}
        initialPlatform={selectedLinkPlatform}
      />

      {/* MODAL DE ENTRAR AO VIVO RÁPIDO */}
      <Dialog open={quickLiveOpen} onOpenChange={setQuickLiveOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl">
          <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                  Entrar Ao Vivo Agora
                  <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400">
                    Ao Vivo
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Publique sua transmissão instantaneamente e notifique toda a facção.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleStartQuickLive} className="p-6 space-y-4">
            {/* PLATAFORMA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Plataforma de Streaming</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
                  const p = STREAM_PLATFORMS[pKey];
                  const isSelected = quickPlatform === pKey;

                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => {
                        setQuickPlatform(pKey);
                        const matched = myLinkedAccounts.find((a) => a.platform === pKey);
                        if (matched) {
                          setQuickChannel(matched.channel_name);
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer gap-1",
                        isSelected
                          ? "bg-secondary/80 border-primary ring-1 ring-primary/40 shadow-xs text-foreground font-bold"
                          : "bg-secondary/20 border-border/60 hover:bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.brandHex }}
                      />
                      <span className="text-[11px] font-bold">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELEÇÃO OU INPUT DO CANAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Nome do Canal / Usuário</Label>
                {myLinkedAccounts.some((a) => a.platform === quickPlatform) && (
                  <span className="text-[10px] text-muted-foreground">Selecione canal salvo:</span>
                )}
              </div>

              {myLinkedAccounts.filter((a) => a.platform === quickPlatform).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {myLinkedAccounts
                    .filter((a) => a.platform === quickPlatform)
                    .map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setQuickChannel(acc.channel_name)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[11px] font-mono border cursor-pointer transition-colors",
                          quickChannel === acc.channel_name
                            ? "bg-primary/20 text-primary border-primary/40 font-bold"
                            : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        @{acc.channel_name}
                      </button>
                    ))}
                </div>
              )}

              <Input
                value={quickChannel}
                onChange={(e) => setQuickChannel(e.target.value)}
                placeholder={STREAM_PLATFORMS[quickPlatform].placeholder}
                className="h-9 text-xs bg-background/80 border-border/80"
                required
              />
            </div>

            {/* TÍTULO DA TRANSMISSÃO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Título da Live</Label>
              <Input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Ex: Patrulha Noturna • Twin Wheels RP"
                className="h-9 text-xs bg-background/80 border-border/80"
              />
            </div>

            {/* CATEGORIA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Jogo / Categoria</Label>
              <Input
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                placeholder="Grand Theft Auto V"
                className="h-9 text-xs bg-background/80 border-border/80"
              />
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickLiveOpen(false)}
                className="text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={startQuickMutation.isPending || !quickChannel.trim()}
                className="text-xs font-extrabold gap-2 bg-gradient-brand text-primary-foreground shadow-md hover:opacity-95"
              >
                {startQuickMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4 text-white animate-pulse" />
                )}
                {startQuickMutation.isPending ? "Publicando Live..." : "Entrar Ao Vivo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PLAYER EMBUTIDO */}
      <LiveStreamPlayerModal
        session={playerModalSession}
        open={Boolean(playerModalSession)}
        onOpenChange={(open) => {
          if (!open) setPlayerModalSession(null);
        }}
      />
    </div>
  );
}
