import { useState, useEffect, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

  // 1. Carrega as permissões da Tag Dev ao inicializar
  useEffect(() => {
    let isMounted = true;
    setLoadingDev(true);

    getDevPermissions(user, profile, level)
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const keys: Permission[] = [];
          data.forEach((item: any) => {
            if (typeof item === "string" && ALL_PERMISSIONS.includes(item as Permission)) {
              keys.push(item as Permission);
            } else if (item.id && ALL_PERMISSIONS.includes(item.id as Permission)) {
              if (item.visualizar) keys.push(item.id as Permission);
            }
          });
          setActiveDevPermissions(keys.length > 0 ? keys : ALL_PERMISSIONS);
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
  }, [user, profile, level]);

  // 2. Carrega as permissões e configuração da Tag CEO
  useEffect(() => {
    let isMounted = true;
    setLoadingCeo(true);

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
  }, [user, profile, level]);

  // Agrupa os cards de páginas dinamicamente seguindo a ordem do menu
  const groupedPageCards = useMemo(() => {
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const categoryOrder = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Operação", "Gestão", "Administração"];

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

  // Sincronização e autosave da Tag Dev
  const autoSaveDevTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsDevSyncing(true);
      try {
        const formattedData = nextPerms.map((key) => ({
          id: key,
          name: key,
          description: "",
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
        }));
        await saveDevPermissions(formattedData, user, profile, level);
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag Dev.");
      } finally {
        setIsDevSyncing(false);
      }
    },
    [user, profile, level]
  );

  // Sincronização e autosave da Tag CEO
  const autoSaveCeoTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsCeoSyncing(true);
      try {
        await saveCeoTagPermissions(nextPerms, user, profile, level);
        void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
        void queryClient.invalidateQueries({ queryKey: ["auth_session"] });
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag CEO.");
      } finally {
        setIsCeoSyncing(false);
      }
    },
    [user, profile, level, queryClient]
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
                                  onClick={() => toggleDevPermission(perm.key)}
                                  className={cn(
                                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                    isChecked
                                      ? "bg-rose-500/5 border-rose-500/30 text-foreground"
                                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 text-muted-foreground"
                                  )}
                                >
                                  <Checkbox
                                    id={`dev-${perm.key}`}
                                    checked={isChecked}
                                    onCheckedChange={() => toggleDevPermission(perm.key)}
                                    className="mt-0.5 rounded border-rose-500/40 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                  />

                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <label
                                        htmlFor={`dev-${perm.key}`}
                                        className="text-xs font-bold text-foreground cursor-pointer block truncate"
                                      >
                                        {perm.label}
                                      </label>
                                      {perm.badge && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-mono py-0 px-1.5 border-rose-500/30 text-rose-400 shrink-0"
                                        >
                                          {perm.badge}
                                        </Badge>
                                      )}
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

          {/* SEÇÃO 2 (CEO): BARRA DE CONTROLES RÁPIDOS DA MATRIZ DA TAG CEO */}
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
                                  onClick={() => toggleCeoPermission(perm.key)}
                                  className={cn(
                                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                    isChecked
                                      ? "bg-amber-500/10 border-amber-500/40 text-foreground"
                                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40 text-muted-foreground"
                                  )}
                                >
                                  <Checkbox
                                    id={`ceo-${perm.key}`}
                                    checked={isChecked}
                                    onCheckedChange={() => toggleCeoPermission(perm.key)}
                                    className="mt-0.5 rounded border-amber-500/40 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                                  />

                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <label
                                        htmlFor={`ceo-${perm.key}`}
                                        className="text-xs font-bold text-foreground cursor-pointer block truncate"
                                      >
                                        {perm.label}
                                      </label>
                                      {perm.badge && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-mono py-0 px-1.5 border-amber-500/30 text-amber-300 shrink-0"
                                        >
                                          {perm.badge}
                                        </Badge>
                                      )}
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
