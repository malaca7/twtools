import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Zap,
  Star,
  Award,
  ChevronRight,
  TrendingUp,
  Shield,
  Sparkles,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Crown,
  Quote,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getLevelInfo,
  getMemberInsignias,
  RARITY_CONFIG,
  type MemberInsigniaGrant,
} from "@/services/gamificationService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MemberInsigniasListModal } from "@/components/gamification/MemberInsigniasListModal";
import { getInsigniaIconStyles } from "@/components/gamification/InsigniaCatalogManagerModal";

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Shield,
  Sparkles,
  Crown,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Star,
  TrendingUp,
};

export function renderInsigniaIcon(iconName?: string, className = "h-4 w-4") {
  const IconComponent = (iconName && ICON_MAP[iconName]) || Award;
  return <IconComponent className={className} />;
}

export interface MemberGamificationCardProps {
  userId: string;
  totalXp: number;
  gamificationLevel?: number;
  rankPosition?: number;
  starsRating?: number;
  starsCount?: number;
  compact?: boolean;
  className?: string;
  showInsignias?: boolean;
  isPublic?: boolean;
}

export function MemberGamificationCard({
  userId,
  totalXp,
  gamificationLevel,
  rankPosition,
  starsRating = 5.0,
  starsCount = 0,
  compact = false,
  className,
  showInsignias = true,
  isPublic = false,
}: MemberGamificationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasPermission } = useAuth();
  const canViewXp = isPublic || hasPermission("view_member_xp");
  const canViewInsignias = isPublic || hasPermission("view_insignias");
  const effectiveShowInsignias = showInsignias && canViewInsignias;

  const levelInfo = useMemo(() => getLevelInfo(totalXp), [totalXp]);

  const { data: memberInsignias = [] } = useQuery({
    queryKey: ["member_insignias", userId],
    queryFn: () => getMemberInsignias(userId),
    enabled: Boolean(userId) && effectiveShowInsignias,
    staleTime: 60 * 1000,
  });

  if (!canViewXp) return null;

  return (
    <>
      <Card
      className={cn(
        "surface-card border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.03] to-transparent shadow-lg relative overflow-hidden",
        className
      )}
    >
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 pointer-events-none">
        <Trophy className="h-48 w-48 text-amber-400" />
      </div>

      <CardContent className={cn("p-4 sm:p-5 relative z-10 space-y-4", compact && "p-3 space-y-3")}>
        {/* TOP ROW: NÍVEL, TITULO, RANKING E ESTRELAS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 font-black text-lg font-mono">
              {levelInfo.level}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-extrabold flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> Nível {levelInfo.level}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-amber-500/40 text-amber-300 bg-amber-500/10 py-0"
                >
                  {levelInfo.title}
                </Badge>
              </div>

              <p className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                {levelInfo.currentXp.toLocaleString()}{" "}
                <span className="text-amber-400 text-xs font-sans">XP Total</span>
              </p>
            </div>
          </div>

          {/* BADGES METRICAS: RANKING E ESTRELAS */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {rankPosition !== undefined && rankPosition > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-background/80 border border-amber-500/30 text-center shadow-xs">
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Ranking
                </span>
                <span className="text-xs font-black text-amber-300 flex items-center justify-center gap-1">
                  <Trophy className="h-3 w-3" /> #{rankPosition}º
                </span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-background/80 border border-amber-500/30 text-center shadow-xs">
              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                Avaliação
              </span>
              <span className="text-xs font-black text-amber-300 flex items-center justify-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(starsRating || 5.0).toFixed(1)}
                {starsCount > 0 && (
                  <span className="text-[9px] text-muted-foreground font-normal">
                    ({starsCount})
                  </span>
                )}
              </span>
            </div>

            <Link to="/rankings">
              <div className="h-10 px-2.5 rounded-xl bg-secondary/60 hover:bg-amber-500/20 text-muted-foreground hover:text-amber-300 border border-border/80 hover:border-amber-500/40 flex items-center justify-center transition-all cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>

        {/* PROGRESS BAR TO NEXT LEVEL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted-foreground">
              Progresso para o Nível {levelInfo.level + 1}:
            </span>
            <span className="text-foreground font-bold">
              {levelInfo.currentXp.toLocaleString()} / {levelInfo.nextLevelXp.toLocaleString()} XP{" "}
              <span className="text-amber-400 font-sans">({levelInfo.progressPercent}%)</span>
            </span>
          </div>

          <div className="h-2.5 w-full bg-secondary/80 rounded-full overflow-hidden p-0.5 border border-border/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
              style={{ width: `${Math.max(3, levelInfo.progressPercent)}%` }}
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            Faltam <strong className="text-amber-300 font-mono">{levelInfo.xpNeededForNext.toLocaleString()} XP</strong> para subir de patente na facção.
          </p>
        </div>

        {/* INSÍGNIAS CONQUISTADAS */}
        {effectiveShowInsignias && (
          <div className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400" /> Insígnias Conquistadas ({memberInsignias.length}):
              </span>
              {memberInsignias.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-semibold"
                >
                  Ver detalhes completos
                </button>
              ) : (
                <Link to="/rankings" className="text-[10px] text-amber-400 hover:underline font-semibold">
                  Ver catálogo no ranking
                </Link>
              )}
            </div>

            {memberInsignias.length > 0 ? (
              <TooltipProvider delayDuration={50}>
                <div className="flex flex-wrap items-center gap-2.5">
                  {memberInsignias.map((grant) => {
                    const badge = grant.insignia;
                    if (!badge) return null;
                    const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                    const iconStyle = getInsigniaIconStyles(badge);
                    const glowColor = badge.border_color || badge.bg_color || badge.color;

                    return (
                      <Tooltip key={grant.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className={cn(
                              "group relative flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] rounded-xl border-2 shadow-md transition-all duration-200 cursor-pointer select-none",
                              "hover:scale-115 hover:-translate-y-1 hover:z-20 active:scale-95",
                              !iconStyle && rarity.bgClass,
                              !iconStyle && rarity.borderClass,
                              !iconStyle && rarity.textClass,
                              rarity.glowClass ? `hover:${rarity.glowClass}` : ""
                            )}
                            style={{
                              ...(iconStyle || {}),
                              boxShadow: glowColor
                                ? `0 4px 18px -2px ${glowColor}60`
                                : "0 4px 14px -2px rgba(0,0,0,0.35)",
                            }}
                            aria-label={`${badge.name} (${rarity.label})`}
                          >
                            {/* Brilho Holográfico no Hover */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]" />

                            {/* Ícone Centralizado do Emblema */}
                            <div className="transform transition-transform duration-200 group-hover:scale-110">
                              {renderInsigniaIcon(badge.icon, "h-6 w-6 shrink-0")}
                            </div>

                            {/* Estrela de Honra no Canto Superior Direito */}
                            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-background border border-amber-400/80 flex items-center justify-center shadow-xs">
                              <span className="text-[7px] text-amber-400 leading-none font-bold select-none">★</span>
                            </div>
                          </button>
                        </TooltipTrigger>

                        <TooltipContent
                          side="top"
                          className="p-3 max-w-xs bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl space-y-1.5 z-[99999]"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-1.5">
                            <span className="font-black text-xs text-foreground truncate">
                              {badge.name}
                            </span>
                            <span
                              className={cn(
                                "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
                                rarity.bgClass,
                                rarity.borderClass,
                                rarity.textClass
                              )}
                            >
                              {rarity.label}
                            </span>
                          </div>
                          {badge.description && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {badge.description}
                            </p>
                          )}
                          {grant.reason && (
                            <div className="p-1.5 rounded-lg bg-background/80 border border-white/10 text-[10px]">
                              <p className="italic text-foreground/90 font-medium leading-snug">
                                "{grant.reason}"
                              </p>
                            </div>
                          )}
                          <div className="text-[9px] text-center text-amber-400 font-semibold pt-0.5">
                            Clique para abrir detalhes completos
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            ) : (
              <div className="py-2.5 px-3 rounded-xl bg-secondary/30 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400/70 shrink-0" />
                <span>Nenhuma insígnia conquistada ainda. Participe de ações, eventos e doações para ser condecorado pela liderança!</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <MemberInsigniasListModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      member={{ user_id: userId, nome: "Membro", nickname: "Minhas Condecorações" }}
    />
  </>
  );
}
