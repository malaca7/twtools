import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, ChevronRight, Quote, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberInsigniasListModal } from "@/components/gamification/MemberInsigniasListModal";
import { renderInsigniaIcon } from "@/components/gamification/MemberGamificationCard";
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
    <div className={cn("space-y-4", className)}>
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
            {memberInsignias.length} {memberInsignias.length === 1 ? "Condecoração" : "Condecorações"}
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

      {/* GRID DE CARDS / EMBLEMAS */}
      {memberInsignias.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberInsignias.map((grant) => {
            const badge = grant.insignia;
            if (!badge) return null;
            const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;

            return (
              <div
                key={grant.id}
                onClick={() => setIsModalOpen(true)}
                className={cn(
                  "relative overflow-hidden rounded-3xl border-2 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between group cursor-pointer select-none",
                  rarity.bgClass,
                  rarity.borderClass
                )}
                style={{
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
                }}
              >
                {/* Efeito Holográfico Refletivo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Símbolo de Fundo em Marca d'Água */}
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  {renderInsigniaIcon(badge.icon, "h-36 w-36")}
                </div>

                <div className="space-y-4 relative z-10">
                  {/* CABEÇALHO DO CARD COM EMBLEMA CENTRAL E RARIDADE */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-13 w-13 rounded-2xl border-2 shadow-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                          rarity.bgClass,
                          rarity.borderClass,
                          rarity.textClass
                        )}
                      >
                        {renderInsigniaIcon(badge.icon, "h-7 w-7")}
                      </div>
                      <div>
                        <span
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-xs inline-block mb-1",
                            rarity.bgClass,
                            rarity.borderClass,
                            rarity.textClass
                          )}
                        >
                          ★ {rarity.label} ★
                        </span>
                        <h4 className="font-black text-base text-foreground group-hover:text-amber-300 transition-colors leading-tight">
                          {badge.name}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIÇÃO DA HONRARIA */}
                  {badge.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {badge.description}
                    </p>
                  )}

                  {/* JUSTIFICATIVA / MOTIVO DA LIDERANÇA */}
                  {grant.reason && (
                    <div className="p-3 rounded-2xl bg-background/60 border border-white/10 text-xs space-y-1 shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Quote className="h-3 w-3 text-amber-400" />
                        <span>Motivo da Condecoração:</span>
                      </span>
                      <p className="italic text-foreground/95 pl-1.5 border-l-2 border-amber-400/60 font-medium">
                        "{grant.reason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* RODAPÉ DO CARD COM METADADOS OFICIAIS */}
                <div className="pt-3.5 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono relative z-10">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-amber-400" />
                    <span>{grant.grantor_name || "Liderança Twin"}</span>
                  </span>
                  <span className="font-bold text-foreground/80">
                    {new Date(grant.granted_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            );
          })}
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
