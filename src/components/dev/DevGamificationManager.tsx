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
} from "@/services/gamificationService";

// Helper para renderizar ícones dinâmicos das insígnias
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Award,
  Shield,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Crown,
  Sparkles,
  Star,
  Flame,
  Zap,
  Medal,
  Users,
};

function DynamicInsigniaIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = ICON_COMPONENTS[name] || Award;
  return <IconComp className={className} />;
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

  // Modal 4: Gerenciar Insígnias do Membro
  const [memberInsigniasModalOpen, setMemberInsigniasModalOpen] = useState(false);
  const [memberBadges, setMemberBadges] = useState<MemberInsigniaGrant[]>([]);
  const [loadingMemberBadges, setLoadingMemberBadges] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Modal 5: Criar / Editar Insígnia no Catálogo
  const [insigniaEditorOpen, setInsigniaEditorOpen] = useState(false);
  const [editingInsignia, setEditingInsignia] = useState<Partial<InsigniaItem> | null>(null);
  const [insigniaSubmitting, setInsigniaSubmitting] = useState(false);

  // Modal 6: Editar Regra de XP
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<XpRuleConfig> | null>(null);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);

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

    setRuleSubmitting(true);
    try {
      await devUpdateXpRule({
        action_type: editingRule.action_type,
        name: editingRule.name,
        xp_reward: Number(editingRule.xp_reward || 0),
        cooldown_seconds: Number(editingRule.cooldown_seconds || 0),
        daily_cap: Number(editingRule.daily_cap || 0),
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
    <div className="space-y-6">
      {/* Header com Design System */}
      <PageHeader
        title="XP e Insígnias"
        description="Controle avançado de gamificação, concessão direta de XP e patamares de níveis, condecorações manuais sem débito e governança de catálogo."
      >
        <div className="flex items-center gap-2">
          <Badge className={cn("px-3 py-1 text-xs font-bold gap-1.5 border", devStyle.badgeClass)}>
            <DevIcon className="w-3.5 h-3.5" />
            Ferramenta Exclusiva Dev
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 gap-1.5 border-border/60 hover:bg-accent/40"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Atualizar Dados
          </Button>
        </div>
      </PageHeader>

      {/* Cards de Métricas e Estado da Gamificação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className={cn("p-2.5 rounded-xl border shrink-0", devStyle.bgSubtleClass, devStyle.borderSubtleClass)}>
              <Users className={cn("w-5 h-5", devStyle.iconClass || devStyle.textClass)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Membros Ativos</p>
              <h3 className="text-xl font-extrabold tracking-tight text-foreground">{stats.totalMembers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">XP Total Distribuído</p>
              <h3 className="text-xl font-extrabold tracking-tight text-foreground">
                {stats.totalXp.toLocaleString("pt-BR")} XP
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Insígnias no Catálogo</p>
              <h3 className="text-xl font-extrabold tracking-tight text-foreground">{stats.activeInsignias}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Auditorias de Transação</p>
              <h3 className="text-xl font-extrabold tracking-tight text-foreground">{stats.totalTransactions}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais de Gerenciamento */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border/50 rounded-xl grid grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="membros" className="gap-2 font-bold data-[state=active]:bg-background">
            <Users className="w-4 h-4" />
            Membros & Ações
          </TabsTrigger>
          <TabsTrigger value="insignias" className="gap-2 font-bold data-[state=active]:bg-background">
            <Award className="w-4 h-4" />
            Catálogo de Insígnias
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 font-bold data-[state=active]:bg-background">
            <Sliders className="w-4 h-4" />
            Regras de XP
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2 font-bold data-[state=active]:bg-background">
            <History className="w-4 h-4" />
            Histórico & Logs
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            TAB 1: GESTÃO DE MEMBROS (CONCESSÃO DE XP, NÍVEL E INSÍGNIAS)
            ========================================================================= */}
        <TabsContent value="membros" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Quadro Operacional de Gamificação dos Membros
                  </CardTitle>
                  <CardDescription>
                    Selecione um membro para conceder XP, definir nível manualmente ou gerenciar condecorações.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar membro, nick ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background/80 border-border/60 h-9 rounded-lg"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto">
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
                                    onClick={() => {
                                      setSelectedMember(m);
                                      setSelectedInsigniaId("");
                                      setGrantReason("");
                                      setGrantModalOpen(true);
                                    }}
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
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Catálogo Oficial de Insígnias & Condecorações
                  </CardTitle>
                  <CardDescription>
                    Cadastre, personalize regras de custo em XP, raridade visual e metadados de cada condecoração da facção.
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
                    });
                    setInsigniaEditorOpen(true);
                  }}
                  className="font-extrabold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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
                  return (
                    <Card
                      key={badge.id}
                      className={cn(
                        "border relative overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.01] shadow-sm",
                        rarityStyle.borderClass,
                        rarityStyle.bgClass,
                        !badge.active && "opacity-50 grayscale"
                      )}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner shrink-0",
                                rarityStyle.borderClass,
                                rarityStyle.bgClass,
                                rarityStyle.textClass
                              )}
                            >
                              <DynamicInsigniaIcon name={badge.icon} className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-foreground tracking-tight">{badge.name}</h4>
                              <span className="text-[11px] font-mono text-muted-foreground">ID: {badge.id}</span>
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
                              setEditingInsignia(badge);
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
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                Matriz de Regras de XP, Cooldowns e Limites Diários
              </CardTitle>
              <CardDescription>
                Regras ativas de combate a spam e concessão backend de XP por ações reais dentro do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto">
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
                            {r.cooldown_seconds}s ({Math.round(r.cooldown_seconds / 60)} min)
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
                              onClick={() => {
                                setEditingRule(r);
                                setRuleEditorOpen(true);
                              }}
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
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-400" />
                    Auditoria Imutável de Transações de XP
                  </CardTitle>
                  <CardDescription>
                    Registros completos de pontuação, deduplicação, ajustes manuais dev e condecorações.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="h-8 text-xs font-bold gap-1.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  Recarregar Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto">
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
        <DialogContent className="max-w-lg bg-card/95 border-border backdrop-blur-md">
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
        <DialogContent className="max-w-md bg-card/95 border-border backdrop-blur-md">
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
        <DialogContent className="max-w-lg bg-card/95 border-border backdrop-blur-md">
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
              <Select value={selectedInsigniaId} onValueChange={setSelectedInsigniaId}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Escolha a insígnia..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {insignias
                    .filter((b) => b.active)
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
        <DialogContent className="max-w-xl bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Insígnias de {selectedMember?.nickname || selectedMember?.nome}
            </DialogTitle>
            <DialogDescription>
              Lista de todas as condecorações ativas deste membro. Você pode revogá-las a qualquer momento.
            </DialogDescription>
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
                return (
                  <div
                    key={grant.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 backdrop-blur-sm",
                      rarityStyle.borderClass,
                      rarityStyle.bgClass
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner",
                          rarityStyle.borderClass,
                          rarityStyle.bgClass,
                          rarityStyle.textClass
                        )}
                      >
                        <DynamicInsigniaIcon name={b?.icon || "Award"} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-foreground">{b?.name || grant.insignia_id}</h4>
                          <Badge className={cn("text-[9px] font-bold uppercase", rarityStyle.textClass)}>
                            {rarityStyle.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{grant.reason || b?.description}</p>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Concedido em {new Date(grant.granted_at).toLocaleDateString("pt-BR")} por{" "}
                          <strong>{grant.grantor_name}</strong>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeInsignia(grant.insignia_id, b?.name || grant.insignia_id)}
                      disabled={revokingId === grant.insignia_id}
                      className="h-8 px-2.5 text-xs font-bold gap-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revogar
                    </Button>
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
        <DialogContent className="max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              {editingInsignia?.id ? "Editar Insígnia do Catálogo" : "Criar Nova Insígnia Oficial"}
            </DialogTitle>
            <DialogDescription>
              Configure o identificador único, nome de exibição, custo em XP e parâmetros visuais.
            </DialogDescription>
          </DialogHeader>

          {editingInsignia && (
            <div className="space-y-4 py-2">
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

                <div className="space-y-1.5">
                  <Label htmlFor="badge-icon" className="text-xs font-bold">
                    Ícone Lucide
                  </Label>
                  <Select
                    value={editingInsignia.icon || "Award"}
                    onValueChange={(val) => setEditingInsignia({ ...editingInsignia, icon: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ICON_COMPONENTS).map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <DynamicInsigniaIcon name={iconName} className="w-4 h-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
          )}

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
        <DialogContent className="max-w-md bg-card/95 border-border backdrop-blur-md">
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rule-reward" className="text-xs font-bold">
                    Recompensa (XP)
                  </Label>
                  <Input
                    id="rule-reward"
                    type="number"
                    min={0}
                    value={editingRule.xp_reward || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, xp_reward: Number(e.target.value) })}
                    className="font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rule-cooldown" className="text-xs font-bold">
                    Cooldown (s)
                  </Label>
                  <Input
                    id="rule-cooldown"
                    type="number"
                    min={0}
                    value={editingRule.cooldown_seconds || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, cooldown_seconds: Number(e.target.value) })}
                    className="font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rule-cap" className="text-xs font-bold">
                    Limite Diário
                  </Label>
                  <Input
                    id="rule-cap"
                    type="number"
                    min={0}
                    value={editingRule.daily_cap || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, daily_cap: Number(e.target.value) })}
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
