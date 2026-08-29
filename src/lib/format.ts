export const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );

export function formatCurrencyInput(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "";
  const numericString = typeof val === "number"
    ? Math.round(val * 100).toString()
    : String(val).replace(/\D/g, "");
  if (!numericString) return "";
  const cents = parseInt(numericString, 10);
  if (isNaN(cents)) return "";
  const realValue = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(realValue);
}

export function parseCurrencyInput(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export const compactCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

export const num = (value: number | null | undefined, digits = 0) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));

export const dateTime = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";

export const dateOnly = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
    : "—";

export const formatTimeOnly = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const d = new Date(value);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return timeStr;
  if (isYesterday) return `Ontem ${timeStr}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${timeStr}`;
};

export const isTodayDate = (value: string | Date | null | undefined) => {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
};

export const isYesterdayDate = (value: string | Date | null | undefined) => {
  if (!value) return false;
  const yesterday = new Date(Date.now() - 86400000);
  return new Date(value).toDateString() === yesterday.toDateString();
};

/**
 * Formata o tempo decorrido desde que o usuário ficou ausente (ex: "Ausente há 15m", "Ausente há 2h", "Ausente há 1d")
 */
export function formatAusenteDuration(updatedAtOrLastSeen?: string | Date | null): string {
  if (!updatedAtOrLastSeen) return "Ausente";
  const start = new Date(updatedAtOrLastSeen).getTime();
  if (isNaN(start)) return "Ausente";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - start) / 60000));

  if (diffMinutes < 1) return "Ausente agora";
  if (diffMinutes < 60) return `Ausente há ${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;
  if (diffHours < 24) {
    return remMinutes > 0 ? `Ausente há ${diffHours}h ${remMinutes}m` : `Ausente há ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Ausente há ${diffDays}d`;
}

/**
 * Formata a data/hora do último acesso do usuário quando ele está offline (ex: "Visto por último hoje às 15:30", "Visto por último ontem às 22:10", etc.)
 */
export function formatLastSeen(lastSeenOrUpdatedAt?: string | Date | null): string {
  if (!lastSeenOrUpdatedAt) return "Offline";
  const d = new Date(lastSeenOrUpdatedAt);
  if (isNaN(d.getTime())) return "Offline";

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (isToday) {
    return `Visto por último hoje às ${timeStr}`;
  }
  if (isYesterday) {
    return `Visto por último ontem às ${timeStr}`;
  }
  const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `Visto por último em ${dateStr} às ${timeStr}`;
}

/**
 * Retorna o texto formatado completo do status de presença do usuário
 */
export function formatUserPresenceText(
  status?: string | null,
  lastSeen?: string | Date | null,
  updatedAt?: string | Date | null
): string {
  if (status === "online") return "Online";
  if (status === "ausente") return formatAusenteDuration(updatedAt || lastSeen);
  if (status === "ocupado") return "Ocupado";
  return formatLastSeen(lastSeen || updatedAt);
}

export const dayKey = (value: string | Date) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const dayLabel = (key: string) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

export type RangeKey = "hoje" | "7d" | "30d" | "mes" | "tudo";

export const RANGE_LABEL: Record<RangeKey, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  mes: "Este mês",
  tudo: "Tudo",
};

export function rangeStart(range: RangeKey): Date | null {
  const now = new Date();
  switch (range) {
    case "hoje":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 6 * 86400000);
    case "30d":
      return new Date(now.getTime() - 29 * 86400000);
    case "mes":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

export function inRange(value: string, range: RangeKey) {
  const start = rangeStart(range);
  if (!start) return true;
  return new Date(value).getTime() >= start.getTime();
}

export function previousWindow(range: RangeKey): { start: Date; end: Date } | null {
  const start = rangeStart(range);
  if (!start) return null;
  const now = new Date();
  const span = now.getTime() - start.getTime();
  return { start: new Date(start.getTime() - span), end: start };
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "").slice(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

export function formatSecondsToHoursAndMinutes(seconds: number | null | undefined): string {
  const sec = Math.max(0, Math.floor(Number(seconds || 0)));
  if (sec === 0) return "0 min";
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatSessionDuration(onlineSinceISO?: string | null): string {
  if (!onlineSinceISO) return "0 min";
  const since = new Date(onlineSinceISO).getTime();
  if (isNaN(since)) return "0 min";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - since) / 1000));
  if (diffSeconds > 86400) {
    return formatSecondsToHoursAndMinutes(diffSeconds % 86400);
  }
  return formatSecondsToHoursAndMinutes(diffSeconds);
}

export function errorMessage(error: unknown, fallback = "Não foi possível concluir a operação.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  const anyErr = error as { message?: string; details?: string };
  return anyErr.message || anyErr.details || fallback;
}

export function humanizeAuditLog(
  log: any,
  membersList: any[] = [],
  productsList: any[] = [],
  bausList: any[] = []
): { title: string; description: string; tag: string; tagColor: string } {
  const data = log.new_data || log.old_data || {};
  const old = log.old_data || {};

  const actor = log.user_id
    ? membersList.find((m) => m.user_id === log.user_id)?.nickname ||
      membersList.find((m) => m.user_id === log.user_id)?.nome ||
      data.user_name ||
      "Membro"
    : data.user_name || "Sistema";

  switch (log.action) {
    case "login": {
      return {
        title: "Acesso à Plataforma (Login)",
        description: `O membro ${actor} realizou login na plataforma Twin Wheels via Discord.`,
        tag: "Login",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "logout": {
      const duration = data.duration_formatted ? ` Tempo de permanência: ${data.duration_formatted}.` : "";
      return {
        title: "Saída da Plataforma (Logout)",
        description: `O membro ${actor} saiu da plataforma.${duration}`,
        tag: "Logout",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "submit_signup": {
      const nomePlayer = data.nome || "Novo Jogador";
      const gameId = data.game_id ? ` (ID: ${data.game_id})` : "";
      const tel = data.telefone ? ` · Telefone: ${data.telefone}` : "";
      return {
        title: "Solicitação de Cadastro",
        description: `O jogador ${nomePlayer}${gameId} enviou uma nova solicitação de cadastro para o grupo${tel}.`,
        tag: "Solicitação",
        tagColor: "border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold",
      };
    }

    case "create_movement": {
      const type = data.type === "entrada" ? "Entrada" : "Saída";
      const qty = num(data.quantity);

      let prodName = data.product_name;
      if (!prodName || /^[0-9a-fA-F-]{36}$/.test(prodName)) {
        const found = productsList.find((p) => p.id === data.product_id);
        prodName = found?.nome || "Produto";
      }

      const bauName = data.bau_name || "Baú Caixote";
      const motivo = data.reason ? ` Motivo: "${data.reason}".` : "";
      const res = data.resulting_balance !== undefined ? ` Saldo resultante: ${num(data.resulting_balance)}.` : "";

      return {
        title: `${type} de Estoque (${bauName})`,
        description: `O membro ${actor} lançou uma ${type.toLowerCase()} de ${qty}x ${prodName} no ${bauName}.${motivo}${res}`,
        tag: data.type === "entrada" ? "Entrada (+)" : "Saída (-)",
        tagColor: data.type === "entrada" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold" : "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "reverse_movement": {
      return {
        title: "Estorno de Movimentação",
        description: `O gestor ${actor} estornou um lançamento prévio de estoque, restaurando o saldo.`,
        tag: "Estorno",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "transfer_between_chests": {
      const prod = data.product_name || "Produto";
      const from = data.from_bau_name || "Baú Origem";
      const to = data.to_bau_name || "Baú Destino";
      const qty = num(data.quantity);
      const motivo = data.reason ? ` Motivo: "${data.reason}".` : "";

      return {
        title: "Transferência Entre Baús",
        description: `O membro ${actor} transferiu ${qty}x ${prod} do ${from} para o ${to}.${motivo}`,
        tag: "Transferência",
        tagColor: "border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold",
      };
    }

    case "create_sale": {
      const qty = num(data.quantity);
      const total = currency(data.total_price);
      let prodName = data.product_name;
      if (!prodName || /^[0-9a-fA-F-]{36}$/.test(prodName)) {
        const found = productsList.find((p) => p.id === data.product_id);
        prodName = found?.nome || "Insumo";
      }

      return {
        title: "Registro de Venda",
        description: `O vendedor ${actor} registrou a venda de ${qty}x ${prodName} pelo valor total de ${total}.`,
        tag: "Venda Realizada",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "reverse_sale": {
      const total = data.total_price ? currency(data.total_price) : "";
      const motivo = data.reason ? ` Motivo: "${data.reason}".` : "";
      return {
        title: "Estorno de Venda",
        description: `O gestor ${actor} estornou a venda realizada${total ? ` no valor de ${total}` : ""}.${motivo}`,
        tag: "Estorno Venda",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "update_level": {
      const novoCargo = data.new_level || data.nivel || "novo cargo";
      const cargoAnterior = data.old_level ? ` (de "${data.old_level}")` : "";
      let membroAlvo = data.target_name;

      if (!membroAlvo || membroAlvo.toLowerCase() === "membro") {
        const targetId = data.target_id || data.target_user_id || data.user_id;
        const foundMember = membersList.find((m) => m.user_id === targetId);
        if (foundMember) {
          membroAlvo = foundMember.nickname
            ? `${foundMember.nickname} (${foundMember.nome})`
            : foundMember.nome;
        }
      }

      const memberStr = (membroAlvo && membroAlvo.toLowerCase() !== "membro")
        ? ` do membro ${membroAlvo}`
        : "";

      return {
        title: "Alteração de Cargo",
        description: `O gestor ${actor} alterou o cargo${memberStr}${cargoAnterior} para ${novoCargo}.`,
        tag: "Gestão Cargo",
        tagColor: "border-purple-500/40 bg-purple-500/10 text-purple-400 font-bold",
      };
    }

    case "approve_signup": {
      let membroNome = data.nome || data.applicant_name;
      if (!membroNome || membroNome.toLowerCase() === "membro") {
        const targetId = data.target_id || data.request_id;
        const foundMember = membersList.find((m) => m.user_id === targetId || m.id === targetId);
        if (foundMember) {
          membroNome = foundMember.nickname
            ? `${foundMember.nickname} (${foundMember.nome})`
            : foundMember.nome;
        }
      }
      const memberStr = (membroNome && membroNome.toLowerCase() !== "membro")
        ? ` do membro ${membroNome}`
        : "";

      return {
        title: "Aprovação de Membro",
        description: `O gestor ${actor} aprovou a solicitação de cadastro${memberStr} na facção.`,
        tag: "Aprovado",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "reject_signup": {
      let membroNome = data.nome || data.applicant_name;
      if (!membroNome || membroNome.toLowerCase() === "membro") {
        const targetId = data.target_id || data.request_id;
        const foundMember = membersList.find((m) => m.user_id === targetId || m.id === targetId);
        if (foundMember) {
          membroNome = foundMember.nickname
            ? `${foundMember.nickname} (${foundMember.nome})`
            : foundMember.nome;
        }
      }
      const memberStr = (membroNome && membroNome.toLowerCase() !== "membro")
        ? ` do membro ${membroNome}`
        : "";
      const motivo = data.reason ? ` Motivo: "${data.reason}".` : "";

      return {
        title: "Rejeição de Cadastro",
        description: `O gestor ${actor} rejeitou a solicitação de cadastro${memberStr}.${motivo}`,
        tag: "Rejeitado",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "delete_member":
    case "delete_members": {
      let membroAlvo = data.target_name || data.nome;
      if (!membroAlvo || membroAlvo.toLowerCase() === "membro") {
        const targetId = data.target_id || data.user_id || log.entity_id;
        const foundMember = membersList.find((m) => m.user_id === targetId);
        if (foundMember) {
          membroAlvo = foundMember.nickname
            ? `${foundMember.nickname} (${foundMember.nome})`
            : foundMember.nome;
        }
      }
      const memberStr = (membroAlvo && membroAlvo.toLowerCase() !== "membro")
        ? ` do membro ${membroAlvo}`
        : "";

      return {
        title: "Exclusão de Membro",
        description: `O gestor ${actor} desligou/excluiu o cadastro${memberStr} do grupo.`,
        tag: "Exclusão Membro",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "update_profile": {
      return {
        title: "Atualização de Perfil",
        description: `O membro ${actor} atualizou suas informações de perfil em jogo.`,
        tag: "Perfil",
        tagColor: "border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold",
      };
    }

    case "create_category": {
      const nome = data.nome || "Categoria";
      return {
        title: "Criação de Categoria",
        description: `O gestor ${actor} criou a nova categoria "${nome}".`,
        tag: "Nova Categoria",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "cancel_signup": {
      let membroNome = data.nome || data.applicant_name;
      const memberStr = (membroNome && membroNome.toLowerCase() !== "membro")
        ? ` do membro ${membroNome}`
        : "";
      return {
        title: "Cancelamento de Registro",
        description: `A solicitação de cadastro${memberStr} foi cancelada pelo usuário.`,
        tag: "Cancelado",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "login": {
      return {
        title: "Login na Plataforma",
        description: `O membro ${actor} realizou login na plataforma.`,
        tag: "Login",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "logout": {
      const duration = data.duration_formatted ? ` (Duração da sessão: ${data.duration_formatted})` : "";
      return {
        title: "Logout da Plataforma",
        description: `O membro ${actor} realizou logout da plataforma${duration}.`,
        tag: "Logout",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "session_start": {
      return {
        title: "Início de Sessão",
        description: `O membro ${actor} iniciou a sessão e está ativo no painel do grupo.`,
        tag: "Início de Sessão",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "session_absence": {
      return {
        title: "Membro Ausente",
        description: `O status do membro ${actor} foi alterado para Ausente (inatividade por 20 minutos).`,
        tag: "Ausente",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "session_end": {
      const duration = data.duration_formatted ? ` (Duração: ${data.duration_formatted})` : "";
      return {
        title: "Final de Sessão",
        description: `O membro ${actor} encerrou a sessão no painel${duration}.`,
        tag: "Final de Sessão",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "create_category": {
      const nome = data.nome || "Categoria";
      return {
        title: "Criação de Categoria",
        description: `O gestor ${actor} criou a nova categoria "${nome}".`,
        tag: "Nova Categoria",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "update_category": {
      const nome = data.nome || old.nome || "Categoria";
      const diffs: string[] = [];
      if (old.nome && data.nome && old.nome !== data.nome) diffs.push(`nome de "${old.nome}" para "${data.nome}"`);
      if (old.ativo !== undefined && data.ativo !== undefined && old.ativo !== data.ativo) diffs.push(`status para ${data.ativo ? "Ativo" : "Inativo"}`);

      const desc = diffs.length > 0
        ? `O gestor ${actor} alterou ${diffs.join(", ")} da categoria "${nome}".`
        : `O gestor ${actor} atualizou as informações da categoria "${nome}".`;

      return {
        title: "Edição de Categoria",
        description: desc,
        tag: "Edição Categoria",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "delete_category": {
      const nome = data.nome || "Categoria";
      return {
        title: "Exclusão de Categoria",
        description: `O gestor ${actor} excluiu a categoria "${nome}" do catálogo.`,
        tag: "Exclusão Categoria",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "create_bau": {
      const nome = data.nome || "Baú";
      return {
        title: "Criação de Baú",
        description: `O gestor ${actor} cadastrou o novo baú operacional "${nome}".`,
        tag: "Novo Baú",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "update_bau": {
      const nome = data.nome || old.nome || "Baú";
      const diffs: string[] = [];
      if (old.nome && data.nome && old.nome !== data.nome) diffs.push(`nome de "${old.nome}" para "${data.nome}"`);
      if (old.ativo !== undefined && data.ativo !== undefined && old.ativo !== data.ativo) diffs.push(`status para ${data.ativo ? "Ativo" : "Inativo"}`);

      const desc = diffs.length > 0
        ? `O gestor ${actor} alterou ${diffs.join(", ")} do baú "${nome}".`
        : `O gestor ${actor} atualizou os dados do baú "${nome}".`;

      return {
        title: "Edição de Baú",
        description: desc,
        tag: "Edição Baú",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "delete_bau": {
      const nome = data.nome || "Baú";
      return {
        title: "Exclusão de Baú",
        description: `O gestor ${actor} excluiu o baú operacional "${nome}".`,
        tag: "Exclusão Baú",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "create_product": {
      const nome = data.nome || "Produto";
      const preco = data.preco ? ` (Preço: ${currency(data.preco)})` : "";
      return {
        title: "Criação de Produto",
        description: `O gestor ${actor} cadastrou o produto "${nome}" no catálogo${preco}.`,
        tag: "Novo Produto",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "update_product": {
      const nome = data.nome || old.nome || "Produto";
      const diffs: string[] = [];

      if (old.preco_sugerido !== undefined && data.preco_sugerido !== undefined && old.preco_sugerido !== data.preco_sugerido) {
        diffs.push(`preço sugerido de ${currency(old.preco_sugerido)} para ${currency(data.preco_sugerido)}`);
      }
      if (old.estoque_minimo !== undefined && data.estoque_minimo !== undefined && old.estoque_minimo !== data.estoque_minimo) {
        diffs.push(`estoque mínimo de ${old.estoque_minimo} para ${data.estoque_minimo}`);
      }
      if (old.nome && data.nome && old.nome !== data.nome) {
        diffs.push(`nome de "${old.nome}" para "${data.nome}"`);
      }

      const desc = diffs.length > 0
        ? `O gestor ${actor} alterou ${diffs.join(", ")} no produto "${nome}".`
        : `O gestor ${actor} atualizou as informações e limites do produto "${nome}".`;

      return {
        title: "Edição de Produto",
        description: desc,
        tag: "Edição Produto",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "delete_product": {
      const nome = data.nome || "Produto";
      return {
        title: "Exclusão de Produto",
        description: `O gestor ${actor} excluiu o produto "${nome}" do catálogo da facção.`,
        tag: "Exclusão Produto",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "read_announcement": {
      const title = data.title || "Comunicado";
      return {
        title: "Leitura de Aviso",
        description: `O membro ${actor} marcou o comunicado em destaque "${title}" como lido.`,
        tag: "Aviso Lido",
        tagColor: "border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold",
      };
    }

    case "create_announcement": {
      const title = data.title || "Comunicado";
      return {
        title: "Publicação de Aviso",
        description: `O gestor ${actor} publicou o novo comunicado em destaque "${title}".`,
        tag: "Novo Aviso",
        tagColor: "border-purple-500/40 bg-purple-500/10 text-purple-400 font-bold",
      };
    }

    case "delete_announcement": {
      const title = data.title || "Comunicado";
      return {
        title: "Remoção de Aviso",
        description: `O gestor ${actor} removeu o comunicado "${title}".`,
        tag: "Aviso Removido",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "save_role_permissions": {
      const level = data.level || "cargo";
      return {
        title: "Permissões de Cargo",
        description: `O gestor ${actor} atualizou a matriz de permissões para o nível "${level}".`,
        tag: "Permissões",
        tagColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400 font-bold",
      };
    }

    case "create_cash_movement": {
      const type = data.type === "entrada" ? "Entrada (+)" : "Saída (-)";
      const valor = currency(data.amount);
      const motivo = data.motive ? ` (Motivo: "${data.motive}")` : "";
      const res = data.resulting_balance !== undefined ? currency(data.resulting_balance) : "—";
      return {
        title: `Movimentação no Fundo de Caixa (${type})`,
        description: `O responsável ${actor} registrou uma ${type} no valor de ${valor}${motivo}. Saldo resultante: ${res}.`,
        tag: data.type === "entrada" ? "Caixa Entrou" : "Caixa Saiu",
        tagColor: data.type === "entrada" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold" : "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "reverse_cash_movement": {
      const valor = data.amount ? currency(data.amount) : "";
      const razao = data.reason ? ` Motivo: "${data.reason}".` : "";
      return {
        title: "Estorno no Fundo de Caixa",
        description: `O responsável ${actor} estornou um lançamento de caixa ${valor ? `no valor de ${valor}` : ""}.${razao}`,
        tag: "Estorno Caixa",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "delete_cash_movement": {
      const valor = data.amount ? currency(data.amount) : "";
      const motivo = data.motive ? ` (Motivo: "${data.motive}")` : "";
      return {
        title: "Exclusão de Lançamento de Caixa",
        description: `O responsável ${actor} excluiu permanentemente um lançamento de caixa no valor de ${valor}${motivo}.`,
        tag: "Exclusão Caixa",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "save_custom_role": {
      const nomeCargo = data.nome || "Cargo";
      return {
        title: "Configuração de Cargo",
        description: `O administrador ${actor} salvou a estrutura e permissões do cargo "${nomeCargo}".`,
        tag: "Gestão Cargo",
        tagColor: "border-purple-500/40 bg-purple-500/10 text-purple-400 font-bold",
      };
    }

    case "delete_custom_role": {
      const nomeCargo = data.nome || "Cargo";
      return {
        title: "Exclusão de Cargo",
        description: `O administrador ${actor} removeu o cargo personalizado "${nomeCargo}".`,
        tag: "Cargo Removido",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "reorder_custom_roles": {
      return {
        title: "Reordenação Hierárquica de Cargos",
        description: `O administrador ${actor} reorganizou a hierarquia relativa dos cargos da facção.`,
        tag: "Hierarquia",
        tagColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400 font-bold",
      };
    }

    /* ===== NOVOS TIPOS DE AÇÃO (sistema de logs aprimorado) ===== */

    case "page_view": {
      const PAGE_LABELS: Record<string, string> = {
        "/dashboard": "Dashboard",
        "/estoque": "Estoque",
        "/movimentacoes": "Movimentações",
        "/vendas": "Vendas",
        "/membros": "Membros",
        "/hierarquia": "Hierarquia",
        "/cargos": "Cargos",
        "/permissoes": "Permissões",
        "/logs": "Logs de Auditoria",
        "/avisos": "Avisos",
        "/fundo-caixa": "Fundo de Caixa",
        "/perfil": "Perfil",
        "/metas": "Metas",
        "/rankings": "Rankings",
        "/desempenho": "Desempenho",
        "/configuracoes": "Configurações",
      };
      const rawPage = data.page || "página desconhecida";
      const pageLabel = PAGE_LABELS[rawPage] || rawPage.replace(/^\/_authenticated\//, "").replace(/^\//, "");
      return {
        title: "Navegação na Plataforma",
        description: `O membro ${actor} acessou a página "${pageLabel}".`,
        tag: "Navegação",
        tagColor: "border-slate-500/40 bg-slate-500/10 text-slate-400 font-bold",
      };
    }

    case "access_denied": {
      const page = data.page || "recurso protegido";
      const perm = data.required_permission ? ` (permissão necessária: ${data.required_permission})` : "";
      return {
        title: "⚠️ Tentativa de Acesso Negado",
        description: `O membro ${actor} tentou acessar "${page}" sem permissão suficiente${perm}.`,
        tag: "Acesso Negado",
        tagColor: "border-orange-500/40 bg-orange-500/10 text-orange-400 font-bold",
      };
    }

    case "operation_error": {
      const failedAction = data.failed_action || "operação desconhecida";
      const errorMsg = data.error_message || "Erro não especificado";
      return {
        title: "❌ Erro em Operação",
        description: `Uma falha ocorreu quando ${actor} tentou executar "${failedAction.replace(/_/g, " ")}": ${errorMsg}.`,
        tag: "Erro",
        tagColor: "border-red-500/40 bg-red-500/10 text-red-400 font-bold",
      };
    }

    case "batch_movement": {
      const total = data.total_items || 0;
      const ent = data.entradas || 0;
      const sai = data.saidas || 0;
      return {
        title: "Movimentação em Lote",
        description: `O membro ${actor} executou uma movimentação em lote de ${total} itens (${ent} entradas, ${sai} saídas).`,
        tag: "Lote",
        tagColor: "border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold",
      };
    }

    case "view_log_detail": {
      const inspectedAction = data.inspected_action ? data.inspected_action.replace(/_/g, " ") : "registro";
      return {
        title: "Inspeção de Log",
        description: `O membro ${actor} inspecionou os detalhes do registro de auditoria (${inspectedAction}).`,
        tag: "Inspeção",
        tagColor: "border-slate-500/40 bg-slate-500/10 text-slate-400 font-bold",
      };
    }

    case "update_member_details": {
      const targetName = data.target_name || "Membro";
      const changes: string[] = [];
      if (old.nome && data.nome && old.nome !== data.nome) changes.push(`nome de "${old.nome}" para "${data.nome}"`);
      if (old.nickname !== undefined && data.nickname !== undefined && old.nickname !== data.nickname) changes.push(`apelido para "${data.nickname || "nenhum"}"`);
      if (old.telefone && data.telefone && old.telefone !== data.telefone) changes.push(`telefone para "${data.telefone}"`);
      if (old.game_id && data.game_id && old.game_id !== data.game_id) changes.push(`ID de jogo para "${data.game_id}"`);

      const desc = changes.length > 0
        ? `O gestor ${actor} alterou ${changes.join(", ")} do membro ${targetName}.`
        : `O gestor ${actor} atualizou os dados do membro ${targetName}.`;

      return {
        title: "Edição de Dados de Membro",
        description: desc,
        tag: "Edição Membro",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "update_product_bau": {
      const prodName = data.product_name || "Produto";
      const oldBau = data.old_bau_name || "Nenhum";
      const newBau = data.new_bau_name || "Nenhum";
      return {
        title: "Realocação de Produto entre Baús",
        description: `O gestor ${actor} moveu o produto "${prodName}" do baú "${oldBau}" para o baú "${newBau}".`,
        tag: "Realocação",
        tagColor: "border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold",
      };
    }

    case "update_announcement": {
      const announcementTitle = data.title || "Comunicado";
      return {
        title: "Edição de Aviso",
        description: `O gestor ${actor} editou o comunicado "${announcementTitle}".`,
        tag: "Edição Aviso",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    case "create_goal": {
      const goalTarget = data.target_name || "Membro";
      const goalType = data.goal_type || "Meta";
      const goalValue = data.target_value ? num(data.target_value) : "—";
      return {
        title: "Criação de Meta",
        description: `O gestor ${actor} definiu uma nova meta de ${goalType} com valor alvo de ${goalValue} para ${goalTarget}.`,
        tag: "Nova Meta",
        tagColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold",
      };
    }

    case "delete_goal": {
      const goalTarget = data.target_name || "Membro";
      const goalType = data.goal_type || "Meta";
      return {
        title: "Exclusão de Meta",
        description: `O gestor ${actor} removeu a meta de ${goalType} do membro ${goalTarget}.`,
        tag: "Meta Removida",
        tagColor: "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold",
      };
    }

    case "update_goal": {
      const goalTarget = data.target_name || "Membro";
      const goalType = data.goal_type || "Meta";
      return {
        title: "Edição de Meta",
        description: `O gestor ${actor} atualizou a meta de ${goalType} do membro ${goalTarget}.`,
        tag: "Edição Meta",
        tagColor: "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold",
      };
    }

    default: {
      const actionClean = log.action.replace(/_/g, " ");
      return {
        title: `Atividade (${actionClean})`,
        description: `O membro ${actor} realizou a ação "${actionClean}".`,
        tag: actionClean,
        tagColor: "border-slate-500/40 bg-slate-500/10 text-slate-400 font-bold",
      };
    }
  }
}

