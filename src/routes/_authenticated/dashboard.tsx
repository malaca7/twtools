import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Megaphone,
  Users,
  Clock,
  CheckCircle2,
  Search,
  Wifi,
  WifiOff,
  Moon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import {
  useMembers,
  useAnnouncements,
  useAnnouncementReads,
  nameOf,
} from "@/hooks/useData";
import { markAnnouncementAsRead } from "@/lib/app-api";
import { dateTime, errorMessage } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useOnlineTimer } from "@/hooks/useOnlineTimer";
import type { UserPresenceStatus, Member } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, hasPermission } = useAuth();
  if (!hasPermission("view_dashboard")) return <NoAccess />;
  const queryClient = useQueryClient();
  const { data: members = [] } = useMembers();
  const { data: announcements = [] } = useAnnouncements();
  const { data: announcementReads = [] } = useAnnouncementReads();

  const readMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      await markAnnouncementAsRead(announcementId);
    },
    onSuccess: () => {
      toast.success("Aviso marcado como lido!");
      void queryClient.invalidateQueries({ queryKey: ["announcement_reads"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const memberName = profile?.nickname || profile?.nome || "Membro";

  // Sort announcements: unread first (vibrant), read second (opaque/faded below)
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const aRead = announcementReads.some(
        (r) => r.announcement_id === a.id && r.user_id === user?.id
      );
      const bRead = announcementReads.some(
        (r) => r.announcement_id === b.id && r.user_id === user?.id
      );

      if (aRead !== bRead) {
        return aRead ? 1 : -1; // Unread first (-1), read second (1)
      }

      // If both read or both unread, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [announcements, announcementReads, user?.id]);

  const unreadCount = useMemo(() => {
    return announcements.filter(
      (a) => !announcementReads.some((r) => r.announcement_id === a.id && r.user_id === user?.id)
    ).length;
  }, [announcements, announcementReads, user?.id]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={`Salve, ${memberName}! ✌🏼`}
        description="Painel geral do grupo com comunicados e membros ativos sincronizados em tempo real."
      />

      {/* ANNOUNCEMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Comunicados Oficiais</h2>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white text-[10px] font-extrabold uppercase animate-pulse">
                {unreadCount} {unreadCount === 1 ? "novo aviso" : "novos avisos"}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-mono font-bold border-primary/30 text-primary">
              {announcements.length} {announcements.length === 1 ? "comunicado" : "comunicados"}
            </Badge>
          </div>
        </div>

        {sortedAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {sortedAnnouncements.map((ann) => {
              const isReadByMe = announcementReads.some(
                (r) => r.announcement_id === ann.id && r.user_id === user?.id
              );

              const readerUserIds = announcementReads
                .filter((r) => r.announcement_id === ann.id)
                .map((r) => r.user_id);

              const readerMembers = members.filter((m) =>
                readerUserIds.includes(m.user_id)
              );

              const readerNamesHover =
                readerMembers.length > 0
                  ? `Lido por (${readerMembers.length}): ${readerMembers.map((m) => m.nickname || m.nome).join(", ")}`
                  : "Nenhum membro leu este aviso ainda";

              return (
                <Card
                  key={ann.id}
                  className={cn(
                    "border backdrop-blur transition-all duration-300 shadow-md flex flex-col justify-between",
                    isReadByMe
                      ? "opacity-55 hover:opacity-100 bg-card/30 border-border/40 shadow-none hover:shadow-md hover:border-border"
                      : ann.priority === "urgente"
                      ? "border-rose-500/50 bg-rose-500/10 shadow-rose-950/20 ring-1 ring-rose-500/30"
                      : ann.priority === "importante"
                      ? "border-amber-500/50 bg-amber-500/10 shadow-amber-950/20 ring-1 ring-amber-500/30"
                      : "border-primary/40 bg-primary/10 ring-1 ring-primary/20"
                  )}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Megaphone
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isReadByMe
                            ? "text-muted-foreground opacity-60"
                            : ann.priority === "urgente"
                            ? "text-rose-500 animate-pulse"
                            : ann.priority === "importante"
                            ? "text-amber-400 animate-pulse"
                            : "text-primary animate-pulse"
                        )}
                      />
                      <CardTitle className={cn("text-sm font-bold truncate", isReadByMe ? "text-muted-foreground" : "text-foreground")}>
                        {ann.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isReadByMe && (
                        <Badge variant="secondary" className="text-[9px] font-mono text-muted-foreground bg-secondary/60">
                          Lido por você
                        </Badge>
                      )}
                      <Badge
                        className={cn(
                          "uppercase text-[9px] font-extrabold tracking-wider shrink-0",
                          isReadByMe
                            ? "bg-secondary text-muted-foreground border border-border/50"
                            : ann.priority === "urgente"
                            ? "bg-rose-500 text-white"
                            : ann.priority === "importante"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {ann.priority}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs flex-1 flex flex-col justify-between">
                    <p className={cn("font-medium whitespace-pre-wrap leading-relaxed", isReadByMe ? "text-muted-foreground" : "text-foreground")}>
                      {ann.content}
                    </p>

                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.65rem] text-muted-foreground">
                        <span className="font-semibold text-foreground">{nameOf(members, ann.author_id)}</span> · {dateTime(ann.created_at)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {isReadByMe ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-semibold">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Lido
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                            onClick={() => readMutation.mutate(ann.id)}
                            disabled={readMutation.isPending}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Marcar Lido
                          </Button>
                        )}

                        {/* STACKED AVATARS OF READERS */}
                        <div
                          className="flex items-center gap-1 cursor-pointer"
                          title={readerNamesHover}
                        >
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {readerMembers.slice(0, 4).map((rm) => (
                              <Avatar
                                key={rm.user_id}
                                className="inline-block h-5 w-5 rounded-full ring-1 ring-background border border-border"
                              >
                                <AvatarImage src={rm.discord_avatar_url || undefined} alt={rm.nome} />
                                <AvatarFallback className="text-[8px] bg-secondary font-bold">
                                  {(rm.nickname || rm.nome).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {readerMembers.length > 4 && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-muted-foreground ring-1 ring-background border border-border">
                                +{readerMembers.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardContent className="p-8 text-center space-y-2">
              <Megaphone className="h-8 w-8 text-primary opacity-60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Nenhum comunicado oficial ativo no momento.</p>
              <p className="text-xs text-muted-foreground">Novos avisos postados pela liderança aparecerão automaticamente nesta seção.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
