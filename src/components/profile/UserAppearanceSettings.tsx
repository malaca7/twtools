import { useState, useEffect } from "react";
import {
  Palette,
  Sparkles,
  Layers,
  Type,
  SunMedium,
  Contrast,
  Save,
  RotateCcw,
  Check,
  Shield,
  Zap,
  Sliders,
  Paintbrush,
  Grid,
  Square,
  Maximize2,
  Eye,
  SlidersHorizontal,
  Flame,
  Activity,
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
import { useUserTheme } from "@/hooks/useUserTheme";
import { DEFAULT_USER_THEME, type UserThemeSettings } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const THEME_CATEGORIES = [
  { id: "all", name: "Todos (30)" },
  { id: "light", name: "☀️ Temas Claros (8)" },
  { id: "cyberpunk", name: "Cyber & Neon" },
  { id: "faction", name: "Facções & Crime" },
  { id: "dark_minimal", name: "OLED & Minimal" },
  { id: "sports", name: "Esporte & Tactical" },
];

export const THEME_OPTIONS = [
  // ☀️ Temas Claros & Clean
  { id: "light_pearl", category: "light", name: "Clean Pearl White", color: "from-sky-300 to-blue-600", desc: "Branco pérola puro com detalhes em azul cobalto, sombras suaves e máxima legibilidade" },
  { id: "light_cloud", category: "light", name: "Soft Cloud Minimal", color: "from-slate-200 to-cyan-500", desc: "Cinza claro ultra suave com detalhes em ciano e ardósia" },
  { id: "light_sakura", category: "light", name: "Sakura Blossom Light", color: "from-pink-200 to-rose-400", desc: "Fundo claro floral suave com toques de rosa cerejeira e lavanda" },
  { id: "light_mint", category: "light", name: "Emerald Mint Light", color: "from-emerald-200 to-teal-400", desc: "Fundo claro refrescante com acentos menta, esmeralda e eucalipto" },
  { id: "light_amber", category: "light", name: "Solar Amber Light", color: "from-amber-200 to-orange-400", desc: "Fundo areia/bege claro com acentos dourados e laranja solar" },
  { id: "light_arctic", category: "light", name: "Arctic Ice Light", color: "from-cyan-100 to-blue-400", desc: "Fundo azul gelo muito claro com acentos azul ártico" },
  { id: "light_latte", category: "light", name: "Warm Latte & Vanilla", color: "from-amber-100 to-amber-600", desc: "Fundo pergaminho/latte quente com tons de café e bronze" },
  { id: "light_slate", category: "light", name: "Neo Light Slate", color: "from-slate-200 to-indigo-500", desc: "Fundo cinza moderno neutro com azul elétrico corporativo" },

  // Cyber & Neon
  { id: "cyberpunk", category: "cyberpunk", name: "Dark Cyberpunk (Padrão)", color: "from-purple-500 to-pink-500", desc: "Tons escuros com acentos neon ciano e rosa elétrico" },
  { id: "midnight", category: "cyberpunk", name: "Midnight Neon", color: "from-blue-600 to-indigo-500", desc: "Azul profundo com contrastes vibrantes e magenta" },
  { id: "emerald_matrix", category: "cyberpunk", name: "Emerald Matrix", color: "from-emerald-500 to-teal-400", desc: "Verde terminal hacker clássico de alta tecnologia" },
  { id: "sunset_synth", category: "cyberpunk", name: "Sunset Synthwave", color: "from-amber-500 to-rose-500", desc: "Gradientes dourados, pôr do sol e fúcsia retrô" },
  { id: "toxic_violet", category: "cyberpunk", name: "Toxic Biohazard", color: "from-violet-600 to-fuchsia-500", desc: "Roxo tóxico radioativo com destaque de alta densidade" },
  { id: "aqua_cyber", category: "cyberpunk", name: "Aqua Atlantis Cyber", color: "from-cyan-400 to-blue-600", desc: "Ciano oceânico profundo e azul turquesa elétrico" },
  { id: "vaporwave_dream", category: "cyberpunk", name: "Vaporwave Dream", color: "from-pink-400 to-cyan-300", desc: "Estética retrô pastel com azul céu e chiclete" },
  { id: "cyber_samurai", category: "cyberpunk", name: "Cyber Samurai", color: "from-blue-500 to-amber-400", desc: "Azul cobalto elétrico com toques de ouro solar" },

  // Facções & Crime
  { id: "crimson_blood", category: "faction", name: "Crimson Syndicate", color: "from-red-600 to-rose-500", desc: "Vermelho carmesim de facção combativa e sangue" },
  { id: "golden_viper", category: "faction", name: "Golden Cartel & Viper", color: "from-amber-400 to-yellow-600", desc: "Preto acetinado luxuoso com detalhes em ouro 24k" },
  { id: "amethyst_royal", category: "faction", name: "Amethyst Royal Imperial", color: "from-purple-600 to-amber-400", desc: "Roxo imperial nobre com toques de realeza dourada" },
  { id: "ruby_velvet", category: "faction", name: "Ruby Velvet & Wine", color: "from-rose-700 to-red-900", desc: "Vinho bordô aveludado e carmesim profundo" },
  { id: "dark_bdm", category: "faction", name: "Dark BdM (Midnight Blue)", color: "from-sky-500 to-blue-700", desc: "Azul marinho noturno imersivo de alta patente" },
  { id: "dark_bear", category: "faction", name: "Dark Bear (Urso Tático)", color: "from-amber-700 to-amber-900", desc: "Madeira nobre escura, couro e âmbar tático" },
  { id: "inferno_orange", category: "faction", name: "Inferno Volcanic Lava", color: "from-orange-500 to-red-600", desc: "Laranja vulcânico, brasa acesa e fogo tático" },
  { id: "dracula_vampire", category: "faction", name: "Dracula Gothic Vampire", color: "from-slate-700 to-pink-600", desc: "Slate escuro gótico com toques de violeta e neon" },

  // OLED & Minimal
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
  
  // Cores Claras & Pastéis
  { name: "Azul Bebê", value: "oklch(0.78 0.14 235)", hex: "#70b5ff", group: "light" },
  { name: "Menta Pastel", value: "oklch(0.85 0.15 160)", hex: "#6ee7b7", group: "light" },
  { name: "Lavanda Pastel", value: "oklch(0.80 0.16 300)", hex: "#c084fc", group: "light" },
  { name: "Rosa Algodão", value: "oklch(0.82 0.18 345)", hex: "#f472b6", group: "light" },
  { name: "Pêssego Pastel", value: "oklch(0.84 0.16 55)", hex: "#fb923c", group: "light" },
  { name: "Amarelo Canário", value: "oklch(0.90 0.16 95)", hex: "#fde047", group: "light" },
  { name: "Turquesa Claro", value: "oklch(0.82 0.15 190)", hex: "#2dd4bf", group: "light" },
  { name: "Coral Suave", value: "oklch(0.78 0.18 25)", hex: "#fb7185", group: "light" },
  { name: "Champagne Ouro", value: "oklch(0.88 0.12 85)", hex: "#fde68a", group: "light" },
  { name: "Platina Prata", value: "oklch(0.92 0.01 250)", hex: "#e2e8f0", group: "light" },

  // Cores Vivas & Neon
  { name: "Ciano Neon", value: "oklch(0.75 0.19 200)", hex: "#00e5ff", group: "vivid" },
  { name: "Rosa Cyber", value: "oklch(0.72 0.24 340)", hex: "#ff2a85", group: "vivid" },
  { name: "Verde Matrix", value: "oklch(0.78 0.22 145)", hex: "#00ff66", group: "vivid" },
  { name: "Ouro Real 24k", value: "oklch(0.80 0.18 85)", hex: "#ffb700", group: "vivid" },
  { name: "Vermelho Fogo", value: "oklch(0.65 0.24 25)", hex: "#ff3333", group: "vivid" },
  { name: "Roxo Cósmico", value: "oklch(0.70 0.22 300)", hex: "#bf00ff", group: "vivid" },
  { name: "Azul Celeste", value: "oklch(0.68 0.20 240)", hex: "#2979ff", group: "vivid" },
  { name: "Laranja Vulcão", value: "oklch(0.72 0.22 45)", hex: "#ff6d00", group: "vivid" },
  { name: "Branco Puro", value: "oklch(0.96 0 0)", hex: "#f8fafc", group: "vivid" },
];

export const CARD_STYLE_OPTIONS = [
  { id: "glassmorphism", name: "Glassmorphism", desc: "Vidro fosco translúcido com desfoque e reflexo" },
  { id: "flat_modern", name: "Flat Modern", desc: "Superfície fosca minimalista sem reflexos" },
  { id: "outline_glow", name: "Outline Glow", desc: "Bordas finas com iluminação neon contínua" },
  { id: "gradient", name: "Gradient High-Tech", desc: "Gradiente de superfície com contorno iluminado" },
  { id: "solid_oled", name: "Solid OLED Black", desc: "Preto profundo absoluto de alto contraste" },
  { id: "carbon", name: "Fibra de Carbono", desc: "Textura sutil inspirada em carros esportivos" },
  { id: "neo_brutalism", name: "Neo Brutalism", desc: "Bordas marcadas de 2px e sombra dimensional" },
];

export const FONT_OPTIONS = [
  { id: "space_grotesk", name: "Space Grotesk", desc: "Padrão moderno cyberpunk" },
  { id: "inter", name: "Inter UI", desc: "Extremamente limpa e legível" },
  { id: "rajdhani", name: "Rajdhani", desc: "Tática, esportiva e gamer" },
  { id: "orbitron", name: "Orbitron", desc: "Display sci-fi e futurista" },
  { id: "outfit", name: "Outfit", desc: "Geométrica, moderna e suave" },
  { id: "jetbrains_mono", name: "JetBrains Mono", desc: "Monoespaçada para hackers & devs" },
  { id: "plus_jakarta", name: "Plus Jakarta Sans", desc: "Ultra premium corporativa" },
  { id: "montserrat", name: "Montserrat", desc: "Imponente, clássica e versátil" },
  { id: "cinzel", name: "Cinzel", desc: "Clássica e nobre com serifas" },
];

export const BG_PATTERN_OPTIONS = [
  { id: "cyber_grid", name: "Grade Cyberpunk (Cyber Grid)", desc: "Grade geométrica com iluminação ambiente" },
  { id: "subtle_dots", name: "Matriz de Pontos (Subtle Dots)", desc: "Pontos suaves em padrão quadriculado" },
  { id: "carbon_mesh", name: "Malha de Carbono (Carbon Mesh)", desc: "Textura entrelaçada de fibra de carbono" },
  { id: "radial_glow", name: "Luzes Radiais (Radial Ambient)", desc: "Feixes suaves de luz nas extremidades" },
  { id: "none", name: "Limpo (Sem Padrão)", desc: "Fundo totalmente sólido e clean" },
];

export const BORDER_RADIUS_OPTIONS = [
  { id: "sharp", name: "Reto (0px)", desc: "Bordas afiadas estilo militar/brutalista" },
  { id: "medium", name: "Médio (8px)", desc: "Arredondamento discreto clássico" },
  { id: "smooth", name: "Suave (14px)", desc: "Padrão moderno arredondado" },
  { id: "pill", name: "Pill (22px)", desc: "Extremamente arredondado e macio" },
];

export const UI_DENSITY_OPTIONS = [
  { id: "compact", name: "Compacto", desc: "Mais dados na tela com fontes e margens menores" },
  { id: "normal", name: "Equilibrado (Normal)", desc: "Espaçamento padrão confortável" },
  { id: "spacious", name: "Espaçoso", desc: "Mais espaço para respirar e leitura facilitada" },
];

export function UserAppearanceSettings() {
  const { theme, saveTheme, resetTheme, previewTheme, isSaving } = useUserTheme();
  const [formData, setFormData] = useState<UserThemeSettings>(theme);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(theme);
    setHasChanges(false);
  }, [theme]);

  const handleChange = <K extends keyof UserThemeSettings>(key: K, value: UserThemeSettings[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(theme));
      previewTheme(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    await saveTheme(formData);
    setHasChanges(false);
  };

  const handleReset = async () => {
    if (!confirm("Restaurar todas as configurações de tema e aparência para o padrão original?")) return;
    await resetTheme();
    setFormData(DEFAULT_USER_THEME);
    setHasChanges(false);
  };

  const filteredThemes = selectedCategory === "all"
    ? THEME_OPTIONS
    : THEME_OPTIONS.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* TOP ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Minha Aparência & Customização Visual
            </h3>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono font-bold">
              INDIVIDUAL
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure seu próprio tema, cores de destaque, fontes, bordas e efeitos visuais da plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-md disabled:opacity-40 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Minha Configuração
          </Button>
        </div>
      </div>

      {/* LIVE PREVIEW BOX */}
      <Card className="surface-card overflow-hidden border-primary/30 shadow-lg">
        <CardHeader className="pb-3 border-b border-border/60 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <CardTitle className="text-xs sm:text-sm font-bold">
                Pré-visualização Ao Vivo da Sua Interface
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-background/50">
              {hasChanges ? "Modificações Não Salvas" : "Sincronizado"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* MINI CARD 1 */}
            <div className="p-3.5 rounded-xl border border-border/80 surface-card shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Módulo Interativo</span>
                <Badge className="text-[9px] font-mono px-1.5 py-0">Ativo</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                As superfícies, fontes e botões reagem imediatamente às suas preferências.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Button size="sm" className="h-7 text-xs font-bold bg-primary text-primary-foreground shadow-xs">
                  Botão Principal
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Secundário
                </Button>
              </div>
            </div>

            {/* MINI CARD 2 */}
            <div className="p-3.5 rounded-xl border border-border/80 surface-card shadow-xs space-y-2">
              <span className="text-xs font-bold text-foreground">Indicadores & Status</span>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                    Membro Online
                  </span>
                  <span className="font-bold">OK</span>
                </div>
                <div className="flex items-center justify-between text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                    Ausente Temporário
                  </span>
                  <span className="font-bold">5m</span>
                </div>
                <div className="flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5 font-bold">
                    ★ Cargo de Liderança
                  </span>
                  <Badge variant="secondary" className="text-[9px] py-0">01</Badge>
                </div>
              </div>
            </div>

            {/* MINI CARD 3 */}
            <div className="p-3.5 rounded-xl border border-border/80 surface-card shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Resumo do Estilo</span>
                <div className="space-y-1 mt-1.5 text-[11px] text-muted-foreground font-mono">
                  <div>Tema: <strong className="text-foreground">{formData.themeStyle}</strong></div>
                  <div>Fonte: <strong className="text-foreground">{formData.fontFamily}</strong></div>
                  <div>Cards: <strong className="text-foreground">{formData.cardStyle}</strong></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
                <span>Brilho: {formData.brightness}%</span>
                <span>Contraste: {formData.contrast}%</span>
                <span>Sat: {formData.saturation ?? 100}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1: THEMES SELECTION */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Catálogo de Temas (22 Opções)</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Escolha um tema completo desenhado especialmente para a plataforma
                </CardDescription>
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {THEME_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredThemes.map((opt) => {
              const isSelected = formData.themeStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange("themeStyle", opt.id)}
                  className={cn(
                    "flex flex-col p-3 rounded-xl text-left border transition-all text-xs cursor-pointer relative group",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                      : "border-border/60 bg-secondary/20 hover:bg-secondary/50 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("h-3.5 w-3.5 rounded-full bg-gradient-to-br shrink-0 shadow-xs ring-1 ring-white/20", opt.color)} />
                      <span className="font-extrabold text-foreground truncate text-xs">
                        {opt.name}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: CUSTOM COLOR ACCENT */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400">
              <Paintbrush className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Cor de Destaque Personalizada (Custom Accent)</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Substitua a cor primária de botões, luzes e badges por sua cor favorita
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* PADRÃO */}
          <div>
            {(() => {
              const defaultPreset = ACCENT_COLOR_PRESETS[0];
              const isSelected = formData.customPrimaryColor === defaultPreset.value;
              return (
                <button
                  type="button"
                  onClick={() => handleChange("customPrimaryColor", defaultPreset.value)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer w-full sm:w-64",
                    isSelected
                      ? "border-primary bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                      : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="h-4 w-4 rounded-full shrink-0 border border-white/20 shadow-xs bg-gradient-to-r from-primary to-accent" />
                  <span className="truncate text-xs font-bold">{defaultPreset.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 ml-auto text-primary shrink-0" />}
                </button>
              );
            })()}
          </div>

          {/* CORES CLARAS & PASTÉIS */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">🌸 Cores Claras & Pastéis</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground">
                Recomendado para temas claros
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ACCENT_COLOR_PRESETS.filter((p) => p.group === "light").map((preset) => {
                const isSelected = formData.customPrimaryColor === preset.value;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleChange("customPrimaryColor", preset.value)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left border transition-all text-xs cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                        : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="truncate text-[11px] font-semibold">{preset.name}</span>
                    {isSelected && <Check className="h-3 w-3 ml-auto text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CORES VIVAS & NEON */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">⚡ Cores Vivas, Neon & Intensas</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground">
                Alto impacto
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ACCENT_COLOR_PRESETS.filter((p) => p.group === "vivid").map((preset) => {
                const isSelected = formData.customPrimaryColor === preset.value;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleChange("customPrimaryColor", preset.value)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left border transition-all text-xs cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                        : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="truncate text-[11px] font-semibold">{preset.name}</span>
                    {isSelected && <Check className="h-3 w-3 ml-auto text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELETOR LIVRE & HEX */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40 bg-secondary/15 p-3 rounded-xl">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Paintbrush className="h-3.5 w-3.5 text-primary" />
                Seletor Livre & Código Hexadecimal
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Escolha qualquer cor da paleta ou cole o código Hexadecimal exato
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  formData.customPrimaryColor && formData.customPrimaryColor.startsWith("#")
                    ? formData.customPrimaryColor
                    : "#6366f1"
                }
                onChange={(e) => handleChange("customPrimaryColor", e.target.value)}
                className="h-9 w-12 rounded-xl border border-border bg-card cursor-pointer p-0.5 shadow-xs shrink-0"
              />
              <Input
                placeholder="#6366f1 ou oklch(...)"
                value={formData.customPrimaryColor || ""}
                onChange={(e) => handleChange("customPrimaryColor", e.target.value || null)}
                className="h-9 w-40 text-xs font-mono rounded-xl bg-background/80"
              />
              {formData.customPrimaryColor && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange("customPrimaryColor", null)}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                  title="Restaurar padrão do tema"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: CARDS, FONTS, PATTERNS & BORDERS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CARDS & SUPERFÍCIES */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Estilo dos Cards & Superfícies</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  7 opções de acabamento e texturas dos blocos
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-2.5">
            {CARD_STYLE_OPTIONS.map((opt) => {
              const isSelected = formData.cardStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange("cardStyle", opt.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-bold"
                      : "border-border/60 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground">{opt.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{opt.desc}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* TIPOGRAFIA & FONTES */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Type className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Tipografia / Família de Fontes</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  9 estilos de fontes completas para toda a interface
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-2.5">
            {FONT_OPTIONS.map((opt) => {
              const isSelected = formData.fontFamily === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange("fontFamily", opt.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-bold"
                      : "border-border/60 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground">{opt.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{opt.desc}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: BACKGROUND PATTERNS, BORDER RADIUS & DENSITY */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* PADRÃO DE FUNDO */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Grid className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Padrão de Fundo</CardTitle>
                <CardDescription className="text-[0.7rem]">Textura ambiente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {BG_PATTERN_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChange("bgPattern", opt.id)}
                className={cn(
                  "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                  formData.bgPattern === opt.id
                    ? "border-primary bg-primary/10 font-bold text-foreground"
                    : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate text-xs">{opt.name}</span>
                {formData.bgPattern === opt.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* BORDER RADIUS */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Square className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Formato das Bordas</CardTitle>
                <CardDescription className="text-[0.7rem]">Arredondamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {BORDER_RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChange("borderRadius", opt.id)}
                className={cn(
                  "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                  formData.borderRadius === opt.id
                    ? "border-primary bg-primary/10 font-bold text-foreground"
                    : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate text-xs">{opt.name}</span>
                {formData.borderRadius === opt.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* UI DENSITY */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Maximize2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Densidade da Interface</CardTitle>
                <CardDescription className="text-[0.7rem]">Escala e espaçamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {UI_DENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChange("uiDensity", opt.id)}
                className={cn(
                  "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                  formData.uiDensity === opt.id
                    ? "border-primary bg-primary/10 font-bold text-foreground"
                    : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate text-xs">{opt.name}</span>
                {formData.uiDensity === opt.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: VISUAL EFFECTS, SLIDERS & ANIMATIONS */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Iluminação, Animações e Controles Finos</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Glow neon, brilho, contraste, saturação e velocidade de transições
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* TOGGLES GRID */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-secondary/30">
              <div>
                <Label className="text-xs font-bold cursor-pointer block">Efeito Glow ✨</Label>
                <span className="text-[10px] text-muted-foreground">Iluminação neon</span>
              </div>
              <Switch
                checked={formData.glowEffectsEnabled}
                onCheckedChange={(val) => handleChange("glowEffectsEnabled", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-secondary/30">
              <div>
                <Label className="text-xs font-bold cursor-pointer block">Pulso de Status</Label>
                <span className="text-[10px] text-muted-foreground">Animação online</span>
              </div>
              <Switch
                checked={formData.statusPulseEnabled}
                onCheckedChange={(val) => handleChange("statusPulseEnabled", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-secondary/30">
              <div>
                <Label className="text-xs font-bold cursor-pointer block">Zoom no Hover</Label>
                <span className="text-[10px] text-muted-foreground">Efeito 3D ao passar</span>
              </div>
              <Switch
                checked={formData.hoverZoomEnabled}
                onCheckedChange={(val) => handleChange("hoverZoomEnabled", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-secondary/30">
              <div>
                <Label className="text-xs font-bold cursor-pointer block">Transições</Label>
                <span className="text-[10px] text-muted-foreground">Navegação suave</span>
              </div>
              <Switch
                checked={formData.pageTransitionsEnabled}
                onCheckedChange={(val) => handleChange("pageTransitionsEnabled", val)}
              />
            </div>
          </div>

          {/* INTENSIDADE DO GLOW & VELOCIDADE */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Intensidade do Glow Neon</Label>
              <Select
                value={formData.glowIntensity || "medium"}
                onValueChange={(val) => handleChange("glowIntensity", val)}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/80 font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Suave (25% Glow)</SelectItem>
                  <SelectItem value="medium" className="text-xs">Médio (Padrão 50% Glow)</SelectItem>
                  <SelectItem value="high" className="text-xs">Intenso (100% Neon Ultra Glow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Velocidade da Pulsação / Animações</Label>
              <Select
                value={formData.borderGlowSpeed || "normal"}
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

          {/* SLIDERS GRID: BRILHO, CONTRASTE, SATURAÇÃO */}
          <div className="grid gap-5 md:grid-cols-3 pt-3 border-t border-border/40">
            {/* BRILHO */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <SunMedium className="h-3.5 w-3.5 text-amber-400" />
                  Brilho Global
                </Label>
                <span className="text-xs font-mono font-bold text-primary">{formData.brightness}%</span>
              </div>
              <Slider
                value={[formData.brightness]}
                min={60}
                max={140}
                step={5}
                onValueChange={([val]) => handleChange("brightness", val)}
                className="cursor-pointer"
              />
            </div>

            {/* CONTRASTE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Contrast className="h-3.5 w-3.5 text-blue-400" />
                  Contraste Global
                </Label>
                <span className="text-xs font-mono font-bold text-primary">{formData.contrast}%</span>
              </div>
              <Slider
                value={[formData.contrast]}
                min={60}
                max={140}
                step={5}
                onValueChange={([val]) => handleChange("contrast", val)}
                className="cursor-pointer"
              />
            </div>

            {/* SATURAÇÃO */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  Saturação de Cores
                </Label>
                <span className="text-xs font-mono font-bold text-primary">{formData.saturation ?? 100}%</span>
              </div>
              <Slider
                value={[formData.saturation ?? 100]}
                min={30}
                max={180}
                step={5}
                onValueChange={([val]) => handleChange("saturation", val)}
                className="cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
