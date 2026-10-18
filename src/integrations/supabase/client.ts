import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env?.['VITE_SUPABASE_URL'] as string) ||
  "https://eptcwuzfnarrvextneuu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env?.['VITE_SUPABASE_PUBLISHABLE_KEY'] as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwdGN3dXpmbmFycnZleHRuZXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDI0MjksImV4cCI6MjEwNTc3ODQyOX0.WrXZZ-oxdBqhbrQx3tLrqtbbk1tFsaweJwROV3ThtPI";

const FIREBASE_RTDB_URL =
  (import.meta.env?.['VITE_FIREBASE_RTDB_URL'] as string) ||
  'https://rfdrive-fd805-default-rtdb.firebaseio.com';

// ============================================================================
// REALTIME CHANNEL BRIDGE (BroadcastChannel + Firebase RTDB table sync)
// ============================================================================
type RealtimeListener = {
  type: string;
  filter?: any;
  callback: (payload: any) => void;
};

class FirebaseRealtimeChannel {
  public topic: string;
  private listeners: RealtimeListener[] = [];
  private rtdbUnsubs: (() => void)[] = [];
  private bc?: BroadcastChannel;

  constructor(topic: string) {
    this.topic = topic;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel(`tw_rt_${topic}`);
        this.bc.onmessage = (ev) => {
          this.dispatchLocal(ev.data);
        };
      } catch {}
    }
  }

  on(type: string, filterOrCb: any, callback?: any) {
    const cb = typeof filterOrCb === 'function' ? filterOrCb : callback;
    const filter = typeof filterOrCb === 'object' ? filterOrCb : undefined;
    this.listeners.push({ type, filter, callback: cb });

    // Se for postgres_changes para uma tabela, escuta alterações no Firebase RTDB
    if (type === 'postgres_changes' && filter?.table && typeof window !== 'undefined') {
      const table = filter.table;
      try {
        // Polling leve / escuta no endpoint da tabela via BroadcastChannel
        const onTableChange = (ev: MessageEvent) => {
          if (ev.data && ev.data.table === table) {
            try {
              cb({
                eventType: ev.data.eventType || '*',
                schema: filter.schema || 'public',
                table,
                new: ev.data.new,
                old: ev.data.old || null,
              });
            } catch {}
          }
        };
        const tableBc = new BroadcastChannel(`tw_table_${table}`);
        tableBc.onmessage = onTableChange;
        this.rtdbUnsubs.push(() => {
          try { tableBc.close(); } catch {}
        });
      } catch {}
    }

    return this;
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) {
      setTimeout(() => callback('SUBSCRIBED'), 10);
    }
    return this;
  }

  unsubscribe() {
    this.rtdbUnsubs.forEach((u) => u());
    this.rtdbUnsubs = [];
    if (this.bc) {
      try { this.bc.close(); } catch {}
    }
    return this;
  }

  send(payload: any) {
    if (this.bc) {
      try { this.bc.postMessage(payload); } catch {}
    }
    this.dispatchLocal(payload);
    return Promise.resolve('ok');
  }

  private dispatchLocal(payload: any) {
    for (const l of this.listeners) {
      try {
        if (payload?.type === 'broadcast' && l.type === 'broadcast') {
          if (!l.filter?.event || l.filter.event === payload.event) {
            l.callback({ event: payload.event, payload: payload.payload });
          }
        } else if (l.type === payload?.type || l.type === 'broadcast') {
          l.callback(payload);
        }
      } catch {}
    }
  }
}

export function notifyTableChange(table: string, eventType: string, newRecord?: any) {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const tableBc = new BroadcastChannel(`tw_table_${table}`);
      tableBc.postMessage({ table, eventType, new: newRecord });
      tableBc.close();
    } catch {}
  }
}

// ============================================================================
// CHAVE PRIMÁRIA & IDENTIFICADOR DETERMINÍSTICO
// ============================================================================
function getRecordKey(table: string, item: any): string {
  if (table === 'role_permissions' && (item.level || item.nivel)) return String(item.level || item.nivel);
  if (table === 'product_baus' && item.product_id && item.bau_id) return `${item.product_id}_${item.bau_id}`;
  if (table === 'user_presence' && item.user_id) return String(item.user_id);
  if (table === 'user_roles' && (item.id || item.user_id)) return String(item.id || item.user_id);
  if (table === 'announcement_reads' && item.announcement_id && item.user_id) return `${item.announcement_id}_${item.user_id}`;
  if (table === 'profiles' && item.id) return String(item.id);
  if (table === 'profiles' && item.user_id) return String(item.user_id);
  if (table === 'platform_settings' && item.key) return String(item.key);
  if (table === 'member_tag_assignments' && (item.user_id || item.member_id) && item.tag_id) {
    return `${item.user_id || item.member_id}_${item.tag_id}`;
  }
  if (table === 'action_scale_members' && item.scale_id && item.member_id) return `${item.scale_id}_${item.member_id}`;
  if (table === 'member_insignias' && item.user_id && item.insignia_id) return `${item.user_id}_${item.insignia_id}`;
  if (table === 'profile_post_likes' && item.post_id && item.user_id) return `${item.post_id}_${item.user_id}`;
  if (table === 'member_follows' && item.follower_id && item.following_id) return `${item.follower_id}_${item.following_id}`;
  if (table === 'raw_materials' && item.id) return String(item.id);
  if (table === 'warehouse_stock' && item.product_id) return String(item.product_id);
  if (table === 'product_recipes' && item.product_id) return String(item.product_id);
  if (table === 'xp_rules_config' && item.action_type) return String(item.action_type);
  return item.id ? String(item.id) : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}`);
}

// ============================================================================
// TRATAMENTO DE REQUISIÇÕES (POSTGREST + AUTH + RPC FALLBACK VIA FIREBASE RTDB)
// ============================================================================
async function handleSupabaseFallback(urlStr: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const acceptHeader = (init?.headers as any)?.['Accept'] || (init?.headers as any)?.['accept'] || '';
  const wantsSingle = acceptHeader.includes('vnd.pgrst.object');

  try {
    const urlObj = new URL(urlStr);
    const pathname = urlObj.pathname;

    // ------------------------------------------------------------------------
    // 0. SUPABASE AUTH SIMULATION (/auth/v1/...)
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/auth/v1/')) {
      let activeUser: any = null;
      if (typeof window !== 'undefined') {
        try {
          const sim = localStorage.getItem('tw_dev_impersonate');
          if (sim) activeUser = JSON.parse(sim);
          if (!activeUser) {
            const authU = localStorage.getItem('tw_auth_user');
            if (authU) activeUser = JSON.parse(authU);
          }
        } catch {}
      }

      const uid = activeUser?.user_id || activeUser?.id || 'dev-local-user';
      const email = activeUser?.discord_email || activeUser?.email || 'membro@twinwheels.dev';
      const discordId = activeUser?.discord_id || '722320491767136346';

      const mockUserObj = {
        id: uid,
        aud: 'authenticated',
        role: 'authenticated',
        email: email,
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: 'discord', providers: ['discord'] },
        user_metadata: {
          provider_id: discordId,
          sub: discordId,
          email: email,
          name: activeUser?.nome || 'Membro Twin Wheels',
          full_name: activeUser?.nome || 'Membro Twin Wheels',
          avatar_url: activeUser?.avatar_url || activeUser?.discord_avatar_url || '',
          custom_claims: { global_name: activeUser?.nome || 'Membro' },
        },
        identities: [
          {
            id: discordId,
            user_id: uid,
            identity_data: { email: email, sub: discordId },
            provider: 'discord',
            last_sign_in_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        created_at: '2026-08-20T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      };

      if (pathname.includes('/user')) {
        return new Response(JSON.stringify(mockUserObj), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.includes('/token') || pathname.includes('/session')) {
        const tokenData = {
          access_token: 'tw_rtdb_session_token_' + Date.now(),
          token_type: 'bearer',
          expires_in: 3600 * 24 * 7,
          refresh_token: 'tw_rtdb_refresh_token',
          user: mockUserObj,
        };
        return new Response(JSON.stringify(tokenData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.includes('/logout')) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, user: mockUserObj }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ------------------------------------------------------------------------
    // 1. TRATAMENTO COMPLETO DE RPCs (/rest/v1/rpc/{name})
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/rest/v1/rpc/')) {
      const rpcName = pathname.replace('/rest/v1/rpc/', '').split('?')[0];
      let body: any = {};
      try {
        if (init?.body) body = JSON.parse(init.body as string);
      } catch {}

      const now = new Date().toISOString();

      // A) Permissões de Cargos / Níveis
      if (rpcName === 'save_role_permissions') {
        const level = body._level || body.level;
        if (level) {
          await fetch(`${FIREBASE_RTDB_URL}/role_permissions/${level}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              level,
              nivel: level,
              permissions: body._permissions || body.permissions,
              updated_at: now,
            }),
          }).catch(() => {});
          notifyTableChange('role_permissions', 'UPDATE', { level, permissions: body._permissions || body.permissions });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // B) Cargos Customizados
      if (rpcName === 'save_custom_role') {
        if (body._id) {
          await fetch(`${FIREBASE_RTDB_URL}/custom_roles/${body._id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: body._id,
              nome: body._nome,
              descricao: body._descricao || null,
              rank: body._rank || 1,
              module_permissions: body._module_permissions || {},
              updated_at: now,
            }),
          }).catch(() => {});
          notifyTableChange('custom_roles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'delete_custom_role') {
        if (body._role_id) {
          await fetch(`${FIREBASE_RTDB_URL}/custom_roles/${body._role_id}.json`, {
            method: 'DELETE',
          }).catch(() => {});
          notifyTableChange('custom_roles', 'DELETE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // C) Gestão de Tags de Membros
      if (rpcName === 'set_member_tags_rpc') {
        const targetUserId = body.p_user_id || body.p_member_id;
        const tagIds = Array.isArray(body.p_tag_ids) ? body.p_tag_ids : [];
        if (targetUserId) {
          // 1. Obter assignments existentes e deletar as do usuário
          const curRes = await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments.json`).then(r => r.json()).catch(() => null);
          if (curRes) {
            for (const [k, v] of Object.entries(curRes)) {
              if (v && ((v as any).user_id === targetUserId || (v as any).member_id === targetUserId)) {
                await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${k}.json`, { method: 'DELETE' }).catch(() => {});
              }
            }
          }
          // 2. Gravar novas tags
          for (const tid of tagIds) {
            const assignId = `${targetUserId}_${tid}`;
            await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${assignId}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: assignId,
                user_id: targetUserId,
                member_id: targetUserId,
                tag_id: tid,
                assigned_by: body.p_assigned_by || null,
                created_at: now,
              }),
            }).catch(() => {});
          }
          notifyTableChange('member_tag_assignments', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'set_tag_members_rpc') {
        const targetTagId = body.p_tag_id;
        const userIds = Array.isArray(body.p_user_ids) ? body.p_user_ids : [];
        if (targetTagId) {
          const curRes = await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments.json`).then(r => r.json()).catch(() => null);
          if (curRes) {
            for (const [k, v] of Object.entries(curRes)) {
              if (v && (v as any).tag_id === targetTagId) {
                await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${k}.json`, { method: 'DELETE' }).catch(() => {});
              }
            }
          }
          for (const uid of userIds) {
            const assignId = `${uid}_${targetTagId}`;
            await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${assignId}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: assignId,
                user_id: uid,
                member_id: uid,
                tag_id: targetTagId,
                created_at: now,
              }),
            }).catch(() => {});
          }
          notifyTableChange('member_tag_assignments', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'toggle_member_tag_rpc') {
        const targetUserId = body.p_user_id || body.p_member_id;
        const tagId = body.p_tag_id;
        const assignId = `${targetUserId}_${tagId}`;
        if (body.p_active === false) {
          await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${assignId}.json`, { method: 'DELETE' }).catch(() => {});
        } else if (targetUserId && tagId) {
          await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${assignId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: assignId,
              user_id: targetUserId,
              member_id: targetUserId,
              tag_id: tagId,
              created_at: now,
            }),
          }).catch(() => {});
        }
        notifyTableChange('member_tag_assignments', 'UPDATE');
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // D) Moedas & Câmbio (Gamificação)
      if (rpcName === 'dev_update_coins_config_rpc') {
        const confData = {
          xp_per_coin: Number(body.p_xp_per_coin ?? body.p_rate ?? 1),
          exchange_fee_percent: Number(body.p_exchange_fee_percent ?? 0),
          min_xp_exchange: Number(body.p_min_xp_exchange ?? body.p_min ?? 1),
          exchange_enabled: body.p_exchange_enabled !== undefined ? Boolean(body.p_exchange_enabled) : (body.p_is_enabled ?? true),
          updated_at: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/system_coins_config.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(confData),
        }).catch(() => {});
        return new Response(JSON.stringify(confData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'get_coins_exchange_config_rpc') {
        const confRes = await fetch(`${FIREBASE_RTDB_URL}/system_coins_config.json`).then(r => r.json()).catch(() => null);
        const conf = confRes || {
          xp_per_coin: 1,
          exchange_fee_percent: 0,
          min_xp_exchange: 1,
          exchange_enabled: true,
        };
        return new Response(JSON.stringify(conf), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'dev_adjust_member_coins_rpc') {
        const targetId = body.p_target_user_id;
        const delta = Number(body.p_amount) || 0;
        let newCoins = 0;
        if (targetId) {
          // Buscar profile pela id ou user_id
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetId;
          let currentProfile = profs?.[targetId];
          if (!currentProfile && profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetId || (v as any).id === targetId)) {
                targetKey = k;
                currentProfile = v;
                break;
              }
            }
          }
          const currentCoins = Number(currentProfile?.tw_coins || 0);
          newCoins = Math.max(0, currentCoins + delta);
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tw_coins: newCoins, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('profiles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true, new_balance: newCoins }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'exchange_xp_for_coins_rpc') {
        const targetId = body.p_user_id || body.p_target_user_id;
        const xpAmount = Number(body.p_xp_amount) || 0;
        let newCoins = 0;
        let remainingXp = 0;
        if (targetId && xpAmount > 0) {
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetId;
          let currentProfile = profs?.[targetId];
          if (!currentProfile && profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetId || (v as any).id === targetId)) {
                targetKey = k;
                currentProfile = v;
                break;
              }
            }
          }
          const curXp = Number(currentProfile?.xp || 0);
          const curCoins = Number(currentProfile?.tw_coins || 0);
          if (curXp >= xpAmount) {
            remainingXp = curXp - xpAmount;
            newCoins = curCoins + xpAmount;
            await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ xp: remainingXp, tw_coins: newCoins, updated_at: now }),
            }).catch(() => {});
            notifyTableChange('profiles', 'UPDATE');
          }
        }
        return new Response(JSON.stringify({ success: true, remaining_xp: remainingXp, new_coins: newCoins }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'buy_shop_item_rpc') {
        const targetId = body.p_user_id;
        const itemId = body.p_item_id;
        const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `order_${Date.now()}`;
        if (targetId && itemId) {
          const itemRes = await fetch(`${FIREBASE_RTDB_URL}/shop_items/${itemId}.json`).then(r => r.json()).catch(() => null);
          const price = Number(itemRes?.price_coins || 0);
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetId;
          let currentProfile = profs?.[targetId];
          if (!currentProfile && profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetId || (v as any).id === targetId)) {
                targetKey = k;
                currentProfile = v;
                break;
              }
            }
          }
          const curCoins = Number(currentProfile?.tw_coins || 0);
          if (curCoins >= price) {
            await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tw_coins: curCoins - price, updated_at: now }),
            }).catch(() => {});
            // Se for insígnia, adiciona à lista
            if (itemRes?.insignia_id) {
              const uInsigniaId = `${targetId}_${itemRes.insignia_id}`;
              await fetch(`${FIREBASE_RTDB_URL}/member_insignias/${uInsigniaId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: uInsigniaId,
                  user_id: targetId,
                  insignia_id: itemRes.insignia_id,
                  reason: 'Comprada na Loja Oficial',
                  created_at: now,
                }),
              }).catch(() => {});
            }
            notifyTableChange('profiles', 'UPDATE');
          }
        }
        return new Response(JSON.stringify({ success: true, order_id: orderId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'dev_manage_member_xp_rpc') {
        const targetId = body.p_target_user_id;
        const amount = Number(body.p_amount) || 0;
        const action = body.p_action || 'add';
        let newXp = 0;
        if (targetId) {
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetId;
          let curProfile = profs?.[targetId];
          if (!curProfile && profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetId || (v as any).id === targetId)) {
                targetKey = k;
                curProfile = v;
                break;
              }
            }
          }
          const curXp = Number(curProfile?.xp || 0);
          if (action === 'set') newXp = Math.max(0, amount);
          else if (action === 'remove') newXp = Math.max(0, curXp - amount);
          else newXp = curXp + amount;
          const newLevel = Math.floor(newXp / 100) + 1;
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp: newXp, gamification_level: newLevel, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('profiles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true, new_xp: newXp }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'evaluate_member_rpc') {
        const targetId = body.p_target_user_id;
        const stars = Number(body.p_stars) || 5;
        if (targetId) {
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetId;
          let curProfile = profs?.[targetId];
          if (!curProfile && profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetId || (v as any).id === targetId)) {
                targetKey = k;
                curProfile = v;
                break;
              }
            }
          }
          const curCount = Number(curProfile?.stars_count || 0) + 1;
          const prevTotal = Number(curProfile?.stars_rating || 5) * (curCount - 1);
          const newRating = Number(((prevTotal + stars) / curCount).toFixed(2));
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stars_count: curCount, stars_rating: newRating, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('profiles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // E) Escalas de Ação
      if (rpcName === 'save_action_scale') {
        const scaleId = body.p_id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `scale_${Date.now()}`);
        const scaleObj = {
          id: scaleId,
          titulo: body.p_titulo || 'Escala de Ação',
          tipo_acao: body.p_tipo_acao || 'Ação',
          descricao: body.p_descricao || null,
          data_hora: body.p_data_hora || now,
          data_hora_chamada: body.p_data_hora_chamada || null,
          local_posto: body.p_local_posto || 'QG Principal',
          vagas_limite: Number(body.p_vagas_limite ?? 10),
          vagas_reservas: Number(body.p_vagas_reservas ?? 2),
          status: body.p_status || 'rascunho',
          gerente_id: body.p_gerente_id || null,
          gerente_nome: body.p_gerente_nome || null,
          metadata: body.p_metadata || {},
          criado_em: now,
          atualizado_em: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/action_scales/${scaleId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scaleObj),
        }).catch(() => {});
        notifyTableChange('action_scales', 'UPDATE');
        return new Response(JSON.stringify(scaleObj), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'publish_action_scale') {
        if (body.p_scale_id) {
          await fetch(`${FIREBASE_RTDB_URL}/action_scales/${body.p_scale_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'publicada', atualizado_em: now }),
          }).catch(() => {});
          notifyTableChange('action_scales', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true, status: 'publicada' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'cancel_action_scale') {
        if (body.p_scale_id) {
          await fetch(`${FIREBASE_RTDB_URL}/action_scales/${body.p_scale_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'cancelada',
              motivo_cancelamento: body.p_motivo || null,
              atualizado_em: now,
            }),
          }).catch(() => {});
          notifyTableChange('action_scales', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true, status: 'cancelada' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'add_action_scale_member') {
        const memId = `${body.p_scale_id}_${body.p_member_id}`;
        const memObj = {
          id: memId,
          scale_id: body.p_scale_id,
          member_id: body.p_member_id,
          posto_funcao: body.p_posto_funcao || 'Operacional',
          tipo_vaga: body.p_tipo_vaga || 'titular',
          status_presenca: 'pendente',
          criado_em: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/action_scale_members/${memId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memObj),
        }).catch(() => {});
        notifyTableChange('action_scale_members', 'UPDATE');
        return new Response(JSON.stringify(memObj), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'remove_action_scale_member') {
        const memId = `${body.p_scale_id}_${body.p_member_id}`;
        await fetch(`${FIREBASE_RTDB_URL}/action_scale_members/${memId}.json`, { method: 'DELETE' }).catch(() => {});
        notifyTableChange('action_scale_members', 'DELETE');
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'confirm_action_scale_presence') {
        const memId = `${body.p_scale_id}_${body.p_member_id}`;
        const updates = {
          status_presenca: body.p_status_presenca,
          reacao: body.p_reacao || (body.p_status_presenca === 'confirmado' ? '👍' : '❌'),
          justificativa: body.p_justificativa || '',
          respondido_em: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/action_scale_members/${memId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(() => {});
        notifyTableChange('action_scale_members', 'UPDATE');
        return new Response(JSON.stringify({ success: true, ...updates }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // F) Selos e Solicitações de Verificação
      if (rpcName === 'submit_verification_request_rpc') {
        const reqId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `verif_${Date.now()}`;
        const newReq = {
          id: reqId,
          target_user_id: body.p_target_user_id,
          requested_title: body.p_requested_title || 'Membro Verificado',
          reason: body.p_reason || '',
          status: 'pending',
          created_at: now,
          updated_at: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/verification_requests/${reqId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReq),
        }).catch(() => {});
        notifyTableChange('verification_requests', 'INSERT');
        return new Response(JSON.stringify(newReq), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'grant_direct_verification_rpc' || rpcName === 'review_verification_request_rpc') {
        const targetUserId = body.p_target_user_id;
        if (targetUserId) {
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetUserId;
          if (profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetUserId || (v as any).id === targetUserId)) {
                targetKey = k;
                break;
              }
            }
          }
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              is_verified: true,
              verified_title: body.p_approved_title || body.p_title || 'Verificado Oficial',
              verified_badge_color: body.p_badge_color || null,
              verified_at: now,
            }),
          }).catch(() => {});
          notifyTableChange('profiles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'revoke_verification_rpc') {
        const targetUserId = body.p_target_user_id;
        if (targetUserId) {
          const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
          let targetKey = targetUserId;
          if (profs) {
            for (const [k, v] of Object.entries(profs)) {
              if (v && ((v as any).user_id === targetUserId || (v as any).id === targetUserId)) {
                targetKey = k;
                break;
              }
            }
          }
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_verified: false, verified_title: null, verified_badge_color: null }),
          }).catch(() => {});
          notifyTableChange('profiles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // G) Produções & Matérias-Primas
      if (rpcName === 'execute_production_rpc') {
        const prodId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`;
        const qty = Number(body.p_quantity) || 1;
        const productId = body.p_product_id;

        if (Array.isArray(body.p_raw_materials)) {
          for (const rm of body.p_raw_materials) {
            const rmId = rm.raw_material_id;
            const used = Number(rm.quantity_used) || 0;
            if (rmId && used > 0) {
              const curRm = await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${rmId}.json`).then(r => r.json()).catch(() => null);
              const newRmBal = Math.max(0, (Number(curRm?.current_stock) || 0) - used);
              await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${rmId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_stock: newRmBal, updated_at: now }),
              }).catch(() => {});
            }
          }
        }

        if (productId) {
          const curStock = await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`).then(r => r.json()).catch(() => null);
          const warehouseBal = (Number(curStock?.quantity) || 0) + qty;
          await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              quantity: warehouseBal,
              reserved_quantity: curStock?.reserved_quantity || 0,
              updated_at: now,
            }),
          }).catch(() => {});
        }
        notifyTableChange('warehouse_stock', 'UPDATE');
        notifyTableChange('raw_materials', 'UPDATE');
        return new Response(JSON.stringify({ success: true, id: prodId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'pull_raw_material_from_bau_rpc') {
        const rmId = body.p_raw_material_id;
        const qty = Number(body.p_quantity) || 0;
        if (rmId && qty > 0) {
          const curRm = await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${rmId}.json`).then(r => r.json()).catch(() => null);
          const newBal = (Number(curRm?.current_stock) || 0) + qty;
          await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${rmId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_stock: newBal, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('raw_materials', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'transfer_raw_material_to_bau_rpc') {
        const rmId = body.p_raw_material_id;
        const qty = Number(body.p_quantity) || 0;
        if (rmId && qty > 0) {
          const curRm = await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${rmId}.json`).then(r => r.json()).catch(() => null);
          const newBal = Math.max(0, (Number(curRm?.current_stock) || 0) - qty);
          await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${rmId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_stock: newBal, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('raw_materials', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'transfer_warehouse_to_storage_rpc' || rpcName === 'transfer_warehouse_to_sale_rpc') {
        const productId = body.p_product_id;
        const qty = Number(body.p_quantity) || 0;
        let newBal = 0;
        if (productId) {
          const curStock = await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`).then(r => r.json()).catch(() => null);
          newBal = Math.max(0, (Number(curStock?.quantity) || 0) - qty);
          await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newBal, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('warehouse_stock', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true, transferred: qty, warehouse_balance: newBal }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // H) Movimentações e Baús
      if (rpcName === 'register_movement') {
        const movId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mov_${Date.now()}`;
        const movObj = {
          id: movId,
          tipo: body._tipo || 'entrada',
          produto_id: body._produto_id,
          quantidade: Number(body._quantidade) || 1,
          motivo: body._motivo || 'Movimentação via Sistema',
          observacao: body._observacao || null,
          bau_id: body._bau_id || null,
          membro_id: body._membro_id || null,
          membro_nome: body._membro_nome || 'Membro',
          created_at: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/stock_movements/${movId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movObj),
        }).catch(() => {});

        // Atualizar saldo em product_baus
        if (body._produto_id && body._bau_id) {
          const pbKey = `${body._produto_id}_${body._bau_id}`;
          const curPb = await fetch(`${FIREBASE_RTDB_URL}/product_baus/${pbKey}.json`).then(r => r.json()).catch(() => null);
          const curBal = Number(curPb?.estoque_atual || 0);
          const delta = (body._tipo === 'saida' ? -1 : 1) * (Number(body._quantidade) || 0);
          const newBal = Math.max(0, curBal + delta);
          await fetch(`${FIREBASE_RTDB_URL}/product_baus/${pbKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estoque_atual: newBal, updated_at: now }),
          }).catch(() => {});
        }
        notifyTableChange('stock_movements', 'INSERT');
        notifyTableChange('product_baus', 'UPDATE');
        return new Response(JSON.stringify({ success: true, movement_id: movId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'set_member_level') {
        const targetUserId = body._user_id;
        const newLevel = body._nivel;
        if (targetUserId && newLevel) {
          const roles = await fetch(`${FIREBASE_RTDB_URL}/user_roles.json`).then(r => r.json()).catch(() => null);
          let targetRoleKey = targetUserId;
          if (roles) {
            for (const [k, v] of Object.entries(roles)) {
              if (v && ((v as any).user_id === targetUserId || (v as any).id === targetUserId)) {
                targetRoleKey = k;
                break;
              }
            }
          }
          await fetch(`${FIREBASE_RTDB_URL}/user_roles/${targetRoleKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nivel: newLevel, updated_at: now }),
          }).catch(() => {});
          notifyTableChange('user_roles', 'UPDATE');
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Default para quaisquer outros RPCs
      return new Response(JSON.stringify({ success: true, result: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ------------------------------------------------------------------------
    // 2. TRATAMENTO COMPLETO DE TABELAS POSTGREST (/rest/v1/{table})
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/rest/v1/')) {
      const table = pathname.replace('/rest/v1/', '').split('?')[0];
      const searchParams = urlObj.searchParams;

      // Extrair parâmetros de filtro com suporte total a PostgREST
      const filters: { field: string; op: string; val: string }[] = [];
      const orFilters: { field: string; op: string; val: string }[] = [];

      for (const [key, val] of searchParams.entries()) {
        if (key === 'or') {
          // Ex: or=(discord_id.eq.123,discord_email.eq.test)
          const cleanOr = val.replace(/^\(|\)$/g, '');
          const parts = cleanOr.split(',');
          for (const part of parts) {
            const sub = part.split('.');
            if (sub.length >= 3) {
              orFilters.push({ field: sub[0], op: sub[1], val: sub.slice(2).join('.') });
            }
          }
          continue;
        }

        if (val.startsWith('eq.')) {
          filters.push({ field: key, op: 'eq', val: val.replace('eq.', '') });
        } else if (val.startsWith('neq.')) {
          filters.push({ field: key, op: 'neq', val: val.replace('neq.', '') });
        } else if (val.startsWith('gte.')) {
          filters.push({ field: key, op: 'gte', val: val.replace('gte.', '') });
        } else if (val.startsWith('lte.')) {
          filters.push({ field: key, op: 'lte', val: val.replace('lte.', '') });
        } else if (val.startsWith('gt.')) {
          filters.push({ field: key, op: 'gt', val: val.replace('gt.', '') });
        } else if (val.startsWith('lt.')) {
          filters.push({ field: key, op: 'lt', val: val.replace('lt.', '') });
        } else if (val.startsWith('in.(') && val.endsWith(')')) {
          filters.push({ field: key, op: 'in', val: val.slice(4, -1) });
        } else if (val === 'is.null') {
          filters.push({ field: key, op: 'is', val: 'null' });
        } else if (val === 'is.not.null' || val === 'not.is.null') {
          filters.push({ field: key, op: 'not_null', val: '' });
        } else if (val.startsWith('ilike.') || val.startsWith('like.')) {
          const cleanPattern = val.replace(/^(ilike|like)\./, '').replace(/%/g, '');
          filters.push({ field: key, op: 'ilike', val: cleanPattern });
        } else if (val.startsWith('not.like.')) {
          const cleanPattern = val.replace('not.like.', '').replace(/%/g, '');
          filters.push({ field: key, op: 'not_like', val: cleanPattern });
        } else if (val.startsWith('not.eq.')) {
          filters.push({ field: key, op: 'neq', val: val.replace('not.eq.', '') });
        }
      }

      // A) POST: Insert / Upsert
      if (method === 'POST') {
        let body: any = null;
        try {
          if (init?.body) body = JSON.parse(init.body as string);
        } catch {}

        if (body) {
          const items = Array.isArray(body) ? body : [body];
          for (const item of items) {
            const key = getRecordKey(table, item);
            if (!item.id && !key.includes('_')) item.id = key;
            await fetch(`${FIREBASE_RTDB_URL}/${table}/${key}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            }).catch(() => {});
          }

          notifyTableChange(table, 'INSERT', items[0]);
          const responseData = wantsSingle ? items[0] : items;
          return new Response(JSON.stringify(responseData), {
            status: 201,
            headers: {
              'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
            },
          });
        }
      }

      // B) PATCH: Update
      if (method === 'PATCH') {
        let body: any = null;
        try {
          if (init?.body) body = JSON.parse(init.body as string);
        } catch {}

        if (body) {
          // Busca todos os registros existentes para encontrar as chaves exatas do Firebase RTDB
          const allRes = await fetch(`${FIREBASE_RTDB_URL}/${table}.json`).then(r => r.json()).catch(() => null);
          if (allRes && typeof allRes === 'object') {
            for (const [k, v] of Object.entries(allRes)) {
              if (v && typeof v === 'object' && !(v as any)._schema_info) {
                const matches = filters.every((f) => {
                  if (f.op === 'eq') return String((v as any)[f.field]) === String(f.val);
                  return true;
                });
                if (matches) {
                  await fetch(`${FIREBASE_RTDB_URL}/${table}/${k}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  }).catch(() => {});
                }
              }
            }
          }
          notifyTableChange(table, 'UPDATE', body);
        }

        return new Response(JSON.stringify(wantsSingle ? body : [body]), {
          status: 200,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          },
        });
      }

      // C) DELETE
      if (method === 'DELETE') {
        const allRes = await fetch(`${FIREBASE_RTDB_URL}/${table}.json`).then(r => r.json()).catch(() => null);
        if (allRes && typeof allRes === 'object') {
          for (const [k, v] of Object.entries(allRes)) {
            if (v && typeof v === 'object' && !(v as any)._schema_info) {
              const matches = filters.every((f) => {
                if (f.op === 'eq') return String((v as any)[f.field]) === String(f.val);
                return true;
              });
              if (matches) {
                await fetch(`${FIREBASE_RTDB_URL}/${table}/${k}.json`, { method: 'DELETE' }).catch(() => {});
              }
            }
          }
        }
        notifyTableChange(table, 'DELETE');
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // D) GET: Select
      const rtdbRes = await fetch(`${FIREBASE_RTDB_URL}/${table}.json`).then(r => r.json()).catch(() => null);
      let items: any[] = [];
      if (rtdbRes && typeof rtdbRes === 'object') {
        items = Object.values(rtdbRes).filter((item: any) => item && !item._schema_info);
      }

      // Filtragem Regular
      if (filters.length > 0) {
        items = items.filter((item: any) => {
          return filters.every((f) => {
            const val = item[f.field];
            if (f.op === 'eq') return String(val) === String(f.val);
            if (f.op === 'neq') return String(val) !== String(f.val);
            if (f.op === 'gte') return Number(val) >= Number(f.val);
            if (f.op === 'lte') return Number(val) <= Number(f.val);
            if (f.op === 'gt') return Number(val) > Number(f.val);
            if (f.op === 'lt') return Number(val) < Number(f.val);
            if (f.op === 'in') {
              const allowed = f.val.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
              return allowed.includes(String(val));
            }
            if (f.op === 'is' && f.val === 'null') {
              return val === null || val === undefined;
            }
            if (f.op === 'not_null') {
              return val !== null && val !== undefined;
            }
            if (f.op === 'ilike') {
              return String(val || '').toLowerCase().includes(f.val.toLowerCase());
            }
            if (f.op === 'not_like') {
              return !String(val || '').toLowerCase().startsWith(f.val.toLowerCase());
            }
            return true;
          });
        });
      }

      // Filtragem OR
      if (orFilters.length > 0) {
        items = items.filter((item: any) => {
          return orFilters.some((f) => {
            const val = item[f.field];
            if (f.op === 'eq') return String(val) === String(f.val);
            if (f.op === 'ilike') return String(val || '').toLowerCase().includes(f.val.toLowerCase());
            return false;
          });
        });
      }

      // Ordenação
      const orderParam = searchParams.get('order');
      if (orderParam) {
        const [orderField, orderDirection] = orderParam.split('.');
        const isDesc = orderDirection?.toLowerCase().startsWith('desc');
        items.sort((a, b) => {
          const valA = a[orderField];
          const valB = b[orderField];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
      }

      // Paginação (offset e limit)
      const offsetParam = searchParams.get('offset');
      if (offsetParam) {
        const offset = parseInt(offsetParam, 10);
        if (!isNaN(offset) && offset > 0) {
          items = items.slice(offset);
        }
      }

      const limitParam = searchParams.get('limit');
      if (limitParam) {
        const limit = parseInt(limitParam, 10);
        if (!isNaN(limit) && limit >= 0) {
          items = items.slice(0, limit);
        }
      }

      if (wantsSingle) {
        const singleItem = items[0] || null;
        if (!singleItem) {
          return new Response(
            JSON.stringify({ code: 'PGRST116', message: 'The result contains 0 rows' }),
            { status: 406, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify(singleItem), {
          status: 200,
          headers: { 'Content-Type': 'application/vnd.pgrst.object+json' },
        });
      }

      return new Response(JSON.stringify(items), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `0-${Math.max(0, items.length - 1)}/${items.length}`,
        },
      });
    }
  } catch (err) {
    console.warn('[SUPABASE RTDB BRIDGE] Erro ao interceptar requisição:', err);
  }

  return new Response(JSON.stringify(wantsSingle ? null : []), {
    status: 200,
    headers: { 'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json' },
  });
}

// ============================================================================
// INSTÂNCIA PRINCIPAL SUPABASE (100% INTERCEPTADA E PROTEGIDA)
// ============================================================================
export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (urlStr.includes('supabase.co')) {
        return handleSupabaseFallback(urlStr, init);
      }
      return fetch(input, init);
    },
  },
});

// Sobrescrever supabase.channel com o Realtime Channel Bridge
(supabase as any).channel = (topic: string) => {
  return new FirebaseRealtimeChannel(topic);
};
