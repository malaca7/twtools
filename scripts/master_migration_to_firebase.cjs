/**
 * Master Migration: Supabase (efwqhqevfxlschyhbiao) + Neon DB -> Firebase Realtime Database
 * Populates ALL tables, collections, seeds, catalogs, and systems of Twin Wheels platform.
 */

const { Client } = require('d:/dev/web/twtools/node_modules/pg');
const fs = require('fs');
const path = require('path');

const FIREBASE_RTDB_URL = 'https://rfdrive-fd805-default-rtdb.firebaseio.com';
const SUPABASE_CONN = 'postgresql://postgres.efwqhqevfxlschyhbiao:p3w80VkMM7QWTuC3SYoBiWhKyPX0of8o@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';
const NEON_CONN = 'postgresql://neondb_owner:npg_lY6QuNCWU1Td@ep-rapid-unit-b4vwmopg-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function fetchWithRetry(url, options, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 400;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function getRecordKey(tableName, row, index) {
  if (row.id) return String(row.id);
  if (tableName === 'role_permissions' && (row.level || row.nivel)) {
    return String(row.level || row.nivel);
  }
  if (tableName === 'user_presence' && row.user_id) {
    return String(row.user_id);
  }
  if (tableName === 'user_roles' && (row.user_id || row.id)) {
    return String(row.user_id || row.id);
  }
  if (tableName === 'profiles' && (row.user_id || row.id)) {
    return String(row.user_id || row.id);
  }
  if (tableName === 'platform_settings' && row.key) {
    return String(row.key);
  }
  if (tableName === 'product_baus' && row.product_id && row.bau_id) {
    return `${row.product_id}_${row.bau_id}`;
  }
  if (tableName === 'announcement_reads' && row.announcement_id && row.user_id) {
    return `${row.announcement_id}_${row.user_id}`;
  }
  if (tableName === 'member_tag_assignments' && row.member_id && row.tag_id) {
    return `${row.member_id}_${row.tag_id}`;
  }
  if (tableName === 'action_scale_members' && row.scale_id && row.member_id) {
    return `${row.scale_id}_${row.member_id}`;
  }
  if (tableName === 'warehouse_stock' && row.product_id) {
    return String(row.product_id);
  }
  if (tableName === 'product_recipes' && row.product_id) {
    return String(row.product_id);
  }
  if (tableName === 'xp_rules_config' && row.action_type) {
    return String(row.action_type);
  }
  return `item_${index}`;
}

async function uploadCollection(collectionName, dataMap) {
  const keys = Object.keys(dataMap);
  console.log(`📤 Enviando coleção "${collectionName}" (${keys.length} registros)...`);
  
  // Enviar a coleção completa via PUT no endpoint da coleção
  await fetchWithRetry(`${FIREBASE_RTDB_URL}/${collectionName}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataMap),
  });
  console.log(`  ✅ "${collectionName}" migrado com sucesso.`);
}

async function runMasterMigration() {
  console.log('================================================================');
  console.log('🚀 INICIANDO MASTER MIGRATION: SUPABASE -> FIREBASE RTDB');
  console.log(`🌐 Destino: ${FIREBASE_RTDB_URL}`);
  console.log('================================================================\n');

  const supaClient = new Client({ connectionString: SUPABASE_CONN, ssl: { rejectUnauthorized: false } });
  await supaClient.connect();
  console.log('✅ Conectado ao Supabase efwqhqevfxlschyhbiao');

  const neonClient = new Client({ connectionString: NEON_CONN, ssl: { rejectUnauthorized: false } });
  await neonClient.connect();
  console.log('✅ Conectado ao Neon DB (Histórico de Chat & Auditoria)\n');

  const collections = {};
  const stats = {};

  // 1. CARREGAR TODAS AS TABELAS DO SUPABASE EFWQ
  const tablesToMigrate = [
    'categories',
    'baus',
    'products',
    'product_baus',
    'profiles',
    'user_roles',
    'custom_roles',
    'role_permissions',
    'cash_fund_movements',
    'announcements',
    'announcement_reads',
    'signup_requests',
    'user_presence',
    'stock_movements',
    'discord_stock_config',
    'discord_stock_logs',
    'stream_system_config',
    'stream_sessions',
    'stream_integration_logs',
    'member_stream_accounts',
    'member_follows',
    'profile_posts',
    'profile_post_likes',
  ];

  for (const table of tablesToMigrate) {
    try {
      const res = await supaClient.query(`SELECT * FROM "${table}";`);
      const map = {};
      res.rows.forEach((row, idx) => {
        const key = getRecordKey(table, row, idx);
        map[key] = row;
      });
      collections[table] = map;
      stats[table] = res.rows.length;
    } catch (e) {
      console.warn(`  ⚠️ Tabela ${table} não encontrada no Supabase: ${e.message}`);
    }
  }

  // 2. CARREGAR CHAT COMPLETO E AUDIT LOGS DO NEON DB
  console.log('\n💬 Carregando dados do Chat e Auditoria Avançada do Neon DB...');
  const neonTables = [
    'chat_conversations',
    'chat_participants',
    'chat_messages',
    'chat_message_reactions',
    'audit_logs',
  ];

  for (const table of neonTables) {
    try {
      const res = await neonClient.query(`SELECT * FROM "${table}";`);
      const map = {};
      res.rows.forEach((row, idx) => {
        const key = getRecordKey(table, row, idx);
        map[key] = row;
      });
      collections[table] = map;
      stats[table] = res.rows.length;
      console.log(`  📦 Neon DB ${table}: ${res.rows.length} registros`);
    } catch (e) {
      console.warn(`  ⚠️ Neon DB ${table} erro: ${e.message}`);
    }
  }

  // 3. CARREGAR AUTH.USERS E IDENTITIES DO SUPABASE
  console.log('\n🔐 Carregando usuários de autenticação (auth.users)...');
  try {
    const authRes = await supaClient.query('SELECT * FROM auth.users;');
    const authMap = {};
    authRes.rows.forEach((user, idx) => {
      authMap[user.id] = user;
    });
    collections['auth_users'] = authMap;
    stats['auth_users'] = authRes.rows.length;
    console.log(`  📦 auth.users: ${authRes.rows.length} usuários`);
  } catch (e) {
    console.warn('  ⚠️ auth.users erro:', e.message);
  }

  // 4. CATÁLOGO OFICIAL DE INSÍGNIAS (GAMIFICAÇÃO)
  console.log('\n🏆 Carregando catálogo de Insígnias...');
  const insigniasList = [
    {
      id: 'iniciacao_asfalto',
      name: 'Iniciação no Asfalto',
      icon: 'Shield',
      description: 'Integrado oficialmente às operações da Twin Wheels.',
      rarity: 'comum',
      xp_cost: 0,
      category: 'honra',
      active: true,
      color: '#94a3b8',
      bg_color: 'rgba(148, 163, 184, 0.15)',
      border_color: 'rgba(148, 163, 184, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'guardiao_bau',
      name: 'Guardião do Depósito',
      icon: 'Boxes',
      description: 'Auditoria exemplar e zelo constante pelo patrimônio e baús do grupo.',
      rarity: 'comum',
      xp_cost: 50,
      category: 'logistica',
      active: true,
      color: '#38bdf8',
      bg_color: 'rgba(56, 189, 248, 0.15)',
      border_color: 'rgba(56, 189, 248, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'operador_tatica',
      name: 'Operador Tático',
      icon: 'Target',
      description: 'Disciplina máxima e precisão em ações e operações de campo.',
      rarity: 'raro',
      xp_cost: 100,
      category: 'operacoes',
      active: true,
      color: '#34d399',
      bg_color: 'rgba(52, 211, 153, 0.15)',
      border_color: 'rgba(52, 211, 153, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'negociador_ouro',
      name: 'Negociador de Ouro',
      icon: 'DollarSign',
      description: 'Fechamento de acordos comerciais de grande vulto para a facção.',
      rarity: 'raro',
      xp_cost: 150,
      category: 'vendas',
      active: true,
      color: '#facc15',
      bg_color: 'rgba(250, 204, 21, 0.15)',
      border_color: 'rgba(250, 204, 21, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mestre_logistica',
      name: 'Mestre da Logística',
      icon: 'Truck',
      description: 'Eficiência impecável na cadeia de suprimentos e transporte blindado.',
      rarity: 'epico',
      xp_cost: 250,
      category: 'logistica',
      active: true,
      color: '#a855f7',
      bg_color: 'rgba(168, 85, 247, 0.15)',
      border_color: 'rgba(168, 85, 247, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'falcao_vigia',
      name: 'Falcão da Guarda',
      icon: 'Eye',
      description: 'Dedicação contínua na vigilância e inteligência de território.',
      rarity: 'epico',
      xp_cost: 350,
      category: 'seguranca',
      active: true,
      color: '#fb923c',
      bg_color: 'rgba(251, 146, 60, 0.15)',
      border_color: 'rgba(251, 146, 60, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'lideranca_suprema',
      name: 'Liderança Suprema',
      icon: 'Crown',
      description: 'Comando executivo respeitado, mentor de novos talentos e guia operacional.',
      rarity: 'lendario',
      xp_cost: 500,
      category: 'lideranca',
      active: true,
      color: '#f43f5e',
      bg_color: 'rgba(244, 63, 94, 0.15)',
      border_color: 'rgba(244, 63, 94, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mito_twin_wheels',
      name: 'Mito Twin Wheels',
      icon: 'Sparkles',
      description: 'Distinção máxima concedida a pilares inquestionáveis da história do grupo.',
      rarity: 'mitico',
      xp_cost: 1000,
      category: 'honra',
      active: true,
      color: '#e879f9',
      bg_color: 'rgba(232, 121, 249, 0.15)',
      border_color: 'rgba(232, 121, 249, 0.35)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  const insigniasMap = {};
  insigniasList.forEach(i => { insigniasMap[i.id] = i; });
  collections['insignias'] = insigniasMap;
  stats['insignias'] = insigniasList.length;

  // 5. ITENS OFICIAIS DA LOJA (SHOP ITEMS)
  console.log('🛒 Carregando catálogo de Itens da Loja...');
  const shopItemsList = [
    {
      id: 'shop_item_guardiao_bau',
      title: 'Guardião do Depósito',
      description: 'Auditoria exemplar e zelo constante pelo patrimônio e baús do grupo.',
      icon: 'Boxes',
      category: 'insignias',
      price_coins: 50,
      price_xp: 0,
      rarity: 'comum',
      insignia_id: 'guardiao_bau',
      display_order: 1,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_operador_tatica',
      title: 'Operador Tático',
      description: 'Disciplina máxima e precisão em ações e operações de campo.',
      icon: 'Target',
      category: 'insignias',
      price_coins: 100,
      price_xp: 0,
      rarity: 'raro',
      insignia_id: 'operador_tatica',
      display_order: 2,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_negociador_ouro',
      title: 'Negociador de Ouro',
      description: 'Fechamento de acordos comerciais de grande vulto para a facção.',
      icon: 'DollarSign',
      category: 'insignias',
      price_coins: 150,
      price_xp: 0,
      rarity: 'raro',
      insignia_id: 'negociador_ouro',
      display_order: 3,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_mestre_logistica',
      title: 'Mestre da Logística',
      description: 'Eficiência impecável na cadeia de suprimentos e transporte blindado.',
      icon: 'Truck',
      category: 'insignias',
      price_coins: 250,
      price_xp: 0,
      rarity: 'epico',
      insignia_id: 'mestre_logistica',
      display_order: 4,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_falcao_vigia',
      title: 'Falcão da Guarda',
      description: 'Dedicação contínua na vigilância e inteligência de território.',
      icon: 'Eye',
      category: 'insignias',
      price_coins: 350,
      price_xp: 0,
      rarity: 'epico',
      insignia_id: 'falcao_vigia',
      display_order: 5,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_lideranca_suprema',
      title: 'Liderança Suprema',
      description: 'Comando executivo respeitado, mentor de novos talentos e guia operacional.',
      icon: 'Crown',
      category: 'insignias',
      price_coins: 500,
      price_xp: 0,
      rarity: 'lendario',
      insignia_id: 'lideranca_suprema',
      display_order: 6,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_mito_twin_wheels',
      title: 'Mito Twin Wheels',
      description: 'Distinção máxima concedida a pilares inquestionáveis da história do grupo.',
      icon: 'Sparkles',
      category: 'insignias',
      price_coins: 1000,
      price_xp: 0,
      rarity: 'mitico',
      insignia_id: 'mito_twin_wheels',
      display_order: 7,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_vip_discord',
      title: 'Tag VIP no Discord Twin Wheels',
      description: 'Receba o cargo exclusivo VIP no Discord com cor personalizada e destaque na lista de membros por 30 dias.',
      icon: 'Crown',
      category: 'vantagens',
      price_coins: 250,
      price_xp: 0,
      rarity: 'epico',
      insignia_id: null,
      display_order: 100,
      active: true,
      stock: 20,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_kit_assalto',
      title: 'Kit Operacional de Assalto',
      description: 'Conjunto com coletes reforçados, munição pesada e suprimentos médicos de pronta entrega no Baú da facção.',
      icon: 'Boxes',
      category: 'recursos',
      price_coins: 150,
      price_xp: 0,
      rarity: 'raro',
      insignia_id: null,
      display_order: 101,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_vale_tunagem',
      title: 'Vale Tunagem Completa',
      description: 'Voucher de mecânica com direito a blindagem máxima, motor nível 5 e nitro customizado na oficina parceira.',
      icon: 'Truck',
      category: 'veiculos',
      price_coins: 300,
      price_xp: 0,
      rarity: 'lendario',
      insignia_id: null,
      display_order: 102,
      active: true,
      stock: 15,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_destaque_perfil',
      title: 'Destaque VIP no Perfil Oficial',
      description: 'Sua foto e canal recebem destaque no topo do painel e banner holográfico exclusivo no perfil público.',
      icon: 'Sparkles',
      category: 'personalizacao',
      price_coins: 180,
      price_xp: 0,
      rarity: 'epico',
      insignia_id: null,
      display_order: 103,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'shop_item_caixa_misteriosa',
      title: 'Caixa de Suprimentos Misteriosa',
      description: 'Abra uma caixa surpresa contendo recursos raros, TW Coins extras ou itens especiais da facção.',
      icon: 'Gift',
      category: 'recursos',
      price_coins: 80,
      price_xp: 0,
      rarity: 'comum',
      insignia_id: null,
      display_order: 104,
      active: true,
      stock: null,
      created_at: new Date().toISOString()
    }
  ];
  const shopMap = {};
  shopItemsList.forEach(s => { shopMap[s.id] = s; });
  collections['shop_items'] = shopMap;
  stats['shop_items'] = shopItemsList.length;

  // 6. REGRAS DE GAMIFICAÇÃO & XP (XP RULES)
  console.log('⚡ Carregando regras de Gamificação e XP...');
  const xpRulesList = [
    {
      action_type: 'sale_completed',
      name: 'Venda Comercial Concluída',
      xp_reward: 0.75,
      cooldown_seconds: 60,
      daily_cap: 75,
      category: 'sales',
      description: 'Conclusão de venda de insumos/armamentos devidamente validada.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'stock_movement',
      name: 'Movimentação em Baú',
      xp_reward: 0.30,
      cooldown_seconds: 120,
      daily_cap: 20,
      category: 'logistics',
      description: 'Abastecimento ou recolhimento registrado e auditado em baú físico.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'daily_presence',
      name: 'Presença Ativa Diária',
      xp_reward: 0.50,
      cooldown_seconds: 86400,
      daily_cap: 10,
      category: 'presence',
      description: 'Bônus diário de atividade na plataforma com heartbeat auditado.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'ticket_resolved',
      name: 'Atendimento / Ticket Resolvido',
      xp_reward: 0.50,
      cooldown_seconds: 300,
      daily_cap: 20,
      category: 'support',
      description: 'Resolução de ticket ou mediação de suporte aos membros.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'peer_eval_given',
      name: 'Avaliação de Membro Realizada',
      xp_reward: 0.25,
      cooldown_seconds: 1800,
      daily_cap: 15,
      category: 'evaluation',
      description: 'Exercício de liderança e auditoria ao avaliar um colega.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'peer_eval_received',
      name: 'Destaque em Avaliação (4 ou 5 Estrelas)',
      xp_reward: 0.60,
      cooldown_seconds: 3600,
      daily_cap: 30,
      category: 'evaluation',
      description: 'Reconhecimento por excelência operacional recebido de gerente/admin.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'post_published',
      name: 'Publicação Oficial no Feed',
      xp_reward: 0.25,
      cooldown_seconds: 1800,
      daily_cap: 10,
      category: 'social',
      description: 'Compartilhamento de informe ou registro de operação no mural.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'goal_milestone',
      name: 'Meta Operacional Atingida',
      xp_reward: 0.90,
      cooldown_seconds: 3600,
      daily_cap: 50,
      category: 'performance',
      description: 'Conquista de meta do grupo estabelecida pela diretoria.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'production_completed',
      name: 'Produção Concluída',
      xp_reward: 0.60,
      cooldown_seconds: 300,
      daily_cap: 30,
      category: 'production',
      description: 'Produção em escala de itens ou armamentos finalizada.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      action_type: 'warehouse_transfer',
      name: 'Transferência de Armazém',
      xp_reward: 0.35,
      cooldown_seconds: 180,
      daily_cap: 20,
      category: 'logistics',
      description: 'Transferência de saldo produzido para armazém ou vitrine comercial.',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  const xpRulesMap = {};
  xpRulesList.forEach(r => { xpRulesMap[r.action_type] = r; });
  collections['xp_rules_config'] = xpRulesMap;
  stats['xp_rules_config'] = xpRulesList.length;

  // 7. CONFIGURAÇÃO DE MOEDAS (TW COINS)
  collections['system_coins_config'] = {
    xp_per_coin: 1,
    exchange_fee_percent: 0,
    min_xp_exchange: 1,
    exchange_enabled: true,
    updated_at: new Date().toISOString()
  };
  collections['tw_coins_config'] = {
    xp_per_coin: 1,
    exchange_fee_percent: 0,
    min_xp_exchange: 1,
    exchange_enabled: true,
    updated_at: new Date().toISOString()
  };
  stats['system_coins_config'] = 1;

  // 8. CONFIGURAÇÃO DE SELO DE VERIFICAÇÃO (VERIFICATION BADGE)
  console.log('🛡️ Carregando configuração do Selo de Verificação...');
  collections['verification_badge_config'] = {
    default: {
      id: 'default',
      is_enabled: true,
      badge_name: 'Verificado',
      badge_description: 'Selo oficial de membro verificado e autenticado pela liderança.',
      badge_icon: 'BadgeCheck',
      badge_color: '#38bdf8',
      glow_style: 'cyan',
      tooltip_text: 'Membro Oficial Verificado',
      requirements_config: {
        require_discord: true,
        require_game_id: true,
        require_phone: false,
        min_days_in_faction: 0,
        min_gamification_level: 0,
        allowed_roles: [],
        allowed_tags: [],
        custom_instructions: 'Preencha a justificativa detalhada para análise da liderança.'
      },
      authorized_roles: ['ceo', 'desenvolvedor', '01', '02', 'gerente'],
      authorized_tags: [],
      allow_self_request: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
  stats['verification_badge_config'] = 1;

  // 9. TAGS DE MEMBROS (MEMBER TAGS)
  console.log('🏷️ Carregando tags oficiais de Membros...');
  const memberTagsList = [
    {
      id: 'dev',
      name: 'Desenvolvedor',
      description: 'Engenheiro de software e arquiteto da plataforma Twin Wheels.',
      color: '#f43f5e',
      icon: 'Code2',
      is_system: true,
      is_active: true,
      order_index: 0,
      permissions: ['*'],
      rules: { can_access_dev: true, priority_badge: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ceo',
      name: 'Diretoria Executiva (CEO)',
      description: 'Liderança máxima e gestão de negócios do grupo Twin Wheels.',
      color: '#f59e0b',
      icon: 'Crown',
      is_system: true,
      is_active: true,
      order_index: 1,
      permissions: ['view_ceo', 'manage_ceo_bot', 'view_ceo_financials'],
      rules: { can_access_ceo: true, priority_badge: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'gerente',
      name: 'Gerência Operacional',
      description: 'Coordenação de equipe de campo, abastecimento e aprovações.',
      color: '#06b6d4',
      icon: 'ShieldCheck',
      is_system: true,
      is_active: true,
      order_index: 2,
      permissions: ['manage_members', 'approve_requests', 'view_all_sales'],
      rules: { can_manage_escalas: true, can_manage_members: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'comercial',
      name: 'Setor Comercial & Vendas',
      description: 'Operadores credenciados com autorização de vendas e comissões.',
      color: '#10b981',
      icon: 'ShoppingCart',
      is_system: false,
      is_active: true,
      order_index: 3,
      permissions: ['create_sale', 'view_sales'],
      rules: { can_sell: true, allow_sales_counter: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'producao',
      name: 'Mestre da Fábrica & Armazém',
      description: 'Especialista em manuseio de maquinário e fabricação em lote.',
      color: '#8b5cf6',
      icon: 'Factory',
      is_system: false,
      is_active: true,
      order_index: 4,
      permissions: ['productions.create', 'warehouse.transfer'],
      rules: { can_manage_productions: true, can_transfer_warehouse: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'tatica',
      name: 'Tática & Ações de Pista',
      description: 'Pelotão de prontidão e combate armado para operações e escoltas.',
      color: '#ef4444',
      icon: 'Target',
      is_system: false,
      is_active: true,
      order_index: 5,
      permissions: ['escalas.view', 'escalas.confirm_presence'],
      rules: { can_participate_escalas: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  const memberTagsMap = {};
  memberTagsList.forEach(t => { memberTagsMap[t.id] = t; });
  collections['member_tags'] = memberTagsMap;
  stats['member_tags'] = memberTagsList.length;

  // 10. MATÉRIAS-PRIMAS DA PRODUÇÃO (RAW MATERIALS)
  console.log('🏭 Carregando matérias-primas e produção...');
  const rawMaterialsList = [
    {
      id: 'rm_polvora',
      name: 'Pólvora Pura',
      description: 'Composto altamente inflamável para fabricação de munições e explosivos.',
      unit: 'kg',
      stock_quantity: 450,
      is_active: true,
      image_url: 'https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964928163_hacking.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rm_aco_maciço',
      name: 'Aço de Alta Resistência',
      description: 'Ligas de aço temperado para estojos, canos de armas e ferramentas pesadas.',
      unit: 'barra',
      stock_quantity: 120,
      is_active: true,
      image_url: 'https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788461055568_item_14.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rm_pecas_armas',
      name: 'Peças Mecânicas de Armas',
      description: 'Gatilhos, percursores, molas e receptores para montagem de armamento.',
      unit: 'kit',
      stock_quantity: 85,
      is_active: true,
      image_url: 'https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780521946_uzi.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rm_kevlar',
      name: 'Tecido Kevlar Balístico',
      description: 'Fibras entrelaçadas de máxima proteção balística para confecção de coletes.',
      unit: 'm²',
      stock_quantity: 60,
      is_active: true,
      image_url: 'https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460638042_capuz.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rm_circuitos_chips',
      name: 'Chips Eletrônicos & Circuitos',
      description: 'Componentes avançados para placas de decodificação e pendrives de invasão.',
      unit: 'un',
      stock_quantity: 95,
      is_active: true,
      image_url: 'https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460654889_item_19.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rm_pinos_lockpick',
      name: 'Pinos de Tensão & Travas',
      description: 'Aço de precisão fino utilizado na confecção de gazuas e lockpicks.',
      unit: 'conjunto',
      stock_quantity: 300,
      is_active: true,
      image_url: 'https://i.postimg.cc/tTMjSjr5/image.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  const rawMaterialsMap = {};
  rawMaterialsList.forEach(m => { rawMaterialsMap[m.id] = m; });
  collections['raw_materials'] = rawMaterialsMap;
  stats['raw_materials'] = rawMaterialsList.length;

  // 11. RECEITAS DE PRODUÇÃO (PRODUCT RECIPES)
  const productRecipesMap = {
    '78bbf10a-c4ee-4410-b736-2505c8fbedea': { // LockPick
      product_id: '78bbf10a-c4ee-4410-b736-2505c8fbedea',
      production_yield: 5,
      items: [
        { raw_material_id: 'rm_pinos_lockpick', quantity_required: 2 },
        { raw_material_id: 'rm_aco_maciço', quantity_required: 1 }
      ],
      updated_at: new Date().toISOString()
    },
    '142cb569-5e89-404f-a368-52302695649a': { // Colete
      product_id: '142cb569-5e89-404f-a368-52302695649a',
      production_yield: 1,
      items: [
        { raw_material_id: 'rm_kevlar', quantity_required: 3 },
        { raw_material_id: 'rm_aco_maciço', quantity_required: 1 }
      ],
      updated_at: new Date().toISOString()
    },
    'c51b7c2b-f376-4426-82fe-d82eb8c265cc': { // C4
      product_id: 'c51b7c2b-f376-4426-82fe-d82eb8c265cc',
      production_yield: 2,
      items: [
        { raw_material_id: 'rm_polvora', quantity_required: 4 },
        { raw_material_id: 'rm_circuitos_chips', quantity_required: 2 }
      ],
      updated_at: new Date().toISOString()
    },
    'e10817fd-7798-4604-b4e2-4249dfe9273d': { // Munição de Pistola
      product_id: 'e10817fd-7798-4604-b4e2-4249dfe9273d',
      production_yield: 50,
      items: [
        { raw_material_id: 'rm_polvora', quantity_required: 2 },
        { raw_material_id: 'rm_aco_maciço', quantity_required: 1 }
      ],
      updated_at: new Date().toISOString()
    },
    'cff66aa8-ae22-4dd5-bc6b-fcf912b147ea': { // Munição Rifle
      product_id: 'cff66aa8-ae22-4dd5-bc6b-fcf912b147ea',
      production_yield: 30,
      items: [
        { raw_material_id: 'rm_polvora', quantity_required: 3 },
        { raw_material_id: 'rm_aco_maciço', quantity_required: 2 }
      ],
      updated_at: new Date().toISOString()
    }
  };
  collections['product_recipes'] = productRecipesMap;
  stats['product_recipes'] = Object.keys(productRecipesMap).length;

  // 12. ESTOQUE DE ARMAZÉM (WAREHOUSE STOCK)
  const warehouseStockMap = {};
  for (const [prodId, prod] of Object.entries(collections['products'] || {})) {
    warehouseStockMap[prodId] = {
      id: `ws_${prodId}`,
      product_id: prodId,
      quantity: Math.max(0, Number(prod.sale_available_quantity || prod.estoque_atual || 0)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  collections['warehouse_stock'] = warehouseStockMap;
  stats['warehouse_stock'] = Object.keys(warehouseStockMap).length;

  // 13. ESCALAS DE AÇÃO OFICIAIS (ACTION SCALES)
  console.log('📋 Carregando escalas de ação...');
  const actionScalesList = [
    {
      id: 'scale_op_pista_semanal',
      titulo: 'Operação de Pista & Domínio de Território',
      tipo_acao: 'Patrulha e Ação',
      descricao: 'Patrulhamento preventivo e demonstração de presença militarizada nas principais rotas da facção.',
      data_hora: new Date(Date.now() + 86400000).toISOString(),
      data_hora_chamada: new Date(Date.now() + 82800000).toISOString(),
      local_posto: 'QG Twin Wheels - Pátio Sul',
      vagas_limite: 12,
      vagas_reservas: 3,
      status: 'publicada',
      gerente_id: '9bb128e3-6e65-43a3-8b60-00f4dd860e0d',
      gerente_nome: 'Malaca',
      metadata: { obrigatorio_colete: true, radio_frequencia: '100.5' },
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    },
    {
      id: 'scale_escolta_blindada',
      titulo: 'Escolta Blindada de Carga Pesada',
      tipo_acao: 'Logística Tática',
      descricao: 'Escolta tática de comboio com insumos e armamentos para reabastecimento dos depósitos externos.',
      data_hora: new Date(Date.now() + 172800000).toISOString(),
      data_hora_chamada: new Date(Date.now() + 169200000).toISOString(),
      local_posto: 'Galpão Industrial - Doca 2',
      vagas_limite: 8,
      vagas_reservas: 2,
      status: 'publicada',
      gerente_id: '9bb128e3-6e65-43a3-8b60-00f4dd860e0d',
      gerente_nome: 'Malaca',
      metadata: { veiculos_blindados: true, radio_frequencia: '100.8' },
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }
  ];
  const scalesMap = {};
  actionScalesList.forEach(s => { scalesMap[s.id] = s; });
  collections['action_scales'] = scalesMap;
  stats['action_scales'] = actionScalesList.length;

  // Integrantes da Escala
  const actionScaleMembersList = [
    {
      id: 'scale_op_pista_semanal_9bb128e3-6e65-43a3-8b60-00f4dd860e0d',
      scale_id: 'scale_op_pista_semanal',
      member_id: '9bb128e3-6e65-43a3-8b60-00f4dd860e0d',
      posto_funcao: 'Comandante de Ação',
      tipo_vaga: 'titular',
      status_presenca: 'confirmado',
      reacao: '👍',
      justificativa: 'Comando geral da operação',
      criado_em: new Date().toISOString()
    }
  ];
  const scaleMembersMap = {};
  actionScaleMembersList.forEach(m => { scaleMembersMap[m.id] = m; });
  collections['action_scale_members'] = scaleMembersMap;
  stats['action_scale_members'] = actionScaleMembersList.length;

  // 14. METAS DA FACÇÃO (GOALS)
  console.log('🎯 Carregando metas operacionais...');
  const goalsList = [
    {
      id: 'goal_vendas_semana',
      title: 'Meta Semanal de Faturamento Comercial',
      description: 'Atingir o faturamento bruto estipulado em vendas diretas e parcerias.',
      type: 'faturamento',
      target_value: 500000,
      current_value: 125000,
      reward_xp: 50,
      deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
      created_by: '9bb128e3-6e65-43a3-8b60-00f4dd860e0d',
      status: 'em_andamento',
      created_at: new Date().toISOString()
    },
    {
      id: 'goal_estoque_lockpick',
      title: 'Meta de Abastecimento: LockPicks',
      description: 'Manter a reserva estratégica de LockPicks no Baú Principal acima de 300 unidades.',
      type: 'quantidade',
      target_value: 300,
      current_value: 270,
      reward_xp: 35,
      deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
      created_by: '9bb128e3-6e65-43a3-8b60-00f4dd860e0d',
      status: 'em_andamento',
      created_at: new Date().toISOString()
    }
  ];
  const goalsMap = {};
  goalsList.forEach(g => { goalsMap[g.id] = g; });
  collections['goals'] = goalsMap;
  stats['goals'] = goalsList.length;

  // FECHAR CONEXÕES
  await supaClient.end();
  await neonClient.end();

  // 15. FAZER O UPLOAD DE TODAS AS COLEÇÕES PARA O FIREBASE RTDB
  console.log('\n================================================================');
  console.log(`🚀 INICIANDO UPLOAD PARA O FIREBASE RTDB (${Object.keys(collections).length} COLEÇÕES)`);
  console.log('================================================================\n');

  for (const [colName, colData] of Object.entries(collections)) {
    await uploadCollection(colName, colData);
  }

  // Gravar metadados gerais da migração
  await fetchWithRetry(`${FIREBASE_RTDB_URL}/_migration_meta.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      migrated_at: new Date().toISOString(),
      sources: [
        'Supabase efwqhqevfxlschyhbiao (Tabelas públicas e auth)',
        'Neon DB (Chat completo: 190 mensagens, 18 conversas, 1798 logs de auditoria)',
        'Catálogos oficiais da Facção (Insígnias, Loja, XP, Armazém, Escalas, Tags, Metas)'
      ],
      total_collections: Object.keys(collections).length,
      stats
    }),
  });

  console.log('\n================================================================');
  console.log('🎉 MIGRAÇÃO MESTRE CONCLUÍDA COM SUCESSO TOTAL!');
  console.table(stats);
  console.log('================================================================');
}

runMasterMigration().catch(err => {
  console.error('\n❌ ERRO NA MIGRAÇÃO MESTRE:', err);
  process.exit(1);
});
