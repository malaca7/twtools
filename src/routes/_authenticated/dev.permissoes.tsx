import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Code2,
  Crown,
  Loader2,
  CheckCircle2,
  Search,
  Users,
  ShieldAlert,
  Sparkles,
  Bot,
  Webhook,
  Landmark,
  Megaphone,
  Wallet,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import {
  getDevPermissions,
  saveDevPermissions,
  getCeoTagPermissions,
  saveCeoTagPermissions,
  getCeoConfiguration,
  saveCeoConfiguration,
  toggleMemberCeoTag,
  toggleMemberDevTag,
  DEFAULT_CEO_PERMISSIONS,
  type CeoConfiguration,
  DEFAULT_CEO_CONFIG,
} from "@/services/devService";
import { ALL_PERMISSIONS, getLevelLabel, levelBadgeClass, type Permission } from "@/lib/permissions";
import {
  PAGE_CARDS,
  READ_ONLY_PERMISSIONS,
} from "@/lib/permissionCards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dev/permissoes")({
  component: DevPermissoesPageWrapper,
});

function DevPermissoesPageWrapper() {
  return (
    <DeveloperGuard>
      <DevPermissoesContent />
    </DeveloperGuard>
  );
}

function DevPermissoesContent() {
  const { user, profile, level, isDevUser } = useAuth();
  const { config: menuConfig } = useMenuConfig();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const queryClient = useQueryClient();

  // Aba ativa: Tag Dev vs Tag CEO
  const [activeTab, setActiveTab] = useState<"dev" | "ceo">("dev");

  // Refs para evitar recarregamento repetido e piscadas da tela
  const devInitialLoadedRef = useRef(false);
  const ceoInitialLoadedRef = useRef(false);

  // Estado das Permissões da Tag Dev
  const [activeDevPermissions, setActiveDevPermissions] = useState<Permission[]>(ALL_PERMISSIONS);
  const [isDevSyncing, setIsDevSyncing] = useState(false);
  const [loadingDev, setLoadingDev] = useState(true);

  // Estado das Permissões da Tag CEO
  const [activeCeoPermissions, setActiveCeoPermissions] = useState<Permission[]>(
    DEFAULT_CEO_PERMISSIONS as Permission[]
  );
  const [ceoConfig, setCeoConfig] = useState<CeoConfiguration>(DEFAULT_CEO_CONFIG);
  const [isCeoSyncing, setIsCeoSyncing] = useState(false);
  const [loadingCeo, setLoadingCeo] = useState(true);

  // Gestão de membros com Tag Dev
  const [searchDevMember, setSearchDevMember] = useState("");
  const [filterDevOnly, setFilterDevOnly] = useState<"all" | "dev_only">("all");

  // Gestão de membros com Tag CEO
  const [searchMember, setSearchMember] = useState("");
  const [filterCeoOnly, setFilterCeoOnly] = useState<"all" | "ceo_only">("all");
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);

  // 1. Carrega as permissões da Tag Dev ao inicializar sem resetar o layout
  useEffect(() => {
    let isMounted = true;
    if (!devInitialLoadedRef.current) {
      setLoadingDev(true);
    }

    getDevPermissions(user, profile, level)
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const keys: Permission[] = [];
          data.forEach((item: any) => {
            const val = typeof item === "string" ? item : item.id;
            if (val && ALL_PERMISSIONS.includes(val as Permission)) {
              keys.push(val as Permission);
            }
          });
          setActiveDevPermissions(keys);
          devInitialLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (isMounted) setActiveDevPermissions(ALL_PERMISSIONS);
      })
      .finally(() => {
        if (isMounted) setLoadingDev(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, level]);

  // 2. Carrega as permissões e configuração da Tag CEO
  useEffect(() => {
    let isMounted = true;
    if (!ceoInitialLoadedRef.current) {
      setLoadingCeo(true);
    }

    Promise.all([
      getCeoTagPermissions(user, profile, level),
      getCeoConfiguration(user, profile, level),
    ])
      .then(([perms, config]) => {
        if (isMounted) {
          if (Array.isArray(perms) && perms.length > 0) {
            const valid = perms.filter((p) => ALL_PERMISSIONS.includes(p as Permission)) as Permission[];
            setActiveCeoPermissions(valid.length > 0 ? valid : (DEFAULT_CEO_PERMISSIONS as Permission[]));
          }
          if (config) {
            setCeoConfig(config);
          }
          ceoInitialLoadedRef.current = true;
        }
      })
      .catch((err) => {
        console.warn("Erro ao carregar dados da Tag CEO:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingCeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, level]);

  // Agrupa os cards de páginas dinamicamente seguindo a ordem do menu
  const getGroupedPageCards = useCallback((tab: "dev" | "ceo") => {
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const baseCategories = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Operação", "Gestão", "Administração"];

    // Na aba da Tag CEO, a categoria "CEO" e as permissões do Painel CEO ficam no topo absoluto
    const categoryOrder =
      tab === "ceo"
        ? ["CEO", ...baseCategories.filter((c) => c !== "CEO")]
        : [...baseCategories.filter((c) => c !== "CEO"), "CEO"];

    const customized = PAGE_CARDS.map((card) => {
      const cfg = configMap.get(card.id);
      return {
        ...card,
        title: cfg?.title || card.title,
        category: cfg?.category || card.defaultCat,
        order: typeof cfg?.order === "number" ? cfg.order : card.defaultOrder,
      };
    });

    const groups: { category: string; cards: typeof customized }[] = [];

    categoryOrder.forEach((cat) => {
      const catCards = customized
        .filter((c) => c.category === cat)
        .sort((a, b) => a.order - b.order);
      if (catCards.length > 0) {
        groups.push({ category: cat, cards: catCards });
      }
    });

    const knownCats = new Set(categoryOrder);
    customized.forEach((card) => {
      if (!knownCats.has(card.category)) {
        knownCats.add(card.category);
        const catCards = customized
          .filter((c) => c.category === card.category)
          .sort((a, b) => a.order - b.order);
        if (catCards.length > 0) {
          groups.push({ category: card.category, cards: catCards });
        }
      }
    });

    return groups;
  }, [menuConfig]);

  const groupedPageCards = useMemo(() => getGroupedPageCards(activeTab), [getGroupedPageCards, activeTab]);

  // Sincronização e autosave da Tag Dev
  const autoSaveDevTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsDevSyncing(true);
      try {
        await saveDevPermissions(nextPerms, user, profile, level);
        void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag Dev.");
      } finally {
        setIsDevSyncing(false);
      }
    },
    [user, profile, level, queryClient]
  );

  // Sincronização e autosave da Tag CEO
  const autoSaveCeoTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsCeoSyncing(true);
      try {
        await saveCeoTagPermissions(nextPerms, user, profile, level);
        void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag CEO.");
      } finally {
        setIsCeoSyncing(false);
      }
    },
    [user, profile, level, queryClient]
  );

  // Atualiza e sincroniza as configurações de módulos do Painel CEO
  const handleUpdateCeoConfig = useCallback(
    async (partial: Partial<CeoConfiguration>) => {
      const updated: CeoConfiguration = {
        ...ceoConfig,
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      setCeoConfig(updated);
      setIsCeoSyncing(true);
      try {
        await saveCeoConfiguration(updated, user, profile, level);
        void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
        toast.success("Configuração do Painel CEO atualizada com sucesso! 👑");
      } catch (err: any) {
        toast.error(err?.message || "Falha ao salvar configuração do Painel CEO.");
      } finally {
        setIsCeoSyncing(false);
      }
    },
    [ceoConfig, user, profile, level, queryClient]
  );

  // Handlers para Tag Dev
  const toggleDevPermission = (permKey: Permission) => {
    const next = activeDevPermissions.includes(permKey)
      ? activeDevPermissions.filter((p) => p !== permKey)
      : [...activeDevPermissions, permKey];
    setActiveDevPermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  const setAllDevPermissions = () => {
    setActiveDevPermissions([...ALL_PERMISSIONS]);
    void autoSaveDevTagPermissions([...ALL_PERMISSIONS]);
  };

  const setReadOnlyDevPermissions = () => {
    setActiveDevPermissions([...READ_ONLY_PERMISSIONS]);
    void autoSaveDevTagPermissions([...READ_ONLY_PERMISSIONS]);
  };

  const clearAllDevPermissions = () => {
    const next: Permission[] = [];
    setActiveDevPermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  // Handlers para Tag CEO
  const toggleCeoPermission = (permKey: Permission) => {
    const next = activeCeoPermissions.includes(permKey)
      ? activeCeoPermissions.filter((p) => p !== permKey)
      : [...activeCeoPermissions, permKey];
    setActiveCeoPermissions(next);
    void autoSaveCeoTagPermissions(next);
  };

  const setAllCeoPermissions = () => {
    setActiveCeoPermissions([...ALL_PERMISSIONS]);
    void autoSaveCeoTagPermissions([...ALL_PERMISSIONS]);
  };

  const setExecutiveCeoPermissions = () => {
    const next = (DEFAULT_CEO_PERMISSIONS as Permission[]).filter((p) =>
      ALL_PERMISSIONS.includes(p)
    );
    setActiveCeoPermissions(next);
    void autoSaveCeoTagPermissions(next);
  };

  const setReadOnlyCeoPermissions = () => {
    setActiveCeoPermissions([...READ_ONLY_PERMISSIONS]);
    void autoSaveCeoTagPermissions([...READ_ONLY_PERMISSIONS]);
  };

  const clearAllCeoPermissions = () => {
    const next: Permission[] = [];
    setActiveCeoPermissions(next);
    void autoSaveCeoTagPermissions(next);
  };

  // Atribuição de Tag Dev com verificação e feedback
  const handleToggleDevTag = async (targetUserId: string, currentStatus: boolean, memberName: string) => {
    if (!isDevUser) {
      toast.error("Acesso Negado: Apenas membros com a Tag Dev podem alterar a Tag Dev.");
      return;
    }

    setTogglingMemberId(targetUserId);
    try {
      const nextStatus = !currentStatus;
      await toggleMemberDevTag(targetUserId, nextStatus, user, profile, level);

      // Invalidação das queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["members"] }),
        queryClient.invalidateQueries({ queryKey: ["auth_session"] }),
        queryClient.invalidateQueries({ queryKey: ["auth"] }),
      ]);

      toast.success(
        nextStatus
          ? `Tag Dev concedida com sucesso para ${memberName}! 💻`
          : `Tag Dev revogada de ${memberName}.`,
        { icon: nextStatus ? "💻" : "🛡️" }
      );
    } catch (err: any) {
      toast.error(err?.message || "Falha ao alterar Tag Dev do membro.");
    } finally {
      setTogglingMemberId(null);
    }
  };

  // Atribuição de Tag CEO com verificação e feedback
  const handleToggleCeoTag = async (targetUserId: string, currentStatus: boolean, memberName: string) => {
    if (!isDevUser) {
      toast.error("Acesso Negado: Apenas membros com a Tag Dev podem alterar a Tag CEO.");
      return;
    }

    setTogglingMemberId(targetUserId);
    try {
      const nextStatus = !currentStatus;
      await toggleMemberCeoTag(targetUserId, nextStatus, user, profile, level);

      // Invalidação das queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["members"] }),
        queryClient.invalidateQueries({ queryKey: ["auth_session"] }),
        queryClient.invalidateQueries({ queryKey: ["auth"] }),
      ]);

      toast.success(
        nextStatus
          ? `Tag CEO concedida com sucesso para ${memberName}! 👑`
          : `Tag CEO revogada de ${memberName}.`,
        { icon: nextStatus ? "👑" : "🛡️" }
      );
    } catch (err: any) {
      toast.error(err?.message || "Falha ao alterar Tag CEO do membro.");
    } finally {
      setTogglingMemberId(null);
    }
  };

  // Membros filtrados para a gestão rápida da Tag Dev
  const activeDevsCount = useMemo(() => {
    return members.filter((m) => Boolean(m.is_developer || m.nivel === "desenvolvedor")).length;
  }, [members]);

  const filteredDevMembers = useMemo(() => {
    return members.filter((m) => {
      const isDev = Boolean(m.is_developer || m.nivel === "desenvolvedor");
      if (filterDevOnly === "dev_only" && !isDev) return false;

      if (!searchDevMember.trim()) return true;
      const q = searchDevMember.toLowerCase();
      const nome = (m.nome || "").toLowerCase();
      const nick = (m.nickname || "").toLowerCase();
      const gameId = (m.game_id || "").toLowerCase();
      const cargo = (getLevelLabel(m.nivel) || "").toLowerCase();
      return nome.includes(q) || nick.includes(q) || gameId.includes(q) || cargo.includes(q);
    });
  }, [members, searchDevMember, filterDevOnly]);

  // Membros filtrados para a gestão rápida da Tag CEO
  const activeCeosCount = useMemo(() => {
    return members.filter((m) => Boolean(m.is_ceo || m.custom_theme?.is_ceo)).length;
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const isCeo = Boolean(m.is_ceo || m.custom_theme?.is_ceo);
      if (filterCeoOnly === "ceo_only" && !isCeo) return false;

      if (!searchMember.trim()) return true;
      const q = searchMember.toLowerCase();
      const nome = (m.nome || "").toLowerCase();
      const nick = (m.nickname || "").toLowerCase();
      const gameId = (m.game_id || "").toLowerCase();
      const cargo = (getLevelLabel(m.nivel) || "").toLowerCase();
      return nome.includes(q) || nick.includes(q) || gameId.includes(q) || cargo.includes(q);
    });
  }, [members, searchMember, filterCeoOnly]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <PageHeader
        title={
          activeTab === "dev"
            ? "Dev → Permissões da Tag Desenvolvedor"
            : "Dev → Configuração & Permissões da Tag CEO"
        }
        description={
          activeTab === "dev"
            ? "Configure as permissões operacionais vinculadas exclusivamente à Tag Desenvolvedor [Dev System 💻] e gerencie os membros com a tag ativa. As permissões se somam às do cargo do membro."
            : "Configure a matriz de permissões da Tag CEO [Diretoria Executiva 👑] e gerencie quais membros possuem a tag. Apenas usuários com a Tag Dev têm autorização para atribuir a Tag CEO."
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-xs py-1.5 px-3 gap-1.5 font-bold transition-all",
                activeTab === "dev"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              )}
            >
              {(activeTab === "dev" ? isDevSyncing : isCeoSyncing) ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2
                  className={cn(
                    "h-3.5 w-3.5",
                    activeTab === "dev" ? "text-rose-400" : "text-amber-400"
                  )}
                />
              )}
              {(activeTab === "dev" ? isDevSyncing : isCeoSyncing)
                ? "Sincronizando..."
                : "Sincronizado em Tempo Real"}
            </Badge>
          </div>
        }
      />

      {/* SELETOR DE ABAS MODERNAS: TAG DEV vs TAG CEO */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-secondary/40 rounded-2xl border border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("dev")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab === "dev"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Code2 className="h-4 w-4 text-rose-400" />
            Tag Desenvolvedor
            <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10 py-0 px-1.5 ml-1">
              Dev System ({activeDevsCount})
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ceo")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab === "ceo"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Crown className="h-4 w-4 text-amber-400" />
            Tag CEO
            <Badge
              variant="outline"
              className="text-[9px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10 py-0 px-1.5 ml-1"
            >
              VIP Ouro ({activeCeosCount})
            </Badge>
          </button>
        </div>

        <div className="text-[0.75rem] text-muted-foreground px-2 font-medium flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          Acesso e gerenciamento restritos à Tag Dev
        </div>
      </div>

      {/* =========================================================================
          ABA 1: TAG DESENVOLVEDOR
          ========================================================================= */}
      {activeTab === "dev" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Informativo Tag Dev Aditiva */}
          <Card className="surface-card border-rose-500/30 bg-rose-500/5">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shrink-0">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      Tag Desenvolvedor — Acesso Total ao Sistema
                      <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold">
                        Dev System
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      As permissões marcadas abaixo são concedidas aos integrantes com a tag <strong>desenvolvedor</strong> e se somam aos privilégios do cargo.
                      O status da Tag Dev é controlado de forma 100% dinâmica pelo interruptor abaixo.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-background/60 border border-rose-500/30 text-center">
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Devs Ativos
                    </span>
                    <span className="text-lg font-black text-rose-400">
                      {activeDevsCount}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* SEÇÃO 1 (DEV): GERENCIAMENTO E ATRIBUIÇÃO DIRETA DE MEMBROS */}
          <Card className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Users className="h-4 w-4 text-rose-400" />
                    Membros da Facção & Atribuição da Tag Dev
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ative ou desative a Tag Dev instantaneamente para qualquer integrante com 1 clique.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, ID ou cargo..."
                      value={searchDevMember}
                      onChange={(e) => setSearchDevMember(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background/50"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-lg border border-border/60">
                    <button
                      type="button"
                      onClick={() => setFilterDevOnly("all")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                        filterDevOnly === "all"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Todos ({members.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterDevOnly("dev_only")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1",
                        filterDevOnly === "dev_only"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      💻 Devs ({activeDevsCount})
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {loadingMembers ? (
                <div className="py-8 flex items-center justify-center text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-400 mr-2" />
                  <span className="text-xs text-muted-foreground">Carregando lista de membros...</span>
                </div>
              ) : filteredDevMembers.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-xl border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Nenhum membro encontrado com os filtros aplicados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredDevMembers.map((member) => {
                    const isDev = Boolean(member.is_developer || member.nivel === "desenvolvedor");
                    const isCeo = Boolean(member.is_ceo || member.custom_theme?.is_ceo);
                    const isToggling = togglingMemberId === member.user_id;

                    return (
                      <div
                        key={member.user_id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all",
                          isDev
                            ? "bg-rose-500/10 border-rose-500/40 shadow-xs"
                            : "bg-secondary/20 border-border/60 hover:bg-secondary/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar_url || member.discord_avatar_url || "/placeholder-avatar.png"}
                            alt={member.nome}
                            className={cn(
                              "h-9 w-9 rounded-full object-cover border shrink-0",
                              isDev ? "border-rose-400 ring-2 ring-rose-500/30" : "border-border"
                            )}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-bold text-foreground truncate">
                                {member.nickname || member.nome}
                              </span>
                              {isDev && (
                                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 text-[9px] py-0 px-1 font-bold shrink-0">
                                  💻 DEV
                                </Badge>
                              )}
                              {isCeo && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] py-0 px-1 font-bold shrink-0">
                                  👑 CEO
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] py-0 px-1.5 font-medium", levelBadgeClass(member.nivel))}
                              >
                                {getLevelLabel(member.nivel)}
                              </Badge>
                              {member.game_id && (
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  ID: {member.game_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                          ) : (
                            <Switch
                              id={`dev-toggle-${member.user_id}`}
                              checked={isDev}
                              onCheckedChange={() =>
                                handleToggleDevTag(member.user_id, isDev, member.nickname || member.nome)
                              }
                              className="data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-400"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Barra de Controles Rápidos Tag Dev */}
          <Card className="surface-card p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-foreground">Matriz de Privilégios da Tag Dev</h3>
                    <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                      Dev System
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeDevPermissions.length} de {ALL_PERMISSIONS.length} permissões ativadas para a Tag Dev
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setAllDevPermissions}
                  className="text-xs h-8 font-bold border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  Marcar Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setReadOnlyDevPermissions}
                  className="text-xs h-8 font-bold border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                >
                  Apenas Leitura
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllDevPermissions}
                  className="text-xs h-8 font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Limpar Todas
                </Button>
              </div>
            </div>
          </Card>

          {/* Módulos de Permissões Tag Dev */}
          {loadingDev ? (
            <div className="flex items-center justify-center p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
                <p className="text-xs text-muted-foreground font-medium">Carregando permissões da Tag Dev...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedPageCards.map(({ category, cards }) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400/90">
                      {category}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      ({cards.length} {cards.length === 1 ? "módulo" : "módulos"})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => {
                      const cardPermKeys = card.permissions.map((p) => p.key);
                      const activeInCard = cardPermKeys.filter((k) => activeDevPermissions.includes(k)).length;
                      const isAllActive = activeInCard === cardPermKeys.length;
                      const Icon = card.icon;

                      return (
                        <Card
                          key={card.id}
                          className={cn(
                            "surface-card transition-all duration-200 border hover:border-rose-500/30",
                            activeInCard > 0 ? "border-border/80" : "opacity-80"
                          )}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl border shrink-0", card.color)}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-bold text-foreground">
                                    {card.title}
                                  </CardTitle>
                                  <CardDescription className="text-[0.7rem] line-clamp-1">
                                    {card.description}
                                  </CardDescription>
                                </div>
                              </div>

                              <Badge
                                variant={isAllActive ? "default" : activeInCard > 0 ? "outline" : "secondary"}
                                className="text-[10px] font-mono shrink-0"
                              >
                                {activeInCard}/{cardPermKeys.length}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3 pt-0">
                            {card.permissions.map((perm) => {
                              const isChecked = activeDevPermissions.includes(perm.key);

                              return (
                                <div
                                  key={perm.key}
                                  role="checkbox"
                                  aria-checked={isChecked}
                                  tabIndex={0}
                                  onClick={() => toggleDevPermission(perm.key)}
                                  onKeyDown={(e) => {
                                    if (e.key === " " || e.key === "Enter") {
                                      e.preventDefault();
                                      toggleDevPermission(perm.key);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 hover:scale-[1.008] active:scale-[0.99]",
                                    isChecked
                                      ? "bg-rose-500/10 border-rose-500/50 shadow-sm shadow-rose-500/15 text-foreground"
                                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-rose-500/30 text-muted-foreground"
                                  )}
                                >
                                  <Checkbox
                                    id={`dev-${perm.key}`}
                                    checked={isChecked}
                                    tabIndex={-1}
                                    className="mt-0.5 pointer-events-none rounded border-rose-500/40 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                  />

                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-foreground block truncate">
                                        {perm.label}
                                      </span>
                                      {perm.badge && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-mono py-0 px-1.5 border-rose-500/30 text-rose-400 shrink-0"
                                        >
                                          {perm.badge}
                                        </Badge>
                                      )}
                                      <Badge
                                        variant={isChecked ? "default" : "outline"}
                                        className={cn(
                                          "ml-auto text-[9px] font-mono py-0 px-1.5 shrink-0 transition-colors",
                                          isChecked
                                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                            : "text-muted-foreground/60 border-border/40"
                                        )}
                                      >
                                        {isChecked ? "Ativo" : "Inativo"}
                                      </Badge>
                                    </div>
                                    <p className="text-[0.68rem] text-muted-foreground leading-snug">
                                      {perm.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 2: TAG CEO (DIRETORIA EXECUTIVA / VIP OURO)
          ========================================================================= */}
      {activeTab === "ceo" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Informativo Tag CEO */}
          <Card className="surface-card border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20 shrink-0">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      Tag CEO — Diretoria Executiva VIP
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                        👑 Ouro VIP
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      A Tag CEO concede distinção VIP com emblema dourado em perfis, chat e lista de membros.
                      Toda a matriz de permissões abaixo se soma ao cargo do membro, e <strong>apenas Desenvolvedores com a Tag Dev têm o poder de atribuir ou revogar a Tag CEO</strong>.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-background/60 border border-amber-500/30 text-center">
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                      CEOs Ativos
                    </span>
                    <span className="text-lg font-black text-amber-300">
                      {activeCeosCount}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* SEÇÃO 1 (CEO): GERENCIAMENTO E ATRIBUIÇÃO DIRETA DE MEMBROS */}
          <Card className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-400" />
                    Membros da Facção & Atribuição da Tag CEO
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ative ou desative a Tag CEO instantaneamente para qualquer integrante com 1 clique.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, ID ou cargo..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background/50"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-lg border border-border/60">
                    <button
                      type="button"
                      onClick={() => setFilterCeoOnly("all")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                        filterCeoOnly === "all"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Todos ({members.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterCeoOnly("ceo_only")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1",
                        filterCeoOnly === "ceo_only"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      👑 CEOs ({activeCeosCount})
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {loadingMembers ? (
                <div className="py-8 flex items-center justify-center text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400 mr-2" />
                  <span className="text-xs text-muted-foreground">Carregando lista de membros...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-xl border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Nenhum membro encontrado com os filtros aplicados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredMembers.map((member) => {
                    const isCeo = Boolean(member.is_ceo || member.custom_theme?.is_ceo);
                    const isDev = Boolean(member.is_developer || member.nivel === "desenvolvedor");
                    const isToggling = togglingMemberId === member.user_id;

                    return (
                      <div
                        key={member.user_id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all",
                          isCeo
                            ? "bg-amber-500/10 border-amber-500/40 shadow-xs"
                            : "bg-secondary/20 border-border/60 hover:bg-secondary/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar_url || member.discord_avatar_url || "/placeholder-avatar.png"}
                            alt={member.nome}
                            className={cn(
                              "h-9 w-9 rounded-full object-cover border shrink-0",
                              isCeo ? "border-amber-400 ring-2 ring-amber-500/30" : "border-border"
                            )}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-bold text-foreground truncate">
                                {member.nickname || member.nome}
                              </span>
                              {isCeo && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] py-0 px-1 font-bold shrink-0">
                                  👑 CEO
                                </Badge>
                              )}
                              {isDev && (
                                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 text-[9px] py-0 px-1 font-bold shrink-0">
                                  💻 DEV
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] py-0 px-1.5 font-medium", levelBadgeClass(member.nivel))}
                              >
                                {getLevelLabel(member.nivel)}
                              </Badge>
                              {member.game_id && (
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  ID: {member.game_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                          ) : (
                            <Switch
                              id={`ceo-toggle-${member.user_id}`}
                              checked={isCeo}
                              onCheckedChange={() =>
                                handleToggleCeoTag(member.user_id, isCeo, member.nickname || member.nome)
                              }
                              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-400"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEÇÃO 2 (CEO): MÓDULOS E RECURSOS DO PAINEL CEO */}
          <Card className="surface-card border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-transparent shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs shrink-0">
                    <Sliders className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      Módulos & Recursos do Painel CEO (/ceo)
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                        Configuração Executiva
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Controle quais funcionalidades avançadas e módulos os membros com a Tag CEO podem acessar no Painel Executivo.
                      Apenas Desenvolvedores têm permissão para ativar ou desativar esses recursos.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 font-bold border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1.5"
                  >
                    <Link to="/ceo" target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visualizar Painel CEO
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Switch 1: Gerenciar Bot */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleUpdateCeoConfig({ allowManageBot: !(ceoConfig.allowManageBot !== false) })}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateCeoConfig({ allowManageBot: !(ceoConfig.allowManageBot !== false) });
                    }
                  }}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 hover:scale-[1.008] active:scale-[0.99]",
                    ceoConfig.allowManageBot !== false
                      ? "bg-indigo-500/10 border-indigo-500/50 shadow-sm shadow-indigo-500/15"
                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-indigo-500/30 opacity-75"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Bot className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">Gerenciar Bot Discloud</span>
                      </div>
                      <Switch
                        id="ceo-cfg-bot"
                        checked={ceoConfig.allowManageBot !== false}
                        tabIndex={-1}
                        className="pointer-events-none data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-400"
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                      Permite ao CEO monitorar status da instância no Discloud, visualizar servidores mútuos e reiniciar o bot em contingências.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[0.68rem]">
                    <span className="text-muted-foreground font-mono">Aba: /ceo?tab=bot</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", ceoConfig.allowManageBot !== false ? "text-indigo-400 border-indigo-500/40" : "text-muted-foreground")}>
                      {ceoConfig.allowManageBot !== false ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                </div>

                {/* Switch 2: WebHook Discord */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleUpdateCeoConfig({ allowWebhooks: !(ceoConfig.allowWebhooks !== false) })}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateCeoConfig({ allowWebhooks: !(ceoConfig.allowWebhooks !== false) });
                    }
                  }}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 hover:scale-[1.008] active:scale-[0.99]",
                    ceoConfig.allowWebhooks !== false
                      ? "bg-violet-500/10 border-violet-500/50 shadow-sm shadow-violet-500/15"
                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-violet-500/30 opacity-75"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          <Webhook className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">WebHook Discord</span>
                      </div>
                      <Switch
                        id="ceo-cfg-webhooks"
                        checked={ceoConfig.allowWebhooks !== false}
                        tabIndex={-1}
                        className="pointer-events-none data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-400"
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                      Permite ao CEO gerenciar canais de webhook, testar integrações e disparar anúncios ricos e comunicados diretamente pelo Discord.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[0.68rem]">
                    <span className="text-muted-foreground font-mono">Aba: /ceo?tab=webhooks</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", ceoConfig.allowWebhooks !== false ? "text-violet-400 border-violet-500/40" : "text-muted-foreground")}>
                      {ceoConfig.allowWebhooks !== false ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                </div>

                {/* Switch 3: Fundo de Caixa & Finanças */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleUpdateCeoConfig({ allowFinancials: !(ceoConfig.allowFinancials !== false) })}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateCeoConfig({ allowFinancials: !(ceoConfig.allowFinancials !== false) });
                    }
                  }}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 hover:scale-[1.008] active:scale-[0.99]",
                    ceoConfig.allowFinancials !== false
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/15"
                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-emerald-500/30 opacity-75"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">Fundo de Caixa & Finanças</span>
                      </div>
                      <Switch
                        id="ceo-cfg-financials"
                        checked={ceoConfig.allowFinancials !== false}
                        tabIndex={-1}
                        className="pointer-events-none data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-400"
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                      Permite ao CEO auditar o extrato consolidado de movimentações financeiras, entradas, saídas e o saldo global da facção.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[0.68rem]">
                    <span className="text-muted-foreground font-mono">Aba: /ceo?tab=financas</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", ceoConfig.allowFinancials !== false ? "text-emerald-400 border-emerald-500/40" : "text-muted-foreground")}>
                      {ceoConfig.allowFinancials !== false ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                </div>

                {/* Switch 4: Ações Rápidas & Comunicados */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleUpdateCeoConfig({ allowAnnouncements: !(ceoConfig.allowAnnouncements !== false) })}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateCeoConfig({ allowAnnouncements: !(ceoConfig.allowAnnouncements !== false) });
                    }
                  }}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 hover:scale-[1.008] active:scale-[0.99]",
                    ceoConfig.allowAnnouncements !== false
                      ? "bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/15"
                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-amber-500/30 opacity-75"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">Ações Rápidas Executivas</span>
                      </div>
                      <Switch
                        id="ceo-cfg-announcements"
                        checked={ceoConfig.allowAnnouncements !== false}
                        tabIndex={-1}
                        className="pointer-events-none data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-400"
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                      Habilita os botões de atalho no dashboard do CEO para disparo de anúncios rápidos e alertas prioritários à facção.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[0.68rem]">
                    <span className="text-muted-foreground font-mono">Dashboard Executivo</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", ceoConfig.allowAnnouncements !== false ? "text-amber-400 border-amber-500/40" : "text-muted-foreground")}>
                      {ceoConfig.allowAnnouncements !== false ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                </div>

                {/* Switch 5: Exibição de Saldo Real */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleUpdateCeoConfig({ showRealBalance: !(ceoConfig.showRealBalance !== false) })}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateCeoConfig({ showRealBalance: !(ceoConfig.showRealBalance !== false) });
                    }
                  }}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 hover:scale-[1.008] active:scale-[0.99]",
                    ceoConfig.showRealBalance !== false
                      ? "bg-teal-500/10 border-teal-500/50 shadow-sm shadow-teal-500/15"
                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-teal-500/30 opacity-75"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">Exibir Saldo Real</span>
                      </div>
                      <Switch
                        id="ceo-cfg-balance"
                        checked={ceoConfig.showRealBalance !== false}
                        tabIndex={-1}
                        className="pointer-events-none data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-400"
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                      Quando ativado, exibe o saldo exato em Reais (R$) no card do Fundo de Caixa. Se desativado, oculta por privacidade (••••••).
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[0.68rem]">
                    <span className="text-muted-foreground font-mono">Privacidade de Saldo</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", ceoConfig.showRealBalance !== false ? "text-teal-400 border-teal-500/40" : "text-muted-foreground")}>
                      {ceoConfig.showRealBalance !== false ? "Visível" : "Oculto"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 3 (CEO): BARRA DE CONTROLES RÁPIDOS DA MATRIZ DA TAG CEO */}
          <Card className="surface-card p-4 border-amber-500/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-foreground">
                      Matriz de Privilégios da Tag CEO
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10">
                      Aditivo aos Cargos
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeCeoPermissions.length} de {ALL_PERMISSIONS.length} permissões ativadas para a Tag CEO
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setAllCeoPermissions}
                  className="text-xs h-8 font-bold border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  Marcar Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setExecutiveCeoPermissions}
                  className="text-xs h-8 font-bold border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Recomendado Executivo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setReadOnlyCeoPermissions}
                  className="text-xs h-8 font-bold border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                >
                  Apenas Leitura
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllCeoPermissions}
                  className="text-xs h-8 font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Limpar Todas
                </Button>
              </div>
            </div>
          </Card>

          {/* MÓDULOS DE PERMISSÕES DA TAG CEO */}
          {loadingCeo ? (
            <div className="flex items-center justify-center p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="text-xs text-muted-foreground font-medium">Carregando permissões da Tag CEO...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedPageCards.map(({ category, cards }) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      {category}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      ({cards.length} {cards.length === 1 ? "módulo" : "módulos"})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => {
                      const cardPermKeys = card.permissions.map((p) => p.key);
                      const activeInCard = cardPermKeys.filter((k) => activeCeoPermissions.includes(k)).length;
                      const isAllActive = activeInCard === cardPermKeys.length;
                      const Icon = card.icon;

                      return (
                        <Card
                          key={card.id}
                          className={cn(
                            "surface-card transition-all duration-200 border hover:border-amber-500/40",
                            activeInCard > 0 ? "border-amber-500/20 bg-amber-500/[0.015]" : "opacity-80"
                          )}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl border shrink-0", card.color)}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-bold text-foreground">
                                    {card.title}
                                  </CardTitle>
                                  <CardDescription className="text-[0.7rem] line-clamp-1">
                                    {card.description}
                                  </CardDescription>
                                </div>
                              </div>

                              <Badge
                                variant={isAllActive ? "default" : activeInCard > 0 ? "outline" : "secondary"}
                                className={cn(
                                  "text-[10px] font-mono shrink-0",
                                  isAllActive
                                    ? "bg-amber-500 text-black font-bold"
                                    : activeInCard > 0
                                    ? "border-amber-500/40 text-amber-300"
                                    : ""
                                )}
                              >
                                {activeInCard}/{cardPermKeys.length}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3 pt-0">
                            {card.permissions.map((perm) => {
                              const isChecked = activeCeoPermissions.includes(perm.key);

                              return (
                                <div
                                  key={perm.key}
                                  role="checkbox"
                                  aria-checked={isChecked}
                                  tabIndex={0}
                                  onClick={() => toggleCeoPermission(perm.key)}
                                  onKeyDown={(e) => {
                                    if (e.key === " " || e.key === "Enter") {
                                      e.preventDefault();
                                      toggleCeoPermission(perm.key);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 hover:scale-[1.008] active:scale-[0.99]",
                                    isChecked
                                      ? "bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/15 text-foreground"
                                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-amber-500/30 text-muted-foreground"
                                  )}
                                >
                                  <Checkbox
                                    id={`ceo-${perm.key}`}
                                    checked={isChecked}
                                    tabIndex={-1}
                                    className="mt-0.5 pointer-events-none rounded border-amber-500/40 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                                  />

                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-foreground block truncate">
                                        {perm.label}
                                      </span>
                                      {perm.badge && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-mono py-0 px-1.5 border-amber-500/30 text-amber-300 shrink-0"
                                        >
                                          {perm.badge}
                                        </Badge>
                                      )}
                                      <Badge
                                        variant={isChecked ? "default" : "outline"}
                                        className={cn(
                                          "ml-auto text-[9px] font-mono py-0 px-1.5 shrink-0 transition-colors",
                                          isChecked
                                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                            : "text-muted-foreground/60 border-border/40"
                                        )}
                                      >
                                        {isChecked ? "Ativo" : "Inativo"}
                                      </Badge>
                                    </div>
                                    <p className="text-[0.68rem] text-muted-foreground leading-snug">
                                      {perm.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
