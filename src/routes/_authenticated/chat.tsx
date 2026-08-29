import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Users, Plus, Shield, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
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

  const {
    conversations,
    isLoading,
    totalUnreadCount,
    refetch: refetchConversations,
  } = useConversations(activeConversation?.id);

  // Sync active conversation when conversations update
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id);
      if (updated) {
        setActiveConversation(updated);
      }
    }
  }, [conversations]);

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

  return (
    <div className="space-y-3 max-w-7xl mx-auto h-[calc(100dvh-5.5rem)] flex flex-col min-h-[500px]">
      {/* HEADER */}
      <div className="hidden sm:block shrink-0">
        <PageHeader
          title="Chat"
          description="Comunicação em tempo real, grupos, canais diretos e compartilhamento de arquivos."
        />
      </div>

      {/* MAIN CHAT CONTAINER (DESKTOP: SIDEBAR + CHAT WINDOW | MOBILE: FULLSCREEN FLUID) */}
      <Card className="flex-1 flex overflow-hidden border border-border/70 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl relative">
        {/* LEFT SIDEBAR: CONVERSATION LIST */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border/70 flex flex-col h-full bg-card shrink-0 ${
            activeConversation ? "hidden md:flex" : "flex"
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
          />
        </div>

        {/* RIGHT AREA: ACTIVE CHAT WINDOW OR EMPTY STATE */}
        <div
          className={`flex-1 flex flex-col h-full bg-card overflow-hidden ${
            !activeConversation ? "hidden md:flex" : "flex"
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
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-4 select-none relative overflow-hidden bg-radial from-primary/5 via-transparent to-transparent">
              <div className="relative">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl ring-8 ring-primary/5">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-card" />
                </span>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                  Central de Mensagens & Chat
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecione uma conversa na lista ao lado para interagir em tempo real, enviar imagens, áudios, anexos ou iniciar um novo grupo.
                </p>
              </div>

              {canCreateGroup && (
                <Button
                  type="button"
                  onClick={() => setCreateGroupOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-lg px-4 py-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Criar Novo Grupo
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* CREATE GROUP MODAL */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={(newGroup) => {
          setActiveConversation(newGroup);
          void refetchConversations();
        }}
      />
    </div>
  );
}
