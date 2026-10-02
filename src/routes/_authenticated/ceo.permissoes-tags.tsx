import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Tag as TagIcon,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  Check,
  X,
  Filter,
  AlertTriangle,
  Info,
  ShoppingCart,
  Lock,
  Percent,
  Warehouse,
  Coins,
  Sparkles,
  ArrowRightLeft,
  RefreshCw,
} from "lucide-react";
import { CeoGuard } from "@/guards/CeoGuard";
import { PageHeader, CeoBadge, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useMemberTags, useMemberTagAssignments, useMemberTagMutations } from "@/hooks/useMemberTags";
import { MemberTagBadge, resolveTagIcon } from "@/components/ui/MemberTagBadge";
import { PAGE_CARDS, type PageCardConfig } from "@/lib/permissionCards";
import { ALL_PERMISSIONS, type Permission, LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MemberTag, MemberTagRules } from "@/services/memberTagsService";

export const Route = createFileRoute("/_authenticated/ceo/permissoes-tags")({
  component: CeoPermissoesTagsPageWrapper,
});

export function CeoPermissoesTagsPageWrapper() {
  return (
    <CeoGuard>
      <CeoPermissoesTagsPage />
    </CeoGuard>
  );
}

export function CeoPermissoesTagsPage() {
  const { isDevUser, isCeoUser } = useAuth();
  const { data: tags = [], isLoading: loadingTags } = useMemberTags();
  const { data: assignments = [], isLoading: loadingAssignments } = useMemberTagAssignments();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { updatePermissionsAndRulesMutation, toggleAssignmentMutation } = useMemberTagMutations();

  // Tag selecionada para edição
  const [selectedTagId, setSelectedTagId] = useState<string>("vendedor");

  // Garante que se a tag selecionada não existir, seleciona a primeira
  useEffect(() => {
    if (tags.length > 0) {
      if (!tags.some((t) => t.id === selectedTagId)) {
        setSelectedTagId(tags[0].id);
      }
    }
  }, [tags, selectedTagId]);

  const selectedTag = useMemo(() => {
    return tags.find((t) => t.id === selectedTagId) || tags[0] || null;
  }, [tags, selectedTagId]);

  // Estados locais das permissões e regras da tag selecionada (para permitir editar e salvar)
  const [localPermissions, setLocalPermissions] = useState<Permission[]>([]);
  const [localRules, setLocalRules] = useState<MemberTagRules>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sincroniza estado local quando a tag selecionada muda
  useEffect(() => {
    if (selectedTag) {
      setLocalPermissions(Array.isArray(selectedTag.permissions) ? [...selectedTag.permissions] : []);
      setLocalRules(selectedTag.rules ? { ...selectedTag.rules } : {});
      setHasUnsavedChanges(false);
    }
  }, [selectedTag?.id, selectedTag?.updated_at]);

  // Aba interna da tag selecionada
  const [activeSubTab, setActiveSubTab] = useState<"permissions" | "rules" | "members">("permissions");

  // Filtros de busca na aba de permissões
  const [permSearch, setPermSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filtro de busca na aba de membros vinculados
  const [memberSearch, setMemberSearch] = useState("");

  // Categorias disponíveis a partir dos PAGE_CARDS
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    PAGE_CARDS.forEach((c) => cats.add(c.defaultCat || "Geral"));
    return Array.from(cats);
  }, []);

  // Cards de permissões filtrados
  const filteredPageCards = useMemo(() => {
    return PAGE_CARDS.filter((card) => {
      if (categoryFilter !== "all" && (card.defaultCat || "Geral") !== categoryFilter) {
        return false;
      }
      if (!permSearch) return true;
      const q = permSearch.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchDesc = card.description.toLowerCase().includes(q);
      const matchPerms = card.permissions.some(
        (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchPerms;
    });
  }, [categoryFilter, permSearch]);

  // Membros vinculados à tag selecionada
  const assignedMembers = useMemo(() => {
    if (!selectedTag) return [];
    const memberIds = new Set(
      assignments.filter((a) => a.tag_id === selectedTag.id).map((a) => a.member_id)
    );
    return members.filter((m) => memberIds.has(m.user_id));
  }, [assignments, selectedTag?.id, members]);

  const filteredAssignedMembers = useMemo(() => {
    if (!memberSearch) return assignedMembers;
    const q = memberSearch.toLowerCase();
    return assignedMembers.filter((m) => {
      const matchName = m.nome.toLowerCase().includes(q);
      const matchNick = (m.nickname || "").toLowerCase().includes(q);
      const matchGameId = (m.game_id || "").includes(q);
      const matchNivel = (m.nivel || "").toLowerCase().includes(q);
      return matchName || matchNick || matchGameId || matchNivel;
    });
  }, [assignedMembers, memberSearch]);

  // Handlers de Permissão
  const handleTogglePermission = (permKey: Permission) => {
    setLocalPermissions((prev) => {
      const exists = prev.includes(permKey);
      const next = exists ? prev.filter((p) => p !== permKey) : [...prev, permKey];
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleToggleAllInCard = (card: PageCardConfig) => {
    const cardPermKeys = card.permissions.map((p) => p.key);
    const allActive = cardPermKeys.every((k) => localPermissions.includes(k));

    setLocalPermissions((prev) => {
      let next: Permission[];
      if (allActive) {
        next = prev.filter((k) => !cardPermKeys.includes(k));
      } else {
        const toAdd = cardPermKeys.filter((k) => !prev.includes(k));
        next = [...prev, ...toAdd];
      }
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredKeys = filteredPageCards.flatMap((c) => c.permissions.map((p) => p.key));
    setLocalPermissions((prev) => {
      const set = new Set([...prev, ...allFilteredKeys]);
      setHasUnsavedChanges(true);
      return Array.from(set);
    });
  };

  const handleClearAllFiltered = () => {
    const allFilteredKeys = new Set(filteredPageCards.flatMap((c) => c.permissions.map((p) => p.key)));
    setLocalPermissions((prev) => {
      const next = prev.filter((k) => !allFilteredKeys.has(k));
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Handlers de Regras
  const handleRuleChange = (key: keyof MemberTagRules, value: any) => {
    setLocalRules((prev) => {
      const next = { ...prev, [key]: value };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Salvar alterações da tag selecionada
  const handleSaveTag = async () => {
    if (!selectedTag) return;
    try {
      await updatePermissionsAndRulesMutation.mutateAsync({
        tagId: selectedTag.id,
        permissions: localPermissions,
        rules: localRules,
      });
      setHasUnsavedChanges(false);
      // Dispara evento para atualização instantânea de cache
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
      }
    } catch (e: any) {
      // Já tratado na mutation
    }
  };

  const handleDiscardChanges = () => {
    if (!selectedTag) return;
    setLocalPermissions(Array.isArray(selectedTag.permissions) ? [...selectedTag.permissions] : []);
    setLocalRules(selectedTag.rules ? { ...selectedTag.rules } : {});
    setHasUnsavedChanges(false);
    toast.info("Modificações não salvas foram descartadas.");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO */}
      <PageHeader
        title="Permissões de Tags de Membros"
        description="Painel Executivo CEO para definir permissões granulares, regras de limitação operacional e auditar os membros associados a cada Tag."
        badge={<CeoBadge />}
        actions={
          hasUnsavedChanges && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={updatePermissionsAndRulesMutation.isPending}
                className="h-9 text-xs rounded-xl"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTag}
                disabled={updatePermissionsAndRulesMutation.isPending}
                className="h-9 px-4 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {updatePermissionsAndRulesMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )
        }
      />

      {loadingTags ? (
        <TableSkeleton rows={4} cols={3} />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="Nenhuma tag cadastrada"
          description="Nenhuma tag foi encontrada no sistema. Peça a um desenvolvedor para criar as tags no painel DEV."
        />
      ) : (
        <div className="space-y-6">
          {/* SELETOR DE TAGS EM CARDS/PILLS */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selecione a Tag para Gerenciar
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tags.map((tag) => {
                const Icon = resolveTagIcon(tag.icon);
                const isSelected = selectedTag?.id === tag.id;
                const memberCount = assignments.filter((a) => a.tag_id === tag.id).length;
                const permCount = Array.isArray(tag.permissions) ? tag.permissions.length : 0;

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (confirm("Você possui alterações não salvas nesta tag. Deseja trocar de tag e descartar as mudanças?")) {
                          setSelectedTagId(tag.id);
                        }
                      } else {
                        setSelectedTagId(tag.id);
                      }
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3",
                      isSelected
                        ? "bg-secondary/40 shadow-md ring-2 ring-amber-500/40"
                        : "bg-secondary/15 hover:bg-secondary/30 border-border/60"
                    )}
                    style={{
                      borderColor: isSelected ? tag.color : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            borderColor: `${tag.color}40`,
                            color: tag.color,
                          }}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{tag.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">#{tag.id}</p>
                        </div>
                      </div>

                      {tag.rules?.is_blocked && (
                        <Badge variant="outline" className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/30">
                          Bloqueio
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/40 font-mono">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {memberCount} membro(s)
                      </span>
                      <span className="text-amber-400 font-bold">
                        {permCount} perm.
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PAINEL DA TAG SELECIONADA */}
          {selectedTag && (
            <Card className="surface-card border-border/80 overflow-hidden shadow-xl">
              <CardHeader className="border-b border-border/60 bg-muted/10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MemberTagBadge tag={selectedTag} size="md" />
                    <div>
                      <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                        <span>Configurações Executivas: {selectedTag.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {selectedTag.description || "Sem descrição informada."}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/40 text-xs">
                        Alterações pendentes de salvamento
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSaveTag}
                      disabled={!hasUnsavedChanges || updatePermissionsAndRulesMutation.isPending}
                      className={cn(
                        "h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition-all",
                        hasUnsavedChanges
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/25"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{updatePermissionsAndRulesMutation.isPending ? "Salvando..." : "Salvar"}</span>
                    </Button>
                  </div>
                </div>

                {/* TABS INTERNAS */}
                <div className="pt-3">
                  <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)}>
                    <TabsList className="bg-secondary/40 p-1 rounded-xl">
                      <TabsTrigger value="permissions" className="text-xs rounded-lg gap-1.5 font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Permissões da Tag ({localPermissions.length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="rules" className="text-xs rounded-lg gap-1.5 font-bold">
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Regras & Limitações</span>
                      </TabsTrigger>
                      <TabsTrigger value="members" className="text-xs rounded-lg gap-1.5 font-bold">
                        <Users className="h-3.5 w-3.5" />
                        <span>Membros Vinculados ({assignedMembers.length})</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {/* ========================================================= */}
                {/* ABA 1: PERMISSÕES DA TAG */}
                {/* ========================================================= */}
                {activeSubTab === "permissions" && (
                  <div className="space-y-4">
                    {/* Barra de Busca e Filtro de Categoria */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar permissão por nome, módulo ou palavra-chave..."
                          value={permSearch}
                          onChange={(e) => setPermSearch(e.target.value)}
                          className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllFiltered}
                          className="h-8 text-[11px] px-2.5 rounded-xl border-border/70 hover:text-foreground"
                        >
                          <Check className="h-3 w-3 mr-1 text-emerald-400" />
                          Marcar Filtradas
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllFiltered}
                          className="h-8 text-[11px] px-2.5 rounded-xl border-border/70 hover:text-foreground"
                        >
                          <X className="h-3 w-3 mr-1 text-rose-400" />
                          Desmarcar Filtradas
                        </Button>
                      </div>
                    </div>

                    {/* Filtros de Categoria */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("all")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer border",
                          categoryFilter === "all"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                            : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border/40"
                        )}
                      >
                        Todas as Categorias
                      </button>
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl font-semibold transition-all text-xs cursor-pointer border whitespace-nowrap",
                            categoryFilter === cat
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold"
                              : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border/40"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* LISTA DE CARDS DE PERMISSÃO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPageCards.map((card) => {
                        const CardIcon = card.icon;
                        const cardPermKeys = card.permissions.map((p) => p.key);
                        const activeCountInCard = cardPermKeys.filter((k) => localPermissions.includes(k)).length;
                        const allActive = activeCountInCard === cardPermKeys.length;

                        return (
                          <div
                            key={card.id}
                            className="p-4 rounded-2xl bg-secondary/15 border border-border/60 space-y-3 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/40">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-border/60 flex items-center justify-center shrink-0 text-foreground">
                                    <CardIcon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs text-foreground truncate">{card.title}</h4>
                                    <p className="text-[10px] text-muted-foreground font-mono truncate">{card.route}</p>
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAllInCard(card)}
                                  className="h-6 text-[10px] px-2 rounded-lg font-mono text-muted-foreground hover:text-foreground"
                                >
                                  {allActive ? "Desmarcar" : "Marcar todas"} ({activeCountInCard}/{cardPermKeys.length})
                                </Button>
                              </div>

                              <p className="text-[11px] text-muted-foreground pt-2 pb-1">
                                {card.description}
                              </p>

                              {/* LISTA DE PERMISSÕES GRANULARES */}
                              <div className="space-y-2 pt-2 divide-y divide-border/30">
                                {card.permissions.map((perm) => {
                                  const isChecked = localPermissions.includes(perm.key);
                                  return (
                                    <div
                                      key={perm.key}
                                      onClick={() => handleTogglePermission(perm.key)}
                                      className="flex items-start justify-between gap-3 pt-2 cursor-pointer hover:bg-muted/10 p-1.5 rounded-lg transition-colors"
                                    >
                                      <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className={cn("text-xs font-semibold", isChecked ? "text-foreground font-bold" : "text-muted-foreground")}>
                                            {perm.label}
                                          </p>
                                          {perm.badge && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20">
                                              {perm.badge}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-snug">
                                          {perm.description}
                                        </p>
                                      </div>

                                      <Switch
                                        checked={isChecked}
                                        onCheckedChange={() => handleTogglePermission(perm.key)}
                                        className="shrink-0 mt-0.5"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* ABA 2: REGRAS & LIMITAÇÕES */}
                {/* ========================================================= */}
                {activeSubTab === "rules" && (
                  <div className="space-y-6 max-w-3xl">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
                      <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">Comportamento das Regras da Tag:</strong>
                        <p className="text-muted-foreground mt-0.5">
                          As regras configuradas nesta aba afetam diretamente os fluxos de trabalho e bloqueios dos membros que possuem esta tag, complementando a matriz de permissões.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                        Diretrizes de Restrição & Bloqueio
                      </h4>

                      {/* BLOQUEAR OPERAÇÕES */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Ações e Operações do Membro</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Se ativado, impede que o membro execute novas vendas, transferências de baús, produção de itens ou movimentação de fundos.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(localRules.is_blocked || localRules.block_operations)}
                          onCheckedChange={(val) => {
                            handleRuleChange("is_blocked", val);
                            handleRuleChange("block_operations", val);
                          }}
                        />
                      </div>

                      {/* BLOQUEAR VENDAS */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                            <ShoppingCart className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Operação de Vendas Comerciais</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede o registro de vendas comerciais no balcão e conferência de saída de itens de venda.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(localRules.block_sales)}
                          onCheckedChange={(val) => handleRuleChange("block_sales", val)}
                        />
                      </div>

                      {/* BLOQUEAR MOVIMENTAÇÕES */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                            <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400" />
                            <span>Bloquear Movimentações de Armazém e Baús</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede o envio e retorno de mercadorias entre o Armazém e os Baús da facção.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(localRules.block_movements)}
                          onCheckedChange={(val) => handleRuleChange("block_movements", val)}
                        />
                      </div>

                      {/* BLOQUEAR PRODUÇÃO */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                            <Warehouse className="h-3.5 w-3.5 text-amber-400" />
                            <span>Bloquear Fabricação na Estação de Produção</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede o início de novas produções de fábrica por membros com esta tag.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(localRules.block_productions)}
                          onCheckedChange={(val) => handleRuleChange("block_productions", val)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/50">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                        Diretrizes Comerciais & Descontos
                      </h4>

                      {/* HABILITAR BALCÃO DE VENDAS */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Habilitar Operador de Vendas</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Indica que o membro atua oficialmente como vendedor autorizado da facção.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(localRules.can_sell)}
                          onCheckedChange={(val) => handleRuleChange("can_sell", val)}
                        />
                      </div>

                      {/* LIMITE DE DESCONTO (%) */}
                      <div className="p-3.5 rounded-2xl bg-secondary/25 border border-border/60 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Percent className="h-3.5 w-3.5 text-sky-400" />
                              <span>Limite Máximo de Desconto Permitido nas Vendas</span>
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              Porcentagem máxima que o vendedor pode conceder de desconto em negociações sem aprovação prévia.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={localRules.max_discount_pct ?? 20}
                              onChange={(e) => handleRuleChange("max_discount_pct", Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
                              className="w-20 text-right font-mono font-bold text-emerald-400 rounded-xl"
                            />
                            <span className="text-xs font-mono font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/50">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                        Diretrizes de Testes & Experimentação
                      </h4>

                      {/* DEV TEST / FERRAMENTAS DE TESTE */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                            <span>Habilitar Modo Experimental / Ferramentas de Teste</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite ao membro testar rotas em desenvolvimento, simular eventos e auditar recursos experimentais.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(localRules.is_dev_test || localRules.experimental_features)}
                          onCheckedChange={(val) => {
                            handleRuleChange("is_dev_test", val);
                            handleRuleChange("experimental_features", val);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* ABA 3: MEMBROS VINCULADOS */}
                {/* ========================================================= */}
                {activeSubTab === "members" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar membro por nome, nickname, game ID ou cargo..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
                        />
                      </div>

                      <div className="text-xs font-mono text-muted-foreground">
                        Total vinculados: <strong className="text-foreground">{assignedMembers.length}</strong> membro(s)
                      </div>
                    </div>

                    {filteredAssignedMembers.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="Nenhum membro encontrado"
                        description={
                          memberSearch
                            ? "Nenhum membro corresponde aos termos de busca digitados."
                            : `Nenhum membro possui a tag "${selectedTag.name}" vinculada no momento.`
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredAssignedMembers.map((member) => {
                          const initials = (member.nickname || member.nome || "M")
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                          return (
                            <div
                              key={member.user_id}
                              className="p-3.5 rounded-2xl bg-secondary/15 border border-border/60 flex items-center justify-between gap-3 hover:bg-secondary/25 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                                  {member.discord_avatar_url && (
                                    <AvatarImage src={member.discord_avatar_url} alt={member.nome} />
                                  )}
                                  <AvatarFallback className="bg-secondary text-xs font-bold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-xs text-foreground truncate">
                                      {member.nickname || member.nome}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={cn("text-[9px] px-1 py-0 h-4 font-mono", levelBadgeClass(member.nivel))}
                                    >
                                      {LEVEL_LABEL[member.nivel as any] || member.nivel || "Membro"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                    <span>ID: #{member.game_id || "—"}</span>
                                    <span>·</span>
                                    <span>{member.telefone || "Sem tel."}</span>
                                  </div>
                                </div>
                              </div>

                              <MemberTagBadge tag={selectedTag} size="xs" showIcon={false} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
