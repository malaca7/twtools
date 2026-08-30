import type { Member, UserPresenceStatus } from "@/lib/app-types";

export type ConversationType = "private" | "group";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";
export type ParticipantRole = "admin" | "member";
export type MessageType = "text" | "image" | "video" | "audio" | "document" | "system";

export interface EventResponses {
  vou: string[]; // user_ids
  nao_vou: string[]; // user_ids
  talvez: string[]; // user_ids
}

export interface EventData {
  title: string;
  description?: string | null;
  event_date: string; // ISO string
  location?: string | null;
  responses: EventResponses;
  created_by: string;
  created_by_name: string;
  is_cancelled?: boolean;
}

export interface ChatUserFolder {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  conversation_ids: string[];
  position: number;
  created_at: string;
}

export interface ChatModerationLog {
  id: string;
  conversation_id: string;
  actor_id: string;
  actor_name?: string;
  target_user_id?: string | null;
  target_user_name?: string | null;
  action: string;
  reason?: string | null;
  metadata?: any;
  created_at: string;
}

export interface ChatReport {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  conversation_id: string;
  message_id?: string | null;
  message_content?: string | null;
  reported_user_id: string;
  reported_user_name?: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user_ids
}

export interface PollData {
  question: string;
  options: PollOption[];
  is_multiple_choice: boolean;
  is_closed?: boolean;
  expires_at?: string | null;
  created_by: string;
  created_by_name: string;
}

export interface SavedMessage {
  id: string;
  message_id: string;
  conversation_id: string;
  saved_at: string;
  content: string;
  message_type: MessageType;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  conversation_title: string;
  conversation_type: ConversationType;
}

export interface ChatReminder {
  id: string;
  message_id: string;
  conversation_id: string;
  remind_at: string;
  note?: string | null;
  is_completed: boolean;
  created_at: string;
  message_content: string;
  sender_name: string;
  conversation_title: string;
}

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
  muted_until?: string | null;
  custom_nickname?: string | null;
  profile?: Member | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  message_type: MessageType | "poll" | "event";
  reply_to_id?: string | null;
  reply_to_message?: {
    id: string;
    sender_name: string;
    content: string;
    message_type: MessageType | "poll" | "event";
    attachment_name?: string | null;
  } | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  mentions?: string[];
  is_edited?: boolean;
  edited_at?: string | null;
  is_deleted?: boolean;
  is_deleted_for_everyone?: boolean;
  is_forwarded?: boolean;
  forwarded_from_name?: string | null;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  poll_data?: PollData | null;
  event_data?: EventData | null;
  thread_parent_id?: string | null;
  thread_reply_count?: number;
  expires_at?: string | null;
  is_saved?: boolean;
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
  is_pinned?: boolean;
  is_muted?: boolean;
  muted_until?: string | null;
  ephemeral_ttl_hours?: number;
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
