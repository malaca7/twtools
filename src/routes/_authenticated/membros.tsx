import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  UserCheck,
  Search,
  ShieldCheck,
  Phone,
  IdCard,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  User,
  Save,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Code2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NoAccess, PageHeader, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, usePendingSignupRequests, useCustomRoles } from "@/hooks/useData";
import {
  submitSignupReview,
  setMemberLevel,
  updateMemberDetails,
  deleteMember,
} from "@/lib/app-api";
import { dateTime, errorMessage, formatPhone, formatSessionDuration, formatSecondsToHoursAndMinutes } from "@/lib/format";
import { LEVEL_LABEL, LEVELS, levelBadgeClass, canPromote, type AppLevel } from "@/lib/permissions";
import type { Member, PendingSignupRequest } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/membros")({
  component: MembrosPage,
});

function MembrosPage() {
  const { hasPermission, level: currentUserLevel, profile: currentProfile, user, refresh, isDevMode } = useAuth();
  const queryClient = useQueryClient();

  // Granular permissions for members management (respects current panel mode: member vs dev)
  const canView = hasPermission("view_members");
  const canApprove = hasPermission("approve_requests");
  const canChangeRoles = hasPermission("change_roles") || hasPermission("promote_members");
  const canEdit = hasPermission("edit_members");
  const canDelete = hasPermission("delete_members");
  const canViewSensitiveData =
    hasPermission("view_sensitive_data") ||
    hasPermission("edit_members") ||
    hasPermission("manage_roles");

  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: pending = [], isLoading: pendingLoading } = usePendingSignupRequests(canApprove);
  const { data: dbCustomRoles = [] } = useCustomRoles();

  // Cargos válidos da facção (excluindo desenvolvedor, que é tag de sistema)
  const availableLevels = useMemo(() => {
    if (dbCustomRoles && dbCustomRoles.length > 0) {
      const filtered = dbCustomRoles.filter(
        (r) => r.id !== "desenvolvedor" && r.nome.toLowerCase() !== "desenvolvedor"
      );
      if (filtered.length > 0) {
        return filtered.map((r) => ({
          id: r.id as AppLevel,
          label: r.nome,
        }));
      }
    }
    return LEVELS.filter((lvl) => lvl !== "desenvolvedor").map((lvl) => ({
      id: lvl,
      label: LEVEL_LABEL[lvl] || lvl,
    }));
  }, [dbCustomRoles]);

  // Search filter
  const [search, setSearch] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  // Modal edit member state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editGameId, setEditGameId] = useState("");
  const [editIsDeveloper, setEditIsDeveloper] = useState(false);

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditNome(m.nome);
    setEditNickname(m.nickname || "");
    setEditTelefone(m.telefone || "");
    setEditGameId(m.game_id || "");
    setEditIsDeveloper(Boolean(m.is_developer || m.nivel === "desenvolvedor"));
  };

  // Mutations
  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, approve, reason }: { requestId: string; approve: boolean; reason?: string }) => {
      if (!canApprove) throw new Error("Você não possui permissão para aprovar ou rejeitar membros.");
      await submitSignupReview({
        data: {
          requestId,
          approve,
          nivel: "novato",
          ...(reason ? { reason } : {}),
        },
      });
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["pending_signup_requests"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(
        vars.approve
          ? "Solicitação aprovada! O membro foi ativado como Novato."
          : "Solicitação rejeitada."
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ targetUserId, newLevel }: { targetUserId: string; newLevel: AppLevel }) => {
      if (!canChangeRoles) throw new Error("Você não possui permissão para alterar cargos.");
      const target = members.find((m) => m.user_id === targetUserId);
      const targetIsDev = Boolean(target?.is_developer || target?.nivel === "desenvolvedor");
      if (targetIsDev && !isDevMode) {
        throw new Error("Apenas membros com a Tag de Dev podem alterar o cargo de outro Desenvolvedor.");
      }
      await setMemberLevel(targetUserId, newLevel);
    },
    onSuccess: async (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      void queryClient.invalidateQueries({ queryKey: ["auth_session"] });
      void queryClient.invalidateQueries({ queryKey: ["auth"] });

      // Se alterou o próprio cargo, re-sincronize a sessão
      if (user?.id === vars.targetUserId) {
        await refresh();
      }

      toast.success("Cargo do membro atualizado!");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!canEdit) throw new Error("Você não possui permissão para editar informações de membros.");
      if (!editingMember) return;
      if (!editNome.trim()) throw new Error("O Nome é obrigatório.");

      await updateMemberDetails({
        targetUserId: editingMember.user_id,
        nome: editNome,
        nickname: editNickname.trim() || null,
        telefone: editTelefone.trim() || null,
        game_id: editGameId.trim() || null,
        is_developer: isDevMode ? editIsDeveloper : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Dados do membro salvos!");
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      setEditingMember(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!canDelete) throw new Error("Você não possui permissão para desligar ou excluir membros.");
      await deleteMember(targetUserId);
    },
    onSuccess: () => {
      toast.success("Membro removido do grupo.");
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!canView) {
    return <NoAccess />;
  }

  const filteredMembers = members.filter((m) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;

    const nomeMatch = m.nome.toLowerCase().includes(term);
    const nickMatch = (m.nickname || "").toLowerCase().includes(term);
    const phoneMatch = (m.telefone || "").toLowerCase().includes(term);
    const gameMatch = (m.game_id || "").toLowerCase().includes(term);
    const discordMatch = (m.discord_username || "").toLowerCase().includes(term);

    return nomeMatch || nickMatch || phoneMatch || gameMatch || discordMatch;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Gestão de Membros"
        description="Aprovação de novos cadastros, dados de jogo, vinculação de contas Discord e controle hierárquico de cargos."
      />

      {/* SOLICITAÇÕES PENDENTES DE APROVAÇÃO */}
      {canApprove && (
        <Card className="surface-card border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-500">
                <Clock className="h-5 w-5" /> Solicitações de Cadastro Pendentes ({pending.length})
              </CardTitle>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10">
                Aprovação
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Novos cadastros enviados por jogadores após autenticarem com o Discord.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {pendingLoading ? (
              <TableSkeleton rows={2} />
            ) : pending.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma solicitação de cadastro pendente no momento.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pending.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-amber-500/20 bg-background/80 p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/40 shadow-sm">
                          {req.discord_avatar_url && (
                            <AvatarImage src={req.discord_avatar_url} alt={req.nome} />
                          )}
                          <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                            {(req.nickname || req.nome).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {req.nickname ? `${req.nickname} (${req.nome})` : req.nome}
                          </h4>
                          {req.discord_username ? (
                            <p className="text-xs font-mono text-indigo-400 font-medium">
                              @{req.discord_username}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Solicitado em {dateTime(req.requested_at)}
                            </p>
                          )}
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500">
                        Pendente
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                      <div className="rounded bg-secondary/40 p-2">
                        <p className="text-[0.65rem] text-muted-foreground uppercase font-bold">Telefone em Jogo</p>
                        <p className="font-semibold text-foreground">{req.telefone || "N/A"}</p>
                      </div>

                      <div className="rounded bg-secondary/40 p-2">
                        <p className="text-[0.65rem] text-muted-foreground uppercase font-bold">ID do Personagem</p>
                        <p className="font-semibold text-foreground font-mono">#{req.game_id || "N/A"}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <Textarea
                        value={reasons[req.id] ?? ""}
                        onChange={(e) =>
                          setReasons((current) => ({
                            ...current,
                            [req.id]: e.target.value,
                          }))
                        }
                        placeholder="Motivo em caso de rejeição (opcional)..."
                        rows={2}
                        className="text-xs"
                      />

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-brand text-primary-foreground text-xs font-semibold hover:opacity-90 h-8"
                          onClick={() => reviewMutation.mutate({ requestId: req.id, approve: true })}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Aprovar (Novato)
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 text-xs h-8 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            reviewMutation.mutate({
                              requestId: req.id,
                              approve: false,
                              reason: reasons[req.id] || "",
                            })
                          }
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MEMBROS ATIVOS DA FACÇÃO */}
      <Card className="surface-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Membros Ativos ({filteredMembers.length})</CardTitle>
              <CardDescription className="text-xs">
                Membros com perfil ativo, cargos atribuídos e contas Discord vinculadas.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, ID, telefone, Discord..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {membersLoading ? (
            <TableSkeleton rows={6} />
          ) : filteredMembers.length === 0 ? (
            <EmptyState title="Nenhum membro encontrado" description="Altere o termo de busca para visualizar os membros." />
          ) : (
            <>
              {/* MOBILE MEMBER CARDS (md:hidden) */}
              <div className="grid gap-3 sm:grid-cols-2 md:hidden">
                {filteredMembers.map((m) => {
                  const currentNivel = m.nivel || "novato";
                  const avatarUrl = m.discord_avatar_url;
                  const initials = (m.nickname || m.nome).slice(0, 2).toUpperCase();
                  const targetIsDev = Boolean(m.is_developer || m.nivel === "desenvolvedor");
                  const canChangeThisTargetRole = canChangeRoles && (!targetIsDev || isDevMode);

                  return (
                    <div key={m.user_id} className="p-4 rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            {avatarUrl && <AvatarImage src={avatarUrl} alt={m.nome} />}
                            <AvatarFallback className="bg-secondary font-bold text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-foreground">{m.nickname || m.nome}</p>
                              {targetIsDev && (
                                <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10 px-1 py-0">
                                  DEV
                                </Badge>
                              )}
                            </div>
                            {m.nickname && <p className="text-xs text-muted-foreground">{m.nome}</p>}
                          </div>
                        </div>

                        {canChangeThisTargetRole ? (
                          <select
                            className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                            value={currentNivel}
                            onChange={(e) => {
                              const desired = e.target.value as AppLevel;
                              changeRoleMutation.mutate({ targetUserId: m.user_id, newLevel: desired });
                            }}
                            disabled={changeRoleMutation.isPending}
                          >
                            {availableLevels.map(({ id, label }) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", levelBadgeClass(currentNivel))}>
                            {LEVEL_LABEL[currentNivel] || currentNivel}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">ID Jogo:</span>
                          <span className="font-mono font-bold text-foreground">#{m.game_id || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Telefone:</span>
                          <span className="font-bold text-foreground">{m.telefone || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Total: {formatSecondsToHoursAndMinutes(m.total_seconds_online || 0)}</span>
                        </div>

                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(m)}
                            className="h-8 text-xs font-bold rounded-lg"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro / Personagem</TableHead>
                      <TableHead>ID & Telefone</TableHead>
                      <TableHead>Conta Discord</TableHead>
                      <TableHead>Cargo / Nível</TableHead>
                      <TableHead>Presença</TableHead>
                      {canEdit || canDelete ? <TableHead className="text-right">Ações</TableHead> : null}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredMembers.map((m) => {
                      const currentNivel = m.nivel || "novato";
                      const avatarUrl = m.discord_avatar_url;
                      const initials = (m.nickname || m.nome).slice(0, 2).toUpperCase();
                      const targetIsDev = Boolean(m.is_developer || m.nivel === "desenvolvedor");
                      const canChangeThisTargetRole = canChangeRoles && (!targetIsDev || isDevMode);

                      return (
                        <TableRow key={m.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-[160px]">
                              <Avatar className="h-9 w-9 border border-border">
                                {avatarUrl && <AvatarImage src={avatarUrl} alt={m.nome} />}
                                <AvatarFallback className="bg-secondary font-bold text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-xs text-foreground">
                                    {m.nickname ? `${m.nickname}` : m.nome}
                                  </p>
                                  {targetIsDev && (
                                    <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10 px-1 py-0">
                                      DEV
                                    </Badge>
                                  )}
                                </div>
                                {m.nickname ? (
                                  <p className="text-[0.65rem] text-muted-foreground">{m.nome}</p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <p className="font-mono font-bold text-foreground">ID: #{m.game_id || "N/A"}</p>
                            <p className="text-muted-foreground text-[0.65rem]">{m.telefone || "N/A"}</p>
                          </TableCell>

                          {/* DISCORD DATA BADGE */}
                          <TableCell className="text-xs">
                            {canViewSensitiveData ? (
                              m.discord_username ? (
                                <div>
                                  <p className="font-mono text-xs text-indigo-400 font-medium">@{m.discord_username}</p>
                                  <p className="text-[0.6rem] text-muted-foreground font-mono truncate max-w-[140px]">
                                    ID: {m.discord_id || "—"}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[0.65rem] font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/40">
                                <Lock className="h-3 w-3 text-amber-400" /> ••••••••
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {canChangeThisTargetRole ? (
                              <select
                                className="h-8 w-full min-w-[110px] rounded-md border border-input bg-background px-2 py-1 text-xs font-medium cursor-pointer"
                                value={currentNivel}
                                onChange={(e) => {
                                  const desired = e.target.value as AppLevel;
                                  changeRoleMutation.mutate({ targetUserId: m.user_id, newLevel: desired });
                                }}
                                disabled={changeRoleMutation.isPending}
                              >
                                {availableLevels.map(({ id, label }) => (
                                  <option key={id} value={id}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Badge variant="outline" className={cn("text-[10px] font-semibold", levelBadgeClass(currentNivel))}>
                                {LEVEL_LABEL[currentNivel] || currentNivel}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs">
                            {canViewSensitiveData ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatSecondsToHoursAndMinutes(m.total_seconds_online || 0)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-mono text-xs font-semibold">••••••••</span>
                            )}
                          </TableCell>

                        {canEdit || canDelete ? (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canEdit ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenEdit(m)}
                                  title="Editar dados do membro"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}

                              {canDelete ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    if (confirm(`Remover o membro ${m.nome} do grupo?`)) {
                                      deleteMemberMutation.mutate(m.user_id);
                                    }
                                  }}
                                  disabled={deleteMemberMutation.isPending}
                                  title="Excluir membro"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        </CardContent>
      </Card>

      {/* DIÁLOGO DE EDIÇÃO DE DADOS DO MEMBRO */}
      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Dados do Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações do jogador no servidor de GTA RP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Nome do Jogador</Label>
              <Input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Apelido</Label>
              <Input
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Telefone em Jogo (000-000)</Label>
              <Input
                placeholder="Ex.: 555-019"
                value={editTelefone}
                onChange={(e) => setEditTelefone(formatPhone(e.target.value))}
                className="mt-1 h-9 text-xs font-mono font-bold"
                maxLength={7}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">ID do Personagem / Passaporte</Label>
              <Input
                value={editGameId}
                onChange={(e) => setEditGameId(e.target.value)}
                className="mt-1 h-9 text-xs font-mono font-bold"
              />
            </div>

            {isDevMode && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 mt-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <Label htmlFor="edit-is-dev" className="text-xs font-extrabold text-foreground cursor-pointer flex items-center gap-1.5">
                      Desenvolvedor da Plataforma
                      <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                        Dev System
                      </Badge>
                    </Label>
                    <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                      Concede acesso pleno a todas as ferramentas do sistema e configurações.
                    </p>
                  </div>
                </div>
                <Switch
                  id="edit-is-dev"
                  checked={editIsDeveloper}
                  onCheckedChange={setEditIsDeveloper}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-gradient-brand text-primary-foreground font-semibold"
              onClick={() => updateMemberMutation.mutate()}
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
