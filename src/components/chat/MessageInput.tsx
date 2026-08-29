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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    } catch (err) {
      console.warn("Could not access microphone", err);
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
      mediaRecorderRef.current.onstop = null; // Don't trigger send
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // BLOCK NOTICE IF ONLY ADMINS CAN POST
  if (isBlockedByAdminOnly) {
    return (
      <div className="p-3.5 border-t border-border/80 bg-secondary/40 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground select-none backdrop-blur-sm">
        <Lock className="h-4 w-4 text-amber-400 shrink-0" />
        <span>Somente administradores podem enviar mensagens neste grupo.</span>
      </div>
    );
  }

  return (
    <div className="border-t border-border/80 bg-card p-2 sm:p-2.5 space-y-2 shrink-0">
      {/* ADMIN PERMISSION NOTICE IF ONLY ADMINS POSTING ACTIVE */}
      {onlyAdminsCanPost && userRole === "admin" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Modo Somente Admins ativo: Você é administrador e pode enviar mensagens.</span>
        </div>
      )}

      {/* REPLY BANNER */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/70 border border-primary/40 text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-primary block leading-tight">
                Respondendo a {replyingTo.sender_name}
              </span>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                {replyingTo.content || replyingTo.attachment_name || "Anexo"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg shrink-0 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* UPLOAD PROGRESS BAR */}
      {uploadProgress !== null && (
        <div className="space-y-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>Enviando anexo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {/* RECORDING BANNER */}
      {isRecording ? (
        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs animate-pulse">
          <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Gravando áudio: {recordingSeconds}s</span>
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
              className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
            >
              <Square className="h-3 w-3 mr-1" /> Enviar Áudio
            </Button>
          </div>
        </div>
      ) : (
        /* MAIN INPUT ROW */
        <div className="flex items-end gap-1.5">
          {/* ATTACHMENT MENU */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelected}
            className="hidden"
            id="chat-file-uploader"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer"
            title="Anexar foto ou documento"
            disabled={disabled || uploadProgress !== null}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* EMOJI PICKER POPOVER */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl shrink-0 cursor-pointer"
                title="Inserir emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-3 z-50 rounded-2xl shadow-xl">
              <div className="space-y-2.5">
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                      {cat.emojis.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => handleAddEmoji(em)}
                          className="h-7 w-7 text-base flex items-center justify-center rounded-lg hover:bg-secondary transition-transform hover:scale-120 cursor-pointer"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* TEXTAREA */}
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Digite uma mensagem..."
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full text-xs py-2 px-3 bg-secondary/40 border border-border/80 rounded-xl resize-none max-h-28 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground leading-normal"
              disabled={disabled}
            />
          </div>

          {/* MIC OR SEND BUTTON */}
          {content.trim() ? (
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={isSending || !content.trim()}
              className="h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md shrink-0 cursor-pointer active:scale-95 transition-all"
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
              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl shrink-0 cursor-pointer"
              title="Gravar áudio"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
