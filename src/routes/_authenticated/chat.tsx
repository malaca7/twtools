import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare,
  Users,
  Plus,
  Shield,
  Sparkles,
  MessageCircle,
  Radio,
  Lock,
  Smartphone,
  Laptop,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useData";
import { useConversations } from "@/hooks/useChat";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";
import { getOrCreatePrivateConversation } from "@/services/chatService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { can, type AppLevel } from "@/lib/permissions";
import { toast } from "sonner";
import type { ChatConversation } from "@/types/chat";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  const { user, profile } = useAuth();
  const currentUserId = user?.id;
  const currentLevel = (profile?.nivel || "novato") as AppLevel;
  const { data: customPermissions } = useRolePermissions();

  const canViewChat = can(currentLevel, "view_chat", customPermissions);
  const canCreateGroup = can(currentLevel, "create_chat_group", customPermissions);

  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Modo de visualização: "split" (lado a lado) ou "focus" (tela inteira)
  const [viewMode, setViewMode] = useState<"split" | "focus">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tw_chat_view_mode") as "split" | "focus") || "split";
    }
    return "split";
  });

  const handleToggleViewMode = (mode: "split" | "focus") => {
    setViewMode(mode);
    try {
      localStorage.setItem("tw_chat_view_mode", mode);
    } catch {}
    toast.success(
      mode === "split"
        ? "Modo Dividido ativado (conversas e chat lado a lado)."
        : "Modo Foco ativado (chat em tela cheia com opção de voltar)."
    );
  };

  const {
    conversations,
    isLoading,
    totalUnreadCount,
    refetch: refetchConversations,
  } = useConversations(activeConversation?.id);

  // Sincroniza conversa ativa quando conversations atualizar
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id);
      if (updated) {
        setActiveConversation(updated);
      }
    }
  }, [conversations]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeConversation?.id]);

  if (!canViewChat) {
    return (
      <NoAccess
        title="Acesso Restrito ao Chat"
        description="Seu cargo atual não possui permissão para acessar o módulo de Chat e Mensagens."
      />
    );
  }

  const handleStartPrivateChat = async (targetUserId: string) => {
    if (!currentUserId) return;
    try {
      const conv = await getOrCreatePrivateConversation(currentUserId, targetUserId);
      setActiveConversation(conv);
      void refetchConversations();
    } catch (err: any) {
      toast.error(`Erro ao abrir conversa: ${err.message || err}`);
    }
  };

  const isSplitMode = viewMode === "split";

  return (
    <div className="space-y-2 max-w-7xl mx-auto h-[calc(100dvh-5.5rem)] flex flex-col min-h-[500px]">
      {/* ─── WHATSAPP MAIN CONTAINER ─── */}
      <Card className="flex-1 flex overflow-hidden border border-white/10 bg-[#111b21] shadow-2xl rounded-2xl relative">
        {/* LEFT SIDEBAR: CONVERSATION LIST */}
        <div
          className={`border-r border-white/5 flex flex-col h-full bg-[#111b21] shrink-0 transition-all ${
            isSplitMode
              ? activeConversation
                ? "hidden md:flex md:w-80 lg:w-[24rem]"
                : "w-full md:w-80 lg:w-[24rem] flex"
              : activeConversation
              ? "hidden"
              : "w-full flex"
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={(conv) => setActiveConversation(conv)}
            onCreateGroup={() => {
              if (!canCreateGroup) {
                toast.error("Seu cargo não possui permissão para criar novos grupos.");
                return;
              }
              setCreateGroupOpen(true);
            }}
            isLoading={isLoading}
            viewMode={viewMode}
            onToggleViewMode={handleToggleViewMode}
          />
        </div>

        {/* RIGHT AREA: ACTIVE CHAT WINDOW OU EMPTY STATE WHATSAPP */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#0b141a] overflow-hidden relative ${
            isSplitMode
              ? !activeConversation
                ? "hidden md:flex"
                : "flex"
              : !activeConversation
              ? "hidden"
              : "w-full flex"
          }`}
        >
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={() => {
                setActiveConversation(null);
                void refetchConversations();
              }}
              onConversationUpdated={() => {
                void refetchConversations();
              }}
              onStartPrivateChat={handleStartPrivateChat}
              onSelectConversation={(conv) => {
                setActiveConversation(conv);
                void refetchConversations();
              }}
              viewMode={viewMode}
              onToggleViewMode={handleToggleViewMode}
            />
          ) : (
            /* WHATSAPP WEB EMPTY STATE */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#8696a0] space-y-6 select-none relative overflow-hidden bg-[#222e35]/30">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-[#202c33] border border-white/5 flex items-center justify-center text-[#00a884] shadow-2xl">
                  <MessageSquare className="h-14 w-14" />
                </div>
              </div>

              <div className="space-y-2 max-w-md z-10">
                <h3 className="text-2xl font-light text-[#e9edef] tracking-tight">
                  Twin Wheels Web
                </h3>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Envie e receba mensagens em tempo real com membros da organização. Suporta fotos, áudios de voz, documentos e enquetes.
                </p>
              </div>

              {canCreateGroup && (
                <div className="flex items-center gap-2 z-10 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCreateGroupOpen(true)}
                    className="h-9 px-4 text-xs font-bold bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Criar Novo Grupo
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-[#8696a0] font-sans z-10 pt-8 mt-auto border-t border-white/5">
                <Lock className="h-3.5 w-3.5 text-[#8696a0]" />
                <span>Mensagens protegidas e sincronizadas em tempo real</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* MODAL DE CRIAÇÃO DE GRUPO */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={(newConv) => {
          setActiveConversation(newConv);
          void refetchConversations();
        }}
      />
    </div>
  );
}
