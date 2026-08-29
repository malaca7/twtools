import type { Member, UserPresenceStatus } from "@/lib/app-types";

export type ConversationType = "private" | "group";
export type MessageStatus = "sending" | "sent" | "delivered" | "read";
export type ParticipantRole = "admin" | "member";

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  profile?: Member | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_nickname?: string | null;
  sender_game_id?: string | null;
  sender_avatar?: string | null;
  is_self?: boolean;
}

export interface ChatConversation {
  id: string;
  type: ConversationType;
  title: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string;
  last_message_sender_id: string | null;
  participants: ChatParticipant[];
  unread_count: number;
  other_participant?: Member | null;
}

export interface TypingUser {
  user_id: string;
  user_name: string;
  timestamp: number;
}

export interface CreateGroupPayload {
  title: string;
  avatar_url?: string | null;
  participant_ids: string[];
}
