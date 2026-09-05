import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Tag,
  Pin,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchPatchNotes,
  createPatchNote,
  updatePatchNote,
  deletePatchNote,
} from "@/services/patchNotesService";
import { PatchNoteEditorDialog } from "@/components/patch-notes/PatchNoteEditorDialog";
import { PatchNoteCard } from "@/components/patch-notes/PatchNoteCard";
import type { DevPatchNote, CreatePatchNotePayload } from "@/types/patchNotes";

export const Route = createFileRoute("/_authenticated/dev/patch-notes")({
  component: DevPatchNotesPageWrapper,
});

function DevPatchNotesPageWrapper() {
  return (
    <DeveloperGuard>
      <DevPatchNotesContent />
    </DeveloperGuard>
  );
}

function DevPatchNotesContent() {
  const { user, profile, level } = useAuth();
  const [patchNotes, setPatchNotes] = useState<DevPatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DevPatchNote | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPatchNotes();
      setPatchNotes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    const handleChanged = () => void loadData();
    window.addEventListener("tw_patch_notes_changed", handleChanged);
    return () => window.removeEventListener("tw_patch_notes_changed", handleChanged);
  }, []);

  const handleSaveNote = async (payload: CreatePatchNotePayload, existingId?: string) => {
    if (existingId) {
      await updatePatchNote({ ...payload, id: existingId }, user, profile, level);
    } else {
      await createPatchNote(payload, user, profile, level);
    }
    await loadData();
  };

  const handleDeleteNote = async (id: string) => {
    await deletePatchNote(id, user, profile, level);
    await loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Gerenciador de Patch Notes & Atualizações
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Módulo exclusivo da Tag Desenvolvedor para redação, upload de imagens demonstrativas e publicação de notas de versão visíveis pela administração.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            className="h-10 text-xs border-border/80 hover:bg-secondary rounded-xl flex items-center gap-2"
          >
            <Link to="/atualizacoes">
              <Eye className="h-4 w-4 text-sky-400" />
              <span>Ver Visão da Administração</span>
            </Link>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setEditingNote(null);
              setEditorOpen(true);
            }}
            className="h-10 px-4 bg-[#00a884] hover:bg-[#00a884]/90 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Publicar Patch Notes</span>
          </Button>
        </div>
      </div>

      {/* FEED DE PATCH NOTES COM CONTROLES DEV */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00a884] border-t-transparent mx-auto" />
            <p className="text-xs text-muted-foreground">Carregando notas de versão...</p>
          </div>
        ) : patchNotes.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/20 space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <h4 className="text-sm font-bold text-foreground">Nenhum patch note cadastrado</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Clique em "Publicar Patch Notes" para criar a primeira atualização com imagens e changelog.
            </p>
          </div>
        ) : (
          patchNotes.map((note) => (
            <PatchNoteCard
              key={note.id}
              note={note}
              isDev={true}
              onEdit={(n) => {
                setEditingNote(n);
                setEditorOpen(true);
              }}
              onDelete={handleDeleteNote}
            />
          ))
        )}
      </div>

      {/* DIALOG DE CRIAÇÃO / EDIÇÃO */}
      <PatchNoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingNote={editingNote}
        onSave={handleSaveNote}
      />
    </div>
  );
}
