import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Loader2, Sparkles, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { evaluateMember, type RankedGamificationMember } from "@/services/gamificationService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export interface EvaluatableMember {
  user_id: string;
  nome: string;
  nickname?: string | null;
  avatar_url?: string | null;
  game_id?: string | number | null;
  stars_rating?: number | null;
}

interface MemberEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetMember: EvaluatableMember | RankedGamificationMember | null;
}

const STAR_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: "1 Estrela - Crítico", desc: "Desempenho muito abaixo do padrão da facção ou conduta inadequada.", color: "text-rose-400" },
  2: { title: "2 Estrelas - Regular / Precisa Melhorar", desc: "Abaixo da média esperada, necessita de instrução e acompanhamento.", color: "text-amber-400" },
  3: { title: "3 Estrelas - Bom / Satisfatório", desc: "Cumpre as obrigações básicas operacionais do grupo.", color: "text-yellow-400" },
  4: { title: "4 Estrelas - Muito Bom / Destaque", desc: "Atuação acima da média com iniciativa e pontualidade (+0.50 XP Bônus).", color: "text-emerald-400" },
  5: { title: "5 Estrelas - Excelência Suprema", desc: "Performance impecável, liderança nata e dedicação extrema (+0.50 XP Bônus).", color: "text-amber-300" },
};

export function MemberEvaluationModal({
  open,
  onOpenChange,
  targetMember,
}: MemberEvaluationModalProps) {
  const queryClient = useQueryClient();
  const { hasPermission, isDevUser, isCeoUser } = useAuth();
  const canEvaluate = Boolean(
    hasPermission("evaluate_member") ||
    hasPermission("manage_performance") ||
    isDevUser ||
    isCeoUser
  );

  const [stars, setStars] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("operacoes");
  const [feedback, setFeedback] = useState("");

  const evalMutation = useMutation({
    mutationFn: async () => {
      if (!canEvaluate) throw new Error("Você não possui permissão para avaliar membros.");
      if (!targetMember) throw new Error("Nenhum membro selecionado.");
      return await evaluateMember({
        memberId: targetMember.user_id,
        stars,
        feedback: feedback.trim(),
        category,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Avaliação registrada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["gamification_ranking"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
      setFeedback("");
      setStars(5);
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao avaliar membro.");
    },
  });

  const memberDisplayName = targetMember?.nickname || targetMember?.nome || "Membro";
  const activeStarIndex = hoveredStar !== null ? hoveredStar : stars;
  const currentStarInfo = STAR_LABELS[activeStarIndex] || STAR_LABELS[5];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Avaliar Desempenho do Membro
              </DialogTitle>
              <DialogDescription className="text-xs">
                Auditoria de qualidade com nota de 1 a 5 estrelas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* IDENTIFICAÇÃO DO MEMBRO */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-10 w-10 border border-border shrink-0">
                <AvatarImage src={targetMember?.avatar_url || ""} />
                <AvatarFallback className="font-bold text-xs">
                  {memberDisplayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{memberDisplayName}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  {targetMember?.game_id && <span>ID: {targetMember.game_id}</span>}
                  <span>Média atual: ★ {targetMember?.stars_rating?.toFixed(1) || "5.0"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SELETOR INTERATIVO DE 1 A 5 ESTRELAS */}
          <div className="space-y-2 text-center p-4 rounded-xl bg-background/60 border border-border/60">
            <span className="text-xs font-bold text-foreground block">
              Selecione a Classificação:
            </span>

            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((s) => {
                const isLit = s <= activeStarIndex;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    onMouseEnter={() => setHoveredStar(s)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="p-1 rounded-lg hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                    title={`${s} Estrelas`}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        isLit
                          ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <p className={cn("text-xs font-black", currentStarInfo.color)}>
                {currentStarInfo.title}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {currentStarInfo.desc}
              </p>
            </div>
          </div>

          {/* CATEGORIA DA AVALIAÇÃO */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Área de Atuação Avaliada:
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operacoes">Operações & Ações de Campo</SelectItem>
                <SelectItem value="vendas">Comércio & Vendas de Insumos</SelectItem>
                <SelectItem value="logistica">Logística & Gestão de Baús</SelectItem>
                <SelectItem value="disciplina">Disciplina & Comunicação no Rádio</SelectItem>
                <SelectItem value="lideranca">Liderança & Apoio aos Recrutas</SelectItem>
                <SelectItem value="geral">Avaliação Geral de Desempenho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* FEEDBACK / OBSERVAÇÃO */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Observações / Parecer da Liderança:</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Opcional, auditado)
              </span>
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex: Excelente posicionamento nas ações e organização exemplar dos estoques..."
              rows={2}
              className="text-xs bg-background/50 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={evalMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => evalMutation.mutate()}
            disabled={evalMutation.isPending || !canEvaluate}
            className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 gap-1.5 shadow-sm"
          >
            {evalMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>Registrar Avaliação ({stars} ★)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
