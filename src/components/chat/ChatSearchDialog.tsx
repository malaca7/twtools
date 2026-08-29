import { useState, useMemo } from "react";
import { Search, FileText, Image as ImageIcon, Link as LinkIcon, MessageSquare, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatTimeOnly, dateTime } from "@/lib/format";
import type { ChatMessage } from "@/types/chat";

interface ChatSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  onSelectMessage: (messageId: string) => void;
}

export function ChatSearchDialog({
  open,
  onOpenChange,
  messages,
  onSelectMessage,
}: ChatSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "media" | "docs" | "links">("all");

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.is_deleted_for_everyone) return false;

      // Filter by type
      if (typeFilter === "media" && m.message_type !== "image" && m.message_type !== "video") {
        return false;
      }
      if (typeFilter === "docs" && m.message_type !== "document" && m.message_type !== "audio") {
        return false;
      }
      if (typeFilter === "links" && !m.content.includes("http")) {
        return false;
      }

      // Filter by query
      if (!query.trim()) return typeFilter !== "all";

      const q = query.toLowerCase();
      const matchContent = m.content.toLowerCase().includes(q);
      const matchAuthor = (m.sender_name || "").toLowerCase().includes(q);
      const matchAttachment = (m.attachment_name || "").toLowerCase().includes(q);

      return matchContent || matchAuthor || matchAttachment;
    });
  }, [messages, query, typeFilter]);

  const handleSelect = (msgId: string) => {
    onSelectMessage(msgId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-4 sm:p-5 bg-card text-card-foreground border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Search className="h-5 w-5 text-primary" />
            Buscar na Conversa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Encontre mensagens, mídias, links e documentos enviados no chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Digite o termo de busca..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-8 text-xs bg-secondary/40"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* FILTER CHIPS */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                typeFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("media")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                typeFilter === "media"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <ImageIcon className="h-3 w-3" /> Mídias
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("docs")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                typeFilter === "docs"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <FileText className="h-3 w-3" /> Documentos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("links")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                typeFilter === "links"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <LinkIcon className="h-3 w-3" /> Links
            </button>
          </div>

          {/* RESULTS LIST */}
          <div className="flex-1 overflow-y-auto max-h-72 space-y-1.5 rounded-xl border border-border/80 p-1.5">
            {filteredMessages.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Nenhum resultado encontrado</p>
                <p className="text-[11px]">Tente outros termos ou remova os filtros.</p>
              </div>
            ) : (
              filteredMessages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className="p-2.5 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/60 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-bold text-primary">{m.sender_name || "Membro"}</span>
                    <span>{dateTime(m.created_at)}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium line-clamp-2">
                    {m.attachment_name ? `📎 [${m.attachment_name}] ${m.content}` : m.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
