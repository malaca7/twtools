import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Eye,
  Edit3,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatchNoteCard } from "./PatchNoteCard";
import { uploadPatchNoteImage } from "@/services/patchNotesService";
import { toast } from "sonner";
import type {
  DevPatchNote,
  CreatePatchNotePayload,
  PatchNoteCategory,
  PatchNoteImage,
} from "@/types/patchNotes";

interface PatchNoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote?: DevPatchNote | null;
  onSave: (payload: CreatePatchNotePayload, existingId?: string) => Promise<void>;
}

export function PatchNoteEditorDialog({
  open,
  onOpenChange,
  editingNote,
  onSave,
}: PatchNoteEditorDialogProps) {
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PatchNoteCategory>("feature");
  const [description, setDescription] = useState("");
  const [changes, setChanges] = useState<string[]>([""]);
  const [images, setImages] = useState<PatchNoteImage[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setVersion(editingNote.version);
      setTitle(editingNote.title);
      setCategory(editingNote.category);
      setDescription(editingNote.description);
      setChanges(editingNote.changes.length > 0 ? [...editingNote.changes] : [""]);
      setImages(editingNote.images ? [...editingNote.images] : []);
      setIsPublished(editingNote.is_published);
      setPinned(Boolean(editingNote.pinned));
    } else {
      setVersion("v");
      setTitle("");
      setCategory("feature");
      setDescription("");
      setChanges([""]);
      setImages([]);
      setIsPublished(true);
      setPinned(false);
    }
    setActiveTab("edit");
  }, [editingNote, open]);

  const handleAddChangeItem = () => {
    setChanges((prev) => [...prev, ""]);
  };

  const handleRemoveChangeItem = (index: number) => {
    setChanges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateChangeItem = (index: number, val: string) => {
    setChanges((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const newImages: PatchNoteImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadPatchNoteImage(file, (pct) => {
          setUploadProgress(Math.round(((i + pct / 100) / files.length) * 100));
        });

        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: res.url,
          name: res.name,
          size: res.size,
          caption: "",
        });
      }

      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${newImages.length} imagem(ns) anexada(s) com sucesso!`);
    } catch (err: any) {
      toast.error(`Falha no upload de imagem: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleUpdateImageCaption = (id: string, caption: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !title.trim() || !description.trim()) {
      toast.error("Preencha a versão, o título e a descrição da atualização.");
      return;
    }

    const cleanedChanges = changes.map((c) => c.trim()).filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSave(
        {
          version: version.trim(),
          title: title.trim(),
          category,
          description: description.trim(),
          changes: cleanedChanges,
          images,
          is_published: isPublished,
          pinned,
        },
        editingNote?.id
      );

      toast.success(
        editingNote
          ? "Atualização editada com sucesso!"
          : "Atualização de desenvolvimento publicada com sucesso!"
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Erro ao salvar atualização: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewNote: DevPatchNote = {
    id: editingNote?.id || "preview-id",
    version: version.trim() || "v1.0.0",
    title: title.trim() || "Título da Atualização",
    category,
    description: description.trim() || "Descrição das novidades implementadas...",
    changes: changes.map((c) => c.trim()).filter(Boolean),
    images,
    author_id: "me",
    author_name: "Você (Desenvolvedor)",
    author_avatar: null,
    created_at: new Date().toISOString(),
    is_published: isPublished,
    pinned,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-[#111827] border border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-white/10 bg-[#161f2e]">
          <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-[#00a884]" />
            <span>
              {editingNote ? "Editar Patch Notes / Atualização" : "Postar Nova Atualização de Desenvolvimento"}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* TABS: EDITAR OU PRÉVIA */}
        <div className="px-4 pt-3 border-b border-white/5 bg-[#111827] flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-black/30 border border-white/5 p-1 rounded-xl">
              <TabsTrigger
                value="edit"
                className="text-xs font-bold data-[state=active]:bg-[#00a884] data-[state=active]:text-white rounded-lg flex items-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Formulário de Edição</span>
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="text-xs font-bold data-[state=active]:bg-[#00a884] data-[state=active]:text-white rounded-lg flex items-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Visualizar Prévia Real</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar-thin">
          {activeTab === "edit" ? (
            <form id="patch-note-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* LINHA 1: VERSÃO, CATEGORIA E FIXAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#d1d7db]">
                    Versão <span className="text-[#00a884]">*</span>
                  </Label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Ex: v2.4.0"
                    required
                    className="h-9 bg-[#1a2332] border-white/10 text-xs font-mono text-white rounded-xl focus:border-[#00a884]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#d1d7db]">
                    Categoria <span className="text-[#00a884]">*</span>
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val as PatchNoteCategory)}
                  >
                    <SelectTrigger className="h-9 bg-[#1a2332] border-white/10 text-xs text-white rounded-xl focus:border-[#00a884]">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2332] border-white/10 text-white rounded-xl">
                      <SelectItem value="feature">✨ Nova Funcionalidade</SelectItem>
                      <SelectItem value="improvement">🛠️ Melhoria Geral</SelectItem>
                      <SelectItem value="bugfix">🐛 Correção de Bug</SelectItem>
                      <SelectItem value="security">🔒 Segurança</SelectItem>
                      <SelectItem value="maintenance">⚡ Manutenção</SelectItem>
                      <SelectItem value="general">📌 Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#1a2332] border border-white/10">
                    <Label className="text-xs font-bold text-[#d1d7db] cursor-pointer">
                      Fixar no Topo
                    </Label>
                    <Switch checked={pinned} onCheckedChange={setPinned} />
                  </div>
                </div>
              </div>

              {/* TÍTULO */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#d1d7db]">
                  Título da Atualização <span className="text-[#00a884]">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Chat em Tempo Real, Citações WhatsApp e Correções"
                  required
                  className="h-9 bg-[#1a2332] border-white/10 text-xs text-white rounded-xl focus:border-[#00a884]"
                />
              </div>

              {/* DESCRIÇÃO GERAL */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#d1d7db]">
                  Descrição Resumida / Changelog <span className="text-[#00a884]">*</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo geral desta atualização e os principais ganhos para a facção..."
                  rows={3}
                  required
                  className="bg-[#1a2332] border-white/10 text-xs text-white rounded-xl focus:border-[#00a884] leading-relaxed resize-none"
                />
              </div>

              {/* LISTA DE PONTOS ALTERADOS (BULLET POINTS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#d1d7db]">
                    Pontos Implementados / O que mudou
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddChangeItem}
                    className="h-7 px-2.5 text-xs text-[#00a884] hover:bg-[#00a884]/15 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Ponto</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8696a0] w-5 text-right">
                        {index + 1}.
                      </span>
                      <Input
                        value={change}
                        onChange={(e) => handleUpdateChangeItem(index, e.target.value)}
                        placeholder="Ex: Corrigido bug de delay no envio e recebimento de mensagens"
                        className="h-8 bg-[#1a2332] border-white/10 text-xs text-white rounded-xl flex-1 focus:border-[#00a884]"
                      />
                      {changes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveChangeItem(index)}
                          className="h-8 w-8 text-[#8696a0] hover:text-rose-400 hover:bg-white/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* IMAGENS / CAPTURAS DE TELA */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#d1d7db]">
                    Capturas de Tela / Imagens da Atualização
                  </Label>
                  <span className="text-[10px] text-[#8696a0]">
                    Suporta múltiplas imagens (PNG, JPG, WEBP)
                  </span>
                </div>

                {/* DROPZONE / BOTAO DE UPLOAD */}
                <div className="border border-dashed border-white/15 hover:border-[#00a884]/50 rounded-2xl p-4 bg-[#161f2e]/50 text-center transition-colors">
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white hover:underline">
                        Clique para selecionar imagens
                      </span>
                      <p className="text-[10px] text-[#8696a0] mt-0.5">
                        Fotos e demonstrações visuais das novas telas ou correções
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  {isUploading && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-center gap-2 text-xs text-[#00a884] font-bold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Enviando imagens... {uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00a884] h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LISTA DE IMAGENS CARREGADAS */}
                {images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1a2332] border border-white/10 overflow-hidden"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="h-14 w-20 object-cover rounded-lg shrink-0 bg-black/40 border border-white/5"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-[11px] font-bold text-[#e9edef] truncate">{img.name}</p>
                          <Input
                            value={img.caption || ""}
                            onChange={(e) => handleUpdateImageCaption(img.id, e.target.value)}
                            placeholder="Legenda da foto..."
                            className="h-6 text-[10px] bg-black/30 border-white/10 rounded-md text-[#d1d7db] px-1.5"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveImage(img.id)}
                          className="h-7 w-7 text-[#8696a0] hover:text-rose-400 hover:bg-white/10 rounded-lg shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OPÇÃO DE PUBLICAR IMEDIATAMENTE */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161f2e] border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Visível para a Administração
                  </span>
                  <p className="text-[10px] text-[#8696a0]">
                    Se desmarcado, ficará salvo apenas como rascunho visível no módulo de desenvolvimento.
                  </p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </form>
          ) : (
            /* TAB DE PRÉVIA EM TEMPO REAL */
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>Esta é a aparência exata que a Administração e líderes visualizarão:</span>
              </div>
              <PatchNoteCard note={previewNote} />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t border-white/10 bg-[#161f2e] flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-[#8696a0] hover:text-white rounded-xl cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="patch-note-form"
            disabled={isSubmitting || isUploading}
            className="h-9 px-5 bg-[#00a884] hover:bg-[#00a884]/90 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{editingNote ? "Salvar Alterações" : "Publicar Atualização"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
