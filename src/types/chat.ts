import type { Member, UserPresenceStatus } from "@/lib/app-types";

export type ConversationType = "private" | "group";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";
export type ParticipantRole = "admin" | "member";
export type MessageType = "text" | "image" | "video" | "audio" | "document" | "system";

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user_name?: string;
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  custom_nickname?: string | null;
  profile?: Member | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  message_type: MessageType;
  reply_to_id?: string | null;
  reply_to_message?: {
    id: string;
    sender_name: string;
    content: string;
    message_type: MessageType;
    attachment_name?: string | null;
  } | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  mentions?: string[];
  is_edited?: boolean;
  edited_at?: string | null;
  is_deleted_for_everyone?: boolean;
  deleted_for_users?: string[];
  reactions?: MessageReaction[];
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
  description?: string | null;
  avatar_url: string | null;
  created_by: string | null;
  only_admins_can_post?: boolean;
  is_archived?: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string;
  last_message_sender_id: string | null;
  participants: ChatParticipant[];
  unread_count: number;
  other_participant?: Member | null;
  my_role?: ParticipantRole;
}

export interface TypingUser {
  user_id: string;
  user_name: string;
  timestamp: number;
}

export interface CreateGroupPayload {
  title: string;
  description?: string;
  avatar_url?: string | null;
  only_admins_can_post?: boolean;
  participant_ids: string[];
}

export interface UpdateGroupPayload {
  conversation_id: string;
  title: string;
  description?: string;
  avatar_url?: string | null;
  only_admins_can_post?: boolean;
}

export interface UploadAttachmentResult {
  url: string;
  name: string;
  type: string;
  size: number;
}
