export type PatchNoteCategory =
  | "feature"
  | "improvement"
  | "bugfix"
  | "security"
  | "maintenance"
  | "general";

export interface PatchNoteImage {
  id: string;
  url: string;
  name: string;
  size?: number;
  caption?: string;
}

export interface DevPatchNote {
  id: string;
  version: string;
  title: string;
  category: PatchNoteCategory;
  description: string;
  changes: string[];
  images: PatchNoteImage[];
  author_id: string;
  author_name: string;
  author_avatar?: string | null;
  created_at: string;
  updated_at?: string;
  is_published: boolean;
  pinned?: boolean;
}

export interface CreatePatchNotePayload {
  version: string;
  title: string;
  category: PatchNoteCategory;
  description: string;
  changes: string[];
  images: PatchNoteImage[];
  is_published?: boolean;
  pinned?: boolean;
}

export interface UpdatePatchNotePayload extends Partial<CreatePatchNotePayload> {
  id: string;
}
