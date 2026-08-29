import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Trash2, Edit, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useAnnouncements, useMembers, nameOf } from "@/hooks/useData";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/app-api";
import { dateTime, errorMessage } from "@/lib/format";
import type { Announcement } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/avisos")({
  component: AvisosPage,
});

function AvisosPage() {
  const { hasPermission } = useAuth();
  const canSend = hasPermission("manage_announcements");
  const { data: announcements = [], isLoading } = useAnnouncements();
  const { data: members = [] } = useMembers();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"normal" | "importante" | "urgente">("normal");

  // Edit State
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPriority, setEditPriority] = useState<"normal" | "importante" | "urgente">("normal");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!canSend) throw new Error("Você não possui permissão para publicar avisos.");
      if (!title.trim() || !content.trim())
        throw new Error("Preencha o título e o conteúdo do aviso.");
      await createAnnouncement({ title, content, priority });
    },
    onSuccess: () => {
      toast.success("Aviso publicado em destaque no Dashboard de todos os membros!");
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setTitle("");
      setContent("");
      setPriority("normal");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!canSend) throw new Error("Você não possui permissão para editar avisos.");
      if (!editingAnnouncement) return;
      if (!editTitle.trim() || !editContent.trim())
        throw new Error("Título e conteúdo são obrigatórios.");
      await updateAnnouncement(editingAnnouncement.id, {
        title: editTitle,
        content: editContent,
        priority: editPriority,
      });
    },
    onSuccess: () => {
      toast.success("Aviso atualizado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setEditingAnnouncement(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canSend) throw new Error("Você não possui permissão para apagar avisos.");
      await deleteAnnouncement(id);
    },
    onSuccess: () => {
      toast.success("Aviso removido.");
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setEditTitle(a.title);
    setEditContent(a.content);
    setEditPriority(a.priority);
  };

  if (!canSend) {
    return <NoAccess />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Enviar Avisos para o Grupo"
        description="Publique comunicados e avisos que serão exibidos em destaque no Dashboard de todos os membros do grupo."
      />

      <Card className="surface-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Megaphone className="h-5 w-5 text-primary" /> Novo Comunicado Oficial
          </CardTitle>
          <CardDescription className="text-xs">
            Selecione o nível de prioridade para que o banner de aviso tenha a cor correspondente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold">Título do Aviso</Label>
              <Input
                placeholder="Ex.: REUNIÃO GERAL DO GRUPO / REGRAS DE ESTOQUE..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Prioridade</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-medium"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="normal">Normal (Azul)</option>
                <option value="importante">Importante (Amarelo)</option>
                <option value="urgente">Urgente / Alerta (Vermelho)</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Conteúdo da Mensagem</Label>
            <Textarea
              placeholder="Escreva o aviso completo que todos os membros devem ler..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 text-xs"
            />
          </div>

          <Button
            type="button"
            className="bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="mr-2 h-4 w-4" />
            )}
            Publicar Aviso no Dashboard
          </Button>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Avisos Ativos</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : announcements.length === 0 ? (
            <EmptyState title="Nenhum aviso publicado" description="Envie o primeiro aviso no formulário acima." />
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "p-4 rounded-xl border space-y-2 transition-colors",
                    a.priority === "urgente"
                      ? "border-rose-500/40 bg-rose-500/10"
                      : a.priority === "importante"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "uppercase text-[10px]",
                          a.priority === "urgente"
                            ? "bg-rose-500 text-white"
                            : a.priority === "importante"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {a.priority}
                      </Badge>
                      <h4 className="font-bold text-sm text-foreground">{a.title}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(a)}
                        title="Editar aviso"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Deseja realmente excluir este aviso?")) {
                            deleteMutation.mutate(a.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Excluir aviso"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground whitespace-pre-wrap">{a.content}</p>

                  <p className="text-[0.65rem] text-muted-foreground">
                    Publicado por <span className="text-foreground font-semibold">{nameOf(members, a.author_id)}</span> · {dateTime(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT ANNOUNCEMENT MODAL */}
      <Dialog open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Edit className="h-4 w-4 text-primary" /> Editar Comunicado Oficial
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere o título, prioridade ou conteúdo do aviso que será exibido no Dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Título do Aviso</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 h-9 text-xs font-semibold"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Prioridade</Label>
                <select
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-medium"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                >
                  <option value="normal">Normal (Azul)</option>
                  <option value="importante">Importante (Amarelo)</option>
                  <option value="urgente">Urgente (Vermelho)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Conteúdo da Mensagem</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingAnnouncement(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold hover:opacity-90"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
