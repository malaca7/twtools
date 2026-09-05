import React, { useState } from "react";
import {
  Sparkles,
  Wrench,
  Bug,
  ShieldCheck,
  Tag,
  Pin,
  Calendar,
  User,
  Edit2,
  Trash2,
  Maximize2,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PatchNoteLightboxModal } from "./PatchNoteLightboxModal";
import { cn } from "@/lib/utils";
import type { DevPatchNote, PatchNoteCategory, PatchNoteImage } from "@/types/patchNotes";

interface PatchNoteCardProps {
  note: DevPatchNote;
  isDev?: boolean;
  onEdit?: (note: DevPatchNote) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_CONFIG: Record<
  PatchNoteCategory,
  { label: string; icon: any; color: string; badgeClass: string }
> = {
  feature: {
    label: "Nova Funcionalidade",
    icon: Sparkles,
    color: "#25d366",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  improvement: {
    label: "Melhoria",
    icon: Wrench,
    color: "#38bdf8",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  bugfix: {
    label: "Correção de Bug",
    icon: Bug,
    color: "#f59e0b",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  security: {
    label: "Segurança",
    icon: ShieldCheck,
    color: "#a855f7",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  maintenance: {
    label: "Manutenção",
    icon: Layers,
    color: "#06b6d4",
    badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  general: {
    label: "Geral",
    icon: Tag,
    color: "#94a3b8",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
};

export function PatchNoteCard({ note, isDev = false, onEdit, onDelete }: PatchNoteCardProps) {
  const [activeImage, setActiveImage] = useState<PatchNoteImage | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
  const CategoryIcon = cat.icon;

  const formattedDate = new Date(note.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-200",
        "bg-[#141b22]/90 hover:bg-[#161f28] border-white/10 hover:border-white/20 shadow-xl",
        note.pinned && "border-[#00a884]/40 bg-[#141b22]/95 shadow-[0_0_20px_rgba(0,168,132,0.1)]"
      )}
    >
      {/* PINNED ACCENT STRIP */}
      {note.pinned && (
        <div className="h-1 bg-gradient-to-r from-[#00a884] via-emerald-400 to-[#53bdeb]" />
      )}

      <div className="p-4 sm:p-6 space-y-4">
        {/* TOP BAR: VERSION, BADGES & ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* VERSION PILL */}
            <span className="px-2.5 py-1 rounded-lg bg-[#00a884]/15 border border-[#00a884]/35 text-[#25d366] font-mono text-xs font-black tracking-wide shadow-xs">
              {note.version}
            </span>

            {/* CATEGORY BADGE */}
            <Badge
              variant="outline"
              className={cn("px-2.5 py-0.5 text-xs font-bold gap-1 rounded-lg", cat.badgeClass)}
            >
              <CategoryIcon className="h-3 w-3" />
              <span>{cat.label}</span>
            </Badge>

            {/* PINNED BADGE */}
            {note.pinned && (
              <Badge
                variant="outline"
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1"
              >
                <Pin className="h-2.5 w-2.5 fill-current" />
                <span>Fixado</span>
              </Badge>
            )}

            {/* DRAFT BADGE */}
            {!note.is_published && (
              <Badge
                variant="outline"
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border-amber-500/30"
              >
                Rascunho
              </Badge>
            )}
          </div>

          {/* RIGHT SIDE: DATE & DEV ACTIONS */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] font-mono">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>

            {isDev && (
              <div className="flex items-center gap-1 ml-2">
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(note)}
                    className="h-7 w-7 text-[#8696a0] hover:text-[#00a884] hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                    title="Editar atualização"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}

                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="h-7 w-7 text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    title="Excluir atualização"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TITLE & AUTHOR */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black text-[#e9edef] tracking-tight">
            {note.title}
          </h3>

          <div className="flex items-center gap-2 pt-0.5">
            <Avatar className="h-5 w-5 border border-white/10">
              {note.author_avatar && <AvatarImage src={note.author_avatar} />}
              <AvatarFallback className="text-[9px] bg-emerald-800 text-white font-bold">
                {note.author_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-[#8696a0]">
              Postado por <strong className="text-[#d1d7db]">{note.author_name}</strong>
            </span>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="text-xs sm:text-sm text-[#8696a0] leading-relaxed whitespace-pre-line border-t border-white/5 pt-3">
          {note.description}
        </div>

        {/* BULLET POINTS (CHANGES LIST) */}
        {note.changes && note.changes.length > 0 && (
          <div className="space-y-2 bg-[#0d131a]/60 rounded-xl p-3 sm:p-4 border border-white/5">
            <h4 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00a884]" />
              <span>O que há de novo nesta versão</span>
            </h4>

            <ul className="space-y-1.5 pt-1">
              {note.changes.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-[#d1d7db] leading-normal"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00a884] shrink-0 mt-1.5" />
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* IMAGES GALLERY WITH LIGHTBOX PREVIEW */}
        {note.images && note.images.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-[#8696a0] uppercase tracking-wider block">
              Galeria de Capturas / Demonstrações ({note.images.length})
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {note.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImage(img)}
                  className="group/img relative aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 cursor-pointer shadow-md hover:border-[#00a884]/60 transition-all hover:scale-[1.02]"
                >
                  <img
                    src={img.url}
                    alt={img.caption || img.name || "Imagem da atualização"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2 className="h-5 w-5 drop-shadow-md text-[#25d366]" />
                  </div>
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 to-transparent text-[10px] text-[#e9edef] truncate px-2 font-medium">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      <PatchNoteLightboxModal
        isOpen={Boolean(activeImage)}
        onClose={() => setActiveImage(null)}
        imageUrl={activeImage?.url || null}
        imageTitle={`${note.version} — ${note.title}`}
        caption={activeImage?.caption || activeImage?.name}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#1f2c34] border border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Atualização?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#8696a0]">
              Tem certeza de que deseja excluir permanentemente a nota da versão{" "}
              <strong className="text-white font-mono">{note.version}</strong>? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(note.id);
                setDeleteConfirmOpen(false);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
