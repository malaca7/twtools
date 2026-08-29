import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  DollarSign,
  ShoppingCart,
  Boxes,
  User,
} from "lucide-react";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useGoals, useSales, useMovements, useMembers, nameOf } from "@/hooks/useData";
import { createGoal, deleteGoal } from "@/lib/app-api";
import { currency, formatCurrencyInput, parseCurrencyInput, dateTime, errorMessage, num } from "@/lib/format";
import { Goal } from "@/lib/app-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/metas")({
  component: MetasPage,
});

const GOAL_TYPE_LABEL: Record<string, string> = {
  faturamento: "Faturamento (R$)",
  vendas: "Qtd. de Vendas",
  quantidade: "Qtd. de Itens",
};

function MetasPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canView = hasPermission("view_goals");
  const canManage = hasPermission("manage_goals");

  const { data: goals = [], isLoading: loadingGoals } = useGoals();
  const { data: sales = [] } = useSales();
  const { data: movements = [] } = useMovements();
  const { data: members = [] } = useMembers();

  // Create Goal Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<"vendas" | "faturamento" | "quantidade">("faturamento");
  const [targetValue, setTargetValue] = useState("");
  const [periodStart, setPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [descricao, setDescricao] = useState("");

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      if (!canManage) throw new Error("Você não possui permissão para criar ou gerenciar metas.");
      const val = type === "faturamento" ? parseCurrencyInput(targetValue) : Number(targetValue);
      if (!userId) throw new Error("Selecione o membro responsável.");
      if (!Number.isFinite(val) || val <= 0) throw new Error("Informe um valor alvo válido maior que zero.");
      if (!periodStart || !periodEnd) throw new Error("Informe as datas de início e fim.");

      const payload: { user_id: string; type: "vendas" | "faturamento" | "quantidade"; target_value: number; period_start: string; period_end: string; descricao?: string } = {
        user_id: userId,
        type,
        target_value: val,
        period_start: periodStart,
        period_end: periodEnd,
      };
      if (descricao.trim()) payload.descricao = descricao.trim();
      await createGoal(payload);
    },
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDialogOpen(false);
      setTargetValue("");
      setDescricao("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!canManage) throw new Error("Você não possui permissão para apagar metas.");
      await deleteGoal(goalId);
    },
    onSuccess: () => {
      toast.success("Meta removida.");
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!canView) return <NoAccess />;

  // Active sales for calculation
  const activeSales = sales.filter((s) => s.status === "concluida");

  // Calculate progress per goal
  const goalsWithProgress = goals.map((g) => {
    const start = g.period_start;
    const end = g.period_end;

    let current = 0;
    if (g.type === "faturamento") {
      current = activeSales
        .filter((s) => s.seller_id === g.user_id && s.created_at >= start && s.created_at <= end + "T23:59:59")
        .reduce((acc, s) => acc + Number(s.total_price), 0);
    } else if (g.type === "vendas") {
      current = activeSales.filter(
        (s) => s.seller_id === g.user_id && s.created_at >= start && s.created_at <= end + "T23:59:59"
      ).length;
    } else if (g.type === "quantidade") {
      current = movements
        .filter((m) => m.user_id === g.user_id && m.created_at >= start && m.created_at <= end + "T23:59:59")
        .reduce((acc, m) => acc + Number(m.quantity), 0);
    }

    const pct = Math.min(100, Math.max(0, (current / Number(g.target_value)) * 100));
    const today = new Date().toISOString().slice(0, 10);
    const isCompleted = pct >= 100;
    const isExpired = !isCompleted && today > g.period_end;

    return {
      ...g,
      currentValue: current,
      progressPct: pct,
      isCompleted,
      isExpired,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Metas do Grupo"
        description="Definição de objetivos operacionais e acompanhamento do atingimento de metas."
        actions={
          canManage ? (
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-brand text-primary-foreground hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Meta
            </Button>
          ) : null
        }
      />

      {loadingGoals ? (
        <TableSkeleton rows={4} />
      ) : goalsWithProgress.length === 0 ? (
        <EmptyState
          icon={<Target className="h-10 w-10 text-muted-foreground" />}
          title="Nenhuma meta cadastrada"
          description="Clique em 'Nova Meta' para estipular metas operacionais ou financeiras."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalsWithProgress.map((g) => {
            const memberName = nameOf(members, g.user_id);

            return (
              <Card
                key={g.id}
                className={`flex flex-col justify-between border-border bg-card/60 backdrop-blur transition-all hover:border-border/80 ${
                  g.isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : g.isExpired
                    ? "border-destructive/40 opacity-75"
                    : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="mb-1 text-[0.65rem] capitalize">
                        {GOAL_TYPE_LABEL[g.type] || g.type}
                      </Badge>
                      <CardTitle className="text-base font-bold text-foreground">
                        {memberName}
                      </CardTitle>
                    </div>

                    {g.isCompleted ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[0.65rem]">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Concluída
                      </Badge>
                    ) : g.isExpired ? (
                      <Badge variant="destructive" className="text-[0.65rem]">
                        Expirada
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[0.65rem]">
                        <Clock className="mr-1 h-3 w-3" /> Em Andamento
                      </Badge>
                    )}
                  </div>

                  {g.descricao ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground pt-1">
                      {g.descricao}
                    </p>
                  ) : null}
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Alcançado / Alvo
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {g.type === "faturamento" ? currency(g.currentValue) : num(g.currentValue)}
                        {" / "}
                        <span className="text-accent">
                          {g.type === "faturamento" ? currency(g.target_value) : num(g.target_value)}
                        </span>
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary">
                      {g.progressPct.toFixed(0)}%
                    </span>
                  </div>

                  <Progress value={g.progressPct} className="h-2" />

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {g.period_start} até {g.period_end}
                    </span>
                  </div>
                </CardContent>

                {canManage ? (
                  <CardFooter className="pt-2 flex justify-end border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteGoalMutation.isPending}
                      onClick={() => deleteGoalMutation.mutate(g.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
                    </Button>
                  </CardFooter>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE GOAL DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
            <DialogDescription>
              Estipule um objetivo de vendas, faturamento ou movimentação para um membro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Membro Responsável</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o membro..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.nickname ? `${m.nickname} (${m.nome})` : m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de Meta</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faturamento">Faturamento (R$)</SelectItem>
                    <SelectItem value="vendas">Quantidade de Vendas</SelectItem>
                    <SelectItem value="quantidade">Itens Movimentados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-target">
                  {type === "faturamento" ? "Valor Alvo (R$)" : "Quantidade Alvo"}
                </Label>
                <Input
                  id="goal-target"
                  type={type === "faturamento" ? "text" : "number"}
                  min="1"
                  value={targetValue}
                  onChange={(e) =>
                    setTargetValue(
                      type === "faturamento"
                        ? formatCurrencyInput(e.target.value)
                        : e.target.value
                    )
                  }
                  placeholder={type === "faturamento" ? "R$ 0,00" : "Ex: 100"}
                  className={type === "faturamento" ? "font-mono font-bold text-emerald-400" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goal-start">Data de Início</Label>
                <Input
                  id="goal-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-end">Data de Fim</Label>
                <Input
                  id="goal-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-desc">Descrição / Instruções</Label>
              <Textarea
                id="goal-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Meta semanal de venda de drogas/armamentos."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-brand text-primary-foreground hover:opacity-90"
              disabled={createGoalMutation.isPending}
              onClick={() => createGoalMutation.mutate()}
            >
              {createGoalMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
