import { useState, useRef } from "react";
import {
  HelpCircle,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Wrench,
  FileText,
  UploadCloud,
  X,
  Plus,
  Paperclip,
  Check,
  LifeBuoy,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
  type TicketAttachment,
} from "@/types/tickets";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTicket } from "@/hooks/useTickets";
import { uploadTicketAttachment } from "@/lib/app-api";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICONS: Record<TicketCategory, typeof HelpCircle> = {
  duvidas: HelpCircle,
  reembolso: DollarSign,
  denuncia: AlertTriangle,
  promocao: TrendingUp,
  operacional: Wrench,
  outros: FileText,
};

const CATEGORY_PLACEHOLDERS: Record<TicketCategory, string> = {
  duvidas: "Descreva detalhadamente a sua dúvida sobre regras, rotas, procedimentos ou funcionamento do grupo...",
  reembolso: "Informe os itens/valores a serem ressarcidos, motivo da perda ou compra e anexe os prints dos comprovantes...",
  denuncia: "Relate o ocorrido com o máximo de detalhes (data, hora, envolvidos, passaportes e prints comprobatórios). Denúncia estritamente confidencial...",
  promocao: "Descreva sua trajetória, tempo de grupo, metas batidas, presença em ações e por que deseja a promoção de cargo...",
  operacional: "Explique o problema encontrado na operação (baús, veículos do grupo, desvios ou conflitos em rotas)...",
  outros: "Descreva sua solicitação ou mensagem para a liderança...",
};

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const [category, setCategory] = useState<TicketCategory>("duvidas");
  const [priority, setPriority] = useState<TicketPriority>("media");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TicketAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTicketMutation = useCreateTicket();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("create_ticket") || hasPermission("manage_tickets");

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são suportadas (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploadingAttachment(true);
    const toastId = toast.loading("Enviando print/imagem para o chamado...");
    try {
      const newAtt = await uploadTicketAttachment(file);
      setAttachments((prev) => [...prev, newAtt]);
      toast.success("Print/Imagem anexada com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao anexar print.", { id: toastId });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        handleImageFile(files[i]);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error("Você não tem permissão para abrir chamados.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Informe o assunto do chamado.");
      return;
    }
    if (!description.trim()) {
      toast.error("Informe a descrição detalhada da sua solicitação.");
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        attachments,
      });

      // Reset form
      setSubject("");
      setDescription("");
      setCategory("duvidas");
      setPriority("media");
      setAttachments([]);
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border-border/80 p-4 sm:p-6 rounded-2xl shadow-2xl"
          onPaste={handlePaste}
        >
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  Novo Chamado / Ouvidoria
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Abra uma solicitação confidencial e acompanhe o atendimento com a gerência do grupo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* 1. Categorias */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>1. Categoria da Solicitação</span>
                <span className="text-rose-400">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TICKET_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "relative flex flex-col items-start text-left p-2.5 rounded-xl border transition-all select-none cursor-pointer",
                        isSelected
                          ? "bg-cyan-500/15 border-cyan-500/50 shadow-sm shadow-cyan-500/10 text-foreground ring-1 ring-cyan-500/40"
                          : "bg-secondary/40 border-border/70 hover:bg-secondary/70 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-base leading-none">{cat.emoji}</span>
                        <span className="text-xs font-bold truncate flex-1">{cat.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-tight font-medium">
                        {cat.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Prioridade & Assunto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-bold flex items-center gap-1">
                  <span>Assunto do Chamado</span>
                  <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre baú de suprimentos..."
                  maxLength={100}
                  className="bg-secondary/30 border-border/70 text-xs sm:text-sm rounded-xl focus-visible:ring-cyan-500/40"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Prioridade</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TICKET_PRIORITIES.map((pri) => {
                    const isSelected = priority === pri.id;
                    return (
                      <button
                        type="button"
                        key={pri.id}
                        onClick={() => setPriority(pri.id)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                          isSelected
                            ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 font-bold shadow-xs"
                            : "border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full shrink-0", pri.dotClass)} />
                        {pri.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Descrição */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-bold flex items-center gap-1">
                  <span>Descrição Detalhada</span>
                  <span className="text-rose-400">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {description.length} caracteres
                </span>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={CATEGORY_PLACEHOLDERS[category]}
                rows={4}
                className="bg-secondary/30 border-border/70 text-xs sm:text-sm resize-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 rounded-xl leading-relaxed"
                required
              />
            </div>

            {/* 4. Anexos / Comprovantes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Anexos / Prints (Opcional)</span>
                </Label>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] border border-border">Ctrl + V</kbd> para colar prints
                </span>
              </div>

              {/* Drop area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 select-none",
                  isDragging
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-border/60 hover:border-cyan-500/40 hover:bg-secondary/30 text-muted-foreground"
                )}
              >
                <UploadCloud className="h-6 w-6 text-cyan-400/80" />
                <p className="text-xs font-semibold text-foreground">
                  Clique para selecionar imagens ou arraste para cá
                </p>
                <p className="text-[10px] text-muted-foreground">
                  PNG, JPG, WEBP até 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      for (let i = 0; i < files.length; i++) {
                        handleImageFile(files[i]);
                      }
                    }
                  }}
                />
              </div>

              {/* Thumbnails preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group relative w-20 h-20 rounded-xl overflow-hidden border border-border/80 bg-secondary/50 shadow-xs"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        onClick={() => setPreviewAttachment(att)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(att.id);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-rose-600 text-white transition-colors"
                        title="Remover anexo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createTicketMutation.isPending}
                className="text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTicketMutation.isPending || !canCreate}
                className="text-xs h-9 bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-1.5 rounded-xl shadow-sm"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Abrindo Chamado...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Abrir Chamado</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Preview Dialog */}
      {previewAttachment && (
        <Dialog open={Boolean(previewAttachment)} onOpenChange={() => setPreviewAttachment(null)}>
          <DialogContent className="max-w-4xl p-3 bg-black/95 border-border/80 backdrop-blur-xl rounded-2xl shadow-2xl">
            <div className="relative flex flex-col items-center justify-center p-2 space-y-3">
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground px-2">
                <span className="font-mono truncate max-w-md">{previewAttachment.name}</span>
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline font-semibold"
                >
                  <span>Abrir em nova aba</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
