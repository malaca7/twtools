import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, ChevronRight, Quote, Shield, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MemberInsigniasListModal } from "@/components/gamification/MemberInsigniasListModal";
import { InsigniaEmblem } from "@/components/gamification/InsigniaIcon";
import { getMemberInsignias, RARITY_CONFIG } from "@/services/gamificationService";
import { cn } from "@/lib/utils";

export interface MemberInsigniasCardsSectionProps {
  userId: string;
  member?: {
    user_id: string;
    nome: string;
    nickname?: string;
    avatar_url?: string;
  };
  title?: string;
  description?: string;
  isSelf?: boolean;
  className?: string;
}

export function MemberInsigniasCardsSection({
  userId,
  member,
  title = "Quadro de Condecorações & Insígnias",
  description = "Títulos honoríficos e condecorações oficiais concedidas pela liderança da Twin Wheels",
  isSelf = true,
  className,
}: MemberInsigniasCardsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: memberInsignias = [] } = useQuery({
    queryKey: ["member_insignias", userId],
    queryFn: () => (userId ? getMemberInsignias(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const memberDisplayName = member?.nickname || member?.nome || "Membro";

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span>{title}</span>
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border-amber-500/30 px-3 py-1"
          >
            {memberInsignias.length} {memberInsignias.length === 1 ? "Emblema" : "Emblemas"}
          </Badge>

          {memberInsignias.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5 h-8 cursor-pointer rounded-xl"
            >
              <span>Ver Detalhes</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* VITRINE DE EMBLEMAS QUADRADOS */}
      {memberInsignias.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-secondary/15 border border-border/60 backdrop-blur-md shadow-sm">
          <TooltipProvider delayDuration={50}>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {memberInsignias.map((grant) => {
                const badge = grant.insignia;
                if (!badge) return null;
                const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;

                return (
                  <Tooltip key={grant.id}>
                    <TooltipTrigger asChild>
                      <div>
                        <InsigniaEmblem
                          icon={badge.icon}
                          name={badge.name}
                          rarity={badge.rarity}
                          shape_3d={badge.shape_3d}
                          material_3d={badge.material_3d}
                          border_style_3d={badge.border_style_3d}
                          gloss_effect={badge.gloss_effect}
                          size="md"
                          color={badge.color}
                          bgColor={badge.bg_color}
                          borderColor={badge.border_color}
                          onClick={() => setIsModalOpen(true)}
                          interactive
                        />
                      </div>
                    </TooltipTrigger>

                    <TooltipContent
                      side="top"
                      className="p-3.5 max-w-xs bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl space-y-2 z-[99999]"
                    >
                      {/* Topo do Tooltip com Ícone, Nome e Raridade */}
                      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <InsigniaEmblem
                            icon={badge.icon}
                            name={badge.name}
                            rarity={badge.rarity}
                            shape_3d={badge.shape_3d}
                            material_3d={badge.material_3d}
                            border_style_3d={badge.border_style_3d}
                            gloss_effect={badge.gloss_effect}
                            size="xs"
                            color={badge.color}
                            bgColor={badge.bg_color}
                            borderColor={badge.border_color}
                            showStar={false}
                            interactive={false}
                          />
                          <span className="font-black text-xs text-foreground truncate">
                            {badge.name}
                          </span>
                        </div>
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

                      {/* Descrição */}
                      {badge.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {badge.description}
                        </p>
                      )}

                      {/* Motivo da Condecoração (se houver) */}
                      {grant.reason && (
                        <div className="p-2 rounded-xl bg-background/80 border border-white/10 text-[10px] space-y-0.5">
                          <span className="font-bold text-amber-400 block uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <Quote className="h-2.5 w-2.5" /> Motivo:
                          </span>
                          <p className="italic text-foreground/90 font-medium leading-snug">
                            "{grant.reason}"
                          </p>
                        </div>
                      )}

                      {/* Rodapé do Tooltip com Concessor e Data */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <Shield className="h-3 w-3 text-amber-400 shrink-0" />
                          <span>{grant.grantor_name || "Liderança Twin"}</span>
                        </span>
                        <span className="font-bold text-foreground/80 shrink-0">
                          {new Date(grant.granted_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="text-[9px] text-center text-amber-400 font-semibold pt-0.5">
                        Clique no emblema para abrir histórico completo
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      ) : (
        <Card className="surface-card p-8 text-center border-dashed border-border/60 rounded-3xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <Award className="h-7 w-7 text-amber-400/60" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-1">
            Nenhuma condecoração registrada ainda
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {isSelf
              ? "Você ainda não possui insígnias oficiais. Participe de ações, operações no asfalto e contribua para o grupo para ser condecorado pela liderança!"
              : "Este integrante ainda não recebeu medalhas ou títulos de honra registrados pela liderança."}
          </p>
        </Card>
      )}

      {/* MODAL DE DETALHES DAS INSÍGNIAS */}
      <MemberInsigniasListModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        member={{
          user_id: userId,
          nome: memberDisplayName,
          nickname: memberDisplayName,
          avatar_url: member?.avatar_url,
        }}
      />
    </div>
  );
}
