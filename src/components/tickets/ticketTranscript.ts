import {
  type Ticket,
  formatTicketNumber,
  getCategoryInfo,
  getPriorityInfo,
  getStatusInfo,
} from "@/types/tickets";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/permissions";

export function generateTicketDiscordTranscript(ticket: Ticket, includeInternalNotes = true): string {
  const cat = getCategoryInfo(ticket.category);
  const priority = getPriorityInfo(ticket.priority);
  const status = getStatusInfo(ticket.status);
  const num = formatTicketNumber(ticket.ticket_number);

  const lines: string[] = [];

  lines.push("```markdown");
  lines.push("╔══════════════════════════════════════════════════════════════════════╗");
  lines.push(`  🎫 TWIN WHEELS — TRANSCRIÇÃO OFICIAL DE ATENDIMENTO ${num}`);
  lines.push("╚══════════════════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(`• Assunto: ${ticket.subject}`);
  lines.push(`• Categoria: ${cat.label} (${cat.emoji})`);
  lines.push(`• Prioridade: ${priority.label.toUpperCase()}`);
  lines.push(`• Status Atual: ${status.label.toUpperCase()}`);
  lines.push(`• Solicitante: ${ticket.creator_name}${ticket.creator_nickname ? ` (${ticket.creator_nickname})` : ""} [${LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}]`);
  lines.push(`• Responsável: ${ticket.assigned_to_name ? `${ticket.assigned_to_name} [${LEVEL_LABEL[ticket.assigned_to_role as any] || ticket.assigned_to_role || "Atendente"}]` : "Não atribuído"}`);
  lines.push(`• Data de Abertura: ${dateTime(ticket.created_at)}`);

  if (ticket.closed_at) {
    lines.push(`• Finalizado em: ${dateTime(ticket.closed_at)} por ${ticket.closed_by_name || "Gerência"}`);
    if (ticket.closed_reason) {
      lines.push(`• Motivo de Encerramento: "${ticket.closed_reason}"`);
    }
  }

  if (ticket.description) {
    lines.push("");
    lines.push("──────────────── DESCRIÇÃO INICIAL DO CHAMADO ────────────────");
    lines.push(ticket.description.trim());
  }

  const messages = ticket.messages || [];
  const visibleMessages = includeInternalNotes
    ? messages
    : messages.filter((m) => !m.is_internal_note);

  if (visibleMessages.length > 0) {
    lines.push("");
    lines.push(`──────────────── HISTÓRICO DE MENSAGENS (${visibleMessages.length}) ────────────────`);

    visibleMessages.forEach((msg) => {
      const time = dateTime(msg.created_at);
      const author = msg.sender_nickname ? `${msg.sender_name} (${msg.sender_nickname})` : msg.sender_name;
      const role = LEVEL_LABEL[msg.sender_role] || msg.sender_role;

      if (msg.is_internal_note) {
        lines.push(`[${time}] 🔒 [NOTA INTERNA] ${author} [${role}]:`);
      } else {
        lines.push(`[${time}] 💬 ${author} [${role}]:`);
      }

      if (msg.content) {
        lines.push(msg.content.trim());
      }

      if (msg.attachments && msg.attachments.length > 0) {
        lines.push(`   📎 [${msg.attachments.length} anexo(s) anexado(s)]`);
      }
      lines.push("");
    });
  }

  lines.push("───────────────────────────────────────────────────────────────────────");
  lines.push(`Twin Wheels GTA RP © ${new Date().getFullYear()} — Atendimento Ticket Oficial`);
  lines.push("```");

  return lines.join("\n");
}
