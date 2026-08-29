export interface Insignia {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  unlocked: boolean;
  progress: number; // 0 to 100
  reqText: string;
}

export function calculateMemberInsignias(params: {
  revenue: number;
  salesCount: number;
  movementsCount: number;
  score: number;
  ticketMédio: number;
  isMVP: boolean;
  totalSecondsOnline?: number;
  hasGoal100Pct?: boolean;
}): Insignia[] {
  const {
    revenue,
    salesCount,
    movementsCount,
    score,
    ticketMédio,
    isMVP,
    totalSecondsOnline = 0,
    hasGoal100Pct = false,
  } = params;

  return [
    {
      id: "mvp",
      title: "Rei do Faturamento (MVP)",
      description: "Conquistou o #1 lugar absoluto em faturamento na facção.",
      icon: "👑",
      color: "text-amber-400",
      bgGradient: "from-amber-500/20 via-yellow-500/10 to-amber-950/30",
      borderColor: "border-amber-500/50 shadow-amber-500/20 shadow-lg",
      unlocked: isMVP,
      progress: isMVP ? 100 : Math.min(99, Math.round((revenue / 1000000) * 100)),
      reqText: "#1 Maior Faturamento Geral",
    },
    {
      id: "score_elite",
      title: "Guerreiro da Produtividade",
      description: "Atingiu Score de Produtividade Supremo (90+ pts).",
      icon: "⚡",
      color: "text-purple-400",
      bgGradient: "from-purple-500/20 via-indigo-500/10 to-purple-950/30",
      borderColor: "border-purple-500/50 shadow-purple-500/20 shadow-lg",
      unlocked: score >= 90,
      progress: Math.min(100, Math.round((score / 90) * 100)),
      reqText: "Score ≥ 90 pts",
    },
    {
      id: "logistica_master",
      title: "Mestre do Estoque",
      description: "Realizou mais de 50 movimentações de insumos nos baús.",
      icon: "📦",
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/20 via-teal-500/10 to-emerald-950/30",
      borderColor: "border-emerald-500/50 shadow-emerald-500/20 shadow-lg",
      unlocked: movementsCount >= 50,
      progress: Math.min(100, Math.round((movementsCount / 50) * 100)),
      reqText: "50+ Movimentações",
    },
    {
      id: "vendedor_elite",
      title: "Fechador Elite",
      description: "Concluiu mais de 10 vendas de armamentos ou insumos.",
      icon: "🚀",
      color: "text-rose-400",
      bgGradient: "from-rose-500/20 via-pink-500/10 to-rose-950/30",
      borderColor: "border-rose-500/50 shadow-rose-500/20 shadow-lg",
      unlocked: salesCount >= 10,
      progress: Math.min(100, Math.round((salesCount / 10) * 100)),
      reqText: "10+ Vendas Registradas",
    },
    {
      id: "high_ticket",
      title: "Ticket de Ouro",
      description: "Ticket médio por venda superior a R$ 100.000.",
      icon: "💎",
      color: "text-sky-400",
      bgGradient: "from-sky-500/20 via-cyan-500/10 to-sky-950/30",
      borderColor: "border-sky-500/50 shadow-sky-500/20 shadow-lg",
      unlocked: ticketMédio >= 100000,
      progress: Math.min(100, Math.round((ticketMédio / 100000) * 100)),
      reqText: "Ticket Médio ≥ R$ 100k",
    },
    {
      id: "batedor_metas",
      title: "Batedor de Metas",
      description: "Cumpriu ou superou 100% das metas da facção.",
      icon: "🎯",
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/20 via-green-500/10 to-emerald-950/30",
      borderColor: "border-emerald-500/50 shadow-emerald-500/20 shadow-lg",
      unlocked: hasGoal100Pct,
      progress: hasGoal100Pct ? 100 : 50,
      reqText: "100% da Meta Batida",
    },
    {
      id: "veterano_ativo",
      title: "Veterano Operacional",
      description: "Acumulou mais de 10 horas ativas em serviço na facção.",
      icon: "🛡️",
      color: "text-amber-300",
      bgGradient: "from-amber-500/20 via-orange-500/10 to-amber-950/30",
      borderColor: "border-amber-500/40 shadow-amber-500/10 shadow-lg",
      unlocked: totalSecondsOnline >= 36000,
      progress: Math.min(100, Math.round((totalSecondsOnline / 36000) * 100)),
      reqText: "10h+ Online em Serviço",
    },
    {
      id: "primeira_venda",
      title: "Iniciante Promissor",
      description: "Efetivou seu primeiro registro de venda ou movimentação.",
      icon: "🌟",
      color: "text-blue-400",
      bgGradient: "from-blue-500/20 via-indigo-500/10 to-blue-950/30",
      borderColor: "border-blue-500/40 shadow-blue-500/10 shadow-lg",
      unlocked: salesCount > 0 || movementsCount > 0,
      progress: salesCount > 0 || movementsCount > 0 ? 100 : 0,
      reqText: "Primeira Operação Concluída",
    },
  ];
}
