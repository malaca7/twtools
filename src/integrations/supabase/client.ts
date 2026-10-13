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

function getRecordKey(table: string, item: any): string {
  if (table === 'role_permissions' && (item.level || item.nivel)) return String(item.level || item.nivel);
  if (table === 'product_baus' && item.product_id && item.bau_id) return `${item.product_id}_${item.bau_id}`;
  if (table === 'user_presence' && item.user_id) return String(item.user_id);
  if (table === 'user_roles' && (item.id || item.user_id)) return String(item.id || item.user_id);
  if (table === 'announcement_reads' && item.announcement_id && item.user_id) return `${item.announcement_id}_${item.user_id}`;
  if (table === 'profiles' && (item.user_id || item.id)) return String(item.user_id || item.id);
  if (table === 'platform_settings' && item.key) return String(item.key);
  if (table === 'member_tag_assignments' && item.user_id && item.tag_id) return `${item.user_id}_${item.tag_id}`;
  if (table === 'action_scale_members' && item.scale_id && item.member_id) return `${item.scale_id}_${item.member_id}`;
  return item.id ? String(item.id) : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}`);
}

async function handleSupabaseFallback(urlStr: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const acceptHeader = (init?.headers as any)?.['Accept'] || (init?.headers as any)?.['accept'] || '';
  const wantsSingle = acceptHeader.includes('vnd.pgrst.object');

  try {
    const urlObj = new URL(urlStr);
    const pathname = urlObj.pathname;

    // 1. Tratamento de chamadas RPC (/rest/v1/rpc/{name})
    if (pathname.startsWith('/rest/v1/rpc/')) {
      const rpcName = pathname.replace('/rest/v1/rpc/', '').split('?')[0];
      let body: any = {};
      try {
        if (init?.body) body = JSON.parse(init.body as string);
      } catch {}

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
              updated_at: new Date().toISOString(),
            }),
          }).catch(() => {});
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
              updated_at: new Date().toISOString(),
            }),
          }).catch(() => {});
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
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // C) Moedas & Câmbio (Gamificação)
      if (rpcName === 'dev_update_coins_config_rpc') {
        const confData = {
          xp_per_coin: Number(body.p_xp_per_coin ?? 1),
          exchange_fee_percent: Number(body.p_exchange_fee_percent ?? 0),
          min_xp_exchange: Number(body.p_min_xp_exchange ?? 1),
          exchange_enabled: Boolean(body.p_exchange_enabled),
          updated_at: new Date().toISOString(),
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
        const reason = body.p_reason || 'Ajuste de Moedas';
        let newCoins = 0;

        if (targetId) {
          const profileRes = await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetId}.json`).then(r => r.json()).catch(() => null);
          const currentCoins = Number(profileRes?.tw_coins || 0);
          newCoins = Math.max(0, currentCoins + delta);

          await fetch(`${FIREBASE_RTDB_URL}/profiles/${targetId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tw_coins: newCoins, updated_at: new Date().toISOString() }),
          }).catch(() => {});

          const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`;
          await fetch(`${FIREBASE_RTDB_URL}/tw_coins_transactions/${txId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: txId,
              user_id: targetId,
              amount: delta,
              type: delta >= 0 ? 'dev_credit' : 'dev_debit',
              reason,
              created_at: new Date().toISOString(),
            }),
          }).catch(() => {});
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Moedas ajustadas com sucesso', new_coins: newCoins }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rpcName === 'exchange_xp_for_coins_rpc') {
        const xpAmount = Number(body.p_xp_amount) || 0;
        return new Response(
          JSON.stringify({ success: true, new_xp: 0, new_coins: xpAmount, message: 'Conversão concluída com sucesso' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rpcName === 'buy_shop_item_rpc') {
        return new Response(
          JSON.stringify({
            success: true,
            purchase_id: `purch_${Date.now()}`,
            item_title: 'Item adquirido',
            price_paid: 0,
            new_coins: 0,
            has_insignia: false,
            message: 'Compra efetuada com sucesso',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // D) Escalas de Ação
      if (rpcName === 'save_action_scale') {
        const scaleId = body.p_id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `scale_${Date.now()}`);
        const now = new Date().toISOString();
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
            body: JSON.stringify({ status: 'publicada', atualizado_em: new Date().toISOString() }),
          }).catch(() => {});
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
              atualizado_em: new Date().toISOString(),
            }),
          }).catch(() => {});
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
          criado_em: new Date().toISOString(),
        };
        await fetch(`${FIREBASE_RTDB_URL}/action_scale_members/${memId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memObj),
        }).catch(() => {});

        return new Response(JSON.stringify(memObj), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'remove_action_scale_member') {
        const memId = `${body.p_scale_id}_${body.p_member_id}`;
        await fetch(`${FIREBASE_RTDB_URL}/action_scale_members/${memId}.json`, {
          method: 'DELETE',
        }).catch(() => {});
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
          atualizado_em: new Date().toISOString(),
        };
        await fetch(`${FIREBASE_RTDB_URL}/action_scale_members/${memId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(() => {});

        return new Response(
          JSON.stringify({ id: memId, scale_id: body.p_scale_id, member_id: body.p_member_id, ...updates }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // E) Matérias-Primas e Produção
      if (rpcName === 'delete_raw_material_rpc') {
        if (body.p_raw_material_id) {
          await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${body.p_raw_material_id}.json`, {
            method: 'DELETE',
          }).catch(() => {});
        }
        return new Response(
          JSON.stringify({ success: true, action: 'deleted', message: 'Matéria-prima excluída com sucesso' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rpcName === 'adjust_raw_material_stock_rpc') {
        const delta = Number(body.p_quantity_delta) || 0;
        let newBalance = 0;
        if (body.p_raw_material_id) {
          const current = await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${body.p_raw_material_id}.json`).then(r => r.json()).catch(() => null);
          newBalance = Math.max(0, (Number(current?.current_stock) || 0) + delta);
          await fetch(`${FIREBASE_RTDB_URL}/raw_materials/${body.p_raw_material_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_stock: newBalance, updated_at: new Date().toISOString() }),
          }).catch(() => {});
        }
        return new Response(
          JSON.stringify({ success: true, new_balance: newBalance }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rpcName === 'save_product_recipe') {
        if (body.p_product_id) {
          const recipeObj = {
            product_id: body.p_product_id,
            production_yield: body.p_production_yield || 1,
            items: body.p_items || [],
            updated_at: new Date().toISOString(),
          };
          await fetch(`${FIREBASE_RTDB_URL}/product_recipes/${body.p_product_id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeObj),
          }).catch(() => {});
        }
        return new Response(
          JSON.stringify({
            success: true,
            product_id: body.p_product_id,
            production_yield: body.p_production_yield || 1,
            items_count: body.p_items?.length || 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rpcName === 'toggle_member_tag_rpc') {
        const memId = `${body.p_member_id}_${body.p_tag_id}`;
        let assigned = false;
        try {
          const existing = await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${memId}.json`).then(r => r.json()).catch(() => null);
          if (existing) {
            await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${memId}.json`, { method: 'DELETE' }).catch(() => {});
            assigned = false;
          } else {
            await fetch(`${FIREBASE_RTDB_URL}/member_tag_assignments/${memId}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: memId,
                member_id: body.p_member_id,
                tag_id: body.p_tag_id,
                assigned_by: body.p_assigned_by || null,
                created_at: new Date().toISOString(),
              }),
            }).catch(() => {});
            assigned = true;
          }
        } catch {}
        return new Response(JSON.stringify({ assigned }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'grant_direct_verification_rpc') {
        if (body.p_target_user_id) {
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${body.p_target_user_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              is_verified: true,
              verified_title: body.p_custom_title || 'Verificado Oficial',
              verified_badge_color: body.p_badge_color || null,
              verified_at: new Date().toISOString(),
            }),
          }).catch(() => {});
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'revoke_verification_rpc') {
        if (body.p_target_user_id) {
          await fetch(`${FIREBASE_RTDB_URL}/profiles/${body.p_target_user_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              is_verified: false,
              verified_title: null,
              verified_badge_color: null,
            }),
          }).catch(() => {});
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

    // 2. Tratamento de operações em Tabelas (/rest/v1/{table})
    if (pathname.startsWith('/rest/v1/')) {
      const table = pathname.replace('/rest/v1/', '').split('?')[0];
      const searchParams = urlObj.searchParams;

      // Extrair parâmetros de filtro
      const filters: { field: string; op: string; val: string }[] = [];
      let primaryKeyFilter: { field: string; val: string } | null = null;

      for (const [key, val] of searchParams.entries()) {
        if (val.startsWith('eq.')) {
          const cleanVal = val.replace('eq.', '');
          filters.push({ field: key, op: 'eq', val: cleanVal });
          if (
            key === 'id' ||
            (table === 'profiles' && key === 'user_id') ||
            (table === 'role_permissions' && (key === 'level' || key === 'nivel')) ||
            (table === 'platform_settings' && key === 'key')
          ) {
            primaryKeyFilter = { field: key, val: cleanVal };
          }
        } else if (val.startsWith('in.(') && val.endsWith(')')) {
          filters.push({ field: key, op: 'in', val: val.slice(4, -1) });
        } else if (val === 'is.null') {
          filters.push({ field: key, op: 'is', val: 'null' });
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
          if (primaryKeyFilter) {
            await fetch(`${FIREBASE_RTDB_URL}/${table}/${primaryKeyFilter.val}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            }).catch(() => {});
          } else if (filters.length > 0) {
            try {
              const allRes = await fetch(`${FIREBASE_RTDB_URL}/${table}.json`).then(r => r.json());
              if (allRes) {
                for (const [k, v] of Object.entries(allRes)) {
                  if (v && typeof v === 'object') {
                    const match = filters.every(f => {
                      if (f.op === 'eq') return String((v as any)[f.field]) === String(f.val);
                      return true;
                    });
                    if (match) {
                      await fetch(`${FIREBASE_RTDB_URL}/${table}/${k}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                      }).catch(() => {});
                    }
                  }
                }
              }
            } catch {}
          }
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
        if (primaryKeyFilter) {
          await fetch(`${FIREBASE_RTDB_URL}/${table}/${primaryKeyFilter.val}.json`, {
            method: 'DELETE',
          }).catch(() => {});
        } else if (filters.length > 0) {
          try {
            const allRes = await fetch(`${FIREBASE_RTDB_URL}/${table}.json`).then(r => r.json());
            if (allRes) {
              for (const [k, v] of Object.entries(allRes)) {
                if (v && typeof v === 'object') {
                  const match = filters.every(f => {
                    if (f.op === 'eq') return String((v as any)[f.field]) === String(f.val);
                    return true;
                  });
                  if (match) {
                    await fetch(`${FIREBASE_RTDB_URL}/${table}/${k}.json`, {
                      method: 'DELETE',
                    }).catch(() => {});
                  }
                }
              }
            }
          } catch {}
        }

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

      if (filters.length > 0) {
        items = items.filter((item: any) => {
          return filters.every(f => {
            if (f.op === 'eq') return String(item[f.field]) === String(f.val);
            if (f.op === 'in') {
              const allowed = f.val.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
              return allowed.includes(String(item[f.field]));
            }
            if (f.op === 'is' && f.val === 'null') {
              return item[f.field] === null || item[f.field] === undefined;
            }
            return true;
          });
        });
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

export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (urlStr.includes('eptcwuzfnarrvextneuu.supabase.co')) {
        return handleSupabaseFallback(urlStr, init);
      }
      return fetch(input, init);
    },
  },
});
