import postgres from "postgres";
import { clearSession, updateSession, useSession } from "@tanstack/react-start/server";
import { can, type AppLevel } from "@/lib/permissions";
import type {
  AppUser,
  AuditLog,
  AuthState,
  Category,
  Goal,
  LoginPlayer,
  Member,
  Movement,
  PendingSignupRequest,
  Product,
  Profile,
  Sale,
  SignupRequestStatus,
} from "@/lib/app-types";

type AppSessionData = {
  userId?: string;
};

type LoginResult = {
  status: "approved" | "pendente" | "rejeitado" | "invalid";
  auth: AuthState;
};

type RegisterPayload = {
  nome: string;
  nickname?: string | null;
  telefone: string;
  password: string;
};

type ReviewPayload = {
  requestId: string;
  approve: boolean;
  nivel: AppLevel;
  reason?: string;
};

type MovementPayload = {
  productId: string;
  type: "entrada" | "saida";
  quantity: number;
  reason?: string;
};

type SalePayload = {
  productId: string;
  quantity: number;
  unitPrice: number;
  buyerName: string;
  paymentMethod: string;
  notes?: string;
};

type MembershipRow = {
  user_id: string;
  email: string | null;
  profile_id: string | null;
  nome: string | null;
  nickname: string | null;
  avatar_url: string | null;
  profile_status: string | null;
  data_entrada: string | null;
  nivel: AppLevel | null;
  signup_status: SignupRequestStatus | null;
};

const APP_SESSION_NAME = "twtools-session";

declare global {
  var __twtoolsSql: postgres.Sql | undefined;
}

function getSessionPassword() {
  const password = process.env["APP_SESSION_SECRET"];

  if (!password) {
    throw new Error("APP_SESSION_SECRET não configurada.");
  }

  return password;
}

function getDatabaseUrl() {
  const databaseUrl = process.env["DATABASE_URL"];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada.");
  }

  return databaseUrl;
}

function getSql() {
  if (!globalThis.__twtoolsSql) {
    globalThis.__twtoolsSql = postgres(getDatabaseUrl(), {
      ssl: "require",
      max: 10,
    });
  }

  return globalThis.__twtoolsSql;
}

function getSessionConfig() {
  return {
    password: getSessionPassword(),
    name: APP_SESSION_NAME,
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env["NODE_ENV"] === "production",
    },
  };
}

function toInternalPassword(password: string) {
  return `twtools:${password.trim()}:v1!`;
}

function phoneToEmail(telefone: string) {
  return `registro-${telefone.replace(/\D/g, "")}@twtools.local`;
}

async function loadMembership(sql: postgres.Sql, userId: string): Promise<AuthState> {
  const rows = await sql<MembershipRow[]>`
    select
      u.id::text as user_id,
      u.email,
      p.id::text as profile_id,
      p.nome,
      p.nickname,
      p.avatar_url,
      p.status as profile_status,
      p.data_entrada::text,
      r.nivel::text as nivel,
      sr.status::text as signup_status
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.user_roles r on r.user_id = u.id
    left join public.signup_requests sr on sr.user_id = u.id
    where u.id = ${userId}::uuid
      and u.deleted_at is null
    limit 1
  `;

  const row = rows[0];
  if (!row) {
    return {
      user: null,
      profile: null,
      level: null,
      signupRequestStatus: null,
      approvedAccess: false,
    };
  }

  const user: AppUser = {
    id: row.user_id,
    email: row.email,
  };

  const profile: Profile | null = row.profile_id
    ? {
        id: row.profile_id,
        user_id: row.user_id,
        nome: row.nome ?? "Membro",
        nickname: row.nickname,
        avatar_url: row.avatar_url,
        status: row.profile_status ?? "ativo",
        data_entrada: row.data_entrada ?? new Date().toISOString().slice(0, 10),
      }
    : null;

  const level = row.nivel ?? null;
  const approvedAccess = Boolean(profile && level && profile.status === "ativo");

  return {
    user,
    profile,
    level,
    signupRequestStatus: approvedAccess ? null : row.signup_status ?? null,
    approvedAccess,
  };
}

async function requireApprovedAuth(sql: postgres.Sql) {
  const session = await useSession<AppSessionData>(getSessionConfig());
  const userId = session.data.userId;

  if (!userId) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const auth = await loadMembership(sql, userId);

  if (!auth.user || !auth.approvedAccess || !auth.level || !auth.profile) {
    throw new Error("Acesso não autorizado.");
  }

  return {
    ...auth,
    user: auth.user,
    profile: auth.profile,
    level: auth.level,
  };
}

export async function getCurrentAuthState() {
  const session = await useSession<AppSessionData>(getSessionConfig());
  const userId = session.data.userId;

  if (!userId) {
    return {
      user: null,
      profile: null,
      level: null,
      signupRequestStatus: null,
      approvedAccess: false,
    } satisfies AuthState;
  }

  return loadMembership(getSql(), userId);
}

export async function loginPlayer(playerId: string, password: string): Promise<LoginResult> {
  const sql = getSql();
  const internalPassword = toInternalPassword(password);
  const rows = await sql<
    Array<MembershipRow & { password_matches: boolean }>
  >`
    select
      u.id::text as user_id,
      u.email,
      p.id::text as profile_id,
      p.nome,
      p.nickname,
      p.avatar_url,
      p.status as profile_status,
      p.data_entrada::text,
      r.nivel::text as nivel,
      sr.status::text as signup_status,
      (u.encrypted_password = extensions.crypt(${internalPassword}, u.encrypted_password)) as password_matches
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.user_roles r on r.user_id = u.id
    left join public.signup_requests sr on sr.user_id = u.id
    where u.id = ${playerId}::uuid
      and u.deleted_at is null
    limit 1
  `;

  const row = rows[0];
  if (!row || !row.password_matches) {
    return {
      status: "invalid",
      auth: {
        user: null,
        profile: null,
        level: null,
        signupRequestStatus: null,
        approvedAccess: false,
      },
    };
  }

  const auth = await loadMembership(sql, row.user_id);

  if (!auth.approvedAccess) {
    await clearSession({ name: APP_SESSION_NAME });
    return {
      status: auth.signupRequestStatus === "rejeitado" ? "rejeitado" : "pendente",
      auth,
    };
  }

  await updateSession<AppSessionData>(getSessionConfig(), { userId: row.user_id });

  return {
    status: "approved",
    auth,
  };
}

export async function logoutPlayer() {
  await clearSession({ name: APP_SESSION_NAME });
  return { success: true };
}

export async function registerPlayer(payload: RegisterPayload) {
  const sql = getSql();
  const nome = payload.nome.trim();
  const nickname = payload.nickname?.trim() || null;
  const telefone = payload.telefone.trim();
  const email = phoneToEmail(telefone);
  const internalPassword = toInternalPassword(payload.password);

  await sql.begin(async (tx) => {
    const existingRows = await tx<
      Array<{ user_id: string; approved: boolean }>
    >`
      select
        u.id::text as user_id,
        (p.user_id is not null and r.user_id is not null and p.status = 'ativo') as approved
      from auth.users u
      left join public.profiles p on p.user_id = u.id
      left join public.user_roles r on r.user_id = u.id
      where u.email = ${email}
        and u.deleted_at is null
      limit 1
    `;

    const existing = existingRows[0];
    let userId = existing?.user_id ?? null;

    if (existing?.approved) {
      throw new Error("Já existe um jogador ativo para este telefone.");
    }

    if (!userId) {
      const inserted = await tx<Array<{ id: string }>>`
        insert into auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        )
        values (
          '00000000-0000-0000-0000-000000000000'::uuid,
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          ${email},
          extensions.crypt(${internalPassword}, extensions.gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          ${JSON.stringify({ nome, nickname, telefone })}::jsonb,
          now(),
          now()
        )
        returning id::text
      `;

      userId = inserted[0]?.id ?? null;

      if (!userId) {
        throw new Error("Não foi possível criar o jogador.");
      }

      await tx`
        insert into auth.identities (
          provider_id,
          user_id,
          identity_data,
          provider,
          created_at,
          updated_at
        )
        values (
          ${userId},
          ${userId}::uuid,
          ${JSON.stringify({ sub: userId, email })}::jsonb,
          'email',
          now(),
          now()
        )
        on conflict (provider_id, provider) do nothing
      `;
    } else {
      await tx`
        update auth.users
        set
          encrypted_password = extensions.crypt(${internalPassword}, extensions.gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = ${JSON.stringify({ nome, nickname, telefone })}::jsonb,
          updated_at = now()
        where id = ${userId}::uuid
      `;
    }

    await tx`
      insert into public.signup_requests (
        user_id,
        nome,
        nickname,
        telefone,
        status,
        requested_at,
        reviewed_at,
        reviewed_by,
        review_reason,
        created_at,
        updated_at
      )
      values (
        ${userId}::uuid,
        ${nome || "Membro"},
        ${nickname},
        ${telefone},
        'pendente'::public.signup_request_status,
        now(),
        null,
        null,
        null,
        now(),
        now()
      )
      on conflict (user_id) do update
      set
        nome = excluded.nome,
        nickname = excluded.nickname,
        telefone = excluded.telefone,
        status = 'pendente'::public.signup_request_status,
        requested_at = now(),
        reviewed_at = null,
        reviewed_by = null,
        review_reason = null,
        updated_at = now()
    `;
  });

  return { status: "pendente" as const };
}

export async function listLoginPlayers() {
  const sql = getSql();
  const rows = await sql<LoginPlayer[]>`
    select
      p.user_id::text as user_id,
      p.nome,
      p.nickname,
      u.email as login_email
    from public.profiles p
    join public.user_roles r on r.user_id = p.user_id
    join auth.users u on u.id = p.user_id
    where p.status = 'ativo'
      and u.deleted_at is null
    order by lower(coalesce(p.nickname, p.nome))
  `;

  return rows;
}

export async function listCategories() {
  const sql = getSql();
  await requireApprovedAuth(sql);
  return sql<Category[]>`
    select id::text, nome, descricao, ativo, created_at::text
    from public.categories
    order by nome
  `;
}

export async function listProducts() {
  const sql = getSql();
  await requireApprovedAuth(sql);
  return sql<Product[]>`
    select
      id::text,
      nome,
      descricao,
      categoria_id::text,
      unidade,
      estoque_atual,
      estoque_minimo,
      preco_sugerido,
      ativo,
      created_at::text,
      updated_at::text
    from public.products
    order by nome
  `;
}

export async function listMovements() {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (can(auth.level, "view_all_movements")) {
    return sql<Movement[]>`
      select
        id::text,
        product_id::text,
        user_id::text,
        type::text,
        quantity,
        previous_balance,
        resulting_balance,
        reason,
        sale_id::text,
        reversal_of::text,
        created_at::text
      from public.stock_movements
      order by created_at desc
      limit 1000
    `;
  }

  return sql<Movement[]>`
    select
      id::text,
      product_id::text,
      user_id::text,
      type::text,
      quantity,
      previous_balance,
      resulting_balance,
      reason,
      sale_id::text,
      reversal_of::text,
      created_at::text
    from public.stock_movements
    where user_id = ${auth.user.id}::uuid
    order by created_at desc
    limit 1000
  `;
}

export async function listSales() {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (can(auth.level, "view_all_sales")) {
    return sql<Sale[]>`
      select
        id::text,
        product_id::text,
        seller_id::text,
        buyer_name,
        quantity,
        unit_price,
        total_price,
        payment_method,
        notes,
        status::text,
        created_at::text
      from public.sales
      order by created_at desc
      limit 1000
    `;
  }

  return sql<Sale[]>`
    select
      id::text,
      product_id::text,
      seller_id::text,
      buyer_name,
      quantity,
      unit_price,
      total_price,
      payment_method,
      notes,
      status::text,
      created_at::text
    from public.sales
    where seller_id = ${auth.user.id}::uuid
    order by created_at desc
    limit 1000
  `;
}

export async function listGoals() {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (can(auth.level, "manage_goals")) {
    return sql<Goal[]>`
      select
        id::text,
        user_id::text,
        type::text,
        target_value,
        period_start::text,
        period_end::text,
        descricao,
        created_at::text
      from public.goals
      order by period_end desc
    `;
  }

  return sql<Goal[]>`
    select
      id::text,
      user_id::text,
      type::text,
      target_value,
      period_start::text,
      period_end::text,
      descricao,
      created_at::text
    from public.goals
    where user_id = ${auth.user.id}::uuid
    order by period_end desc
  `;
}

export async function listMembers() {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (!can(auth.level, "view_members")) {
    throw new Error("Sem permissão para visualizar membros.");
  }

  return sql<Member[]>`
    select
      p.user_id::text as user_id,
      p.nome,
      p.nickname,
      p.status,
      p.data_entrada::text,
      p.created_at::text,
      r.nivel::text as nivel
    from public.profiles p
    left join public.user_roles r on r.user_id = p.user_id
    order by p.created_at asc
  `;
}

export async function listPendingSignupRequests() {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (!can(auth.level, "view_members")) {
    throw new Error("Sem permissão para visualizar registros pendentes.");
  }

  return sql<PendingSignupRequest[]>`
    select
      sr.id::text,
      sr.user_id::text,
      sr.nome,
      sr.nickname,
      sr.telefone,
      u.email,
      sr.requested_at::text,
      sr.status::text
    from public.signup_requests sr
    left join auth.users u on u.id = sr.user_id
    where sr.status = 'pendente'::public.signup_request_status
    order by sr.requested_at asc
  `;
}

export async function listAuditLogs() {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (!can(auth.level, "view_audit")) {
    throw new Error("Sem permissão para visualizar a auditoria.");
  }

  return sql<AuditLog[]>`
    select
      id::text,
      user_id::text,
      action,
      entity,
      entity_id::text,
      old_data,
      new_data,
      created_at::text
    from public.audit_logs
    order by created_at desc
    limit 300
  `;
}

export async function reviewSignupRequest(payload: ReviewPayload) {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (!can(auth.level, "manage_members")) {
    throw new Error("Sem permissão para aprovar cadastros.");
  }

  if (
    auth.level !== "01" &&
    auth.level !== "02" &&
    ["01", "02", "gerente"].includes(payload.nivel)
  ) {
    throw new Error("Somente 01/02 podem aprovar com este nível.");
  }

  await sql.begin(async (tx) => {
    const requests = await tx<
      Array<{
        id: string;
        user_id: string;
        nome: string;
        nickname: string | null;
        status: SignupRequestStatus;
      }>
    >`
      select id::text, user_id::text, nome, nickname, status::text
      from public.signup_requests
      where id = ${payload.requestId}::uuid
      for update
    `;

    const request = requests[0];
    if (!request) {
      throw new Error("Solicitação não encontrada.");
    }

    if (request.status === "aprovado") {
      throw new Error("Solicitação já aprovada.");
    }

    if (payload.approve) {
      const oldLevelRows = await tx<Array<{ nivel: AppLevel | null }>>`
        select nivel::text
        from public.user_roles
        where user_id = ${request.user_id}::uuid
        limit 1
      `;
      const oldLevel = oldLevelRows[0]?.nivel ?? null;

      await tx`
        insert into public.profiles (user_id, nome, nickname, status)
        values (${request.user_id}::uuid, ${request.nome}, ${request.nickname}, 'ativo')
        on conflict (user_id) do update
        set
          nome = excluded.nome,
          nickname = excluded.nickname,
          status = 'ativo',
          updated_at = now()
      `;

      await tx`
        insert into public.user_roles (user_id, nivel)
        values (${request.user_id}::uuid, ${payload.nivel}::public.app_level)
        on conflict (user_id) do update
        set
          nivel = excluded.nivel,
          updated_at = now()
      `;

      await tx`
        update public.signup_requests
        set
          status = 'aprovado'::public.signup_request_status,
          reviewed_at = now(),
          reviewed_by = ${auth.user.id}::uuid,
          review_reason = null,
          updated_at = now()
        where id = ${payload.requestId}::uuid
      `;

      await tx`
        insert into public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
        values (
          ${auth.user.id}::uuid,
          'approve_signup',
          'signup_requests',
          ${request.user_id}::uuid,
          ${JSON.stringify({ status: request.status, nivel: oldLevel })}::jsonb,
          ${JSON.stringify({ status: 'aprovado', nivel: payload.nivel })}::jsonb
        )
      `;

      return;
    }

    const trimmedReason = payload.reason?.trim() || null;

    await tx`
      update public.signup_requests
      set
        status = 'rejeitado'::public.signup_request_status,
        reviewed_at = now(),
        reviewed_by = ${auth.user.id}::uuid,
        review_reason = ${trimmedReason},
        updated_at = now()
      where id = ${payload.requestId}::uuid
    `;

    await tx`
      insert into public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
      values (
        ${auth.user.id}::uuid,
        'reject_signup',
        'signup_requests',
        ${request.user_id}::uuid,
        ${JSON.stringify({ status: request.status })}::jsonb,
        ${JSON.stringify({ status: 'rejeitado', motivo: trimmedReason })}::jsonb
      )
    `;
  });

  return { success: true };
}

export async function createMovement(payload: MovementPayload) {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (!can(auth.level, "create_movement")) {
    throw new Error("Seu nível não permite registrar movimentações.");
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    throw new Error("A quantidade deve ser maior que zero.");
  }

  await sql.begin(async (tx) => {
    const products = await tx<
      Array<{ estoque_atual: number; ativo: boolean }>
    >`
      select estoque_atual, ativo
      from public.products
      where id = ${payload.productId}::uuid
      for update
    `;
    const product = products[0];

    if (!product) {
      throw new Error("Produto inválido.");
    }

    if (!product.ativo) {
      throw new Error("Produto inativo.");
    }

    const previousBalance = Number(product.estoque_atual);
    const resultingBalance =
      payload.type === "entrada"
        ? previousBalance + payload.quantity
        : previousBalance - payload.quantity;

    if (resultingBalance < 0) {
      throw new Error(
        `Estoque insuficiente: saldo atual ${previousBalance} e saída de ${payload.quantity}.`,
      );
    }

    await tx`
      update public.products
      set estoque_atual = ${resultingBalance}
      where id = ${payload.productId}::uuid
    `;

    const inserted = await tx<Array<{ id: string }>>`
      insert into public.stock_movements (
        product_id,
        user_id,
        type,
        quantity,
        previous_balance,
        resulting_balance,
        reason
      )
      values (
        ${payload.productId}::uuid,
        ${auth.user.id}::uuid,
        ${payload.type}::public.movement_type,
        ${payload.quantity},
        ${previousBalance},
        ${resultingBalance},
        ${payload.reason?.trim() || "Sem observação"}
      )
      returning id::text
    `;

    if (!inserted[0]) {
      throw new Error("Falha ao registrar movimentação.");
    }

    await tx`
      insert into public.audit_logs (user_id, action, entity, entity_id, new_data)
      values (
        ${auth.user.id}::uuid,
        'create_movement',
        'stock_movements',
        ${inserted[0].id}::uuid,
        ${JSON.stringify({ type: payload.type, quantity: payload.quantity, product_id: payload.productId })}::jsonb
      )
    `;
  });

  return { success: true };
}

export async function createSale(payload: SalePayload) {
  const sql = getSql();
  const auth = await requireApprovedAuth(sql);

  if (!can(auth.level, "create_sale")) {
    throw new Error("Seu nível não permite registrar vendas.");
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    throw new Error("A quantidade deve ser maior que zero.");
  }

  if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) {
    throw new Error("Valor unitário inválido.");
  }

  await sql.begin(async (tx) => {
    const products = await tx<
      Array<{ estoque_atual: number; ativo: boolean }>
    >`
      select estoque_atual, ativo
      from public.products
      where id = ${payload.productId}::uuid
      for update
    `;
    const product = products[0];

    if (!product) {
      throw new Error("Produto inválido.");
    }

    if (!product.ativo) {
      throw new Error("Produto inativo.");
    }

    const previousBalance = Number(product.estoque_atual);
    const resultingBalance = previousBalance - payload.quantity;

    if (resultingBalance < 0) {
      throw new Error("Estoque insuficiente para registrar a venda.");
    }

    const total = payload.quantity * payload.unitPrice;

    const sales = await tx<Array<{ id: string }>>`
      insert into public.sales (
        product_id,
        seller_id,
        buyer_name,
        quantity,
        unit_price,
        total_price,
        payment_method,
        notes
      )
      values (
        ${payload.productId}::uuid,
        ${auth.user.id}::uuid,
        ${payload.buyerName.trim() || "Não informado"},
        ${payload.quantity},
        ${payload.unitPrice},
        ${total},
        ${payload.paymentMethod},
        ${payload.notes?.trim() || ""}
      )
      returning id::text
    `;

    if (!sales[0]) {
      throw new Error("Falha ao registrar venda.");
    }

    await tx`
      update public.products
      set estoque_atual = ${resultingBalance}
      where id = ${payload.productId}::uuid
    `;

    await tx`
      insert into public.stock_movements (
        product_id,
        user_id,
        type,
        quantity,
        previous_balance,
        resulting_balance,
        reason,
        sale_id
      )
      values (
        ${payload.productId}::uuid,
        ${auth.user.id}::uuid,
        'saida'::public.movement_type,
        ${payload.quantity},
        ${previousBalance},
        ${resultingBalance},
        'Venda registrada',
        ${sales[0].id}::uuid
      )
    `;

    await tx`
      insert into public.audit_logs (user_id, action, entity, entity_id, new_data)
      values (
        ${auth.user.id}::uuid,
        'create_sale',
        'sales',
        ${sales[0].id}::uuid,
        ${JSON.stringify({ quantity: payload.quantity, total })}::jsonb
      )
    `;
  });

  return { success: true };
}