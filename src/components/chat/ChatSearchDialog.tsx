import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Calendar,
  User,
  FileText,
  ArrowRight,
  Image,
  Video,
  Music,
  Link2,
  Filter,
} from "lucide-react";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  onSelectMessage: (messageId: string) => void;
}

type FilterType = "all" | "media" | "docs" | "audio" | "links";

export function ChatSearchDialog({
  open,
  onOpenChange,
  messages,
  onSelectMessage,
}: ChatSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return messages
      .filter((m) => {
        if (m.is_deleted || m.is_deleted_for_everyone) return false;

        // Filtro por tipo de mídia
        if (filterType === "media" && !["image", "video"].includes(m.message_type)) return false;
        if (filterType === "docs" && m.message_type !== "document" && !m.attachment_name) return false;
        if (filterType === "audio" && m.message_type !== "audio") return false;
        if (filterType === "links" && !m.content?.match(urlRegex)) return false;

        if (!q) return filterType !== "all"; // Se selecionou uma categoria específica, mostra os itens mesmo sem termo digitado

        const textMatch = m.content?.toLowerCase().includes(q);
        const nameMatch = m.sender_name?.toLowerCase().includes(q);
        const attachMatch = m.attachment_name?.toLowerCase().includes(q);
        return textMatch || nameMatch || attachMatch;
      })
      .reverse();
  }, [messages, searchTerm, filterType]);

  const handlePick = (id: string) => {
    onSelectMessage(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[80vh]">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Pesquisar mensagens no chat
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Busque por trechos de texto, nome de quem enviou ou nomes de anexos.
          </DialogDescription>
        </DialogHeader>

        {/* INPUT DE BUSCA E FILTROS */}
        <div className="p-3 border-b border-border/40 bg-secondary/20 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o termo para buscar..."
              className="pl-8 h-9 text-xs rounded-xl bg-background/80"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: "all", label: "Todas", icon: Filter },
              { id: "media", label: "Fotos & Vídeos", icon: Image },
              { id: "docs", label: "Arquivos", icon: FileText },
              { id: "audio", label: "Áudios", icon: Music },
              { id: "links", label: "Links", icon: Link2 },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = filterType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id as FilterType)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-80">
          {!searchTerm.trim() ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Digite uma palavra ou frase para pesquisar no histórico desta conversa.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhuma mensagem encontrada para &quot;{searchTerm}&quot;.
            </div>
          ) : (
            filtered.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => handlePick(msg.id)}
                className="w-full text-left p-2.5 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-all cursor-pointer group flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                    {msg.sender_name || "Membro"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {dateOnly(msg.created_at)} às {formatTimeOnly(msg.created_at)}
                  </span>
                </div>

                <p className="text-xs text-foreground/90 line-clamp-2">
                  {msg.content || (
                    <span className="italic text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {msg.attachment_name || "Anexo"}
                    </span>
                  )}
                </p>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
