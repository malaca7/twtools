import { supabase } from "@/integrations/supabase/client";
import { assertDeveloperAccess } from "@/services/devService";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import type { DevPatchNote, CreatePatchNotePayload, UpdatePatchNotePayload } from "@/types/patchNotes";

const STORAGE_KEY = "tw_dev_patch_notes_v1";
const PERMISSION_LEVEL = "system_patch_notes";

export const INITIAL_PATCH_NOTES: DevPatchNote[] = [
  {
    id: "patch-v2-4-0",
    version: "v2.4.0",
    title: "Chat em Tempo Real, Citação WhatsApp & Notificações",
    category: "feature",
    description:
      "Reformulação integral do sistema de chat corporativo da facção. Introdução de entrega via WebSocket de latência ultrabaixa (15ms), citação de respostas idêntica ao WhatsApp, e controle visual de mensagens não lidas no balão de chat.",
    changes: [
      "Foco automático instantâneo no campo de digitação ao ingressar em conversas ou acionar ações de resposta.",
      "Card de citação de resposta visualmente idêntico ao WhatsApp com borda de acento colorido, ícones de anexo, miniatura de foto e rolagem suave.",
      "Destaque visual de alta densidade para chats não lidos com borda esmeralda, indicador pulsante e ação rápida 'Ler todas'.",
      "WebSocket Realtime Broadcast direto eliminando qualquer delay no envio e recebimento de mensagens.",
      "Filtro de privacidade impedindo que notificações sejam emitidas para usuários que não façam parte da conversa.",
    ],
    images: [],
    author_id: "dev-team",
    author_name: "Equipe de Engenharia TW",
    author_avatar: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    is_published: true,
    pinned: true,
  },
  {
    id: "patch-v2-3-0",
    version: "v2.3.0",
    title: "Central de Licenças & Validação de Comprovantes",
    category: "feature",
    description:
      "Aprimoramento dos fluxos administrativos de gestão de membros e prestação de contas das metas operacionais da facção.",
    changes: [
      "Painel de controle de ausências e licenças com cálculo dinâmico de período e justificativas.",
      "Edição e reversão de status de validação de comprovantes com histórico de ações.",
      "Indicadores de presença em tempo real e tempo de serviço online no GTA RP.",
    ],
    images: [],
    author_id: "dev-team",
    author_name: "Equipe de Engenharia TW",
    author_avatar: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    is_published: true,
    pinned: false,
  },
  {
    id: "patch-v2-2-0",
    version: "v2.2.0",
    title: "Módulo Dev, Auditoria e Segurança Granular",
    category: "security",
    description:
      "Implementação de guardas de segurança backend para a Tag Desenvolvedor e matriz de permissões dedicadas.",
    changes: [
      "DeveloperGuard protegendo páginas restritas de engenharia contra acessos indevidos.",
      "Inspeção de desempenho de membros em tempo real com exportação de métricas.",
      "Logs de auditoria imutáveis com rastreamento de transações financeiras e estoque.",
    ],
    images: [],
    author_id: "dev-team",
    author_name: "Equipe de Engenharia TW",
    author_avatar: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    is_published: true,
    pinned: false,
  },
];

/**
 * Dispara evento global quando os patch notes são atualizados.
 */
export function emitPatchNotesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_patch_notes_changed"));
  }
}

/**
 * Busca todas as atualizações de desenvolvimento cadastradas.
 */
export async function fetchPatchNotes(): Promise<DevPatchNote[]> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", PERMISSION_LEVEL)
      .maybeSingle();

    if (data && data.permissions && Array.isArray((data.permissions as any)?.notes)) {
      const notes = (data.permissions as any).notes as DevPatchNote[];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      }
      return notes;
    }
  } catch (err) {
    console.warn("Falha ao buscar patch notes do Supabase, utilizando cache local:", err);
  }

  // Fallback para cache local ou seed inicial
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }

  return INITIAL_PATCH_NOTES;
}

/**
 * Salva a lista consolidada de patch notes no banco de dados e cache local.
 */
async function persistPatchNotes(notes: DevPatchNote[]): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
  emitPatchNotesChanged();

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: PERMISSION_LEVEL,
        nivel: PERMISSION_LEVEL,
        permissions: { notes } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.error("Erro ao persistir patch notes no Supabase:", err);
  }
}

/**
 * Cria uma nova atualização de desenvolvimento (exclusivo para desenvolvedores).
 */
export async function createPatchNote(
  payload: CreatePatchNotePayload,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<DevPatchNote> {
  assertDeveloperAccess(user, profile, level);

  const existing = await fetchPatchNotes();
  const now = new Date().toISOString();

  const newNote: DevPatchNote = {
    id: `patch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    version: payload.version.trim(),
    title: payload.title.trim(),
    category: payload.category,
    description: payload.description.trim(),
    changes: (payload.changes || []).map((c) => c.trim()).filter(Boolean),
    images: payload.images || [],
    author_id: user?.id || "dev",
    author_name: profile?.nickname || profile?.nome || "Desenvolvedor",
    author_avatar: profile?.avatar_url || profile?.discord_avatar_url || null,
    created_at: now,
    updated_at: now,
    is_published: payload.is_published ?? true,
    pinned: payload.pinned ?? false,
  };

  const updatedList = [newNote, ...existing];
  await persistPatchNotes(updatedList);

  // Registra auditoria
  try {
    await supabase.from("audit_logs" as any).insert({
      user_id: user?.id,
      acao: "PUBLICAR_PATCH_NOTE",
      detalhes: `Patch note versão ${newNote.version} (${newNote.title}) publicada por ${newNote.author_name}`,
      created_at: now,
    });
  } catch {}

  return newNote;
}

/**
 * Atualiza uma nota de desenvolvimento existente (exclusivo para desenvolvedores).
 */
export async function updatePatchNote(
  payload: UpdatePatchNotePayload,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<DevPatchNote> {
  assertDeveloperAccess(user, profile, level);

  const existing = await fetchPatchNotes();
  const index = existing.findIndex((n) => n.id === payload.id);
  if (index === -1 || !existing[index]) throw new Error("Atualização de desenvolvimento não encontrada.");

  const current = existing[index]!;
  const now = new Date().toISOString();

  const updatedNote: DevPatchNote = {
    ...current,
    id: current.id,
    version: payload.version !== undefined ? payload.version.trim() : current.version,
    title: payload.title !== undefined ? payload.title.trim() : current.title,
    category: payload.category !== undefined ? payload.category : current.category,
    description: payload.description !== undefined ? payload.description.trim() : current.description,
    changes: payload.changes !== undefined ? payload.changes.map((c) => c.trim()).filter(Boolean) : current.changes,
    images: payload.images !== undefined ? payload.images : current.images,
    is_published: payload.is_published !== undefined ? payload.is_published : current.is_published,
    pinned: payload.pinned !== undefined ? payload.pinned : current.pinned,
    updated_at: now,
  };

  const updatedList = [...existing];
  updatedList[index] = updatedNote;
  await persistPatchNotes(updatedList);

  return updatedNote;
}

/**
 * Exclui uma nota de desenvolvimento (exclusivo para desenvolvedores).
 */
export async function deletePatchNote(
  id: string,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  const existing = await fetchPatchNotes();
  const filtered = existing.filter((n) => n.id !== id);
  await persistPatchNotes(filtered);
}

/**
 * Faz upload de imagem para anexar aos patch notes.
 */
export async function uploadPatchNoteImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; name: string; size: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas arquivos de imagem são permitidos (PNG, JPG, WEBP, GIF).");
  }

  const ext = file.name.split(".").pop() || "png";
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `patch-notes/${Date.now()}_${cleanName}`;

  onProgress?.(25);

  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .upload(fileName, file, {
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    // Tenta bucket alternativo 'products' se houver restrição
    const { data: fallbackData, error: fallbackError } = await supabase.storage
      .from("products")
      .upload(fileName, file, {
        cacheControl: "31536000",
        upsert: true,
      });

    if (fallbackError) throw fallbackError;
    const { data: pubUrl } = supabase.storage.from("products").getPublicUrl(fallbackData.path);
    onProgress?.(100);
    return { url: pubUrl.publicUrl, name: file.name, size: file.size };
  }

  onProgress?.(100);
  const { data: pubUrl } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);
  return { url: pubUrl.publicUrl, name: file.name, size: file.size };
}
