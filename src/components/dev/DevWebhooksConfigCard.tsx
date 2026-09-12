import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Webhook,
  Plus,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Hash,
  Send,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  Radio,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Palette,
  Bot,
  Layers,
  Clock,
  HelpCircle,
  RefreshCw,
  Check,
  ShoppingBag,
  Boxes,
  Landmark,
  Target,
  CalendarOff,
  Users,
  Ticket,
  Megaphone,
  Terminal,
  Activity,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/hooks/useAuth";
import {
  getDiscordWebhooksConfig,
  saveDiscordWebhooksConfig,
  testDiscordWebhook,
  isValidDiscordWebhookUrl,
  WEBHOOK_EVENTS_META,
  DEFAULT_WEBHOOKS_CONFIG,
  type DiscordWebhook,
  type DiscordWebhooksConfig,
  type DiscordWebhookEventType,
} from "@/services/webhookService";
import { logAuditAction } from "@/lib/app-api";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Verde Esmeralda", hex: "#10B981" },
  { name: "Azul Céu", hex: "#0284C7" },
  { name: "Âmbar Dourado", hex: "#F59E0B" },
  { name: "Roxo Real", hex: "#8B5CF6" },
  { name: "Rosa Neon", hex: "#EC4899" },
  { name: "Índigo", hex: "#6366F1" },
  { name: "Vermelho Rubi", hex: "#EF4444" },
  { name: "Rosa Escuro", hex: "#F43F5E" },
  { name: "Ciano Brilhante", hex: "#06B6D4" },
  { name: "Amarelo Sol", hex: "#EAB308" },
];

const TEMPLATES: {
  name: string;
  channelName: string;
  description: string;
  events: DiscordWebhookEventType[];
  color: string;
}[] = [
  {
    name: "Canal de Vendas & Caixa",
    channelName: "#logs-vendas",
    description: "Notificações automáticas de vendas de itens, comissões de operadores e movimentações no cofre",
    events: ["sales", "cash_fund"],
    color: "#10B981",
  },
  {
    name: "Canal de Baús & Suprimentos",
    channelName: "#logs-estoque",
    description: "Registro de entradas e saídas de armas, drogas, insumos e transferências entre baús da facção",
    events: ["movements"],
    color: "#0284C7",
  },
  {
    name: "Canal de Metas & Ausências",
    channelName: "#avisos-membros",
    description: "Comprovantes de metas entregues com print, aprovação da liderança e solicitações de afastamento",
    events: ["goals", "absences"],
    color: "#EC4899",
  },
  {
    name: "Canal de Suporte & Tickets",
    channelName: "#tickets-suporte",
    description: "Abertura de chamados internos de membros, mensagens de suporte e encerramento de tickets",
    events: ["tickets"],
    color: "#3B82F6",
  },
  {
    name: "Canal de Auditoria & Sistema",
    channelName: "#auditoria-dev",
    description: "Registro de ações de desenvolvedores, limpezas forçadas de cache e erros de sistema",
    events: ["dev_audit", "system_errors", "members", "announcements"],
    color: "#F43F5E",
  },
];

export function DevWebhooksConfigCard() {
  const { user, profile, level } = useAuth();

  const [config, setConfig] = useState<DiscordWebhooksConfig>(DEFAULT_WEBHOOKS_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DiscordWebhooksConfig>(DEFAULT_WEBHOOKS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtro de lista
  const [filterQuery, setFilterQuery] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("all");

  // Visualização de URLs ocultas
  const [revealedUrls, setRevealedUrls] = useState<Record<string, boolean>>({});

  // Estado de teste de webhook individual
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Modal de Criar / Editar Webhook
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<DiscordWebhook | null>(null);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form State do Modal
  const [formState, setFormState] = useState<{
    id: string;
    name: string;
    url: string;
    channelName: string;
    description: string;
    enabled: boolean;
    username: string;
    avatarUrl: string;
    events: DiscordWebhookEventType[];
    embedColor: string;
    mentionRoles: string;
    footerText: string;
    footerIconUrl: string;
    showTimestamp: boolean;
  }>({
    id: "",
    name: "",
    url: "",
    channelName: "#geral",
    description: "",
    enabled: true,
    username: "Twin Wheels RP • Logs",
    avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    events: ["sales", "movements", "goals"],
    embedColor: "#10B981",
    mentionRoles: "",
    footerText: "Twin Wheels RP • Sistema Integrado",
    footerIconUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    showTimestamp: true,
  });

  // Carrega configuração
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDiscordWebhooksConfig();
      setConfig(data);
      setInitialConfig(JSON.parse(JSON.stringify(data)));
    } catch (err: any) {
      toast.error("Falha ao carregar webhooks: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Detecta se há alterações não salvas
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = config.webhooks.length;
    const active = config.webhooks.filter((w) => w.enabled && w.url).length;
    const allAssignedEvents = new Set(
      config.webhooks.filter((w) => w.enabled).flatMap((w) => w.events)
    );
    return {
      total,
      active,
      coveredEventsCount: allAssignedEvents.size,
    };
  }, [config.webhooks]);

  // Webhooks filtrados
  const filteredWebhooks = useMemo(() => {
    return config.webhooks.filter((w) => {
      if (filterEvent !== "all" && !w.events.includes(filterEvent as DiscordWebhookEventType)) {
        return false;
      }
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const matchName = w.name.toLowerCase().includes(q);
        const matchChannel = w.channelName?.toLowerCase().includes(q);
        const matchDesc = w.description?.toLowerCase().includes(q);
        if (!matchName && !matchChannel && !matchDesc) return false;
      }
      return true;
    });
  }, [config.webhooks, filterQuery, filterEvent]);

  // Toggle url visibility
  const toggleRevealUrl = (id: string) => {
    setRevealedUrls((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copia url para clipboard
  const handleCopyUrl = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("URL do Webhook copiada para a área de transferência!");
  };

  // Toggle ativação individual de webhook
  const handleToggleWebhook = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled, updatedAt: new Date().toISOString() } : w
      ),
    }));
  };

  // Abre modal para criar novo webhook
  const handleOpenCreate = (templateIndex?: number) => {
    const tpl = templateIndex !== undefined ? TEMPLATES[templateIndex] : null;
    const newId = `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    setEditingWebhook(null);
    setFormState({
      id: newId,
      name: tpl ? tpl.name : `Novo Webhook #${config.webhooks.length + 1}`,
      url: "",
      channelName: tpl ? tpl.channelName : "#logs",
      description: tpl ? tpl.description : "Notificações automáticas do sistema",
      enabled: true,
      username: config.defaultUsername || "Twin Wheels RP • Logs",
      avatarUrl: config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      events: tpl ? tpl.events : ["sales", "movements", "cash_fund", "goals"],
      embedColor: tpl ? tpl.color : "#10B981",
      mentionRoles: "",
      footerText: config.defaultFooterText || "Twin Wheels RP • Sistema de Webhooks",
      footerIconUrl: config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      showTimestamp: true,
    });
    setModalTestResult(null);
    setModalOpen(true);
  };

  // Abre modal para editar webhook existente
  const handleOpenEdit = (webhook: DiscordWebhook) => {
    setEditingWebhook(webhook);
    setFormState({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      channelName: webhook.channelName || "#geral",
      description: webhook.description || "",
      enabled: webhook.enabled,
      username: webhook.username || config.defaultUsername || "Twin Wheels RP",
      avatarUrl: webhook.avatarUrl || config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      events: [...webhook.events],
      embedColor: webhook.embedColor || "#10B981",
      mentionRoles: webhook.mentionRoles || "",
      footerText: webhook.footerText || config.defaultFooterText || "Twin Wheels RP",
      footerIconUrl: webhook.footerIconUrl || config.defaultAvatarUrl || "",
      showTimestamp: webhook.showTimestamp !== false,
    });
    setModalTestResult(null);
    setModalOpen(true);
  };

  // Salva no formulário modal
  const handleSaveModal = () => {
    if (!formState.name.trim()) {
      toast.error("Informe um nome para identificar este webhook.");
      return;
    }

    if (formState.url.trim() && !isValidDiscordWebhookUrl(formState.url.trim())) {
      toast.warning("Atenção: A URL informada não segue o padrão comum do Discord (https://discord.com/api/webhooks/...). O envio pode falhar.");
    }

    const updatedItem: DiscordWebhook = {
      id: formState.id,
      name: formState.name.trim(),
      url: formState.url.trim(),
      channelName: formState.channelName.trim() || "#canal",
      description: formState.description.trim() || undefined,
      enabled: formState.enabled,
      username: formState.username.trim() || undefined,
      avatarUrl: formState.avatarUrl.trim() || undefined,
      events: formState.events,
      embedColor: formState.embedColor,
      mentionRoles: formState.mentionRoles.trim() || undefined,
      footerText: formState.footerText.trim() || undefined,
      footerIconUrl: formState.footerIconUrl.trim() || undefined,
      showTimestamp: formState.showTimestamp,
      createdAt: editingWebhook ? editingWebhook.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStatus: editingWebhook?.lastStatus,
      lastTriggeredAt: editingWebhook?.lastTriggeredAt,
      lastErrorMessage: editingWebhook?.lastErrorMessage,
    };

    if (editingWebhook) {
      setConfig((prev) => ({
        ...prev,
        webhooks: prev.webhooks.map((w) => (w.id === updatedItem.id ? updatedItem : w)),
      }));
      toast.success(`Webhook "${updatedItem.name}" atualizado.`);
    } else {
      setConfig((prev) => ({
        ...prev,
        webhooks: [...prev.webhooks, updatedItem],
      }));
      toast.success(`Webhook "${updatedItem.name}" criado com sucesso!`);
    }

    setModalOpen(false);
  };

  // Exclui webhook
  const handleDeleteWebhook = (id: string, name: string) => {
    if (!window.confirm(`Tem certeza de que deseja remover o webhook "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setConfig((prev) => ({
      ...prev,
      webhooks: prev.webhooks.filter((w) => w.id !== id),
    }));
    toast.info(`Webhook "${name}" removido.`);
  };

  // Duplica webhook
  const handleDuplicateWebhook = (webhook: DiscordWebhook) => {
    const clone: DiscordWebhook = {
      ...JSON.parse(JSON.stringify(webhook)),
      id: `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${webhook.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStatus: undefined,
      lastTriggeredAt: undefined,
    };

    setConfig((prev) => ({
      ...prev,
      webhooks: [...prev.webhooks, clone],
    }));
    toast.success(`Webhook duplicado: "${clone.name}".`);
  };

  // Executa teste em webhook individual
  const handleTestWebhook = async (webhook: DiscordWebhook) => {
    if (!webhook.url) {
      toast.error("Configure uma URL de webhook antes de realizar o teste.");
      return;
    }

    setTestingId(webhook.id);
    try {
      const res = await testDiscordWebhook(
        webhook,
        `Disparado manualmente pelo usuário ${profile?.nome || user?.email || "Desenvolvedor"}`
      );

      setTestResults((prev) => ({
        ...prev,
        [webhook.id]: { success: res.success, message: res.message },
      }));

      if (res.success) {
        toast.success(res.message, {
          icon: "🚀",
          description: "O embed de teste foi validado e entregue no Discord com sucesso.",
        });
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("Falha ao testar webhook: " + (err?.message || err));
    } finally {
      setTestingId(null);
    }
  };

  // Executa teste dentro do modal
  const handleTestModalWebhook = async () => {
    if (!formState.url.trim()) {
      toast.error("Insira a URL do Webhook do Discord para poder testar.");
      return;
    }

    setModalTesting(true);
    setModalTestResult(null);

    const tempWebhook: DiscordWebhook = {
      id: formState.id,
      name: formState.name || "Teste",
      url: formState.url.trim(),
      channelName: formState.channelName || "#canal",
      enabled: true,
      username: formState.username,
      avatarUrl: formState.avatarUrl,
      events: formState.events,
      embedColor: formState.embedColor,
      mentionRoles: formState.mentionRoles,
      footerText: formState.footerText,
      footerIconUrl: formState.footerIconUrl,
      showTimestamp: formState.showTimestamp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await testDiscordWebhook(tempWebhook, "Teste de validação direta pelo formulário de edição");
      setModalTestResult({ success: res.success, message: res.message });
      if (res.success) {
        toast.success("✅ Teste bem-sucedido! O Discord recebeu a mensagem.");
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setModalTestResult({ success: false, message: err?.message || "Erro de conexão" });
    } finally {
      setModalTesting(false);
    }
  };

  // Salva toda a configuração no banco
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveDiscordWebhooksConfig(config, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("Configuração de Webhooks do Discord salva com sucesso!", {
        icon: "📡",
      });

      void logAuditAction(
        "save_discord_webhooks_config",
        "dev_webhooks",
        {
          totalWebhooks: config.webhooks.length,
          enabled: config.enabled,
          activeCount: stats.active,
        }
      );
    } catch (err: any) {
      toast.error("Falha ao salvar webhooks: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Toggle evento no formulário do modal
  const handleToggleEvent = (ev: DiscordWebhookEventType) => {
    setFormState((prev) => {
      const exists = prev.events.includes(ev);
      return {
        ...prev,
        events: exists ? prev.events.filter((e) => e !== ev) : [...prev.events, ev],
      };
    });
  };

  const handleSelectAllEvents = () => {
    const allKeys = Object.keys(WEBHOOK_EVENTS_META) as DiscordWebhookEventType[];
    setFormState((prev) => ({ ...prev, events: allKeys }));
  };

  const handleClearAllEvents = () => {
    setFormState((prev) => ({ ...prev, events: [] }));
  };

  if (loading) {
    return (
      <Card className="surface-card p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Carregando Webhooks do Discord...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* CARD SUPERIOR: CONTROLE GERAL & STATUS */}
      <Card className="surface-card border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-card to-purple-500/5 shadow-md">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/30">
                <Webhook className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-extrabold text-foreground">
                    Gerenciador de Webhooks do Discord
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/40 text-indigo-400 bg-indigo-500/10">
                    HTTP Webhooks
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Crie e configure múltiplos canais do Discord com links diretos de Webhook para receber logs, alertas de vendas, ausências, metas e auditoria.
                </CardDescription>
              </div>
            </div>

            {/* Master Switch & Save Button */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border/60">
                <Label htmlFor="masterWebhooksSwitch" className="text-xs font-bold text-foreground cursor-pointer">
                  Sistema de Webhooks
                </Label>
                <Switch
                  id="masterWebhooksSwitch"
                  checked={config.enabled}
                  onCheckedChange={(val) => setConfig((prev) => ({ ...prev, enabled: val }))}
                />
              </div>

              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={!hasChanges || saving}
                className="h-9 text-xs font-extrabold gap-1.5 bg-gradient-brand text-primary-foreground shadow-md hover:opacity-90 transition-all"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total de Webhooks
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-black text-foreground">{stats.total}</span>
                <span className="text-[10px] text-muted-foreground">configurados</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Webhooks Ativos
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-black text-emerald-400">{stats.active}</span>
                <span className="text-[10px] text-muted-foreground">prontos para envio</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                Eventos Cobertos
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-black text-purple-400">
                  {stats.coveredEventsCount}/10
                </span>
                <span className="text-[10px] text-muted-foreground">categorias</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                Modo de Operação
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 pt-0.5">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span>{config.enabled ? "Ativo em Tempo Real" : "Pausado Geral"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BARRA DE AÇÕES: CRIAR, MODELOS RÁPIDOS & FILTROS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => handleOpenCreate()}
            size="sm"
            className="h-9 text-xs font-bold gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Criar Novo Webhook
          </Button>

          {/* Modelos Rápidos Dropdown */}
          <Select onValueChange={(val) => handleOpenCreate(parseInt(val, 10))}>
            <SelectTrigger className="h-9 w-44 text-xs font-bold bg-secondary/50 border-border/60">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-400" />
              <SelectValue placeholder="Modelos Rápidos..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((tpl, idx) => (
                <SelectItem key={tpl.name} value={String(idx)} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tpl.color }} />
                    <span className="font-bold">{tpl.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{tpl.channelName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 text-xs font-bold gap-1 border-border/60"
            title="Recarregar dados do servidor"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Filtros de Busca e Categoria */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome ou canal (#)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="h-9 w-48 sm:w-60 text-xs bg-secondary/50 border-border/60"
          />

          <Select value={filterEvent} onValueChange={setFilterEvent}>
            <SelectTrigger className="h-9 w-40 text-xs bg-secondary/50 border-border/60">
              <SelectValue placeholder="Filtrar evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os Eventos</SelectItem>
              {Object.entries(WEBHOOK_EVENTS_META).map(([k, meta]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LISTA / GRID DE WEBHOOKS CONFIGURADOS */}
      {filteredWebhooks.length === 0 ? (
        <Card className="surface-card p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
            <Webhook className="h-7 w-7" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-foreground">Nenhum Webhook encontrado</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {filterQuery || filterEvent !== "all"
                ? "Nenhum webhook corresponde aos filtros de busca aplicados."
                : "Você ainda não possui nenhum webhook cadastrado para o Discord. Crie um canal dedicado no Discord, copie o link do Webhook e adicione-o aqui."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleOpenCreate()}
              className="text-xs font-bold gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Primeiro Webhook
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenCreate(0)}
              className="text-xs font-bold gap-1.5 border-border cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Usar Modelo de Vendas
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredWebhooks.map((item) => {
            const isRevealed = Boolean(revealedUrls[item.id]);
            const isTestingThis = testingId === item.id;
            const lastTest = testResults[item.id];

            return (
              <Card
                key={item.id}
                className={cn(
                  "surface-card border transition-all duration-200 hover:border-indigo-500/40 flex flex-col justify-between",
                  !item.enabled && "opacity-60 bg-secondary/10 border-border/40",
                  item.enabled && "shadow-sm"
                )}
              >
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold shadow-xs"
                        style={{ backgroundColor: item.embedColor || "#10B981" }}
                      >
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-foreground truncate">{item.name}</h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0 border-border/60 bg-secondary/50"
                          >
                            {item.channelName || "#canal"}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono font-bold uppercase py-0.5",
                          item.enabled
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            : "border-zinc-500/40 text-zinc-400 bg-zinc-500/10"
                        )}
                      >
                        {item.enabled ? "Ativo" : "Pausado"}
                      </Badge>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => handleToggleWebhook(item.id)}
                        title={item.enabled ? "Desativar este webhook" : "Ativar este webhook"}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  {/* Webhook URL bar com Mascaramento e Cópia */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>URL do Webhook Discord</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.url ? (isValidDiscordWebhookUrl(item.url) ? "✅ URL Válida" : "⚠️ Formato Incomum") : "❌ Não configurada"}
                      </span>
                    </Label>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/40 border border-border/60 text-xs font-mono">
                      <span className="text-muted-foreground px-1 truncate flex-1 select-all">
                        {item.url
                          ? isRevealed
                            ? item.url
                            : `${item.url.slice(0, 34)}••••••••••••••••••••••••••••••••`
                          : "https://discord.com/api/webhooks/..."}
                      </span>
                      {item.url && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleRevealUrl(item.id)}
                            title={isRevealed ? "Ocultar URL" : "Exibir URL"}
                          >
                            {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyUrl(item.url)}
                            title="Copiar URL"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Identidade do Bot no Discord */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-border/40 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt="Bot Avatar"
                          className="h-6 w-6 rounded-full object-cover border border-border shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <span className="font-bold text-foreground truncate">
                        {item.username || config.defaultUsername || "Twin Wheels Logs"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground shrink-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{ backgroundColor: item.embedColor || "#10B981" }}
                      />
                      <span>{item.embedColor || "#10B981"}</span>
                    </div>
                  </div>

                  {/* Badges dos Eventos Inscritos */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Eventos Transmitidos ({item.events?.length || 0})
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {item.events && item.events.length > 0 ? (
                        item.events.map((ev) => {
                          const meta = WEBHOOK_EVENTS_META[ev];
                          return (
                            <Badge
                              key={ev}
                              variant="outline"
                              className={cn("text-[9px] font-mono px-1.5 py-0.5", meta?.badgeColor)}
                            >
                              {meta?.label || ev}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-[10.5px] text-muted-foreground italic">
                          Nenhum evento inscrito (webhook silencioso)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resultado do Teste Recente */}
                  {lastTest && (
                    <div
                      className={cn(
                        "p-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 border",
                        lastTest.success
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      )}
                    >
                      <span className="truncate text-[11px]">{lastTest.message}</span>
                      <span className="text-[9px] uppercase font-bold shrink-0">
                        {lastTest.success ? "Sucesso" : "Falha"}
                      </span>
                    </div>
                  )}

                  {/* Barra de Ações do Card */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                      <Clock className="h-3 w-3" />
                      <span>
                        {item.lastTriggeredAt
                          ? `Último: ${new Date(item.lastTriggeredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                          : "Nunca disparado"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestWebhook(item)}
                        disabled={isTestingThis || !item.url}
                        className="h-7 text-xs font-bold gap-1 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                        title="Enviar embed de teste para este canal"
                      >
                        {isTestingThis ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Testar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(item)}
                        className="h-7 text-xs font-bold gap-1 border-border text-foreground hover:bg-secondary/60"
                        title="Editar configurações completas do webhook"
                      >
                        <Edit3 className="h-3 w-3" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicateWebhook(item)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Duplicar webhook"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteWebhook(item.id, item.name)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        title="Excluir webhook"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── MODAL DE CRIAR / EDITAR WEBHOOK ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/80 p-6 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Webhook className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  {editingWebhook ? `Editar Webhook: ${editingWebhook.name}` : "Criar Novo Webhook para o Discord"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Personalize a URL do canal, nome do bot, cores e selecione quais eventos da plataforma serão enviados.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-xl border border-border/60">
              <TabsTrigger value="basic" className="text-xs font-bold py-1.5">
                1. Canal & Link
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs font-bold py-1.5">
                2. Eventos ({formState.events.length})
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs font-bold py-1.5">
                3. Aparência & Embed
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: CANAL & LINK */}
            <TabsContent value="basic" className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome de Identificação *</Label>
                  <Input
                    placeholder="Ex: Logs de Vendas, Suporte Geral"
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-9 text-xs bg-secondary/50 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome do Canal no Discord</Label>
                  <Input
                    placeholder="Ex: #logs-vendas ou #alertas"
                    value={formState.channelName}
                    onChange={(e) => setFormState((prev) => ({ ...prev, channelName: e.target.value }))}
                    className="h-9 text-xs bg-secondary/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">URL do Webhook do Discord *</Label>
                  {formState.url && (
                    <span className="text-[10px] font-mono">
                      {isValidDiscordWebhookUrl(formState.url) ? (
                        <span className="text-emerald-400 font-bold">✅ Formato Válido</span>
                      ) : (
                        <span className="text-amber-400 font-bold">⚠️ Formato Incomum</span>
                      )}
                    </span>
                  )}
                </div>
                <Input
                  placeholder="https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz..."
                  value={formState.url}
                  onChange={(e) => setFormState((prev) => ({ ...prev, url: e.target.value }))}
                  className="h-9 text-xs bg-secondary/50 font-mono"
                />
                <p className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0" />
                  No Discord: Clique com botão direito no canal desejado &gt; Editar Canal &gt; Integrações &gt; Webhooks &gt; Novo Webhook &gt; Copiar URL.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Descrição / Finalidade (Opcional)</Label>
                <Input
                  placeholder="Ex: Canal monitorado pela gerência para controle diário de faturamento"
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  className="h-9 text-xs bg-secondary/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="modalWebhookEnabled" className="text-xs font-bold text-foreground cursor-pointer block">
                    Webhook Ativo para Transmissão
                  </Label>
                  <p className="text-[10.5px] text-muted-foreground">
                    Quando desativado, o webhook não enviará mensagens automáticas mesmo se os eventos ocorrerem.
                  </p>
                </div>
                <Switch
                  id="modalWebhookEnabled"
                  checked={formState.enabled}
                  onCheckedChange={(val) => setFormState((prev) => ({ ...prev, enabled: val }))}
                />
              </div>
            </TabsContent>

            {/* ABA 2: SELEÇÃO DE EVENTOS */}
            <TabsContent value="events" className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-extrabold text-foreground">
                    Selecione quais eventos enviar para este canal
                  </h5>
                  <p className="text-[10.5px] text-muted-foreground">
                    Marque apenas os eventos pertinentes para manter o canal organizado.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={handleSelectAllEvents}
                  >
                    Marcar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={handleClearAllEvents}
                  >
                    Limpar Todos
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.entries(WEBHOOK_EVENTS_META) as [DiscordWebhookEventType, typeof WEBHOOK_EVENTS_META[DiscordWebhookEventType]][]).map(([key, meta]) => {
                  const isChecked = formState.events.includes(key);

                  return (
                    <div
                      key={key}
                      onClick={() => handleToggleEvent(key)}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none",
                        isChecked
                          ? "bg-secondary/40 border-indigo-500/40 shadow-xs"
                          : "bg-secondary/15 border-border/50 opacity-60 hover:opacity-90"
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-md flex items-center justify-center text-white shrink-0 mt-0.5 border text-[10px]",
                          isChecked ? "bg-indigo-600 border-indigo-500" : "border-border/80 bg-background"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground truncate">{meta.label}</span>
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: meta.defaultColor }}
                          />
                        </div>
                        <p className="text-[10.5px] text-muted-foreground line-clamp-1 mt-0.5">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* ABA 3: APARÊNCIA & EMBED PREVIEW */}
            <TabsContent value="appearance" className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome do Bot (Username Override)</Label>
                  <Input
                    placeholder="Ex: Twin Wheels | Vendas"
                    value={formState.username}
                    onChange={(e) => setFormState((prev) => ({ ...prev, username: e.target.value }))}
                    className="h-9 text-xs bg-secondary/50 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Avatar do Bot (URL da Imagem)</Label>
                  <Input
                    placeholder="https://i.ibb.co/..."
                    value={formState.avatarUrl}
                    onChange={(e) => setFormState((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                    className="h-9 text-xs bg-secondary/50 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Seletor de Cores */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Cor da Barra Lateral do Embed</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border/60">
                    <input
                      type="color"
                      value={formState.embedColor}
                      onChange={(e) => setFormState((prev) => ({ ...prev, embedColor: e.target.value }))}
                      className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs font-bold uppercase pr-2">{formState.embedColor}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, embedColor: c.hex }))}
                        className={cn(
                          "h-6 w-6 rounded-lg transition-transform hover:scale-110 shrink-0 border border-white/10",
                          formState.embedColor.toLowerCase() === c.hex.toLowerCase() && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105"
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Menção de Cargos / Usuários</Label>
                  <Input
                    placeholder="Ex: <@&1234567890> ou @here"
                    value={formState.mentionRoles}
                    onChange={(e) => setFormState((prev) => ({ ...prev, mentionRoles: e.target.value }))}
                    className="h-9 text-xs bg-secondary/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Texto do Rodapé (Footer)</Label>
                  <Input
                    placeholder="Ex: Twin Wheels RP • Sistema de Logs"
                    value={formState.footerText}
                    onChange={(e) => setFormState((prev) => ({ ...prev, footerText: e.target.value }))}
                    className="h-9 text-xs bg-secondary/50"
                  />
                </div>
              </div>

              {/* LIVE DISCORD EMBED PREVIEW */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-indigo-400" />
                  Pré-visualização em Tempo Real no Discord
                </Label>

                {/* Caixa escura padrão do Discord */}
                <div className="p-4 rounded-xl bg-[#313338] text-white space-y-2 border border-black/40 shadow-inner select-none font-sans">
                  {/* Header do Bot */}
                  <div className="flex items-center gap-2">
                    {formState.avatarUrl ? (
                      <img
                        src={formState.avatarUrl}
                        alt="Avatar Preview"
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <span className="font-bold text-sm text-[#f2f3f5]">{formState.username || "Twin Wheels RP"}</span>
                    <Badge className="bg-[#5865F2] text-white text-[9px] uppercase px-1 py-0 h-4 font-bold tracking-wider">
                      BOT
                    </Badge>
                    <span className="text-[10px] text-[#949ba4]">Hoje às 16:20</span>
                  </div>

                  {formState.mentionRoles && (
                    <p className="text-xs text-[#c9cdfb] font-medium">{formState.mentionRoles}</p>
                  )}

                  {/* O Embed Card */}
                  <div
                    className="p-3.5 rounded-lg bg-[#2b2d31] border-l-4 space-y-2 text-xs shadow-md"
                    style={{ borderLeftColor: formState.embedColor || "#10B981" }}
                  >
                    <div className="font-bold text-sm text-white">
                      ✅ {formState.name || "Evento Registrado com Sucesso"}
                    </div>
                    <p className="text-[12px] text-[#dbdee1] leading-relaxed">
                      Lançamento sincronizado e despachado automaticamente para o canal{" "}
                      <span className="text-[#00a8fc] font-semibold">{formState.channelName}</span>.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#383a40] text-[11px]">
                      <div>
                        <span className="text-[#949ba4] font-semibold block text-[10px] uppercase">Operador:</span>
                        <span className="font-bold text-white">{profile?.nome || "Membro da Facção"}</span>
                      </div>
                      <div>
                        <span className="text-[#949ba4] font-semibold block text-[10px] uppercase">Categoria:</span>
                        <span className="font-bold text-[#10B981]">
                          {formState.events[0] ? WEBHOOK_EVENTS_META[formState.events[0]]?.label : "Geral"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[#949ba4] border-t border-[#383a40]">
                      {formState.footerIconUrl && (
                        <img
                          src={formState.footerIconUrl}
                          alt="Footer Icon"
                          className="h-3.5 w-3.5 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      )}
                      <span>{formState.footerText || "Twin Wheels RP"}</span>
                      {formState.showTimestamp && (
                        <>
                          <span>•</span>
                          <span>Hoje às 16:20</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Teste Inline do Modal */}
          {modalTestResult && (
            <div
              className={cn(
                "p-2.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 border",
                modalTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              )}
            >
              <span>{modalTestResult.message}</span>
              <span className="text-[10px] font-bold uppercase shrink-0">
                {modalTestResult.success ? "✅ OK" : "❌ ERRO"}
              </span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border/50 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestModalWebhook}
              disabled={modalTesting || !formState.url.trim()}
              className="h-9 text-xs font-bold gap-1.5 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
            >
              {modalTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {modalTesting ? "Disparando..." : "Testar no Discord"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveModal}
                className="h-9 text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:opacity-90"
              >
                {editingWebhook ? "Atualizar Webhook" : "Salvar Webhook"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
