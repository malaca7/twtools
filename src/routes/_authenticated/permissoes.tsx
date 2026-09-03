import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShieldCheck,
  Loader2,
  HelpCircle,
  FolderTree,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, useMembers } from "@/hooks/useData";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { saveRolePermissions } from "@/lib/app-api";
import {
  LEVELS,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  PERMISSIONS,
  ALL_PERMISSIONS,
  levelBadgeClass,
  type AppLevel,
  type Permission,
} from "@/lib/permissions";
import {
  PAGE_CARDS,
  READ_ONLY_PERMISSIONS,
  type PageCardConfig,
  type PermissionDetail,
} from "@/lib/permissionCards";
import { errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/permissoes")({
  component: PermissoesPage,
});

function PermissoesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: dbPermissions } = useRolePermissions();
  const { data: members = [] } = useMembers();
  const { config: menuConfig } = useMenuConfig();

  const canAccess = hasPermission("manage_permissions");

  // Selected Role State
  const [selectedLevel, setSelectedLevel] = useState<AppLevel>("novato");
  const [activePermissions, setActivePermissions] = useState<Permission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (dbPermissions && dbPermissions[selectedLevel]) {
      setActivePermissions(dbPermissions[selectedLevel]);
    } else {
      setActivePermissions(PERMISSIONS[selectedLevel] || []);
    }
  }, [dbPermissions, selectedLevel]);

  // Dynamically group & order PAGE_CARDS according to the exact menu configuration
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

    // Catch any cards with categories not in categoryOrder
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

  // Real-time automatic save function without requiring a manual save button
  const autoSavePermissions = useCallback(
    async (targetLevel: AppLevel, nextPerms: Permission[]) => {
      if (!canAccess) return;
      setIsSyncing(true);
      try {
        await saveRolePermissions(targetLevel, nextPerms);
        void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      } catch (err) {
        toast.error(errorMessage(err, "Falha ao sincronizar permissões."));
      } finally {
        setIsSyncing(false);
      }
    },
    [canAccess, queryClient]
  );

  if (!canAccess) {
    return <NoAccess />;
  }

  const togglePermission = (permKey: Permission) => {
    const next = activePermissions.includes(permKey)
      ? activePermissions.filter((p) => p !== permKey)
      : [...activePermissions, permKey];
    setActivePermissions(next);
    void autoSavePermissions(selectedLevel, next);
  };

  const setAllPermissions = () => {
    setActivePermissions([...ALL_PERMISSIONS]);
    void autoSavePermissions(selectedLevel, [...ALL_PERMISSIONS]);
  };

  const setReadOnlyPermissions = () => {
    setActivePermissions([...READ_ONLY_PERMISSIONS]);
    void autoSavePermissions(selectedLevel, [...READ_ONLY_PERMISSIONS]);
  };

  const clearAllPermissions = () => {
    const next: Permission[] = [];
    setActivePermissions(next);
    void autoSavePermissions(selectedLevel, next);
  };

  const memberCount = members.filter((m) => m.nivel === selectedLevel).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Gerenciamento de Permissões por Página"
        description="Configure os privilégios operacionais e visibilidade card a card agrupados e sincronizados com a ordem do menu."
        actions={
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs py-1.5 px-3 gap-1.5 font-bold">
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{isSyncing ? "Sincronizando..." : "Sincronização Ao Vivo Ativa"}</span>
          </Badge>
        }
      />

      {/* ROLE SELECTION BUTTONS */}
      <Card className="surface-card">
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Cargo Selecionado para Configuração
            </CardTitle>
            <CardDescription className="text-xs">
              Clique nos botões dos cargos abaixo para selecionar e ajustar as permissões em tempo real.
            </CardDescription>
          </div>

          {/* Role Buttons Row */}
          <div className="flex flex-wrap gap-2 pt-3">
            {LEVELS.map((lvl) => {
              const isSelected = selectedLevel === lvl;
              const count = members.filter((m) => m.nivel === lvl).length;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    isSelected
                      ? "bg-gradient-brand text-primary-foreground border-primary shadow-md scale-[1.02]"
                      : "bg-secondary/40 border-border/60 hover:bg-secondary/80 text-foreground"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{LEVEL_LABEL[lvl] || lvl}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[9px] px-1.5 py-0 font-mono font-bold",
                      isSelected ? "bg-black/30 text-white" : "bg-background text-muted-foreground"
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-2 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-lg border border-border/80">
            <div className="flex items-center gap-3">
              <Badge className={cn("text-xs px-3 py-1 font-bold", levelBadgeClass(selectedLevel))}>
                {LEVEL_LABEL[selectedLevel] || selectedLevel}
              </Badge>
              <div>
                <p className="text-xs text-foreground font-semibold">
                  {LEVEL_DESCRIPTION[selectedLevel] || "Cargo operacional do grupo."}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Atribuído a <strong>{memberCount}</strong> {memberCount === 1 ? "membro ativo" : "membros ativos"} no grupo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={setAllPermissions}>
                Marcar Todos
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={setReadOnlyPermissions}>
                Apenas Leitura
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-rose-400 hover:bg-rose-500/10" onClick={clearAllPermissions}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DYNAMICALLY GROUPED & ORDERED PERMISSION CARDS BY MENU CATEGORIES */}
      <div className="space-y-8">
        {groupedPageCards.map(({ category, cards }) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">
                  Categoria do Menu: <span className="text-primary font-extrabold">{category}</span>
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                {cards.length} {cards.length === 1 ? "módulo" : "módulos"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((pageCard) => {
                const PageIcon = pageCard.icon;

                return (
                  <Card key={pageCard.id} className="surface-card flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-2 rounded-lg border", pageCard.color)}>
                              <PageIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                                {pageCard.title}
                                <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                  ({pageCard.route})
                                </span>
                              </CardTitle>
                              <CardDescription className="text-[0.7rem] line-clamp-1">
                                {pageCard.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-3 space-y-2.5">
                        {pageCard.permissions.map((perm) => {
                          const isChecked = activePermissions.includes(perm.key);

                          return (
                            <div
                              key={`${pageCard.id}-${perm.key}`}
                              className={cn(
                                "p-2.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer select-none",
                                isChecked
                                  ? "border-primary/40 bg-primary/5 shadow-sm"
                                  : "border-border/50 bg-background/40 hover:bg-secondary/20"
                              )}
                              onClick={() => togglePermission(perm.key)}
                            >
                              <Checkbox
                                id={`perm-${pageCard.id}-${perm.key}`}
                                checked={isChecked}
                                className="mt-0.5 pointer-events-none"
                              />

                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-foreground">
                                    {perm.label}
                                  </span>

                                  {perm.badge && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                                      {perm.badge}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-[0.7rem] text-muted-foreground leading-snug">
                                  {perm.description}
                                </p>

                                {perm.importantNote && (
                                  <div className="mt-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[0.65rem] text-amber-400 flex items-start gap-1">
                                    <HelpCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" />
                                    <span>{perm.importantNote}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
