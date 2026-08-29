import { useState, useMemo } from "react";
import { Trophy, Lock, CheckCircle2, Award, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Insignia } from "@/lib/insignias";
import { cn } from "@/lib/utils";

interface InsigniaGridProps {
  insignias: Insignia[];
  compact?: boolean;
}

export function InsigniaGrid({ insignias, compact = false }: InsigniaGridProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const unlockedCount = insignias.filter((i) => i.unlocked).length;
  const pctTotal = insignias.length > 0 ? Math.round((unlockedCount / insignias.length) * 100) : 0;

  const filteredInsignias = useMemo(() => {
    if (filter === "unlocked") return insignias.filter((i) => i.unlocked);
    if (filter === "locked") return insignias.filter((i) => !i.unlocked);
    return insignias;
  }, [insignias, filter]);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {insignias.map((badge) => (
          <TooltipProvider key={badge.id}>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "relative flex items-center justify-center h-10 w-10 rounded-xl border transition-all duration-200 cursor-pointer text-xl shadow-md group hover:scale-110 hover:z-10",
                    badge.unlocked
                      ? cn("bg-gradient-to-br border-primary/50 shadow-primary/20", badge.bgGradient, badge.borderColor)
                      : "bg-secondary/40 border-border/50 text-muted-foreground opacity-45 grayscale hover:grayscale-0 hover:opacity-80"
                  )}
                >
                  <span className="transform transition-transform duration-200 group-hover:scale-125 select-none">{badge.icon}</span>
                  {!badge.unlocked && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-background/90 border border-border/80 rounded-full flex items-center justify-center shadow-sm">
                      <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                  )}
                  {badge.unlocked && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-3.5 max-w-xs bg-card/95 backdrop-blur-md border-border/80 shadow-2xl rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl select-none">{badge.icon}</span>
                    <span className="font-extrabold text-xs text-foreground">{badge.title}</span>
                  </div>
                  {badge.unlocked ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[9px] font-bold px-2 py-0.5">
                      Desbloqueada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-2 py-0.5 text-muted-foreground font-semibold">
                      Bloqueada
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{badge.description}</p>
                <div className="space-y-1 pt-1.5 border-t border-border/40">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-muted-foreground font-medium">Requisito: {badge.reqText}</span>
                    <span className="font-bold text-primary font-mono">{badge.progress}%</span>
                  </div>
                  <Progress value={badge.progress} className="h-1 bg-secondary/80" />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  // Full Card View
  return (
    <Card className="surface-card border-border/70 shadow-xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50 bg-gradient-to-r from-card via-secondary/20 to-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2 tracking-tight">
                Galeria de Insígnias & Conquistas Operacionais
                <Sparkles className="h-4 w-4 text-amber-400" />
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Medalhas de mérito e distintivos de honra conquistados com base na sua produtividade na facção.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                  filter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todas ({insignias.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unlocked")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                  filter === "unlocked"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Desbloqueadas ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("locked")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                  filter === "locked"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bloqueadas ({insignias.length - unlockedCount})
              </button>
            </div>

            {/* Overall Progress Counter Badge */}
            <Badge variant="outline" className="text-xs font-mono font-bold border-amber-500/40 text-amber-400 gap-1.5 px-3 py-1.5 bg-amber-500/10 shadow-sm">
              <Trophy className="h-3.5 w-3.5" />
              {unlockedCount} / {insignias.length} ({pctTotal}%)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredInsignias.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 overflow-hidden shadow-sm hover:shadow-xl",
                badge.unlocked
                  ? cn("bg-gradient-to-br", badge.bgGradient, badge.borderColor, "hover:-translate-y-1 hover:scale-[1.01]")
                  : "bg-secondary/15 border-border/40 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:border-border/80"
              )}
            >
              {/* Decorative radial glow behind icon */}
              {badge.unlocked && (
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/20 blur-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />
              )}

              <div>
                {/* Icon Box & Status Tag */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border backdrop-blur-md transition-transform duration-300 group-hover:scale-110 select-none",
                      badge.unlocked
                        ? "bg-background/70 border-white/20 shadow-inner"
                        : "bg-secondary/50 border-border/40"
                    )}
                  >
                    {badge.icon}
                  </div>

                  {badge.unlocked ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-black uppercase tracking-wider gap-1 px-2.5 py-1 shadow-sm shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Ativa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-secondary/40 border-border/60 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider gap-1 px-2 py-0.5 shrink-0">
                      <Lock className="h-3 w-3" /> Trava
                    </Badge>
                  )}
                </div>

                {/* Title & Description */}
                <div className="mt-3.5 space-y-1">
                  <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors tracking-tight">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Requirement & Progress Bar */}
              <div className="space-y-2 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted-foreground font-semibold truncate max-w-[70%]">
                    {badge.reqText}
                  </span>
                  <span className={cn("font-black font-mono text-xs", badge.unlocked ? "text-emerald-400" : "text-foreground")}>
                    {badge.progress}%
                  </span>
                </div>
                <Progress value={badge.progress} className="h-2 rounded-full bg-background/60" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
