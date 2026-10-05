import { useState, useRef, useMemo } from "react";
import {
  Palette,
  Sparkles,
  Layers,
  Type,
  SunMedium,
  Contrast,
  RotateCcw,
  Check,
  CheckCircle2,
  Loader2,
  Zap,
  Grid,
  Square,
  Maximize2,
  Flame,
  Search,
  Sliders,
  Paintbrush,
  SlidersHorizontal,
  Minus,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserTheme, applyThemeToDOM } from "@/hooks/useUserTheme";
import { DEFAULT_USER_THEME, type UserThemeSettings } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const THEME_CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "light", name: "☀️ Claros" },
  { id: "cyberpunk", name: "⚡ Cyber & Neon" },
  { id: "faction", name: "🏴 Grupos & Crime" },
  { id: "dark_minimal", name: "🖤 OLED & Minimal" },
  { id: "sports", name: "🏎️ Esporte & Tático" },
];

export const THEME_OPTIONS = [
  // ☀️ Temas Claros & Clean
  { id: "light_pearl", category: "light", name: "Clean Pearl White", color: "from-sky-300 to-blue-600", desc: "Branco pérola puro com detalhes em azul cobalto e máxima legibilidade" },
  { id: "light_cloud", category: "light", name: "Soft Cloud Minimal", color: "from-slate-200 to-cyan-500", desc: "Cinza claro suave com detalhes em ciano e ardósia" },
  { id: "light_sakura", category: "light", name: "Sakura Blossom Light", color: "from-pink-200 to-rose-400", desc: "Fundo claro floral com toques de rosa cerejeira e lavanda" },
  { id: "light_mint", category: "light", name: "Emerald Mint Light", color: "from-emerald-200 to-teal-400", desc: "Fundo claro refrescante com acentos menta e esmeralda" },
  { id: "light_amber", category: "light", name: "Solar Amber Light", color: "from-amber-200 to-orange-400", desc: "Fundo areia quente com acentos dourados e laranja solar" },
  { id: "light_arctic", category: "light", name: "Arctic Ice Light", color: "from-cyan-100 to-blue-400", desc: "Fundo azul gelo muito claro com acentos azul ártico" },
  { id: "light_latte", category: "light", name: "Warm Latte & Vanilla", color: "from-amber-100 to-amber-600", desc: "Fundo pergaminho/latte quente com tons de café e bronze" },
  { id: "light_slate", category: "light", name: "Neo Light Slate", color: "from-slate-200 to-indigo-500", desc: "Fundo cinza moderno neutro com azul elétrico" },

  // Cyber & Neon
  { id: "cyberpunk", category: "cyberpunk", name: "Dark Cyberpunk", color: "from-purple-500 to-pink-500", desc: "Tons escuros com acentos neon ciano e rosa elétrico" },
  { id: "midnight", category: "cyberpunk", name: "Midnight Neon", color: "from-blue-600 to-indigo-500", desc: "Azul profundo com contrastes vibrantes e magenta" },
  { id: "emerald_matrix", category: "cyberpunk", name: "Emerald Matrix", color: "from-emerald-500 to-teal-400", desc: "Verde terminal hacker clássico de alta tecnologia" },
  { id: "sunset_synth", category: "cyberpunk", name: "Sunset Synthwave", color: "from-amber-500 to-rose-500", desc: "Gradientes dourados, pôr do sol e fúcsia retrô" },
  { id: "toxic_violet", category: "cyberpunk", name: "Toxic Biohazard", color: "from-violet-600 to-fuchsia-500", desc: "Roxo tóxico radioativo com destaque de alta densidade" },
  { id: "aqua_cyber", category: "cyberpunk", name: "Aqua Atlantis Cyber", color: "from-cyan-400 to-blue-600", desc: "Ciano oceânico profundo e azul turquesa elétrico" },
  { id: "vaporwave_dream", category: "cyberpunk", name: "Vaporwave Dream", color: "from-pink-400 to-cyan-300", desc: "Estética retrô pastel com azul céu e chiclete" },
  { id: "cyber_samurai", category: "cyberpunk", name: "Cyber Samurai", color: "from-blue-500 to-amber-400", desc: "Azul cobalto elétrico com toques de ouro solar" },

  // Grupos & Crime
  { id: "crimson_blood", category: "faction", name: "Crimson Syndicate", color: "from-red-600 to-rose-500", desc: "Vermelho carmesim de grupo combativa e sangue" },
  { id: "golden_viper", category: "faction", name: "Golden Cartel & Viper", color: "from-amber-400 to-yellow-600", desc: "Preto acetinado luxuoso com detalhes em ouro 24k" },
  { id: "amethyst_royal", category: "faction", name: "Amethyst Royal Imperial", color: "from-purple-600 to-amber-400", desc: "Roxo imperial nobre com toques de realeza dourada" },
  { id: "ruby_velvet", category: "faction", name: "Ruby Velvet & Wine", color: "from-rose-700 to-red-900", desc: "Vinho bordô aveludado e carmesim profundo" },
  { id: "dark_bdm", category: "faction", name: "Dark BdM (Midnight Blue)", color: "from-sky-500 to-blue-700", desc: "Azul marinho noturno imersivo de alta patente" },
  { id: "dark_bear", category: "faction", name: "Dark Bear (Urso Tático)", color: "from-amber-700 to-amber-900", desc: "Madeira nobre escura, couro e âmbar tático" },
  { id: "inferno_orange", category: "faction", name: "Inferno Volcanic Lava", color: "from-orange-500 to-red-600", desc: "Laranja vulcânico, brasa acesa e fogo tático" },
  { id: "dracula_vampire", category: "faction", name: "Dracula Gothic Vampire", color: "from-slate-700 to-pink-600", desc: "Slate escuro gótico com toques de violeta e neon" },

  // OLED & Minimal
  { id: "malaca_drkoled", category: "dark_minimal", name: "Malaca DrkOLed", color: "from-neutral-900 via-zinc-900 to-black", desc: "Preto OLED absoluto (#000000), containers ultra escuros e conforto visual" },
  { id: "stealth_black", category: "dark_minimal", name: "Stealth OLED Black", color: "from-zinc-800 to-black", desc: "Preto absoluto puro para economia e contraste OLED" },
  { id: "graphite", category: "dark_minimal", name: "Graphite Titanium", color: "from-zinc-400 to-zinc-600", desc: "Minimalismo fosco titânio com acabamento refinado" },
  { id: "nordic_frost", category: "dark_minimal", name: "Nordic Polar Frost", color: "from-cyan-200 to-slate-500", desc: "Cinza polar ártico e azul gelo contemporâneo" },
  { id: "tokyo_drift", category: "dark_minimal", name: "Tokyo Drift Sakura", color: "from-pink-500 to-zinc-900", desc: "Rosa neon flor de cerejeira com asfalto escuro" },

  // Esporte & Tactical
  { id: "carbon_redline", category: "sports", name: "Carbon Fiber Redline", color: "from-red-600 to-zinc-900", desc: "Fibra de carbono esportiva com linhas vermelhas de corrida" },
  { id: "tactical_camo", category: "sports", name: "Tactical Military Camo", color: "from-emerald-700 to-amber-700", desc: "Verde oliva militar e tons táticos de operações especiais" },
];

export const ACCENT_COLOR_PRESETS = [
  { name: "Padrão do Tema", value: null, hex: "transparent", group: "default" },
  { name: "Ciano Neon", value: "oklch(0.75 0.19 200)", hex: "#00e5ff", group: "vivid" },
  { name: "Rosa Cyber", value: "oklch(0.72 0.24 340)", hex: "#ff2a85", group: "vivid" },
  { name: "Verde Matrix", value: "oklch(0.78 0.22 145)", hex: "#00ff66", group: "vivid" },
  { name: "Ouro Real 24k", value: "oklch(0.80 0.18 85)", hex: "#ffb700", group: "vivid" },
  { name: "Vermelho Fogo", value: "oklch(0.65 0.24 25)", hex: "#ff3333", group: "vivid" },
  { name: "Roxo Cósmico", value: "oklch(0.70 0.22 300)", hex: "#bf00ff", group: "vivid" },
  { name: "Azul Celeste", value: "oklch(0.68 0.20 240)", hex: "#2979ff", group: "vivid" },
  { name: "Laranja Vulcão", value: "oklch(0.72 0.22 45)", hex: "#ff6d00", group: "vivid" },
  { name: "Esmeralda", value: "oklch(0.74 0.20 160)", hex: "#10b981", group: "vivid" },
  { name: "Azul Bebê", value: "oklch(0.78 0.14 235)", hex: "#70b5ff", group: "light" },
  { name: "Menta Pastel", value: "oklch(0.85 0.15 160)", hex: "#6ee7b7", group: "light" },
  { name: "Lavanda Pastel", value: "oklch(0.80 0.16 300)", hex: "#c084fc", group: "light" },
  { name: "Rosa Algodão", value: "oklch(0.82 0.18 345)", hex: "#f472b6", group: "light" },
  { name: "Pêssego Pastel", value: "oklch(0.84 0.16 55)", hex: "#fb923c", group: "light" },
  { name: "Amarelo Canário", value: "oklch(0.90 0.16 95)", hex: "#fde047", group: "light" },
];

export const ACCENT_GRADIENT_PRESETS = [
  {
    name: "Cyber Synthwave",
    desc: "Rosa Neon ➔ Ciano Elétrico",
    gradient: "linear-gradient(135deg, #ff2a85 0%, #00e5ff 100%)",
    fallbackHex: "#ff2a85",
    value: "gradient:linear-gradient(135deg, #ff2a85 0%, #00e5ff 100%)|#ff2a85",
  },
  {
    name: "Imperial Royal Gold",
    desc: "Ouro 24k ➔ Âmbar Dourado",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
    fallbackHex: "#fbbf24",
    value: "gradient:linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)|#fbbf24",
  },
  {
    name: "Toxic Matrix",
    desc: "Verde Hacker ➔ Ciano",
    gradient: "linear-gradient(135deg, #00ff66 0%, #00e5ff 100%)",
    fallbackHex: "#00ff66",
    value: "gradient:linear-gradient(135deg, #00ff66 0%, #00e5ff 100%)|#00ff66",
  },
  {
    name: "Crimson Blaze",
    desc: "Vermelho Fogo ➔ Âmbar",
    gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
    fallbackHex: "#ef4444",
    value: "gradient:linear-gradient(135deg, #ef4444 0%, #f97316 100%)|#ef4444",
  },
  {
    name: "Amethyst Horizon",
    desc: "Violeta Profundo ➔ Magenta",
    gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
    fallbackHex: "#a855f7",
    value: "gradient:linear-gradient(135deg, #a855f7 0%, #ec4899 100%)|#a855f7",
  },
  {
    name: "Deep Ocean",
    desc: "Azul Safira ➔ Ciano Turquesa",
    gradient: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
    fallbackHex: "#2563eb",
    value: "gradient:linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)|#2563eb",
  },
];

export const CARD_STYLE_OPTIONS = [
  { id: "glassmorphism", name: "Glassmorphism", desc: "Vidro fosco translúcido com reflexo suave" },
  { id: "flat_modern", name: "Flat Modern", desc: "Superfície fosca minimalista e limpa" },
  { id: "outline_glow", name: "Outline Glow", desc: "Bordas com iluminação contínua" },
  { id: "gradient", name: "Gradient High-Tech", desc: "Superfície com gradiente elegante" },
  { id: "solid_oled", name: "Solid OLED Black", desc: "Preto profundo absoluto" },
  { id: "carbon", name: "Fibra de Carbono", desc: "Textura sutil inspirada em supercarros" },
  { id: "neo_brutalism", name: "Neo Brutalism", desc: "Bordas sólidas de 2px e sombra dimensional" },
];

export const FONT_OPTIONS = [
  { id: "space_grotesk", name: "Space Grotesk", desc: "Moderna, cyberpunk e tecnológica" },
  { id: "inter", name: "Inter UI", desc: "Extremamente limpa e máxima legibilidade" },
  { id: "rajdhani", name: "Rajdhani", desc: "Tática, esportiva e gamer" },
  { id: "orbitron", name: "Orbitron", desc: "Futurista e sci-fi" },
  { id: "outfit", name: "Outfit", desc: "Geométrica, moderna e suave" },
  { id: "jetbrains_mono", name: "JetBrains Mono", desc: "Monoespaçada para programação" },
  { id: "plus_jakarta", name: "Plus Jakarta", desc: "Corporativa ultra premium" },
  { id: "montserrat", name: "Montserrat", desc: "Imponente e versátil" },
];

export const BG_PATTERN_OPTIONS = [
  { id: "cyber_grid", name: "Grade Cyber (Grid)" },
  { id: "subtle_dots", name: "Matriz de Pontos" },
  { id: "carbon_mesh", name: "Malha de Carbono" },
  { id: "radial_glow", name: "Luzes Radiais" },
  { id: "none", name: "Limpo (Sem Textura)" },
];

export const BORDER_RADIUS_OPTIONS = [
  { id: "sharp", name: "Reto (0px)" },
  { id: "medium", name: "Médio (8px)" },
  { id: "smooth", name: "Suave (14px)" },
  { id: "pill", name: "Pill (22px)" },
];

export const UI_DENSITY_OPTIONS = [
  { id: "compact", name: "Compacto" },
  { id: "normal", name: "Equilibrado (Padrão)" },
  { id: "spacious", name: "Espaçoso" },
];

export function UserAppearanceSettings() {
  const { theme, saveTheme, resetTheme, isSaving } = useUserTheme();
  const [activeTab, setActiveTab] = useState<"temas" | "iluminacao" | "estilos">("temas");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTheme, setSearchTheme] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Alteração com aplicação imediata e debounce
  const handleChange = <K extends keyof UserThemeSettings>(key: K, value: UserThemeSettings[K]) => {
    const partial = { [key]: value } as Partial<UserThemeSettings>;
    applyThemeToDOM({ ...theme, ...partial });

    const isSlider = key === "brightness" || key === "contrast" || key === "saturation" || key === "textBrightness";

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (isSlider) {
      debounceRef.current = setTimeout(() => {
        void saveTheme(partial, false);
      }, 150);
    } else {
      void saveTheme(partial, false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Restaurar todas as configurações de tema e aparência para o padrão original?")) return;
    await resetTheme();
  };

  const filteredThemes = useMemo(() => {
    return THEME_OPTIONS.filter((t) => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (searchTheme.trim()) {
        const q = searchTheme.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, searchTheme]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* BARRA SUPERIOR DE AÇÕES & STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Tema & Aparência Individual
            </h3>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono font-bold">
              SUA CONTA
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize suas cores, iluminação de 0% a 180%, fontes e acabamentos visuais.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-xs">
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Salvo em tempo real</span>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="h-8 text-xs font-bold gap-1.5 cursor-pointer rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE SUB-ABAS (ORGANIZAÇÃO CLEAN) */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 w-full bg-secondary/40 p-1 rounded-2xl border border-border/60 h-auto">
          <TabsTrigger
            value="temas"
            className="text-xs font-bold gap-1.5 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>1. Catálogo & Cores</span>
          </TabsTrigger>

          <TabsTrigger
            value="iluminacao"
            className="text-xs font-bold gap-1.5 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>2. Iluminação & Brilho (0-180%)</span>
          </TabsTrigger>

          <TabsTrigger
            value="estilos"
            className="text-xs font-bold gap-1.5 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>3. Cards, Fontes & Layout</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════
            ABA 1: TEMAS & CORES
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="temas" className="space-y-5 m-0 focus-visible:outline-none">
          {/* SELETOR DE COR PRIMÁRIA & DEGRADÊS */}
          <Card className="surface-card border-border/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Paintbrush className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Cor de Realce & Gradiente da Marca</CardTitle>
                    <CardDescription className="text-xs">
                      Substitui a cor primária de botões, tags, links e títulos em toda a plataforma.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* GRADIENTES MULTICORES */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Gradientes Dinâmicos Especiais:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {ACCENT_GRADIENT_PRESETS.map((g) => {
                    const isSelected = theme.customPrimaryColor === g.value;
                    return (
                      <button
                        key={g.name}
                        type="button"
                        onClick={() => handleChange("customPrimaryColor", g.value)}
                        className={cn(
                          "p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                          isSelected
                            ? "border-primary bg-primary/15 ring-2 ring-primary/40 font-bold"
                            : "border-border/60 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="h-4 w-full rounded-md shadow-xs" style={{ background: g.gradient }} />
                        <span className="text-[11px] font-bold text-foreground truncate">{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CORES SÓLIDAS */}
              <div className="pt-2 border-t border-border/40">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Cores Sólidas & Neon:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_COLOR_PRESETS.map((c) => {
                    const isSelected = (!theme.customPrimaryColor && c.value === null) || theme.customPrimaryColor === c.value;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleChange("customPrimaryColor", c.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs",
                          isSelected
                            ? "border-primary bg-primary/20 ring-2 ring-primary/40 text-foreground font-bold"
                            : "border-border/60 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/30 shrink-0"
                          style={{ backgroundColor: c.hex === "transparent" ? "var(--primary)" : c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-primary ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CATÁLOGO DE TEMAS */}
          <Card className="surface-card border-border/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold">Paleta de Temas Prontos</CardTitle>
                  <CardDescription className="text-xs">
                    {filteredThemes.length} temas disponíveis para seu estilo visual
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tema..."
                      value={searchTheme}
                      onChange={(e) => setSearchTheme(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-xl"
                    />
                  </div>

                  {/* CATEGORIAS PILLS */}
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {THEME_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "text-[10.5px] px-2 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer",
                          selectedCategory === cat.id
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredThemes.map((opt) => {
                  const isSelected = theme.themeStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange("themeStyle", opt.id)}
                      className={cn(
                        "group p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md font-bold"
                          : "border-border/60 bg-secondary/20 hover:bg-secondary/50 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="space-y-1 w-full">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-foreground truncate">{opt.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{opt.desc}</p>
                      </div>

                      {/* SWATCH DE CORES */}
                      <div className={cn("h-3 w-full rounded-md bg-gradient-to-r shadow-xs opacity-90 group-hover:opacity-100 transition-opacity", opt.color)} />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            ABA 2: ILUMINAÇÃO & BRILHO (RANGE 0% A 180% COM DUPLO CLIQUE)
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="iluminacao" className="space-y-5 m-0 focus-visible:outline-none">
          <Card className="surface-card border-border/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Iluminação, Animações e Controles Finos</CardTitle>
                    <CardDescription className="text-xs">
                      Ajuste fino de brilho, contraste e saturação de 0% a 180%. Dê um <strong>duplo clique</strong> em qualquer controle para restaurar para 100%.
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400">
                  Range: 0% a 180%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* TOGGLES EM GRID */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30">
                  <div>
                    <Label className="text-xs font-bold cursor-pointer block">Efeito Glow ✨</Label>
                    <span className="text-[10px] text-muted-foreground">Iluminação neon</span>
                  </div>
                  <Switch
                    checked={theme.glowEffectsEnabled}
                    onCheckedChange={(val) => handleChange("glowEffectsEnabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30">
                  <div>
                    <Label className="text-xs font-bold cursor-pointer block">Pulso de Status</Label>
                    <span className="text-[10px] text-muted-foreground">Animação online</span>
                  </div>
                  <Switch
                    checked={theme.statusPulseEnabled}
                    onCheckedChange={(val) => handleChange("statusPulseEnabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30">
                  <div>
                    <Label className="text-xs font-bold cursor-pointer block">Zoom no Hover</Label>
                    <span className="text-[10px] text-muted-foreground">Efeito 3D ao passar</span>
                  </div>
                  <Switch
                    checked={theme.hoverZoomEnabled}
                    onCheckedChange={(val) => handleChange("hoverZoomEnabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30">
                  <div>
                    <Label className="text-xs font-bold cursor-pointer block">Transições</Label>
                    <span className="text-[10px] text-muted-foreground">Navegação suave</span>
                  </div>
                  <Switch
                    checked={theme.pageTransitionsEnabled}
                    onCheckedChange={(val) => handleChange("pageTransitionsEnabled", val)}
                  />
                </div>
              </div>

              {/* VELOCIDADES E INTENSIDADE */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/40">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Intensidade do Glow Neon</Label>
                  <Select
                    value={theme.glowIntensity || "medium"}
                    onValueChange={(val) => handleChange("glowIntensity", val)}
                  >
                    <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/80 font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">Suave (25% Glow)</SelectItem>
                      <SelectItem value="medium" className="text-xs">Médio (50% Glow)</SelectItem>
                      <SelectItem value="high" className="text-xs">Intenso (100% Neon Ultra Glow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Velocidade da Pulsação / Animações</Label>
                  <Select
                    value={theme.borderGlowSpeed || "normal"}
                    onValueChange={(val) => handleChange("borderGlowSpeed", val)}
                  >
                    <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/80 font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow" className="text-xs">Lenta e Relaxante (4s)</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normal Equilibrada (2s)</SelectItem>
                      <SelectItem value="fast" className="text-xs">Rápida e Dinâmica (1.2s)</SelectItem>
                      <SelectItem value="off" className="text-xs">Estática (Sem Animação)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 4 SLIDERS DE ILUMINAÇÃO (0% A 180% COM AJUSTES RÁPIDOS, STEPPERS E DUPLO CLIQUE) */}
              <div className="pt-4 border-t border-border/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Controles de Iluminação & Display
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ajuste fino de brilho, contraste, cores e nitidez de texto em tempo real.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleChange("brightness", 100);
                        handleChange("contrast", 100);
                        handleChange("saturation", 100);
                        handleChange("textBrightness", 100);
                      }}
                      className="h-7 text-[11px] font-semibold rounded-lg gap-1.5 border-border/80 hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                      title="Restaura todos os 4 controles para o padrão 100%"
                    >
                      <RotateCcw className="h-3 w-3 text-primary" />
                      <span>Restaurar Todos (100%)</span>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {/* 1. BRILHO GLOBAL */}
                  <div
                    onDoubleClick={() => handleChange("brightness", 100)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 select-none flex flex-col justify-between gap-3 shadow-xs",
                      theme.brightness !== 100
                        ? "bg-amber-500/10 border-amber-500/40 shadow-amber-500/5"
                        : "bg-secondary/25 border-border/70 hover:border-amber-500/30 hover:bg-secondary/40"
                    )}
                    title="Dê duplo clique para restaurar 100%"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <SunMedium className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold block cursor-pointer text-foreground">
                            Brilho Global
                          </Label>
                          <span className="text-[10px] text-muted-foreground">Filtro de luz</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChange("brightness", 100)}
                        className="px-2 py-0.5 rounded-lg font-mono text-xs font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all border border-amber-500/30 cursor-pointer"
                        title="Clique para redefinir para 100%"
                      >
                        {theme.brightness}%
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("brightness", Math.max(0, (theme.brightness || 100) - 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-amber-400 text-xs transition-colors cursor-pointer"
                          title="Diminuir 5%"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Slider
                          value={[theme.brightness ?? 100]}
                          min={0}
                          max={180}
                          step={1}
                          onValueChange={([val]) => handleChange("brightness", val)}
                          className="cursor-pointer flex-1 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange("brightness", Math.min(180, (theme.brightness || 100) + 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-amber-400 text-xs transition-colors cursor-pointer"
                          title="Aumentar 5%"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                        <button
                          type="button"
                          onClick={() => handleChange("brightness", 50)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("brightness", 100)}
                          className={cn(
                            "font-bold transition-colors cursor-pointer px-1 rounded",
                            theme.brightness === 100 ? "text-amber-400 bg-amber-500/15" : "hover:text-foreground"
                          )}
                        >
                          100% Padrão
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("brightness", 150)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          150%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. CONTRASTE GLOBAL */}
                  <div
                    onDoubleClick={() => handleChange("contrast", 100)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 select-none flex flex-col justify-between gap-3 shadow-xs",
                      theme.contrast !== 100
                        ? "bg-blue-500/10 border-blue-500/40 shadow-blue-500/5"
                        : "bg-secondary/25 border-border/70 hover:border-blue-500/30 hover:bg-secondary/40"
                    )}
                    title="Dê duplo clique para restaurar 100%"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Contrast className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold block cursor-pointer text-foreground">
                            Contraste Global
                          </Label>
                          <span className="text-[10px] text-muted-foreground">Definição visual</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChange("contrast", 100)}
                        className="px-2 py-0.5 rounded-lg font-mono text-xs font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30 cursor-pointer"
                        title="Clique para redefinir para 100%"
                      >
                        {theme.contrast}%
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("contrast", Math.max(0, (theme.contrast || 100) - 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-blue-400 text-xs transition-colors cursor-pointer"
                          title="Diminuir 5%"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Slider
                          value={[theme.contrast ?? 100]}
                          min={0}
                          max={180}
                          step={1}
                          onValueChange={([val]) => handleChange("contrast", val)}
                          className="cursor-pointer flex-1 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange("contrast", Math.min(180, (theme.contrast || 100) + 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-blue-400 text-xs transition-colors cursor-pointer"
                          title="Aumentar 5%"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                        <button
                          type="button"
                          onClick={() => handleChange("contrast", 50)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("contrast", 100)}
                          className={cn(
                            "font-bold transition-colors cursor-pointer px-1 rounded",
                            theme.contrast === 100 ? "text-blue-400 bg-blue-500/15" : "hover:text-foreground"
                          )}
                        >
                          100% Padrão
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("contrast", 150)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          150%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. SATURAÇÃO DE CORES */}
                  <div
                    onDoubleClick={() => handleChange("saturation", 100)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 select-none flex flex-col justify-between gap-3 shadow-xs",
                      (theme.saturation ?? 100) !== 100
                        ? "bg-rose-500/10 border-rose-500/40 shadow-rose-500/5"
                        : "bg-secondary/25 border-border/70 hover:border-rose-500/30 hover:bg-secondary/40"
                    )}
                    title="Dê duplo clique para restaurar 100%"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                          <Flame className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold block cursor-pointer text-foreground">
                            Saturação de Cores
                          </Label>
                          <span className="text-[10px] text-muted-foreground">Vivacidade</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChange("saturation", 100)}
                        className="px-2 py-0.5 rounded-lg font-mono text-xs font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all border border-rose-500/30 cursor-pointer"
                        title="Clique para redefinir para 100%"
                      >
                        {theme.saturation ?? 100}%
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("saturation", Math.max(0, (theme.saturation ?? 100) - 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-rose-400 text-xs transition-colors cursor-pointer"
                          title="Diminuir 5%"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Slider
                          value={[theme.saturation ?? 100]}
                          min={0}
                          max={180}
                          step={1}
                          onValueChange={([val]) => handleChange("saturation", val)}
                          className="cursor-pointer flex-1 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange("saturation", Math.min(180, (theme.saturation ?? 100) + 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-rose-400 text-xs transition-colors cursor-pointer"
                          title="Aumentar 5%"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                        <button
                          type="button"
                          onClick={() => handleChange("saturation", 50)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("saturation", 100)}
                          className={cn(
                            "font-bold transition-colors cursor-pointer px-1 rounded",
                            (theme.saturation ?? 100) === 100 ? "text-rose-400 bg-rose-500/15" : "hover:text-foreground"
                          )}
                        >
                          100% Padrão
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("saturation", 150)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          150%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. BRILHO DE LETRAS / TEXTO */}
                  <div
                    onDoubleClick={() => handleChange("textBrightness", 100)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 select-none flex flex-col justify-between gap-3 shadow-xs",
                      (theme.textBrightness ?? 100) !== 100
                        ? "bg-yellow-500/10 border-yellow-500/40 shadow-yellow-500/5"
                        : "bg-secondary/25 border-border/70 hover:border-yellow-500/30 hover:bg-secondary/40"
                    )}
                    title="Dê duplo clique para restaurar 100%"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold block cursor-pointer text-foreground">
                            Brilho de Texto
                          </Label>
                          <span className="text-[10px] text-muted-foreground">Legibilidade</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChange("textBrightness", 100)}
                        className="px-2 py-0.5 rounded-lg font-mono text-xs font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all border border-yellow-500/30 cursor-pointer"
                        title="Clique para redefinir para 100%"
                      >
                        {theme.textBrightness ?? 100}%
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("textBrightness", Math.max(0, (theme.textBrightness ?? 100) - 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-yellow-400 text-xs transition-colors cursor-pointer"
                          title="Diminuir 5%"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Slider
                          value={[theme.textBrightness ?? 100]}
                          min={0}
                          max={180}
                          step={1}
                          onValueChange={([val]) => handleChange("textBrightness", val)}
                          className="cursor-pointer flex-1 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange("textBrightness", Math.min(180, (theme.textBrightness ?? 100) + 5))}
                          className="h-6 w-6 shrink-0 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 flex items-center justify-center text-foreground hover:text-yellow-400 text-xs transition-colors cursor-pointer"
                          title="Aumentar 5%"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                        <button
                          type="button"
                          onClick={() => handleChange("textBrightness", 50)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("textBrightness", 100)}
                          className={cn(
                            "font-bold transition-colors cursor-pointer px-1 rounded",
                            (theme.textBrightness ?? 100) === 100 ? "text-yellow-400 bg-yellow-500/15" : "hover:text-foreground"
                          )}
                        >
                          100% Padrão
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("textBrightness", 150)}
                          className="hover:text-foreground transition-colors cursor-pointer"
                        >
                          150%
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            ABA 3: CARDS, FONTES, BORDAS & DENSIDADE
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="estilos" className="space-y-5 m-0 focus-visible:outline-none">
          <div className="grid gap-5 md:grid-cols-2">
            {/* CARDS & SUPERFÍCIES */}
            <Card className="surface-card border-border/80 shadow-md">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Acabamento dos Cards</CardTitle>
                    <CardDescription className="text-xs">Texturas e transparência</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {CARD_STYLE_OPTIONS.map((opt) => {
                  const isSelected = theme.cardStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange("cardStyle", opt.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-bold text-foreground"
                          : "border-border/60 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{opt.name}</p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* TIPOGRAFIA */}
            <Card className="surface-card border-border/80 shadow-md">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Type className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Tipografia / Família de Fontes</CardTitle>
                    <CardDescription className="text-xs">Estilos de fonte da interface</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {FONT_OPTIONS.map((opt) => {
                  const isSelected = theme.fontFamily === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange("fontFamily", opt.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-bold text-foreground"
                          : "border-border/60 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{opt.name}</p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* DENSIDADE, BORDAS E PADRÕES */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* FORMATO DAS BORDAS */}
            <Card className="surface-card border-border/80 shadow-md">
              <CardHeader className="pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-xs font-bold">Formato das Bordas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                {BORDER_RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange("borderRadius", opt.id)}
                    className={cn(
                      "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                      theme.borderRadius === opt.id
                        ? "border-primary bg-primary/10 font-bold text-foreground"
                        : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{opt.name}</span>
                    {theme.borderRadius === opt.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* PADRÃO DE FUNDO */}
            <Card className="surface-card border-border/80 shadow-md">
              <CardHeader className="pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Grid className="h-4 w-4 text-cyan-400" />
                  <CardTitle className="text-xs font-bold">Padrão de Fundo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                {BG_PATTERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange("bgPattern", opt.id)}
                    className={cn(
                      "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                      theme.bgPattern === opt.id
                        ? "border-primary bg-primary/10 font-bold text-foreground"
                        : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{opt.name}</span>
                    {theme.bgPattern === opt.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* DENSIDADE DA INTERFACE */}
            <Card className="surface-card border-border/80 shadow-md">
              <CardHeader className="pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-xs font-bold">Densidade da Interface</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                {UI_DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange("uiDensity", opt.id)}
                    className={cn(
                      "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                      theme.uiDensity === opt.id
                        ? "border-primary bg-primary/10 font-bold text-foreground"
                        : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{opt.name}</span>
                    {theme.uiDensity === opt.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
