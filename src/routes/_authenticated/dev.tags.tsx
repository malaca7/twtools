import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Tag as TagIcon,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Save,
  Check,
  X,
  Sparkles,
  Lock,
  ShoppingCart,
  Percent,
  Warehouse,
  Coins,
  RefreshCw,
  Info,
  Code2,
  Zap,
  Award,
  Crown,
  Flame,
  BadgeCheck,
  UserCheck,
  Star,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { PageHeader, DevBadge, TableSkeleton, EmptyState } from "@/components/ui-kit";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MemberTag, MemberTagRules } from "@/services/memberTagsService";

export const Route = createFileRoute("/_authenticated/dev/tags")({
  component: DevGerenciarTagsPageWrapper,
});

function DevGerenciarTagsPageWrapper() {
  return (
    <DeveloperGuard>
      <DevGerenciarTagsPage />
    </DeveloperGuard>
  );
}

const AVAILABLE_PALETTES = [
  { label: "Esmeralda", hex: "#10b981" },
  { label: "Azul Céu", hex: "#0ea5e9" },
  { label: "Índigo", hex: "#6366f1" },
  { label: "Violeta", hex: "#8b5cf6" },
  { label: "Rosa Choque", hex: "#ec4899" },
  { label: "Vermelho", hex: "#ef4444" },
  { label: "Âmbar", hex: "#f59e0b" },
  { label: "Ciano", hex: "#06b6d4" },
  { label: "Teal", hex: "#14b8a6" },
  { label: "Laranja", hex: "#f97316" },
];

const AVAILABLE_ICONS = [
  "Tag",
  "ShoppingCart",
  "ShieldAlert",
  "Code2",
  "Lock",
  "Sparkles",
  "Zap",
  "Award",
  "Crown",
  "Flame",
  "BadgeCheck",
  "UserCheck",
  "Star",
  "Settings",
];

export function DevGerenciarTagsPage() {
  const { data: tags = [], isLoading: loadingTags } = useMemberTags();
  const { data: assignments = [], isLoading: loadingAssignments } = useMemberTagAssignments();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const {
    saveTagMutation,
    deleteTagMutation,
    setTagMembersMutation,
    updatePermissionsAndRulesMutation,
  } = useMemberTagMutations();

  // Filtros de busca de tags
  const [tagSearch, setTagSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<"all" | "active" | "blocking" | "system">("all");

  // Modal de Criação / Edição de Tag
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<MemberTag | null>(null);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [formIcon, setFormIcon] = useState("Tag");
  const [formIsActive, setFormIsActive] = useState(true);

  // Modal de Vínculo de Membros à Tag
  const [tagForMembers, setTagForMembers] = useState<MemberTag | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberAssignSearch, setMemberAssignSearch] = useState("");

  // Modal de Permissões e Regras da Tag
  const [tagForPerms, setTagForPerms] = useState<MemberTag | null>(null);
  const [activePerms, setActivePerms] = useState<Permission[]>([]);
  const [activeRules, setActiveRules] = useState<MemberTagRules>({});
  const [permSearch, setPermSearch] = useState("");
  const [permSubTab, setPermSubTab] = useState<"permissions" | "rules">("permissions");

  // Métricas
  const metrics = useMemo(() => {
    const totalTags = tags.length;
    const totalAssignedMembers = new Set(assignments.map((a) => a.member_id)).size;
    const systemTags = tags.filter((t) => t.is_system).length;
    const blockingTags = tags.filter((t) => t.rules?.is_blocked).length;
    return { totalTags, totalAssignedMembers, systemTags, blockingTags };
  }, [tags, assignments]);

  // Lista de tags filtrada
  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      if (tagSearch) {
        const q = tagSearch.toLowerCase();
        const matchName = tag.name.toLowerCase().includes(q);
        const matchId = tag.id.toLowerCase().includes(q);
        const matchDesc = (tag.description || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDesc) return false;
      }

      if (tagFilter === "active" && !tag.is_active) return false;
      if (tagFilter === "blocking" && !tag.rules?.is_blocked) return false;
      if (tagFilter === "system" && !tag.is_system) return false;

      return true;
    });
  }, [tags, tagSearch, tagFilter]);

  // Abertura do Modal de Criação / Edição
  const handleOpenCreateModal = () => {
    setEditingTag(null);
    setFormId("");
    setFormName("");
    setFormDesc("");
    setFormColor("#10b981");
    setFormIcon("Tag");
    setFormIsActive(true);
    setIsTagModalOpen(true);
  };

  const handleOpenEditModal = (tag: MemberTag) => {
    setEditingTag(tag);
    setFormId(tag.id);
    setFormName(tag.name);
    setFormDesc(tag.description || "");
    setFormColor(tag.color || "#3b82f6");
    setFormIcon(tag.icon || "Tag");
    setFormIsActive(tag.is_active !== false);
    setIsTagModalOpen(true);
  };

  const handleSaveTagForm = async () => {
    if (!formName.trim()) {
      toast.error("Informe o nome da tag.");
      return;
    }
    const cleanId = (formId || formName)
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "_");

    if (!cleanId) {
      toast.error("Informe um identificador (slug) válido.");
      return;
    }

    try {
      await saveTagMutation.mutateAsync({
        id: editingTag ? editingTag.id : cleanId,
        name: formName.trim(),
        description: formDesc.trim() || null,
        color: formColor,
        icon: formIcon,
        is_active: formIsActive,
        permissions: editingTag ? editingTag.permissions : [],
        rules: editingTag ? editingTag.rules : {},
        is_system: editingTag ? editingTag.is_system : false,
      });
      setIsTagModalOpen(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
      }
    } catch (e) {
      // Já tratado na mutation
    }
  };

  // Abertura do Modal de Vínculo de Membros
  const handleOpenAssignMembersModal = (tag: MemberTag) => {
    setTagForMembers(tag);
    const existing = new Set(
      assignments.filter((a) => a.tag_id === tag.id).map((a) => a.member_id)
    );
    setSelectedMemberIds(existing);
    setMemberAssignSearch("");
  };

  const filteredMembersForAssign = useMemo(() => {
    if (!memberAssignSearch) return members;
    const q = memberAssignSearch.toLowerCase();
    return members.filter((m) => {
      const matchName = m.nome.toLowerCase().includes(q);
      const matchNick = (m.nickname || "").toLowerCase().includes(q);
      const matchGameId = (m.game_id || "").includes(q);
      const matchNivel = (m.nivel || "").toLowerCase().includes(q);
      return matchName || matchNick || matchGameId || matchNivel;
    });
  }, [members, memberAssignSearch]);

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllFilteredMembers = () => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      filteredMembersForAssign.forEach((m) => next.add(m.user_id));
      return next;
    });
  };

  const handleClearAllFilteredMembers = () => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      filteredMembersForAssign.forEach((m) => next.delete(m.user_id));
      return next;
    });
  };

  const handleSaveMemberAssignments = async () => {
    if (!tagForMembers) return;
    try {
      await setTagMembersMutation.mutateAsync({
        tagId: tagForMembers.id,
        memberIds: Array.from(selectedMemberIds),
      });
      setTagForMembers(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
      }
    } catch (e) {
      // Já tratado
    }
  };

  // Abertura do Modal de Permissões e Regras
  const handleOpenPermsModal = (tag: MemberTag) => {
    setTagForPerms(tag);
    setActivePerms(Array.isArray(tag.permissions) ? [...tag.permissions] : []);
    setActiveRules(tag.rules ? { ...tag.rules } : {});
    setPermSearch("");
    setPermSubTab("permissions");
  };

  const handleTogglePerm = (perm: Permission) => {
    setActivePerms((prev) => {
      return prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm];
    });
  };

  const handleToggleCardPerms = (card: PageCardConfig) => {
    const cardKeys = card.permissions.map((p) => p.key);
    const allIn = cardKeys.every((k) => activePerms.includes(k));
    setActivePerms((prev) => {
      if (allIn) {
        return prev.filter((k) => !cardKeys.includes(k));
      } else {
        const toAdd = cardKeys.filter((k) => !prev.includes(k));
        return [...prev, ...toAdd];
      }
    });
  };

  const handleSavePermsAndRules = async () => {
    if (!tagForPerms) return;
    try {
      await updatePermissionsAndRulesMutation.mutateAsync({
        tagId: tagForPerms.id,
        permissions: activePerms,
        rules: activeRules,
      });
      setTagForPerms(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
      }
    } catch (e) {
      // Tratado
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO */}
      <PageHeader
        title="Gerenciar Tags de Membros"
        description="Painel de Desenvolvimento para criação de novas tags, customização de identidades visuais, regras e vinculação direta aos membros."
        badge={<DevBadge />}
        actions={
          <Button
            onClick={handleOpenCreateModal}
            className="h-9 px-4 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tag</span>
          </Button>
        }
      />

      {/* METRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="surface-card border-border/70 p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total de Tags
          </span>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {metrics.totalTags}
          </p>
        </Card>
        <Card className="surface-card border-border/70 p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Membros com Tags
          </span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {metrics.totalAssignedMembers}
          </p>
        </Card>
        <Card className="surface-card border-border/70 p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tags de Sistema
          </span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            {metrics.systemTags}
          </p>
        </Card>
        <Card className="surface-card border-border/70 p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tags com Bloqueio
          </span>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">
            {metrics.blockingTags}
          </p>
        </Card>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tag por nome, slug ou descrição..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "Todas" },
            { id: "active", label: "Ativas" },
            { id: "blocking", label: "Restritivas" },
            { id: "system", label: "Sistema" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTagFilter(f.id as any)}
              className={cn(
                "h-8 px-3 text-xs rounded-xl transition-all cursor-pointer font-semibold border",
                tagFilter === f.id
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold"
                  : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE TAGS */}
      {loadingTags ? (
        <TableSkeleton rows={4} cols={3} />
      ) : filteredTags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="Nenhuma tag encontrada"
          description={
            tagSearch
              ? "Nenhuma tag corresponde aos filtros de busca."
              : "Nenhuma tag cadastrada ainda. Clique em 'Nova Tag' acima para criar a primeira!"
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => {
            const Icon = resolveTagIcon(tag.icon);
            const memberCount = assignments.filter((a) => a.tag_id === tag.id).length;
            const permCount = Array.isArray(tag.permissions) ? tag.permissions.length : 0;
            const isBlocked = Boolean(tag.rules?.is_blocked || tag.rules?.block_operations);

            return (
              <Card
                key={tag.id}
                className="surface-card border-border/80 overflow-hidden flex flex-col justify-between hover:border-border transition-all"
              >
                <div>
                  {/* HEADER DO CARD COM COR */}
                  <div
                    className="p-4 border-b flex items-start justify-between gap-3"
                    style={{
                      backgroundColor: `${tag.color}10`,
                      borderColor: `${tag.color}30`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
                        style={{
                          backgroundColor: `${tag.color}25`,
                          borderColor: `${tag.color}50`,
                          color: tag.color,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-foreground truncate">{tag.name}</h3>
                          {tag.is_system && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/30">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground block truncate">
                          slug: #{tag.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {tag.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 text-[9px]">
                          Inativa
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* CORPO DO CARD */}
                  <div className="p-4 space-y-3 text-xs">
                    <p className="text-muted-foreground line-clamp-2 min-h-[32px]">
                      {tag.description || "Nenhuma descrição definida."}
                    </p>

                    {/* FLAGS & BADGES DE REGRAS */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {isBlocked && (
                        <Badge variant="outline" className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/30">
                          Bloqueia Ações
                        </Badge>
                      )}
                      {tag.rules?.can_sell && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Vendedor
                        </Badge>
                      )}
                      {tag.rules?.is_dev_test && (
                        <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                          Dev Test
                        </Badge>
                      )}
                      {tag.rules?.max_discount_pct != null && (
                        <Badge variant="outline" className="text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/30 font-mono">
                          Max Desc: {tag.rules.max_discount_pct}%
                        </Badge>
                      )}
                    </div>

                    {/* CONTADORES */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 font-mono">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-sky-400" />
                        <strong className="text-foreground">{memberCount}</strong> membro(s)
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        <strong className="text-foreground">{permCount}</strong> permissão(ões)
                      </span>
                    </div>
                  </div>
                </div>

                {/* AÇÕES NO RODAPÉ */}
                <div className="p-3 bg-muted/10 border-t border-border/60 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* VINCULAR MEMBROS */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAssignMembersModal(tag)}
                      className="h-7 text-xs px-2.5 rounded-lg gap-1 border-border/70 hover:bg-secondary"
                      title="Vincular ou desvincular membros desta tag"
                    >
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                      <span>Membros</span>
                    </Button>

                    {/* PERMISSÕES & REGRAS */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPermsModal(tag)}
                      className="h-7 text-xs px-2.5 rounded-lg gap-1 border-border/70 hover:bg-secondary text-amber-300"
                      title="Configurar permissões e regras da tag"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Regras</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* EDITAR */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(tag)}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Editar detalhes visuais da tag"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* EXCLUIR */}
                    {!tag.is_system && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir a tag "${tag.name}"? Todos os membros vinculados a ela perderão suas permissões.`)) {
                            deleteTagMutation.mutate(tag.id);
                          }
                        }}
                        disabled={deleteTagMutation.isPending}
                        className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        title="Remover tag"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CRIAR OU EDITAR TAG (NOME, SLUG, COR, ÍCONE) */}
      {/* ========================================================= */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-emerald-400" />
              <span>{editingTag ? "Editar Tag de Membro" : "Nova Tag de Membro"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure as propriedades visuais, nome e identificador da tag.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL */}
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Pré-visualização:</span>
                <p className="text-[11px] text-muted-foreground">Como a tag aparecerá para os membros</p>
              </div>
              <MemberTagBadge
                tag={{
                  id: formId || "tag",
                  name: formName || "Nome da Tag",
                  color: formColor,
                  icon: formIcon,
                  is_system: false,
                  is_active: formIsActive,
                  permissions: [],
                  rules: {},
                  created_at: "",
                  updated_at: "",
                }}
                size="md"
              />
            </div>

            {/* NOME DA TAG */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Tag *</Label>
              <Input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingTag && !formId) {
                    setFormId(
                      e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9_-]/g, "_")
                    );
                  }
                }}
                placeholder="Ex: Vendedor, Bloqueado, Dev Test, Segurança"
                className="text-xs rounded-xl"
              />
            </div>

            {/* SLUG / IDENTIFICADOR */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Identificador Técnico (Slug) *</Label>
              <Input
                value={formId}
                onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_"))}
                disabled={Boolean(editingTag)}
                placeholder="vendedor, seguranca, mecanico"
                className="text-xs font-mono rounded-xl bg-background/50"
              />
              <p className="text-[10px] text-muted-foreground">
                Identificador único no banco de dados (letras minúsculas e underscores).
              </p>
            </div>

            {/* DESCRIÇÃO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Explique o propósito desta tag e quem deve recebê-la..."
                className="text-xs rounded-xl min-h-[60px]"
              />
            </div>

            {/* SELETOR DE COR */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cor da Tag</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVAILABLE_PALETTES.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setFormColor(c.hex)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all cursor-pointer",
                      formColor === c.hex ? "scale-125 border-foreground shadow-md ring-2 ring-primary/40" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
                <Input
                  type="text"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="#HEX"
                  className="w-24 h-7 text-xs font-mono rounded-lg ml-auto"
                />
              </div>
            </div>

            {/* SELETOR DE ÍCONE */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ícone da Tag</Label>
              <div className="grid grid-cols-7 gap-1.5 p-2 rounded-xl bg-secondary/30 border border-border/60">
                {AVAILABLE_ICONS.map((iconName) => {
                  const IconComp = resolveTagIcon(iconName);
                  const isSelected = formIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background/40 hover:bg-background/80 text-muted-foreground border-border/40"
                      )}
                      title={iconName}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SWITCH ATIVA */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">Tag Ativa</Label>
                <p className="text-[10px] text-muted-foreground">
                  Desative para suspender temporariamente as permissões e efeitos da tag.
                </p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveTagForm}
              disabled={saveTagMutation.isPending}
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl"
            >
              {saveTagMutation.isPending ? "Salvando..." : "Salvar Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: VINCULAR MEMBROS À TAG */}
      {/* ========================================================= */}
      <Dialog open={Boolean(tagForMembers)} onOpenChange={(open) => !open && setTagForMembers(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <span>Vincular Membros à Tag: {tagForMembers?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione os membros que devem receber esta tag e suas respectivas permissões automáticas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs flex-1 overflow-hidden flex flex-col">
            {/* BUSCA DE MEMBROS E AÇÕES EM LOTE */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, nickname, game ID ou cargo..."
                  value={memberAssignSearch}
                  onChange={(e) => setMemberAssignSearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl bg-background/50 border-border/60"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFilteredMembers}
                  className="h-7 text-[11px] px-2 rounded-lg"
                >
                  Marcar Filtrados
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilteredMembers}
                  className="h-7 text-[11px] px-2 rounded-lg"
                >
                  Desmarcar Filtrados
                </Button>
              </div>
            </div>

            {/* CONTADOR DE SELECIONADOS */}
            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-mono">
              <span>
                Membros vinculados: <strong className="text-emerald-400">{selectedMemberIds.size}</strong> de {members.length}
              </span>
              {memberAssignSearch && (
                <span>Filtrados: {filteredMembersForAssign.length}</span>
              )}
            </div>

            {/* LISTA ROLÁVEL DE MEMBROS */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-border/60 rounded-xl p-2 bg-secondary/15 max-h-[400px]">
              {filteredMembersForAssign.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Nenhum membro encontrado com os filtros aplicados.
                </div>
              ) : (
                filteredMembersForAssign.map((member) => {
                  const isChecked = selectedMemberIds.has(member.user_id);
                  const initials = (member.nickname || member.nome || "M")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={member.user_id}
                      onClick={() => handleToggleMember(member.user_id)}
                      className={cn(
                        "p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors",
                        isChecked
                          ? "bg-secondary/40 border-primary/40 shadow-sm"
                          : "bg-background/40 hover:bg-secondary/20 border-border/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                          {member.discord_avatar_url && (
                            <AvatarImage src={member.discord_avatar_url} alt={member.nome} />
                          )}
                          <AvatarFallback className="bg-secondary text-[10px] font-bold">
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

                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => handleToggleMember(member.user_id)}
                        className="shrink-0"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTagForMembers(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveMemberAssignments}
              disabled={setTagMembersMutation.isPending}
              className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl"
            >
              {setTagMembersMutation.isPending ? "Salvando..." : "Salvar Vínculos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: CONFIGURAR PERMISSÕES & REGRAS DA TAG (DEV) */}
      {/* ========================================================= */}
      <Dialog open={Boolean(tagForPerms)} onOpenChange={(open) => !open && setTagForPerms(null)}>
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>Configurações & Regras da Tag: {tagForPerms?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina as permissões granulares da plataforma e as regras operacionais desta tag.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-1 pb-3">
            <Tabs value={permSubTab} onValueChange={(v) => setPermSubTab(v as any)}>
              <TabsList className="bg-secondary/40 p-1 rounded-xl">
                <TabsTrigger value="permissions" className="text-xs rounded-lg gap-1.5 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Permissões do Sistema ({activePerms.length})</span>
                </TabsTrigger>
                <TabsTrigger value="rules" className="text-xs rounded-lg gap-1.5 font-bold">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Regras & Limitações</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {permSubTab === "permissions" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar permissões..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PAGE_CARDS.filter((c) => {
                    if (!permSearch) return true;
                    const q = permSearch.toLowerCase();
                    return (
                      c.title.toLowerCase().includes(q) ||
                      c.permissions.some((p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
                    );
                  }).map((card) => {
                    const CardIcon = card.icon;
                    const cardKeys = card.permissions.map((p) => p.key);
                    const allIn = cardKeys.every((k) => activePerms.includes(k));
                    const countIn = cardKeys.filter((k) => activePerms.includes(k)).length;

                    return (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-2xl bg-secondary/15 border border-border/60 space-y-2.5"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                          <div className="flex items-center gap-2">
                            <CardIcon className="h-4 w-4 text-primary" />
                            <span className="font-bold text-xs text-foreground">{card.title}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCardPerms(card)}
                            className="h-6 text-[10px] px-2 font-mono"
                          >
                            {allIn ? "Desmarcar" : "Marcar todas"} ({countIn}/{cardKeys.length})
                          </Button>
                        </div>

                        <div className="space-y-1.5 divide-y divide-border/30">
                          {card.permissions.map((p) => {
                            const isChecked = activePerms.includes(p.key);
                            return (
                              <div
                                key={p.key}
                                onClick={() => handleTogglePerm(p.key)}
                                className="flex items-start justify-between gap-2 pt-1.5 cursor-pointer hover:bg-muted/10 p-1 rounded-lg"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className={cn("text-xs", isChecked ? "font-bold text-foreground" : "text-muted-foreground")}>
                                    {p.label}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground leading-snug">{p.description}</p>
                                </div>
                                <Switch checked={isChecked} onCheckedChange={() => handleTogglePerm(p.key)} className="shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {permSubTab === "rules" && (
              <div className="space-y-4 max-w-2xl py-2 text-xs">
                {/* BLOQUEAR OPERAÇÕES */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      <span>Bloquear Todas as Operações</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Impede novas vendas, movimentações, transferências e produções.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(activeRules.is_blocked || activeRules.block_operations)}
                    onCheckedChange={(val) =>
                      setActiveRules((r) => ({ ...r, is_blocked: val, block_operations: val }))
                    }
                  />
                </div>

                {/* HABILITAR BALCÃO DE VENDAS */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Habilitar Vendas Comerciais</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Define a tag como operadora de vendas oficial.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(activeRules.can_sell)}
                    onCheckedChange={(val) => setActiveRules((r) => ({ ...r, can_sell: val }))}
                  />
                </div>

                {/* LIMITE DE DESCONTO */}
                <div className="p-3.5 rounded-2xl bg-secondary/25 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-sky-400" />
                        <span>Desconto Máximo Permitido (%)</span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Porcentagem máxima concedida por esta tag.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={activeRules.max_discount_pct ?? 20}
                        onChange={(e) =>
                          setActiveRules((r) => ({
                            ...r,
                            max_discount_pct: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)),
                          }))
                        }
                        className="w-20 text-right font-mono font-bold text-emerald-400 rounded-xl"
                      />
                      <span className="text-xs font-mono font-bold text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {/* MODO DEV TEST */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/25 border border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span>Modo Dev Test / Recursos Experimentais</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Habilita ferramentas de teste e simulação para o membro.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(activeRules.is_dev_test || activeRules.experimental_features)}
                    onCheckedChange={(val) =>
                      setActiveRules((r) => ({ ...r, is_dev_test: val, experimental_features: val }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTagForPerms(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePermsAndRules}
              disabled={updatePermissionsAndRulesMutation.isPending}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
            >
              {updatePermissionsAndRulesMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
