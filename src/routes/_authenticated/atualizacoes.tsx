import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Search,
  Plus,
  Filter,
  Layers,
  Wrench,
  Bug,
  ShieldCheck,
  Tag,
  Clock,
  Code2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { isUserDeveloper } from "@/services/devService";
import {
  fetchPatchNotes,
  createPatchNote,
  updatePatchNote,
  deletePatchNote,
} from "@/services/patchNotesService";
import { PatchNoteCard } from "@/components/patch-notes/PatchNoteCard";
import { PatchNoteEditorDialog } from "@/components/patch-notes/PatchNoteEditorDialog";
import { cn } from "@/lib/utils";
import type { DevPatchNote, PatchNoteCategory, CreatePatchNotePayload } from "@/types/patchNotes";

export const Route = createFileRoute("/_authenticated/atualizacoes")({
  component: AtualizacoesPage,
});

function AtualizacoesPage() {
  const { user, profile, level } = useAuth();
  const isDev = isUserDeveloper(user, profile, level);

  const [patchNotes, setPatchNotes] = useState<DevPatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | PatchNoteCategory>("all");
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

    const handleChanged = () => {
      void loadData();
    };
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

  // Filtragem: Membros da administração visualizam apenas notas publicadas (ou todas se for dev)
  const visibleNotes = useMemo(() => {
    return patchNotes.filter((n) => {
      if (!isDev && !n.is_published) return false;
      if (selectedCategory !== "all" && n.category !== selectedCategory) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.version.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.changes.some((c) => c.toLowerCase().includes(q)) ||
        n.author_name.toLowerCase().includes(q)
      );
    });
  }, [patchNotes, isDev, selectedCategory, search]);

  // Estatísticas
  const stats = useMemo(() => {
    const published = patchNotes.filter((n) => n.is_published);
    const latest = published[0]?.version || "v2.4.0";
    const featuresCount = published.filter((n) => n.category === "feature").length;
    const bugfixesCount = published.filter((n) => n.category === "bugfix").length;
    return {
      total: published.length,
      latest,
      featuresCount,
      bugfixesCount,
    };
  }, [patchNotes]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Atualizações do Sistema & Patch Notes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Histórico completo de releases, novas funcionalidades, melhorias operacionais e correções publicadas pela equipe de desenvolvimento para a administração.
          </p>
        </div>

        {/* BOTAO PARA DESENVOLVEDORES */}
        {isDev && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setEditorOpen(true);
              }}
              className="h-10 px-4 bg-[#00a884] hover:bg-[#00a884]/90 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Postar Atualização (Dev)</span>
            </Button>
          </div>
        )}
      </div>

      {/* METRICS / STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Última Versão
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
              {stats.latest}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Releases Publicadas
          </span>
          <span className="text-lg sm:text-xl font-black text-foreground">
            {stats.total}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Novos Recursos
          </span>
          <span className="text-lg sm:text-xl font-black text-sky-400">
            {stats.featuresCount}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Bugs Corrigidos
          </span>
          <span className="text-lg sm:text-xl font-black text-amber-400">
            {stats.bugfixesCount}
          </span>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTERS */}
      <div className="p-3 sm:p-4 rounded-2xl bg-card/40 border border-border/60 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por versão, funcionalidade, correção ou descrição..."
            className="pl-9 h-10 bg-background/60 border-border/60 text-xs rounded-xl"
          />
        </div>

        {/* CATEGORY CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
          {[
            { id: "all", label: "Todas as Atualizações", icon: Layers },
            { id: "feature", label: "Novidades & Recursos", icon: Sparkles },
            { id: "improvement", label: "Melhorias", icon: Wrench },
            { id: "bugfix", label: "Correções", icon: Bug },
            { id: "security", label: "Segurança", icon: ShieldCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                  isSel
                    ? "bg-[#00a884] text-white border-[#00a884] shadow-xs"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/70"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED / TIMELINE DE ATUALIZAÇÕES */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00a884] border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground">Carregando notas de versão e atualizações...</p>
        </div>
      ) : visibleNotes.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/20 space-y-3">
          <Tag className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">Nenhuma atualização encontrada</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search
              ? "Nenhum patch note corresponde aos termos da sua pesquisa."
              : "Nenhuma atualização publicada para a categoria selecionada."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleNotes.map((note) => (
            <PatchNoteCard
              key={note.id}
              note={note}
              isDev={isDev}
              onEdit={(n) => {
                setEditingNote(n);
                setEditorOpen(true);
              }}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}

      {/* DIALOG DE POSTAGEM / EDIÇÃO EXCLUSIVO DEV */}
      {isDev && (
        <PatchNoteEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          editingNote={editingNote}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}
