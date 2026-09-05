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
import { useCreateTicket } from "@/hooks/useTickets";

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
  duvidas: "Descreva detalhadamente a sua dúvida sobre regras, rotas, procedimentos ou funcionamento da facção...",
  reembolso: "Informe os itens/valores a serem ressarcidos, motivo da perda ou compra e anexe os prints dos comprovantes...",
  denuncia: "Relate o ocorrido com o máximo de detalhes (data, hora, envolvidos, passaportes e prints comprobatórios). Denúncia estritamente confidencial...",
  promocao: "Descreva sua trajetória, tempo de facção, metas batidas, presença em ações e por que deseja a promoção de cargo...",
  operacional: "Explique o problema encontrado na operação (baús, veículos da facção, desvios ou conflitos em rotas)...",
  outros: "Descreva sua solicitação ou mensagem para a liderança...",
};

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const [category, setCategory] = useState<TicketCategory>("duvidas");
  const [priority, setPriority] = useState<TicketPriority>("media");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TicketAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTicketMutation = useCreateTicket();

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são suportadas (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const newAtt: TicketAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name || "print_anexo.png",
        url: result,
        size: file.size,
        type: file.type,
        created_at: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAtt]);
      toast.success("Print/Imagem anexada com sucesso!");
    };
    reader.readAsDataURL(file);
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
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border p-4 sm:p-6"
          onPaste={handlePaste}
        >
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Novo Chamado / Ouvidoria
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Abra uma solicitação confidencial para a gerência da facção Twin Wheels.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* 1. Categorias */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Categoria da Solicitação *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TICKET_CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.id] || HelpCircle;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "relative flex flex-col items-start text-left p-2.5 rounded-lg border transition-all select-none",
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/50 shadow-sm shadow-amber-500/10 text-foreground ring-1 ring-amber-500/40"
                          : "bg-secondary/40 border-border/70 hover:bg-secondary/70 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-base leading-none">{cat.emoji}</span>
                        <span className="text-xs font-semibold truncate flex-1">{cat.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-tight">
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
                <Label htmlFor="subject" className="text-xs font-semibold">
                  Assunto do Chamado *
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre baú de suprimentos..."
                  maxLength={100}
                  className="bg-secondary/30 border-border text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Prioridade</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TICKET_PRIORITIES.map((pri) => {
                    const isSelected = priority === pri.id;
                    return (
                      <button
                        type="button"
                        key={pri.id}
                        onClick={() => setPriority(pri.id)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border text-xs font-medium transition-all",
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold shadow-sm"
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
                <Label htmlFor="description" className="text-xs font-semibold">
                  Descrição Detalhada *
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {description.length} caracteres
                </span>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={CATEGORY_PLACEHOLDERS[category]}
                rows={4}
                className="bg-secondary/30 border-border text-sm resize-none focus-visible:ring-1 focus-visible:ring-amber-500/40"
                required
              />
            </div>

            {/* 4. Anexos / Comprovantes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  Anexos / Prints (Opcional)
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Dica: Você pode pressionar <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] border">Ctrl+V</kbd> para colar prints
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
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 select-none",
                  isDragging
                    ? "border-amber-500 bg-amber-500/10 text-amber-300"
                    : "border-border/60 hover:border-amber-500/40 hover:bg-secondary/30 text-muted-foreground"
                )}
              >
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs font-medium">
                  Clique para selecionar imagens ou arraste para cá
                </p>
                <p className="text-[10px] text-muted-foreground">
                  PNG, JPG, WEBP até 8MB
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
                      className="group relative w-20 h-20 rounded-md overflow-hidden border border-border/80 bg-secondary/50"
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
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white opacity-90 group-hover:opacity-100 transition-opacity"
                        title="Remover anexo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createTicketMutation.isPending}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="text-xs h-9 bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Abrindo Chamado...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Abrir Chamado
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
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-border">
            <div className="relative flex flex-col items-center justify-center p-2">
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                className="max-h-[80vh] w-auto rounded object-contain"
              />
              <p className="text-xs text-muted-foreground mt-2">{previewAttachment.name}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
