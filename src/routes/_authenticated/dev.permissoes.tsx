import { useState, useEffect, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Code2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import {
  getDevPermissions,
  saveDevPermissions,
} from "@/services/devService";
import { ALL_PERMISSIONS, type Permission } from "@/lib/permissions";
import {
  PAGE_CARDS,
  READ_ONLY_PERMISSIONS,
  type PageCardConfig,
  type PermissionDetail,
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
  const { user, profile, level } = useAuth();
  const { config: menuConfig } = useMenuConfig();

  const [activePermissions, setActivePermissions] = useState<Permission[]>(ALL_PERMISSIONS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega as permissões da Tag Dev ao inicializar
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDevPermissions(user, profile, level)
      .then((data) => {
        if (isMounted) {
          // Mapeia do formato DevPermissionResource ou array de strings
          if (Array.isArray(data)) {
            const keys: Permission[] = [];
            data.forEach((item: any) => {
              if (typeof item === "string" && ALL_PERMISSIONS.includes(item as Permission)) {
                keys.push(item as Permission);
              } else if (item.id && ALL_PERMISSIONS.includes(item.id as Permission)) {
                if (item.visualizar) keys.push(item.id as Permission);
              }
            });
            if (keys.length > 0) {
              setActivePermissions(keys);
            } else {
              setActivePermissions(ALL_PERMISSIONS);
            }
          }
        }
      })
      .catch(() => {
        if (isMounted) setActivePermissions(ALL_PERMISSIONS);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
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

  // Sincronização e salvamento em tempo real
  const autoSaveDevTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsSyncing(true);
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
        setIsSyncing(false);
      }
    },
    [user, profile, level]
  );

  const togglePermission = (permKey: Permission) => {
    const next = activePermissions.includes(permKey)
      ? activePermissions.filter((p) => p !== permKey)
      : [...activePermissions, permKey];
    setActivePermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  const setAllPermissions = () => {
    setActivePermissions([...ALL_PERMISSIONS]);
    void autoSaveDevTagPermissions([...ALL_PERMISSIONS]);
  };

  const setReadOnlyPermissions = () => {
    setActivePermissions([...READ_ONLY_PERMISSIONS]);
    void autoSaveDevTagPermissions([...READ_ONLY_PERMISSIONS]);
  };

  const clearAllPermissions = () => {
    const next: Permission[] = [];
    setActivePermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <PageHeader
        title="Dev → Permissões da Tag Desenvolvedor"
        description="Configure as permissões operacionais vinculadas exclusivamente à Tag Desenvolvedor [Dev System 💻]. As permissões da Tag se somam às do cargo do membro."
        actions={
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs py-1.5 px-3 gap-1.5 font-bold">
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-rose-400" />
            )}
            {isSyncing ? "Sincronizando..." : "Sincronizado em Tempo Real"}
          </Badge>
        }
      />

      {/* Informativo Tag Dev Aditiva */}
      <Card className="surface-card border-rose-500/30 bg-rose-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  Matriz Aditiva da Tag Desenvolvedor
                  <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                    Tag Dev Exclusiva
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  As permissões marcadas abaixo são concedidas aos integrantes com a tag <strong>desenvolvedor</strong> e se somam automaticamente aos privilégios do cargo do membro.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Barra de Controles Rápidos */}
      <Card className="surface-card p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-foreground">Tag Desenvolvedor</h3>
                <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                  Dev System
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {activePermissions.length} de {ALL_PERMISSIONS.length} permissões ativadas para a Tag Dev
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={setAllPermissions}
              className="text-xs h-8 font-bold border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            >
              Marcar Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setReadOnlyPermissions}
              className="text-xs h-8 font-bold border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
            >
              Apenas Leitura
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllPermissions}
              className="text-xs h-8 font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Limpar Todas
            </Button>
          </div>
        </div>
      </Card>

      {/* MÓDULOS DE PERMISSÕES (IGUAL À PÁGINA DE CARGOS) */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  const activeInCard = cardPermKeys.filter((k) => activePermissions.includes(k)).length;
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
                          const isChecked = activePermissions.includes(perm.key);

                          return (
                            <div
                              key={perm.key}
                              onClick={() => togglePermission(perm.key)}
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
                                onCheckedChange={() => togglePermission(perm.key)}
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
                                {perm.importantNote && (
                                  <p className="text-[0.65rem] text-amber-400 font-medium mt-1">
                                    ⚠️ {perm.importantNote}
                                  </p>
                                )}
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
  );
}
