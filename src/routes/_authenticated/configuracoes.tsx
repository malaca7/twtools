import { useState, useCallback, useMemo, useEffect, Component } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Settings,
  Monitor,
  Menu,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  Workflow,
  TrendingUp,
  Trophy,
  Target,
  ScrollText,
  ShieldCheck,
  User,
  Landmark,
  Megaphone,
  Info,
  Shield,
  Palette,
  Wrench,
  Lock,
  Bell,
  Volume2,
  Sparkles,
  Sliders,
  CheckCircle2,
  Code2,
  KeyRound,
  Tag,
  Type,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Move,
  FolderTree,
  Sun,
  Contrast,
  MessageSquare,
  CalendarOff,
  LifeBuoy,
  Search,
  ExternalLink,
  Globe,
  Bookmark,
  Radio,
  Tv,
  Power,
  Loader2,
} from "lucide-react";
import {
  useUserStreamPreferences,
  useMemberStreamAccounts,
  useToggleStreamAccountActive,
  useUnlinkStreamAccount,
} from "@/hooks/useLives";
import { STREAM_PLATFORMS, type StreamPlatform } from "@/types/lives";
import { LinkStreamAccountModal } from "@/components/lives/LinkStreamAccountModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AVAILABLE_MENU_ICONS, resolveMenuIcon, type MenuIconDef } from "@/lib/menuIcons";
import { playGamerSuccessSound, playGamerOnlineAlertSound } from "@/lib/sound-effects";
import { chatSound } from "@/lib/chatSound";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useUrlTab } from "@/hooks/useUrlTab";
import { cn } from "@/lib/utils";
import {
  useMenuConfig,
  saveMenuConfig,
  syncMenuConfig,
  DEFAULT_MENU_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  type MenuItemConfig,
  type MenuConfig,
} from "@/hooks/useMenuConfig";
import { usePlatformSettings, savePlatformSettings, DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from "@/hooks/usePlatformSettings";
import { UserAppearanceSettings } from "@/components/profile/UserAppearanceSettings";
import { PublicProfileCustomizer } from "@/components/profile/PublicProfileCustomizer";
import { PlatformMenuEditor } from "@/components/menu/PlatformMenuEditor";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesWrapper,
});

function ConfiguracoesWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <ConfiguracoesPage />;
}

/* ─── Icon map for menu items ─── */
const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/movimentacoes": ArrowLeftRight,
  "/vendas": ShoppingCart,
  "/lives": Radio,
  "/tickets": LifeBuoy,
  "/controledeestoque": Boxes,
  "/estoque": Boxes,
  "/membros": Users,
  "/hierarquia": Workflow,
  "/fundo-caixa": Landmark,
  "/ausencias": CalendarOff,
  "/rankings": Trophy,
  "/desempenho": User,
  "/dev/desempenho": TrendingUp,
  "/dev.desempenho": TrendingUp,
  "/metas": Target,
  "/cargos": ShieldCheck,
  "/permissoes": Settings,
  "/avisos": Megaphone,
  "/atualizacoes": Sparkles,
  "/perfil": User,
  "/configuracoes": Wrench,
  "/dev/permissoes": KeyRound,
  "/dev/configuracao": Code2,
  "/dev/menu-lateral": Sliders,
};

/* ─── Canonical menu items & categories definition ─── */
const DEFAULT_ITEMS: MenuItemConfig[] = DEFAULT_MENU_ITEMS;
const CATEGORIES: string[] = DEFAULT_MENU_CATEGORIES;

/* ─── Platform tab component ─── */
function PlatformTab({ canEdit }: { canEdit: boolean }) {
  const { settings, save, reset } = usePlatformSettings();

  const [formData, setFormData] = useState<PlatformSettings>(() => settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      setFormData(settings);
    }
  }, [settings, hasChanges]);

  const handleChange = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    if (!canEdit) return;
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(settings));
      return updated;
    });
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar as configurações da plataforma.");
      return;
    }
    save(formData);
    setHasChanges(false);
    toast.success("Configurações da plataforma salvas com sucesso!");
  };

  const handleReset = () => {
    if (!canEdit) return;
    reset();
    setFormData(DEFAULT_PLATFORM_SETTINGS);
    setHasChanges(false);
    toast.success("Configurações restauradas para o padrão!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Configurações Gerais & Identidade</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize a identidade do grupo e parâmetros operacionais.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!canEdit}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || !canEdit}
            className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Você está em modo de apenas leitura. Fale com um administrador para editar.</span>
        </div>
      )}

      {/* General Information Card */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Identidade do grupo</CardTitle>
              <CardDescription className="text-[0.7rem]">Nome, tag e dados públicos do grupo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do grupo</Label>
              <Input
                value={formData.factionName}
                onChange={(e) => handleChange("factionName", e.target.value)}
                disabled={!canEdit}
                placeholder="Ex.: Twin Wheels"
                className="h-9 text-xs font-bold bg-secondary/50 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tag / Sigla</Label>
              <Input
                value={formData.factionTag}
                onChange={(e) => handleChange("factionTag", e.target.value)}
                disabled={!canEdit}
                placeholder="Ex.: [TW]"
                className="h-9 text-xs font-mono font-bold bg-secondary/50 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Organização</Label>
              <Input
                value={formData.factionType}
                onChange={(e) => handleChange("factionType", e.target.value)}
                disabled={!canEdit}
                placeholder="Ex.: Gestão de grupo — GTA RP"
                className="h-9 text-xs bg-secondary/50 border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subtítulo / Slogan</Label>
            <Input
              value={formData.slogan}
              onChange={(e) => handleChange("slogan", e.target.value)}
              disabled={!canEdit}
              placeholder="Ex.: Gestão Interna · GTA RP"
              className="h-9 text-xs bg-secondary/50 border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Descrição do Grupo</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!canEdit}
              rows={3}
              placeholder="Descrição curta da organização..."
              className="text-xs bg-secondary/50 border-border/60 leading-relaxed resize-none"
            />
          </div>
        </CardContent>
      </Card>

            {/* Operational Rules Card */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Parâmetros Operacionais</CardTitle>
              <CardDescription className="text-[0.7rem]">Regras de movimentação e visibilidade de caixa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Permitir movimentações sem baú vinculado</p>
              <p className="text-[0.7rem] text-muted-foreground">Permite retirar/dar entrada sem selecionar um baú específico</p>
            </div>
            <Switch
              checked={formData.allowMovementsWithoutBau}
              onCheckedChange={(checked) => handleChange("allowMovementsWithoutBau", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Notificar cadastros pendentes no Dashboard</p>
              <p className="text-[0.7rem] text-muted-foreground">Exibe alerta no topo quando houver membros aguardando aprovação</p>
            </div>
            <Switch
              checked={formData.notifyPendingSignups}
              onCheckedChange={(checked) => handleChange("notifyPendingSignups", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Exibir valor do Fundo de Caixa para Operadores</p>
              <p className="text-[0.7rem] text-muted-foreground">Exibe o total acumulado do caixa para membros de nível operador</p>
            </div>
            <Switch
              checked={formData.showConsolidatedCashToOperators}
              onCheckedChange={(checked) => handleChange("showConsolidatedCashToOperators", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Menu tab component ─── */
function MenuTab({ canEdit }: { canEdit: boolean }) {
  return <PlatformMenuEditor canEdit={canEdit} showDevNavigationLinks={true} />;
}

/* ─── Chat Notification Sounds Component ─── */
function ChatSoundConfigCard() {
  const [chatSoundEnabled, setChatSoundEnabled] = useState(chatSound.isEnabled());

  useEffect(() => {
    const handleSoundChange = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setChatSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("tw_chat_sound_change", handleSoundChange);
    return () => window.removeEventListener("tw_chat_sound_change", handleSoundChange);
  }, []);

  const handleToggle = (checked: boolean) => {
    chatSound.setEnabled(checked);
    setChatSoundEnabled(checked);
    toast.success(
      checked
        ? "Notificações sonoras do chat ativadas com sucesso!"
        : "Notificações sonoras do chat desativadas!"
    );
    if (checked) {
      chatSound.playIncomingMessage();
    }
  };

  const handleTestIncoming = () => {
    chatSound.playIncomingMessage();
    toast.info("Testando som de nova mensagem do chat");
  };

  const handleTestMention = () => {
    chatSound.playMentionSound();
    toast.info("Testando som de menção (@você) no chat");
  };

  const handleTestSent = () => {
    chatSound.playSentMessage();
    toast.info("Testando som de mensagem enviada");
  };

  return (
    <Card className="surface-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Notificações Sonoras do Chat</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Alertas sonoros em tempo real para novas mensagens recebidas, menções e envio
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono",
              chatSoundEnabled
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                : "border-zinc-500/40 text-muted-foreground"
            )}
          >
            {chatSoundEnabled ? "Áudio Ativo" : "Silenciado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Sons de novas mensagens e menções</p>
            <p className="text-[0.7rem] text-muted-foreground">
              Reproduzir tom sonoro discreto e cristalino ao receber novas mensagens fora da conversa aberta
            </p>
          </div>
          <Switch
            checked={chatSoundEnabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* Audio Test Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestIncoming}
            disabled={!chatSoundEnabled}
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Testar Som de Mensagem Recebida
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestMention}
            disabled={!chatSoundEnabled}
            className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Testar Som de Menção (@)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestSent}
            disabled={!chatSoundEnabled}
            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Testar Som de Envio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Notifications & Notices Tab Component ─── */
function NotificationsTab({ canEdit }: { canEdit: boolean }) {
  const { settings, save } = usePlatformSettings();
  const [formData, setFormData] = useState<PlatformSettings>(() => settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      setFormData(settings);
    }
  }, [settings, hasChanges]);

  const handleChange = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    if (!canEdit) return;
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(settings));
      return updated;
    });
  };

  const handleSave = () => {
    if (!canEdit) return;
    save(formData);
    setHasChanges(false);
    toast.success("Configurações de notificações salvas com sucesso!");
    if (formData.soundEffectsEnabled) {
      playGamerSuccessSound(formData.soundVolume || 60);
    }
  };

  const handleTestOperationSound = () => {
    playGamerSuccessSound(formData.soundVolume || 60);
    toast.info("Testando efeito sonoro de operação (Web Audio API)", {
      description: `Volume ajustado em ${formData.soundVolume || 60}%`,
    });
  };

  const handleTestOnlineAlertSound = () => {
    playGamerOnlineAlertSound(formData.soundVolume || 60);
    toast.success("Testando alerta sonoro de membro online", {
      description: `Volume ajustado em ${formData.soundVolume || 60}%`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Sons & Alertas de Notificações</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure o sistema profissional de áudio gamer e exibição de avisos do grupo.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || !canEdit}
          className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold shrink-0"
        >
          <Save className="h-3.5 w-3.5" />
          Salvar Alterações
        </Button>
      </div>

      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Efeitos Sonoros & Áudio Gamer</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Sintetizador Web Audio API de alta fidelidade para lançamentos e presença
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Efeitos sonoros ao registrar operações</p>
              <p className="text-[0.7rem] text-muted-foreground">Bipe sci-fi ao efetuar vendas, saídas e movimentações</p>
            </div>
            <Switch
              checked={formData.soundEffectsEnabled}
              onCheckedChange={(checked) => handleChange("soundEffectsEnabled", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Alerta sonoro tático de entrada online</p>
              <p className="text-[0.7rem] text-muted-foreground">Tocar aviso de radar tático quando um membro entrar online</p>
            </div>
            <Switch
              checked={formData.onlineAlertEnabled}
              onCheckedChange={(checked) => handleChange("onlineAlertEnabled", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Volume Control */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Volume Mestre do Efeito Sonoro ({formData.soundVolume || 60}%)</Label>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                Web Audio Synth
              </Badge>
            </div>
            <Slider
              value={[formData.soundVolume ?? 60]}
              onValueChange={(val) => handleChange("soundVolume", val[0] ?? 60)}
              min={0}
              max={100}
              step={5}
              disabled={!canEdit}
              className="py-1"
            />
          </div>

          {/* Audio Test Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestOperationSound}
              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Testar Som de Operação
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestOnlineAlertSound}
              className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Testar Alerta de Membro Online
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Avisos & Comunicados</CardTitle>
              <CardDescription className="text-[0.7rem]">Banners e retenção de avisos do grupo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Exibir Banner de Avisos no topo do Dashboard</p>
              <p className="text-[0.7rem] text-muted-foreground">Exibe comunicados em destaque na tela inicial</p>
            </div>
            <Switch
              checked={formData.showAnnouncementBanner}
              onCheckedChange={(checked) => handleChange("showAnnouncementBanner", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ocultar avisos mais antigos que</Label>
            <Select
              value={String(formData.hideOldAnnouncementsDays)}
              onValueChange={(val) => handleChange("hideOldAnnouncementsDays", Number(val))}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/60 font-bold max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3" className="text-xs">3 dias</SelectItem>
                <SelectItem value="7" className="text-xs">7 dias (Padrão)</SelectItem>
                <SelectItem value="15" className="text-xs">15 dias</SelectItem>
                <SelectItem value="30" className="text-xs">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Appearance Tab Component ─── */
function AppearanceTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="space-y-6">
      <UserAppearanceSettings />
    </div>
  );
}

/* ─── Lives Tab Component ─── */
function LivesTab() {
  const { user } = useAuth();
  const { preferences, updatePreferences, isUpdating } = useUserStreamPreferences();
  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useMemberStreamAccounts();
  const toggleMutation = useToggleStreamAccountActive();
  const unlinkMutation = useUnlinkStreamAccount();

  const [formData, setFormData] = useState({
    notifications_enabled: true,
    sound_enabled: true,
    notify_platforms: ["twitch", "kick", "youtube", "tiktok"] as StreamPlatform[],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormData({
        notifications_enabled: preferences.notifications_enabled !== false,
        sound_enabled: preferences.sound_enabled !== false,
        notify_platforms: preferences.notify_platforms || ["twitch", "kick", "youtube", "tiktok"],
      });
      setHasChanges(false);
    }
  }, [preferences]);

  const handleTogglePlatform = (platform: StreamPlatform) => {
    setFormData((prev) => {
      const exists = prev.notify_platforms.includes(platform);
      const next = exists
        ? prev.notify_platforms.filter((p) => p !== platform)
        : [...prev.notify_platforms, platform];
      const updated = { ...prev, notify_platforms: next };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSavePreferences = () => {
    if (!user?.id) return;
    updatePreferences({
      user_id: user.id,
      ...formData,
    });
    setHasChanges(false);
  };

  const myAccounts = allAccounts.filter((acc) => acc.user_id === user?.id);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            Preferências de Transmissões & Alertas de Lives
            <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-400">
              Ao Vivo
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize quais plataformas e membros dispararão alertas em tempo real na sua tela.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleSavePreferences}
            disabled={!hasChanges || isUpdating}
            className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold"
          >
            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar Preferências
          </Button>
        </div>
      </div>

      {/* Preferências de Alertas */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Alertas & Notificações de Lives</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Controle os disparos em primeiro plano e efeitos sonoros
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Receber Alertas de Membro Ao Vivo</p>
                <p className="text-[0.7rem] text-muted-foreground">Exibe toast e badge no topo do painel</p>
              </div>
              <Switch
                checked={formData.notifications_enabled}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({ ...prev, notifications_enabled: checked }));
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Efeito Sonoro ao Iniciar Live</p>
                <p className="text-[0.7rem] text-muted-foreground">Toca o sinal sonoro imediato</p>
              </div>
              <Switch
                checked={formData.sound_enabled}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({ ...prev, sound_enabled: checked }));
                  setHasChanges(true);
                }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/40">
            <Label className="text-xs font-bold text-foreground">
              Receber Notificações das Seguintes Plataformas:
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
                const p = STREAM_PLATFORMS[pKey];
                const isEnabled = formData.notify_platforms.includes(pKey);

                return (
                  <div
                    key={pKey}
                    onClick={() => handleTogglePlatform(pKey)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      isEnabled
                        ? "bg-secondary/60 border-primary/40 shadow-xs"
                        : "bg-secondary/15 border-border/40 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.brandHex }} />
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleTogglePlatform(pKey)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meus Canais de Streaming */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <Tv className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Meus Canais de Transmissão Vinculados</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Canais que a plataforma monitora para avisar o grupo quando você iniciar live
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setLinkModalOpen(true)}
              className="h-8 text-xs font-bold gap-1.5 bg-gradient-brand text-primary-foreground shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Vincular Canal
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : myAccounts.length === 0 ? (
            <div className="py-8 text-center space-y-2 rounded-xl border border-dashed border-border/60 bg-muted/10">
              <p className="text-xs font-semibold text-foreground">Você ainda não vinculou nenhum canal de live</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Conecte sua conta da Twitch, Kick, YouTube ou TikTok para que seus companheiros de grupo saibam sempre que você estiver transmitindo.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkModalOpen(true)}
                className="text-xs font-bold gap-1 mt-2"
              >
                <Plus className="h-3 w-3" />
                Vincular Meu Canal Agora
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myAccounts.map((acc) => {
                const pMeta = STREAM_PLATFORMS[acc.platform] || STREAM_PLATFORMS.twitch;

                return (
                  <div
                    key={acc.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-xs",
                      acc.is_active ? "bg-secondary/30 border-border/80" : "bg-muted/20 border-border/30 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] font-mono font-bold uppercase py-0", pMeta.badgeBg, pMeta.badgeColor, pMeta.borderColor)}
                      >
                        {pMeta.name}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">@{acc.channel_name}</p>
                        <a
                          href={acc.channel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono truncate"
                        >
                          {acc.channel_url} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 rounded-lg",
                          acc.is_active ? "text-emerald-400 hover:text-amber-400" : "text-muted-foreground hover:text-emerald-400"
                        )}
                        onClick={() => toggleMutation.mutate({ accountId: acc.id, isActive: !acc.is_active })}
                        title={acc.is_active ? "Pausar verificação automática" : "Ativar verificação automática"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                        onClick={() => unlinkMutation.mutate(acc.id)}
                        title="Remover canal vinculado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkStreamAccountModal open={linkModalOpen} onOpenChange={setLinkModalOpen} />
    </div>
  );
}

class MenuTabErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
  override state = { hasError: false, errorMsg: "" };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }

  override componentDidCatch(error: any, errorInfo: any) {
    console.error("Error rendering MenuTab:", error, errorInfo);
    try {
      localStorage.removeItem("tw_menu_config");
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <p className="text-sm font-bold">Ocorreu um erro ao carregar as configurações do menu.</p>
          <p className="text-xs text-muted-foreground">Suas configurações de menu foram restauradas para o padrão para evitar falhas.</p>
          <div className="text-left bg-black/50 p-3 rounded-lg overflow-auto max-h-32 text-[10px] font-mono text-red-400">
            {this.state.errorMsg}
          </div>
          <Button
            size="sm"
            onClick={() => {
              try {
                localStorage.removeItem("tw_menu_config");
              } catch {}
              window.location.reload();
            }}
            className="text-xs bg-gradient-brand text-primary-foreground font-bold"
          >
            Restaurar e Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Main settings page ─── */
export function ConfiguracoesPage() {
  const { level, hasPermission } = useAuth();

  // Allow editing for leaders, co-leaders, managers, officers, developers, or anyone with role/permission management permissions
  const isLeaderOrAdmin =
    level === "desenvolvedor" ||
    level === "01" ||
    level === "02" ||
    level === "gerente";

  const canManagePlatform =
    isLeaderOrAdmin ||
    hasPermission("manage_permissions") ||
    hasPermission("manage_roles") ||
    hasPermission("manage_platform_settings");

  const canManageMenu =
    isLeaderOrAdmin ||
    hasPermission("manage_permissions") ||
    hasPermission("manage_roles") ||
    hasPermission("manage_menu_settings");

  const canAccess = canManagePlatform || canManageMenu;

  // Sincronização da aba ativa com a URL (?tab=plataforma | menu | notificacoes | lives | aparencia | perfil)
  const [activeTab, setActiveTab] = useUrlTab<"plataforma" | "menu" | "notificacoes" | "lives" | "aparencia" | "perfil">(
    "plataforma",
    {
      paramName: "tab",
      allowedTabs: ["plataforma", "menu", "notificacoes", "lives", "aparencia", "perfil"],
    }
  );

  if (!canAccess) return <NoAccess />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Configurações"
        description="Painel completo de controle da plataforma, parâmetros operacionais e personalização do menu."
      />

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <TabsList className="bg-secondary/60 border border-border/50 p-1 rounded-xl inline-flex w-full sm:w-auto min-w-max gap-1">
            <TabsTrigger
              value="plataforma"
              className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
            >
              <Monitor className="h-3.5 w-3.5" />
              Plataforma
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
            >
              <Menu className="h-3.5 w-3.5" />
              Menu Lateral
            </TabsTrigger>
            <TabsTrigger
              value="notificacoes"
              className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
            >
              <Bell className="h-3.5 w-3.5" />
              Notificações
            </TabsTrigger>
            <TabsTrigger
              value="lives"
              className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
            >
              <Radio className="h-3.5 w-3.5 text-rose-400" />
              Lives & Alertas
            </TabsTrigger>
            <TabsTrigger
              value="perfil"
              className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
            >
              <User className="h-3.5 w-3.5 text-primary" />
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger
              value="aparencia"
              className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
            >
              <Palette className="h-3.5 w-3.5" />
              Aparência
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plataforma">
          <PlatformTab canEdit={canManagePlatform} />
        </TabsContent>

        <TabsContent value="menu">
          <MenuTabErrorBoundary>
            <MenuTab canEdit={canManageMenu} />
          </MenuTabErrorBoundary>
        </TabsContent>

        <TabsContent value="notificacoes">
          <NotificationsTab canEdit={canManagePlatform} />
        </TabsContent>

        <TabsContent value="lives">
          <LivesTab />
        </TabsContent>

        <TabsContent value="perfil">
          <PublicProfileCustomizer />
        </TabsContent>

        <TabsContent value="aparencia">
          <AppearanceTab canEdit={canManagePlatform} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
