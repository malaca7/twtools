import { useState, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ScrollText,
  Search,
  Eye,
  Package,
  DollarSign,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  LogIn,
  LogOut,
  RefreshCw,
  XCircle,
  User,
  Activity,
  Calendar,
  Layers,
  ArrowUpDown,
  Landmark,
  Megaphone,
  Clock,
  Navigation,
  AlertTriangle,
  AlertOctagon,
  Download,
  Target,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Boxes,
  Info,
  Shield,
  LifeBuoy,
} from "lucide-react";
import { PageHeader, NoAccess, TableSkeleton, EmptyState, ProductThumbnail } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLogs, useMembers, useProducts, useBaus, nameOf } from "@/hooks/useData";
import {
  dateTime,
  humanizeAuditLog,
  RANGE_LABEL,
  inRange,
  type RangeKey,
  currency,
} from "@/lib/format";
import { AuditLog, type AuditLogSeverity } from "@/lib/app-types";
import { logViewLogDetail } from "@/lib/app-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/logs")({
  component: LogsPage,
});

/* ==========================================================================
   ÍCONES POR AÇÃO
   ========================================================================== */

function getActionIcon(action: string) {
  switch (action) {
    case "login":
    case "session_start":
      return <LogIn className="h-4 w-4 text-emerald-400" />;
    case "session_absence":
      return <Clock className="h-4 w-4 text-amber-400" />;
    case "logout":
    case "session_end":
      return <LogOut className="h-4 w-4 text-rose-400" />;
    case "submit_signup":
      return <UserPlus className="h-4 w-4 text-sky-400" />;
    case "approve_signup":
      return <UserCheck className="h-4 w-4 text-emerald-400" />;
    case "reject_signup":
      return <UserX className="h-4 w-4 text-rose-400" />;
    case "create_movement":
    case "batch_movement":
      return <Package className="h-4 w-4 text-sky-400" />;
    case "reverse_movement":
      return <RefreshCw className="h-4 w-4 text-amber-400" />;
    case "create_sale":
      return <DollarSign className="h-4 w-4 text-emerald-400" />;
    case "reverse_sale":
      return <XCircle className="h-4 w-4 text-rose-400" />;
    case "create_cash_movement":
    case "reverse_cash_movement":
    case "delete_cash_movement":
      return <Landmark className="h-4 w-4 text-emerald-400" />;
    case "update_level":
    case "save_custom_role":
    case "delete_custom_role":
    case "reorder_custom_roles":
    case "save_role_permissions":
      return <ShieldCheck className="h-4 w-4 text-purple-400" />;
    case "read_announcement":
    case "create_announcement":
    case "delete_announcement":
    case "update_announcement":
      return <Megaphone className="h-4 w-4 text-purple-400" />;
    case "page_view":
      return <Navigation className="h-4 w-4 text-slate-400" />;
    case "access_denied":
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    case "operation_error":
      return <AlertOctagon className="h-4 w-4 text-red-400" />;
    case "view_log_detail":
      return <Eye className="h-4 w-4 text-slate-400" />;
    case "create_goal":
    case "delete_goal":
    case "update_goal":
      return <Target className="h-4 w-4 text-sky-400" />;
    case "create_product":
    case "update_product":
    case "delete_product":
    case "update_product_bau":
      return <Boxes className="h-4 w-4 text-sky-400" />;
    case "update_member_details":
    case "delete_member":
    case "delete_members":
      return <User className="h-4 w-4 text-amber-400" />;
    case "transfer_between_chests":
      return <Package className="h-4 w-4 text-sky-400" />;
    case "update_profile":
      return <User className="h-4 w-4 text-sky-400" />;
    case "create_ticket":
    case "ticket_reply":
      return <LifeBuoy className="h-4 w-4 text-emerald-400" />;
    case "claim_ticket":
    case "transfer_ticket":
    case "update_ticket_status":
    case "reopen_ticket":
      return <LifeBuoy className="h-4 w-4 text-sky-400" />;
    case "ticket_internal_note":
      return <LifeBuoy className="h-4 w-4 text-amber-400" />;
    case "close_ticket":
      return <LifeBuoy className="h-4 w-4 text-zinc-400" />;
    default:
      return <Activity className="h-4 w-4 text-primary" />;
  }
}

/* ==========================================================================
   BORDAS DE ACENTO POR AÇÃO
   ========================================================================== */

function getCardAccentBorder(action: string): string {
  if (action === "login" || action === "session_start" || action.includes("approve") || action === "create_sale") {
    return "border-l-4 border-l-emerald-500";
  }
  if (action === "operation_error") {
    return "border-l-4 border-l-red-500";
  }
  if (action === "access_denied") {
    return "border-l-4 border-l-orange-500";
  }
  if (action === "session_absence" || action.includes("update") || action.includes("save") || action.includes("reorder")) {
    return "border-l-4 border-l-amber-500";
  }
  if (action === "logout" || action === "session_end" || action.includes("delete") || action.includes("reject") || action.includes("reverse")) {
    return "border-l-4 border-l-rose-500";
  }
  if (action.includes("signup") || action.includes("movement") || action.includes("transfer")) {
    return "border-l-4 border-l-sky-500";
  }
  if (action === "page_view" || action === "view_log_detail") {
    return "border-l-4 border-l-slate-500";
  }
  return "border-l-4 border-l-purple-500";
}

/* ==========================================================================
   MÓDULO E CATEGORIA POR AÇÃO (expandido)
   ========================================================================== */

function getModuleFromAction(action: string): string {
  if (action === "login" || action === "logout" || action.startsWith("session_")) return "auth";
  if (action.includes("cash_movement")) return "fundo_caixa";
  if (action.includes("movement") || action.includes("bau") || action.includes("transfer")) return "estoque";
  if (action.includes("sale")) return "vendas";
  if (action.includes("product") || action.includes("category")) return "produtos";
  if (action.includes("signup") || action.includes("level") || action === "update_member_details" || action === "delete_member" || action === "delete_members") return "membros";
  if (action.includes("role") || action.includes("permission") || action === "save_role_permissions") return "cargos";
  if (action.includes("announcement")) return "avisos";
  if (action.includes("goal")) return "metas";
  if (action === "page_view" || action === "view_log_detail") return "navegacao";
  if (action === "access_denied") return "seguranca";
  if (action === "operation_error") return "erros";
  if (action.includes("ticket")) return "tickets";
  if (action === "update_profile") return "perfil";
  return "geral";
}

function getCategoryTypeFromAction(action: string): "create" | "update" | "delete" | "auth" | "view" | "error" | "other" {
  if (action === "login" || action === "logout" || action.startsWith("session_")) return "auth";
  if (action === "page_view" || action === "view_log_detail" || action === "read_announcement") return "view";
  if (action === "access_denied" || action === "operation_error") return "error";
  if (action.startsWith("create") || action.startsWith("submit") || action.startsWith("approve") || action === "batch_movement") return "create";
  if (action.startsWith("update") || action.startsWith("save") || action.startsWith("reorder")) return "update";
  if (action.startsWith("delete") || action.startsWith("reject") || action.startsWith("reverse") || action.startsWith("cancel")) return "delete";
  return "other";
}

/* ==========================================================================
   SEVERIDADE (Visual)
   ========================================================================== */

function getSeverityBadge(severity?: AuditLogSeverity) {
  switch (severity) {
    case "critical":
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-red-500/40 bg-red-500/10 text-red-400 font-bold gap-0.5">
          <Shield className="h-2.5 w-2.5" /> CRÍTICO
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold gap-0.5">
          <AlertTriangle className="h-2.5 w-2.5" /> ALERTA
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-500/30 bg-slate-500/5 text-slate-500 font-medium gap-0.5">
          <Info className="h-2.5 w-2.5" /> INFO
        </Badge>
      );
  }
}

/* ==========================================================================
   RENDER DE CONTEXTO HUMANIZADO
   ========================================================================== */

function renderHumanizedContext(obj: any) {
  if (!obj || typeof obj !== "object") return null;

  const entries = Object.entries(obj).filter(([key, val]) => {
    if (val === undefined || val === null || val === "") return false;
    if (key.includes("_id") || key === "id" || key === "user_id") return false;
    if (key === "_meta") return false; // hide internal metadata block
    return true;
  });

  if (entries.length === 0) return <p className="text-muted-foreground text-xs italic">Sem dados adicionais</p>;

  const keyLabels: Record<string, string> = {
    type: "Tipo de Operação",
    quantity: "Quantidade",
    product_name: "Produto",
    bau_name: "Baú Depositado",
    previous_balance: "Saldo Anterior",
    resulting_balance: "Saldo Posterior",
    total_price: "Valor Total",
    unit_price: "Preço Unitário",
    buyer_name: "Comprador",
    payment_method: "Forma de Pagamento",
    reason: "Motivo / Observação",
    notes: "Observações",
    duration_formatted: "Tempo de Permanência",
    nome: "Nome",
    nickname: "Apelido",
    telefone: "Telefone de Jogo",
    game_id: "ID do Personagem",
    target_name: "Membro Alvo",
    new_level: "Novo Cargo Atribuído",
    old_level: "Cargo Anterior",
    title: "Título",
    amount: "Valor",
    motive: "Motivo",
    page: "Página Acessada",
    required_permission: "Permissão Necessária",
    denied_at: "Data/Hora da Negação",
    failed_action: "Ação que Falhou",
    error_message: "Mensagem de Erro",
    occurred_at: "Data/Hora do Erro",
    total_items: "Total de Itens no Lote",
    entradas: "Entradas no Lote",
    saidas: "Saídas no Lote",
    inspected_action: "Ação Inspecionada",
    old_bau_name: "Baú Anterior",
    new_bau_name: "Novo Baú",
    goal_type: "Tipo de Meta",
    target_value: "Valor Alvo",
    period_start: "Período Início",
    period_end: "Período Fim",
    descricao: "Descrição",
    from_bau_name: "Baú Origem",
    to_bau_name: "Baú Destino",
    original_type: "Tipo Original",
    original_motive: "Motivo Original",
    canceled_at: "Data de Cancelamento",
    level_label: "Nome do Cargo",
    permissions_count: "Nº de Permissões",
  };

  return (
    <div className="space-y-1.5 pt-1">
      {entries.map(([key, val]) => {
        let label = keyLabels[key] || key.replace(/_/g, " ");
        label = label.charAt(0).toUpperCase() + label.slice(1);
        let displayVal = String(val);

        if (key === "type") displayVal = val === "entrada" ? "Entrada (+)" : val === "saida" ? "Saída (-)" : String(val);
        if (key === "total_price" || key === "unit_price" || key === "amount") displayVal = currency(Number(val));
        if (key === "quantity" || key === "total_items" || key === "entradas" || key === "saidas") displayVal = `${val}x`;

        // Suppress UUID strings
        if (/^[0-9a-fA-F-]{36}$/.test(displayVal)) {
          return null;
        }

        // Suppress arrays/objects display as [object Object]
        if (typeof val === "object") return null;

        if (key === "imagem_url" && val) {
          return (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
              <span className="text-muted-foreground font-medium">{label}:</span>
              <div className="flex items-center gap-2">
                <ProductThumbnail src={String(val)} size="xs" />
                <span className="font-mono text-[10px] text-foreground text-right max-w-[180px] truncate">{String(val)}</span>
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="flex items-center justify-between py-1 border-b border-border/40 text-xs">
            <span className="text-muted-foreground font-medium">{label}:</span>
            <span className="font-semibold text-foreground text-right max-w-[60%] truncate">{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   EXPORTAR CSV
   ========================================================================== */

function exportLogsToCSV(logs: AuditLog[], members: any[]) {
  const header = "Data/Hora,Membro,Ação,Entidade,Severidade,Detalhes\n";
  const rows = logs.map((log) => {
    const memberName = log.user_id ? nameOf(members, log.user_id) : "Sistema";
    const severity = log.severity || "info";
    const details = log.new_data
      ? JSON.stringify(log.new_data).replace(/_meta.*?},?/g, "").replace(/"/g, '""').slice(0, 200)
      : "";
    return `"${new Date(log.created_at).toLocaleString("pt-BR")}","${memberName}","${log.action}","${log.entity}","${severity}","${details}"`;
  });

  const csv = header + rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `logs_auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   CONSTANTES DE PAGINAÇÃO
   ========================================================================== */

const PAGE_SIZE = 50;

/* ==========================================================================
   PÁGINA PRINCIPAL DE LOGS
   ========================================================================== */

function LogsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("view_audit");

  const { data: logs = [], isLoading: loadingLogs } = useAuditLogs();
  const { data: members = [] } = useMembers();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();

  // Filters State
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState<RangeKey>("tudo");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Log Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  if (!canView) return <NoAccess />;

  // Handle log inspection with audit trail
  const handleInspectLog = useCallback((log: AuditLog) => {
    setSelectedLog(log);
    void logViewLogDetail(log.id, log.action);
  }, []);

  // Filter & Process Logs
  const filteredLogs = useMemo(() => {
    const list = logs.filter((l) => {
      if (l.action === "page_view") return false;
      const userName = l.user_id ? nameOf(members, l.user_id).toLowerCase() : "sistema";
      const q = search.toLowerCase().trim();
      const human = humanizeAuditLog(l, members, products, baus);
      const matchesSearch =
        !q ||
        human.title.toLowerCase().includes(q) ||
        human.description.toLowerCase().includes(q) ||
        userName.includes(q) ||
        l.action.toLowerCase().includes(q);

      const matchesMember = memberFilter === "all" || l.user_id === memberFilter;
      const mod = getModuleFromAction(l.action);
      const matchesModule = moduleFilter === "all" || mod === moduleFilter;
      const catType = getCategoryTypeFromAction(l.action);
      const matchesCatType = categoryTypeFilter === "all" || catType === categoryTypeFilter;
      const matchesSeverity = severityFilter === "all" || (l.severity || "info") === severityFilter;
      const matchesRange = inRange(l.created_at, rangeFilter);

      return matchesSearch && matchesMember && matchesModule && matchesCatType && matchesSeverity && matchesRange;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [logs, members, products, baus, search, memberFilter, moduleFilter, categoryTypeFilter, severityFilter, rangeFilter, sortOrder]);

  // Reset page when filters change
  const totalFiltered = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Metrics
  const totalEvents = logs.length;
  const eventsToday = logs.filter((l) => inRange(l.created_at, "hoje")).length;
  const activeUsersToday = new Set(
    logs.filter((l) => inRange(l.created_at, "hoje") && l.user_id).map((l) => l.user_id)
  ).size;
  const criticalEvents = logs.filter((l) => (l.severity || "info") === "critical").length;

  // Top 5 members by log count
  const memberActionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach((l) => {
      if (l.user_id && l.action !== "page_view" && l.action !== "view_log_detail") {
        counts.set(l.user_id, (counts.get(l.user_id) || 0) + 1);
      }
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({
        userId,
        name: nameOf(members, userId),
        count,
      }));
  }, [logs, members]);

  // Module breakdown
  const moduleBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach((l) => {
      if (l.action !== "page_view" && l.action !== "view_log_detail") {
        const mod = getModuleFromAction(l.action);
        counts.set(mod, (counts.get(mod) || 0) + 1);
      }
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const MODULE_LABELS: Record<string, string> = {
    auth: "🔑 Autenticação",
    fundo_caixa: "💵 Fundo de Caixa",
    estoque: "📦 Estoque & Baús",
    vendas: "🛍️ Vendas",
    produtos: "🏷️ Produtos",
    membros: "🛡️ Membros",
    cargos: "⚙️ Cargos & Permissões",
    avisos: "📢 Avisos",
    metas: "🎯 Metas",
    navegacao: "🧭 Navegação",
    seguranca: "🔒 Segurança",
    erros: "❌ Erros",
    perfil: "👤 Perfil",
    tickets: "🎫 Tickets / Ouvidoria",
    geral: "📋 Geral",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Logs da Plataforma"
        description="Registros transparentes e completos de todas as ações executadas na plataforma, incluindo navegação, acessos negados e erros."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => exportLogsToCSV(filteredLogs, members)}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV ({filteredLogs.length})
          </Button>
        }
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="surface-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Registrado
            </CardTitle>
            <ScrollText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground font-mono">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">Eventos gravados na plataforma</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Eventos Hoje
            </CardTitle>
            <Calendar className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{eventsToday}</div>
            <p className="text-xs text-emerald-500 font-medium">Registrados nas últimas 24h</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Membros Ativos Hoje
            </CardTitle>
            <Clock className="h-5 w-5 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeUsersToday}</div>
            <p className="text-xs text-sky-400 font-medium">Com registros no dia</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border border-l-4 border-l-red-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ações Críticas
            </CardTitle>
            <Shield className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400 font-mono">{criticalEvents}</div>
            <p className="text-xs text-muted-foreground">Exclusões, estornos e alterações sensíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* TOP MEMBERS & MODULE BREAKDOWN */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">🏆 Top 5 — Membros Mais Ativos</CardTitle>
            <CardDescription className="text-xs">Ranking por quantidade de ações registradas (excl. navegação)</CardDescription>
          </CardHeader>
          <CardContent>
            {memberActionCounts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sem dados ainda</p>
            ) : (
              <div className="space-y-2">
                {memberActionCounts.map((m, i) => {
                  const maxCount = memberActionCounts[0]?.count || 1;
                  const pct = Math.round((m.count / maxCount) * 100);
                  const memberObj = members.find(mb => mb.user_id === m.userId);
                  return (
                    <div key={m.userId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}º</span>
                      <Avatar className="h-6 w-6 border border-border shrink-0">
                        {memberObj?.discord_avatar_url && <AvatarImage src={memberObj.discord_avatar_url} alt={m.name} />}
                        <AvatarFallback className="bg-secondary font-bold text-[8px]">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-foreground truncate">{m.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">{m.count}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">📊 Ações por Módulo</CardTitle>
            <CardDescription className="text-xs">Distribuição de registros por área do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {moduleBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sem dados ainda</p>
            ) : (
              <div className="space-y-2">
                {moduleBreakdown.map(([mod, count]) => {
                  const maxCount = moduleBreakdown[0]?.[1] || 1;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={mod} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-40 truncate">{MODULE_LABELS[mod] || mod}</span>
                      <div className="flex-1 min-w-0">
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="surface-card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por membro, ação, produto, valor, observações..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Membro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Membros</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.nickname || m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Módulos</SelectItem>
                  <SelectItem value="auth">🔑 Autenticação</SelectItem>
                  <SelectItem value="fundo_caixa">💵 Fundo de Caixa</SelectItem>
                  <SelectItem value="estoque">📦 Estoque & Baús</SelectItem>
                  <SelectItem value="vendas">🛍️ Vendas</SelectItem>
                  <SelectItem value="produtos">🏷️ Produtos/Catálogo</SelectItem>
                  <SelectItem value="membros">🛡️ Membros</SelectItem>
                  <SelectItem value="cargos">⚙️ Cargos & Permissões</SelectItem>
                  <SelectItem value="avisos">📢 Avisos</SelectItem>
                  <SelectItem value="metas">🎯 Metas</SelectItem>
                  <SelectItem value="navegacao">🧭 Navegação</SelectItem>
                  <SelectItem value="seguranca">🔒 Segurança</SelectItem>
                  <SelectItem value="erros">❌ Erros</SelectItem>
                  <SelectItem value="perfil">👤 Perfil</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryTypeFilter} onValueChange={(v) => { setCategoryTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Tipo de Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="create">🟢 Criações (+)</SelectItem>
                  <SelectItem value="update">⚙️ Edições/Alterações</SelectItem>
                  <SelectItem value="delete">🔴 Exclusões/Estornos</SelectItem>
                  <SelectItem value="auth">🔑 Logins/Logouts</SelectItem>
                  <SelectItem value="view">👁️ Visualizações</SelectItem>
                  <SelectItem value="error">⚠️ Erros/Bloqueios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">🔴 Crítico</SelectItem>
                  <SelectItem value="warning">🟡 Alerta</SelectItem>
                  <SelectItem value="info">🔵 Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={rangeFilter} onValueChange={(v) => { setRangeFilter(v as RangeKey); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RANGE_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-xs border-border bg-card"
                onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                title={sortOrder === "desc" ? "Exibindo mais recentes primeiro" : "Exibindo mais antigos primeiro"}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                {sortOrder === "desc" ? "Novas Primeiro" : "Antigas Primeiro"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TIMELINE DE AUDITORIA */}
      <Card className="surface-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Linha do Tempo de Atividades ({totalFiltered})
            </CardTitle>
            <CardDescription className="text-xs">
              Exibindo {paginatedLogs.length} de {totalFiltered} registros — Página {safePage} de {totalPages}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {loadingLogs ? (
            <TableSkeleton rows={6} />
          ) : paginatedLogs.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-10 w-10 text-muted-foreground" />}
              title="Nenhum registro encontrado"
              description="Não há logs de auditoria correspondentes aos filtros selecionados."
            />
          ) : (
            <div className="space-y-3">
              {paginatedLogs.map((log) => {
                const human = humanizeAuditLog(log, members, products, baus);
                const userMember = members.find((m) => m.user_id === log.user_id);
                const userName = userMember?.nickname || userMember?.nome || log.new_data?.user_name || log.old_data?.user_name || (log.user_id ? "Membro" : "Sistema");
                const cardAccentBorder = getCardAccentBorder(log.action);

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "p-4 rounded-xl border border-border/80 bg-background/80 hover:bg-secondary/40 transition-all space-y-2.5 shadow-sm group",
                      cardAccentBorder
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border shrink-0">
                          {userMember?.discord_avatar_url && (
                            <AvatarImage src={userMember.discord_avatar_url} alt={userName} />
                          )}
                          <AvatarFallback className="bg-secondary font-bold text-[10px]">
                            {userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <h4 className="font-bold text-xs text-foreground">{human.title}</h4>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              ({userName})
                            </span>
                          </div>
                          <p className="text-[0.65rem] text-muted-foreground">{dateTime(log.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getSeverityBadge(log.severity)}
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", human.tagColor)}>
                          {human.tag}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleInspectLog(log)}
                          title="Inspecionar detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/90 font-normal leading-relaxed pl-1">
                      {human.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalFiltered)} de {totalFiltered} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (safePage <= 4) {
                      pageNum = i + 1;
                    } else if (safePage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = safePage - 3 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === safePage ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 px-0 text-xs"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                >
                  Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO DE DETALHES HUMANIZADOS DE AUDITORIA */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ScrollText className="h-5 w-5 text-primary" /> Detalhes da Ação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informações detalhadas em linguagem clara.
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-4 py-2 text-xs">
              {/* USER & TIMESTAMP HEADER */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                      {(selectedLog.user_id ? nameOf(members, selectedLog.user_id) : "S").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-xs text-foreground">
                      {selectedLog.user_id ? nameOf(members, selectedLog.user_id) : "Sistema"}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">{dateTime(selectedLog.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {getSeverityBadge(selectedLog.severity)}
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", humanizeAuditLog(selectedLog, members, products, baus).tagColor)}>
                    {humanizeAuditLog(selectedLog, members, products, baus).tag}
                  </Badge>
                </div>
              </div>

              {/* HUMAN DESCRIPTION */}
              <div className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                <p className="text-[0.65rem] text-muted-foreground uppercase font-bold">Descrição da Ação</p>
                <p className="text-xs text-foreground leading-relaxed">
                  {humanizeAuditLog(selectedLog, members, products, baus).description}
                </p>
              </div>

              {/* USER AGENT & META */}
              {(selectedLog.user_agent || selectedLog.new_data?._meta) && (
                <div className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                  <p className="text-[0.65rem] text-muted-foreground uppercase font-bold">Informações Técnicas</p>
                  <div className="space-y-1">
                    {selectedLog.user_agent && (
                      <div className="flex items-start justify-between py-1 border-b border-border/40 text-xs gap-2">
                        <span className="text-muted-foreground font-medium shrink-0">Navegador:</span>
                        <span className="font-mono text-[10px] text-foreground text-right break-all">{selectedLog.user_agent.slice(0, 120)}</span>
                      </div>
                    )}
                    {selectedLog.new_data?._meta?.logged_at && (
                      <div className="flex items-center justify-between py-1 border-b border-border/40 text-xs">
                        <span className="text-muted-foreground font-medium">Timestamp Preciso:</span>
                        <span className="font-mono text-foreground">{dateTime(selectedLog.new_data._meta.logged_at)}</span>
                      </div>
                    )}
                    {selectedLog.severity && (
                      <div className="flex items-center justify-between py-1 border-b border-border/40 text-xs">
                        <span className="text-muted-foreground font-medium">Severidade:</span>
                        <span className="font-semibold text-foreground uppercase">{selectedLog.severity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HUMANIZED CONTEXT TABLES */}
              {selectedLog.old_data || selectedLog.new_data ? (
                <div className="space-y-3">
                  <p className="text-[0.65rem] text-muted-foreground uppercase font-bold">
                    Dados Registrados (Contexto Operacional)
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedLog.old_data && (
                      <div className="p-3 rounded-lg bg-secondary/20 border border-border space-y-1">
                        <p className="text-[10px] font-bold text-amber-400 uppercase">Valores Anteriores</p>
                        {renderHumanizedContext(selectedLog.old_data)}
                      </div>
                    )}
                    {selectedLog.new_data && (
                      <div className="p-3 rounded-lg bg-secondary/20 border border-border space-y-1">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase">Novos Valores / Registros</p>
                        {renderHumanizedContext(selectedLog.new_data)}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
