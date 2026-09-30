import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Award,
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  Shield,
  Star,
  Users,
  Sliders,
  History,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Crown,
  Zap,
  Flame,
  Medal,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DevBadge, CeoBadge, PageHeader } from "@/components/ui-kit";
import { usePanelTheme } from "@/lib/panelTheme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import {
  type InsigniaItem,
  type InsigniaRarity,
  type MemberInsigniaGrant,
  type XpTransaction,
  type XpRuleConfig,
  type RankedGamificationMember,
  RARITY_CONFIG,
  LEVEL_THRESHOLDS,
  getLevelInfo,
  getGamificationRanking,
  getMemberInsignias,
  devManageMemberXp,
  devSetMemberLevel,
  devGrantInsignia,
  devRevokeInsignia,
  devDeleteInsignia,
  devGetAllInsignias,
  devGetXpRules,
  devUpdateXpRule,
  devGetAllXpTransactions,
  saveInsignia,
  devUpdateMemberInsigniaReason,
} from "@/services/gamificationService";
import {
  getInsigniaIconStyles,
  getInsigniaCardStyles,
  ColorPickerField,
} from "@/components/gamification/InsigniaCatalogManagerModal";

import * as LucideIcons from "lucide-react";
import { IconPicker } from "./IconPicker";

// Helper para renderizar ícones dinâmicos das insígnias
export function DynamicInsigniaIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = (LucideIcons as any)[name] || LucideIcons.Award;
  return <IconComp className={className} />;
}

function formatCooldown(secs: number): string {
  if (secs % 31536000 === 0 && secs > 0) return `${secs / 31536000} ano(s)`;
  if (secs % 2592000 === 0 && secs > 0) return `${secs / 2592000} mês(es)`;
  if (secs % 604800 === 0 && secs > 0) return `${secs / 604800} sem(s)`;
  if (secs % 86400 === 0 && secs > 0) return `${secs / 86400} dia(s)`;
  if (secs % 3600 === 0 && secs > 0) return `${secs / 3600} hora(s)`;
  if (secs % 60 === 0 && secs > 0) return `${secs / 60} min(s)`;
  return `${secs} seg(s)`;
}

export function DevGamificationManager({ initialTab = "membros" }: { initialTab?: string }) {
  const { devStyle, DevIcon } = usePanelTheme();
  const { isDevUser, user } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dados
  const [members, setMembers] = useState<RankedGamificationMember[]>([]);
  const [insignias, setInsignias] = useState<InsigniaItem[]>([]);
  const [rules, setRules] = useState<XpRuleConfig[]>([]);
  const [transactions, setTransactions] = useState<
    (XpTransaction & { member_name?: string; member_nickname?: string; avatar_url?: string })[]
  >([]);

  // Estados de Modais
  const [selectedMember, setSelectedMember] = useState<RankedGamificationMember | null>(null);

  // Modal 1: Ajustar XP
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [xpMode, setXpMode] = useState<"add" | "set">("add");
  const [xpAmount, setXpAmount] = useState<number>(50);
  const [xpReason, setXpReason] = useState("");
  const [xpSubmitting, setXpSubmitting] = useState(false);

  // Modal 2: Definir Nível
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [targetLevel, setTargetLevel] = useState<number>(1);
  const [syncXpWithLevel, setSyncXpWithLevel] = useState(true);
  const [levelReason, setLevelReason] = useState("");
  const [levelSubmitting, setLevelSubmitting] = useState(false);

  // Modal 3: Conceder Insígnia
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedInsigniaId, setSelectedInsigniaId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [selectedMemberOwnedInsigniaIds, setSelectedMemberOwnedInsigniaIds] = useState<Set<string>>(new Set());

  // Modal 4: Gerenciar Insígnias do Membro
  const [memberInsigniasModalOpen, setMemberInsigniasModalOpen] = useState(false);
  const [memberBadges, setMemberBadges] = useState<MemberInsigniaGrant[]>([]);
  const [loadingMemberBadges, setLoadingMemberBadges] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [editingGrantId, setEditingGrantId] = useState<string | null>(null);
  const [editGrantReason, setEditGrantReason] = useState("");
  const [editGrantSubmitting, setEditGrantSubmitting] = useState(false);

  // Modal 5: Criar / Editar Insígnia no Catálogo
  const [insigniaEditorOpen, setInsigniaEditorOpen] = useState(false);
  const [editingInsignia, setEditingInsignia] = useState<Partial<InsigniaItem> | null>(null);
  const [insigniaSubmitting, setInsigniaSubmitting] = useState(false);
  const [colorTab, setColorTab] = useState<"icon" | "bg" | "border">("icon");

  // Modal 6: Editar Regra de XP
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<XpRuleConfig> | null>(null);
  const [editRewardStr, setEditRewardStr] = useState("0");
  const [editCapStr, setEditCapStr] = useState("0");
  const [editCooldownStr, setEditCooldownStr] = useState("0");
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [cooldownUnit, setCooldownUnit] = useState<number>(1);

  const openRuleEditor = (r: XpRuleConfig) => {
    let secs = r.cooldown_seconds || 0;
    let unit = 1;
    let val = secs;
    if (secs > 0) {
      if (secs % 31536000 === 0) { unit = 31536000; val = secs / 31536000; }
      else if (secs % 2592000 === 0) { unit = 2592000; val = secs / 2592000; }
      else if (secs % 604800 === 0) { unit = 604800; val = secs / 604800; }
      else if (secs % 86400 === 0) { unit = 86400; val = secs / 86400; }
      else if (secs % 3600 === 0) { unit = 3600; val = secs / 3600; }
      else if (secs % 60 === 0) { unit = 60; val = secs / 60; }
    }
    setCooldownUnit(unit);
    setEditCooldownStr(String(val));
    setEditRewardStr(String(r.xp_reward || 0));
    setEditCapStr(String(r.daily_cap || 0));
    setEditingRule(r);
    setRuleEditorOpen(true);
  };

  // Carregar dados gerais
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, insigniasData, rulesData, txData] = await Promise.all([
        getGamificationRanking("all"),
        devGetAllInsignias(),
        devGetXpRules(),
        devGetAllXpTransactions(100),
      ]);

      setMembers(membersData);
      setInsignias(insigniasData);
      setRules(rulesData);
      setTransactions(txData);
    } catch (err: any) {
      console.error("Erro ao carregar dados de gamificação Dev:", err);
      toast.error("Erro ao sincronizar dados com o banco de dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtro de membros
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const q = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.nome?.toLowerCase().includes(q) ||
        m.nickname?.toLowerCase().includes(q) ||
        m.game_id?.toLowerCase().includes(q)
    );
  }, [members, searchTerm]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const totalXp = members.reduce((acc, m) => acc + (m.xp || 0), 0);
    const activeInsignias = insignias.filter((i) => i.active).length;
    const totalTransactions = transactions.length;
    return { totalMembers, totalXp, activeInsignias, totalTransactions };
  }, [members, insignias, transactions]);

  // =========================================================================
  // HANDLERS DE AÇÕES DEV
  // =========================================================================

  // 1. Executar Ajuste de XP
  const handleExecuteXpAdjustment = async () => {
    if (!selectedMember) return;
    if (!xpReason.trim()) {
      toast.error("Informe a justificativa obrigatória para auditoria.");
      return;
    }

    setXpSubmitting(true);
    try {
      const res = await devManageMemberXp({
        memberId: selectedMember.user_id,
        mode: xpMode,
        amount: Number(xpAmount),
        reason: xpReason.trim(),
      });

      toast.success(
        `XP de ${res.member_name} atualizado com sucesso! (${res.old_xp} ➔ ${res.new_xp} XP, Nível ${res.new_level})`
      );
      setXpModalOpen(false);
      setXpReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao ajustar XP.");
    } finally {
      setXpSubmitting(false);
    }
  };

  // 2. Executar Definição de Nível
  const handleExecuteLevelChange = async () => {
    if (!selectedMember) return;
    if (!levelReason.trim()) {
      toast.error("Informe a justificativa obrigatória para auditoria.");
      return;
    }

    setLevelSubmitting(true);
    try {
      const res = await devSetMemberLevel({
        memberId: selectedMember.user_id,
        level: Number(targetLevel),
        syncXp: syncXpWithLevel,
        reason: levelReason.trim(),
      });

      toast.success(
        `Nível atualizado para Nível ${res.new_level}! ${syncXpWithLevel ? `(XP sincronizado para ${res.new_xp})` : ""}`
      );
      setLevelModalOpen(false);
      setLevelReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao definir nível.");
    } finally {
      setLevelSubmitting(false);
    }
  };

  // 3. Executar Concessão de Insígnia
  // Abrir Modal de Conceder Insígnia filtrando as já possuídas
  const handleOpenGrantModal = async (member: RankedGamificationMember) => {
    setSelectedMember(member);
    setSelectedInsigniaId("");
    setGrantReason("");
    try {
      const badges = await getMemberInsignias(member.user_id);
      setSelectedMemberOwnedInsigniaIds(new Set(badges.map((b) => b.insignia_id)));
    } catch {
      setSelectedMemberOwnedInsigniaIds(new Set());
    }
    setGrantModalOpen(true);
  };

  const handleExecuteGrantInsignia = async () => {
    if (!selectedMember || !selectedInsigniaId) {
      toast.error("Selecione a insígnia desejada.");
      return;
    }
    if (!grantReason.trim()) {
      toast.error("Informe o motivo da condecoração.");
      return;
    }

    setGrantSubmitting(true);
    try {
      const res = await devGrantInsignia({
        memberId: selectedMember.user_id,
        insigniaId: selectedInsigniaId,
        reason: grantReason.trim(),
      });

      toast.success(`Insígnia "${res.insignia_name}" concedida com sucesso a ${res.member_name}!`);
      setGrantModalOpen(false);
      setGrantReason("");
      setSelectedInsigniaId("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao conceder insígnia.");
    } finally {
      setGrantSubmitting(false);
    }
  };

  // 4. Abrir Gerenciador de Insígnias do Membro
  const handleOpenMemberInsignias = async (member: RankedGamificationMember) => {
    setSelectedMember(member);
    setMemberInsigniasModalOpen(true);
    setLoadingMemberBadges(true);
    try {
      const badges = await getMemberInsignias(member.user_id);
      setMemberBadges(badges);
    } catch (err: any) {
      toast.error("Erro ao buscar insígnias do membro.");
    } finally {
      setLoadingMemberBadges(false);
    }
  };

  // 5. Revogar Insígnia
  const handleRevokeInsignia = async (insigniaId: string, badgeName: string) => {
    if (!selectedMember) return;
    const confirmRevoke = window.confirm(
      `Deseja realmente revogar a insígnia "${badgeName}" do membro ${selectedMember.nickname || selectedMember.nome}?`
    );
    if (!confirmRevoke) return;

    setRevokingId(insigniaId);
    try {
      await devRevokeInsignia({
        memberId: selectedMember.user_id,
        insigniaId,
        reason: "Revogação manual executada pelo Desenvolvedor via Painel Dev",
      });

      toast.success(`Insígnia "${badgeName}" revogada com sucesso.`);
      setMemberBadges((prev) => prev.filter((b) => b.insignia_id !== insigniaId));
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao revogar insígnia.");
    } finally {
      setRevokingId(null);
    }
  };

  // Editar Justificativa de Insígnia
  const handleSaveEditedInsigniaReason = async (grantId: string) => {
    if (!editGrantReason.trim()) {
      toast.error("A justificativa não pode ficar vazia.");
      return;
    }
    setEditGrantSubmitting(true);
    try {
      await devUpdateMemberInsigniaReason(grantId, editGrantReason.trim());
      toast.success("Justificativa da insígnia atualizada com sucesso.");
      
      setMemberBadges((prev) => 
        prev.map((b) => b.id === grantId ? { ...b, reason: editGrantReason.trim() } : b)
      );
      setEditingGrantId(null);
      setEditGrantReason("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao editar justificativa.");
    } finally {
      setEditGrantSubmitting(false);
    }
  };

  // 6. Salvar Insígnia no Catálogo
  const handleSaveInsigniaCatalog = async () => {
    if (!editingInsignia?.name?.trim() || !editingInsignia?.id?.trim()) {
      toast.error("Preencha o identificador (ID) e o nome da insígnia.");
      return;
    }

    setInsigniaSubmitting(true);
    try {
      await saveInsignia({
        id: editingInsignia.id.trim().toLowerCase().replace(/\s+/g, "_"),
        name: editingInsignia.name.trim(),
        icon: editingInsignia.icon || "Award",
        description: editingInsignia.description?.trim() || "",
        rarity: (editingInsignia.rarity as InsigniaRarity) || "comum",
        xp_cost: Number(editingInsignia.xp_cost || 0),
        category: editingInsignia.category || "geral",
        active: editingInsignia.active !== false,
        color: editingInsignia.color || null,
        bg_color: editingInsignia.bg_color || null,
        border_color: editingInsignia.border_color || null,
      });

      toast.success("Insígnia salva no catálogo com sucesso!");
      setInsigniaEditorOpen(false);
      setEditingInsignia(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar insígnia.");
    } finally {
      setInsigniaSubmitting(false);
    }
  };

  // 7. Excluir Insígnia do Catálogo
  const handleDeleteInsigniaCatalog = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `ATENÇÃO: Deseja realmente excluir permanentemente a insígnia "${name}" do catálogo oficial?`
    );
    if (!confirmDelete) return;

    try {
      await devDeleteInsignia(id);
      toast.success(`Insígnia "${name}" excluída.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir insígnia.");
    }
  };

  // 8. Salvar Regra de XP
  const handleSaveXpRule = async () => {
    if (!editingRule?.action_type || !editingRule?.name) return;

    const finalReward = Number(editRewardStr.replace(',', '.')) || 0;
    const finalCap = Number(editCapStr.replace(',', '.')) || 0;
    const cooldownValParsed = Number(editCooldownStr.replace(',', '.')) || 0;
    const finalCooldownSeconds = cooldownValParsed * cooldownUnit;

    setRuleSubmitting(true);
    try {
      await devUpdateXpRule({
        action_type: editingRule.action_type,
        name: editingRule.name,
        xp_reward: finalReward,
        cooldown_seconds: finalCooldownSeconds,
        daily_cap: finalCap,
        category: editingRule.category || "geral",
        description: editingRule.description || "",
        enabled: editingRule.enabled !== false,
      });

      toast.success(`Regra "${editingRule.name}" atualizada com sucesso!`);
      setRuleEditorOpen(false);
      setEditingRule(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar regra de XP.");
    } finally {
      setRuleSubmitting(false);
    }
  };

  // Pré-visualização de cálculo de XP e Nível no Modal
  const previewCalculation = useMemo(() => {
    if (!selectedMember) return null;
    const curXp = selectedMember.xp || 0;
    const finalXp = xpMode === "set" ? Math.max(0, xpAmount) : Math.max(0, curXp + xpAmount);
    const lvlInfo = getLevelInfo(finalXp);
    return {
      curXp,
      finalXp,
      delta: finalXp - curXp,
      level: lvlInfo.level,
      title: lvlInfo.title,
      progress: lvlInfo.progressPercent,
    };
  }, [selectedMember, xpMode, xpAmount]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header com Design System */}
      <PageHeader
        title="XP e Insígnias"
        description="Controle avançado de gamificação, concessão direta de XP e patamares de níveis, condecorações manuais sem débito e governança de catálogo."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("px-2.5 py-1 text-xs font-bold gap-1.5 border", devStyle.badgeClass)}>
              <DevIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Exclusivo Dev</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 sm:h-9 text-xs gap-1.5 border-border/60 hover:bg-accent/40"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Atualizar</span>
            </Button>
          </div>
        }
      />

      {/* Cards de Métricas e Estado da Gamificação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className={cn("p-2 sm:p-2.5 rounded-xl border shrink-0", devStyle.bgSubtleClass, devStyle.borderSubtleClass)}>
              <Users className={cn("w-4 h-4 sm:w-5 sm:h-5", devStyle.iconClass || devStyle.textClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Membros</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">{stats.totalMembers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">XP Distribuído</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">
                {stats.totalXp.toLocaleString("pt-BR")} XP
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Insígnias</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">{stats.activeInsignias}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Auditorias</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">{stats.totalTransactions}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais de Gerenciamento */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className="bg-muted/50 p-1 border border-border/50 rounded-xl grid grid-cols-2 sm:grid-cols-4 h-auto w-full max-w-2xl gap-1">
          <TabsTrigger value="membros" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Membros</span>
          </TabsTrigger>
          <TabsTrigger value="insignias" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <Award className="w-4 h-4 shrink-0" />
            <span className="truncate">Insígnias</span>
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">Regras XP</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <History className="w-4 h-4 shrink-0" />
            <span className="truncate">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            TAB 1: GESTÃO DE MEMBROS (CONCESSÃO DE XP, NÍVEL E INSÍGNIAS)
            ========================================================================= */}
        <TabsContent value="membros" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary shrink-0" />
                    <span>Membros & Ações</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Selecione um membro para conceder XP, definir nível manualmente ou gerenciar condecorações.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar membro, nick ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background/80 border-border/60 h-9 rounded-lg text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 pt-2">
              {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS - SEM BARRA DE ROLAGEM LATERAL) */}
              <div className="md:hidden space-y-3">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum membro encontrado.
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const lvlInfo = getLevelInfo(m.xp);
                    return (
                      <Card key={m.user_id} className="border border-border/60 bg-background/80 p-3.5 rounded-xl shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-extrabold text-xs text-muted-foreground shrink-0 w-5">
                              #{m.rank_position}
                            </span>
                            <img
                              src={m.avatar_url || "/placeholder-avatar.png"}
                              alt={m.nome}
                              className="w-10 h-10 rounded-full object-cover border border-border/80 shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-foreground text-sm flex items-center gap-1">
                                <span className="truncate">{m.nickname || m.nome}</span>
                                {m.is_developer && <DevBadge size="xs" />}
                                {m.is_ceo && <CeoBadge size="xs" />}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono truncate">
                                {m.game_id ? `ID: ${m.game_id}` : m.nome}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-extrabold text-foreground text-sm">
                              {(m.xp || 0).toLocaleString("pt-BR")}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">XP</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/40 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] font-bold border", levelBadgeClass(m.nivel))}>
                              {getLevelLabel(m.nivel)}
                            </Badge>
                            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px] font-extrabold px-2 py-0.5">
                              Nível {m.gamification_level || lvlInfo.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenMemberInsignias(m)}
                              className="h-6 px-2 font-bold text-[11px] gap-1 hover:bg-amber-500/10 text-amber-300"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>{m.insignias_count || 0}</span>
                            </Button>
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span>{Number(m.stars_rating || 5).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ações Dev Mobile */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(m);
                              setXpMode("add");
                              setXpAmount(50);
                              setXpReason("");
                              setXpModalOpen(true);
                            }}
                            className="h-8 px-1 text-xs font-bold gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 w-full"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>XP</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(m);
                              setTargetLevel(m.gamification_level || lvlInfo.level);
                              setSyncXpWithLevel(true);
                              setLevelReason("");
                              setLevelModalOpen(true);
                            }}
                            className="h-8 px-1 text-xs font-bold gap-1 border-border/80 hover:bg-accent/40 w-full"
                          >
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            <span>Nível</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMemberInsignias(m)}
                            className="h-8 px-1 text-xs font-bold gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 w-full"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Insígnia</span>
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* VISUALIZAÇÃO DESKTOP / TABLET (TABELA COMPLETA COM SCROLL INTERNO CONTROLADO) */}
              <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Pos / Membro</th>
                        <th className="py-3 px-4">Cargo & Tags</th>
                        <th className="py-3 px-4 text-center">Nível Atual</th>
                        <th className="py-3 px-4 text-right">Saldo de XP</th>
                        <th className="py-3 px-4 text-center">Insígnias</th>
                        <th className="py-3 px-4 text-center">Avaliação</th>
                        <th className="py-3 px-4 text-right">Ações Dev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum membro encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m) => {
                          const lvlInfo = getLevelInfo(m.xp);
                          return (
                            <tr key={m.user_id} className="hover:bg-accent/20 transition-colors group">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-xs text-muted-foreground w-6 text-center">
                                    #{m.rank_position}
                                  </span>
                                  <div className="relative">
                                    <img
                                      src={m.avatar_url || "/placeholder-avatar.png"}
                                      alt={m.nome}
                                      className="w-9 h-9 rounded-full object-cover border border-border/80 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                      {m.nickname || m.nome}
                                      {m.is_developer && <DevBadge size="xs" />}
                                      {m.is_ceo && <CeoBadge size="xs" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {m.game_id ? `ID: ${m.game_id}` : m.nome}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className={cn("text-[11px] font-bold border", levelBadgeClass(m.nivel))}>
                                  {getLevelLabel(m.nivel)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-xs font-extrabold px-2.5 py-0.5">
                                  Nível {m.gamification_level || lvlInfo.level}
                                </Badge>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{lvlInfo.title}</div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono font-extrabold text-foreground text-sm">
                                  {(m.xp || 0).toLocaleString("pt-BR")}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">XP</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenMemberInsignias(m)}
                                  className="h-7 px-2 font-bold text-xs gap-1.5 hover:bg-amber-500/10 hover:text-amber-300"
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{m.insignias_count || 0}</span>
                                </Button>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{Number(m.stars_rating || 5).toFixed(1)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(m);
                                      setXpMode("add");
                                      setXpAmount(50);
                                      setXpReason("");
                                      setXpModalOpen(true);
                                    }}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                    XP
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(m);
                                      setTargetLevel(m.gamification_level || lvlInfo.level);
                                      setSyncXpWithLevel(true);
                                      setLevelReason("");
                                      setLevelModalOpen(true);
                                    }}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 border-border/80 hover:bg-accent/40"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    Nível
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenMemberInsignias(m)}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                                  >
                                    <Award className="w-3.5 h-3.5 text-amber-400" />
                                    Insígnia
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            TAB 2: CATÁLOGO DE INSÍGNIAS (CRUD COMPLETO)
            ========================================================================= */}
        <TabsContent value="insignias" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Catálogo de Insígnias & Condecorações</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cadastre, personalize regras de custo em XP, raridade e condecorações da facção.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingInsignia({
                      id: "",
                      name: "",
                      icon: "Award",
                      description: "",
                      rarity: "comum",
                      xp_cost: 0,
                      category: "honra",
                      active: true,
                      color: null,
                      bg_color: null,
                      border_color: null,
                    });
                    setColorTab("icon");
                    setInsigniaEditorOpen(true);
                  }}
                  className="font-extrabold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full sm:w-auto text-xs h-9"
                >
                  <Plus className="w-4 h-4" />
                  Nova Insígnia
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insignias.map((badge) => {
                  const rarityStyle = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                  const iconStyle = getInsigniaIconStyles(badge);
                  const cardStyle = getInsigniaCardStyles(badge);
                  const hasCustomColors = Boolean(badge.color || badge.bg_color || badge.border_color);
                  return (
                    <Card
                      key={badge.id}
                      className={cn(
                        "border relative overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.01] shadow-sm",
                        !cardStyle && rarityStyle.borderClass,
                        !cardStyle && rarityStyle.bgClass,
                        !badge.active && "opacity-50 grayscale"
                      )}
                      style={cardStyle}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner shrink-0",
                                !iconStyle && rarityStyle.borderClass,
                                !iconStyle && rarityStyle.bgClass,
                                !iconStyle && rarityStyle.textClass
                              )}
                              style={iconStyle}
                            >
                              <DynamicInsigniaIcon name={badge.icon} className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-foreground tracking-tight">{badge.name}</h4>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-mono text-muted-foreground">ID: {badge.id}</span>
                                {hasCustomColors && (
                                  <div className="flex items-center gap-1 bg-background/50 px-1 py-0.5 rounded border border-border/40">
                                    {badge.bg_color && (
                                      <span className="h-2 w-2 rounded-full border border-white/40" style={{ backgroundColor: badge.bg_color }} title={`Fundo: ${badge.bg_color}`} />
                                    )}
                                    {badge.border_color && (
                                      <span className="h-2 w-2 rounded-full border border-white/40" style={{ borderColor: badge.border_color, borderWidth: 2 }} title={`Borda: ${badge.border_color}`} />
                                    )}
                                    {badge.color && (
                                      <span className="h-2 w-2 rounded-full border border-white/40" style={{ backgroundColor: badge.color }} title={`Ícone: ${badge.color}`} />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 border",
                              rarityStyle.borderClass,
                              rarityStyle.bgClass,
                              rarityStyle.textClass
                            )}
                          >
                            {rarityStyle.label}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground min-h-[36px] line-clamp-2 leading-relaxed">
                          {badge.description || "Sem descrição cadastrada."}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 font-mono">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Custo:</span>
                            <span className="font-extrabold text-foreground">{badge.xp_cost} XP</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                              {badge.category}
                            </Badge>
                            {!badge.active && (
                              <Badge variant="destructive" className="text-[10px]">
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingInsignia({
                                ...badge,
                                color: badge.color || null,
                                bg_color: badge.bg_color || null,
                                border_color: badge.border_color || null,
                              });
                              setColorTab("icon");
                              setInsigniaEditorOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs font-bold gap-1 hover:bg-accent"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInsigniaCatalog(badge.id, badge.name)}
                            className="h-7 px-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            TAB 3: REGRAS DE XP & LIMITES DIÁRIOS
            ========================================================================= */}
        <TabsContent value="regras" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary shrink-0" />
                <span>Matriz de Regras de XP, Cooldowns e Limites</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Regras ativas de combate a spam e concessão backend de XP por ações reais dentro do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 pt-2">
              {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS SEM SCROLL LATERAL) */}
              <div className="md:hidden space-y-3">
                {rules.map((r) => (
                  <Card key={r.action_type} className="border border-border/60 bg-background/80 p-3.5 rounded-xl shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-primary truncate">{r.action_type}</div>
                        <h4 className="font-bold text-foreground text-sm">{r.name}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                      </div>
                      <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 font-mono font-bold text-xs shrink-0">
                        +{r.xp_reward} XP
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-mono">
                        <span>{formatCooldown(r.cooldown_seconds || 0)} cooldown</span>
                        <span>•</span>
                        <span className="text-foreground font-bold">{r.daily_cap} XP/dia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.enabled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRuleEditor(r)}
                          className="h-7 px-2 text-xs font-bold gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
              <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Gatilho de Ação</th>
                        <th className="py-3 px-4">Nome da Ação</th>
                        <th className="py-3 px-4 text-center">Recompensa</th>
                        <th className="py-3 px-4 text-center">Cooldown</th>
                        <th className="py-3 px-4 text-center">Limite Diário (Cap)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {rules.map((r) => (
                        <tr key={r.action_type} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-bold text-primary">{r.action_type}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground">{r.name}</div>
                            <div className="text-xs text-muted-foreground">{r.description}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 font-mono font-bold">
                              +{r.xp_reward} XP
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                            {formatCooldown(r.cooldown_seconds || 0)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs font-bold text-foreground">
                            {r.daily_cap} XP / dia
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.enabled ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                Inativo
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRuleEditor(r)}
                              className="h-8 px-2.5 text-xs font-bold gap-1 hover:bg-accent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            TAB 4: HISTÓRICO GLOBAL & AUDITORIA DE XP
            ========================================================================= */}
        <TabsContent value="auditoria" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Auditoria Imutável de Transações de XP</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Registros completos de pontuação, deduplicação, ajustes manuais dev e condecorações.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="h-8 text-xs font-bold gap-1.5 w-full sm:w-auto"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  <span>Recarregar Logs</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 pt-2">
              {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS SEM SCROLL LATERAL) */}
              <div className="md:hidden space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs font-sans">
                    Nenhuma transação registrada.
                  </div>
                ) : (
                  transactions.map((tx) => {
                    const isPositive = (tx.amount || 0) >= 0;
                    return (
                      <Card key={tx.id} className="border border-border/60 bg-background/80 p-3 rounded-xl shadow-xs space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {tx.avatar_url && (
                              <img
                                src={tx.avatar_url}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            )}
                            <span className="font-bold text-foreground truncate">
                              {tx.member_nickname || tx.member_name || tx.user_id.slice(0, 8)}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "font-bold text-xs px-2 py-0.5 shrink-0",
                              isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            )}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} XP
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>{new Date(tx.created_at).toLocaleString("pt-BR")}</span>
                          <span>
                            {tx.xp_before} ➔ <strong className="text-foreground">{tx.xp_after}</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px]">
                          <Badge variant="outline" className="font-mono text-[9px] uppercase shrink-0">
                            {tx.action_type}
                          </Badge>
                          <span className="text-muted-foreground truncate leading-tight">
                            {tx.description}
                          </span>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
              <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Membro</th>
                        <th className="py-3 px-4 text-center">Movimentação</th>
                        <th className="py-3 px-4 text-center">Saldo (Antes ➔ Depois)</th>
                        <th className="py-3 px-4">Ação / Tipo</th>
                        <th className="py-3 px-4">Justificativa / Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-xs">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground font-sans">
                            Nenhuma transação registrada.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => {
                          const isPositive = (tx.amount || 0) >= 0;
                          return (
                            <tr key={tx.id} className="hover:bg-accent/20 transition-colors">
                              <td className="py-3 px-4 text-muted-foreground">
                                {new Date(tx.created_at).toLocaleString("pt-BR")}
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-foreground">
                                <div className="flex items-center gap-2">
                                  {tx.avatar_url && (
                                    <img
                                      src={tx.avatar_url}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover shrink-0"
                                    />
                                  )}
                                  <span>{tx.member_nickname || tx.member_name || tx.user_id.slice(0, 8)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  className={cn(
                                    "font-bold text-xs px-2 py-0.5",
                                    isPositive
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  )}
                                >
                                  {isPositive ? `+${tx.amount}` : tx.amount} XP
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center text-muted-foreground">
                                {tx.xp_before} ➔ <span className="text-foreground font-bold">{tx.xp_after}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                  {tx.action_type}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-sans text-xs text-muted-foreground max-w-xs truncate">
                                {tx.description}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          MODAL 1: AJUSTAR XP MANUALMENTE
          ========================================================================= */}
      <Dialog open={xpModalOpen} onOpenChange={setXpModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Ajuste Manual de XP (Dev Override)
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Membro: <strong>{selectedMember.nickname || selectedMember.nome}</strong> (Saldo Atual:{" "}
                  <strong>{selectedMember.xp} XP</strong>, Nível {selectedMember.gamification_level})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Modo de Operação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={xpMode === "add" ? "default" : "outline"}
                  onClick={() => setXpMode("add")}
                  className="font-bold text-xs h-9"
                >
                  Adicionar / Subtrair (+/-)
                </Button>
                <Button
                  type="button"
                  variant={xpMode === "set" ? "default" : "outline"}
                  onClick={() => setXpMode("set")}
                  className="font-bold text-xs h-9"
                >
                  Definir Saldo Fixo (=)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="xp-amount" className="text-xs font-bold">
                {xpMode === "set" ? "Novo Saldo Exato de XP" : "Quantidade de XP a Conceder/Deduzir"}
              </Label>
              <Input
                id="xp-amount"
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(Number(e.target.value))}
                placeholder="Ex: 50 ou -20"
                className="font-mono text-lg font-extrabold"
              />
              <span className="text-[11px] text-muted-foreground">
                {xpMode === "set"
                  ? "O saldo total do membro será fixado exatamente neste valor."
                  : "Valores positivos adicionam XP; valores negativos subtraem XP."}
              </span>
            </div>

            {/* Prévia do cálculo */}
            {previewCalculation && (
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Previsão de Saldo:</span>
                  <span className="font-mono font-extrabold text-foreground">
                    {previewCalculation.curXp} ➔ {previewCalculation.finalXp} XP (
                    {previewCalculation.delta >= 0 ? `+${previewCalculation.delta}` : previewCalculation.delta})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Previsão de Nível:</span>
                  <Badge className="bg-purple-500/20 text-purple-300 font-extrabold text-xs">
                    Nível {previewCalculation.level} — {previewCalculation.title}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="xp-reason" className="text-xs font-bold">
                Justificativa Obrigatória (Auditoria Dev) *
              </Label>
              <Textarea
                id="xp-reason"
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                placeholder="Ex: Bonificação por liderança exemplar em operação especial ou estorno corretivo."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setXpModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteXpAdjustment}
              disabled={xpSubmitting || !xpReason.trim()}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {xpSubmitting ? "Gravando no Banco..." : "Confirmar Ajuste de XP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: DEFINIR NÍVEL MANUALMENTE
          ========================================================================= */}
      <Dialog open={levelModalOpen} onOpenChange={setLevelModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-md bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Definição Manual de Nível
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Membro: <strong>{selectedMember.nickname || selectedMember.nome}</strong> (Nível Atual:{" "}
                  <strong>{selectedMember.gamification_level}</strong>)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="target-level" className="text-xs font-bold">
                Nível Desejado (1 a 50+)
              </Label>
              <Input
                id="target-level"
                type="number"
                min={1}
                max={100}
                value={targetLevel}
                onChange={(e) => setTargetLevel(Math.max(1, Number(e.target.value)))}
                className="font-mono text-lg font-extrabold"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="sync-xp" className="text-xs font-bold cursor-pointer">
                  Sincronizar XP com a marca mínima do nível
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, atualiza o saldo de XP do membro para o mínimo daquele patamar.
                </p>
              </div>
              <Switch id="sync-xp" checked={syncXpWithLevel} onCheckedChange={setSyncXpWithLevel} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="level-reason" className="text-xs font-bold">
                Justificativa Obrigatória (Auditoria) *
              </Label>
              <Textarea
                id="level-reason"
                value={levelReason}
                onChange={(e) => setLevelReason(e.target.value)}
                placeholder="Ex: Promovido à patente de liderança com enquadramento de nível imediato."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setLevelModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteLevelChange}
              disabled={levelSubmitting || !levelReason.trim()}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {levelSubmitting ? "Atualizando..." : "Aplicar Novo Nível"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: CONCEDER INSÍGNIA (DEV BYPASS)
          ========================================================================= */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Conceder Insígnia (Dev Bypass)
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Beneficiário: <strong>{selectedMember.nickname || selectedMember.nome}</strong>. Concessão com
                  isenção de custo de XP (Bypass de Desenvolvedor).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Selecione a Insígnia do Catálogo *</Label>
              {insignias.filter((b) => b.active && !selectedMemberOwnedInsigniaIds.has(b.id)).length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300">
                  Este membro já possui todas as insígnias ativas disponíveis no catálogo.
                </div>
              ) : (
                <Select value={selectedInsigniaId} onValueChange={setSelectedInsigniaId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Escolha a insígnia..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {insignias
                      .filter((b) => b.active && !selectedMemberOwnedInsigniaIds.has(b.id))
                      .map((badge) => {
                        const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                        return (
                          <SelectItem key={badge.id} value={badge.id}>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-bold", rarity.textClass)}>[{rarity.label}]</span>
                              <span>{badge.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">({badge.xp_cost} XP)</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Isenção Dev:</strong> O saldo de XP do membro e do desenvolvedor não será debitado nesta
                operação.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grant-reason" className="text-xs font-bold">
                Motivo / Justificativa da Condecoração *
              </Label>
              <Textarea
                id="grant-reason"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Ex: Reconhecimento por bravura e zelo exemplar durante o comboio de segurança."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setGrantModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteGrantInsignia}
              disabled={grantSubmitting || !selectedInsigniaId || !grantReason.trim()}
              className="font-extrabold bg-amber-500 hover:bg-amber-600 text-black shadow-sm"
            >
              {grantSubmitting ? "Concedendo..." : "Conceder Condecoração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 4: GERENCIAR INSÍGNIAS CONCEDIDAS AO MEMBRO
          ========================================================================= */}
      <Dialog open={memberInsigniasModalOpen} onOpenChange={setMemberInsigniasModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-xl bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full pr-6">
              <div>
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Insígnias de {selectedMember?.nickname || selectedMember?.nome}
                </DialogTitle>
                <DialogDescription>
                  Lista de todas as condecorações ativas deste membro. Você pode editar justificativas ou revogá-las.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                className="font-extrabold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black shadow-sm shrink-0"
                onClick={() => {
                  setMemberInsigniasModalOpen(false);
                  setTimeout(() => {
                    if (selectedMember) {
                      handleOpenGrantModal(selectedMember);
                    }
                  }, 100);
                }}
              >
                <Plus className="w-4 h-4" />
                Conceder Insígnia
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {loadingMemberBadges ? (
              <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                Carregando condecorações do membro...
              </div>
            ) : memberBadges.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Este membro ainda não possui nenhuma insígnia conquistada.
              </div>
            ) : (
              memberBadges.map((grant) => {
                const b = grant.insignia;
                const rarityStyle = b?.rarity ? RARITY_CONFIG[b.rarity] : RARITY_CONFIG.comum;
                const iconStyle = b ? getInsigniaIconStyles(b) : undefined;
                const cardStyle = b ? getInsigniaCardStyles(b) : undefined;
                return (
                  <div
                    key={grant.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 backdrop-blur-sm",
                      !cardStyle && rarityStyle.borderClass,
                      !cardStyle && rarityStyle.bgClass
                    )}
                    style={cardStyle}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-start gap-3 w-full">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner mt-1",
                              !iconStyle && rarityStyle.borderClass,
                              !iconStyle && rarityStyle.bgClass,
                              !iconStyle && rarityStyle.textClass
                            )}
                            style={iconStyle}
                          >
                            <DynamicInsigniaIcon name={b?.icon || "Award"} className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-foreground">{b?.name || grant.insignia_id}</h4>
                              <Badge className={cn("text-[9px] font-bold uppercase", rarityStyle.textClass)}>
                                {rarityStyle.label}
                              </Badge>
                            </div>

                            {editingGrantId === grant.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editGrantReason}
                                  onChange={(e) => setEditGrantReason(e.target.value)}
                                  className="text-xs min-h-[60px]"
                                  placeholder="Nova justificativa..."
                                  disabled={editGrantSubmitting}
                                />
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => handleSaveEditedInsigniaReason(grant.id)}
                                    disabled={editGrantSubmitting}
                                  >
                                    Salvar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => {
                                      setEditingGrantId(null);
                                      setEditGrantReason("");
                                    }}
                                    disabled={editGrantSubmitting}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={grant.reason || b?.description}>
                                  {grant.reason || b?.description}
                                </p>
                                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                  Concedido em {new Date(grant.granted_at).toLocaleDateString("pt-BR")} por{" "}
                                  <strong>{grant.grantor_name}</strong>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          {editingGrantId !== grant.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingGrantId(grant.id);
                                setEditGrantReason(grant.reason || "");
                              }}
                              className="h-7 px-2 text-[10px] font-bold gap-1 w-full"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeInsignia(grant.insignia_id, b?.name || grant.insignia_id)}
                            disabled={revokingId === grant.insignia_id}
                            className="h-7 px-2 text-[10px] font-bold gap-1 w-full"
                          >
                            <Trash2 className="w-3 h-3" />
                            Revogar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberInsigniasModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 5: CRIAR / EDITAR INSÍGNIA NO CATÁLOGO
          ========================================================================= */}
      <Dialog open={insigniaEditorOpen} onOpenChange={setInsigniaEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-xl bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              {editingInsignia?.id && insignias.some((i) => i.id === editingInsignia.id)
                ? "Editar Insígnia do Catálogo"
                : "Criar Nova Insígnia Oficial"}
            </DialogTitle>
            <DialogDescription>
              Configure identificador, nome, custo em XP e parâmetros visuais exclusivos (fundo, borda e ícone).
            </DialogDescription>
          </DialogHeader>

          {editingInsignia && (() => {
            const previewRarity = RARITY_CONFIG[(editingInsignia.rarity as InsigniaRarity) || "comum"] || RARITY_CONFIG.comum;
            const previewStyle = getInsigniaIconStyles(editingInsignia);
            const previewCardStyle = getInsigniaCardStyles(editingInsignia);
            const hasCustomColor = Boolean(editingInsignia.color || editingInsignia.bg_color || editingInsignia.border_color);

            return (
              <div className="space-y-4 py-2">
                {/* ── PREVIEW AO VIVO ── */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-200",
                    !previewCardStyle && "bg-secondary/30 border-border/60"
                  )}
                  style={previewCardStyle}
                >
                  <div
                    className={cn(
                      "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-inner transition-all duration-200",
                      !previewStyle && previewRarity.bgClass,
                      !previewStyle && previewRarity.borderClass,
                      !previewStyle && previewRarity.textClass
                    )}
                    style={previewStyle}
                  >
                    <DynamicInsigniaIcon name={editingInsignia.icon || "Award"} className="h-7 w-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground truncate">
                        {editingInsignia.name || "Nome da Insígnia"}
                      </span>
                      <Badge className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0 border", previewRarity.borderClass, previewRarity.bgClass, previewRarity.textClass)}>
                        {previewRarity.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {hasCustomColor ? "Cores personalizadas ativas (Fundo / Borda / Ícone)" : `Cores padrão da raridade (${previewRarity.label})`}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {editingInsignia.bg_color && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                          <div className="h-2.5 w-2.5 rounded-sm border border-white/20" style={{ backgroundColor: editingInsignia.bg_color }} />
                          <span>Fundo: {editingInsignia.bg_color}</span>
                        </div>
                      )}
                      {editingInsignia.border_color && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                          <div className="h-2.5 w-2.5 rounded-sm border-2" style={{ borderColor: editingInsignia.border_color }} />
                          <span>Borda: {editingInsignia.border_color}</span>
                        </div>
                      )}
                      {editingInsignia.color && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: editingInsignia.color }} />
                          <span>Ícone: {editingInsignia.color}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasCustomColor && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingInsignia({
                          ...editingInsignia,
                          color: null,
                          bg_color: null,
                          border_color: null,
                        })
                      }
                      className="h-7 text-[10px] text-muted-foreground hover:text-rose-400 gap-1 shrink-0"
                    >
                      <RefreshCw className="h-3 w-3" /> Resetar
                    </Button>
                  )}
                </div>

                {/* ── IDENTIFICADOR E NOME ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="badge-id" className="text-xs font-bold">
                      Identificador (ID) *
                    </Label>
                    <Input
                      id="badge-id"
                      disabled={Boolean(insignias.some((i) => i.id === editingInsignia.id))}
                      value={editingInsignia.id || ""}
                      onChange={(e) => setEditingInsignia({ ...editingInsignia, id: e.target.value })}
                      placeholder="ex: guardiao_asfalto"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="badge-name" className="text-xs font-bold">
                      Nome Oficial *
                    </Label>
                    <Input
                      id="badge-name"
                      value={editingInsignia.name || ""}
                      onChange={(e) => setEditingInsignia({ ...editingInsignia, name: e.target.value })}
                      placeholder="Ex: Guardião do Asfalto"
                      className="text-xs font-bold"
                    />
                  </div>
                </div>

                {/* ── RARIDADE, CUSTO E ÍCONE ── */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Raridade</Label>
                    <Select
                      value={editingInsignia.rarity || "comum"}
                      onValueChange={(val: any) => setEditingInsignia({ ...editingInsignia, rarity: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comum">Comum</SelectItem>
                        <SelectItem value="raro">Raro</SelectItem>
                        <SelectItem value="epico">Épico</SelectItem>
                        <SelectItem value="lendario">Lendário</SelectItem>
                        <SelectItem value="mitico">Mítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="badge-cost" className="text-xs font-bold">
                      Custo em XP
                    </Label>
                    <Input
                      id="badge-cost"
                      type="number"
                      min={0}
                      value={editingInsignia.xp_cost || 0}
                      onChange={(e) => setEditingInsignia({ ...editingInsignia, xp_cost: Number(e.target.value) })}
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col items-start justify-center">
                    <Label htmlFor="badge-icon" className="text-xs font-bold">
                      Ícone Lucide
                    </Label>
                    <IconPicker
                      value={editingInsignia.icon || "Award"}
                      onChange={(val) => setEditingInsignia({ ...editingInsignia, icon: val })}
                    >
                      <Button variant="outline" className="w-full justify-start h-9 text-xs px-3">
                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                          <DynamicInsigniaIcon name={editingInsignia.icon || "Award"} className="w-4 h-4 shrink-0 text-primary" />
                          <span className="truncate">{editingInsignia.icon || "Award"}</span>
                        </div>
                      </Button>
                    </IconPicker>
                  </div>
                </div>

                {/* ── SELETOR DE CORES INDEPENDENTES (FUNDO / BORDA / ÍCONE) ── */}
                <div className="rounded-2xl border border-border/70 overflow-hidden bg-background/40">
                  <div className="flex border-b border-border/60 bg-muted/30">
                    {([
                      { id: "bg" as const, label: "Fundo", color: editingInsignia.bg_color },
                      { id: "border" as const, label: "Borda", color: editingInsignia.border_color },
                      { id: "icon" as const, label: "Ícone", color: editingInsignia.color },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setColorTab(tab.id)}
                        className={cn(
                          "flex-1 py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer",
                          colorTab === tab.id
                            ? "border-primary text-foreground bg-accent/40"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
                        )}
                      >
                        <span>{tab.label}</span>
                        {tab.color ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/40 shrink-0"
                            style={{ backgroundColor: tab.color }}
                          />
                        ) : (
                          <span className="text-[10px] font-normal text-muted-foreground/60">(padrão)</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 space-y-2">
                    {colorTab === "bg" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Cor de preenchimento do escudo/fundo do emblema. Deixe vazio para usar a cor padrão da raridade.
                        </p>
                        <ColorPickerField
                          label="Cor de Fundo do Emblema"
                          value={editingInsignia.bg_color}
                          onChange={(val) => setEditingInsignia({ ...editingInsignia, bg_color: val })}
                          placeholder="#1e1b4b ou rgba(30,27,75,0.8)"
                        />
                      </div>
                    )}

                    {colorTab === "border" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Cor do contorno/borda do emblema e do card. Deixe vazio para usar o contorno padrão da raridade.
                        </p>
                        <ColorPickerField
                          label="Cor da Borda do Emblema"
                          value={editingInsignia.border_color}
                          onChange={(val) => setEditingInsignia({ ...editingInsignia, border_color: val })}
                          placeholder="#a855f7 ou #eab308"
                        />
                      </div>
                    )}

                    {colorTab === "icon" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Cor do símbolo/ícone Lucide no centro do emblema. Deixe vazio para usar a cor padrão da raridade.
                        </p>
                        <ColorPickerField
                          label="Cor do Ícone / Símbolo"
                          value={editingInsignia.color}
                          onChange={(val) => setEditingInsignia({ ...editingInsignia, color: val })}
                          placeholder="#facc15 ou #38bdf8"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── DESCRIÇÃO ── */}
                <div className="space-y-1.5">
                  <Label htmlFor="badge-desc" className="text-xs font-bold">
                    Descrição / Critério de Conquista
                  </Label>
                  <Textarea
                    id="badge-desc"
                    value={editingInsignia.description || ""}
                    onChange={(e) => setEditingInsignia({ ...editingInsignia, description: e.target.value })}
                    placeholder="Critérios exigidos para que a diretoria conceda esta distinção..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                {/* ── ATIVA/INATIVA ── */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="badge-active" className="text-xs font-bold cursor-pointer">
                      Insígnia Ativa para Concessão
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Quando desativada, não aparece na lista de condecoração para novos membros.
                    </p>
                  </div>
                  <Switch
                    id="badge-active"
                    checked={editingInsignia.active !== false}
                    onCheckedChange={(checked) => setEditingInsignia({ ...editingInsignia, active: checked })}
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInsigniaEditorOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInsigniaCatalog}
              disabled={insigniaSubmitting || !editingInsignia?.name?.trim()}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {insigniaSubmitting ? "Salvando..." : "Salvar no Catálogo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 6: EDITAR REGRA DE XP
          ========================================================================= */}
      <Dialog open={ruleEditorOpen} onOpenChange={setRuleEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-md bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Editar Regra de XP & Cooldown
            </DialogTitle>
            <DialogDescription>
              Gatilho: <strong className="font-mono text-primary">{editingRule?.action_type}</strong>
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="rule-name" className="text-xs font-bold">
                  Nome Amigável
                </Label>
                <Input
                  id="rule-name"
                  value={editingRule.name || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rule-reward" className="text-xs font-bold">
                    Recompensa (XP)
                  </Label>
                  <Input
                    id="rule-reward"
                    type="text"
                    inputMode="decimal"
                    value={editRewardStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setEditRewardStr(val);
                    }}
                    className="font-mono text-xs font-bold"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold">Cooldown</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editCooldownStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setEditCooldownStr(val);
                      }}
                      className="font-mono text-xs font-bold w-1/2"
                    />
                    <Select
                      value={String(cooldownUnit)}
                      onValueChange={(valStr) => {
                        const unit = Number(valStr);
                        setCooldownUnit(unit);
                      }}
                    >
                      <SelectTrigger className="w-1/2 h-9 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Segundos</SelectItem>
                        <SelectItem value="60">Minutos</SelectItem>
                        <SelectItem value="3600">Horas</SelectItem>
                        <SelectItem value="86400">Dias</SelectItem>
                        <SelectItem value="604800">Semanas</SelectItem>
                        <SelectItem value="2592000">Meses</SelectItem>
                        <SelectItem value="31536000">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rule-cap" className="text-xs font-bold">
                    Limite Diário
                  </Label>
                  <Input
                    id="rule-cap"
                    type="text"
                    inputMode="decimal"
                    value={editCapStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setEditCapStr(val);
                    }}
                    className="font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rule-desc" className="text-xs font-bold">
                  Descrição Operacional
                </Label>
                <Textarea
                  id="rule-desc"
                  value={editingRule.description || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/50">
                <Label htmlFor="rule-enabled" className="text-xs font-bold cursor-pointer">
                  Regra Ativa no Sistema
                </Label>
                <Switch
                  id="rule-enabled"
                  checked={editingRule.enabled !== false}
                  onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRuleEditorOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveXpRule}
              disabled={ruleSubmitting}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {ruleSubmitting ? "Salvando..." : "Salvar Parâmetros"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
