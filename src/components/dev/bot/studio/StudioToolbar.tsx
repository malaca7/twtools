import React, { useState } from "react";
import {
  ArrowLeft,
  Play,
  Save,
  Layers,
  Sparkles,
  Sliders,
  Check,
  RefreshCw,
  Zap,
  Terminal,
  Clock,
  Eye,
  Settings,
  Split,
  Server,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StudioToolbarProps {
  title: string;
  subTitle?: string;
  isCommand?: boolean;
  isEvent?: boolean;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onBack: () => void;
  onSave: () => void;
  onRunTest: () => void;
  isTesting?: boolean;
  onTogglePalette: () => void;
  isPaletteOpen: boolean;
  onAutoLayout?: () => void;
  onOpenParameters?: () => void;
  parametersCount?: number;
  onOpenConditions?: () => void;
  conditionsCount?: number;
  selectedGuildId?: string;
  onSelectGuildId?: (guildId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMobile?: boolean;
}

export function StudioToolbar({
  title,
  subTitle,
  isCommand,
  isEvent,
  enabled,
  onToggleEnabled,
  onBack,
  onSave,
  onRunTest,
  isTesting,
  onTogglePalette,
  isPaletteOpen,
  onAutoLayout,
  onOpenParameters,
  parametersCount = 0,
  onOpenConditions,
  conditionsCount = 0,
  selectedGuildId = "all",
  onSelectGuildId,
  isFullscreen = true,
  onToggleFullscreen,
  isMobile = false,
}: StudioToolbarProps) {
  const [mobileQuickMenuOpen, setMobileQuickMenuOpen] = useState(false);

  return (
    <header className="bg-zinc-950/98 border-b border-zinc-800 z-30 shadow-md backdrop-blur-md select-none flex flex-col">
      {/* Main Top Row */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left section: Native Window Dots + Back + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* macOS / Desktop Traffic Light Dots */}
          <div className="hidden sm:flex items-center gap-1.5 pr-1">
            <button
              onClick={onBack}
              className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors shadow-sm"
              title="Fechar Studio (Esc)"
            />
            <button
              onClick={onToggleFullscreen}
              className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors shadow-sm"
              title="Alternar Modo Janela / Tela Cheia"
            />
            <button
              onClick={onToggleFullscreen}
              className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors shadow-sm"
              title="Modo Tela Cheia Nativo"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="h-8 sm:h-9 px-2 sm:px-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 rounded-xl shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs font-semibold">Voltar</span>
          </Button>

          <div className="h-5 sm:h-6 w-px bg-zinc-800 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                isCommand
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : isEvent
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
              }`}
            >
              {isCommand ? (
                <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : isEvent ? (
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-black text-zinc-100 truncate tracking-tight">
                  {title}
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[9px] sm:text-[10px] font-mono py-0 hidden xs:inline-flex ${
                    isCommand
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  }`}
                >
                  {isCommand ? "COMANDO" : "EVENTO"}
                </Badge>
              </div>
              {subTitle && (
                <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate max-w-[140px] sm:max-w-xs">
                  {subTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Middle section: Desktop Server Selector, Status Switch, Action Buttons */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Seletor de Servidor onde vai funcionar */}
          {onSelectGuildId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-xs shadow-sm">
              <Server className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px] text-zinc-400 font-medium">Servidor:</span>
              <select
                value={selectedGuildId}
                onChange={(e) => onSelectGuildId(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-200 focus:outline-none cursor-pointer"
                title="Selecione o servidor Discord onde este fluxo irá responder"
              >
                <option value="all" className="bg-zinc-950 text-white">🌐 Todos os Servidores (Global)</option>
                <option value="1535505650308620400" className="bg-zinc-950 text-white">🏍️ Twin Wheel</option>
                <option value="1537229296697999462" className="bg-zinc-950 text-white">💻 Malaca Devs</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-xs">
            <span className="text-zinc-400 text-xs font-semibold">Status:</span>
            <Switch
              checked={enabled}
              onCheckedChange={onToggleEnabled}
              className="data-[state=checked]:bg-emerald-600 scale-90"
            />
            <span
              className={`font-bold text-[11px] ${
                enabled ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {enabled ? "ATIVO" : "PAUSADO"}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onTogglePalette}
            className={`h-9 text-xs font-bold gap-1.5 border-zinc-800 rounded-xl transition-all ${
              isPaletteOpen
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                : "bg-zinc-900/80 text-zinc-300 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4 text-emerald-400" />
            Blocos & Ações
          </Button>

          {/* Botão de Parâmetros / Argumentos no Studio */}
          {isCommand && onOpenParameters && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenParameters}
              className="h-9 text-xs font-bold gap-1.5 border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-xl shadow-sm"
            >
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              Argumentos
              <Badge
                variant="outline"
                className="text-[10px] font-mono py-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 ml-0.5"
              >
                {parametersCount}
              </Badge>
            </Button>
          )}

          {/* Botão de Condições & Regras SE / ENTÃO no Studio */}
          {onOpenConditions && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenConditions}
              className="h-9 text-xs font-bold gap-1.5 border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-xl shadow-sm"
            >
              <Split className="h-3.5 w-3.5 text-violet-400" />
              Condições
              <Badge
                variant="outline"
                className="text-[10px] font-mono py-0 text-violet-400 border-violet-500/30 bg-violet-500/10 ml-0.5"
              >
                {conditionsCount}
              </Badge>
            </Button>
          )}

          {onAutoLayout && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAutoLayout}
              className="h-9 text-xs font-semibold gap-1.5 border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white rounded-xl"
              title="Organizar nós automaticamente na tela"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Auto
            </Button>
          )}
        </div>

        {/* Right section: Test Simulator, Save, Mobile Toggle & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Quick Menu Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMobileQuickMenuOpen((prev) => !prev)}
            className="lg:hidden h-8 px-2 text-xs font-bold gap-1 border-zinc-800 bg-zinc-900/90 text-zinc-300 rounded-lg"
            title="Mais opções e ferramentas"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px]">Opções</span>
            {mobileQuickMenuOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={onRunTest}
            disabled={isTesting}
            className="h-8 sm:h-9 text-xs font-bold gap-1 sm:gap-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-md border border-violet-500/30 px-2.5 sm:px-3"
          >
            {isTesting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span className="hidden sm:inline">{isTesting ? "Testando..." : "Testar Fluxo"}</span>
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            className="h-8 sm:h-9 text-xs font-black gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 border border-emerald-500/30 px-2.5 sm:px-3.5"
            title="Salvar alterações no bot oficial (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Salvar</span>
          </Button>

          {onToggleFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleFullscreen}
              className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 hover:text-white rounded-xl border border-zinc-800/80 hover:bg-zinc-900 hidden sm:flex"
              title={isFullscreen ? "Restaurar Janela" : "Modo Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={onBack}
            className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-zinc-800/80"
            title="Fechar Studio (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Secondary Action Strip (collapsible or auto-shown on mobile) */}
      <div
        className={cn(
          "lg:hidden px-3 py-2 border-t border-zinc-800/60 bg-zinc-950 flex items-center gap-2 overflow-x-auto no-scrollbar transition-all duration-200",
          !mobileQuickMenuOpen && "hidden"
        )}
      >
        {/* Toggle Palette Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={onTogglePalette}
          className={cn(
            "h-7 text-[11px] font-bold gap-1 rounded-lg shrink-0",
            isPaletteOpen
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-zinc-900 border-zinc-800 text-zinc-300"
          )}
        >
          <Layers className="h-3 w-3 text-emerald-400" />
          Blocos
        </Button>

        {/* Status Toggle on Mobile */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 shrink-0">
          <span className="text-[10px] text-zinc-400 font-bold">Status:</span>
          <Switch
            checked={enabled}
            onCheckedChange={onToggleEnabled}
            className="data-[state=checked]:bg-emerald-600 scale-75"
          />
          <span className={cn("text-[10px] font-black", enabled ? "text-emerald-400" : "text-zinc-500")}>
            {enabled ? "ON" : "OFF"}
          </span>
        </div>

        {/* Server Selector on Mobile */}
        {onSelectGuildId && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 shrink-0">
            <Server className="h-3 w-3 text-blue-400 shrink-0" />
            <select
              value={selectedGuildId}
              onChange={(e) => onSelectGuildId(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-zinc-200 focus:outline-none"
            >
              <option value="all" className="bg-zinc-950 text-white">Global</option>
              <option value="1535505650308620400" className="bg-zinc-950 text-white">Twin Wheel</option>
              <option value="1537229296697999462" className="bg-zinc-950 text-white">Malaca Devs</option>
            </select>
          </div>
        )}

        {/* Arguments button */}
        {isCommand && onOpenParameters && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenParameters}
            className="h-7 text-[11px] font-bold gap-1 border-zinc-800 bg-zinc-900 text-zinc-300 rounded-lg shrink-0"
          >
            <Sliders className="h-3 w-3 text-emerald-400" />
            Argumentos ({parametersCount})
          </Button>
        )}

        {/* Conditions button */}
        {onOpenConditions && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenConditions}
            className="h-7 text-[11px] font-bold gap-1 border-zinc-800 bg-zinc-900 text-zinc-300 rounded-lg shrink-0"
          >
            <Split className="h-3 w-3 text-violet-400" />
            Condições ({conditionsCount})
          </Button>
        )}

        {/* Auto layout button */}
        {onAutoLayout && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAutoLayout}
            className="h-7 text-[11px] font-semibold gap-1 border-zinc-800 bg-zinc-900 text-zinc-400 rounded-lg shrink-0"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            Auto Layout
          </Button>
        )}

        {/* Fullscreen button */}
        {onToggleFullscreen && (
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleFullscreen}
            className="h-7 text-[11px] font-semibold gap-1 border-zinc-800 bg-zinc-900 text-zinc-400 rounded-lg shrink-0"
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            {isFullscreen ? "Janela" : "Tela Cheia"}
          </Button>
        )}
      </div>
    </header>
  );
}
