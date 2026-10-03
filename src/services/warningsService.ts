import { supabase } from "@/integrations/supabase/client";
import { logAuditAction } from "@/lib/app-api";
import { createNotification, broadcastNotificationsRealtimeUpdate } from "@/lib/notifications-api";
import { assignMemberTag, removeMemberTagAssignment } from "@/services/memberTagsService";
import type {
  MemberWarning,
  CreateWarningPayload,
  UpdateWarningPayload,
} from "@/types/warnings";

const WARNINGS_STORAGE_KEY = "tw_member_warnings_v1";
const WARNINGS_DB_LEVEL = "system_member_warnings";
export const WARNINGS_REALTIME_EVENT = "tw_warnings_updated";

let warningsRealtimeChannel: any = null;

/**
 * Inicializa canal Realtime para sincronização de advertências e suspensões
 */
export function getWarningsRealtimeChannel() {
  if (!warningsRealtimeChannel) {
    warningsRealtimeChannel = supabase.channel("tw_warnings_realtime_sync", {
      config: { broadcast: { self: true } },
    });

    warningsRealtimeChannel.on(
      "broadcast",
      { event: "warnings_broadcast" },
      (payload: any) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(WARNINGS_REALTIME_EVENT, { detail: payload?.payload })
          );
        }
      }
    );

    warningsRealtimeChannel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "role_permissions",
      },
      (payload: any) => {
        const row = payload.new || payload.old;
        if (row?.level === WARNINGS_DB_LEVEL) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(WARNINGS_REALTIME_EVENT));
          }
        }
      }
    );

    warningsRealtimeChannel.subscribe();
  }
  return warningsRealtimeChannel;
}

export function broadcastWarningsRealtimeUpdate(payload?: any): void {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(WARNINGS_REALTIME_EVENT, { detail: payload }));
      try {
        localStorage.setItem("tw_warnings_sync_ping", String(Date.now()));
      } catch {}

      try {
        const bc = new BroadcastChannel("tw_warnings_channel");
        bc.postMessage({ type: "warnings_sync", payload, timestamp: Date.now() });
        setTimeout(() => {
          try {
            bc.close();
          } catch {}
        }, 1000);
      } catch {}
    }

    const ch = getWarningsRealtimeChannel();
    const sendMsg = () => {
      void ch.send({
        type: "broadcast",
        event: "warnings_broadcast",
        payload: payload || { timestamp: Date.now() },
      });
    };

    if (ch.state === "joined") {
      sendMsg();
    } else {
      ch.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          sendMsg();
        }
      });
    }
  } catch (err) {
    console.warn("Erro ao emitir broadcast de advertências:", err);
  }
}

function getLocalWarnings(): MemberWarning[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(WARNINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalWarnings(warnings: MemberWarning[], emitEvent: boolean = true): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(WARNINGS_STORAGE_KEY, JSON.stringify(warnings));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent(WARNINGS_REALTIME_EVENT));
      }
    }
  } catch {}
}

/**
 * Normaliza e atualiza status de advertências/suspensões expiradas pelo tempo
 */
function normalizeWarningsStatus(warnings: MemberWarning[]): { list: MemberWarning[]; hasChanges: boolean } {
  const now = new Date().toISOString();
  let hasChanges = false;

  const normalized = warnings.map((w) => {
    // Se está ativo, tem data de término e a data já passou, expira automaticamente
    if (w.status === "ativo" && w.ends_at && w.ends_at <= now) {
      hasChanges = true;
      if (w.applied_tag_id && w.member_id) {
        void removeMemberTagAssignment(w.member_id, w.applied_tag_id);
      }
      return {
        ...w,
        status: "expirado" as const,
        updated_at: now,
      };
    }
    return w;
  });

  return { list: normalized, hasChanges };
}

/**
 * Busca todas as advertências cadastradas (do banco com cache local)
 */
export async function getWarnings(): Promise<MemberWarning[]> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", WARNINGS_DB_LEVEL)
      .maybeSingle();

    if (!error && data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.warnings)) {
        const { list, hasChanges } = normalizeWarningsStatus(parsed.warnings as MemberWarning[]);
        setLocalWarnings(list, false);
        if (hasChanges) {
          void persistWarnings(list);
        }
        return list;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar advertências do banco:", err);
  }

  const local = getLocalWarnings();
  const { list } = normalizeWarningsStatus(local);
  return list;
}

/**
 * Persiste a lista completa de advertências no banco de dados
 */
export async function persistWarnings(warnings: MemberWarning[]): Promise<void> {
  setLocalWarnings(warnings, false);

  try {
    const { error: rpcError } = await supabase.rpc("save_role_permissions", {
      _level: WARNINGS_DB_LEVEL,
      _permissions: { warnings } as any,
    });
    if (!rpcError) return;
  } catch {}

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: WARNINGS_DB_LEVEL,
        nivel: WARNINGS_DB_LEVEL,
        permissions: { warnings } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn("Erro ao persistir advertências no banco:", err);
  }
}

/**
 * Cria uma nova advertência ou suspensão
 */
export async function createWarning(
  payload: CreateWarningPayload,
  adminUser?: { id: string; name: string; nickname?: string | null; avatar?: string | null }
): Promise<MemberWarning> {
  const all = await getWarnings();
  const now = new Date().toISOString();

  // Calcular data de expiração se houver duração configurada (dias ou horas)
  let endsAt = payload.ends_at || null;
  const hasDurationDays = payload.duration_days && payload.duration_days > 0;
  const hasDurationHours = payload.duration_hours && payload.duration_hours > 0;

  if (payload.is_suspension && payload.suspension_type === "permanente") {
    endsAt = null;
  } else if (hasDurationDays || hasDurationHours) {
    const d = new Date(payload.starts_at || now);
    if (hasDurationDays) {
      d.setDate(d.getDate() + Number(payload.duration_days));
    }
    if (hasDurationHours) {
      d.setHours(d.getHours() + Number(payload.duration_hours));
    }
    endsAt = d.toISOString();
  }

  const newWarning: MemberWarning = {
    ...payload,
    id: `warn-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    starts_at: payload.starts_at || now,
    ends_at: endsAt,
    status: payload.status || "ativo",
    created_at: now,
    updated_at: now,
  };

  const updatedList = [newWarning, ...all];
  await persistWarnings(updatedList);

  // Integração com Tags: Se foi selecionada uma tag para aplicação automática (ex: "bloqueado", "suspenso", etc.)
  if (payload.applied_tag_id && payload.member_id) {
    try {
      await assignMemberTag(payload.member_id, payload.applied_tag_id, adminUser?.id);
    } catch (tagErr) {
      console.warn("Aviso ao vincular tag de punição:", tagErr);
    }
  }

  // Notificação para o membro advertido ou suspenso
  try {
    const isSusp = newWarning.type === "suspensao";
    const title = isSusp
      ? `🚫 Sua conta foi suspensa (${newWarning.severity.toUpperCase()})`
      : `⚠️ Você recebeu uma Advertência Disciplinar (${newWarning.severity.toUpperCase()})`;

    const durationInfo = newWarning.ends_at
      ? `Válida até ${new Date(newWarning.ends_at).toLocaleString("pt-BR")}`
      : (isSusp && newWarning.suspension_type === "permanente" ? "Duração: Permanente" : "");

    await createNotification({
      user_id: newWarning.member_id,
      title,
      message: `Motivo: ${newWarning.reason}. ${durationInfo ? `(${durationInfo})` : ""}\n${newWarning.description}`,
      type: "system",
      link: "/perfil",
    });
    broadcastNotificationsRealtimeUpdate();
  } catch (notifErr) {
    console.warn("Erro ao emitir notificação de advertência:", notifErr);
  }

  // Registro de Auditoria
  try {
    await logAuditAction("create_warning", "warnings", {
      warning_id: newWarning.id,
      member_id: newWarning.member_id,
      member_name: newWarning.member_name,
      admin_id: newWarning.admin_id,
      type: newWarning.type,
      severity: newWarning.severity,
      reason: newWarning.reason,
      is_suspension: newWarning.is_suspension,
      ends_at: newWarning.ends_at,
      applied_tag_id: newWarning.applied_tag_id,
      blocks: newWarning.blocks,
    });
  } catch {}

  broadcastWarningsRealtimeUpdate({ action: "create", warning: newWarning });
  return newWarning;
}

/**
 * Atualiza dados de uma advertência existente
 */
export async function updateWarning(
  id: string,
  payload: UpdateWarningPayload,
  adminUser?: { id: string; name: string }
): Promise<MemberWarning> {
  const all = await getWarnings();
  const index = all.findIndex((w) => w.id === id);
  if (index === -1 || !all[index]) {
    throw new Error("Advertência não encontrada.");
  }

  const current = all[index]!;
  const now = new Date().toISOString();

  let endsAt = payload.ends_at !== undefined ? payload.ends_at : current.ends_at;
  const isSusp = payload.is_suspension !== undefined ? payload.is_suspension : current.is_suspension;
  const suspType = payload.suspension_type !== undefined ? payload.suspension_type : current.suspension_type;

  if (isSusp && suspType === "permanente") {
    endsAt = null;
  } else if ((payload.duration_days && payload.duration_days > 0) || (payload.duration_hours && payload.duration_hours > 0)) {
    const d = new Date(payload.starts_at || current.starts_at || now);
    if (payload.duration_days && payload.duration_days > 0) {
      d.setDate(d.getDate() + Number(payload.duration_days));
    }
    if (payload.duration_hours && payload.duration_hours > 0) {
      d.setHours(d.getHours() + Number(payload.duration_hours));
    }
    endsAt = d.toISOString();
  }

  // Sincronização de Tags se houver alteração
  if (payload.applied_tag_id !== undefined && payload.applied_tag_id !== current.applied_tag_id) {
    if (current.applied_tag_id && current.member_id) {
      try {
        await removeMemberTagAssignment(current.member_id, current.applied_tag_id);
      } catch (err) {
        console.warn("Aviso ao remover tag de punição antiga:", err);
      }
    }
    if (payload.applied_tag_id && (payload.member_id || current.member_id)) {
      try {
        await assignMemberTag(payload.member_id || current.member_id, payload.applied_tag_id, adminUser?.id);
      } catch (err) {
        console.warn("Aviso ao atribuir nova tag de punição:", err);
      }
    }
  }

  const updated: MemberWarning = {
    ...current,
    ...payload,
    ends_at: endsAt,
    updated_at: now,
  } as MemberWarning;

  all[index] = updated;
  await persistWarnings(all);

  try {
    await logAuditAction("update_warning", "warnings", {
      warning_id: id,
      member_id: updated.member_id,
      admin_id: adminUser?.id,
      changes: payload,
    });
  } catch {}

  broadcastWarningsRealtimeUpdate({ action: "update", warning: updated });
  return updated;
}

/**
 * Revoga / Cancela manualmente uma advertência ou suspensão ativa
 */
export async function revokeWarning(
  id: string,
  revocationReason: string,
  adminUser?: { id: string; name: string }
): Promise<MemberWarning> {
  const all = await getWarnings();
  const index = all.findIndex((w) => w.id === id);
  if (index === -1 || !all[index]) {
    throw new Error("Advertência não encontrada.");
  }

  const current = all[index]!;
  const now = new Date().toISOString();

  const updated: MemberWarning = {
    ...current,
    status: "revogado",
    revoked_at: now,
    revoked_by: adminUser?.id || null,
    revoked_by_name: adminUser?.name || null,
    revocation_reason: revocationReason.trim() || "Suspensão revogada pela administração",
    updated_at: now,
  } as MemberWarning;

  all[index] = updated;
  await persistWarnings(all);

  // Se havia tag vinculada, remove a tag do membro
  if (current.applied_tag_id && current.member_id) {
    try {
      await removeMemberTagAssignment(current.member_id, current.applied_tag_id);
    } catch (tagErr) {
      console.warn("Aviso ao desvincular tag de punição revogada:", tagErr);
    }
  }

  // Notificação para o membro informando a revogação
  try {
    await createNotification({
      user_id: updated.member_id,
      title: "✅ Punição Revogada pela Liderança",
      message: `Sua ${updated.type === "suspensao" ? "suspensão" : "advertência"} (${updated.reason}) foi revogada. Motivo: ${updated.revocation_reason}`,
      type: "system",
      link: "/perfil",
    });
    broadcastNotificationsRealtimeUpdate();
  } catch {}

  try {
    await logAuditAction("revoke_warning", "warnings", {
      warning_id: id,
      member_id: updated.member_id,
      admin_id: adminUser?.id,
      revocation_reason: revocationReason,
    });
  } catch {}

  broadcastWarningsRealtimeUpdate({ action: "revoke", warning: updated });
  return updated;
}

/**
 * Remove permanentemente a advertência do registro
 */
export async function deleteWarning(
  id: string,
  adminUser?: { id: string; name: string }
): Promise<void> {
  const all = await getWarnings();
  const target = all.find((w) => w.id === id);
  if (!target) return;

  const filtered = all.filter((w) => w.id !== id);
  await persistWarnings(filtered);

  // Se havia tag vinculada e estava ativa, remove
  if (target.applied_tag_id && target.member_id && target.status === "ativo") {
    try {
      await removeMemberTagAssignment(target.member_id, target.applied_tag_id);
    } catch {}
  }

  try {
    await logAuditAction("delete_warning", "warnings", {
      warning_id: id,
      member_id: target.member_id,
      admin_id: adminUser?.id,
    });
  } catch {}

  broadcastWarningsRealtimeUpdate({ action: "delete", id });
}

/**
 * Membro dá ciência na advertência recebida
 */
export async function acknowledgeWarning(id: string, memberUserId: string): Promise<MemberWarning> {
  const all = await getWarnings();
  const index = all.findIndex((w) => w.id === id);
  if (index === -1 || !all[index]) {
    throw new Error("Advertência não encontrada.");
  }

  const current = all[index]!;
  if (current.member_id !== memberUserId) {
    throw new Error("Apenas o membro destinatário pode confirmar ciência.");
  }

  const now = new Date().toISOString();
  const updated: MemberWarning = {
    ...current,
    acknowledged_at: now,
    updated_at: now,
  } as MemberWarning;

  all[index] = updated;
  await persistWarnings(all);

  try {
    await logAuditAction("acknowledge_warning", "warnings", {
      warning_id: id,
      member_id: memberUserId,
    });
  } catch {}

  broadcastWarningsRealtimeUpdate({ action: "acknowledge", warning: updated });
  return updated;
}
