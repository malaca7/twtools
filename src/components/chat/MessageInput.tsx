import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image as ImageIcon,
  FileText,
  Mic,
  Square,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { ChatMessage, ParticipantRole } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<any>;
  onSendAttachment: (file: File, caption?: string) => Promise<any>;
  onTyping: () => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  uploadProgress: number | null;
  isSending: boolean;
  disabled?: boolean;
  onlyAdminsCanPost?: boolean;
  userRole?: ParticipantRole;
}

const EMOJI_CATEGORIES = [
  { label: "Populares", emojis: ["👍", "❤️", "🔥", "😂", "😮", "👏", "🎉", "💀", "✌🏼", "👀", "🚀", "💯"] },
  { label: "Expressões", emojis: ["😀", "😎", "🤔", "🥳", "🥺", "🫡", "😈", "🤝", "💪", "👊", "🙌", "⭐"] },
  { label: "Símbolos", emojis: ["🔒", "🔑", "⚡", "✨", "🎯", "💰", "💵", "👑", "🛡️", "🚗", "🏍️", "🔫"] },
];

export function MessageInput({
  onSendMessage,
  onSendAttachment,
  onTyping,
  replyingTo,
  onCancelReply,
  uploadProgress,
  isSending,
  disabled,
  onlyAdminsCanPost = false,
  userRole = "member",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isBlockedByAdminOnly = onlyAdminsCanPost && userRole !== "admin";

  // Auto-focus input on mount or reply change
  useEffect(() => {
    if (!isBlockedByAdminOnly) {
      textareaRef.current?.focus();
    }
  }, [replyingTo, isBlockedByAdminOnly]);

  const handleSend = async () => {
    const text = content.trim();
    if (!text || isSending || isBlockedByAdminOnly) return;
    setContent("");
    try {
      await onSendMessage(text);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch {
      setContent(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping();

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void onSendAttachment(file);
    e.target.value = "";
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
        await onSendAttachment(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isBlockedByAdminOnly) {
    return (
      <div className="p-3 bg-secondary/30 border-t border-border/80">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold text-center">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Somente administradores podem enviar mensagens neste grupo.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 sm:p-3 bg-card/90 backdrop-blur-xl border-t border-border/80 space-y-2 shrink-0">
      {/* UPLOAD PROGRESS */}
      {uploadProgress !== null && (
        <div className="space-y-1 px-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary" /> Enviando anexo...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1 bg-secondary" />
        </div>
      )}

      {/* REPLY PREVIEW BAR */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/70 border border-primary/30 text-xs shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <div className="min-w-0">
              <span className="font-bold text-primary text-[11px] block">
                Respondendo a {replyingTo.sender_name}:
              </span>
              <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                {replyingTo.attachment_name ? `📎 ${replyingTo.attachment_name}` : replyingTo.content}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* INPUT CONTAINER */}
      <div className="flex items-end gap-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={handleFileSelected}
          className="hidden"
        />

        {isRecording ? (
          /* AUDIO RECORDING ACTIVE STATE */
          <div className="flex-1 flex items-center justify-between p-2 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold">Gravando áudio ({formatTimer(recordingSeconds)})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={stopRecording}
                className="h-7 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
              >
                <Square className="h-3 w-3 mr-1 fill-current" /> Enviar Áudio
              </Button>
            </div>
          </div>
        ) : (
          /* STANDARD INPUT BAR */
          <>
            {/* ATTACHMENT MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer transition-colors"
                  title="Anexar arquivo ou foto"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-48 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl">
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                  className="cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 mr-2 text-primary" /> Foto / Imagem
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip";
                      fileInputRef.current.click();
                    }
                  }}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2 text-emerald-400" /> Documento / Arquivo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* EMOJI POPOVER */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer transition-colors"
                  title="Emojis"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-72 p-3 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl space-y-2.5">
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                      {cat.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmoji(emoji)}
                          className="h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </PopoverContent>
            </Popover>

            {/* TEXTAREA WRAPPER */}
            <div className="flex-1 min-w-0 relative flex items-center rounded-2xl bg-secondary/40 border border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Escreva uma mensagem..."
                rows={1}
                disabled={disabled}
                className="w-full max-h-28 py-2.5 pl-3.5 pr-2 bg-transparent text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/60 resize-none outline-none scrollbar-none leading-relaxed"
              />
            </div>

            {/* VOICE MIC OR SEND BUTTON */}
            {content.trim() ? (
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={isSending}
                className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/20 shrink-0 cursor-pointer transition-transform active:scale-95"
                title="Enviar mensagem"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startRecording}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer transition-colors"
                title="Gravar mensagem de voz"
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
