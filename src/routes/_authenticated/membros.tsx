import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { NoAccess, PageHeader, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, usePendingSignupRequests } from "@/hooks/useData";
import { submitSignupReview } from "@/lib/app-api";
import { dateTime, errorMessage } from "@/lib/format";
import { LEVEL_LABEL, LEVELS, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/membros")({
  component: Page,
});

function Page() {
  const { hasPermission, level } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission("manage_members");
  const canView = hasPermission("view_members");
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: pending = [], isLoading: pendingLoading } = usePendingSignupRequests(canView);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, AppLevel>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      approve,
      nivel,
      reason,
    }: {
      requestId: string;
      approve: boolean;
      nivel: AppLevel;
      reason?: string;
    }) => {
      await submitSignupReview({
        data: {
          requestId,
          approve,
          nivel,
          reason,
        },
      });
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["pending_signup_requests"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(vars.approve ? "Registro aprovado." : "Registro rejeitado.");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Não foi possível concluir a revisão do registro."));
    },
  });

  if (!canView) {
    return <NoAccess />;
  }

  const allowedLevels = LEVELS.filter((item) => {
    if (level === "01" || level === "02") return true;
    return !["01", "02", "gerente"].includes(item);
  });

  const handleApprove = (requestId: string) => {
    const nivelSelecionado = selectedLevels[requestId] ?? "novato";
    reviewMutation.mutate({ requestId, approve: true, nivel: nivelSelecionado });
  };

  const handleReject = (requestId: string) => {
    const reason = reasons[requestId];
    reviewMutation.mutate({
      requestId,
      approve: false,
      nivel: "novato",
      ...(reason ? { reason } : {}),
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Membros"
        description="Gerencie a fila de registro e acompanhe os membros já aprovados."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Registros pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <TableSkeleton rows={4} />
            ) : pending.length === 0 ? (
              <EmptyState
                title="Nenhum registro pendente"
                description="Novas solicitações enviadas pelo formulário aparecem aqui para aprovação."
              />
            ) : (
              <div className="space-y-4">
                {pending.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{request.nome}</p>
                          <Badge variant="outline">Pendente</Badge>
                        </div>
                        {request.nickname ? (
                          <p className="text-xs text-muted-foreground">Apelido: {request.nickname}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-muted-foreground">
                          Telefone: {request.telefone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {dateTime(request.requested_at)}
                        </p>
                      </div>

                      {canManage ? (
                        <div className="w-full max-w-sm space-y-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              Nível inicial
                            </label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={selectedLevels[request.id] ?? "novato"}
                              onChange={(e) =>
                                setSelectedLevels((current) => ({
                                  ...current,
                                  [request.id]: e.target.value as AppLevel,
                                }))
                              }
                            >
                              {allowedLevels.map((item) => (
                                <option key={item} value={item}>
                                  {LEVEL_LABEL[item]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              Motivo da rejeição
                            </label>
                            <Textarea
                              value={reasons[request.id] ?? ""}
                              onChange={(e) =>
                                setReasons((current) => ({
                                  ...current,
                                  [request.id]: e.target.value,
                                }))
                              }
                              placeholder="Opcional"
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-gradient-brand text-primary-foreground hover:opacity-90"
                              onClick={() => handleApprove(request.id)}
                              disabled={reviewMutation.isPending}
                            >
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleReject(request.id)}
                              disabled={reviewMutation.isPending}
                            >
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Membros aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <TableSkeleton rows={6} />
            ) : members.length === 0 ? (
              <EmptyState title="Nenhum membro ativo" description="Os membros aprovados aparecerão aqui." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entrada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{member.nome}</p>
                          {member.nickname ? (
                            <p className="text-xs text-muted-foreground">{member.nickname}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.nivel ? (
                          <Badge
                            variant="outline"
                            className={cn("capitalize", levelBadgeClass(member.nivel))}
                          >
                            {LEVEL_LABEL[member.nivel]}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{member.status}</TableCell>
                      <TableCell>{member.data_entrada}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
