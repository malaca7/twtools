import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Boxes,
  Bot,
  Wrench,
  PackageCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Terminal,
  Eye,
  Sparkles,
  Send,
  HelpCircle,
  Check,
  Trash2,
  Plus,
  Sliders,
  Radio,
  FileCode,
  Layers,
  History,
  Info,
  Save,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { BauIcon } from "@/components/ui/bau-icon";
import { PageHeader, ProductThumbnail, EmptyState } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useBaus,
  useProducts,
  useMovements,
  useProductBaus,
  useDiscordStockConfig,
  useMembers,
} from "@/hooks/useData";
import { num, dateTime, formatDate } from "@/lib/format";
import {
  adjustStockDev,
  updateDiscordStockConfig,
  updateBau,
  sanitizeNegativeStocks,
} from "@/lib/app-api";
import { useUrlTab } from "@/hooks/useUrlTab";
import type { DiscordStockConfig } from "@/lib/app-types";
import { SimularMovimentacaoTab } from "@/components/dev/SimularMovimentacaoTab";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dev/estoque")({
  component: DevEstoquePage,
});

export type DevEstoqueTabType = "discord" | "logs" | "simular";
export const VALID_DEV_ESTOQUE_TABS = ["discord", "logs", "simular"] as const;

export function DevEstoquePageContent({ initialTab }: { initialTab?: string } = {}) {
  const { hasPermission } = useAuth();
  const { data: baus = [] } = useBaus();
  const { data: config } = useDiscordStockConfig();

  const defaultInitialTab: DevEstoqueTabType =
    initialTab && (VALID_DEV_ESTOQUE_TABS as readonly string[]).includes(initialTab)
      ? (initialTab as DevEstoqueTabType)
      : "discord";

  const [activeTab, setActiveTab] = useUrlTab<DevEstoqueTabType>(defaultInitialTab, {
    allowedTabs: VALID_DEV_ESTOQUE_TABS,
    usePath: true,
    paramName: "tab",
  });

  const autoBausCount = baus.filter((b) => b.ativo && b.tipo_gestao !== "manual").length;
  const manualBausCount = baus.filter((b) => b.ativo && b.tipo_gestao === "manual").length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Gestão Técnica de Estoque & Integração Discord"
          description="Controle avançado de sincronização automática de baús via logs do Discord, regras de processamento e auditoria técnica."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            <Link to="/dev/gestao-estoque">
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Gestão de Estoque Geral →</span>
            </Link>
          </Button>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-3">
            <Bot className="w-3.5 h-3.5" />
            {config?.is_active ? "Bot Discord Ativo" : "Bot em Pausa"}
          </Badge>
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 gap-1.5 py-1 px-3">
            <Boxes className="w-3.5 h-3.5" />
            {autoBausCount} Baús Auto • {manualBausCount} Manual
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-secondary/60 p-1 border border-border/60 inline-flex w-max sm:w-auto h-auto">
            <TabsTrigger value="discord" className="gap-2 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bot className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Integração Discord & Regras</span>
              <span className="sm:hidden">Discord & Regras</span>
            </TabsTrigger>
            <TabsTrigger value="simular" className="gap-2 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Simular Movimentação</span>
              <span className="sm:hidden">Simulação</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Logs Técnicas & Auditoria</span>
              <span className="sm:hidden">Logs & Auditoria</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="discord" className="space-y-6">
          <DiscordIntegrationTab />
        </TabsContent>

        <TabsContent value="simular" className="space-y-6">
          <SimularMovimentacaoTab onNavigateToLogs={() => setActiveTab("logs")} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <DiscordLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DevEstoquePage() {
  return (
    <DeveloperGuard>
      <DevEstoquePageContent />
    </DeveloperGuard>
  );
}

// ============================================================================
// TAB 1: INTEGRAÇÃO COM DISCORD & CONFIGURAÇÃO
// ============================================================================
function DiscordIntegrationTab() {
  const queryClient = useQueryClient();
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: config, isLoading } = useDiscordStockConfig();

  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultBauId, setDefaultBauId] = useState("");
  const [itemMappings, setItemMappings] = useState<Record<string, string>>({});
  const [bauMappings, setBauMappings] = useState<Record<string, string>>({});

  type BauFormState = {
    tipo_gestao: "automatico" | "manual";
    discord_channel_id: string;
    discord_guild_id: string;
    is_saving?: boolean;
  };
  const [bauConfigs, setBauConfigs] = useState<Record<string, BauFormState>>({});
  const [isSavingAllBaus, setIsSavingAllBaus] = useState(false);
  const [isSavingItemMappings, setIsSavingItemMappings] = useState(false);

  // Filtros e busca de Baús
  const [bauSearch, setBauSearch] = useState("");
  const [bauFilter, setBauFilter] = useState<"all" | "auto" | "manual" | "no-channel">("all");

  // Filtros e busca de Mapeamentos
  const [aliasSearch, setAliasSearch] = useState("");
  const [newAliasKey, setNewAliasKey] = useState("");
  const [newAliasTargetProduct, setNewAliasTargetProduct] = useState("");

  // Simulador de logs state (resolvido por canal exclusivo do baú)
  const [selectedSimBauId, setSelectedSimBauId] = useState("");
  const [testLogText, setTestLogText] = useState(
    "Andrew Delucca Ferreira • ID 274\n📦 Baú\n\n📊 Saldo líquido\nMetanfetamina -72\nCocaína -126\n\n🧾 Detalhes da movimentação\nMetanfetamina\n↳ -72 removidos\nCocaína\n↳ -126 removidos\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 19:21"
  );
  const [simulatedResult, setSimulatedResult] = useState<any>(null);

  // Helper para cópia
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Define baú padrão para o simulador
  useEffect(() => {
    if (baus.length > 0 && !selectedSimBauId) {
      const firstAuto = baus.find((b) => b.ativo && b.tipo_gestao !== "manual");
      setSelectedSimBauId(firstAuto ? firstAuto.id : baus[0].id);
    }
  }, [baus, selectedSimBauId]);

  // Sincroniza dados da configuração global
  useEffect(() => {
    if (config) {
      setGuildId((prev) => (prev ? prev : config.guild_id || ""));
      setChannelId((prev) => (prev ? prev : config.channel_id || ""));
      setIsActive(config.is_active ?? true);
      setAllowNegativeStock(config.allow_negative_stock ?? false);
      setDefaultBauId((prev) => (prev ? prev : config.default_bau_id || ""));
      setItemMappings(config.item_mappings || {});
      setBauMappings(config.bau_mappings || {});
    }
  }, [config]);

  // Sincroniza dados individuais dos baús
  useEffect(() => {
    if (baus.length > 0) {
      setBauConfigs((prev) => {
        const next = { ...prev };
        for (const b of baus) {
          const existing = next[b.id];
          const cfgBau = config?.bau_channels?.[b.id];
          next[b.id] = {
            tipo_gestao: existing?.tipo_gestao ?? b.tipo_gestao ?? cfgBau?.tipo_gestao ?? "automatico",
            discord_channel_id:
              existing?.discord_channel_id !== undefined
                ? existing.discord_channel_id
                : (b.discord_channel_id ?? cfgBau?.channel_id ?? ""),
            discord_guild_id:
              existing?.discord_guild_id !== undefined
                ? existing.discord_guild_id
                : (b.discord_guild_id ?? cfgBau?.guild_id ?? ""),
            is_saving: false,
          };
        }
        return next;
      });
    }
  }, [baus, config]);

  // Identifica baús modificados
  const isBauModified = (bauId: string) => {
    const original = baus.find((b) => b.id === bauId);
    const current = bauConfigs[bauId];
    if (!original || !current) return false;
    const origTipo = original.tipo_gestao || "automatico";
    const origCh = original.discord_channel_id || "";
    const origGuild = original.discord_guild_id || "";
    return (
      current.tipo_gestao !== origTipo ||
      (current.discord_channel_id || "").trim() !== origCh.trim() ||
      (current.discord_guild_id || "").trim() !== origGuild.trim()
    );
  };

  const modifiedBausCount = useMemo(() => {
    return baus.filter((b) => isBauModified(b.id)).length;
  }, [baus, bauConfigs]);

  const autoCount = useMemo(() => {
    return baus.filter((b) => (bauConfigs[b.id]?.tipo_gestao ?? b.tipo_gestao) === "automatico").length;
  }, [baus, bauConfigs]);

  const manualCount = useMemo(() => {
    return baus.filter((b) => (bauConfigs[b.id]?.tipo_gestao ?? b.tipo_gestao) === "manual").length;
  }, [baus, bauConfigs]);

  const noChannelCount = useMemo(() => {
    return baus.filter((b) => {
      const cfg = bauConfigs[b.id];
      const isAuto = (cfg?.tipo_gestao ?? b.tipo_gestao) === "automatico";
      const ch = (cfg?.discord_channel_id ?? b.discord_channel_id ?? "").trim();
      return isAuto && !ch;
    }).length;
  }, [baus, bauConfigs]);

  const filteredBaus = useMemo(() => {
    return baus.filter((b) => {
      const cfg = bauConfigs[b.id];
      const tipo = cfg?.tipo_gestao ?? b.tipo_gestao ?? "automatico";
      const ch = (cfg?.discord_channel_id ?? b.discord_channel_id ?? "").trim();
      const isAuto = tipo === "automatico";

      if (bauFilter === "auto" && !isAuto) return false;
      if (bauFilter === "manual" && isAuto) return false;
      if (bauFilter === "no-channel" && (!isAuto || Boolean(ch))) return false;

      if (bauSearch.trim()) {
        const q = bauSearch.toLowerCase().trim();
        const matchName = b.nome.toLowerCase().includes(q);
        const matchDesc = b.descricao?.toLowerCase().includes(q);
        const matchChannel = ch.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchChannel) return false;
      }
      return true;
    });
  }, [baus, bauConfigs, bauFilter, bauSearch]);

  const filteredItemMappings = useMemo(() => {
    const entries = Object.entries(itemMappings);
    if (!aliasSearch.trim()) return entries;
    const q = aliasSearch.toLowerCase().trim();
    return entries.filter(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q));
  }, [itemMappings, aliasSearch]);

  const negativeProductsCount = useMemo(() => {
    return products.filter((p) => Number(p.estoque_atual || 0) < 0).length;
  }, [products]);

  const sanitizeMutation = useMutation({
    mutationFn: async () => {
      return await sanitizeNegativeStocks();
    },
    onSuccess: (data) => {
      toast.success(
        data.fixed_products > 0 || data.fixed_baus > 0
          ? `Saldos normalizados com sucesso! (${data.fixed_baus} baú(s) e ${data.fixed_products} produto(s) zerados)`
          : "Todos os produtos já estão com saldos consistentes e não-negativos."
      );
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao normalizar saldos.");
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const res = await updateDiscordStockConfig({
        guild_id: guildId.trim() || null,
        channel_id: channelId.trim() || null,
        is_active: isActive,
        allow_negative_stock: allowNegativeStock,
        default_bau_id: defaultBauId || null,
        item_mappings: itemMappings,
        bau_mappings: bauMappings,
      });

      if (!allowNegativeStock) {
        try {
          await sanitizeNegativeStocks();
        } catch {
          // ignora erro secundário
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Parâmetros de integração do Discord salvos com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar configuração.");
    },
  });

  const handleAddItemMapping = async () => {
    if (!newAliasKey.trim() || !newAliasTargetProduct) {
      toast.error("Informe o texto do Discord e selecione o produto correspondente.");
      return;
    }
    const cleanKey = newAliasKey.trim().toLowerCase();
    const updated = {
      ...itemMappings,
      [cleanKey]: newAliasTargetProduct,
    };
    setItemMappings(updated);
    setNewAliasKey("");
    setNewAliasTargetProduct("");

    try {
      await updateDiscordStockConfig({ item_mappings: updated });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success(`Mapeamento "${cleanKey}" associado a "${newAliasTargetProduct}" salvo!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar mapeamento no servidor.");
    }
  };

  const handleRemoveItemMapping = async (key: string) => {
    const updated = { ...itemMappings };
    delete updated[key];
    setItemMappings(updated);

    try {
      await updateDiscordStockConfig({ item_mappings: updated });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success(`Mapeamento "${key}" removido com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover mapeamento.");
    }
  };

  const handleSaveAllItemMappings = async () => {
    setIsSavingItemMappings(true);
    try {
      await updateDiscordStockConfig({ item_mappings: itemMappings });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success("Todos os mapeamentos de itens foram salvos com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar mapeamentos de itens.");
    } finally {
      setIsSavingItemMappings(false);
    }
  };

  const handleSaveSingleBau = async (bauId: string) => {
    const current = bauConfigs[bauId];
    if (!current) return;

    setBauConfigs((prev) => ({
      ...prev,
      [bauId]: { ...prev[bauId], is_saving: true },
    }));

    try {
      const cleanChannelId = current.discord_channel_id?.trim() || null;
      const cleanGuildId = current.discord_guild_id?.trim() || guildId?.trim() || null;

      await updateBau({
        id: bauId,
        tipo_gestao: current.tipo_gestao,
        discord_channel_id: cleanChannelId,
        discord_guild_id: cleanGuildId,
      });

      const updatedBauChannels = {
        ...(config?.bau_channels || {}),
        [bauId]: {
          bau_id: bauId,
          channel_id: cleanChannelId || "",
          guild_id: cleanGuildId || "",
          tipo_gestao: current.tipo_gestao,
          is_active: baus.find((b) => b.id === bauId)?.ativo ?? true,
        },
      };

      await updateDiscordStockConfig({
        bau_channels: updatedBauChannels,
      });

      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });

      const targetBau = baus.find((b) => b.id === bauId);
      toast.success(`Configuração do baú "${targetBau?.nome || bauId}" salva!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações do baú.");
    } finally {
      setBauConfigs((prev) => ({
        ...prev,
        [bauId]: { ...prev[bauId], is_saving: false },
      }));
    }
  };

  const handleSaveAllBaus = async () => {
    setIsSavingAllBaus(true);
    try {
      const updatedBauChannels = { ...(config?.bau_channels || {}) };

      for (const b of baus) {
        const current = bauConfigs[b.id] || {
          tipo_gestao: b.tipo_gestao || "automatico",
          discord_channel_id: b.discord_channel_id || "",
          discord_guild_id: b.discord_guild_id || "",
        };

        const cleanChannelId = current.discord_channel_id?.trim() || null;
        const cleanGuildId = current.discord_guild_id?.trim() || guildId?.trim() || null;

        await updateBau({
          id: b.id,
          tipo_gestao: current.tipo_gestao,
          discord_channel_id: cleanChannelId,
          discord_guild_id: cleanGuildId,
        });

        updatedBauChannels[b.id] = {
          bau_id: b.id,
          channel_id: cleanChannelId || "",
          guild_id: cleanGuildId || "",
          tipo_gestao: current.tipo_gestao,
          is_active: b.ativo,
        };
      }

      await updateDiscordStockConfig({
        bau_channels: updatedBauChannels,
      });

      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      toast.success("Todos os baús foram configurados e sincronizados!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar todos os baús.");
    } finally {
      setIsSavingAllBaus(false);
    }
  };

  // Parser local no cliente para testes rápidos
  const handleTestParser = () => {
    const raw = testLogText || "";
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let authorName: string | null = null;
    let playerId: string | null = null;

    const authorPattern = /(?:^|\n)\s*([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s*[•\|\-]\s*(?:ID|Passaporte)?\s*(\d+)/i;
    const authorMatch = raw.match(authorPattern);
    if (authorMatch) {
      authorName = authorMatch[1].trim();
      playerId = authorMatch[2].trim();
    } else {
      const idMatch = raw.match(/ID\s*[:#]?\s*(\d+)/i) || raw.match(/Passaporte\s*[:#]?\s*(\d+)/i);
      if (idMatch) playerId = idMatch[1];
    }

    let isTransfer = false;
    let fromBau = null;
    let toBau = null;

    const targetBauObj = baus.find((b) => b.id === selectedSimBauId) || baus[0];
    const detectedBau = targetBauObj ? targetBauObj.nome : "Baú Desconhecido";
    const isBauManual = targetBauObj?.tipo_gestao === "manual";
    const channelBound = targetBauObj?.discord_channel_id || "";

    const transferMatch =
      raw.match(/(?:origem|de)\s*[:\-]\s*([^\n\r\|]+).*?(?:destino|para)\s*[:\-]\s*([^\n\r\|]+)/i) ||
      raw.match(/transfer(?:ência|ido)?\s*(?:de)?\s*([^\n\r\->]+)\s*(?:->|para)\s*([^\n\r]+)/i);

    if (transferMatch) {
      isTransfer = true;
      fromBau = transferMatch[1].replace(/📦/g, "").trim();
      toBau = transferMatch[2].replace(/📦/g, "").trim();
    }

    const items: Array<{ name: string; qtyChange: number; mappedTo?: string }> = [];
    let inSaldoLiquido = false;
    let inDetalhes = false;
    let lastItemPendingQty: string | null = null;

    const cleanItem = (rawItemName: string) => {
      const clean = rawItemName.replace(/^[\s\-•\*\>]+/, "").trim();
      const lower = clean.toLowerCase();
      if (itemMappings[lower]) return itemMappings[lower];
      for (const [k, v] of Object.entries(itemMappings)) {
        if (k.trim().toLowerCase() === lower) return v;
      }
      return clean;
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/[\*\_`]/g, "").trim();

      if (/saldo\s*l[ií]quido/i.test(line)) {
        inSaldoLiquido = true;
        inDetalhes = false;
        const inline = line.match(/saldo\s*l[ií]quido\s*[:\-]?\s*(.+?)\s*([+-]\s*\d+)$/i);
        if (inline) {
          const rawItem = inline[1].trim();
          const q = parseInt(inline[2].replace(/\s+/g, ""), 10);
          items.push({
            name: rawItem,
            qtyChange: q,
            mappedTo: cleanItem(rawItem),
          });
        }
        continue;
      }

      if (/detalhes\s*da\s*movimenta[cç][aã]o/i.test(line)) {
        inSaldoLiquido = false;
        inDetalhes = true;
        continue;
      }

      if (/movimenta[cç][oõ]es\s*agrupadas|data|hor[aá]rio|respons[aá]vel/i.test(line)) {
        inSaldoLiquido = false;
        inDetalhes = false;
        continue;
      }

      if (inSaldoLiquido) {
        const m = line.match(/^(.+?)\s*[:\-]?\s*([+-]\s*\d+)$/);
        if (m) {
          const rawItem = m[1].trim();
          const q = parseInt(m[2].replace(/\s+/g, ""), 10);
          if (!isNaN(q) && rawItem.length > 1) {
            items.push({
              name: rawItem,
              qtyChange: q,
              mappedTo: cleanItem(rawItem),
            });
          }
        }
      } else if (inDetalhes && items.length === 0) {
        const arrowMatch = line.match(/^[↳\->]+\s*([+-]?\s*\d+)\s*(removid[oa]s?|retirad[oa]s?|adicionad[oa]s?|colocad[oa]s?|guardad[oa]s?)?/i);
        if (arrowMatch && lastItemPendingQty) {
          let q = parseInt(arrowMatch[1].replace(/\s+/g, ""), 10);
          const actionWord = (arrowMatch[2] || "").toLowerCase();
          if (/removid|retirad/.test(actionWord) && q > 0) {
            q = -q;
          }
          items.push({
            name: lastItemPendingQty,
            qtyChange: q,
            mappedTo: cleanItem(lastItemPendingQty),
          });
          lastItemPendingQty = null;
        } else if (!/^[↳\->]/.test(line)) {
          lastItemPendingQty = line;
        }
      } else {
        const m = line.match(/^([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s+([+-]\d+)$/);
        if (m && !/saldo|detalhe|ba[uú]|id|data/i.test(m[1])) {
          const rawItem = m[1].trim();
          const q = parseInt(m[2], 10);
          if (!isNaN(q) && rawItem.length > 1) {
            items.push({
              name: rawItem,
              qtyChange: q,
              mappedTo: cleanItem(rawItem),
            });
          }
        }
      }
    }

    setSimulatedResult({
      authorName,
      playerId,
      isTransfer,
      fromBau,
      toBau,
      detectedBau,
      isBauManual,
      channelBound,
      targetBauObj,
      items,
      valid: items.length > 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HERO STRIP: TELEMETRIA, STATUS AO VIVO & KPIs OPERACIONAIS             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: STATUS DO BOT */}
        <Card className="surface-card border-border/80 shadow-sm relative overflow-hidden group">
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 transition-colors",
            isActive ? "bg-emerald-500" : "bg-rose-500"
          )} />
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
                Motor de Ingestão
              </span>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                )} />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 font-bold",
                    isActive
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                  )}
                >
                  {isActive ? "Ativo" : "Pausado"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {isActive ? "Monitoramento Contínuo" : "Ingestão Desativada"}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {channelId ? `Canal padrão: ${channelId.slice(0, 10)}...` : "Sem canal geral configurado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: COBERTURA DE BAÚS */}
        <Card className="surface-card border-border/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                Baús Ativos
              </span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px] px-1.5 py-0 font-bold">
                {baus.length} Baús
              </Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>{autoCount}</span>
                <span className="text-xs font-normal text-muted-foreground">Automáticos</span>
                <span className="text-muted-foreground/40">•</span>
                <span>{manualCount}</span>
                <span className="text-xs font-normal text-muted-foreground">Manuais</span>
              </p>
              <p className={cn(
                "text-[11px] font-medium flex items-center gap-1",
                noChannelCount > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"
              )}>
                {noChannelCount > 0 ? (
                  <>
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {noChannelCount} baú(s) automático(s) sem canal
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 shrink-0" />
                    Todos os baús automáticos vinculados
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: TELEMETRIA DA ÚLTIMA LOG */}
        <Card className="surface-card border-border/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Última Leitura
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-mono uppercase font-bold",
                  config?.last_status === "success"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : config?.last_status === "error"
                    ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                    : "border-border text-muted-foreground"
                )}
              >
                {config?.last_status || "Aguardando"}
              </Badge>
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-bold font-mono text-foreground truncate">
                <span>{config?.last_message_id ? `${config.last_message_id.slice(0, 12)}...` : "Nenhuma mensagem"}</span>
                {config?.last_message_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => copyToClipboard(config.last_message_id, "ID da Mensagem")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {config?.last_processed_at ? formatDate(config.last_processed_at) : "Sem histórico recente"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: INTEGRIDADE DE ESTOQUE */}
        <Card className="surface-card border-border/80 shadow-sm relative overflow-hidden group">
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 transition-colors",
            negativeProductsCount > 0 ? "bg-rose-500" : "bg-emerald-500"
          )} />
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Regra de Saldo
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-bold",
                  allowNegativeStock
                    ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                    : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                )}
              >
                {allowNegativeStock ? "Permissivo (< 0)" : "Travado em 0"}
              </Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {negativeProductsCount > 0 ? (
                  <span className="text-rose-400">{negativeProductsCount} Negativo(s)</span>
                ) : (
                  <span className="text-emerald-400">100% Consistente</span>
                )}
              </p>
              <div className="flex items-center justify-between pt-0.5">
                <p className="text-[11px] text-muted-foreground">
                  {allowNegativeStock ? "Permite retiradas abaixo de 0" : "Retiradas excedentes truncam a 0"}
                </p>
                {negativeProductsCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sanitizeMutation.isPending}
                    onClick={() => sanitizeMutation.mutate()}
                    className="h-5 text-[10px] font-bold border-rose-500/40 text-rose-400 hover:bg-rose-500/20 px-1.5"
                  >
                    {sanitizeMutation.isPending ? "Zerando..." : "Zerar"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 2. PARÂMETROS GLOBAIS DE INTEGRAÇÃO & REGRAS DO MOTOR                    */}
      {/* ========================================================================= */}
      <Card className="surface-card border-border/80 shadow-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Bot className="w-5 h-5 text-primary" />
                Parâmetros Globais & Infraestrutura Discord
              </CardTitle>
              <CardDescription className="text-xs">
                Configurações centrais do servidor, canal de fallback padrão e políticas operacionais do motor de estoque.
              </CardDescription>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90 font-bold text-xs gap-1.5 shadow-sm w-full sm:w-auto"
              disabled={saveConfigMutation.isPending}
              onClick={() => saveConfigMutation.mutate()}
            >
              {saveConfigMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Salvar Parâmetros Globais
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Guild ID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>ID do Servidor Discord (Guild ID)</span>
                {guildId && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {guildId.length} dígitos
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  className="font-mono text-xs pr-8 bg-background/50 focus:bg-background transition-colors"
                />
                {guildId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(guildId, "Guild ID")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                ID do servidor oficial onde o bot opera e monitora os canais de baús.
              </p>
            </div>

            {/* Canal Geral Fallback */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Canal Fallback / Geral de Logs</span>
                {channelId && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Configurado
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  placeholder="Ex: 998877665544332211"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="font-mono text-xs pr-8 bg-background/50 focus:bg-background transition-colors"
                />
                {channelId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(channelId, "ID do Canal")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Usado como canal principal ou de contingência quando a mensagem não vier de canal exclusivo.
              </p>
            </div>

            {/* Baú Padrão */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Baú de Destino Padrão (Fallback)
              </Label>
              <Select value={defaultBauId} onValueChange={setDefaultBauId}>
                <SelectTrigger className="text-xs bg-background/50 focus:bg-background font-medium">
                  <SelectValue placeholder="Selecione o baú padrão..." />
                </SelectTrigger>
                <SelectContent>
                  {baus.filter((b) => b.ativo).length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">Nenhum baú ativo</div>
                  ) : (
                    baus.filter((b) => b.ativo).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-2">
                          <BauIcon
                            foto_url={b.foto_url || b.imagem_url}
                            icone={b.icone}
                            nome={b.nome}
                            className="w-4 h-4 rounded-xs"
                          />
                          <span>{b.nome}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({b.tipo_gestao === "manual" ? "✍️ Manual" : "🤖 Auto"})
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Baú atribuído caso a mensagem do Discord não pertença ao canal de nenhum baú específico.
              </p>
            </div>
          </div>

          {/* Cards de Políticas e Regras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            {/* Toggle 1: Ingestão Ativa */}
            <div className={cn(
              "p-4 rounded-xl border transition-all flex items-start justify-between gap-3",
              isActive
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-secondary/20 border-border/60"
            )}>
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold text-foreground cursor-pointer" onClick={() => setIsActive(!isActive)}>
                    Processamento Automático Contínuo
                  </Label>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold px-1.5 py-0",
                    isActive ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-border text-muted-foreground"
                  )}>
                    {isActive ? "Ligado" : "Desligado"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Quando ativado, o bot lê e processa as mensagens de movimentação em tempo real, atualizando o saldo dos baús automaticamente.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} className="mt-0.5 shrink-0" />
            </div>

            {/* Toggle 2: Permitir Estoque Negativo */}
            <div className={cn(
              "p-4 rounded-xl border transition-all flex items-start justify-between gap-3",
              allowNegativeStock
                ? "bg-amber-500/5 border-amber-500/30"
                : "bg-emerald-500/5 border-emerald-500/30"
            )}>
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold text-foreground cursor-pointer" onClick={() => setAllowNegativeStock(!allowNegativeStock)}>
                    Política de Saldo Negativo
                  </Label>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold px-1.5 py-0",
                    allowNegativeStock
                      ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  )}>
                    {allowNegativeStock ? "Permite (< 0)" : "Bloqueia (Mínimo 0)"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {allowNegativeStock
                    ? "Permissivo: retiradas maiores que o estoque deixam o produto negativo no banco para auditoria de desvio."
                    : "Seguro: retiradas que ultrapassem o saldo gravam a saída, mas limitam o saldo final em zero (evita números irreais)."}
                </p>
              </div>
              <Switch checked={allowNegativeStock} onCheckedChange={setAllowNegativeStock} className="mt-0.5 shrink-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 3. GESTÃO INTELIGENTE DE BAÚS & CANAIS EXCLUSIVOS DO DISCORD              */}
      {/* ========================================================================= */}
      <Card className="surface-card border-border/80 shadow-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Canais do Discord & Modo de Movimentação por Baú
                </CardTitle>
                {modifiedBausCount > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-400 bg-amber-500/10 animate-pulse">
                    ● {modifiedBausCount} alteração(ões) pendente(s)
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                As mensagens do Cidade Alta trazem apenas o texto genérico <code>📦 Baú</code>. O <strong>canal exclusivo</strong> onde a mensagem é postada determina qual baú recebe a movimentação.
              </CardDescription>
            </div>

            <Button
              className={cn(
                "font-bold text-xs gap-1.5 shadow-sm transition-all w-full md:w-auto",
                modifiedBausCount > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              disabled={isSavingAllBaus || baus.length === 0}
              onClick={handleSaveAllBaus}
            >
              {isSavingAllBaus ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              {modifiedBausCount > 0 ? `Salvar Todos (${modifiedBausCount} pendentes)` : "Salvar Todos os Baús"}
            </Button>
          </div>

          {/* BARRA DE FILTROS & BUSCA RÁPIDA DE BAÚS */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Input de Busca */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar baú por nome ou canal..."
                value={bauSearch}
                onChange={(e) => setBauSearch(e.target.value)}
                className="pl-8.5 h-9 text-xs bg-background/50 focus:bg-background"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/50">
              <Button
                variant={bauFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBauFilter("all")}
                className="h-7 text-xs font-semibold px-2.5 rounded-lg"
              >
                Todos ({baus.length})
              </Button>
              <Button
                variant={bauFilter === "auto" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBauFilter("auto")}
                className="h-7 text-xs font-semibold px-2.5 rounded-lg gap-1"
              >
                🤖 Auto ({autoCount})
              </Button>
              <Button
                variant={bauFilter === "manual" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBauFilter("manual")}
                className="h-7 text-xs font-semibold px-2.5 rounded-lg gap-1"
              >
                ✍️ Manual ({manualCount})
              </Button>
              {noChannelCount > 0 && (
                <Button
                  variant={bauFilter === "no-channel" ? "destructive" : "ghost"}
                  size="sm"
                  onClick={() => setBauFilter("no-channel")}
                  className={cn(
                    "h-7 text-xs font-semibold px-2.5 rounded-lg gap-1",
                    bauFilter !== "no-channel" && "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                  )}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Sem Canal ({noChannelCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {baus.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
              <Boxes className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">Nenhum baú cadastrado no sistema.</p>
              <p className="text-[11px]">Crie baús na aba de Gestão de Baús para configurar a sincronização.</p>
            </div>
          ) : filteredBaus.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-xs space-y-2">
              <Search className="w-6 h-6 text-muted-foreground/40 mx-auto" />
              <p>Nenhum baú encontrado com os filtros selecionados.</p>
              <Button variant="outline" size="sm" onClick={() => { setBauSearch(""); setBauFilter("all"); }} className="text-xs">
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBaus.map((b) => {
                const bCfg = bauConfigs[b.id] || {
                  tipo_gestao: b.tipo_gestao || "automatico",
                  discord_channel_id: b.discord_channel_id || "",
                  discord_guild_id: b.discord_guild_id || "",
                  is_saving: false,
                };
                const isAuto = bCfg.tipo_gestao === "automatico";
                const isModified = isBauModified(b.id);
                const hasChannel = Boolean(bCfg.discord_channel_id?.trim());

                return (
                  <div
                    key={b.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all space-y-4 flex flex-col justify-between relative group",
                      isModified
                        ? "bg-amber-500/5 border-amber-500/50 shadow-md"
                        : isAuto
                        ? "bg-secondary/25 border-border/80 hover:border-primary/50 hover:bg-secondary/35 shadow-xs"
                        : "bg-secondary/15 border-border/60 hover:border-border hover:bg-secondary/25"
                    )}
                  >
                    {/* Header do Card */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-secondary/80 border border-border/70 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                            <BauIcon
                              foto_url={b.foto_url || b.imagem_url}
                              icone={b.icone}
                              nome={b.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate tracking-tight">
                              {b.nome}
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {b.capacidade_maxima ? `${b.capacidade_maxima} slots` : "Capacidade Livre"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isModified && (
                            <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">
                              Modificado
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-bold px-1.5 py-0",
                              b.ativo
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-muted text-muted-foreground"
                            )}
                          >
                            {b.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>

                      {/* Segmented Control do Modo de Gestão */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground block">
                          Modo Operacional de Movimentação:
                        </Label>
                        <div className="grid grid-cols-2 p-1 rounded-xl bg-background/60 border border-border/60 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setBauConfigs((prev) => ({
                                ...prev,
                                [b.id]: {
                                  ...(prev[b.id] || {
                                    tipo_gestao: "automatico",
                                    discord_channel_id: "",
                                    discord_guild_id: "",
                                  }),
                                  tipo_gestao: "automatico",
                                },
                              }));
                            }}
                            className={cn(
                              "text-xs font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              isAuto
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                            )}
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>Automático</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setBauConfigs((prev) => ({
                                ...prev,
                                [b.id]: {
                                  ...(prev[b.id] || {
                                    tipo_gestao: "manual",
                                    discord_channel_id: "",
                                    discord_guild_id: "",
                                  }),
                                  tipo_gestao: "manual",
                                },
                              }));
                            }}
                            className={cn(
                              "text-xs font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              !isAuto
                                ? "bg-secondary text-foreground shadow-xs border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                            )}
                          >
                            <span>✍️ Manual</span>
                          </button>
                        </div>
                      </div>

                      {/* Configuração dos Canais (se Automático) ou Info (se Manual) */}
                      {isAuto ? (
                        <div className="space-y-2.5 pt-1">
                          {/* ID do Canal Discord */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                              <span>Canal do Discord (Exclusivo):</span>
                              {hasChannel ? (
                                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Vinculado
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Necessário
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                placeholder="ID do canal exclusivo..."
                                value={bCfg.discord_channel_id}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBauConfigs((prev) => ({
                                    ...prev,
                                    [b.id]: {
                                      ...(prev[b.id] || {
                                        tipo_gestao: "automatico",
                                        discord_channel_id: "",
                                        discord_guild_id: "",
                                      }),
                                      discord_channel_id: val,
                                    },
                                  }));
                                }}
                                className={cn(
                                  "h-8.5 text-xs font-mono pr-8 transition-colors",
                                  hasChannel
                                    ? "bg-background/80 border-emerald-500/40 focus:border-emerald-500"
                                    : "bg-background/80 border-amber-500/50 focus:border-amber-500"
                                )}
                              />
                              {hasChannel && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => copyToClipboard(bCfg.discord_channel_id, "ID do Canal")}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              O bot captura logs postadas neste canal e credita/debita neste baú.
                            </p>
                          </div>

                          {/* ID do Servidor (Opcional/Customizado) */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                              <span>ID do Servidor (Guild ID):</span>
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {bCfg.discord_guild_id ? "Customizado" : "Padrão"}
                              </span>
                            </Label>
                            <Input
                              placeholder={guildId || "Opcional (herda padrão geral)"}
                              value={bCfg.discord_guild_id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBauConfigs((prev) => ({
                                  ...prev,
                                  [b.id]: {
                                    ...(prev[b.id] || {
                                      tipo_gestao: "automatico",
                                      discord_channel_id: "",
                                      discord_guild_id: "",
                                    }),
                                    discord_guild_id: val,
                                  },
                                }));
                              }}
                              className="h-8 text-xs font-mono bg-background/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-background/40 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>✍️ Modo 100% Manual</span>
                          </p>
                          <p className="text-[10px] leading-relaxed">
                            As movimentações deste baú são lançadas pelos membros via painel web. O bot do Discord ignora este baú.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botão Individual de Salvar */}
                    <div className="pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant={isModified ? "default" : "outline"}
                        className={cn(
                          "w-full h-8 text-xs font-bold gap-1.5 rounded-xl cursor-pointer transition-all",
                          isModified ? "bg-amber-500 hover:bg-amber-600 text-black shadow-xs" : ""
                        )}
                        disabled={bCfg.is_saving}
                        onClick={() => handleSaveSingleBau(b.id)}
                      >
                        {bCfg.is_saving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {isModified ? "Salvar Alterações" : "Salvar Configuração"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 4. MAPEAMENTO DE ALIASES / NOMES DE ITENS (DISCORD ➔ SISTEMA)             */}
      {/* ========================================================================= */}
      <Card className="surface-card border-border/80 shadow-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  Mapeamento de Aliases & Nomes de Itens
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                  {Object.keys(itemMappings).length} aliases
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Mapeie como os itens são nomeados nas mensagens do Discord para os produtos cadastrados no Twin Wheels.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 border-border/80 hover:bg-secondary/40 w-full sm:w-auto"
              disabled={isSavingItemMappings}
              onClick={() => void handleSaveAllItemMappings()}
            >
              {isSavingItemMappings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Todos Mapeamentos
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-6">
          {/* Formulário de Adicionar Mapeamento */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" />
              Adicionar Novo Mapeamento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Texto da Mensagem no Discord (Alias)
                </Label>
                <Input
                  placeholder="Ex: 'Micro Uzi', 'Maconha', 'C4'..."
                  value={newAliasKey}
                  onChange={(e) => setNewAliasKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddItemMapping();
                    }
                  }}
                  className="h-9 text-xs font-medium bg-background/60"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Produto Equivalente no Sistema
                </Label>
                <Select value={newAliasTargetProduct} onValueChange={setNewAliasTargetProduct}>
                  <SelectTrigger className="h-9 text-xs bg-background/60 font-medium">
                    <SelectValue placeholder="Selecione o produto do sistema..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {products.filter((p) => p.ativo !== false && p.nome?.trim()).length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">Nenhum produto cadastrado</div>
                    ) : (
                      products
                        .filter((p) => p.ativo !== false && p.nome?.trim())
                        .map((p) => (
                          <SelectItem key={p.id} value={p.nome}>
                            <span className="flex items-center gap-2">
                              <ProductThumbnail
                                imageUrl={p.foto_url || p.imagem_url}
                                name={p.nome}
                                size="xs"
                                className="shrink-0 rounded-xs"
                              />
                              <span>{p.nome}</span>
                            </span>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Button
                  onClick={() => void handleAddItemMapping()}
                  className="w-full h-9 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mapear
                </Button>
              </div>
            </div>
          </div>

          {/* Barra de Busca de Mapeamentos */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar apelido ou produto..."
                value={aliasSearch}
                onChange={(e) => setAliasSearch(e.target.value)}
                className="pl-8.5 h-8.5 text-xs bg-background/50 focus:bg-background"
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              Exibindo <strong>{filteredItemMappings.length}</strong> de <strong>{Object.keys(itemMappings).length}</strong> mapeamentos
            </span>
          </div>

          {/* Grid de Mapeamentos */}
          {filteredItemMappings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs space-y-1 rounded-xl border border-dashed border-border/80">
              <FileCode className="w-6 h-6 text-muted-foreground/40 mx-auto" />
              <p>Nenhum mapeamento encontrado.</p>
              {aliasSearch ? (
                <Button variant="ghost" size="sm" onClick={() => setAliasSearch("")} className="text-xs">
                  Limpar busca
                </Button>
              ) : (
                <p className="text-[11px]">Itens com nome idêntico ao do cadastro são interpretados automaticamente.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredItemMappings.map(([k, v]) => {
                const matchedProd = products.find((p) => p.nome.toLowerCase() === v.toLowerCase());
                return (
                  <div
                    key={k}
                    className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 hover:border-primary/40 hover:bg-secondary/40 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-mono text-xs font-semibold text-foreground truncate max-w-[110px]" title={k}>
                        {k}
                      </div>
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      <div className="flex items-center gap-1.5 min-w-0">
                        {matchedProd && (
                          <ProductThumbnail
                            imageUrl={matchedProd.foto_url || matchedProd.imagem_url}
                            name={v}
                            size="xs"
                            className="shrink-0 rounded-xs"
                          />
                        )}
                        <span className="text-xs font-bold text-foreground truncate max-w-[120px]" title={v}>
                          {v}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 shrink-0 cursor-pointer"
                      onClick={() => void handleRemoveItemMapping(k)}
                      title={`Remover alias ${k}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 5. VALIDADOR & SIMULADOR DE EXPRESSÕES REGULARES DE LOGS                   */}
      {/* ========================================================================= */}
      <Card className="surface-card border-border/80 shadow-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Terminal className="w-5 h-5 text-emerald-400" />
                Validador Rápido de Parser de Logs (Cidade Alta APP)
              </CardTitle>
              <CardDescription className="text-xs">
                Teste como o regex do motor de ingestão interpreta mensagens brutas e mapeia cada item para o baú selecionado.
              </CardDescription>
            </div>

            <Button
              onClick={handleTestParser}
              className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0 cursor-pointer w-full sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Executar Interpretação
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Seletor de Baú Alvo para Teste */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground">
                Baú Alvo da Mensagem (Resolução por Canal):
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Como a log exibe apenas <code>📦 Baú</code>, o canal onde a mensagem foi postada determina o baú de destino.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Select value={selectedSimBauId} onValueChange={setSelectedSimBauId}>
                <SelectTrigger className="h-9 text-xs bg-background/60 font-medium">
                  <SelectValue placeholder="Selecione o baú para teste..." />
                </SelectTrigger>
                <SelectContent>
                  {baus.filter((b) => b.ativo).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-2">
                        <BauIcon
                          foto_url={b.foto_url || b.imagem_url}
                          icone={b.icone}
                          nome={b.nome}
                          className="w-4 h-4 rounded-xs"
                        />
                        <span>{b.nome}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({b.tipo_gestao === "manual" ? "✍️ Manual" : "🤖 Auto"})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor de Mensagem Bruta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Conteúdo da Mensagem da Log
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {testLogText.length} caracteres
                </span>
              </div>
              <Textarea
                rows={9}
                value={testLogText}
                onChange={(e) => setTestLogText(e.target.value)}
                className="font-mono text-xs bg-background/70 border-border/70 resize-none leading-relaxed"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-6.5 px-2 text-muted-foreground hover:text-cyan-400 bg-secondary/30 hover:bg-secondary/60 rounded-md"
                  onClick={() =>
                    setTestLogText(
                      "Andrew Delucca Ferreira • ID 274\n📦 Baú\n\n📊 Saldo líquido\nMetanfetamina -72\nCocaína -126\n\n🧾 Detalhes da movimentação\nMetanfetamina\n↳ -72 removidos\nCocaína\n↳ -126 removidos\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 19:21"
                    )
                  }
                >
                  Template: Drogas (-)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-6.5 px-2 text-muted-foreground hover:text-emerald-400 bg-secondary/30 hover:bg-secondary/60 rounded-md"
                  onClick={() =>
                    setTestLogText(
                      "Andrew Delucca Ferreira • ID 274\n📦 Baú\n\n📊 Saldo líquido\nLockpick +50\nColete Balístico +10\n\n🧾 Detalhes da movimentação\nLockpick\n↳ +50 adicionados\nColete Balístico\n↳ +10 adicionados\nMovimentações agrupadas em uma janela de 30 segundos • Hoje às 20:15"
                    )
                  }
                >
                  Template: Entrada (+)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-6.5 px-2 text-muted-foreground hover:text-amber-400 bg-secondary/30 hover:bg-secondary/60 rounded-md"
                  onClick={() =>
                    setTestLogText("Transferência: BAÚ QG -> Baú Casa\nSaldo líquido: Micro Uzi +2\nID: 88")
                  }
                >
                  Template: Transferência
                </Button>
              </div>
            </div>

            {/* Painel de Diagnóstico */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Diagnóstico & Resultado da Interpretação
              </Label>
              <div className="rounded-2xl border border-border/80 bg-background/60 p-4 min-h-[220px] text-xs space-y-3">
                {!simulatedResult ? (
                  <div className="text-center pt-14 space-y-2 text-muted-foreground">
                    <Terminal className="w-8 h-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs font-medium">Nenhuma simulação executada.</p>
                    <p className="text-[11px]">Clique em "Executar Interpretação" para analisar o texto.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <span className="text-muted-foreground font-medium">Status do Parser:</span>
                      {simulatedResult.valid ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Válido para Gravação
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 gap-1 font-bold">
                          <XCircle className="w-3 h-3" /> Nenhum item identificado
                        </Badge>
                      )}
                    </div>

                    {/* Alerta de Modo Operacional */}
                    {simulatedResult.isBauManual ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <strong>Baú Configurado como Manual:</strong> O bot ignorará esta mensagem e não registrará movimentação no banco.
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2">
                        <Bot className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <strong>Baú Automático:</strong> Mensagens postadas no canal correspondente são debitadas/creditadas automaticamente.
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">Jogador / Autor:</span>
                        <p className="text-foreground font-bold truncate">
                          {simulatedResult.authorName ? `${simulatedResult.authorName} ` : ""}
                          {simulatedResult.playerId ? `(ID ${simulatedResult.playerId})` : "Não detectado"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">Baú Resolvido:</span>
                        <p className="text-foreground font-bold truncate">
                          {simulatedResult.isTransfer
                            ? `${simulatedResult.fromBau} ➔ ${simulatedResult.toBau}`
                            : simulatedResult.detectedBau}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">Canal do Baú:</span>
                        <p className="text-foreground font-mono truncate">
                          {simulatedResult.channelBound || "Nenhum canal"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">Itens Identificados:</span>
                        <p className="text-foreground font-bold">
                          {simulatedResult.items.length} item(ns)
                        </p>
                      </div>
                    </div>

                    {simulatedResult.items.length > 0 && (
                      <div className="pt-2 border-t border-border/40 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Movimentações Detectadas:
                        </span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {simulatedResult.items.map((item: any, idx: number) => {
                            const isSaida = item.qtyChange < 0;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs font-mono bg-secondary/30 px-2.5 py-1.5 rounded-lg border border-border/40"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] px-1 py-0 uppercase font-bold",
                                      isSaida
                                        ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                        : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                    )}
                                  >
                                    {isSaida ? "Saída" : "Entrada"}
                                  </Badge>
                                  <span className="truncate">
                                    {item.name}
                                    {item.mappedTo !== item.name && (
                                      <span className="text-primary font-bold ml-1">➔ {item.mappedTo}</span>
                                    )}
                                  </span>
                                </div>
                                <span className={cn("font-bold text-xs shrink-0 ml-2", isSaida ? "text-rose-400" : "text-emerald-400")}>
                                  {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// TAB 3: LOGS TÉCNICAS & AUDITORIA (LIVE 20 MENSAGENS EM TEMPO REAL)
// ============================================================================
function DiscordLogsTab() {
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: members = [] } = useMembers();
  const { data: discordConfig } = useDiscordStockConfig();

  // Helper para resolver se o jogador é membro do painel ou Sistema Twin Wheels
  const resolveActor = (playerId?: string | null, rawAuthorName?: string | null) => {
    let matchedMember = undefined;

    // 1. Tenta vincular pelo ID in-game do personagem (game_id)
    if (playerId && String(playerId).trim()) {
      const pIdStr = String(playerId).trim();
      matchedMember = members.find((m) => m.game_id && String(m.game_id).trim() === pIdStr);
    }

    // 2. Se não encontrou por ID, tenta por Nome ou Nickname
    if (!matchedMember && rawAuthorName && rawAuthorName.trim() && rawAuthorName.trim() !== "Sistema Twin Wheels") {
      const cleanName = rawAuthorName.trim().toLowerCase();
      matchedMember = members.find(
        (m) =>
          m.nome.toLowerCase() === cleanName ||
          (m.nickname && m.nickname.toLowerCase() === cleanName)
      );
    }

    if (matchedMember) {
      return {
        isMember: true,
        member: matchedMember,
        displayName: matchedMember.nome,
        nickname: matchedMember.nickname,
        gameId: matchedMember.game_id || playerId,
      };
    }

    // Se NÃO for membro do painel, autor é "Sistema Twin Wheels"
    return {
      isMember: false,
      member: null,
      displayName: "Sistema Twin Wheels",
      nickname: null,
      gameId: playerId || null,
    };
  };

  const itemMappings = useMemo(() => {
    return (discordConfig?.item_mappings as Record<string, string>) || {};
  }, [discordConfig]);

  // Live Messages State
  const autoBausWithChannel = useMemo(() => {
    return baus.filter((b) => b.ativo && b.discord_channel_id?.trim());
  }, [baus]);

  const [selectedLiveBauId, setSelectedLiveBauId] = useState<string>("");

  useEffect(() => {
    if (!selectedLiveBauId && autoBausWithChannel.length > 0) {
      setSelectedLiveBauId(autoBausWithChannel[0]!.id);
    }
  }, [autoBausWithChannel, selectedLiveBauId]);

  const selectedLiveBau = baus.find((b) => b.id === selectedLiveBauId);
  const targetChannelId = selectedLiveBau?.discord_channel_id?.trim() || "";

  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastLiveFetchTime, setLastLiveFetchTime] = useState<Date | null>(null);
  const [selectedLiveMsgForInspect, setSelectedLiveMsgForInspect] = useState<any | null>(null);

  // Parser client-side para as mensagens do canal
  const parseClientMessage = (msg: any) => {
    const rawContent = msg.content || "";
    const embeds = Array.isArray(msg.embeds) ? msg.embeds : [];
    const firstEmbed = embeds[0] || null;

    let authorName = firstEmbed?.author?.name || msg.author?.displayName || msg.author?.username || "";
    let playerId: string | null = null;

    const authorPattern = /(?:^|\n)\s*([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s*[•\|\-]\s*(?:ID|Passaporte)?\s*(\d+)/i;
    const authorMatch = (authorName || rawContent).match(authorPattern);
    if (authorMatch) {
      if (!authorName) authorName = authorMatch[1].trim();
      playerId = authorMatch[2].trim();
    } else {
      const idMatch = (authorName || rawContent).match(/ID\s*[:#]?\s*(\d+)/i) || (authorName || rawContent).match(/Passaporte\s*[:#]?\s*(\d+)/i);
      if (idMatch) playerId = idMatch[1];
    }

    const cleanItemName = (rawItem: string) => {
      const clean = rawItem.replace(/^[\s\-•\*\>]+/, "").trim();
      const lower = clean.toLowerCase();
      if (itemMappings[lower]) return itemMappings[lower];
      for (const [k, v] of Object.entries(itemMappings)) {
        if (k.trim().toLowerCase() === lower) return v;
      }
      const matchedProd = products.find(
        (p) =>
          p.ativo !== false &&
          (p.nome.trim().toLowerCase() === lower ||
            (p.cda_name &&
              p.cda_name
                .split(/[,;\n|]+/)
                .some((a) => a.trim().toLowerCase() === lower)))
      );
      if (matchedProd) return matchedProd.nome;
      return clean;
    };

    const parsedItems: Array<{ name: string; mappedTo: string; qtyChange: number }> = [];

    // 1. Processar campos de Embeds (Cidade Alta APP)
    if (firstEmbed && Array.isArray(firstEmbed.fields)) {
      for (const field of firstEmbed.fields) {
        const fieldName = (field.name || "").toLowerCase();
        const fieldValue = field.value || "";

        if (fieldName.includes("saldo") || fieldName.includes("líquido") || fieldName.includes("liquido")) {
          const lines = fieldValue.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            const cleanLine = line.replace(/[\*\_`]/g, "").trim();
            const m = cleanLine.match(/^(.+?)\s*([+-]\s*\d+)$/);
            if (m) {
              const rawItem = m[1].trim();
              const qty = parseInt(m[2].replace(/\s+/g, ""), 10);
              if (!isNaN(qty) && rawItem.length > 1) {
                parsedItems.push({
                  name: rawItem,
                  mappedTo: cleanItemName(rawItem),
                  qtyChange: qty,
                });
              }
            }
          }
        }
      }
    }

    // 2. Se não encontrou nos fields, processar o corpo da mensagem ou descrição do embed
    if (parsedItems.length === 0) {
      const fullText = [rawContent, firstEmbed?.description || ""].filter(Boolean).join("\n");
      const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      let inSaldo = false;
      for (const rawLine of lines) {
        const line = rawLine.replace(/[\*\_`]/g, "").trim();
        if (/saldo\s*l[ií]quido/i.test(line)) {
          inSaldo = true;
          const inline = line.match(/saldo\s*l[ií]quido\s*[:\-]?\s*(.+?)\s*([+-]\s*\d+)$/i);
          if (inline) {
            const rawItem = inline[1].trim();
            const q = parseInt(inline[2].replace(/\s+/g, ""), 10);
            if (!isNaN(q)) {
              parsedItems.push({
                name: rawItem,
                mappedTo: cleanItemName(rawItem),
                qtyChange: q,
              });
            }
          }
          continue;
        }

        if (/detalhes\s*da\s*movimenta[cç][aã]o/i.test(line)) {
          inSaldo = false;
          continue;
        }

        if (inSaldo) {
          const m = line.match(/^(.+?)\s*[:\-]?\s*([+-]\s*\d+)$/);
          if (m) {
            const rawItem = m[1].trim();
            const q = parseInt(m[2].replace(/\s+/g, ""), 10);
            if (!isNaN(q) && rawItem.length > 1) {
              parsedItems.push({
                name: rawItem,
                mappedTo: cleanItemName(rawItem),
                qtyChange: q,
              });
            }
          }
        } else {
          const m = line.match(/^([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s+([+-]\d+)$/);
          if (m && !/saldo|detalhe|ba[uú]|id|data/i.test(m[1])) {
            const rawItem = m[1].trim();
            const q = parseInt(m[2], 10);
            if (!isNaN(q) && rawItem.length > 1) {
              parsedItems.push({
                name: rawItem,
                mappedTo: cleanItemName(rawItem),
                qtyChange: q,
              });
            }
          }
        }
      }
    }

    return {
      authorName,
      playerId,
      parsedItems,
      isValidMovement: parsedItems.length > 0,
    };
  };

  // Buscar as últimas 20 mensagens do canal no Discord sem salvar no BD
  const handleFetchLiveMessages = async () => {
    if (!targetChannelId) {
      toast.error("Selecione um baú com ID de canal do Discord configurado.");
      return;
    }

    setIsLoadingLive(true);
    setLiveError(null);

    try {
      // 1. Tenta buscar via endpoint do bot Discloud
      let messages: any[] = [];
      // 1. Consulta via endpoint do bot Discloud
      try {
        const res = await fetch(`https://twin.discloud.app/api/channel-messages?channelId=${targetChannelId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            messages = data.messages;
          }
        }
      } catch {}

      // 2. Fallback via proxy ou env se disponível
      if (messages.length === 0) {
        const clientToken = (import.meta as any).env?.VITE_DISCORD_BOT_TOKEN;
        if (clientToken) {
          const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages?limit=20`, {
            headers: {
              Authorization: `Bot ${clientToken}`,
            },
          });
          if (res.ok) {
            messages = await res.json();
          }
        }
      }

      if (messages.length === 0 && !liveMessages.length) {
        // Se o bot estiver iniciando na Discloud, exibe aviso amigavel
        setLiveError("O bot na Discloud está iniciando ou o canal não possui mensagens recentes.");
      }

      setLiveMessages(Array.isArray(messages) ? messages : []);
      setLastLiveFetchTime(new Date());
      toast.success(`${messages.length} mensagens recuperadas em tempo real do canal!`);
    } catch (err: any) {
      setLiveError(err.message || "Não foi possível carregar as mensagens do canal.");
      toast.error(err.message || "Erro ao consultar mensagens do canal.");
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (targetChannelId) {
      void handleFetchLiveMessages();
    }
  }, [targetChannelId]);

  return (
    <div className="space-y-4">
      {/* FEED LIVE DO CANAL DO DISCORD (SEM PERSISTÊNCIA NO BD) */}
      <Card className="surface-card border-border/80 shadow-lg">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Feed Live do Canal do Discord (Últimas 20 Mensagens)
                </CardTitle>
                {lastLiveFetchTime && (
                  <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground border-border/60">
                    Última leitura: {lastLiveFetchTime.toLocaleTimeString("pt-BR")}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Consulta direta à API do Discord sem gravar registros no banco de dados. Ideal para conferência e auditoria ao vivo.
              </CardDescription>
            </div>

            {/* Seletor de Baú / Canal + Botão de Atualização */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="w-full sm:w-64">
                <Select value={selectedLiveBauId} onValueChange={setSelectedLiveBauId}>
                  <SelectTrigger className="h-9 text-xs bg-background/60 font-medium w-full">
                    <SelectValue placeholder="Selecione o baú..." />
                  </SelectTrigger>
                  <SelectContent>
                    {autoBausWithChannel.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        Nenhum baú com canal vinculado
                      </div>
                    ) : (
                      autoBausWithChannel.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <span className="flex items-center gap-1.5">
                            <BauIcon
                              foto_url={b.foto_url || b.imagem_url}
                              icone={b.icone}
                              nome={b.nome}
                              className="w-4 h-4 rounded-xs"
                            />
                            <span>{b.nome}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({b.discord_channel_id})
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleFetchLiveMessages}
                disabled={isLoadingLive || !targetChannelId}
                className="h-9 text-xs gap-1.5 font-bold border-primary/40 hover:bg-primary/10 text-primary cursor-pointer w-full sm:w-auto"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoadingLive && "animate-spin")} />
                {isLoadingLive ? "Consultando Discord..." : "Buscar 20 Mensagens"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingLive ? (
            <div className="p-14 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Carregando as 20 mensagens mais recentes do canal no Discord...</span>
            </div>
          ) : liveError ? (
            <div className="p-8 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-400 font-semibold">{liveError}</p>
              <Button size="sm" variant="outline" onClick={handleFetchLiveMessages} className="text-xs mt-2">
                Tentar Novamente
              </Button>
            </div>
          ) : liveMessages.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Radio className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p>Nenhuma mensagem retornada para o canal selecionado ({targetChannelId || "Nenhum canal"}).</p>
              <p className="text-[10px]">Certifique-se de que o bot possui permissão de leitura de mensagens e histórico no canal.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="block sm:hidden divide-y divide-border/40">
                {liveMessages.map((msg) => {
                  const parsed = parseClientMessage(msg);
                  const msgDate = msg.createdTimestamp ? new Date(msg.createdTimestamp) : msg.createdAt ? new Date(msg.createdAt) : new Date();
                  const actor = resolveActor(parsed.playerId, parsed.authorName);

                  return (
                    <div key={msg.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatDate(msgDate.toISOString())}
                        </span>
                        {parsed.isValidMovement ? (
                          <Badge variant="outline" className="text-[9px] font-mono uppercase border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                            Válida
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-mono uppercase border-muted text-muted-foreground bg-secondary/40">
                            Informativo
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {actor.isMember && actor.member ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold px-1.5 py-0">
                                ID {actor.gameId}
                              </Badge>
                              <span className="text-foreground font-bold text-xs truncate">
                                {actor.displayName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold px-1.5 py-0">
                                🤖 {parsed.playerId ? `ID ${parsed.playerId}` : "Sistema"}
                              </Badge>
                              {parsed.authorName && parsed.authorName !== "Sistema Twin Wheels" && (
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {parsed.authorName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 px-2 shrink-0"
                          onClick={() => setSelectedLiveMsgForInspect(msg)}
                        >
                          <Eye className="w-3 h-3 text-primary" />
                          JSON
                        </Button>
                      </div>

                      {parsed.parsedItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {parsed.parsedItems.map((it, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={cn(
                                "text-[10px] font-mono",
                                it.qtyChange > 0
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                  : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                              )}
                            >
                              {it.mappedTo} {it.qtyChange > 0 ? `+${it.qtyChange}` : it.qtyChange}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                          {msg.content || (msg.embeds?.[0]?.title ? `Embed: ${msg.embeds[0].title}` : "(Sem texto de saldo)")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto mobile-touch-scroll">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-secondary/20">
                      <TableHead className="text-xs">Data/Hora</TableHead>
                      <TableHead className="text-xs">ID Mensagem</TableHead>
                      <TableHead className="text-xs">Jogador / Autor</TableHead>
                      <TableHead className="text-xs">Itens / Saldo Detectado</TableHead>
                      <TableHead className="text-xs">Status do Parser</TableHead>
                      <TableHead className="text-xs text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveMessages.map((msg: any) => {
                      const parsed = parseClientMessage(msg);
                      const msgDate = msg.createdTimestamp ? new Date(msg.createdTimestamp) : msg.createdAt ? new Date(msg.createdAt) : new Date();

                      return (
                        <TableRow key={msg.id} className="border-border/30 hover:bg-secondary/20 transition-colors">
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground font-mono">
                            {formatDate(msgDate.toISOString())}
                          </TableCell>

                          <TableCell className="text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <span className="text-foreground">{msg.id?.slice(0, 10)}...</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.id || "");
                                  toast.success("ID da mensagem copiado!");
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            {(() => {
                              const actor = resolveActor(parsed.playerId, parsed.authorName);
                              if (actor.isMember && actor.member) {
                                return (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold px-1.5 py-0">
                                        ID {actor.gameId}
                                      </Badge>
                                      <span className="text-foreground font-bold truncate max-w-[140px]">
                                        {actor.displayName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <span className="text-emerald-400 font-medium">✓ Membro Painel</span>
                                      {actor.nickname && <span>• {actor.nickname}</span>}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold px-1.5 py-0">
                                      🤖 Sistema Twin Wheels
                                    </Badge>
                                    {parsed.playerId && (
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        (ID {parsed.playerId})
                                      </span>
                                    )}
                                  </div>
                                  {parsed.authorName && parsed.authorName !== "Sistema Twin Wheels" && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px] block" title={parsed.authorName}>
                                      Log: {parsed.authorName}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>

                          <TableCell className="text-xs">
                            {parsed.parsedItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {parsed.parsedItems.map((it, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] font-mono",
                                      it.qtyChange > 0
                                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                        : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                    )}
                                  >
                                    {it.mappedTo} {it.qtyChange > 0 ? `+${it.qtyChange}` : it.qtyChange}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px] truncate max-w-[200px] block italic">
                                {msg.content || (msg.embeds?.[0]?.title ? `Embed: ${msg.embeds[0].title}` : "(Sem texto de saldo)")}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-xs">
                            {parsed.isValidMovement ? (
                              <Badge variant="outline" className="text-[10px] font-mono uppercase border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Movimentação Válida
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-mono uppercase border-muted text-muted-foreground bg-secondary/40">
                                Informativo / Outro
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs hover:text-primary cursor-pointer"
                              onClick={() => setSelectedLiveMsgForInspect(msg)}
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              JSON Raw
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="p-3 border-t border-border/40 bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Exibindo <strong>{liveMessages.length}</strong> mensagens live do canal <code>{targetChannelId || "—"}</code>.
          </span>
          <span className="text-[11px] text-emerald-400/90 font-medium">
            🔒 100% em memória (sem inserção no banco de dados).
          </span>
        </CardFooter>
      </Card>

      {/* MODAL DE INSPEÇÃO TÉCNICA RAW (MENSAGEM LIVE) */}
      <Dialog open={Boolean(selectedLiveMsgForInspect)} onOpenChange={(open) => !open && setSelectedLiveMsgForInspect(null)}>
        <DialogContent className="max-w-2xl surface-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Inspeção Raw de Mensagem Live do Discord
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ID: <span className="font-mono text-foreground">{selectedLiveMsgForInspect?.id}</span> • Canal:{" "}
                  <span className="font-mono text-foreground">{targetChannelId}</span>
                </DialogDescription>
              </div>

              <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                TEMPO REAL (DISCORD API)
              </Badge>
            </div>
          </DialogHeader>

          {selectedLiveMsgForInspect && (
            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Resultado da Interpretação Client-Side</Label>
                <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs overflow-x-auto">
                  {JSON.stringify(parseClientMessage(selectedLiveMsgForInspect), null, 2)}
                </pre>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Objeto Completo da Mensagem (JSON)</Label>
                <pre className="p-3 rounded-lg bg-background/80 border border-border/60 text-foreground font-mono text-xs overflow-x-auto">
                  {JSON.stringify(selectedLiveMsgForInspect, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLiveMsgForInspect(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

