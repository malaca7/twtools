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

      if (rpcName === 'submit_verification_request_rpc') {
        const reqId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `vreq_${Date.now()}`;
        const newReq = {
          id: reqId,
          user_id: body.p_user_id,
          requested_title: body.p_requested_title,
          justification: body.p_justification,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        await fetch(`${FIREBASE_RTDB_URL}/verification_requests/${reqId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReq),
        }).catch(() => {});
        return new Response(JSON.stringify(newReq), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'cancel_verification_request_rpc') {
        if (body.p_request_id) {
          await fetch(`${FIREBASE_RTDB_URL}/verification_requests/${body.p_request_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }),
          }).catch(() => {});
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'review_verification_request_rpc') {
        if (body.p_request_id) {
          await fetch(`${FIREBASE_RTDB_URL}/verification_requests/${body.p_request_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: body.p_status || 'approved',
              admin_notes: body.p_admin_notes || null,
              reviewed_by: body.p_reviewer_id || null,
              reviewed_at: new Date().toISOString(),
            }),
          }).catch(() => {});
          if (body.p_status === 'approved' && body.p_target_user_id) {
            await fetch(`${FIREBASE_RTDB_URL}/profiles/${body.p_target_user_id}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                is_verified: true,
                verified_title: body.p_approved_title || 'Verificado Oficial',
                verified_badge_color: body.p_badge_color || null,
                verified_at: new Date().toISOString(),
              }),
            }).catch(() => {});
          }
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'execute_production_rpc') {
        const prodId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`;
        const qty = Number(body.p_quantity) || 1;
        const productId = body.p_product_id;
        const now = new Date().toISOString();

        // Decrement raw materials
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

        // Increment warehouse stock
        let warehouseBal = qty;
        if (productId) {
          const curStock = await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`).then(r => r.json()).catch(() => null);
          warehouseBal = (Number(curStock?.quantity) || 0) + qty;
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

        // Log production
        const prodRecord = {
          id: prodId,
          product_id: productId,
          quantity: qty,
          observation: body.p_observation || null,
          created_at: now,
        };
        await fetch(`${FIREBASE_RTDB_URL}/productions/${prodId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prodRecord),
        }).catch(() => {});

        return new Response(JSON.stringify({
          success: true,
          production_id: prodId,
          product_id: productId,
          quantity: qty,
          product_name: 'Produção Concluída',
          warehouse_balance: warehouseBal,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'adjust_warehouse_stock_rpc') {
        const productId = body.p_product_id;
        const newQty = Number(body.p_new_quantity) || 0;
        const now = new Date().toISOString();
        if (productId) {
          await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              quantity: newQty,
              reserved_quantity: 0,
              updated_at: now,
            }),
          }).catch(() => {});
        }
        return new Response(JSON.stringify({ success: true, previous: 0, new_balance: newQty }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'transfer_warehouse_to_storage_rpc') {
        const productId = body.p_product_id;
        const qty = Number(body.p_quantity) || 0;
        let newBal = 0;
        if (productId) {
          const curStock = await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`).then(r => r.json()).catch(() => null);
          newBal = Math.max(0, (Number(curStock?.quantity) || 0) - qty);
          await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newBal, updated_at: new Date().toISOString() }),
          }).catch(() => {});
        }
        return new Response(JSON.stringify({
          success: true,
          transferred: qty,
          warehouse_balance: newBal,
          destination: body.p_bau_id ? 'Baú Selecionado' : 'Estoque Geral',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'transfer_warehouse_to_sale_rpc') {
        const productId = body.p_product_id;
        const qty = Number(body.p_quantity) || 0;
        let newBal = 0;
        if (productId) {
          const curStock = await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`).then(r => r.json()).catch(() => null);
          newBal = Math.max(0, (Number(curStock?.quantity) || 0) - qty);
          await fetch(`${FIREBASE_RTDB_URL}/warehouse_stock/${productId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newBal, updated_at: new Date().toISOString() }),
          }).catch(() => {});
        }
        return new Response(JSON.stringify({
          success: true,
          transferred: qty,
          warehouse_balance: newBal,
          sale_available_balance: qty,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'get_coins_exchange_config_rpc') {
        const conf = await fetch(`${FIREBASE_RTDB_URL}/system_coins_config/default.json`).then(r => r.json()).catch(() => null);
        const res = conf || {
          id: 'default',
          xp_to_coin_rate: 10,
          min_xp_exchange: 100,
          is_enabled: true,
          updated_at: new Date().toISOString(),
        };
        return new Response(JSON.stringify(res), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'dev_update_coins_config_rpc') {
        const conf = {
          id: 'default',
          xp_to_coin_rate: Number(body.p_rate ?? 10),
          min_xp_exchange: Number(body.p_min ?? 100),
          is_enabled: body.p_is_enabled ?? true,
          updated_at: new Date().toISOString(),
        };
        await fetch(`${FIREBASE_RTDB_URL}/system_coins_config/default.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conf),
        }).catch(() => {});
        return new Response(JSON.stringify(conf), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'get_gamification_ranking') {
        const profs = await fetch(`${FIREBASE_RTDB_URL}/profiles.json`).then(r => r.json()).catch(() => null);
        const list = profs ? Object.values(profs).filter((p: any) => p && !p._schema_info) : [];
        list.sort((a: any, b: any) => (Number(b.xp) || 0) - (Number(a.xp) || 0));
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'grant_insignia_rpc' || rpcName === 'dev_grant_insignia_rpc') {
        const userInsigniaId = `${body.p_user_id || body.p_member_id}_${body.p_insignia_id}`;
        const record = {
          id: userInsigniaId,
          user_id: body.p_user_id || body.p_member_id,
          insignia_id: body.p_insignia_id,
          reason: body.p_reason || 'Concedida manualmente',
          granted_by: body.p_granted_by || null,
          created_at: new Date().toISOString(),
        };
        await fetch(`${FIREBASE_RTDB_URL}/member_insignias/${userInsigniaId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        }).catch(() => {});
        return new Response(JSON.stringify({ success: true, insignia: record }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'dev_revoke_insignia_rpc') {
        const userInsigniaId = `${body.p_user_id || body.p_member_id}_${body.p_insignia_id}`;
        await fetch(`${FIREBASE_RTDB_URL}/member_insignias/${userInsigniaId}.json`, {
          method: 'DELETE',
        }).catch(() => {});
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'save_insignia_rpc') {
        const insId = body.p_id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ins_${Date.now()}`);
        const insObj = {
          id: insId,
          name: body.p_name,
          description: body.p_description || '',
          icon: body.p_icon || 'award',
          category: body.p_category || 'geral',
          xp_bonus: Number(body.p_xp_bonus) || 0,
          is_active: body.p_is_active ?? true,
          updated_at: new Date().toISOString(),
        };
        await fetch(`${FIREBASE_RTDB_URL}/insignias/${insId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insObj),
        }).catch(() => {});
        return new Response(JSON.stringify(insObj), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (rpcName === 'dev_delete_insignia_rpc') {
        if (body.p_id) {
          await fetch(`${FIREBASE_RTDB_URL}/insignias/${body.p_id}.json`, { method: 'DELETE' }).catch(() => {});
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
            if (f.op === 'neq') return String(item[f.field]) !== String(f.val);
            if (f.op === 'gte') return Number(item[f.field]) >= Number(f.val);
            if (f.op === 'lte') return Number(item[f.field]) <= Number(f.val);
            if (f.op === 'gt') return Number(item[f.field]) > Number(f.val);
            if (f.op === 'lt') return Number(item[f.field]) < Number(f.val);
            if (f.op === 'in') {
              const allowed = f.val.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
              return allowed.includes(String(item[f.field]));
            }
            if (f.op === 'is' && f.val === 'null') {
              return item[f.field] === null || item[f.field] === undefined;
            }
            if (f.op === 'not_null') {
              return item[f.field] !== null && item[f.field] !== undefined;
            }
            return true;
          });
        });
      }

      // Ordenação (order=field.asc ou order=field.desc)
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
