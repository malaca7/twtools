import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Shield,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Crown,
  Sparkles,
  Star,
  Flame,
  Zap,
  Medal,
  Users,
  Calendar,
  User,
  Quote,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMemberInsignias, RARITY_CONFIG, type MemberInsigniaGrant, type RankedGamificationMember } from "@/services/gamificationService";
import { getInsigniaCardStyles } from "@/components/gamification/InsigniaCatalogManagerModal";
import { cn } from "@/lib/utils";
import { InsigniaEmblem } from "@/components/gamification/InsigniaIcon";

interface MemberInsigniasListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: RankedGamificationMember | { user_id: string; nome: string; nickname?: string | null; avatar_url?: string | null } | null;
  onGrantClick?: () => void;
  canGrant?: boolean;
}

export function MemberInsigniasListModal({
  open,
  onOpenChange,
  member,
  onGrantClick,
  canGrant = false,
}: MemberInsigniasListModalProps) {
  const userId = member?.user_id || "";

  const { data: insignias = [], isLoading } = useQuery({
    queryKey: ["member_insignias", userId],
    queryFn: () => (userId ? getMemberInsignias(userId) : Promise.resolve([])),
    enabled: open && Boolean(userId),
    staleTime: 10 * 1000,
  });

  const memberName = member?.nickname || member?.nome || "Membro";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-card/95 border-border backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                Condecorações de {memberName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Honrarias e insígnias oficiais conquistadas na trajetória da Twin Wheels.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Carregando condecorações do integrante...
            </div>
          ) : insignias.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-border/80 rounded-2xl p-6">
              <Award className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Nenhuma insígnia ainda</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Este integrante ainda não recebeu nenhuma insígnia de honra da diretoria da facção.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {insignias.map((grant) => {
                const b = grant.insignia;
                const rarityStyle = b?.rarity ? RARITY_CONFIG[b.rarity] : RARITY_CONFIG.comum;
                const cardStyle = getInsigniaCardStyles(b || {});
                return (
                  <div
                    key={grant.id}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-sm shadow-xs",
                      !cardStyle && rarityStyle.borderClass,
                      !cardStyle && rarityStyle.bgClass
                    )}
                    style={cardStyle}
                  >
                    <div className="flex items-start gap-3.5">
                      <InsigniaEmblem
                        icon={b?.icon}
                        name={b?.name}
                        rarity={b?.rarity}
                        shape_3d={b?.shape_3d}
                        material_3d={b?.material_3d}
                        border_style_3d={b?.border_style_3d}
                        gloss_effect={b?.gloss_effect}
                        size="md"
                        color={b?.color}
                        bgColor={b?.bg_color}
                        borderColor={b?.border_color}
                        interactive={false}
                      />

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-foreground tracking-tight">
                            {b?.name || grant.insignia_id}
                          </h4>
                          <Badge
                            className={cn(
                              "text-[10px] font-extrabold uppercase px-2 py-0 border",
                              rarityStyle.borderClass,
                              rarityStyle.bgClass,
                              rarityStyle.textClass
                            )}
                          >
                            {rarityStyle.label}
                          </Badge>
                        </div>

                        {b?.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {b.description}
                          </p>
                        )}

                        {grant.reason && (
                          <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-xs text-foreground flex items-start gap-1.5">
                            <Quote className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="italic leading-snug">"{grant.reason}"</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30 font-mono">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-primary" />
                            <span>Concedido por: <strong>{grant.grantor_name}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(grant.granted_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between pt-2">
          {canGrant && onGrantClick ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onGrantClick();
              }}
              className="text-xs font-bold gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            >
              <Award className="h-4 w-4" />
              Conceder Nova Insígnia
            </Button>
          ) : (
            <div />
          )}

          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
