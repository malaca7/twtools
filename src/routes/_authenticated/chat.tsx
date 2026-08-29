import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Users, Plus, Volume2, VolumeX, Shield, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";
import { getOrCreatePrivateConversation } from "@/services/chatService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";
import type { ChatConversation } from "@/types/chat";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  const { user } = useAuth();
  const currentUserId = user?.id;

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
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col min-h-[550px]">
      <div className="hidden sm:block shrink-0">
        <PageHeader
          title="Chat da Facção & Comunicações"
          description="Mensagens em tempo real, grupos táticos, arquivos e canais de comando."
        />
      </div>

      {/* MAIN CHAT CONTAINER (DESKTOP: SIDEBAR + CHAT WINDOW | MOBILE: FULLSCREEN FLUID) */}
      <Card className="flex-1 flex overflow-hidden border border-border/80 bg-card shadow-xl rounded-2xl relative">
        {/* LEFT SIDEBAR: CONVERSATION LIST */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border/80 flex flex-col h-full bg-card shrink-0 ${
            activeConversation ? "hidden md:flex" : "flex"
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={(conv) => setActiveConversation(conv)}
            onCreateGroup={() => setCreateGroupOpen(true)}
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
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-3 select-none">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Suas Mensagens em Tempo Real</h3>
                <p className="text-xs max-w-sm">
                  Selecione uma conversa ao lado ou inicie um novo grupo com os membros da facção.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setCreateGroupOpen(true)}
                className="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Criar Novo Grupo
              </Button>
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
