import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  Smile,
  X,
  Mic,
  Trash2,
  Play,
  Pause,
  StopCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { WhatsAppAttachmentMenu } from "./WhatsAppAttachmentMenu";
import type { ChatMessage, ParticipantRole, ChatParticipant } from "@/types/chat";
import type { Member } from "@/lib/app-types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatSound } from "@/lib/chatSound";
import { useMembers } from "@/hooks/useData";

interface MessageInputProps {
  conversationId?: string;
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
  participants?: ChatParticipant[];
  isGroup?: boolean;
  otherParticipant?: Member | null;
  currentUserId?: string;
  onOpenPollDialog?: () => void;
  onOpenEventDialog?: () => void;
}

const EMOJI_CATEGORIES = [
  { label: "Mais usados", emojis: ["👍", "❤️", "😂", "🔥", "😮", "👏", "🎉", "💀", "✌🏼", "👀", "🚀", "💯", "🙏", "🥹", "😍"] },
  { label: "Expressões", emojis: ["😀", "😎", "🤔", "🥳", "🥺", "🫡", "😈", "🤝", "💪", "👊", "🙌", "⭐", "🤡", "😴", "🤫"] },
  { label: "Símbolos & Roleplay", emojis: ["🔒", "🔑", "⚡", "✨", "🎯", "💰", "💵", "👑", "🛡️", "🚗", "🏍️", "🔫", "💼", "📦", "🚨"] },
];

export function MessageInput({
  conversationId,
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
  participants = [],
  isGroup = false,
  otherParticipant,
  currentUserId,
  onOpenPollDialog,
  onOpenEventDialog,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

  const { data: allMembers = [] } = useMembers();
  const allMembersMap = useMemo(() => {
    return new Map(allMembers.map((m) => [m.user_id, m]));
  }, [allMembers]);

  // States para menções (@)
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  // Estados de Gravação de Áudio
  const [isRecording, setIsRecording] = useState(false);
  const [isPausedPreview, setIsPausedPreview] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isBlockedByAdminOnly = onlyAdminsCanPost && userRole !== "admin";

  // Auto-focus input ao montar, trocar de conversa ou ao acionar resposta
  useEffect(() => {
    if (!isBlockedByAdminOnly) {
      const timer1 = setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 50);
      const timer2 = setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 150);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [conversationId, replyingTo, isBlockedByAdminOnly]);

  // Listener global para focar no campo de digitação sempre que alguma ação no chat for acionada (ex: responder)
  useEffect(() => {
    const handleFocusRequest = () => {
      if (!isBlockedByAdminOnly) {
        setTimeout(() => {
          textareaRef.current?.focus({ preventScroll: true });
        }, 50);
      }
    };
    window.addEventListener("tw_chat_focus_input", handleFocusRequest);
    return () => window.removeEventListener("tw_chat_focus_input", handleFocusRequest);
  }, [isBlockedByAdminOnly]);

  // Limpa áudio preview ao desmontar
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  const handleSend = async () => {
    const text = content.trim();
    if (!text || isSending || isBlockedByAdminOnly) return;
    
    // Força o desbloqueio do áudio na primeira interação do usuário (clique em Enviar)
    chatSound.forceResume();

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

  // ─── LÓGICA DE MENÇÕES (@) ───
  const availableMentions = useMemo(() => {
    const list: Array<{ id: string; name: string; subtitle?: string; avatar: string | null }> = [];

    if (!isGroup) {
      // ─── CHAT INDIVIDUAL (1:1) ───
      // 1. O outro membro deve ser sugerido PRIMEIRO
      const other =
        otherParticipant ||
        (participants.find((p) => p.user_id !== currentUserId)?.profile) ||
        (participants.find((p) => p.user_id !== currentUserId)
          ? allMembersMap.get(participants.find((p) => p.user_id !== currentUserId)!.user_id)
          : null);

      if (other) {
        const otherName = other.nickname || other.nome;
        list.push({
          id: other.user_id,
          name: otherName,
          subtitle: other.nickname ? other.nome : "Membro da conversa",
          avatar: other.avatar_url || other.discord_avatar_url || null,
        });
      }

      // Em chat individual, @todos NUNCA aparece!
      return list;
    }

    // ─── CHAT DE GRUPO ───
    // 1. @todos só aparece se for chat de grupo E usuário for admin/creator
    if (userRole === "admin" || (userRole as string) === "creator") {
      list.push({
        id: "todos",
        name: "todos",
        subtitle: "Mencionar todos do grupo",
        avatar: null,
      });
    }

    // 2. Apenas membros que pertencem a ESTE grupo
    participants.forEach((p) => {
      // Não sugerir a si mesmo como prioridade
      if (p.user_id === currentUserId) return;

      const memberData = p.profile || allMembersMap.get(p.user_id);
      const name = p.custom_nickname || memberData?.nickname || memberData?.nome;
      if (name) {
        list.push({
          id: p.user_id,
          name,
          subtitle: memberData?.nickname ? memberData.nome : undefined,
          avatar: memberData?.avatar_url || memberData?.discord_avatar_url || (p as any).discord_avatar_url || null,
        });
      }
    });

    return list;
  }, [isGroup, otherParticipant, participants, currentUserId, userRole, allMembersMap]);

  const filteredMentions = useMemo(() => {
    if (!showMentionPopup) return [];
    const q = mentionQuery.toLowerCase();
    return availableMentions.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(q))
    );
  }, [availableMentions, showMentionPopup, mentionQuery]);

  const insertMention = (name: string) => {
    if (!textareaRef.current) return;
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    
    if (match) {
      const startIdx = textBeforeCursor.lastIndexOf("@");
      const formattedMention = name === "todos" ? "todos" : name.replace(/\s+/g, "_");
      const newContent = content.slice(0, startIdx) + `@${formattedMention} ` + textAfterCursor;
      setContent(newContent);
      setShowMentionPopup(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = startIdx + formattedMention.length + 2;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopup && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentions[mentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        setShowMentionPopup(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onTyping();

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;

    // Lógica de menção
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      setShowMentionPopup(true);
      setMentionQuery(mentionMatch[1]);
      setMentionIndex(0);
    } else {
      setShowMentionPopup(false);
    }
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

  // ─── GRAVAÇÃO DE ÁUDIO ESTILO WHATSAPP ───
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

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPausedPreview(false);
      setRecordingSeconds(0);
      setRecordedAudioBlob(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Não foi possível acessar o microfone do seu navegador.");
    }
  };

  const pauseAndPreviewAudio = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(url);
        setIsPausedPreview(true);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch {}
    }
    setIsRecording(false);
    setIsPausedPreview(false);
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const sendRecordedAudio = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
          await onSendAttachment(audioFile);
          cancelRecording();
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    } else if (recordedAudioBlob) {
      const audioFile = new File([recordedAudioBlob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
      await onSendAttachment(audioFile);
      cancelRecording();
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      void previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isBlockedByAdminOnly) {
    return (
      <div className="p-3 bg-[#202c33] border-t border-white/5">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold text-center">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Somente administradores podem enviar mensagens neste grupo.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-2.5 bg-[#202c33] border-t border-white/5 space-y-2 shrink-0 select-none">
      {/* UPLOAD PROGRESS */}
      {uploadProgress !== null && (
        <div className="space-y-1 px-1">
          <div className="flex items-center justify-between text-[10px] text-[#8696a0] font-mono">
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-[#00a884]" /> Enviando anexo...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1 bg-[#111b21]" />
        </div>
      )}

      {/* REPLIED MESSAGE QUOTE PREVIEW BAR ESTILO WHATSAPP */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#111b21]/90 border-l-4 border-[#00a884] text-xs shadow-lg animate-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-[#00a884] text-xs block truncate">
              {replyingTo.sender_id === currentUserId ? "Você" : replyingTo.sender_name}
            </span>
            <p className="text-[11px] text-[#8696a0] truncate max-w-sm">
              {replyingTo.attachment_name ? `📎 ${replyingTo.attachment_name}` : replyingTo.content}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              onCancelReply();
              textareaRef.current?.focus();
            }}
            className="h-7 w-7 text-[#8696a0] hover:text-white rounded-full cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* INPUT BAR OU GRAVADOR DE VOZ */}
      <div className="flex items-center gap-1.5 sm:gap-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* ─── ESTADO 1: GRAVANDO ÁUDIO AO VIVO ─── */}
        {isRecording && (
          <div className="flex-1 flex items-center justify-between p-2 px-3 rounded-full bg-[#111b21] border border-white/10 text-white animate-in fade-in duration-150">
            {/* Indicador de gravação e ondas sonoras */}
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="text-xs font-mono font-bold text-[#e9edef]">{formatTimer(recordingSeconds)}</span>
              
              {/* Barras de onda simuladas */}
              <div className="flex items-center gap-0.5 h-4 ml-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    style={{ animationDelay: `${i * 0.12}s` }}
                    className="w-0.5 bg-[#00a884] rounded-full wa-wave-bar"
                  />
                ))}
              </div>
            </div>

            {/* Ações: Descartar / Pausar para ouvir / Enviar */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={cancelRecording}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                title="Descartar gravação"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={pauseAndPreviewAudio}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Ouvir antes de enviar"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── ESTADO 2: PRÉVIA DO ÁUDIO GRAVADO ─── */}
        {isPausedPreview && recordedAudioUrl && (
          <div className="flex-1 flex items-center justify-between p-2 px-3 rounded-full bg-[#111b21] border border-white/10 text-white animate-in fade-in duration-150">
            <audio
              ref={previewAudioRef}
              src={recordedAudioUrl}
              onEnded={() => setIsPlayingPreview(false)}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreviewPlay}
                className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center text-white cursor-pointer shadow-md"
                title={isPlayingPreview ? "Pausar prévia" : "Tocar prévia"}
              >
                {isPlayingPreview ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>
              <span className="text-xs font-mono text-[#8696a0]">
                Prévia ({formatTimer(recordingSeconds)})
              </span>
            </div>

            <button
              type="button"
              onClick={cancelRecording}
              className="h-8 w-8 rounded-full flex items-center justify-center text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
              title="Excluir áudio"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ─── ESTADO 3: BARRA DE DIGITAÇÃO PADRÃO WHATSAPP ─── */}
        {!isRecording && !isPausedPreview && (
          <>
            {/* EMOJI POPOVER */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#8696a0] hover:text-[#e9edef] hover:bg-white/10 rounded-full shrink-0 cursor-pointer transition-colors"
                  title="Emojis"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={12}
                className="w-72 p-3 bg-[#233138] border border-white/10 rounded-2xl shadow-2xl text-white space-y-2.5 backdrop-blur-xl"
              >
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {cat.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmoji(emoji)}
                          className="h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-xl hover:scale-125 transition-transform cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </PopoverContent>
            </Popover>

            {/* ATTACHMENT MENU BUTTON (+) */}
            <WhatsAppAttachmentMenu
              open={attachmentMenuOpen}
              onOpenChange={setAttachmentMenuOpen}
              onSelectPhotoVideo={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*,video/*";
                  fileInputRef.current.click();
                }
              }}
              onSelectDocument={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip";
                  fileInputRef.current.click();
                }
              }}
              onSelectAudio={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "audio/*";
                  fileInputRef.current.click();
                }
              }}
              onSelectPoll={onOpenPollDialog}
              onSelectEvent={onOpenEventDialog}
            />

            {/* TEXTAREA WRAPPER COM VISUAL WHATSAPP E MENU DE MENÇÕES */}
            <div className="flex-1 min-w-0 relative flex flex-col justify-end">
              {/* POPUP DE MENÇÕES (@) */}
              {showMentionPopup && filteredMentions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-72 max-h-56 overflow-y-auto bg-[#233138] border border-white/10 rounded-xl shadow-2xl z-50 p-1 divide-y divide-white/5 scrollbar-thin">
                  <div className="px-3 py-1.5 text-[10px] font-black text-[#8696a0] uppercase tracking-wider flex items-center justify-between">
                    <span>Mencionar no Chat</span>
                    <span className="text-[9px] font-normal lowercase">{filteredMentions.length} opção(ões)</span>
                  </div>
                  <div className="pt-1 space-y-0.5">
                    {filteredMentions.map((m, i) => {
                      const isSelected = i === mentionIndex;
                      return (
                        <div
                          key={m.id}
                          onClick={() => insertMention(m.name)}
                          onMouseEnter={() => setMentionIndex(i)}
                          className={cn(
                            "px-2.5 py-1.5 cursor-pointer flex items-center gap-2.5 text-xs transition-colors rounded-lg",
                            isSelected ? "bg-[#00a884]/20 text-[#00a884]" : "hover:bg-white/5 text-[#e9edef]"
                          )}
                        >
                          <Avatar className="h-7 w-7 shrink-0 border border-white/10">
                            {m.avatar && <AvatarImage src={m.avatar} />}
                            <AvatarFallback className={cn("text-[10px] font-bold", m.id === "todos" ? "bg-[#00a884] text-white" : "bg-[#111b21] text-[#00a884]")}>
                              {m.id === "todos" ? "@" : m.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className={cn("truncate text-xs", isSelected ? "font-bold text-[#00a884]" : "font-medium text-[#e9edef]")}>
                              {m.id === "todos" ? "@todos" : `@${m.name}`}
                            </p>
                            {m.subtitle && (
                              <p className="text-[10px] text-[#8696a0] truncate">{m.subtitle}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="relative flex items-center rounded-lg bg-[#2a3942] border border-transparent focus-within:border-white/10 transition-all">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem"
                  rows={1}
                  disabled={disabled}
                  className="w-full max-h-32 py-2 px-3.5 bg-transparent text-sm text-[#e9edef] placeholder:text-[#8696a0] resize-none outline-none scrollbar-none leading-relaxed"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── BOTÃO DIREITO: GRAVADOR / ENVIAR WHATSAPP ─── */}
        {isRecording || isPausedPreview ? (
          <Button
            type="button"
            size="icon"
            onClick={sendRecordedAudio}
            disabled={isSending}
            className="h-10 w-10 bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-full shadow-lg shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
            title="Enviar mensagem de voz"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
          </Button>
        ) : content.trim() ? (
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isSending}
            className="h-10 w-10 bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-full shadow-lg shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
            title="Enviar mensagem"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="h-10 w-10 text-[#8696a0] hover:text-[#e9edef] hover:bg-white/10 rounded-full shrink-0 cursor-pointer transition-colors flex items-center justify-center"
            title="Gravar mensagem de voz"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
