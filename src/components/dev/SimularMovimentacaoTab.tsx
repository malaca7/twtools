import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Bot,
  Send,
  Boxes,
  User,
  Hash,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  Package,
  Terminal,
  FileText,
  Eye,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBaus,
  useProducts,
  useProductBaus,
  useMembers,
  useDiscordStockConfig,
} from "@/hooks/useData";
import {
  sendSimulatedStockToDiscord,
  sendSimulatedStockViaWebhook,
  simulateDirectDbStockLog,
  type SimulatedStockItem,
  type SimulateStockResult,
} from "@/services/stockSimulatorService";
import { ProductThumbnail } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

interface SimularMovimentacaoTabProps {
  onNavigateToLogs?: () => void;
}

interface ItemRow {
  id: string;
  name: string;
  quantity: number;
  productId?: string;
}

export function SimularMovimentacaoTab({ onNavigateToLogs }: SimularMovimentacaoTabProps) {
  const queryClient = useQueryClient();
  const { data: baus = [] } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: productBaus = [] } = useProductBaus();
  const { data: members = [] } = useMembers();
  const { data: config } = useDiscordStockConfig();

  // Form State
  const [selectedBauId, setSelectedBauId] = useState<string>("");
  const [discordChannelId, setDiscordChannelId] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("Andrew Delucca Ferreira");
  const [gamePlayerId, setGamePlayerId] = useState<string>("274");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [timeString, setTimeString] = useState<string>("");
  const [useCurrentTime, setUseCurrentTime] = useState<boolean>(true);
  const [dispatchMethod, setDispatchMethod] = useState<"bot_http" | "webhook" | "direct_rpc">("bot_http");
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>("");

  // Items State
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", name: "Lockpick", quantity: 15 },
    { id: "2", name: "Barra Maciça", quantity: 1 },
  ]);

  // UI state
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SimulateStockResult | null>(null);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<"visual" | "raw">("visual");

  // Auto-select first active automatic bau and fill channel
  useEffect(() => {
    if (baus.length > 0 && !selectedBauId) {
      const firstAuto = baus.find((b) => b.ativo && b.tipo_gestao !== "manual") || baus[0];
      setSelectedBauId(firstAuto.id);
      if (firstAuto.discord_channel_id) {
        setDiscordChannelId(firstAuto.discord_channel_id);
      } else if (config?.channel_id) {
        setDiscordChannelId(config.channel_id);
      }
    }
  }, [baus, selectedBauId, config]);

  // Handle Baú change: auto-load channel
  const handleSelectBau = (bauId: string) => {
    setSelectedBauId(bauId);
    const found = baus.find((b) => b.id === bauId);
    if (found?.discord_channel_id) {
      setDiscordChannelId(found.discord_channel_id);
    } else if (config?.channel_id) {
      setDiscordChannelId(config.channel_id);
    }
  };

  // Handle Member selection
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (!memberId) return;
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setAuthorName(member.nome || member.nickname || "Membro");
      if (member.game_id) {
        setGamePlayerId(String(member.game_id));
      }
    }
  };

  const selectedBau = useMemo(() => {
    return baus.find((b) => b.id === selectedBauId) || baus[0];
  }, [baus, selectedBauId]);

  // Formatted time string
  const currentFormattedTime = useMemo(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `Hoje às ${hh}:${mm}`;
  }, []);

  const effectiveTimeString = useCurrentTime ? currentFormattedTime : (timeString || currentFormattedTime);

  // Quick Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case "print1":
        setAuthorName("Andrew Delucca Ferreira");
        setGamePlayerId("274");
        setItems([
          { id: "1", name: "Lockpick", quantity: 15 },
          { id: "2", name: "Barra Maciça", quantity: 1 },
        ]);
        toast.info("Preset 1 carregado: Lockpick (+15) e Barra Maciça (+1)");
        break;

      case "print2":
        setAuthorName("Medusa Toretto");
        setGamePlayerId("6079");
        setItems([{ id: "1", name: "Lockpick", quantity: -15 }]);
        toast.info("Preset 2 carregado: Lockpick (-15)");
        break;

      case "drugs":
        setAuthorName("Andrew Delucca Ferreira");
        setGamePlayerId("274");
        setItems([
          { id: "1", name: "Metanfetamina", quantity: 100 },
          { id: "2", name: "Cocaína", quantity: 50 },
        ]);
        toast.info("Preset Drogas carregado: Metanfetamina (+100) e Cocaína (+50)");
        break;

      case "tactical":
        setAuthorName("Medusa Toretto");
        setGamePlayerId("6079");
        setItems([
          { id: "1", name: "Lockpick", quantity: -5 },
          { id: "2", name: "Capuz", quantity: -2 },
        ]);
        toast.info("Preset Tático carregado: Lockpick (-5) e Capuz (-2)");
        break;

      case "clear":
        setItems([{ id: "1", name: "", quantity: 1 }]);
        break;
    }
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 7), name: "", quantity: 1 },
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("A movimentação precisa de pelo menos 1 item.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update Item Row
  const handleUpdateItem = (id: string, field: "name" | "quantity" | "productId", value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          return {
            ...it,
            productId: value,
            name: product ? (product.cda_name || product.nome) : it.name,
          };
        }
        return { ...it, [field]: value };
      })
    );
  };

  // Adjust item quantity with quick delta buttons (+1, +5, +15, -1, -5, -15)
  const handleAdjustQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, quantity: it.quantity + delta };
      })
    );
  };

  // Toggle item direction (+ / -)
  const handleToggleSign = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, quantity: -it.quantity };
      })
    );
  };

  // Generate Raw Discord Message Text
  const rawDiscordMarkdown = useMemo(() => {
    const validItems = items.filter((it) => it.name.trim() && it.quantity !== 0);
    const bauTitle = selectedBau?.nome || "Baú";
    const saldoLines = validItems.map((it) => {
      const sign = it.quantity > 0 ? `+${it.quantity}` : `${it.quantity}`;
      return `${it.name.trim()} \`${sign}\``;
    });

    const detalhesLines: string[] = [];
    validItems.forEach((it) => {
      detalhesLines.push(it.name.trim());
      if (it.quantity > 0) {
        const verb = it.quantity === 1 ? "adicionado" : "adicionados";
        detalhesLines.push(`↳ +${it.quantity} ${verb}`);
      } else {
        const absQty = Math.abs(it.quantity);
        const verb = absQty === 1 ? "removido" : "removidos";
        detalhesLines.push(`↳ -${absQty} ${verb}`);
      }
    });

    const authorTitle = gamePlayerId ? `${authorName} • ID ${gamePlayerId}` : authorName;

    return [
      authorTitle,
      `📦 ${bauTitle}`,
      "",
      "📊 Saldo líquido",
      saldoLines.join("\n"),
      "",
      "🧾 Detalhes da movimentação",
      detalhesLines.join("\n"),
      "",
      `Movimentações agrupadas em uma janela de 30 segundos • ${effectiveTimeString}`,
    ].join("\n");
  }, [items, selectedBau, authorName, gamePlayerId, effectiveTimeString]);

  // Copy raw markdown
  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawDiscordMarkdown);
    setCopiedRaw(true);
    toast.success("Texto bruto copiado para a área de transferência!");
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Execute Dispatch
  const handleDispatch = async (forceMethod?: "bot_http" | "direct_rpc") => {
    const methodToUse = forceMethod || dispatchMethod;
    const cleanItems: SimulatedStockItem[] = items
      .filter((it) => it.name.trim() && it.quantity !== 0)
      .map((it) => ({
        name: it.name.trim(),
        quantity: it.quantity,
      }));

    if (cleanItems.length === 0) {
      toast.error("Informe pelo menos 1 item com quantidade válida para movimentar.");
      return;
    }

    if (!authorName.trim()) {
      toast.error("Informe o nome do jogador/personagem.");
      return;
    }

    if (methodToUse !== "direct_rpc" && !discordChannelId.trim()) {
      toast.error("Informe o ID do canal do Discord para enviar a mensagem.");
      return;
    }

    setIsDispatching(true);
    setLastResult(null);

    const payload = {
      channelId: discordChannelId.trim(),
      authorName: authorName.trim(),
      gamePlayerId: gamePlayerId.trim() || undefined,
      bauName: selectedBau?.nome || "Baú",
      items: cleanItems,
      timeString: effectiveTimeString,
    };

    try {
      let result: SimulateStockResult;

      if (methodToUse === "direct_rpc") {
        result = await simulateDirectDbStockLog({
          ...payload,
          guildId: selectedBau?.discord_guild_id || config?.guild_id || undefined,
          defaultBauId: selectedBau?.id,
        });
      } else if (methodToUse === "webhook" && customWebhookUrl.trim()) {
        result = await sendSimulatedStockViaWebhook(customWebhookUrl.trim(), payload);
      } else {
        result = await sendSimulatedStockToDiscord(payload);
      }

      setLastResult(result);

      if (result.success) {
        toast.success(result.message || "Movimentação simulada disparada com sucesso!");
        // Invalidate queries to update all tables across the app
        void queryClient.invalidateQueries({ queryKey: ["movements"] });
        void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
        void queryClient.invalidateQueries({ queryKey: ["products"] });
        void queryClient.invalidateQueries({ queryKey: ["discord_stock_logs"] });
        void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      } else {
        toast.error(result.error || "Falha ao processar simulação.");
      }
    } catch (err: any) {
      const errRes: SimulateStockResult = {
        success: false,
        error: err.message || "Erro inesperado ao disparar simulação",
      };
      setLastResult(errRes);
      toast.error(errRes.error);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & PRESETS BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl bg-secondary/40 border border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-foreground">Simulador de Movimentação em Tempo Real</h3>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-bold">
              Formato Cidade Alta APP
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Dispare logs idênticos aos do Discord para o canal de testes e valide o motor automático em tempo real (<span className="text-emerald-400 font-bold">&lt;50ms</span> sem recarregar a página).
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Carregar Cenários:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset("print1")}
            className="text-xs h-8 gap-1.5 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
          >
            📸 Print 1 (+15 Lockpick)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset("print2")}
            className="text-xs h-8 gap-1.5 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            📸 Print 2 (-15 Lockpick)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset("drugs")}
            className="text-xs h-8 gap-1.5 border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            💊 Drogas (+100 / +50)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPreset("tactical")}
            className="text-xs h-8 gap-1.5 border-border hover:bg-secondary"
          >
            🧰 Tático (-5 / -2)
          </Button>
        </div>
      </div>

      {/* TWO COLUMNS: LEFT CONFIG / RIGHT PREVIEW */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: FORM & CONFIGURATION (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* CARD 1: DESTINO & JOGADOR */}
          <Card className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                1. Baú de Destino & Identificação do Jogador
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione o baú alvo da facção e o jogador que realizará a movimentação simulada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Baú Alvo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Baú da Facção</span>
                    {selectedBau?.tipo_gestao === "automatico" ? (
                      <span className="text-[10px] text-emerald-400 font-normal">● Automático</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-normal">● Manual</span>
                    )}
                  </Label>
                  <Select value={selectedBauId} onValueChange={handleSelectBau}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione um baú..." />
                    </SelectTrigger>
                    <SelectContent>
                      {baus.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.nome} {b.tipo_gestao === "automatico" ? "(Auto)" : "(Manual)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Canal do Discord */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      ID do Canal de Teste Discord
                    </span>
                    {selectedBau?.discord_channel_id === discordChannelId && discordChannelId ? (
                      <span className="text-[10px] text-cyan-400 font-normal">Canal do Baú</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-normal">Canal Avulso</span>
                    )}
                  </Label>
                  <Input
                    value={discordChannelId}
                    onChange={(e) => setDiscordChannelId(e.target.value)}
                    placeholder="Ex: 1535637509818548234"
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Participante da Facção */}
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Personagem / Autor da Log
                  </span>
                  {members.length > 0 && (
                    <Select value={selectedMemberId} onValueChange={handleSelectMember}>
                      <SelectTrigger className="h-7 text-[11px] w-48 bg-background">
                        <SelectValue placeholder="Preencher por Membro..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            {m.nome || m.nickname} {m.game_id ? `(ID ${m.game_id})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Nome do Personagem (exato)</Label>
                    <Input
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ex: Andrew Delucca Ferreira"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">ID / Passaporte</Label>
                    <Input
                      value={gamePlayerId}
                      onChange={(e) => setGamePlayerId(e.target.value)}
                      placeholder="Ex: 274"
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Horário da Log */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/40">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Horário da Movimentação
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Formato de rodapé: <span className="font-mono text-foreground font-semibold">{effectiveTimeString}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Hora Atual:</span>
                  <Switch checked={useCurrentTime} onCheckedChange={setUseCurrentTime} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: ITENS DA MOVIMENTAÇÃO */}
          <Card className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    2. Itens da Movimentação (Saldo Líquido & Detalhes)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adicione itens com quantidades positivas (entrada/depósito) ou negativas (saída/retirada).
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="text-xs h-8 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {items.map((it, idx) => {
                const isPositive = it.quantity >= 0;
                return (
                  <div
                    key={it.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all space-y-2",
                      isPositive
                        ? "bg-emerald-500/[0.03] border-emerald-500/20"
                        : "bg-rose-500/[0.03] border-rose-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-muted-foreground w-5">
                          #{idx + 1}
                        </span>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() => handleToggleSign(it.id)}
                          className={cn(
                            "h-6 px-2 text-[11px] font-bold rounded-md gap-1",
                            isPositive
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                          )}
                        >
                          {isPositive ? "+ Entrada" : "- Saída"}
                        </Button>
                      </div>

                      {/* Quick Delta Chips */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAdjustQuantity(it.id, isPositive ? 1 : -1)}
                          className="h-6 px-1.5 text-[10px] font-mono"
                        >
                          {isPositive ? "+1" : "-1"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAdjustQuantity(it.id, isPositive ? 5 : -5)}
                          className="h-6 px-1.5 text-[10px] font-mono"
                        >
                          {isPositive ? "+5" : "-5"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAdjustQuantity(it.id, isPositive ? 15 : -15)}
                          className="h-6 px-1.5 text-[10px] font-mono text-amber-400 font-bold"
                        >
                          {isPositive ? "+15" : "-15"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAdjustQuantity(it.id, isPositive ? 50 : -50)}
                          className="h-6 px-1.5 text-[10px] font-mono"
                        >
                          {isPositive ? "+50" : "-50"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(it.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-12 items-center">
                      {/* Select Product from Catalog */}
                      <div className="sm:col-span-5">
                        <Select
                          value={it.productId || ""}
                          onValueChange={(val) => handleUpdateItem(it.id, "productId", val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Vincular do Catálogo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                {p.nome} {p.cda_name ? `(${p.cda_name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Custom Item Name (as sent in Discord log) */}
                      <div className="sm:col-span-4">
                        <Input
                          value={it.name}
                          onChange={(e) => handleUpdateItem(it.id, "name", e.target.value)}
                          placeholder="Nome do Item no Log (ex: Lockpick)"
                          className="h-8 text-xs font-medium"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-3">
                        <div className="relative">
                          <Input
                            type="number"
                            value={it.quantity}
                            onChange={(e) =>
                              handleUpdateItem(it.id, "quantity", parseInt(e.target.value, 10) || 0)
                            }
                            className={cn(
                              "h-8 font-mono text-xs font-bold pr-7",
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            )}
                          />
                          <span className="absolute right-2 top-2 text-[10px] font-bold text-muted-foreground">
                            un
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* CARD 3: MODO DE DISPARO & AÇÕES */}
          <Card className="surface-card border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                3. Modo de Envio & Execução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-3">
                <div
                  onClick={() => setDispatchMethod("bot_http")}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                    dispatchMethod === "bot_http"
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-secondary/30 border-border/60 hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Bot className="w-4 h-4 text-primary" />
                    {dispatchMethod === "bot_http" && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <strong className="block text-xs text-foreground">Bot Discord</strong>
                  <p className="text-[10px] text-muted-foreground">
                    Envia ao canal via Bot no Servidor VPS. Testa o ciclo completo de ingestão.
                  </p>
                </div>

                <div
                  onClick={() => setDispatchMethod("webhook")}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                    dispatchMethod === "webhook"
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-secondary/30 border-border/60 hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Send className="w-4 h-4 text-amber-400" />
                    {dispatchMethod === "webhook" && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <strong className="block text-xs text-foreground">Webhook Cidade Alta</strong>
                  <p className="text-[10px] text-muted-foreground">
                    Exibição visual com o autor Cidade Alta APP no Discord.
                  </p>
                </div>

                <div
                  onClick={() => setDispatchMethod("direct_rpc")}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                    dispatchMethod === "direct_rpc"
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-secondary/30 border-border/60 hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    {dispatchMethod === "direct_rpc" && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <strong className="block text-xs text-foreground">Banco Direto (RPC)</strong>
                  <p className="text-[10px] text-muted-foreground">
                    Executa no Supabase sem envio ao Discord. Ótimo para testes locais ultra-rápidos.
                  </p>
                </div>
              </div>

              {dispatchMethod === "webhook" && (
                <div className="space-y-1.5 p-3 rounded-lg bg-amber-500/[0.05] border border-amber-500/20">
                  <Label className="text-[11px] font-semibold text-amber-300">
                    URL do Webhook do Canal (Opcional se o bot tiver permissão)
                  </Label>
                  <Input
                    value={customWebhookUrl}
                    onChange={(e) => setCustomWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="h-8 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Se vazio, o bot criará ou reutilizará o webhook existente no canal informado.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                size="default"
                disabled={isDispatching}
                onClick={() => handleDispatch("direct_rpc")}
                variant="outline"
                className="gap-2 text-xs"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                Simular Direto no Banco (RPC)
              </Button>

              <Button
                size="default"
                disabled={isDispatching}
                onClick={() => handleDispatch()}
                className="gap-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-lg shadow-amber-500/20"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando ao Discord...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar ao Canal do Discord
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN: DISCORD LIVE PREVIEW & RESULT LOGS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* DISCORD PREVIEW CARD */}
          <Card className="surface-card border-border/80 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-xs font-bold">Pré-visualização do Embed Discord</CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyRaw}
                    className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedRaw ? "Copiado" : "Copiar Texto"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 bg-[#313338] text-foreground">
              {/* DISCORD MESSAGE CONTAINER */}
              <div className="flex items-start gap-3">
                {/* Bot Avatar (CDA Icon) */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-black border-2 border-[#F59E0B] flex items-center justify-center overflow-hidden shadow-md">
                    <span className="text-[11px] font-black tracking-tighter text-[#F59E0B]">CDA</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Bot Header */}
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[14px] font-bold text-white hover:underline cursor-pointer">
                      Cidade Alta
                    </span>
                    <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1 py-0.5 rounded leading-none">
                      APP
                    </span>
                    <span className="text-[11px] text-[#949ba4] ml-1">
                      {effectiveTimeString.replace("Hoje às ", "")}
                    </span>
                  </div>

                  {/* EMBED CARD (Identical to Screenshot) */}
                  <div className="rounded-[4px] bg-[#2b2d31] border-l-4 border-[#F59E0B] p-3 space-y-3 shadow-md max-w-md">
                    {/* Embed Author */}
                    <div className="font-bold text-[13px] text-white tracking-wide">
                      {authorName} • ID {gamePlayerId || "1"}
                    </div>

                    {/* Baú Title */}
                    <div className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                      <span>📦</span>
                      <span>{selectedBau?.nome || "Baú"}</span>
                    </div>

                    {/* Saldo Líquido Section */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span>📊</span>
                        <span>Saldo líquido</span>
                      </div>
                      <div className="space-y-1 pl-0.5">
                        {items.filter((it) => it.name.trim()).map((it) => {
                          const isPos = it.quantity >= 0;
                          return (
                            <div key={it.id} className="text-[13px] text-[#dbdee1] flex items-center gap-1.5">
                              <span className="font-medium text-white">{it.name.trim()}</span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.2 rounded text-[11px] font-mono font-bold",
                                  isPos ? "bg-[#232428] text-white" : "bg-[#232428] text-white"
                                )}
                              >
                                {isPos ? `+${it.quantity}` : `${it.quantity}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detalhes da Movimentação Section */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span>🧾</span>
                        <span>Detalhes da movimentação</span>
                      </div>
                      <div className="space-y-1.5 pl-0.5 text-[13px]">
                        {items.filter((it) => it.name.trim()).map((it) => {
                          const isPos = it.quantity >= 0;
                          const absQ = Math.abs(it.quantity);
                          const verb = isPos
                            ? absQ === 1 ? "adicionado" : "adicionados"
                            : absQ === 1 ? "removido" : "removidos";

                          return (
                            <div key={it.id} className="space-y-0.5">
                              <div className="font-normal text-white">{it.name.trim()}</div>
                              <div className="text-[#949ba4] text-[12px] font-mono pl-0.5">
                                ↳ {isPos ? `+${it.quantity}` : `-${absQ}`} {verb}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer note */}
                    <div className="pt-2 text-[11px] text-[#949ba4]">
                      Movimentações agrupadas em uma janela de 30 segundos • {effectiveTimeString}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LAST DISPATCH RESULT & TELEMETRY */}
          {lastResult && (
            <Card
              className={cn(
                "surface-card border animate-in fade-in-50 duration-300",
                lastResult.success ? "border-emerald-500/40" : "border-rose-500/40"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {lastResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    <CardTitle className="text-sm font-bold">
                      {lastResult.success ? "Movimentação Processada!" : "Falha na Simulação"}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      lastResult.success
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    )}
                  >
                    {lastResult.method}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className={lastResult.success ? "text-emerald-300" : "text-rose-300"}>
                  {lastResult.message || lastResult.error}
                </p>

                {lastResult.messageId && (
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60 space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Message ID:</span>
                      <span className="text-foreground font-bold">{lastResult.messageId}</span>
                    </div>
                    {lastResult.channelName && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Canal:</span>
                        <span className="text-cyan-400">#{lastResult.channelName}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Estoque atualizado e sincronizado em tempo real nas outras páginas.</span>
                </div>
              </CardContent>

              {onNavigateToLogs && (
                <CardFooter className="pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onNavigateToLogs}
                    className="w-full text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Registro na Aba "Logs Técnicas & Auditoria"
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}

          {/* HELPFUL TIPS CARD */}
          <Card className="surface-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-primary" />
                Como funciona a simulação técnica
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground space-y-2">
              <p>
                1. Ao clicar em <strong>"Enviar ao Canal do Discord"</strong>, o bot hospeda e envia o embed exatamente com a formatação e cores do <em>Cidade Alta APP</em>.
              </p>
              <p>
                2. O motor do bot recebe o evento <code>MessageCreate</code>, extrai o jogador, ID e quantidades do Saldo Líquido, grava a transação na tabela <code>discord_stock_logs</code> e abate/adiciona o saldo no baú correspondente.
              </p>
              <p>
                3. O evento é emitido via Supabase Realtime para todas as telas abertas em menos de 50ms, sem necessidade de F5.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
