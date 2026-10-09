import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, DevBadge, CeoBadge } from "@/components/ui-kit";
import { usePanelTheme } from "@/lib/panelTheme";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, useRolePermissions, useCustomRoles } from "@/hooks/useData";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { useCeoMenuConfig } from "@/hooks/useCeoMenuConfig";
import { useDevMenuConfig } from "@/hooks/useDevMenuConfig";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import {
  getDevPermissions,
  saveDevPermissions,
  getCeoTagPermissions,
  saveCeoTagPermissions,
  toggleMemberCeoTag,
  toggleMemberDevTag,
  DEFAULT_CEO_PERMISSIONS,
} from "@/services/devService";
import { saveRolePermissions } from "@/lib/app-api";
import {
  LEVELS,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  PERMISSIONS,
  ALL_PERMISSIONS,
  levelBadgeClass,
  getLevelLabel,
  type AppLevel,
  type Permission,
} from "@/lib/permissions";
import {
  PAGE_CARDS,
  READ_ONLY_PERMISSIONS,
  type PageCardConfig,
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
  const { devStyle, ceoStyle, DevIcon, CeoIcon } = usePanelTheme();
  const { config: menuConfig } = useMenuConfig();
  const { config: ceoMenuConfig } = useCeoMenuConfig();
  const { config: devMenuConfig } = useDevMenuConfig();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: dbPermissions, isLoading: loadingDbPermissions } = useRolePermissions();
  const { data: customRoles = [] } = useCustomRoles();
  const queryClient = useQueryClient();

  // Aba ativa: Cargos da Plataforma vs Tag Dev vs Tag CEO
  const [activeTab, setActiveTab] = useState<"cargos" | "dev" | "ceo">("cargos");

  // Lista de cargos ativos configurados no Gerenciamento de Cargos (/cargos)
  const activeRolesList = useMemo(() => {
    if (customRoles && customRoles.length > 0) {
      const filtered = customRoles
        .filter((r) => {
          const id = (r.id || "").toLowerCase();
          const name = (r.nome || (r as any).name || "").toLowerCase();
          return id !== "desenvolvedor" && id !== "dev" && name !== "desenvolvedor" && name !== "dev";
        })
        .sort((a, b) => (b.rank || 0) - (a.rank || 0)); // maior rank no topo

      if (filtered.length > 0) {
        return filtered.map((r) => {
          const id = (r.id || "").toLowerCase() as AppLevel;
          const label = r.nome || (r as any).name || LEVEL_LABEL[id] || r.id;
          const description = r.descricao || LEVEL_DESCRIPTION[id] || "Cargo configurado na plataforma.";
          return {
            id,
            nome: label,
            descricao: description,
            rank: r.rank || 0,
          };
        });
      }
    }

    // Fallback padrão se custom_roles ainda não tiver registros
    return LEVELS.map((lvl) => ({
      id: lvl,
      nome: LEVEL_LABEL[lvl] || lvl,
      descricao: LEVEL_DESCRIPTION[lvl] || "Cargo operacional do grupo.",
      rank: 0,
    }));
  }, [customRoles]);

  // Lista unificada de todos os cargos disponíveis (Apenas ativos no gerenciamento de cargos)
  const allAvailableLevels = useMemo(() => {
    return activeRolesList.map((r) => r.id);
  }, [activeRolesList]);

  const getCargoDisplayInfo = useCallback(
    (lvl: AppLevel) => {
      const found = activeRolesList.find((r) => r.id === lvl);
      if (found) {
        return {
          label: found.nome,
          description: found.descricao,
        };
      }
      return {
        label: LEVEL_LABEL[lvl] || lvl,
        description: LEVEL_DESCRIPTION[lvl] || "Cargo operacional da plataforma.",
      };
    },
    [activeRolesList]
  );

  // Estado da aba "cargos"
  const [selectedCargo, setSelectedCargo] = useState<AppLevel>("01");
  const [cargoPermSearch, setCargoPermSearch] = useState("");
  const [cargoCategoryFilter, setCargoCategoryFilter] = useState("all");
  const [activeCargoPermissions, setActiveCargoPermissions] = useState<Permission[]>([]);
  const [isCargoSyncing, setIsCargoSyncing] = useState(false);
  const isSavingCargoRef = useRef(false);
  const prevCargoRef = useRef<AppLevel>(selectedCargo);
  const roleCardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Garante que o cargo selecionado seja sempre um dos cargos ativos
  useEffect(() => {
    if (allAvailableLevels.length > 0 && !allAvailableLevels.includes(selectedCargo)) {
      setSelectedCargo(allAvailableLevels[0] || "01");
    }
  }, [allAvailableLevels, selectedCargo]);

  // Listener de scroll para exibição suave do balão flutuante e detecção topo / final
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (roleCardRef.current) {
        const rect = roleCardRef.current.getBoundingClientRect();
        setShowFloatingBar(rect.top < 80 || scrollY > 90);
      } else {
        setShowFloatingBar(scrollY > 90);
      }
      setIsAtTop(scrollY < 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Filtros de busca de módulos e categorias de permissão
  const [devPermSearch, setDevPermSearch] = useState("");
  const [devCategoryFilter, setDevCategoryFilter] = useState("all");

  const [ceoPermSearch, setCeoPermSearch] = useState("");
  const [ceoCategoryFilter, setCeoCategoryFilter] = useState("all");

  // Refs para evitar recarregamento repetido e piscadas da tela
  const devInitialLoadedRef = useRef(false);
  const ceoInitialLoadedRef = useRef(false);

  // Estado das Permissões da Tag Dev
  const [activeDevPermissions, setActiveDevPermissions] = useState<Permission[]>([]);
  const [isDevSyncing, setIsDevSyncing] = useState(false);
  const [loadingDev, setLoadingDev] = useState(true);

  // Estado das Permissões da Tag CEO
  const [activeCeoPermissions, setActiveCeoPermissions] = useState<Permission[]>(
    DEFAULT_CEO_PERMISSIONS as Permission[]
  );
  const [isCeoSyncing, setIsCeoSyncing] = useState(false);
  const [loadingCeo, setLoadingCeo] = useState(true);

  // Gestão de membros com Tag Dev
  const [searchDevMember, setSearchDevMember] = useState("");
  const [filterDevOnly, setFilterDevOnly] = useState<"all" | "dev_only">("all");
  const [isDevMembersOpen, setIsDevMembersOpen] = useState(false);

  // Gestão de membros com Tag CEO
  const [searchMember, setSearchMember] = useState("");
  const [filterCeoOnly, setFilterCeoOnly] = useState<"all" | "ceo_only">("all");
  const [isCeoMembersOpen, setIsCeoMembersOpen] = useState(false);
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);

  // 0. Sincronização em tempo real das permissões dos cargos com dbPermissions (/permissoes)
  useEffect(() => {
    const cargoChanged = prevCargoRef.current !== selectedCargo;
    prevCargoRef.current = selectedCargo;

    if (cargoChanged || !isSavingCargoRef.current) {
      if (dbPermissions && dbPermissions[selectedCargo]) {
        setActiveCargoPermissions(dbPermissions[selectedCargo]);
      } else {
        setActiveCargoPermissions(PERMISSIONS[selectedCargo] || []);
      }
    }
  }, [dbPermissions, selectedCargo]);

  // Listener global de broadcast em tempo real para auto-sincronização com /permissoes
  useEffect(() => {
    const handleSync = () => {
      void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
    };
    window.addEventListener("tw_permissions_synced", handleSync);
    return () => {
      window.removeEventListener("tw_permissions_synced", handleSync);
    };
  }, [queryClient]);

  // 1. Carrega as permissões da Tag Dev ao inicializar sincronizado com dbPermissions
  useEffect(() => {
    let isMounted = true;
    if (!devInitialLoadedRef.current) {
      setLoadingDev(true);
    }

    if (dbPermissions && dbPermissions["desenvolvedor"] && Array.isArray(dbPermissions["desenvolvedor"])) {
      setActiveDevPermissions(dbPermissions["desenvolvedor"]);
      devInitialLoadedRef.current = true;
      setLoadingDev(false);
      return;
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
        if (isMounted) setActiveDevPermissions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingDev(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, level, dbPermissions]);

  // 2. Carrega as permissões da Tag CEO sincronizado com dbPermissions
  useEffect(() => {
    let isMounted = true;
    if (!ceoInitialLoadedRef.current) {
      setLoadingCeo(true);
    }

    if (dbPermissions && dbPermissions["ceo"] && Array.isArray(dbPermissions["ceo"])) {
      setActiveCeoPermissions(dbPermissions["ceo"]);
      ceoInitialLoadedRef.current = true;
      setLoadingCeo(false);
    }

    getCeoTagPermissions(user, profile, level)
      .then((perms) => {
        if (isMounted) {
          if (Array.isArray(perms) && (!dbPermissions || !dbPermissions["ceo"])) {
            const valid = perms.filter((p) => ALL_PERMISSIONS.includes(p as Permission)) as Permission[];
            setActiveCeoPermissions(valid);
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
  }, [user?.id, level, dbPermissions]);

  // Agrupa os cards de páginas dinamicamente sincronizado com todos os painéis (DEV, CEO e Membro)
  const getGroupedPageCards = useCallback(
    (tab: "cargos" | "dev" | "ceo") => {
      // 1. Mapeamento de itens dos 3 painéis
      const memberItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
      const memberConfigMap = new Map(memberItems.flatMap((c) => [[c.id, c], [c.url, c]]));

      const ceoItems = ceoMenuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
      const ceoConfigMap = new Map(
        ceoItems.flatMap((c) => [
          [c.id, c],
          [c.url, c],
          ...(c.id === "ceo-dashboard" ? [["ceo", c], ["/ceo", c]] : []),
        ])
      );

      const devItems = devMenuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
      const devConfigMap = new Map(devItems.flatMap((c) => [[c.id, c], [c.url, c]]));

      // 2. Identificação de escopo de cada card
      const isDevCard = (card: PageCardConfig) =>
        card.defaultCat === "DEV" ||
        card.defaultCat === "Ferramentas Dev" ||
        card.id.startsWith("dev-") ||
        card.route.startsWith("/dev");

      const isCeoCard = (card: PageCardConfig) =>
        card.defaultCat === "CEO" ||
        card.id === "ceo" ||
        card.id.startsWith("ceo-") ||
        card.route.startsWith("/ceo");

      // 3. Categorias configuradas em cada painel
      const rawDevCats = (devMenuConfig?.categories?.length ? devMenuConfig.categories : ["DEV"]).map((c) =>
        c === "Ferramentas Dev" ? (devMenuConfig?.categories?.includes("DEV") ? "DEV" : devMenuConfig?.categories?.[0] || "DEV") : c
      );
      const rawCeoCats = ceoMenuConfig?.categories?.length ? ceoMenuConfig.categories : ["CEO"];
      const rawMemberCats = menuConfig?.categories?.length
        ? menuConfig.categories
        : ["Produções", "Gestão", "Administração"];

      // 4. Ordem e lista unificada de categorias para a aba correspondente
      const categoryOrder =
        tab === "cargos"
          ? rawMemberCats.filter((c) => c !== "DEV" && c !== "Ferramentas Dev" && c !== "Operação")
          : tab === "ceo"
          ? Array.from(new Set([...rawCeoCats, ...rawMemberCats]))
          : Array.from(new Set([...rawDevCats, ...rawCeoCats, ...rawMemberCats]));

      // 5. Customização dos cards com metadados do painel de origem
      const customized = PAGE_CARDS
        .filter((card) => {
          if (tab === "cargos") {
            if (isDevCard(card)) return false;
            if (card.id === "ceo-tags" || card.id === "ceo-selos" || card.id === "solicitar-selo") return true;
            if (isCeoCard(card) && card.id !== "ceo-tags" && card.id !== "ceo-selos") return false;
            if (card.id === "lives" || card.id === "life") return false;
            return true;
          }
          if (tab === "ceo" && isDevCard(card)) return false;
          return true;
        })
        .map((card) => {
          let cfg: any = null;
          if (isDevCard(card)) {
            cfg = devConfigMap.get(card.id) || devConfigMap.get(card.route);
          } else if (isCeoCard(card)) {
            cfg = ceoConfigMap.get(card.id) || ceoConfigMap.get(card.route);
          } else {
            cfg = memberConfigMap.get(card.id) || memberConfigMap.get(card.route);
          }

          let cat = cfg?.category || card.defaultCat;
          if (tab === "cargos" && card.id === "ceo-tags") {
            cat = cfg?.category || "Administração";
          }
          if (tab === "cargos" && card.id === "ceo-selos") {
            cat = (cfg?.category && cfg.category !== "CEO" && categoryOrder.includes(cfg.category))
              ? cfg.category
              : (categoryOrder.includes("Administração") ? "Administração" : categoryOrder[0] || "Gestão");
          }
          if (card.id === "solicitar-selo" && tab === "cargos") {
            cat = cfg?.category || "Gestão";
          }
          if (isDevCard(card) && !rawDevCats.includes(cat)) {
            cat = rawDevCats[0] || "DEV";
          }
          if (cat === "Operação") cat = card.id === "vendas" ? "Produções" : "Gestão";

          return {
            ...card,
            title:
              tab === "cargos" && card.id === "ceo-tags"
                ? "Gerenciar Tags"
                : tab === "cargos" && card.id === "ceo-selos"
                ? "Gerenciar Selos"
                : (cfg?.title || card.title),
            category: cat,
            order: typeof cfg?.order === "number" ? cfg.order : card.defaultOrder,
          };
        });

      // 6. Agrupamento dinâmico ordenado
      const groups: { category: string; cards: typeof customized }[] = [];

      categoryOrder.forEach((cat) => {
        const catCards = customized
          .filter((c) => c.category === cat)
          .sort((a, b) => a.order - b.order);
        if (catCards.length > 0) {
          groups.push({ category: cat, cards: catCards });
        }
      });

      // 7. Inclui quaisquer categorias não mapeadas para que nenhum card seja omitido
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
    },
    [menuConfig, ceoMenuConfig, devMenuConfig]
  );

  const cargoGroups = useMemo(() => getGroupedPageCards("cargos"), [getGroupedPageCards]);
  const cargoCards = useMemo(() => cargoGroups.flatMap((g) => g.cards), [cargoGroups]);

  const filteredCargoGroups = useMemo(() => {
    return cargoGroups
      .filter((g) => cargoCategoryFilter === "all" || cargoCategoryFilter === g.category)
      .map((g) => {
        if (!cargoPermSearch.trim()) return g;
        const q = cargoPermSearch.toLowerCase();
        const matchingCards = g.cards.filter((card) => {
          return (
            card.title.toLowerCase().includes(q) ||
            card.route.toLowerCase().includes(q) ||
            card.description.toLowerCase().includes(q) ||
            card.permissions.some(
              (p) =>
                p.label.toLowerCase().includes(q) ||
                p.key.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.badge && p.badge.toLowerCase().includes(q))
            )
          );
        });
        return { ...g, cards: matchingCards };
      })
      .filter((g) => g.cards.length > 0);
  }, [cargoGroups, cargoCategoryFilter, cargoPermSearch]);

  const devGroups = useMemo(() => getGroupedPageCards("dev"), [getGroupedPageCards]);
  const filteredDevGroups = useMemo(() => {
    return devGroups
      .filter((g) => devCategoryFilter === "all" || devCategoryFilter === g.category)
      .map((g) => {
        if (!devPermSearch.trim()) return g;
        const q = devPermSearch.toLowerCase();
        const matchingCards = g.cards.filter((card) => {
          return (
            card.title.toLowerCase().includes(q) ||
            card.route.toLowerCase().includes(q) ||
            card.description.toLowerCase().includes(q) ||
            card.permissions.some(
              (p) =>
                p.label.toLowerCase().includes(q) ||
                p.key.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.badge && p.badge.toLowerCase().includes(q))
            )
          );
        });
        return { ...g, cards: matchingCards };
      })
      .filter((g) => g.cards.length > 0);
  }, [devGroups, devCategoryFilter, devPermSearch]);

  const ceoGroups = useMemo(() => getGroupedPageCards("ceo"), [getGroupedPageCards]);
  const filteredCeoGroups = useMemo(() => {
    return ceoGroups
      .filter((g) => ceoCategoryFilter === "all" || ceoCategoryFilter === g.category)
      .map((g) => {
        if (!ceoPermSearch.trim()) return g;
        const q = ceoPermSearch.toLowerCase();
        const matchingCards = g.cards.filter((card) => {
          return (
            card.title.toLowerCase().includes(q) ||
            card.route.toLowerCase().includes(q) ||
            card.description.toLowerCase().includes(q) ||
            card.permissions.some(
              (p) =>
                p.label.toLowerCase().includes(q) ||
                p.key.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.badge && p.badge.toLowerCase().includes(q))
            )
          );
        });
        return { ...g, cards: matchingCards };
      })
      .filter((g) => g.cards.length > 0);
  }, [ceoGroups, ceoCategoryFilter, ceoPermSearch]);

  // Sincronização e autosave dos Cargos da Plataforma
  const autoSaveCargoPermissions = useCallback(
    async (targetCargo: AppLevel, nextPerms: Permission[]) => {
      setIsCargoSyncing(true);
      isSavingCargoRef.current = true;
      try {
        await saveRolePermissions(targetCargo, nextPerms);
        queryClient.setQueryData<Record<AppLevel, Permission[]>>(["role_permissions"], (old) => ({
          ...(old || {}),
          [targetCargo]: nextPerms,
        } as Record<AppLevel, Permission[]>));
      } catch (err) {
        toast.error("Falha ao salvar permissões do cargo.");
      } finally {
        setIsCargoSyncing(false);
        setTimeout(() => {
          isSavingCargoRef.current = false;
        }, 800);
      }
    },
    [queryClient]
  );

  const toggleCargoPermission = (permKey: Permission) => {
    const next = activeCargoPermissions.includes(permKey)
      ? activeCargoPermissions.filter((p) => p !== permKey)
      : [...activeCargoPermissions, permKey];
    setActiveCargoPermissions(next);
    void autoSaveCargoPermissions(selectedCargo, next);
  };

  const toggleCargoCardPermissions = (card: PageCardConfig) => {
    const cardPermKeys = card.permissions.map((p) => p.key);
    const allCardActive = cardPermKeys.every((k) => activeCargoPermissions.includes(k));
    let next: Permission[];
    if (allCardActive) {
      next = activeCargoPermissions.filter((k) => !cardPermKeys.includes(k));
    } else {
      next = Array.from(new Set([...activeCargoPermissions, ...cardPermKeys]));
    }
    setActiveCargoPermissions(next);
    void autoSaveCargoPermissions(selectedCargo, next);
  };

  const setAllCargoPermissions = () => {
    const allKeys = Array.from(new Set(cargoCards.flatMap((c) => c.permissions.map((p) => p.key))));
    const otherPermissions = activeCargoPermissions.filter((p) => !allKeys.includes(p));
    const next = Array.from(new Set([...otherPermissions, ...allKeys]));
    setActiveCargoPermissions(next);
    void autoSaveCargoPermissions(selectedCargo, next);
  };

  const setReadOnlyCargoPermissions = () => {
    const allKeys = Array.from(new Set(cargoCards.flatMap((c) => c.permissions.map((p) => p.key))));
    const readOnlyKeys = READ_ONLY_PERMISSIONS.filter((p) => allKeys.includes(p));
    const otherPermissions = activeCargoPermissions.filter((p) => !allKeys.includes(p));
    const next = Array.from(new Set([...otherPermissions, ...readOnlyKeys]));
    setActiveCargoPermissions(next);
    void autoSaveCargoPermissions(selectedCargo, next);
  };

  const clearAllCargoPermissions = () => {
    const allKeys = Array.from(new Set(cargoCards.flatMap((c) => c.permissions.map((p) => p.key))));
    const next = activeCargoPermissions.filter((p) => !allKeys.includes(p));
    setActiveCargoPermissions(next);
    void autoSaveCargoPermissions(selectedCargo, next);
  };

  // Sincronização e autosave da Tag Dev
  const autoSaveDevTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsDevSyncing(true);
      try {
        await saveRolePermissions("desenvolvedor" as AppLevel, nextPerms);
        await saveDevPermissions(nextPerms, user, profile, level);
        queryClient.setQueryData<Record<AppLevel, Permission[]>>(["role_permissions"], (old) => ({
          ...(old || {}),
          desenvolvedor: nextPerms,
        } as Record<AppLevel, Permission[]>));
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag Dev.");
      } finally {
        setIsDevSyncing(false);
      }
    },
    [queryClient, user, profile, level]
  );

  // Sincronização e autosave da Tag CEO
  const autoSaveCeoTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsCeoSyncing(true);
      try {
        await saveRolePermissions("ceo" as AppLevel, nextPerms);
        await saveCeoTagPermissions(nextPerms, user, profile, level);
        queryClient.setQueryData<Record<AppLevel, Permission[]>>(["role_permissions"], (old) => ({
          ...(old || {}),
          ceo: nextPerms,
        } as Record<AppLevel, Permission[]>));
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag CEO.");
      } finally {
        setIsCeoSyncing(false);
      }
    },
    [queryClient, user, profile, level]
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
          activeTab === "cargos"
            ? "Dev → Permissões dos Cargos da Plataforma"
            : activeTab === "dev"
            ? "Dev → Permissões da Tag Desenvolvedor"
            : "Dev → Configuração & Permissões da Tag CEO"
        }
        description={
          activeTab === "cargos"
            ? "Gerencie a matriz de permissões de cada cargo da plataforma (01, 02, Gerente, etc.). Sincronizado automaticamente e em tempo real com /permissoes e o banco de dados."
            : activeTab === "dev"
            ? "Configure as permissões operacionais vinculadas exclusivamente à Tag Desenvolvedor [Dev System 💻] e gerencie os membros com a tag ativa. As permissões se somam às do cargo do membro."
            : "Configure a matriz de permissões da Tag CEO [Diretoria Executiva 👑] e gerencie quais membros possuem a tag. Apenas usuários com a Tag Dev têm autorização para atribuir a Tag CEO."
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-xs py-1.5 px-3 gap-1.5 font-bold transition-all",
                activeTab === "cargos"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : activeTab === "dev"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              )}
            >
              {(activeTab === "cargos" ? isCargoSyncing : activeTab === "dev" ? isDevSyncing : isCeoSyncing) ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2
                  className={cn(
                    "h-3.5 w-3.5",
                    activeTab === "cargos"
                      ? "text-emerald-400"
                      : activeTab === "dev"
                      ? "text-rose-400"
                      : "text-amber-400"
                  )}
                />
              )}
              {(activeTab === "cargos" ? isCargoSyncing : activeTab === "dev" ? isDevSyncing : isCeoSyncing)
                ? "Sincronizando..."
                : "Sincronizado em Tempo Real"}
            </Badge>
          </div>
        }
      />

      {/* SELETOR DE ABAS MODERNAS: CARGOS vs TAG DEV vs TAG CEO */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-secondary/40 rounded-2xl border border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aba Cargos da Plataforma */}
          <button
            type="button"
            onClick={() => setActiveTab("cargos")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab !== "cargos" && "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
            style={
              activeTab === "cargos"
                ? {
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    borderColor: "rgba(16, 185, 129, 0.4)",
                    borderWidth: "1px",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                  }
                : undefined
            }
          >
            <ShieldCheck className="h-4 w-4" style={{ color: activeTab === "cargos" ? "#34d399" : undefined }} />
            Cargos da Plataforma
            <Badge
              variant="outline"
              className="text-[9px] font-mono py-0 px-1.5 ml-1 font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
            >
              /permissoes
            </Badge>
          </button>

          {/* Aba Tag Dev */}
          <button
            type="button"
            onClick={() => setActiveTab("dev")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab !== "dev" && "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
            style={
              activeTab === "dev"
                ? {
                    backgroundColor: `${devStyle.primaryHex}25`,
                    color: devStyle.primaryHex,
                    borderColor: `${devStyle.primaryHex}50`,
                    borderWidth: "1px",
                    boxShadow: `0 2px 8px ${devStyle.primaryHex}20`,
                  }
                : undefined
            }
          >
            <DevIcon className="h-4 w-4" style={{ color: activeTab === "dev" ? devStyle.primaryHex : undefined }} />
            Tag Desenvolvedor
            <Badge
              variant="outline"
              className="text-[9px] font-mono py-0 px-1.5 ml-1 font-bold"
              style={{
                borderColor: `${devStyle.primaryHex}40`,
                color: devStyle.primaryHex,
                backgroundColor: `${devStyle.primaryHex}15`,
              }}
            >
              Dev System ({activeDevsCount})
            </Badge>
          </button>

          {/* Aba Tag CEO */}
          <button
            type="button"
            onClick={() => setActiveTab("ceo")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab !== "ceo" && "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
            style={
              activeTab === "ceo"
                ? {
                    backgroundColor: `${ceoStyle.primaryHex}25`,
                    color: ceoStyle.primaryHex,
                    borderColor: `${ceoStyle.primaryHex}50`,
                    borderWidth: "1px",
                    boxShadow: `0 2px 8px ${ceoStyle.primaryHex}20`,
                  }
                : undefined
            }
          >
            <CeoIcon className="h-4 w-4" style={{ color: activeTab === "ceo" ? ceoStyle.primaryHex : undefined }} />
            Tag CEO
            <Badge
              variant="outline"
              className="text-[9px] font-mono py-0 px-1.5 ml-1 font-bold"
              style={{
                borderColor: `${ceoStyle.primaryHex}40`,
                color: ceoStyle.primaryHex,
                backgroundColor: `${ceoStyle.primaryHex}15`,
              }}
            >
              Tag CEO ({activeCeosCount})
            </Badge>
          </button>
        </div>

        <div className="text-[0.75rem] text-muted-foreground px-2 font-medium flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          Acesso e gerenciamento restritos à Tag Dev
        </div>
      </div>

      {/* =========================================================================
          ABA 0: CARGOS DA PLATAFORMA (Sincronizado com /permissoes)
          ========================================================================= */}
      {activeTab === "cargos" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Informativo Cargos da Plataforma */}
          <Card
            className="surface-card transition-all"
            style={{
              borderColor: "rgba(16, 185, 129, 0.35)",
              background: "linear-gradient(to right, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.03), transparent)",
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="p-3 rounded-2xl shadow-sm shrink-0 border"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      borderColor: "rgba(16, 185, 129, 0.35)",
                    }}
                  >
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      Cargos da Plataforma — Sincronização em Tempo Real
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0">
                        /permissoes
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Configure a matriz operacional de cada cargo na hierarquia da facção. As alterações são salvas na tabela <strong>role_permissions</strong> e refletidas instantaneamente na página <strong>/permissoes</strong>.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to="/permissoes">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir /permissoes
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* SELETOR DE CARGO */}
          <Card ref={roleCardRef} className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Cargo Selecionado para Configuração
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione um cargo ativo abaixo para carregar e alternar suas permissões em tempo real.
                </CardDescription>
              </div>

              {/* Linha de botões dos cargos */}
              <div className="flex flex-wrap gap-2 pt-3">
                {activeRolesList.map((role) => {
                  const isSelected = selectedCargo === role.id;
                  const count = members.filter((m) => m.nivel === role.id).length;

                  return (
                    <button
                      key={`cargo-btn-${role.id}`}
                      type="button"
                      onClick={() => setSelectedCargo(role.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-400 shadow-sm shadow-emerald-500/10 scale-[1.02]"
                          : "bg-secondary/40 border-border/60 hover:bg-secondary/80 text-foreground"
                      )}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{role.nome}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] px-1.5 py-0 font-mono font-bold",
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-background text-muted-foreground"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-xl border border-border/80">
                <div className="flex items-center gap-3">
                  <Badge className={cn("text-xs px-3 py-1 font-bold", levelBadgeClass(selectedCargo))}>
                    {getCargoDisplayInfo(selectedCargo).label}
                  </Badge>
                  <div>
                    <p className="text-xs text-foreground font-semibold">
                      {getCargoDisplayInfo(selectedCargo).description}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      {activeCargoPermissions.length} de {cargoCards.reduce((acc, c) => acc + c.permissions.length, 0)} permissões ativas para este cargo ({members.filter((m) => m.nivel === selectedCargo).length} {members.filter((m) => m.nivel === selectedCargo).length === 1 ? "membro ativo" : "membros ativos"}).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                    onClick={setAllCargoPermissions}
                  >
                    Marcar Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 font-bold border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                    onClick={setReadOnlyCargoPermissions}
                  >
                    Apenas Leitura
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={clearAllCargoPermissions}
                  >
                    Limpar Todas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BARRA DE BUSCA E FILTRO DE CATEGORIAS (CARGOS) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={cargoPermSearch}
                onChange={(e) => setCargoPermSearch(e.target.value)}
                placeholder="Buscar módulo, rota ou permissão nos cargos..."
                className="pl-8 h-8 text-xs rounded-xl bg-background/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant={cargoCategoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCargoCategoryFilter("all")}
                className="h-7 text-xs rounded-xl"
              >
                Todas as Categorias
              </Button>
              {cargoGroups.map((g) => (
                <Button
                  key={`cargo-cat-${g.category}`}
                  type="button"
                  variant={cargoCategoryFilter === g.category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCargoCategoryFilter(g.category)}
                  className="h-7 text-xs rounded-xl"
                >
                  {g.category} ({g.cards.length})
                </Button>
              ))}
            </div>
          </div>

          {/* Módulos de Permissões dos Cargos */}
          {loadingDbPermissions ? (
            <div className="flex items-center justify-center p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="text-xs text-muted-foreground font-medium">Carregando permissões do cargo...</p>
              </div>
            </div>
          ) : filteredCargoGroups.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl border-border/60 text-muted-foreground text-xs">
              Nenhum módulo ou permissão encontrado para a busca "{cargoPermSearch}".
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCargoGroups.map(({ category, cards }) => (
                <div key={`cargo-cat-group-${category}`} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400/90">
                      {category}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      ({cards.length} {cards.length === 1 ? "módulo" : "módulos"})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => {
                      const cardPermKeys = card.permissions.map((p) => p.key);
                      const activeInCard = cardPermKeys.filter((k) => activeCargoPermissions.includes(k)).length;
                      const isAllActive = activeInCard === cardPermKeys.length;
                      const Icon = card.icon;

                      return (
                        <Card
                          key={`cargo-card-${card.id}`}
                          className={cn(
                            "surface-card transition-all duration-200 border hover:border-emerald-500/30",
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

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCargoCardPermissions(card)}
                                  className={cn(
                                    "h-6 text-[10px] font-bold px-2 rounded-lg border transition-all cursor-pointer",
                                    isAllActive
                                      ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                      : "border-border/60 text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {isAllActive ? "Desmarcar Módulo" : "Marcar Módulo"}
                                </Button>
                                <Badge
                                  variant={isAllActive ? "default" : activeInCard > 0 ? "outline" : "secondary"}
                                  className="text-[10px] font-mono shrink-0"
                                >
                                  {activeInCard}/{cardPermKeys.length}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3 pt-0">
                            {card.permissions.map((perm) => {
                              const isChecked = activeCargoPermissions.includes(perm.key);

                              return (
                                <div
                                  key={`cargo-perm-${perm.key}`}
                                  onClick={() => toggleCargoPermission(perm.key)}
                                  className={cn(
                                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                    isChecked
                                      ? "bg-emerald-500/5 border-emerald-500/30 shadow-xs"
                                      : "bg-transparent border-transparent hover:bg-secondary/40 hover:border-border/50 opacity-75"
                                  )}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleCargoPermission(perm.key)}
                                    className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={cn(
                                          "text-xs font-semibold leading-none",
                                          isChecked ? "text-foreground font-bold" : "text-muted-foreground"
                                        )}
                                      >
                                        {perm.label}
                                      </span>
                                      <code className="text-[10px] font-mono text-muted-foreground/70 bg-secondary/50 px-1 py-0.2 rounded">
                                        {perm.key}
                                      </code>
                                      {perm.badge && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-mono py-0 px-1.5 border-emerald-500/30 text-emerald-400 shrink-0"
                                        >
                                          {perm.badge}
                                        </Badge>
                                      )}
                                      <Badge
                                        variant={isChecked ? "default" : "outline"}
                                        className={cn(
                                          "ml-auto text-[9px] font-mono py-0 px-1.5 shrink-0 transition-colors",
                                          isChecked
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
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

          {/* FLOATING ACTIVE ROLE SWITCHER BAR — TELEPORTADO DIRETAMENTE AO BODY PARA FIXAÇÃO ABSOLUTA E FLUTUAÇÃO PERFEITA */}
          {activeTab === "cargos" && mounted && typeof document !== "undefined" && createPortal(
            <div className="surface-card floating-widget fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-card/95 border border-emerald-500/50 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.65)] ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-[calc(100vw-1.5rem)]">
              {/* Cargo Ativo Atual */}
              <div className="flex items-center gap-2 pl-2 pr-1">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">Cargo:</span>
                  <Badge className={cn("text-xs px-2.5 py-0.5 font-bold shadow-xs", levelBadgeClass(selectedCargo))}>
                    {getCargoDisplayInfo(selectedCargo).label}
                  </Badge>
                </div>
                {isCargoSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400 shrink-0 ml-0.5" title="Sincronizando..." />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-0.5" title="Sincronizado em tempo real" />
                )}
              </div>

              {/* Seletor Rápido de Cargo em Botões (Telas Médias/Grandes) */}
              <div className="hidden lg:flex items-center gap-1 border-l border-r border-border/60 px-1.5">
                {activeRolesList.map((role) => {
                  const isSelected = selectedCargo === role.id;
                  const count = members.filter((m) => m.nivel === role.id).length;
                  return (
                    <button
                      key={`float-cargo-btn-${role.id}`}
                      type="button"
                      onClick={() => setSelectedCargo(role.id)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border",
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                          : "bg-secondary/40 border-transparent hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{role.nome}</span>
                      <span className={cn("text-[9px] px-1 rounded-md", isSelected ? "bg-black/30 text-white" : "text-muted-foreground")}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown para Trocar Cargo (Mobile / Compacto) */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-md cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Alternar</span>
                      <ChevronDown className="h-3.5 w-3.5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64 p-1.5 animate-in fade-in-50 zoom-in-95 duration-150 z-[10000]">
                    <DropdownMenuLabel className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-1 flex items-center justify-between">
                      <span>Alternar Cargo</span>
                      <span className="text-[9px] text-emerald-400 font-bold font-mono">Ao Vivo</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {activeRolesList.map((role) => {
                      const isSelected = selectedCargo === role.id;
                      const count = members.filter((m) => m.nivel === role.id).length;
                      return (
                        <DropdownMenuItem
                          key={`float-dd-cargo-${role.id}`}
                          onClick={() => setSelectedCargo(role.id)}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all mb-0.5",
                            isSelected
                              ? "bg-emerald-600 text-white font-black shadow-xs"
                              : "hover:bg-secondary text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-emerald-400")} />
                            <span>{role.nome}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] px-1.5 py-0 font-mono font-bold",
                                isSelected ? "bg-black/30 text-white" : "bg-background text-muted-foreground"
                              )}
                            >
                              {count}
                            </Badge>
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Ações Rápidas de Permissões */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/80 cursor-pointer shrink-0"
                    title="Ações rápidas de permissões"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5 z-[10000]">
                  <DropdownMenuItem onClick={setAllCargoPermissions} className="text-xs font-bold cursor-pointer hover:bg-secondary rounded-xl">
                    Marcar Todas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={setReadOnlyCargoPermissions} className="text-xs font-bold cursor-pointer hover:bg-secondary rounded-xl">
                    Apenas Leitura
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearAllCargoPermissions} className="text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-xl">
                    Limpar Todas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão de Voltar ao Topo */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 cursor-pointer shrink-0"
                title="Voltar ao topo da página"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 1: TAG DESENVOLVEDOR
          ========================================================================= */}
      {activeTab === "dev" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Informativo Tag Dev Aditiva */}
          <Card
            className="surface-card transition-all"
            style={{
              borderColor: `${devStyle.primaryHex}35`,
              background: `linear-gradient(to right, ${devStyle.primaryHex}15, ${devStyle.primaryHex}05, transparent)`,
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="p-3 rounded-2xl shadow-sm shrink-0"
                    style={{
                      backgroundColor: `${devStyle.primaryHex}20`,
                      color: devStyle.primaryHex,
                      borderColor: `${devStyle.primaryHex}40`,
                      borderWidth: "1px",
                    }}
                  >
                    <DevIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      Tag Desenvolvedor — Acesso Total ao Sistema
                      <DevBadge size="xs" />
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      As permissões marcadas abaixo são concedidas aos integrantes com a tag <strong>desenvolvedor</strong> e se somam aos privilégios do cargo.
                      O status da Tag Dev é controlado de forma 100% dinâmica pelo interruptor abaixo.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDevMembersOpen((prev) => !prev)}
                    className="px-4 py-2 rounded-xl bg-background/60 text-center transition-all hover:bg-background/90 hover:scale-105 cursor-pointer"
                    style={{ borderColor: `${devStyle.primaryHex}30`, borderWidth: "1px" }}
                    title={isDevMembersOpen ? "Clique para recolher membros" : "Clique para abrir gerenciamento de membros"}
                  >
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Devs Ativos
                    </span>
                    <span className="text-lg font-black" style={{ color: devStyle.primaryHex }}>
                      {activeDevsCount}
                    </span>
                  </button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* SEÇÃO 1 (DEV): BOTÃO COM ÍCONE PARA ABRIR O CARD DE ATRIBUIÇÃO DE MEMBROS */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDevMembersOpen((prev) => !prev)}
                className={cn(
                  "h-11 px-4 rounded-xl border font-bold text-xs flex items-center gap-3 transition-all shadow-xs cursor-pointer select-none",
                  isDevMembersOpen
                    ? "bg-secondary text-foreground"
                    : "bg-card hover:bg-secondary/70 text-foreground border-border/80"
                )}
                style={{
                  borderColor: isDevMembersOpen ? `${devStyle.primaryHex}60` : undefined,
                  boxShadow: isDevMembersOpen ? `0 0 15px ${devStyle.primaryHex}15` : undefined,
                }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0 transition-transform"
                  style={{
                    backgroundColor: `${devStyle.primaryHex}20`,
                    color: devStyle.primaryHex,
                  }}
                >
                  <DevIcon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold">Membros do grupo & Atribuição da Tag Dev</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-2 py-0.5"
                    style={{
                      borderColor: `${devStyle.primaryHex}40`,
                      backgroundColor: `${devStyle.primaryHex}15`,
                      color: devStyle.primaryHex,
                    }}
                  >
                    {activeDevsCount} {activeDevsCount === 1 ? "Dev ativo" : "Devs ativos"}
                  </Badge>
                </div>
                <div className="ml-1 text-muted-foreground flex items-center gap-1">
                  <span className="text-[11px] font-normal hidden sm:inline">
                    {isDevMembersOpen ? "Recolher" : "Abrir"}
                  </span>
                  {isDevMembersOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" style={{ color: devStyle.primaryHex }} />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </div>
              </Button>
            </div>

            {/* CARD ABERTO QUANDO O BOTÃO É CLICADO */}
            {isDevMembersOpen && (
              <Card
                className="surface-card border-border/80 animate-in fade-in-50 slide-in-from-top-2 duration-200"
                style={{
                  borderColor: `${devStyle.primaryHex}40`,
                  boxShadow: `0 0 20px ${devStyle.primaryHex}08`,
                }}
              >
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <DevIcon className="h-4 w-4" style={{ color: devStyle.primaryHex }} />
                          Membros do grupo & Atribuição da Tag Dev
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsDevMembersOpen(false)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer sm:hidden"
                          title="Fechar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
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
                          className="pl-8 pr-7 h-8 text-xs bg-background/50"
                        />
                        {searchDevMember && (
                          <button
                            type="button"
                            onClick={() => setSearchDevMember("")}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Limpar busca"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                            filterDevOnly !== "dev_only" && "text-muted-foreground hover:text-foreground"
                          )}
                          style={
                            filterDevOnly === "dev_only"
                              ? {
                                  backgroundColor: `${devStyle.primaryHex}20`,
                                  color: devStyle.primaryHex,
                                  borderColor: `${devStyle.primaryHex}40`,
                                  borderWidth: "1px",
                                }
                              : undefined
                          }
                        >
                          <DevIcon className="h-3.5 w-3.5" />
                          Devs ({activeDevsCount})
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDevMembersOpen(false)}
                        className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer hidden sm:flex items-center gap-1"
                        title="Recolher card de membros"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        Recolher
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {loadingMembers ? (
                    <div className="py-8 flex items-center justify-center text-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" style={{ color: devStyle.primaryHex }} />
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
                              !isDev && "bg-secondary/20 border-border/60 hover:bg-secondary/40"
                            )}
                            style={
                              isDev
                                ? {
                                    backgroundColor: `${devStyle.primaryHex}12`,
                                    borderColor: `${devStyle.primaryHex}40`,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={member.avatar_url || member.discord_avatar_url || "/placeholder-avatar.png"}
                                alt={member.nome}
                                className={cn(
                                  "h-9 w-9 rounded-full object-cover border shrink-0",
                                  !isDev && "border-border"
                                )}
                                style={
                                  isDev
                                    ? {
                                        borderColor: devStyle.primaryHex,
                                        boxShadow: `0 0 0 2px ${devStyle.primaryHex}35`,
                                      }
                                    : undefined
                                }
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {member.nickname || member.nome}
                                  </span>
                                  {isDev && <DevBadge size="xs" />}
                                  {isCeo && <CeoBadge size="xs" />}
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
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: devStyle.primaryHex }} />
                              ) : (
                                <Switch
                                  id={`dev-toggle-${member.user_id}`}
                                  checked={isDev}
                                  onCheckedChange={() =>
                                    handleToggleDevTag(member.user_id, isDev, member.nickname || member.nome)
                                  }
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
            )}
          </div>

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

          {/* BARRA DE BUSCA E FILTRO DE CATEGORIAS (DEV) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={devPermSearch}
                onChange={(e) => setDevPermSearch(e.target.value)}
                placeholder="Buscar módulo, rota ou permissão na Tag Dev..."
                className="pl-8 h-8 text-xs rounded-xl bg-background/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant={devCategoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setDevCategoryFilter("all")}
                className="h-7 text-xs rounded-xl"
              >
                Todas as Categorias
              </Button>
              {devGroups.map((g) => (
                <Button
                  key={`dev-cat-${g.category}`}
                  type="button"
                  variant={devCategoryFilter === g.category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDevCategoryFilter(g.category)}
                  className="h-7 text-xs rounded-xl"
                >
                  {g.category} ({g.cards.length})
                </Button>
              ))}
            </div>
          </div>

          {/* Módulos de Permissões Tag Dev */}
          {loadingDev ? (
            <div className="flex items-center justify-center p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
                <p className="text-xs text-muted-foreground font-medium">Carregando permissões da Tag Dev...</p>
              </div>
            </div>
          ) : filteredDevGroups.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl border-border/60 text-muted-foreground text-xs">
              Nenhum módulo ou permissão encontrado para a busca "{devPermSearch}".
            </div>
          ) : (
            <div className="space-y-8">
              {filteredDevGroups.map(({ category, cards }) => (
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

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const allIn = cardPermKeys.every((k) => activeDevPermissions.includes(k));
                                    const next = allIn
                                      ? activeDevPermissions.filter((k) => !cardPermKeys.includes(k))
                                      : [...activeDevPermissions, ...cardPermKeys.filter((k) => !activeDevPermissions.includes(k))];
                                    setActiveDevPermissions(next);
                                    void autoSaveDevTagPermissions(next);
                                  }}
                                  className={cn(
                                    "h-6 text-[10px] font-bold px-2 rounded-lg border transition-all cursor-pointer",
                                    isAllActive
                                      ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                      : "border-border/60 text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {isAllActive ? "Desmarcar Módulo" : "Marcar Módulo"}
                                </Button>
                                <Badge
                                  variant={isAllActive ? "default" : activeInCard > 0 ? "outline" : "secondary"}
                                  className="text-[10px] font-mono shrink-0"
                                >
                                  {activeInCard}/{cardPermKeys.length}
                                </Badge>
                              </div>
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
          ABA 2: TAG CEO (DIRETORIA EXECUTIVA)
          ========================================================================= */}
      {activeTab === "ceo" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Informativo Tag CEO */}
          <Card
            className="surface-card transition-all"
            style={{
              borderColor: `${ceoStyle.primaryHex}35`,
              background: `linear-gradient(to right, ${ceoStyle.primaryHex}15, ${ceoStyle.primaryHex}05, transparent)`,
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="p-3 rounded-2xl shadow-sm shrink-0"
                    style={{
                      backgroundColor: `${ceoStyle.primaryHex}20`,
                      color: ceoStyle.primaryHex,
                      borderColor: `${ceoStyle.primaryHex}40`,
                      borderWidth: "1px",
                    }}
                  >
                    <CeoIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      Tag CEO — Diretoria Executiva
                      <CeoBadge size="xs" />
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      A Tag CEO concede distinção executiva com emblema oficial em perfis, chat e lista de membros.
                      Toda a matriz de permissões abaixo se soma ao cargo do membro, e <strong>apenas Desenvolvedores com a Tag Dev têm o poder de atribuir ou revogar a Tag CEO</strong>.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCeoMembersOpen((prev) => !prev)}
                    className="px-4 py-2 rounded-xl bg-background/60 text-center transition-all hover:bg-background/90 hover:scale-105 cursor-pointer"
                    style={{ borderColor: `${ceoStyle.primaryHex}30`, borderWidth: "1px" }}
                    title={isCeoMembersOpen ? "Clique para recolher membros" : "Clique para abrir gerenciamento de membros"}
                  >
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                      CEOs Ativos
                    </span>
                    <span className="text-lg font-black" style={{ color: ceoStyle.primaryHex }}>
                      {activeCeosCount}
                    </span>
                  </button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* SEÇÃO 1 (CEO): BOTÃO COM ÍCONE PARA ABRIR O CARD DE ATRIBUIÇÃO DE MEMBROS */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCeoMembersOpen((prev) => !prev)}
                className={cn(
                  "h-11 px-4 rounded-xl border font-bold text-xs flex items-center gap-3 transition-all shadow-xs cursor-pointer select-none",
                  isCeoMembersOpen
                    ? "bg-secondary text-foreground"
                    : "bg-card hover:bg-secondary/70 text-foreground border-border/80"
                )}
                style={{
                  borderColor: isCeoMembersOpen ? `${ceoStyle.primaryHex}60` : undefined,
                  boxShadow: isCeoMembersOpen ? `0 0 15px ${ceoStyle.primaryHex}15` : undefined,
                }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0 transition-transform"
                  style={{
                    backgroundColor: `${ceoStyle.primaryHex}20`,
                    color: ceoStyle.primaryHex,
                  }}
                >
                  <CeoIcon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold">Membros do grupo & Atribuição da Tag CEO</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-2 py-0.5"
                    style={{
                      borderColor: `${ceoStyle.primaryHex}40`,
                      backgroundColor: `${ceoStyle.primaryHex}15`,
                      color: ceoStyle.primaryHex,
                    }}
                  >
                    {activeCeosCount} {activeCeosCount === 1 ? "CEO ativo" : "CEOs ativos"}
                  </Badge>
                </div>
                <div className="ml-1 text-muted-foreground flex items-center gap-1">
                  <span className="text-[11px] font-normal hidden sm:inline">
                    {isCeoMembersOpen ? "Recolher" : "Abrir"}
                  </span>
                  {isCeoMembersOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" style={{ color: ceoStyle.primaryHex }} />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </div>
              </Button>
            </div>

            {/* CARD ABERTO QUANDO O BOTÃO É CLICADO */}
            {isCeoMembersOpen && (
              <Card
                className="surface-card border-border/80 animate-in fade-in-50 slide-in-from-top-2 duration-200"
                style={{
                  borderColor: `${ceoStyle.primaryHex}40`,
                  boxShadow: `0 0 20px ${ceoStyle.primaryHex}08`,
                }}
              >
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <CeoIcon className="h-4 w-4" style={{ color: ceoStyle.primaryHex }} />
                          Membros do grupo & Atribuição da Tag CEO
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCeoMembersOpen(false)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer sm:hidden"
                          title="Fechar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
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
                          className="pl-8 pr-7 h-8 text-xs bg-background/50"
                        />
                        {searchMember && (
                          <button
                            type="button"
                            onClick={() => setSearchMember("")}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Limpar busca"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                            filterCeoOnly !== "ceo_only" && "text-muted-foreground hover:text-foreground"
                          )}
                          style={
                            filterCeoOnly === "ceo_only"
                              ? {
                                  backgroundColor: `${ceoStyle.primaryHex}20`,
                                  color: ceoStyle.primaryHex,
                                  borderColor: `${ceoStyle.primaryHex}40`,
                                  borderWidth: "1px",
                                }
                              : undefined
                          }
                        >
                          <CeoIcon className="h-3.5 w-3.5" />
                          CEOs ({activeCeosCount})
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCeoMembersOpen(false)}
                        className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer hidden sm:flex items-center gap-1"
                        title="Recolher card de membros"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        Recolher
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {loadingMembers ? (
                    <div className="py-8 flex items-center justify-center text-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" style={{ color: ceoStyle.primaryHex }} />
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
                              !isCeo && "bg-secondary/20 border-border/60 hover:bg-secondary/40"
                            )}
                            style={
                              isCeo
                                ? {
                                    backgroundColor: `${ceoStyle.primaryHex}12`,
                                    borderColor: `${ceoStyle.primaryHex}40`,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={member.avatar_url || member.discord_avatar_url || "/placeholder-avatar.png"}
                                alt={member.nome}
                                className={cn(
                                  "h-9 w-9 rounded-full object-cover border shrink-0",
                                  !isCeo && "border-border"
                                )}
                                style={
                                  isCeo
                                    ? {
                                        borderColor: ceoStyle.primaryHex,
                                        boxShadow: `0 0 0 2px ${ceoStyle.primaryHex}35`,
                                      }
                                    : undefined
                                }
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {member.nickname || member.nome}
                                  </span>
                                  {isCeo && <CeoBadge size="xs" />}
                                  {isDev && <DevBadge size="xs" />}
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
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: ceoStyle.primaryHex }} />
                              ) : (
                                <Switch
                                  id={`ceo-toggle-${member.user_id}`}
                                  checked={isCeo}
                                  onCheckedChange={() =>
                                    handleToggleCeoTag(member.user_id, isCeo, member.nickname || member.nome)
                                  }
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
            )}
          </div>

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

          {/* BARRA DE BUSCA E FILTRO DE CATEGORIAS (CEO) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={ceoPermSearch}
                onChange={(e) => setCeoPermSearch(e.target.value)}
                placeholder="Buscar módulo, rota ou permissão na Tag CEO..."
                className="pl-8 h-8 text-xs rounded-xl bg-background/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant={ceoCategoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCeoCategoryFilter("all")}
                className="h-7 text-xs rounded-xl"
              >
                Todas as Categorias
              </Button>
              {ceoGroups.map((g) => (
                <Button
                  key={`ceo-cat-${g.category}`}
                  type="button"
                  variant={ceoCategoryFilter === g.category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCeoCategoryFilter(g.category)}
                  className="h-7 text-xs rounded-xl"
                >
                  {g.category} ({g.cards.length})
                </Button>
              ))}
            </div>
          </div>

          {/* MÓDULOS DE PERMISSÕES DA TAG CEO */}
          {loadingCeo ? (
            <div className="flex items-center justify-center p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="text-xs text-muted-foreground font-medium">Carregando permissões da Tag CEO...</p>
              </div>
            </div>
          ) : filteredCeoGroups.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl border-border/60 text-muted-foreground text-xs">
              Nenhum módulo ou permissão encontrado para a busca "{ceoPermSearch}".
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCeoGroups.map(({ category, cards }) => (
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

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const allIn = cardPermKeys.every((k) => activeCeoPermissions.includes(k));
                                    const next = allIn
                                      ? activeCeoPermissions.filter((k) => !cardPermKeys.includes(k))
                                      : [...activeCeoPermissions, ...cardPermKeys.filter((k) => !activeCeoPermissions.includes(k))];
                                    setActiveCeoPermissions(next);
                                    void autoSaveCeoTagPermissions(next);
                                  }}
                                  className={cn(
                                    "h-6 text-[10px] font-bold px-2 rounded-lg border transition-all cursor-pointer",
                                    isAllActive
                                      ? "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                                      : "border-border/60 text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {isAllActive ? "Desmarcar Módulo" : "Marcar Módulo"}
                                </Button>
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

      {/* BALÃO FLUTUANTE DE ALTERNÂNCIA (TAG DEV vs TAG CEO) E NAVEGAÇÃO TOPO/FIM */}
      {(activeTab === "dev" || activeTab === "ceo") && mounted && typeof document !== "undefined" && createPortal(
        <div
          className={cn(
            "surface-card floating-widget fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto",
            "flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-card/95 backdrop-blur-2xl",
            "shadow-[0_15px_50px_rgba(0,0,0,0.65)] ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-[calc(100vw-1.5rem)]",
            "border transition-all"
          )}
          style={{
            borderColor: activeTab === "dev" ? `${devStyle.primaryHex}60` : `${ceoStyle.primaryHex}60`,
            boxShadow: activeTab === "dev"
              ? `0 15px 50px rgba(0,0,0,0.65), 0 0 25px ${devStyle.primaryHex}20`
              : `0 15px 50px rgba(0,0,0,0.65), 0 0 25px ${ceoStyle.primaryHex}20`,
          }}
        >
          {/* Seletor Rápido de Permissões: Tag Dev vs Tag CEO */}
          <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/50">
            {/* Botão Tag Dev */}
            <button
              type="button"
              onClick={() => setActiveTab("dev")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer select-none",
                activeTab === "dev"
                  ? "shadow-sm scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 opacity-80"
              )}
              style={
                activeTab === "dev"
                  ? {
                      backgroundColor: `${devStyle.primaryHex}25`,
                      color: devStyle.primaryHex,
                      border: `1px solid ${devStyle.primaryHex}60`,
                      boxShadow: `0 2px 10px ${devStyle.primaryHex}25`,
                    }
                  : undefined
              }
              title="Alternar para Permissões da Tag Dev"
            >
              <DevIcon className="h-3.5 w-3.5 shrink-0" style={{ color: activeTab === "dev" ? devStyle.primaryHex : undefined }} />
              <span>Tag Dev</span>
              <Badge
                variant="outline"
                className="text-[9px] font-mono px-1.5 py-0 font-bold hidden sm:inline-flex"
                style={
                  activeTab === "dev"
                    ? {
                        borderColor: `${devStyle.primaryHex}40`,
                        color: devStyle.primaryHex,
                        backgroundColor: `${devStyle.primaryHex}15`,
                      }
                    : undefined
                }
              >
                {activeDevPermissions.length}
              </Badge>
            </button>

            {/* Botão Tag CEO */}
            <button
              type="button"
              onClick={() => setActiveTab("ceo")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer select-none",
                activeTab === "ceo"
                  ? "shadow-sm scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 opacity-80"
              )}
              style={
                activeTab === "ceo"
                  ? {
                      backgroundColor: `${ceoStyle.primaryHex}25`,
                      color: ceoStyle.primaryHex,
                      border: `1px solid ${ceoStyle.primaryHex}60`,
                      boxShadow: `0 2px 10px ${ceoStyle.primaryHex}25`,
                    }
                  : undefined
              }
              title="Alternar para Permissões da Tag CEO"
            >
              <CeoIcon className="h-3.5 w-3.5 shrink-0" style={{ color: activeTab === "ceo" ? ceoStyle.primaryHex : undefined }} />
              <span>Tag CEO</span>
              <Badge
                variant="outline"
                className="text-[9px] font-mono px-1.5 py-0 font-bold hidden sm:inline-flex"
                style={
                  activeTab === "ceo"
                    ? {
                        borderColor: `${ceoStyle.primaryHex}40`,
                        color: ceoStyle.primaryHex,
                        backgroundColor: `${ceoStyle.primaryHex}15`,
                      }
                    : undefined
                }
              >
                {activeCeoPermissions.length}
              </Badge>
            </button>
          </div>

          {/* Divisor vertical */}
          <div className="h-6 w-px bg-border/60 shrink-0" />

          {/* Opção de Rolagem: Ir para o Final quando no Topo, Ir para o Início quando no Final */}
          {isAtTop ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: "smooth",
                });
              }}
              className="h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/80 cursor-pointer shadow-xs transition-all text-foreground hover:border-primary/50 shrink-0"
              title="Ir para o final da página"
            >
              <ChevronsDown className="h-3.5 w-3.5 text-primary animate-bounce shrink-0" />
              <span className="hidden sm:inline">Ir para o final</span>
              <span className="sm:hidden">Final</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className="h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/80 cursor-pointer shadow-xs transition-all text-foreground hover:border-primary/50 shrink-0"
              title="Voltar ao início da página"
            >
              <ChevronsUp className="h-3.5 w-3.5 text-primary animate-bounce shrink-0" />
              <span className="hidden sm:inline">Ir para o início</span>
              <span className="sm:hidden">Início</span>
            </Button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
