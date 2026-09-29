import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Code2,
  Terminal,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Bug,
  Bell,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Bot,
  Settings,
  AlertTriangle,
  Play,
  Eye,
  ExternalLink,
  Palette,
  Crown,
  Check,
  Users,
  Sparkles,
  Layers,
  Search,
  Globe,
  Building2,
  LayoutTemplate,
  FileText,
  Copy,
  HelpCircle,
  Info,
  UploadCloud,
  Image as ImageIcon,
  Radio,
  Tv,
  Instagram,
  Share2,
  Clock,
  MapPin,
  MessageSquareQuote,
  ShieldAlert,
  Trash2,
  Camera,
  Compass,
  Send,
  Megaphone,
  ScrollText,
  Bookmark,
  Link2,
  Square,
  PlusCircle,
  Sliders,
  History,
} from "lucide-react";
import { DevMaintenanceManagerModal } from "@/components/maintenance/DevMaintenanceManagerModal";
import {
  PANEL_COLOR_STYLES,
  type PanelColor,
  type PanelColorType,
  getPanelColorStyle,
  PANEL_ICONS_CATALOG,
  resolvePanelIcon,
} from "@/lib/panelTheme";
import { reportAppError } from "@/lib/app-error-reporting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { cn } from "@/lib/utils";
import {
  getDevConfiguration,
  saveDevConfiguration,
  DEFAULT_DEV_CONFIG,
  DEV_CONFIG_KEY,
  DEV_CONFIG_EVENT,
  type DevConfiguration,
} from "@/services/devService";
import { getProxiedImageUrl } from "@/services/postimagesService";
import { DevForcePurgeCard } from "@/components/dev/DevForcePurgeCard";
import { DevAuditLogModal } from "@/components/dev/DevAuditLogModal";
import { useAuditLogs } from "@/hooks/useData";
import { logAuditAction } from "@/lib/app-api";
import {
  usePlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
  type PlatformSettings,
} from "@/hooks/usePlatformSettings";

export const Route = createFileRoute("/_authenticated/dev/configuracao")({
  component: DevConfiguracaoPageWrapper,
});

function DevConfiguracaoPageWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return (
    <DeveloperGuard>
      <DevConfiguracaoContent />
    </DeveloperGuard>
  );
}

export function DevConfiguracaoContent() {
  const { user, profile, level } = useAuth();
  const queryClient = useQueryClient();
  const { data: allAuditLogs = [] } = useAuditLogs();

  const [config, setConfig] = useState<DevConfiguration>(DEFAULT_DEV_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DevConfiguration>(DEFAULT_DEV_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona automaticamente se acessar abas de bot que foram migradas para /dev/bot
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab === "bot-manage" || tab === "webhooks" || tab === "discord-logs") {
        window.location.replace(`/dev/bot/${tab}`);
      } else if (tab === "lives") {
        window.location.replace("/dev/configuracao");
      }
    }
  }, []);

  // Estados para Auditoria de Ações Dev
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [triggeringTestLog, setTriggeringTestLog] = useState(false);

  // Filtra logs do contexto dev
  const devLogs = useMemo(() => {
    return allAuditLogs.filter((l) => {
      return (
        l.is_dev_action ||
        Boolean((l.new_data as any)?._meta?.is_dev_action) ||
        String(l.action || "").startsWith("dev_") ||
        String(l.action || "").includes("dev") ||
        String(l.entity || "").startsWith("dev_") ||
        String(l.entity || "").includes("dev")
      );
    });
  }, [allAuditLogs]);

  // Estados para Informações da Plataforma e Edição do Rodapé
  const {
    settings: remotePlatformSettings,
    save: savePlatformSettingsHook,
    startMaintenance: startMaintenanceHook,
    finishMaintenance: finishMaintenanceHook,
    extendMaintenance: extendMaintenanceHook,
    resetMaintenance: resetMaintenanceHook,
  } = usePlatformSettings();
  const [platformForm, setPlatformForm] = useState<PlatformSettings>(remotePlatformSettings);
  const [initialPlatformForm, setInitialPlatformForm] = useState<PlatformSettings>(remotePlatformSettings);
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  useEffect(() => {
    setPlatformForm(remotePlatformSettings);
    setInitialPlatformForm(remotePlatformSettings);
  }, [remotePlatformSettings]);

  const updatePlatformField = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setPlatformForm((prev) => ({ ...prev, [key]: value }));
  };

  // Estados e Refs para Upload de Mídia com Postimages (Logo, Banner, Favicon)
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);

  const [platformActiveSubTab, setPlatformActiveSubTab] = useState("identidade");

  const handleUploadPlatformMedia = async (
    file: File,
    field: "platformLogoUrl" | "platformBannerUrl" | "platformFaviconUrl"
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG ou GIF).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("O tamanho da imagem não pode ultrapassar 15MB.");
      return;
    }

    if (field === "platformLogoUrl") setUploadingLogo(true);
    else if (field === "platformBannerUrl") setUploadingBanner(true);
    else setUploadingFavicon(true);

    try {
      const { uploadImageToPostimages } = await import("@/services/postimagesService");
      const maxDim = field === "platformBannerUrl" ? 1920 : field === "platformLogoUrl" ? 1024 : 256;
      const cdnUrl = await uploadImageToPostimages(file, {
        filename: `${field}_${Date.now()}`,
        maxDimension: maxDim,
        quality: 0.9,
      });

      updatePlatformField(field, cdnUrl);
      toast.success(
        field === "platformLogoUrl"
          ? "Logo oficial enviada com sucesso para a CDN Postimages!"
          : field === "platformBannerUrl"
          ? "Banner oficial enviado com sucesso para a CDN Postimages!"
          : "Favicon oficial enviado com sucesso!",
        {
          description: "A imagem foi carregada na nuvem. Clique em 'Salvar Informações da Plataforma' para consolidar.",
          icon: "🚀",
        }
      );
    } catch (err: any) {
      toast.error("Erro no upload da imagem: " + (err?.message || "Erro desconhecido"));
    } finally {
      if (field === "platformLogoUrl") setUploadingLogo(false);
      else if (field === "platformBannerUrl") setUploadingBanner(false);
      else setUploadingFavicon(false);
    }
  };

  // Carrega as configurações exclusivas do Módulo Dev ao inicializar
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getDevConfiguration(user, profile, level)
      .then((data) => {
        if (isMounted) {
          setConfig(data);
          setInitialConfig(JSON.parse(JSON.stringify(data)));
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err?.message || "Erro 403: Falha ao carregar configurações do Módulo Dev.";
          setError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, profile, level]);

  // Detecta se existem alterações pendentes não salvas
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  // Handler para alternar switches individuais
  const handleToggle = (key: keyof DevConfiguration) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handler imediato para trocar a cor de um painel específico
  const handleSelectPanelColor = (
    key: "devThemeColor" | "ceoThemeColor" | "memberThemeColor",
    color: PanelColor
  ) => {
    const updated: DevConfiguration = {
      ...config,
      [key]: color,
    };
    setConfig(updated);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: updated }));
      }
      const label = PANEL_COLOR_STYLES[color]?.label || color;
      const panelName =
        key === "devThemeColor" ? "Painel Dev" : key === "ceoThemeColor" ? "Painel CEO" : "Painel Membro";
      toast.success(`${panelName}: Cor atualizada para ${label}!`, {
        description: "Todas as categorias, ícones e itens do painel agora utilizam esta cor.",
      });
    } catch (e) {
      console.error("Falha ao salvar tema localmente:", e);
    }
  };

  // Handler imediato para trocar o ícone oficial de um painel específico
  const handleSelectPanelIcon = (
    key: "devPanelIcon" | "ceoPanelIcon" | "memberPanelIcon",
    iconName: string
  ) => {
    const updated: DevConfiguration = {
      ...config,
      [key]: iconName,
    };
    setConfig(updated);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: updated }));
      }
      const panelName =
        key === "devPanelIcon" ? "Painel Dev" : key === "ceoPanelIcon" ? "Painel CEO" : "Painel Membro";
      toast.success(`${panelName}: Ícone oficial alterado para "${iconName}"!`, {
        description: "Os botões de alternância de painel, menus e badges agora utilizam este ícone.",
        icon: "🎨",
      });
    } catch (e) {
      console.error("Falha ao salvar ícone localmente:", e);
    }
  };

  // Handler para aplicar uma única cor a TODOS os painéis (Dev, CEO e Membro)
  const handleApplyToAllPanels = (color: PanelColor) => {
    const updated: DevConfiguration = {
      ...config,
      devThemeColor: color,
      ceoThemeColor: color,
      memberThemeColor: color,
    };
    setConfig(updated);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: updated }));
      }
      const label = PANEL_COLOR_STYLES[color]?.label || color;
      toast.success(`Cor "${label}" aplicada a TODOS os painéis com sucesso!`, {
        description: "Painel Dev, Painel CEO e Painel Membro agora usam a mesma identidade visual.",
        icon: "✨",
      });
    } catch (e) {
      console.error("Falha ao salvar tema globalmente:", e);
    }
  };

  // Disparo manual de log de teste para validação imediata da Auditoria Dev
  const handleTriggerTestLog = async () => {
    setTriggeringTestLog(true);
    try {
      const wasRecorded = await logAuditAction(
        "test_dev_action",
        "dev_configuration",
        {
          setting: "devAuditLogs",
          status: config.devAuditLogs ? "enabled" : "disabled",
          triggered_by: user?.email || profile?.nome || "Desenvolvedor",
          timestamp: new Date().toISOString(),
        }
      );

      await queryClient.invalidateQueries({ queryKey: ["audit_logs"] });

      if (wasRecorded) {
        toast.success("Log de Teste Dev registrado com sucesso no servidor!", {
          description: "O evento foi salvo no banco com tag dev e metadados completos.",
          icon: "💻",
        });
      } else {
        toast.info("Gravação de Ações Dev suprimida.", {
          description: "A opção 'Registrar Ações Dev no Servidor' está desativada. O log foi descartado conforme configurado.",
          icon: "🛡️",
        });
      }
    } catch (err: any) {
      toast.error("Falha ao registrar log de teste: " + (err?.message || "Erro desconhecido"));
    } finally {
      setTriggeringTestLog(false);
    }
  };

  // Handler para salvar as alterações permanentemente no Supabase
  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);

    try {
      await saveDevConfiguration(config, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("Configurações do Módulo Dev salvas com sucesso no servidor!", {
        icon: "💻",
      });

      // Grava log de auditoria técnica da alteração
      void logAuditAction(
        "save_dev_configuration",
        "dev_configuration",
        { ...config },
        { ...initialConfig }
      );
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    } catch (err: any) {
      const msg = err?.message || "Falha ao salvar configurações do Módulo Dev.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Handler para salvar Informações Gerais da Plataforma
  const handleSavePlatformInfo = async () => {
    setSavingPlatform(true);
    try {
      await savePlatformSettingsHook(platformForm);
      setInitialPlatformForm(platformForm);
      toast.success("Informações da Plataforma salvas com sucesso!", {
        description: "Os dados foram sincronizados no banco de dados para todos os usuários.",
        icon: "🌐",
      });
      void logAuditAction(
        "update_platform_info",
        "platform_settings",
        {
          factionName: platformForm.factionName,
          factionTag: platformForm.factionTag,
          slogan: platformForm.slogan,
          cityRpName: platformForm.cityRpName,
          systemVersion: platformForm.systemVersion,
        },
        {
          factionName: initialPlatformForm.factionName,
          factionTag: initialPlatformForm.factionTag,
          slogan: initialPlatformForm.slogan,
          cityRpName: initialPlatformForm.cityRpName,
          systemVersion: initialPlatformForm.systemVersion,
        }
      );
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    } catch (err: any) {
      toast.error("Falha ao salvar informações da plataforma: " + (err?.message || "Erro desconhecido"));
    } finally {
      setSavingPlatform(false);
    }
  };

  // Handler para salvar Edição Completa do Rodapé
  const handleSaveFooterInfo = async () => {
    setSavingFooter(true);
    try {
      await savePlatformSettingsHook(platformForm);
      setInitialPlatformForm(platformForm);
      toast.success("Configurações do Rodapé salvas com sucesso!", {
        description: "O novo rodapé já está ativo em todas as páginas da plataforma.",
        icon: "✨",
      });
      void logAuditAction(
        "update_footer_settings",
        "platform_settings",
        {
          footerFactionText: platformForm.footerFactionText,
          footerDeveloperName: platformForm.footerDeveloperName,
          footerDeveloperDiscord: platformForm.footerDeveloperDiscord,
          footerDeveloperRole: platformForm.footerDeveloperRole,
          footerShowDeveloperCredits: platformForm.footerShowDeveloperCredits,
        },
        {
          footerFactionText: initialPlatformForm.footerFactionText,
          footerDeveloperName: initialPlatformForm.footerDeveloperName,
          footerDeveloperDiscord: initialPlatformForm.footerDeveloperDiscord,
          footerDeveloperRole: initialPlatformForm.footerDeveloperRole,
          footerShowDeveloperCredits: initialPlatformForm.footerShowDeveloperCredits,
        }
      );
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    } catch (err: any) {
      toast.error("Falha ao salvar configurações do rodapé: " + (err?.message || "Erro desconhecido"));
    } finally {
      setSavingFooter(false);
    }
  };

  // Handler para restaurar padrões das Informações da Plataforma
  const handleResetPlatformDefaults = () => {
    setPlatformForm((prev) => ({
      ...prev,
      factionName: DEFAULT_PLATFORM_SETTINGS.factionName,
      factionTag: DEFAULT_PLATFORM_SETTINGS.factionTag,
      slogan: DEFAULT_PLATFORM_SETTINGS.slogan,
      factionType: DEFAULT_PLATFORM_SETTINGS.factionType,
      cityRpName: DEFAULT_PLATFORM_SETTINGS.cityRpName,
      cityRpTag: DEFAULT_PLATFORM_SETTINGS.cityRpTag,
      fivemConnectUrl: DEFAULT_PLATFORM_SETTINGS.fivemConnectUrl,
      factionCode: DEFAULT_PLATFORM_SETTINGS.factionCode,
      systemVersion: DEFAULT_PLATFORM_SETTINGS.systemVersion,
      platformLogoUrl: DEFAULT_PLATFORM_SETTINGS.platformLogoUrl,
      platformBannerUrl: DEFAULT_PLATFORM_SETTINGS.platformBannerUrl,
      platformFaviconUrl: DEFAULT_PLATFORM_SETTINGS.platformFaviconUrl,
      supportDiscordUrl: DEFAULT_PLATFORM_SETTINGS.supportDiscordUrl,
      factionDiscordUrl: DEFAULT_PLATFORM_SETTINGS.factionDiscordUrl,
      radioFrequency: DEFAULT_PLATFORM_SETTINGS.radioFrequency,
      contactEmail: DEFAULT_PLATFORM_SETTINGS.contactEmail,
      instagramHandle: DEFAULT_PLATFORM_SETTINGS.instagramHandle,
      tiktokHandle: DEFAULT_PLATFORM_SETTINGS.tiktokHandle,
      recruitmentFormUrl: DEFAULT_PLATFORM_SETTINGS.recruitmentFormUrl,
      operatingHours: DEFAULT_PLATFORM_SETTINGS.operatingHours,
      headquartersLocation: DEFAULT_PLATFORM_SETTINGS.headquartersLocation,
      minRecruitAge: DEFAULT_PLATFORM_SETTINGS.minRecruitAge,
      minCityTime: DEFAULT_PLATFORM_SETTINGS.minCityTime,
      defaultNewRole: DEFAULT_PLATFORM_SETTINGS.defaultNewRole,
      weeklyGoalHours: DEFAULT_PLATFORM_SETTINGS.weeklyGoalHours,
      weeklyGoalFarm: DEFAULT_PLATFORM_SETTINGS.weeklyGoalFarm,
      motd: DEFAULT_PLATFORM_SETTINGS.motd,
      welcomeMessage: DEFAULT_PLATFORM_SETTINGS.welcomeMessage,
      motto: DEFAULT_PLATFORM_SETTINGS.motto,
      rulesSummary: DEFAULT_PLATFORM_SETTINGS.rulesSummary,
      description: DEFAULT_PLATFORM_SETTINGS.description,
      showSystemStatusNotice: DEFAULT_PLATFORM_SETTINGS.showSystemStatusNotice,
      systemStatusNotice: DEFAULT_PLATFORM_SETTINGS.systemStatusNotice,
      systemStatusType: DEFAULT_PLATFORM_SETTINGS.systemStatusType,
    }));
    toast.info("Valores padrão da plataforma restaurados no formulário. Clique em Salvar para aplicar.");
  };

  // Handler para restaurar padrões do Rodapé
  const handleResetFooterDefaults = () => {
    setPlatformForm((prev) => ({
      ...prev,
      footerFactionText: DEFAULT_PLATFORM_SETTINGS.footerFactionText,
      footerDeveloperName: DEFAULT_PLATFORM_SETTINGS.footerDeveloperName,
      footerDeveloperDiscord: DEFAULT_PLATFORM_SETTINGS.footerDeveloperDiscord,
      footerDeveloperRole: DEFAULT_PLATFORM_SETTINGS.footerDeveloperRole,
      footerCustomNote: DEFAULT_PLATFORM_SETTINGS.footerCustomNote,
      footerCopyrightText: DEFAULT_PLATFORM_SETTINGS.footerCopyrightText,
      footerShowYear: DEFAULT_PLATFORM_SETTINGS.footerShowYear,
      footerShowDeveloperCredits: DEFAULT_PLATFORM_SETTINGS.footerShowDeveloperCredits,
      footerShowDiscordCopy: DEFAULT_PLATFORM_SETTINGS.footerShowDiscordCopy,
      footerShowSupportLink: DEFAULT_PLATFORM_SETTINGS.footerShowSupportLink,
      footerShowVersion: DEFAULT_PLATFORM_SETTINGS.footerShowVersion,
    }));
    toast.info("Valores padrão do rodapé restaurados no formulário. Clique em Salvar para aplicar.");
  };

  // Handler para restaurar os padrões dev
  const handleResetDefaults = () => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_DEV_CONFIG));
    setConfig(defaults);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(defaults));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: defaults }));
      }
    } catch {}
    toast.info("Configurações e cores restauradas para os padrões oficiais.");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dev → Configuração"
          description="Ajustes exclusivos para desenvolvedores, controle de recursos experimentais, identidade visual dos painéis e auditoria."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={loading || saving}
            className="h-9 text-xs gap-1.5 font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrões
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
            className={cn(
              "h-9 text-xs gap-1.5 font-bold shadow-sm transition-all duration-200",
              hasChanges
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de Auditoria de Ações Dev */}
      <DevAuditLogModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        logs={devLogs}
        onTriggerTestLog={handleTriggerTestLog}
        triggeringTestLog={triggeringTestLog}
      />

      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center space-y-3 border-dashed">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Carregando configurações do Módulo Dev...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 border-rose-500/30 bg-rose-500/5 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Acesso Negado ou Erro de Inicialização</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* BANNER INFORMATIVO: CENTRAL UNIFICADA DO BOT */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  Central Unificada do Bot Discord
                  <Badge variant="outline" className="text-[10px] bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                    Unificado em /dev/bot
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  As abas <strong>Gerenciar Bot</strong>, <strong>Webhooks Discord</strong> e <strong>Canais & Logs</strong> foram unificadas na página dedicada do <strong>Bot</strong> junto ao Studio & Builder.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shrink-0">
              <Link to="/dev/bot">
                Acessar Central do Bot
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {/* Card de Limpeza Forçada de Cache em Tempo Real */}
          <DevForcePurgeCard />

          {/* Inputs invisíveis para upload de imagem via Postimages API */}
          <input
            type="file"
            ref={logoInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUploadPlatformMedia(file, "platformLogoUrl");
              e.target.value = "";
            }}
          />
          <input
            type="file"
            ref={bannerInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUploadPlatformMedia(file, "platformBannerUrl");
              e.target.value = "";
            }}
          />
          <input
            type="file"
            ref={faviconInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/x-icon"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUploadPlatformMedia(file, "platformFaviconUrl");
              e.target.value = "";
            }}
          />

          {/* CARD 1: INFORMAÇÕES GERAIS DA PLATAFORMA (EXPANDIDO COM TABS E UPLOAD POSTIMAGES) */}
          <Card className="surface-card border transition-all duration-300">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">
                      Informações Gerais & Identidade da Plataforma
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gerencie a identidade visual completa (Upload Postimages), dados da facção, servidor GTA RP FiveM, frequências, expediente e comunicados globais.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-400 bg-sky-500/5">
                    Postimages API Integrada
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                    Sincronização Supabase
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {/* SUB-TABS INTERNAS DE CONFIGURAÇÕES DA PLATAFORMA */}
              <Tabs
                value={platformActiveSubTab}
                onValueChange={setPlatformActiveSubTab}
                className="w-full space-y-5"
              >
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 bg-secondary/40 p-1 rounded-xl border border-border/60 h-auto">
                  <TabsTrigger
                    value="identidade"
                    className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Identidade & RP</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="midia"
                    className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Logo & Banner</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="comunicacao"
                    className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>Comunicação & Redes</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="operacao"
                    className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Expediente & Regras</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="comunicados"
                    className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white col-span-2 sm:col-span-1"
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    <span>Avisos & MOTD</span>
                  </TabsTrigger>
                </TabsList>

                {/* ABA 1: IDENTIDADE & SERVIDOR GTA RP */}
                <TabsContent value="identidade" className="space-y-4 m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nome da Facção */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-factionName" className="text-xs font-bold text-foreground">
                        Nome da Organização / Facção *
                      </Label>
                      <Input
                        id="plat-factionName"
                        value={platformForm.factionName || ""}
                        onChange={(e) => updatePlatformField("factionName", e.target.value)}
                        placeholder="Ex: Twin Wheels"
                        className="h-9 text-xs rounded-xl font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground">Exibido na barra superior, menus e títulos.</p>
                    </div>

                    {/* Tag da Facção */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-factionTag" className="text-xs font-bold text-foreground">
                        Tag / Sigla Oficial *
                      </Label>
                      <Input
                        id="plat-factionTag"
                        value={platformForm.factionTag || ""}
                        onChange={(e) => updatePlatformField("factionTag", e.target.value)}
                        placeholder="Ex: [TW]"
                        className="h-9 text-xs rounded-xl font-mono font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground">Prefixo oficial da organização.</p>
                    </div>

                    {/* Slogan */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-slogan" className="text-xs font-bold text-foreground">
                        Slogan / Subtítulo Institucional
                      </Label>
                      <Input
                        id="plat-slogan"
                        value={platformForm.slogan || ""}
                        onChange={(e) => updatePlatformField("slogan", e.target.value)}
                        placeholder="Ex: Gestão Interna · GTA RP"
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Frase curta ao lado do nome na barra de topo.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Segmento / Ramo de Atuação */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-factionType" className="text-xs font-bold text-foreground">
                        Segmento / Ramo de Atuação
                      </Label>
                      <Input
                        id="plat-factionType"
                        value={platformForm.factionType || ""}
                        onChange={(e) => updatePlatformField("factionType", e.target.value)}
                        placeholder="Ex: Oficina Mecânica & Preparação"
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Área de atuação e foco no RP.</p>
                    </div>

                    {/* Cidade / Servidor RP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-cityRpName" className="text-xs font-bold text-foreground">
                        Cidade / Servidor RP
                      </Label>
                      <Input
                        id="plat-cityRpName"
                        value={platformForm.cityRpName || ""}
                        onChange={(e) => updatePlatformField("cityRpName", e.target.value)}
                        placeholder="Ex: Los Santos RP / Complexo"
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Servidor FiveM onde a facção opera.</p>
                    </div>

                    {/* Sigla da Cidade RP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-cityRpTag" className="text-xs font-bold text-foreground">
                        Sigla da Cidade RP
                      </Label>
                      <Input
                        id="plat-cityRpTag"
                        value={platformForm.cityRpTag || ""}
                        onChange={(e) => updatePlatformField("cityRpTag", e.target.value)}
                        placeholder="Ex: CPX / CDA / LSRP"
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">Sigla compacta para relatórios e títulos.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Comando Connect FiveM */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-fivemConnectUrl" className="text-xs font-bold text-foreground">
                        Comando / Link FiveM Connect
                      </Label>
                      <Input
                        id="plat-fivemConnectUrl"
                        value={platformForm.fivemConnectUrl || ""}
                        onChange={(e) => updatePlatformField("fivemConnectUrl", e.target.value)}
                        placeholder="Ex: connect cpx.rp ou cfx.re/join/..."
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">Instrução para os membros entrarem na cidade.</p>
                    </div>

                    {/* Código / ID da Facção */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-factionCode" className="text-xs font-bold text-foreground">
                        Código / ID da Facção no Servidor
                      </Label>
                      <Input
                        id="plat-factionCode"
                        value={platformForm.factionCode || ""}
                        onChange={(e) => updatePlatformField("factionCode", e.target.value)}
                        placeholder="Ex: FAC-TW01 / Setor 4"
                        className="h-9 text-xs rounded-xl font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">Identificador oficial no servidor RP.</p>
                    </div>

                    {/* Versão do Sistema */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-systemVersion" className="text-xs font-bold text-foreground">
                        Versão da Plataforma
                      </Label>
                      <Input
                        id="plat-systemVersion"
                        value={platformForm.systemVersion || ""}
                        onChange={(e) => updatePlatformField("systemVersion", e.target.value)}
                        placeholder="Ex: v2.5.0"
                        className="h-9 text-xs rounded-xl font-mono font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground">Exibida em badges e rodapé.</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 2: LOGO, BANNER & MÍDIA (UPLOAD VIA POSTIMAGES) */}
                <TabsContent value="midia" className="space-y-6 m-0 focus-visible:outline-none">
                  {/* SEÇÃO 1: LOGO OFICIAL COM UPLOAD POSTIMAGES */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-secondary/20 border border-border/70 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-sky-400" />
                          Logo Oficial da Plataforma
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Exibida no topo da barra lateral, cabeçalho de login e documentos oficiais.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updatePlatformField("platformLogoUrl", "/logo.png")}
                          className="h-7 text-[11px] font-bold gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Padrão TW
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="h-7 text-[11px] font-bold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5" />
                              Upload com Postimages
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-5">
                      {/* Dropzone / Preview da Logo */}
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) void handleUploadPlatformMedia(file, "platformLogoUrl");
                        }}
                        className={cn(
                          "w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2 relative group cursor-pointer transition-all shrink-0 bg-background/80 shadow-md",
                          isDraggingLogo
                            ? "border-sky-500 bg-sky-500/10 ring-4 ring-sky-500/20 scale-105"
                            : "border-border/80 hover:border-sky-500/70 hover:bg-secondary/40"
                        )}
                        title="Clique ou arraste um arquivo para fazer upload da Logo via Postimages CDN"
                      >
                        {uploadingLogo ? (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                            <Loader2 className="h-7 w-7 text-sky-400 animate-spin" />
                            <span className="text-[10px] font-bold text-sky-300">Enviando CDN...</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={getProxiedImageUrl(platformForm.platformLogoUrl) || "/logo.png"}
                              alt="Logo Oficial da Plataforma"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/logo.png";
                              }}
                              className="w-full h-full object-contain rounded-xl transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-1 text-center">
                              <UploadCloud className="h-5 w-5 text-sky-300" />
                              <span className="text-[9.5px] font-black leading-tight">Trocar Logo (Postimages)</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Campo de URL Manual & Orientações */}
                      <div className="flex-1 w-full space-y-3 min-w-0">
                        <div className="space-y-1.5">
                          <Label htmlFor="plat-logoUrl" className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span>Link Direto da Imagem (CDN Postimages)</span>
                            {platformForm.platformLogoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(platformForm.platformLogoUrl || "");
                                  toast.success("Link da Logo copiado!");
                                }}
                                className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copiar Link
                              </button>
                            )}
                          </Label>
                          <Input
                            id="plat-logoUrl"
                            value={platformForm.platformLogoUrl || ""}
                            onChange={(e) => updatePlatformField("platformLogoUrl", e.target.value)}
                            placeholder="https://i.postimg.cc/.../logo.png"
                            className="h-9 text-xs rounded-xl font-mono bg-background/80"
                          />
                        </div>
                        <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                          <span>
                            Dica: Arraste e solte o arquivo da logo diretamente sobre o quadro ao lado ou clique para selecionar. O arquivo será otimizado e hospedado na CDN Postimages com velocidade global.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: BANNER OFICIAL COM UPLOAD POSTIMAGES */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-secondary/20 border border-border/70 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                          <Tv className="h-4 w-4 text-purple-400" />
                          Banner Oficial da Plataforma (Panorâmico)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Exibido na tela de login, páginas de apresentação e comunicados da facção.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {platformForm.platformBannerUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updatePlatformField("platformBannerUrl", "")}
                            className="h-7 text-[11px] font-bold gap-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" /> Limpar Banner
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={uploadingBanner}
                          className="h-7 text-[11px] font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                        >
                          {uploadingBanner ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Enviando Banner...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5" />
                              Upload de Banner (Postimages)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Dropzone Panorâmica do Banner */}
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(true);
                        }}
                        onDragLeave={() => setIsDraggingBanner(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) void handleUploadPlatformMedia(file, "platformBannerUrl");
                        }}
                        className={cn(
                          "w-full h-36 sm:h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative group cursor-pointer transition-all overflow-hidden bg-background/80 shadow-inner",
                          isDraggingBanner
                            ? "border-purple-500 bg-purple-500/10 ring-4 ring-purple-500/20"
                            : "border-border/80 hover:border-purple-500/70"
                        )}
                        title="Clique ou arraste um arquivo panorâmico para fazer upload do Banner via Postimages CDN"
                      >
                        {uploadingBanner ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                            <span className="text-xs font-bold text-purple-300">
                              Otimizando e enviando banner para CDN...
                            </span>
                          </div>
                        ) : platformForm.platformBannerUrl ? (
                          <>
                            <img
                              src={getProxiedImageUrl(platformForm.platformBannerUrl)}
                              alt="Banner Oficial"
                              className="w-full h-full object-cover transition-transform group-hover:scale-102"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                              <UploadCloud className="h-6 w-6 text-purple-300" />
                              <span className="text-xs font-bold">Trocar Banner Oficial (Postimages)</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/70 text-purple-400 group-hover:scale-110 transition-transform">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              Arraste seu Banner aqui ou clique para selecionar
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Formatos aceitos: PNG, JPG, WEBP. Dimensão recomendada: 1920x1080 (16:9).
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="plat-bannerUrl" className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span>Link Direto do Banner</span>
                          {platformForm.platformBannerUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(platformForm.platformBannerUrl || "");
                                toast.success("Link do Banner copiado!");
                              }}
                              className="text-[10px] text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Copiar Link
                            </button>
                          )}
                        </Label>
                        <Input
                          id="plat-bannerUrl"
                          value={platformForm.platformBannerUrl || ""}
                          onChange={(e) => updatePlatformField("platformBannerUrl", e.target.value)}
                          placeholder="https://i.postimg.cc/.../banner.png"
                          className="h-9 text-xs rounded-xl font-mono bg-background/80"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 3: FAVICON DA ABA DO NAVEGADOR */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-secondary/20 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        onClick={() => faviconInputRef.current?.click()}
                        className="w-12 h-12 rounded-xl border border-border/80 bg-background/90 flex items-center justify-center p-1.5 cursor-pointer hover:border-primary transition-all group relative overflow-hidden shrink-0 shadow-xs"
                        title="Upload de Favicon via Postimages"
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <img
                            src={getProxiedImageUrl(platformForm.platformFaviconUrl) || "/favicon.ico"}
                            alt="Favicon"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                            }}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h5 className="text-xs font-bold text-foreground">Ícone Favicon da Aba</h5>
                        <p className="text-[10.5px] text-muted-foreground">
                          Ícone exibido ao lado do título da página na aba do navegador.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        value={platformForm.platformFaviconUrl || ""}
                        onChange={(e) => updatePlatformField("platformFaviconUrl", e.target.value)}
                        placeholder="https://.../favicon.png"
                        className="h-8 text-xs font-mono w-full sm:w-60 bg-background/80"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={uploadingFavicon}
                        className="h-8 text-xs font-bold shrink-0 gap-1"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Upload
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 3: COMUNICAÇÃO, RÁDIO & REDES */}
                <TabsContent value="comunicacao" className="space-y-4 m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Discord da Facção */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-factionDiscordUrl" className="text-xs font-bold text-foreground">
                        Discord da Facção (Convite Oficial)
                      </Label>
                      <Input
                        id="plat-factionDiscordUrl"
                        value={platformForm.factionDiscordUrl || ""}
                        onChange={(e) => updatePlatformField("factionDiscordUrl", e.target.value)}
                        placeholder="https://discord.gg/suafaccao"
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Link permanente do servidor Discord da facção.</p>
                    </div>

                    {/* Discord de Suporte */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-supportDiscordUrl" className="text-xs font-bold text-foreground">
                        Link de Suporte / Ouvidoria
                      </Label>
                      <Input
                        id="plat-supportDiscordUrl"
                        value={platformForm.supportDiscordUrl || ""}
                        onChange={(e) => updatePlatformField("supportDiscordUrl", e.target.value)}
                        placeholder="https://discord.gg/..."
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Canal de suporte ou abertura de tickets.</p>
                    </div>

                    {/* Frequência de Rádio Padrão RP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-radioFrequency" className="text-xs font-bold text-foreground">
                        Frequência de Rádio Oficial RP
                      </Label>
                      <Input
                        id="plat-radioFrequency"
                        value={platformForm.radioFrequency || ""}
                        onChange={(e) => updatePlatformField("radioFrequency", e.target.value)}
                        placeholder="Ex: 98.5 MHz / 112.4"
                        className="h-9 text-xs rounded-xl font-mono font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground">Canal de rádio padrão para ações e patrulhas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Contato Institucional / E-mail */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-contactEmail" className="text-xs font-bold text-foreground">
                        E-mail de Contato
                      </Label>
                      <Input
                        id="plat-contactEmail"
                        value={platformForm.contactEmail || ""}
                        onChange={(e) => updatePlatformField("contactEmail", e.target.value)}
                        placeholder="contato@twinwheels.rp"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Instagram RP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-instagramHandle" className="text-xs font-bold text-foreground">
                        Instagram RP
                      </Label>
                      <Input
                        id="plat-instagramHandle"
                        value={platformForm.instagramHandle || ""}
                        onChange={(e) => updatePlatformField("instagramHandle", e.target.value)}
                        placeholder="@twinwheels.rp"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* TikTok / Mídia */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-tiktokHandle" className="text-xs font-bold text-foreground">
                        TikTok / Mídia RP
                      </Label>
                      <Input
                        id="plat-tiktokHandle"
                        value={platformForm.tiktokHandle || ""}
                        onChange={(e) => updatePlatformField("tiktokHandle", e.target.value)}
                        placeholder="@twinwheels.rp"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Formulário de Recrutamento Externo */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-recruitmentFormUrl" className="text-xs font-bold text-foreground">
                        Link de Recrutamento (Google Forms)
                      </Label>
                      <Input
                        id="plat-recruitmentFormUrl"
                        value={platformForm.recruitmentFormUrl || ""}
                        onChange={(e) => updatePlatformField("recruitmentFormUrl", e.target.value)}
                        placeholder="https://forms.gle/..."
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 4: EXPEDIENTE, REGRAS & METAS */}
                <TabsContent value="operacao" className="space-y-4 m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Horário de Expediente / Ação RP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-operatingHours" className="text-xs font-bold text-foreground">
                        Horário de Expediente / Ação
                      </Label>
                      <Input
                        id="plat-operatingHours"
                        value={platformForm.operatingHours || ""}
                        onChange={(e) => updatePlatformField("operatingHours", e.target.value)}
                        placeholder="Ex: 18:00h às 02:00h"
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Janela de maior atividade da facção.</p>
                    </div>

                    {/* Localização da Base / QG */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-headquartersLocation" className="text-xs font-bold text-foreground">
                        Localização do QG / Base no Mapa
                      </Label>
                      <Input
                        id="plat-headquartersLocation"
                        value={platformForm.headquartersLocation || ""}
                        onChange={(e) => updatePlatformField("headquartersLocation", e.target.value)}
                        placeholder="Ex: Perto do Píer · Setor Sul"
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Ponto de encontro dos integrantes.</p>
                    </div>

                    {/* Idade Mínima RP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-minRecruitAge" className="text-xs font-bold text-foreground">
                        Idade Mínima para Recrutamento
                      </Label>
                      <Input
                        id="plat-minRecruitAge"
                        value={platformForm.minRecruitAge || ""}
                        onChange={(e) => updatePlatformField("minRecruitAge", e.target.value)}
                        placeholder="Ex: 16 anos"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Horas Mínimas de Cidade */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-minCityTime" className="text-xs font-bold text-foreground">
                        Horas de Cidade Exigidas
                      </Label>
                      <Input
                        id="plat-minCityTime"
                        value={platformForm.minCityTime || ""}
                        onChange={(e) => updatePlatformField("minCityTime", e.target.value)}
                        placeholder="Ex: 50 horas de voo"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Cargo Padrão Inicial */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-defaultNewRole" className="text-xs font-bold text-foreground">
                        Cargo Inicial Padrão de Novos Membros
                      </Label>
                      <Input
                        id="plat-defaultNewRole"
                        value={platformForm.defaultNewRole || ""}
                        onChange={(e) => updatePlatformField("defaultNewRole", e.target.value)}
                        placeholder="Ex: Novato / Recruta"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Meta Semanal de Horas */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-weeklyGoalHours" className="text-xs font-bold text-foreground">
                        Meta Semanal Recomendada (Horas)
                      </Label>
                      <Input
                        id="plat-weeklyGoalHours"
                        value={platformForm.weeklyGoalHours || ""}
                        onChange={(e) => updatePlatformField("weeklyGoalHours", e.target.value)}
                        placeholder="Ex: 10h semanais"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Meta Semanal de Insumos / Farm */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-weeklyGoalFarm" className="text-xs font-bold text-foreground">
                        Meta Semanal Recomendada (Farm/Insumos)
                      </Label>
                      <Input
                        id="plat-weeklyGoalFarm"
                        value={platformForm.weeklyGoalFarm || ""}
                        onChange={(e) => updatePlatformField("weeklyGoalFarm", e.target.value)}
                        placeholder="Ex: 100 insumos"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 5: MENSAGENS, MOTD & COMUNICADOS */}
                <TabsContent value="comunicados" className="space-y-4 m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mensagem do Dia (MOTD) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-motd" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-primary" />
                        Mensagem do Dia (MOTD) do Dashboard
                      </Label>
                      <Textarea
                        id="plat-motd"
                        value={platformForm.motd || ""}
                        onChange={(e) => updatePlatformField("motd", e.target.value)}
                        placeholder="Ex: Bora bater as metas da semana e manter o estoque abastecido!"
                        rows={2}
                        className="text-xs rounded-xl resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground">Exibida em destaque na página inicial.</p>
                    </div>

                    {/* Mensagem de Boas-Vindas */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-welcomeMessage" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Mensagem de Boas-Vindas aos Novos Integrantes
                      </Label>
                      <Textarea
                        id="plat-welcomeMessage"
                        value={platformForm.welcomeMessage || ""}
                        onChange={(e) => updatePlatformField("welcomeMessage", e.target.value)}
                        placeholder="Ex: Bem-vindo à facção! Leia as regras e procure a liderança para onboarding."
                        rows={2}
                        className="text-xs rounded-xl resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground">Aviso apresentado no primeiro acesso.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lema Oficial */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-motto" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ScrollText className="w-3.5 h-3.5 text-sky-400" />
                        Lema / Juramento de Lealdade
                      </Label>
                      <Input
                        id="plat-motto"
                        value={platformForm.motto || ""}
                        onChange={(e) => updatePlatformField("motto", e.target.value)}
                        placeholder="Ex: Velocidade, lealdade e precisão em cada curva."
                        className="h-9 text-xs rounded-xl font-medium"
                      />
                    </div>

                    {/* Resumo das Regras */}
                    <div className="space-y-1.5">
                      <Label htmlFor="plat-rulesSummary" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        Código de Conduta / Resumo de Regras
                      </Label>
                      <Input
                        id="plat-rulesSummary"
                        value={platformForm.rulesSummary || ""}
                        onChange={(e) => updatePlatformField("rulesSummary", e.target.value)}
                        placeholder="Ex: Respeito mútuo, prestação de contas dos baús e discrição total."
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* História Completa / Descrição */}
                  <div className="space-y-1.5">
                    <Label htmlFor="plat-description" className="text-xs font-bold text-foreground">
                      História Completa & Propósito da Organização
                    </Label>
                    <Textarea
                      id="plat-description"
                      value={platformForm.description || ""}
                      onChange={(e) => updatePlatformField("description", e.target.value)}
                      placeholder="Descreva as origens da facção, trajetória na cidade e diretrizes operacionais..."
                      rows={3}
                      className="text-xs rounded-xl resize-none"
                    />
                  </div>

                  {/* Central de Manutenção & Alerta Global do Sistema */}
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label htmlFor="maint-switch" className="text-sm font-extrabold text-foreground flex items-center gap-2 cursor-pointer">
                            <Wrench className="h-4 w-4 text-amber-400" />
                            Aviso Global de Sistema / Modo de Manutenção
                          </Label>
                          {platformForm.maintenanceActive || platformForm.showSystemStatusNotice ? (
                            <Badge variant="destructive" className="text-[10px] uppercase font-mono animate-pulse">
                              ● Manutenção Ativa Agora
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] uppercase font-mono text-muted-foreground">
                              Inativa
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Quando ativado, exibe um <strong>popup centralizado com fundo desfocado e contador de tempo estimado</strong>. A plataforma fica restrita para membros comuns e visitantes, enquanto quem possui <strong>Tag Dev</strong> navega normalmente com indicativos visuais no topo e nas bordas.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setMaintenanceModalOpen(true)}
                          className="h-8 text-xs font-bold gap-1.5 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Central Completa & Histórico
                        </Button>

                        <Switch
                          id="maint-switch"
                          checked={Boolean(platformForm.maintenanceActive || platformForm.showSystemStatusNotice)}
                          onCheckedChange={(val) => {
                            updatePlatformField("maintenanceActive", val);
                            updatePlatformField("showSystemStatusNotice", val);
                            if (val && !platformForm.maintenanceStartedAt) {
                              updatePlatformField("maintenanceStartedAt", new Date().toISOString());
                              const d = new Date(Date.now() + (platformForm.maintenanceDurationMinutes || 30) * 60 * 1000);
                              updatePlatformField("maintenanceEstimatedEnd", d.toISOString());
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Controles Rápidos da Manutenção */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label htmlFor="maint-form-title" className="text-xs font-bold text-foreground">
                            Título da Manutenção
                          </Label>
                          <Input
                            id="maint-form-title"
                            value={platformForm.maintenanceTitle || "Manutenção Preventiva de Sistema"}
                            onChange={(e) => updatePlatformField("maintenanceTitle", e.target.value)}
                            placeholder="Ex: Manutenção Preventiva de Sistema"
                            className="h-9 text-xs rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="maint-form-severity" className="text-xs font-bold text-foreground">
                            Gravidade / Tipo de Alerta
                          </Label>
                          <Select
                            value={platformForm.maintenanceSeverity || platformForm.systemStatusType || "warning"}
                            onValueChange={(val: any) => {
                              updatePlatformField("maintenanceSeverity", val);
                              updatePlatformField("systemStatusType", val);
                            }}
                          >
                            <SelectTrigger id="maint-form-severity" className="h-9 text-xs rounded-xl">
                              <SelectValue placeholder="Tipo de Alerta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warning">Aviso / Programada (Amarelo)</SelectItem>
                              <SelectItem value="destructive">Urgente / Crítica (Vermelho)</SelectItem>
                              <SelectItem value="info">Otimização Rápida (Azul)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="maint-form-msg" className="text-xs font-bold text-foreground">
                          Mensagem Explicativa aos Usuários
                        </Label>
                        <Textarea
                          id="maint-form-msg"
                          value={platformForm.maintenanceMessage || platformForm.systemStatusNotice || ""}
                          onChange={(e) => {
                            updatePlatformField("maintenanceMessage", e.target.value);
                            updatePlatformField("systemStatusNotice", e.target.value);
                          }}
                          placeholder="Ex: Estamos aplicando melhorias e otimizações técnicas na infraestrutura. Retornaremos em instantes."
                          rows={2}
                          className="text-xs rounded-xl resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-500/20 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-muted-foreground font-mono">Duração Rápida:</span>
                          {[15, 30, 45, 60, 120].map((mins) => (
                            <Button
                              key={mins}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updatePlatformField("maintenanceDurationMinutes", mins);
                                const d = new Date(Date.now() + mins * 60 * 1000);
                                updatePlatformField("maintenanceEstimatedEnd", d.toISOString());
                                toast.info(`Tempo previsto ajustado para +${mins} minutos.`);
                              }}
                              className="h-7 text-[10px] font-bold px-2 rounded-lg cursor-pointer"
                            >
                              {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                            </Button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {platformForm.maintenanceActive || platformForm.showSystemStatusNotice ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                await finishMaintenanceHook(profile?.nome || "Dev");
                                updatePlatformField("maintenanceActive", false);
                                updatePlatformField("showSystemStatusNotice", false);
                                toast.success("Manutenção finalizada com sucesso!");
                              }}
                              className="h-7 text-xs font-bold gap-1 cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5" />
                              Finalizar Agora
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={async () => {
                                updatePlatformField("maintenanceActive", true);
                                updatePlatformField("showSystemStatusNotice", true);
                                await startMaintenanceHook({
                                  title: platformForm.maintenanceTitle || "Manutenção Preventiva de Sistema",
                                  message: platformForm.maintenanceMessage || "Estamos realizando atualizações técnicas na infraestrutura.",
                                  durationMinutes: platformForm.maintenanceDurationMinutes || 30,
                                  severity: platformForm.maintenanceSeverity || "warning",
                                  authorName: profile?.nome || "Dev",
                                });
                                toast.success("Manutenção iniciada com sucesso!");
                              }}
                              className="h-7 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-black" />
                              Iniciar Manutenção Agora
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Botões de Ação para Informações da Plataforma */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetPlatformDefaults}
                  className="h-8 text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar Padrões da Plataforma
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSavePlatformInfo}
                  disabled={savingPlatform}
                  className="h-8 text-xs font-bold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-sm cursor-pointer"
                >
                  {savingPlatform ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Salvar Informações da Plataforma
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: CONFIGURAÇÕES E EDIÇÃO DO RODAPÉ DA PLATAFORMA */}
          <Card className="surface-card border transition-all duration-300">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <LayoutTemplate className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">
                      Personalização Completa do Rodapé
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Personalize todos os textos, créditos de desenvolvedor, tag Discord clicável, copyright e notas adicionais visíveis no rodapé da plataforma.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400">
                  Rodapé Oficial
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Texto da Facção no Rodapé */}
                <div className="space-y-1.5">
                  <Label htmlFor="foot-factionText" className="text-xs font-bold text-foreground">
                    Texto Principal da Facção
                  </Label>
                  <Input
                    id="foot-factionText"
                    value={platformForm.footerFactionText || ""}
                    onChange={(e) => updatePlatformField("footerFactionText", e.target.value)}
                    placeholder="Ex: Twin Wheels"
                    className="h-9 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Nome exibido antes do copyright.</p>
                </div>

                {/* Papel / Título do Crédito */}
                <div className="space-y-1.5">
                  <Label htmlFor="foot-devRole" className="text-xs font-bold text-foreground">
                    Frase de Crédito
                  </Label>
                  <Input
                    id="foot-devRole"
                    value={platformForm.footerDeveloperRole || ""}
                    onChange={(e) => updatePlatformField("footerDeveloperRole", e.target.value)}
                    placeholder="Ex: Desenvolvido por"
                    className="h-9 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Texto antes do nome do autor.</p>
                </div>

                {/* Nome do Desenvolvedor */}
                <div className="space-y-1.5">
                  <Label htmlFor="foot-devName" className="text-xs font-bold text-foreground">
                    Nome do Desenvolvedor
                  </Label>
                  <Input
                    id="foot-devName"
                    value={platformForm.footerDeveloperName || ""}
                    onChange={(e) => updatePlatformField("footerDeveloperName", e.target.value)}
                    placeholder="Ex: malaca"
                    className="h-9 text-xs rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Nome ou apelido em destaque.</p>
                </div>

                {/* Tag Discord para Cópia */}
                <div className="space-y-1.5">
                  <Label htmlFor="foot-devDiscord" className="text-xs font-bold text-foreground">
                    Tag do Discord para Cópia
                  </Label>
                  <Input
                    id="foot-devDiscord"
                    value={platformForm.footerDeveloperDiscord || ""}
                    onChange={(e) => updatePlatformField("footerDeveloperDiscord", e.target.value)}
                    placeholder="Ex: malaca7"
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Texto copiado ao clicar no botão.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Texto de Copyright */}
                <div className="space-y-1.5">
                  <Label htmlFor="foot-copyrightText" className="text-xs font-bold text-foreground">
                    Texto Adicional de Copyright
                  </Label>
                  <Input
                    id="foot-copyrightText"
                    value={platformForm.footerCopyrightText || ""}
                    onChange={(e) => updatePlatformField("footerCopyrightText", e.target.value)}
                    placeholder="Ex: Todos os direitos reservados."
                    className="h-9 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Texto legal ou aviso institucional.</p>
                </div>

                {/* Nota / Slogan do Rodapé */}
                <div className="space-y-1.5">
                  <Label htmlFor="foot-customNote" className="text-xs font-bold text-foreground">
                    Mensagem / Nota Inferior do Rodapé
                  </Label>
                  <Input
                    id="foot-customNote"
                    value={platformForm.footerCustomNote || ""}
                    onChange={(e) => updatePlatformField("footerCustomNote", e.target.value)}
                    placeholder="Ex: Gestão Operacional & Executiva GTA RP"
                    className="h-9 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Linha sutil exibida abaixo dos créditos.</p>
                </div>
              </div>

              {/* Switches de Visibilidade dos Elementos do Rodapé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="footerShowDeveloperCredits" className="text-xs font-bold text-foreground cursor-pointer block">
                      Créditos Dev
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Exibir créditos de autoria e desenvolvimento.
                    </p>
                  </div>
                  <Switch
                    id="footerShowDeveloperCredits"
                    checked={platformForm.footerShowDeveloperCredits !== false}
                    onCheckedChange={(val) => updatePlatformField("footerShowDeveloperCredits", val)}
                  />
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="footerShowDiscordCopy" className="text-xs font-bold text-foreground cursor-pointer block">
                      Botão Copiar Discord
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Transforma a tag Discord em botão copiador interativo.
                    </p>
                  </div>
                  <Switch
                    id="footerShowDiscordCopy"
                    checked={platformForm.footerShowDiscordCopy !== false}
                    onCheckedChange={(val) => updatePlatformField("footerShowDiscordCopy", val)}
                  />
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="footerShowYear" className="text-xs font-bold text-foreground cursor-pointer block">
                      Ano Atual &copy;
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Incluir o ano corrente ({new Date().getFullYear()}) no copyright.
                    </p>
                  </div>
                  <Switch
                    id="footerShowYear"
                    checked={platformForm.footerShowYear !== false}
                    onCheckedChange={(val) => updatePlatformField("footerShowYear", val)}
                  />
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="footerShowVersion" className="text-xs font-bold text-foreground cursor-pointer block">
                      Badge de Versão
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Exibir a etiqueta com a versão do sistema.
                    </p>
                  </div>
                  <Switch
                    id="footerShowVersion"
                    checked={platformForm.footerShowVersion !== false}
                    onCheckedChange={(val) => updatePlatformField("footerShowVersion", val)}
                  />
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="footerShowSupportLink" className="text-xs font-bold text-foreground cursor-pointer block">
                      Link de Suporte
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Exibir atalho direto para o Discord de suporte.
                    </p>
                  </div>
                  <Switch
                    id="footerShowSupportLink"
                    checked={Boolean(platformForm.footerShowSupportLink)}
                    onCheckedChange={(val) => updatePlatformField("footerShowSupportLink", val)}
                  />
                </div>
              </div>

              {/* PREVIEW EM TEMPO REAL DO RODAPÉ */}
              <div className="p-4 rounded-xl border border-border/70 bg-background/80 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-border/40">
                  <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    Preview Interativo em Tempo Real do Rodapé:
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Visualização Idêntica ao Rodapé Real
                  </Badge>
                </div>

                {/* Rodapé Simulado com Ação Real de Cópia */}
                <div className="py-4 text-center text-xs text-muted-foreground/80 space-y-1.5 bg-card/60 rounded-lg border border-border/40">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap font-medium">
                    <span>
                      {platformForm.footerFactionText || platformForm.factionName || "Twin Wheels"}
                      {platformForm.footerShowYear !== false && (
                        <> &copy; {new Date().getFullYear()}</>
                      )}
                    </span>

                    {platformForm.footerCopyrightText && (
                      <>
                        <span className="opacity-40">•</span>
                        <span>{platformForm.footerCopyrightText}</span>
                      </>
                    )}

                    {platformForm.footerShowDeveloperCredits !== false && (
                      <>
                        <span className="opacity-40">•</span>
                        <span>{platformForm.footerDeveloperRole || "Desenvolvido por"}</span>
                        {platformForm.footerShowDiscordCopy !== false && (platformForm.footerDeveloperDiscord || "malaca7") ? (
                          <button
                            type="button"
                            onClick={() => {
                              const tag = platformForm.footerDeveloperDiscord || "malaca7";
                              navigator.clipboard.writeText(tag);
                              toast.success(`Tag do Discord (${tag}) copiada com sucesso!`);
                            }}
                            className="font-bold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 transition-all hover:bg-primary/20 cursor-pointer"
                            title={`Clique para testar a cópia da tag: ${platformForm.footerDeveloperDiscord || "malaca7"}`}
                          >
                            <span>{platformForm.footerDeveloperName || "malaca"}</span>
                            <span className="text-[10px] font-mono opacity-80">
                              ({platformForm.footerDeveloperDiscord || "malaca7"})
                            </span>
                          </button>
                        ) : (
                          <span className="font-bold text-primary">
                            {platformForm.footerDeveloperName || "malaca"}
                          </span>
                        )}
                      </>
                    )}

                    {platformForm.footerShowVersion !== false && (platformForm.systemVersion || "v2.5.0") && (
                      <>
                        <span className="opacity-40">•</span>
                        <span className="font-mono text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/50 text-foreground/80">
                          {platformForm.systemVersion || "v2.5.0"}
                        </span>
                      </>
                    )}

                    {platformForm.footerShowSupportLink !== false && platformForm.supportDiscordUrl && (
                      <>
                        <span className="opacity-40">•</span>
                        <a
                          href={platformForm.supportDiscordUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          Suporte Discord
                        </a>
                      </>
                    )}
                  </div>

                  {platformForm.footerCustomNote && (
                    <p className="text-[11px] text-muted-foreground/60 italic font-mono">
                      {platformForm.footerCustomNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação para o Rodapé */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFooterDefaults}
                  className="h-8 text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar Padrões do Rodapé
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveFooterInfo}
                  disabled={savingFooter}
                  className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {savingFooter ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Salvar Configurações do Rodapé
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Cores Padrão dos Painéis Dev, CEO & Membro */}
          <Card className="surface-card border transition-all duration-300">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">
                      Cores Padrão dos Painéis (Dev, CEO & Membro)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure a identidade visual oficial dos menus, categorias e ícones de cada painel. Ao selecionar uma cor, todas as categorias, ícones e itens do painel passam a adotá-la automaticamente.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                  Identidade Visual dos Painéis
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Seletor 1: Cor do Painel Dev */}
                <PanelColorPickerCard
                  panelName="Painel Dev"
                  panelSubname="Desenvolvedor"
                  themeKey="devThemeColor"
                  colorValue={config.devThemeColor}
                  fallback="rose"
                  iconKey="devPanelIcon"
                  iconValue={config.devPanelIcon}
                  fallbackIcon="Terminal"
                  description="Define a cor e o ícone padrão aplicados ao botão de alternância, menus e categorias em modo Desenvolvedor."
                  onSelectColor={handleSelectPanelColor}
                  onSelectIcon={handleSelectPanelIcon}
                  onApplyToAllPanels={handleApplyToAllPanels}
                />

                {/* Seletor 2: Cor do Painel CEO */}
                <PanelColorPickerCard
                  panelName="Painel CEO"
                  panelSubname="Executivo / Diretoria"
                  themeKey="ceoThemeColor"
                  colorValue={config.ceoThemeColor}
                  fallback="amber"
                  iconKey="ceoPanelIcon"
                  iconValue={config.ceoPanelIcon}
                  fallbackIcon="Crown"
                  description="Define a cor e o ícone padrão aplicados ao botão de alternância, menus e categorias em modo Executivo CEO."
                  onSelectColor={handleSelectPanelColor}
                  onSelectIcon={handleSelectPanelIcon}
                  onApplyToAllPanels={handleApplyToAllPanels}
                />

                {/* Seletor 3: Cor do Painel de Membro */}
                <PanelColorPickerCard
                  panelName="Painel Membro"
                  panelSubname="Plataforma Geral"
                  themeKey="memberThemeColor"
                  colorValue={config.memberThemeColor}
                  fallback="cyan"
                  iconKey="memberPanelIcon"
                  iconValue={config.memberPanelIcon}
                  fallbackIcon="Users"
                  description="Define a cor e o ícone padrão aplicados ao botão de alternância, menus e categorias para todos os membros regulares."
                  onSelectColor={handleSelectPanelColor}
                  onSelectIcon={handleSelectPanelIcon}
                  onApplyToAllPanels={handleApplyToAllPanels}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards de Opções Adicionais do Desenvolvedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Option 1: Developer Bypass */}
            <Card className="surface-card border transition-all duration-300">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">Bypass de Autorização Dev</CardTitle>
                    <CardDescription className="text-[0.7rem]">Privilégio supremo de desenvolvedor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                  <div className="space-y-0.5">
                    <Label htmlFor="developerBypassMode" className="text-xs font-bold text-foreground cursor-pointer block">
                      Acesso Irrestrito Supremo
                    </Label>
                    <p className="text-[0.65rem] text-muted-foreground">
                      Garante acesso completo a todas as páginas e ações sem bloqueio de patente.
                    </p>
                  </div>
                  <Switch
                    id="developerBypassMode"
                    checked={config.developerBypassMode}
                    onCheckedChange={() => handleToggle("developerBypassMode")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Option 2: Dev System Notifications */}
            <Card className="surface-card border transition-all duration-300">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">Alertas de Exceção</CardTitle>
                    <CardDescription className="text-[0.7rem]">Notificações em tempo real</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                  <div className="space-y-0.5">
                    <Label htmlFor="devSystemNotifications" className="text-xs font-bold text-foreground cursor-pointer block">
                      Notificações Instantâneas Dev
                    </Label>
                    <p className="text-[0.65rem] text-muted-foreground">
                      Exibe popups de aviso em tela quando ocorrem exceções não tratadas na plataforma.
                    </p>
                  </div>
                  <Switch
                    id="devSystemNotifications"
                    checked={config.devSystemNotifications}
                    onCheckedChange={() => handleToggle("devSystemNotifications")}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span className="text-[0.7rem] text-muted-foreground">
                    Validação em tempo real:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold gap-1.5 border-sky-500/30 hover:border-sky-500/60 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 h-7"
                    onClick={() => {
                      reportAppError(new Error("Teste de alerta de exceção dev executado com sucesso!"));
                      if (!config.devSystemNotifications) {
                        toast.info("Alertas de Exceção estão desativados. Nenhum popup de erro foi disparado.", {
                          duration: 3500,
                        });
                      }
                    }}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Disparar Exceção de Teste
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Subcomponente de Seleção de Cores para Cada Painel
 * Permite filtrar por Sólidas, Peroladas e Degradês, visualizar preview imediato
 * e aplicar em todos os painéis com um clique.
 */
function PanelColorPickerCard({
  panelName,
  panelSubname,
  themeKey,
  colorValue,
  fallback,
  iconKey,
  iconValue,
  fallbackIcon,
  description,
  onSelectColor,
  onSelectIcon,
  onApplyToAllPanels,
}: {
  panelName: string;
  panelSubname: string;
  themeKey: "devThemeColor" | "ceoThemeColor" | "memberThemeColor";
  colorValue?: PanelColor;
  fallback: PanelColor;
  iconKey: "devPanelIcon" | "ceoPanelIcon" | "memberPanelIcon";
  iconValue?: string;
  fallbackIcon: string;
  description: string;
  onSelectColor: (key: "devThemeColor" | "ceoThemeColor" | "memberThemeColor", color: PanelColor) => void;
  onSelectIcon: (key: "devPanelIcon" | "ceoPanelIcon" | "memberPanelIcon", iconName: string) => void;
  onApplyToAllPanels: (color: PanelColor) => void;
}) {
  const [filterType, setFilterType] = useState<"all" | PanelColorType>("all");
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [iconCategory, setIconCategory] = useState<"all" | "dev" | "ceo" | "member" | "system">("all");

  const currentColor = colorValue || fallback;
  const currentStyle = getPanelColorStyle(currentColor, fallback);

  const currentIconName = iconValue || fallbackIcon;
  const CurrentIcon = useMemo(() => resolvePanelIcon(currentIconName), [currentIconName]);

  const allKeys = useMemo(() => Object.keys(PANEL_COLOR_STYLES) as PanelColor[], []);
  const filteredKeys = useMemo(() => {
    if (filterType === "all") return allKeys;
    return allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === filterType);
  }, [allKeys, filterType]);

  const solidCount = useMemo(() => allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === "solid").length, [allKeys]);
  const pearlCount = useMemo(() => allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === "pearl").length, [allKeys]);
  const gradientCount = useMemo(() => allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === "gradient").length, [allKeys]);

  const filteredIcons = useMemo(() => {
    return PANEL_ICONS_CATALOG.filter((item) => {
      const matchesCategory = iconCategory === "all" || item.category === iconCategory;
      const matchesSearch =
        !iconSearch.trim() ||
        item.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
        item.label.toLowerCase().includes(iconSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [iconCategory, iconSearch]);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/60 flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Cabeçalho do Painel com Ícone Dinâmico e Botão de Alterar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIconModalOpen(true)}
              className={cn(
                "p-2 rounded-lg border flex items-center justify-center shrink-0 shadow-xs transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 group",
                currentStyle.bgSubtleClass,
                currentStyle.borderSubtleClass,
                currentStyle.iconClass
              )}
              title="Clique para escolher outro ícone para este painel"
            >
              <CurrentIcon className="h-4 w-4 transition-transform group-hover:rotate-6" />
            </button>
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-foreground block truncate">
                {panelName}
              </span>
              <span className="text-[10.5px] text-muted-foreground font-medium truncate block">
                {panelSubname}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIconModalOpen(true)}
              className={cn(
                "h-6 text-[10px] font-bold px-2 gap-1 border transition-colors cursor-pointer",
                currentStyle.borderSubtleClass,
                currentStyle.bgSubtleClass,
                currentStyle.textClass
              )}
              title="Alterar o ícone oficial deste painel"
            >
              <CurrentIcon className="h-3 w-3" />
              <span>{currentIconName}</span>
            </Button>
            <Badge className={currentStyle.badgeClass}>
              {currentStyle.label.split(" ")[0]}
            </Badge>
          </div>
        </div>

        <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Seletor Rápido de Ícone Oficial do Painel */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-muted-foreground font-semibold">Ícone Oficial:</span>
            <span className={cn("flex items-center gap-1 text-[11px] font-bold", currentStyle.textClass)}>
              <CurrentIcon className="h-3.5 w-3.5" />
              {currentIconName}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIconModalOpen(true)}
            className="h-6 text-[10.5px] font-bold hover:bg-secondary px-2 cursor-pointer text-primary"
          >
            Escolher Ícone →
          </Button>
        </div>

        {/* Filtros de Tipos de Cor */}
        <div className="flex items-center gap-1 p-1 bg-secondary/40 rounded-lg border border-border/40 text-[10px] font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer",
              filterType === "all" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas ({allKeys.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("solid")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer",
              filterType === "solid" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sólidas ({solidCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("pearl")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1",
              filterType === "pearl" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-2.5 h-2.5" />
            Peroladas ({pearlCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("gradient")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1",
              filterType === "gradient" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-2.5 h-2.5" />
            Degradês ({gradientCount})
          </button>
        </div>

        {/* Grade de Cores com Scroll Suave */}
        <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
          {filteredKeys.map((cKey) => {
            const style = PANEL_COLOR_STYLES[cKey];
            const isSelected = currentColor === cKey;

            return (
              <button
                key={`${themeKey}-${cKey}`}
                type="button"
                onClick={() => onSelectColor(themeKey, cKey)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer relative group",
                  isSelected
                    ? cn(style.borderClass, style.bgSubtleClass, "ring-2", style.ringClass, "shadow-sm")
                    : "border-border/60 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
                title={style.description}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                  style={{ background: style.previewGradient || style.hex }}
                />
                <span className="truncate text-[10.5px] flex-1">{style.label.split(" ")[0]}</span>
                {isSelected && <Check className="h-3 w-3 ml-auto shrink-0 text-foreground" />}
              </button>
            );
          })}
        </div>

        {/* Preview Rápido Unificado (Cor + Ícone Oficial) */}
        <div className={cn("p-3 rounded-xl border text-xs space-y-2", currentStyle.borderSubtleClass, currentStyle.bgSubtleClass)}>
          <div className="flex items-center justify-between text-[11px]">
            <span className={cn("font-bold flex items-center gap-1.5", currentStyle.textClass)}>
              <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{panelName} · Visual Ativo</span>
            </span>
            <Badge className={currentStyle.badgeClass}>
              {currentIconName}
            </Badge>
          </div>
          <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px]", currentStyle.activeItemClass)}>
            <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Item Ativo de Menu ({currentStyle.label.split(" ")[0]})</span>
          </div>
        </div>
      </div>

      {/* Botão de Aplicação Global a Todos os Painéis */}
      <div className="pt-2 border-t border-border/40 mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onApplyToAllPanels(currentColor)}
          className="w-full text-[11px] font-bold h-8 gap-1.5 border-border/60 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Aplicar Cor em Todos os Painéis
        </Button>
      </div>

      {/* MODAL DE SELEÇÃO DE ÍCONE OFICIAL DO PAINEL */}
      <Dialog open={iconModalOpen} onOpenChange={setIconModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 space-y-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={cn("p-2 rounded-xl border shrink-0", currentStyle.bgSubtleClass, currentStyle.borderSubtleClass, currentStyle.iconClass)}>
                <CurrentIcon className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  Escolher Ícone Oficial · {panelName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Selecione o ícone representativo exibido no seletor de painéis, menus e badges oficiais do {panelName}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Campo de Busca de Ícones */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ícone por nome ou finalidade..."
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
              autoFocus
            />
          </div>

          {/* Categorias de Ícones */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setIconCategory("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                iconCategory === "all" ? "bg-primary text-primary-foreground font-black shadow-xs" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Todos ({PANEL_ICONS_CATALOG.length})
            </button>
            <button
              type="button"
              onClick={() => setIconCategory("dev")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                iconCategory === "dev" ? "bg-primary text-primary-foreground font-black shadow-xs" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Dev & Código
            </button>
            <button
              type="button"
              onClick={() => setIconCategory("ceo")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                iconCategory === "ceo" ? "bg-primary text-primary-foreground font-black shadow-xs" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Executivo & CEO
            </button>
            <button
              type="button"
              onClick={() => setIconCategory("member")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                iconCategory === "member" ? "bg-primary text-primary-foreground font-black shadow-xs" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Equipe & Membros
            </button>
            <button
              type="button"
              onClick={() => setIconCategory("system")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                iconCategory === "system" ? "bg-primary text-primary-foreground font-black shadow-xs" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Sistema & Utilidades
            </button>
          </div>

          {/* Grade de Ícones com Scroll */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[340px] pr-1">
            {filteredIcons.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = currentIconName === opt.name;

              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => {
                    onSelectIcon(iconKey, opt.name);
                    setIconModalOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer relative group",
                    isSelected
                      ? cn(currentStyle.bgSubtleClass, currentStyle.borderClass, "ring-2", currentStyle.ringClass, "shadow-sm")
                      : "bg-secondary/30 border-border/60 hover:bg-secondary/60 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "p-2 rounded-lg border shrink-0 transition-colors",
                      isSelected
                        ? cn(currentStyle.bgSolidClass, "border-transparent")
                        : "bg-background border-border/70 group-hover:border-primary/40 group-hover:text-foreground"
                    )}
                  >
                    <IconComp className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={cn("text-xs font-bold block truncate", isSelected && currentStyle.textClass)}>
                      {opt.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {opt.label.split("/")[0]}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className={cn("h-4 w-4 ml-auto shrink-0", currentStyle.textClass)} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Ícone selecionado: <strong className={currentStyle.textClass}>{currentIconName}</strong>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIconModalOpen(false)}
              className="h-8 text-xs font-bold"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Central de Gestão Completa de Manutenção */}
      <DevMaintenanceManagerModal
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
      />
    </div>
  );
}
