import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Shield,
  Sparkles,
  AlertTriangle,
  Coins,
  Search,
  Check,
  Loader2,
  Crown,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  getInsigniasCatalog,
  grantInsignia,
  RARITY_CONFIG,
  type InsigniaItem,
  type RankedGamificationMember,
} from "@/services/gamificationService";
import { cn } from "@/lib/utils";

// Resolução de ícone para as insígnias
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
};

function renderInsigniaIcon(iconName: string, className = "h-5 w-5") {
  const IconComponent = ICON_MAP[iconName] || Award;
  return <IconComponent className={className} />;
}

interface InsigniaGrantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetMember: RankedGamificationMember | null;
  grantorXp: number;
}

export function InsigniaGrantModal({
  open,
  onOpenChange,
  targetMember,
  grantorXp,
}: InsigniaGrantModalProps) {
  const queryClient = useQueryClient();
  const { user, hasPermission, refresh } = useAuth();
  const canGrant = hasPermission("grant_insignia");

  const [selectedInsigniaId, setSelectedInsigniaId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");

  const { data: catalog = [], isLoading: loadingCatalog } = useQuery({
    queryKey: ["insignias_catalog"],
    queryFn: getInsigniasCatalog,
    enabled: open,
  });

  const { data: targetMemberInsignias = [] } = useQuery({
    queryKey: ["member_insignias", targetMember?.user_id],
    queryFn: () => (targetMember?.user_id ? getMemberInsignias(targetMember.user_id) : Promise.resolve([])),
    enabled: open && Boolean(targetMember?.user_id),
  });

  const alreadyOwnedIds = useMemo(
    () => new Set(targetMemberInsignias.map((b) => b.insignia_id)),
    [targetMemberInsignias]
  );

  const filteredCatalog = useMemo(() => {
    // FILTRAR TOTALMENTE AS INSÍGNIAS QUE O MEMBRO JÁ POSSUI
    const available = catalog.filter((item) => !alreadyOwnedIds.has(item.id));
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.rarity.toLowerCase().includes(q)
    );
  }, [catalog, search, alreadyOwnedIds]);

  const selectedInsignia = useMemo(
    () => filteredCatalog.find((i) => i.id === selectedInsigniaId),
    [filteredCatalog, selectedInsigniaId]
  );

  const hasEnoughXp = selectedInsignia ? grantorXp >= selectedInsignia.xp_cost : true;
  const isAlreadyOwned = selectedInsignia ? alreadyOwnedIds.has(selectedInsignia.id) : false;
  const xpDifference = selectedInsignia ? selectedInsignia.xp_cost - grantorXp : 0;

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!canGrant) throw new Error("Você não possui permissão para conceder insígnias.");
      if (!targetMember) throw new Error("Nenhum membro selecionado.");
      if (!selectedInsigniaId) throw new Error("Selecione uma insígnia.");
      if (isAlreadyOwned) throw new Error("Este membro já possui esta insígnia.");
      if (!reason.trim()) throw new Error("Informe o motivo da concessão.");

      return await grantInsignia({
        memberId: targetMember.user_id,
        insigniaId: selectedInsigniaId,
        reason: reason.trim(),
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Insígnia concedida com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["gamification_ranking"] });
      void queryClient.invalidateQueries({ queryKey: ["member_insignias"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["profiles"] });
      void refresh();
      onOpenChange(false);
      setSelectedInsigniaId("");
      setReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao conceder insígnia.");
    },
  });

  const memberDisplayName = targetMember?.nickname || targetMember?.nome || "Membro";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Conceder Insígnia de Honra
              </DialogTitle>
              <DialogDescription className="text-xs">
                Reconheça a dedicação e feitos de um integrante da facção.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* CARD DO MEMBRO BENEFICIADO E SALDO DO CONCEDENTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border shrink-0">
                <AvatarImage src={targetMember?.avatar_url || ""} />
                <AvatarFallback className="font-bold text-xs">
                  {memberDisplayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Membro Alvo
                </span>
                <p className="text-xs font-bold text-foreground truncate">{memberDisplayName}</p>
                {targetMember?.game_id && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ID: {targetMember.game_id}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block flex items-center gap-1">
                  <Coins className="h-3 w-3 text-amber-400" /> Seu Saldo de XP
                </span>
                <p className="text-sm font-black text-foreground font-mono">
                  {grantorXp.toLocaleString()} <span className="text-amber-400 text-xs">XP</span>
                </p>
                <span className="text-[10px] text-muted-foreground">
                  (O custo é debitado de você)
                </span>
              </div>
            </div>
          </div>

          {/* ALERTA DE REGRA DE CUSTO */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300/90 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-amber-300">Regra de Liderança:</span>
              <p className="text-[11px] leading-relaxed">
                Ao conceder uma insígnia, o valor de XP é <strong>descontado do seu saldo pessoal de Administrador/Gerente</strong>. O membro recebe a honraria e o prestígio sem qualquer débito para ele.
              </p>
            </div>
          </div>

          {/* BUSCA E SELEÇÃO DE INSÍGNIAS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Insígnias Disponíveis:</span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
                  {filteredCatalog.length}
                </Badge>
                {alreadyOwnedIds.size > 0 && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({alreadyOwnedIds.size} já possuídas ocultadas)
                  </span>
                )}
              </label>
              <div className="relative w-40">
                <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar catálogo..."
                  className="h-8 pl-8 text-xs bg-background/50"
                />
              </div>
            </div>

            {loadingCatalog ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                Carregando catálogo...
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-4 space-y-1.5">
                {catalog.length > 0 && alreadyOwnedIds.size >= catalog.length ? (
                  <>
                    <p className="font-bold text-amber-400">🏆 Membro 100% Condecorado!</p>
                    <p>{memberDisplayName} já possui todas as {catalog.length} insígnias cadastradas no catálogo da facção.</p>
                  </>
                ) : (
                  <p>Nenhuma insígnia disponível para concessão {search ? "com os termos buscados" : ""}.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredCatalog.map((insignia) => {
                  const isSelected = selectedInsigniaId === insignia.id;
                  const rarity = RARITY_CONFIG[insignia.rarity] || RARITY_CONFIG.comum;
                  const isAffordable = grantorXp >= insignia.xp_cost;
                  const isOwned = alreadyOwnedIds.has(insignia.id);

                  return (
                    <div
                      key={insignia.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (isOwned) {
                          toast.info(`O membro já possui a insígnia "${insignia.name}".`);
                          return;
                        }
                        setSelectedInsigniaId(insignia.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          if (!isOwned) setSelectedInsigniaId(insignia.id);
                        }
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 select-none relative",
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/70 shadow-sm"
                          : isOwned
                          ? "bg-secondary/10 border-border/40 opacity-60 cursor-not-allowed"
                          : "bg-secondary/20 border-border/60 hover:bg-secondary/40",
                        !isAffordable && !isOwned && "opacity-75"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                            rarity.bgClass,
                            rarity.borderClass,
                            rarity.textClass
                          )}
                        >
                          {renderInsigniaIcon(insignia.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {insignia.name}
                            </h4>
                            {isOwned ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] font-bold px-1.5 py-0">
                                Já Possui
                              </Badge>
                            ) : isSelected ? (
                              <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            ) : null}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                            {insignia.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/40">
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] px-1.5 py-0 font-bold uppercase", rarity.textClass, rarity.borderClass)}
                        >
                          {rarity.label}
                        </Badge>
                        <span
                          className={cn(
                            "font-mono font-bold",
                            isOwned
                              ? "text-muted-foreground"
                              : isAffordable
                              ? "text-amber-400"
                              : "text-destructive"
                          )}
                        >
                          {isOwned ? "Entregue" : insignia.xp_cost > 0 ? `${insignia.xp_cost} XP` : "Gratuita"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AVISO SE XP FOR INSUFICIENTE */}
          {selectedInsignia && !hasEnoughXp && (
            <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/40 text-xs text-destructive flex items-center gap-2 animate-in fade-in-50">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Você não possui XP suficiente para esta insígnia. Faltam{" "}
                <strong>{xpDifference.toLocaleString()} XP</strong> no seu saldo de administrador.
              </span>
            </div>
          )}

          {/* MOTIVO / JUSTIFICATIVA OBRIGATÓRIA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Motivo / Justificativa da Concessão:</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Gravado na auditoria e visível no perfil)
              </span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Excelente atuação nas vendas de armamentos pesados e liderança exemplar em comboio..."
              rows={3}
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
            disabled={grantMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => grantMutation.mutate()}
            disabled={
              grantMutation.isPending ||
              !canGrant ||
              !selectedInsigniaId ||
              !reason.trim() ||
              !hasEnoughXp
            }
            className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 gap-1.5 shadow-sm"
          >
            {grantMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>
              Conceder Insígnia
              {selectedInsignia && selectedInsignia.xp_cost > 0
                ? ` (-${selectedInsignia.xp_cost} XP)`
                : ""}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
