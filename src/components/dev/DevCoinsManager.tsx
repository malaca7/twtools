import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Coins,
  Plus,
  Minus,
  ArrowRightLeft,
  History,
  Users,
  Search,
  Gift,
  Shield,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { getProxiedImageUrl } from "@/services/postimagesService";
import { LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
import {
  devAdjustMemberCoins,
  getAllCoinsTransactions,
  type TwCoinTransaction,
} from "@/services/gamificationService";
import { cn } from "@/lib/utils";

export function DevCoinsManager() {
  const queryClient = useQueryClient();
  const { hasPermission, isDevUser, user: authUser } = useAuth();
  const { data: members = [], isLoading: isLoadingMembers } = useMembers();

  const [activeTab, setActiveTab] = useState<string>("members");
  const [searchMember, setSearchMember] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [transactionSearch, setTransactionSearch] = useState("");

  // Modais de Ajuste
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [adjustMode, setAdjustMode] = useState<"grant" | "deduct">("grant");
  const [adjustAmount, setAdjustAmount] = useState<string>("100");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Modal de Bonificação Coletiva
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchAmount, setBatchAmount] = useState<string>("50");
  const [batchReason, setBatchReason] = useState<string>("");

  // Permissões
  const canGrant = isDevUser || hasPermission("grant_dev_coins");
  const canDeduct = isDevUser || hasPermission("deduct_dev_coins");
  const canViewTransactions = isDevUser || hasPermission("view_dev_coins_transactions");
  const canBatch = isDevUser || hasPermission("manage_dev_coins_batch");

  // Query de Transações Globais
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["tw_coins_transactions"],
    queryFn: () => getAllCoinsTransactions(200),
    enabled: canViewTransactions,
  });

  // Métricas
  const metrics = useMemo(() => {
    const totalCirculatingCoins = members.reduce(
      (sum, m) => sum + Number((m as any).tw_coins || 0),
      0
    );
    const activeMembersCount = members.filter((m) => m.status === "ativo").length;
    const avgCoins = activeMembersCount > 0 ? Math.round(totalCirculatingCoins / activeMembersCount) : 0;
    const maxCoinsMember = members.reduce(
      (max, m) => (Number((m as any).tw_coins || 0) > Number((max as any)?.tw_coins || 0) ? m : max),
      members[0] || null
    );

    return {
      totalCirculatingCoins,
      activeMembersCount,
      avgCoins,
      maxCoinsMember,
      totalTransactions: transactions.length,
    };
  }, [members, transactions]);

  // Membros filtrados
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const name = (m.nickname || m.nome || "").toLowerCase();
        return name.includes(searchMember.toLowerCase());
      })
      .sort((a, b) => Number((b as any).tw_coins || 0) - Number((a as any).tw_coins || 0));
  }, [members, searchMember]);

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = transactionFilter === "all" || t.action_type === transactionFilter;
      const matchSearch =
        t.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        t.user_id.toLowerCase().includes(transactionSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [transactions, transactionFilter, transactionSearch]);

  // Mutação de Ajuste
  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMember) return;
      const rawNum = parseInt(adjustAmount || "0", 10) || 0;
      if (rawNum <= 0) throw new Error("A quantidade de moedas deve ser maior que zero.");
      if (!adjustReason.trim()) throw new Error("O motivo do ajuste é obrigatório.");

      const finalAmount = adjustMode === "grant" ? rawNum : -rawNum;
      return devAdjustMemberCoins(selectedMember.user_id, finalAmount, adjustReason.trim());
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Saldo de moedas atualizado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["tw_coins_transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsAdjustModalOpen(false);
      setSelectedMember(null);
      setAdjustReason("");
      setAdjustAmount("100");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao ajustar moedas.");
    },
  });

  // Mutação de Bonificação Coletiva
  const batchMutation = useMutation({
    mutationFn: async () => {
      const rawNum = parseInt(batchAmount || "0", 10) || 0;
      if (rawNum <= 0) throw new Error("A quantidade de moedas deve ser maior que zero.");
      if (!batchReason.trim()) throw new Error("O motivo da bonificação é obrigatório.");

      const activeMembers = members.filter((m) => m.status === "ativo");
      if (activeMembers.length === 0) throw new Error("Nenhum membro ativo encontrado.");

      let successCount = 0;
      for (const m of activeMembers) {
        try {
          await devAdjustMemberCoins(m.user_id, rawNum, `Bonificação coletiva: ${batchReason.trim()}`);
          successCount++;
        } catch (e) {
          console.warn("Erro ao bonificar membro:", m.user_id, e);
        }
      }

      return { successCount, total: activeMembers.length, amount: rawNum };
    },
    onSuccess: (res) => {
      toast.success(
        `Bonificação distribuída! ${res.successCount} membros receberam +${res.amount} TW Coins cada.`
      );
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["tw_coins_transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsBatchModalOpen(false);
      setBatchReason("");
      setBatchAmount("50");
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao distribuir bonificação.");
    },
  });

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Gestão de TW Coins & Economia
              </h1>
              <p className="text-xs text-muted-foreground">
                Painel administrativo de saldos, concessões, deduções e auditoria monetária do grupo
              </p>
            </div>
          </div>
        </div>

        {canBatch && (
          <Button
            onClick={() => setIsBatchModalOpen(true)}
            className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Gift className="h-4 w-4" />
            <span>Bonificação em Massa</span>
          </Button>
        )}
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Em Circulação</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {metrics.totalCirculatingCoins.toLocaleString("pt-BR")}{" "}
            <span className="text-xs text-muted-foreground font-normal">Coins</span>
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Média / Membro</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {metrics.avgCoins.toLocaleString("pt-BR")}{" "}
            <span className="text-xs text-muted-foreground font-normal">Coins</span>
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Maior Saldo</span>
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-sm font-bold text-foreground truncate mt-1">
            {metrics.maxCoinsMember?.nickname || metrics.maxCoinsMember?.nome || "—"}
          </p>
          <p className="text-xs font-mono font-bold text-amber-400">
            {Number((metrics.maxCoinsMember as any)?.tw_coins || 0).toLocaleString("pt-BR")} Coins
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Transações</span>
            <History className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1">{metrics.totalTransactions}</p>
        </Card>
      </div>

      {/* ABAS: SALDOS DOS MEMBROS vs EXTRATO GLOBAL */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-2xl h-11">
          <TabsTrigger value="members" className="gap-2 rounded-xl text-xs font-bold">
            <Users className="h-4 w-4" />
            <span>Saldos dos Membros ({members.length})</span>
          </TabsTrigger>
          {canViewTransactions && (
            <TabsTrigger value="transactions" className="gap-2 rounded-xl text-xs font-bold">
              <History className="h-4 w-4" />
              <span>Extrato Global de Moedas ({transactions.length})</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ==================================================== */}
        {/* ABA 1: SALDOS DOS MEMBROS */}
        {/* ==================================================== */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar membro por nome ou nickname..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <Badge variant="outline" className="text-xs font-mono font-bold px-3 py-1">
              {filteredMembers.length} integrantes
            </Badge>
          </div>

          <Card className="surface-card border-border/60 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {isLoadingMembers ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <p className="text-xs text-muted-foreground font-mono">Carregando membros...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 bg-secondary/20 text-muted-foreground font-mono">
                        <th className="p-3.5 pl-5">Membro</th>
                        <th className="p-3.5">Cargo / Patente</th>
                        <th className="p-3.5">XP Acumulado</th>
                        <th className="p-3.5">Saldo TW Coins</th>
                        <th className="p-3.5 pr-5 text-right">Ações de Gestão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredMembers.map((member) => {
                        const avatar = member.avatar_url || member.discord_avatar_url;
                        const name = member.nickname || member.nome;
                        const coins = Number((member as any).tw_coins || 0);
                        const xp = Number(member.xp || 0);

                        return (
                          <tr key={member.user_id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-border shrink-0">
                                  {avatar && <AvatarImage src={getProxiedImageUrl(avatar)} />}
                                  <AvatarFallback className="text-[10px] font-bold">
                                    {name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-foreground text-xs">{name}</p>
                                  {member.nickname && (
                                    <p className="text-[10px] text-muted-foreground">{member.nome}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] uppercase font-mono font-bold py-0",
                                  levelBadgeClass(member.nivel as any)
                                )}
                              >
                                {LEVEL_LABEL[member.nivel as any] || member.nivel || "Membro"}
                              </Badge>
                            </td>

                            <td className="p-3.5 font-mono font-bold text-violet-300">
                              {xp.toLocaleString("pt-BR")} XP
                            </td>

                            <td className="p-3.5 font-mono font-black text-amber-300 text-sm">
                              <span className="flex items-center gap-1.5">
                                <Coins className="h-4 w-4 text-amber-400" />
                                {coins.toLocaleString("pt-BR")}
                              </span>
                            </td>

                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {canGrant && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setAdjustMode("grant");
                                      setAdjustAmount("100");
                                      setAdjustReason("Bonificação por participação em operação");
                                      setIsAdjustModalOpen(true);
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg gap-1 cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Conceder</span>
                                  </Button>
                                )}

                                {canDeduct && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setAdjustMode("deduct");
                                      setAdjustAmount("50");
                                      setAdjustReason("Dedução administrativa");
                                      setIsAdjustModalOpen(true);
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg gap-1 cursor-pointer"
                                  >
                                    <Minus className="h-3 w-3" />
                                    <span>Deduzir</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 2: EXTRATO GLOBAL DE TRANSAÇÕES */}
        {/* ==================================================== */}
        {canViewTransactions && (
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou ID..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                  <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl bg-background/50 border-border/60 font-medium">
                    <SelectValue placeholder="Tipo de Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos os Tipos</SelectItem>
                    <SelectItem value="exchange_xp" className="text-xs">Conversão de XP</SelectItem>
                    <SelectItem value="shop_purchase" className="text-xs">Compra na Loja</SelectItem>
                    <SelectItem value="dev_grant" className="text-xs">Concessão Dev (+)</SelectItem>
                    <SelectItem value="dev_deduct" className="text-xs">Dedução Dev (-)</SelectItem>
                    <SelectItem value="refund" className="text-xs">Estorno / Reembolso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="surface-card border-border/60 rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                {isLoadingTransactions ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <p className="text-xs text-muted-foreground font-mono">Carregando extrato...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 bg-secondary/20 text-muted-foreground font-mono">
                          <th className="p-3.5 pl-5">Data / Hora</th>
                          <th className="p-3.5">Membro Alvo</th>
                          <th className="p-3.5">Tipo de Movimentação</th>
                          <th className="p-3.5">Descrição</th>
                          <th className="p-3.5">Valor</th>
                          <th className="p-3.5 pr-5 text-right">Saldo Resultante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {filteredTransactions.map((tx) => {
                          const isPositive = tx.amount > 0;
                          const targetMember = members.find((m) => m.user_id === tx.user_id);
                          const targetName =
                            targetMember?.nickname || targetMember?.nome || "Membro";

                          return (
                            <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="p-3.5 pl-5 text-muted-foreground whitespace-nowrap">
                                {new Date(tx.created_at).toLocaleString("pt-BR")}
                              </td>

                              <td className="p-3.5 font-bold font-sans text-foreground whitespace-nowrap">
                                {targetName}
                              </td>

                              <td className="p-3.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-bold py-0.5",
                                    tx.action_type === "exchange_xp"
                                      ? "text-violet-400 border-violet-500/30 bg-violet-500/10"
                                      : tx.action_type === "shop_purchase"
                                      ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                                      : tx.action_type === "dev_grant"
                                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                      : tx.action_type === "refund"
                                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                      : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                                  )}
                                >
                                  {tx.action_type === "exchange_xp"
                                    ? "Conversão XP"
                                    : tx.action_type === "shop_purchase"
                                    ? "Compra Loja"
                                    : tx.action_type === "dev_grant"
                                    ? "Crédito Manual"
                                    : tx.action_type === "refund"
                                    ? "Estorno"
                                    : "Débito Manual"}
                                </Badge>
                              </td>

                              <td className="p-3.5 font-sans text-foreground/90 max-w-md truncate">
                                {tx.description}
                              </td>

                              <td
                                className={cn(
                                  "p-3.5 font-black whitespace-nowrap text-sm",
                                  isPositive ? "text-emerald-400" : "text-rose-400"
                                )}
                              >
                                {isPositive ? `+${tx.amount}` : tx.amount} Coins
                              </td>

                              <td className="p-3.5 pr-5 text-right font-bold text-amber-300 whitespace-nowrap">
                                {tx.balance_after.toLocaleString("pt-BR")} Coins
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ==================================================== */}
      {/* MODAL: AJUSTE INDIVIDUAL DE COINS */}
      {/* ==================================================== */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              {adjustMode === "grant" ? (
                <>
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Conceder TW Coins a Membro</span>
                </>
              ) : (
                <>
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <Minus className="h-4 w-4" />
                  </div>
                  <span>Deduzir TW Coins de Membro</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Membro alvo:{" "}
              <strong className="text-foreground">
                {selectedMember?.nickname || selectedMember?.nome}
              </strong>{" "}
              · Saldo atual:{" "}
              <span className="font-mono text-amber-300 font-bold">
                {Number((selectedMember as any)?.tw_coins || 0)} Coins
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* VALOR COM ATALHOS RÁPIDOS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade de TW Coins:</Label>
              <Input
                type="number"
                min="1"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="text-base font-mono font-bold text-amber-300 rounded-xl"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[50, 100, 250, 500, 1000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustAmount(String(amt))}
                    className="h-6 text-[10px] px-2 font-mono rounded-lg"
                  >
                    +{amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* MOTIVO OBRIGATÓRIO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo Oficial (Auditado) *:</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Premiação por destaque semanal ou correção de saldo"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => adjustMutation.mutate()}
              disabled={adjustMutation.isPending || !adjustReason.trim()}
              className={cn(
                "text-xs font-bold rounded-xl cursor-pointer text-white",
                adjustMode === "grant" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
              )}
            >
              {adjustMutation.isPending ? "Processando..." : adjustMode === "grant" ? "Confirmar Concessão" : "Confirmar Dedução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: BONIFICAÇÃO COLETIVA EM MASSA */}
      {/* ==================================================== */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-400" />
              <span>Bonificação Geral em TW Coins</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conceda moedas a todos os integrantes ativos da Twin Wheels simultaneamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                <span>Distribuição Coletiva</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Total de membros ativos que receberão o crédito:{" "}
                <strong className="text-foreground">{metrics.activeMembersCount} membros</strong>.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor em TW Coins por Integrante:</Label>
              <Input
                type="number"
                min="1"
                value={batchAmount}
                onChange={(e) => setBatchAmount(e.target.value)}
                className="text-base font-mono font-bold text-amber-300 rounded-xl"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[25, 50, 100, 200].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchAmount(String(amt))}
                    className="h-6 text-[10px] px-2 font-mono rounded-lg"
                  >
                    +{amt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo Oficial da Bonificação *:</Label>
              <Input
                value={batchReason}
                onChange={(e) => setBatchReason(e.target.value)}
                placeholder="Ex: Bonificação semanal pela vitória na disputa de território"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => batchMutation.mutate()}
              disabled={batchMutation.isPending || !batchReason.trim()}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              {batchMutation.isPending ? "Distribuindo..." : "Confirmar Distribuição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
