import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Users, Plus, Shield, Sparkles, MessageCircle, ArrowRight, Radio } from "lucide-react";
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
    <div className="space-y-2.5 max-w-7xl mx-auto h-[calc(100dvh-5.5rem)] flex flex-col min-h-[500px]">
      {/* MAIN CHAT CONTAINER (DESKTOP: SIDEBAR + CHAT WINDOW | MOBILE: FULLSCREEN FLUID) */}
      <Card className="flex-1 flex overflow-hidden border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl relative ring-1 ring-white/5">
        {/* LEFT SIDEBAR: CONVERSATION LIST */}
        <div
          className={`w-full md:w-80 lg:w-[22rem] border-r border-border/80 flex flex-col h-full bg-card/90 backdrop-blur-md shrink-0 transition-all ${
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

        {/* RIGHT AREA: ACTIVE CHAT WINDOW OR LUXURY EMPTY STATE */}
        <div
          className={`flex-1 flex flex-col h-full bg-card/60 overflow-hidden relative ${
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
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-5 select-none relative overflow-hidden bg-gradient-to-b from-primary/5 via-card/50 to-background/80">
              {/* Glowing decorative background aura */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary shadow-2xl ring-8 ring-primary/5 backdrop-blur-md">
                  <MessageSquare className="h-12 w-12 drop-shadow-md" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-card shadow-sm" />
                </span>
              </div>

              <div className="space-y-2 max-w-md z-10">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                    Central de Comunicação & Chat
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Converse em tempo real com membros e canais da organização. Envie imagens, documentos, áudios e interaja instantaneamente.
                </p>
              </div>

              <div className="flex items-center gap-2 z-10 pt-1">
                {canCreateGroup && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCreateGroupOpen(true)}
                    className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Criar Novo Grupo
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70 font-mono z-10 pt-4 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Criptografia ativa
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Radio className="h-3 w-3 text-primary animate-pulse inline-block" /> Realtime 0ms
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* CREATE GROUP MODAL */}
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
