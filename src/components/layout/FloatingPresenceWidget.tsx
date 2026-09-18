import { useState, useRef, useEffect, useMemo } from "react";
import {
  Users,
  X,
  ChevronDown,
  Moon,
  Search,
  User,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useOnlineTimer } from "@/hooks/useOnlineTimer";
import { formatAusenteDuration, formatLastSeen } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { UserPresenceStatus, Member } from "@/lib/app-types";

/* ─── Live timer badge para membros online ─── */
function CompactLiveTimer({ onlineSinceISO }: { onlineSinceISO?: string | null }) {
  const { formattedHuman } = useOnlineTimer(onlineSinceISO);
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[9.5px] font-bold shadow-2xs">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span>{formattedHuman}</span>
    </div>
  );
}

/* ─── Status Dot compacto ─── */
function CompactStatusDot({ status }: { status: UserPresenceStatus | undefined }) {
  if (status === "online") {
    return (
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
    );
  }
  if (status === "ausente") {
    return (
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-amber-500 shadow-sm animate-pulse" />
    );
  }
  return (
    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-zinc-500/80" />
  );
}

/* ─── Linha de Membro de Alta Densidade ─── */
function CompactMemberRow({
  member,
  isSelf,
}: {
  member: Member;
  isSelf: boolean;
}) {
  const status = member.presence_status || "offline";
  const currentNivel = (member.nivel || "novato") as AppLevel;
  const avatarUrl = member.discord_avatar_url;
  const displayName = member.nickname || member.nome;
  const initials = displayName.slice(0, 2).toUpperCase();
  const profileSlug = member.custom_url || member.discord_id || member.user_id;

  const ausenteText = formatAusenteDuration(member.presence_updated_at || member.updated_at || member.last_seen);
  const lastSeenFull = formatLastSeen(member.last_seen || member.presence_updated_at || member.updated_at);
  const lastSeenCompact = lastSeenFull.replace("Visto por último ", "");

  const handleOpenProfile = () => {
    const cleanSlug = String(profileSlug).replace(/^@/, "");
    window.open(`/perfil/${cleanSlug}`, "_blank");
  };

  return (
    <div
      onClick={handleOpenProfile}
      className={cn(
        "flex items-center justify-between py-2 px-2.5 rounded-xl transition-all group text-xs border border-transparent select-none cursor-pointer hover:bg-secondary/70 hover:border-border/60 hover:shadow-xs active:scale-[0.99]",
        isSelf && "bg-secondary/20"
      )}
      title={`Ver perfil público de ${displayName} (/perfil/${String(profileSlug).replace(/^@/, "")})`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8 border border-border/80 shadow-xs group-hover:border-primary/50 transition-colors">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={member.nome} />}
            <AvatarFallback className="bg-secondary font-bold text-[10px] text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <CompactStatusDot status={status as UserPresenceStatus} />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="truncate font-black text-foreground text-xs leading-tight group-hover:text-primary transition-colors max-w-[140px] sm:max-w-none">
              {displayName}
            </span>
            {isSelf && <span className="text-[9px] font-mono text-muted-foreground font-bold">(você)</span>}
            <Badge
              variant="outline"
              className={cn("text-[8.5px] uppercase font-mono font-bold px-1.5 py-0 h-4 leading-none shrink-0 border-border/60", levelBadgeClass(currentNivel))}
            >
              {LEVEL_LABEL[currentNivel] || currentNivel}
            </Badge>
            {member.is_developer && (
              <Badge variant="outline" className="text-[8.5px] font-mono px-1 py-0 h-4 border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold shrink-0">
                DEV
              </Badge>
            )}
            {Boolean(member.is_ceo || member.custom_theme?.is_ceo) && (
              <Badge className="text-[8.5px] font-mono px-1 py-0 h-4 border-amber-500/40 text-amber-300 bg-amber-500/20 font-bold shrink-0">
                👑 CEO
              </Badge>
            )}
          </div>
          {member.nickname && (
            <span className="truncate text-[10px] text-muted-foreground leading-none mt-0.5">
              {member.nome}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 pl-2 flex items-center gap-1.5">
        {status === "online" ? (
          <CompactLiveTimer onlineSinceISO={member.online_since} />
        ) : status === "ausente" ? (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold"
            title={ausenteText}
          >
            <Moon className="h-2.5 w-2.5 shrink-0" />
            <span>{ausenteText}</span>
          </div>
        ) : (
          <span
            className="text-[9.5px] text-muted-foreground font-mono truncate max-w-[110px] text-right"
            title={lastSeenFull}
          >
            {lastSeenCompact}
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenProfile();
          }}
          className="h-7 w-7 text-muted-foreground group-hover:text-primary group-hover:bg-primary/15 rounded-lg transition-all shrink-0 cursor-pointer"
          title={`Ver perfil de ${displayName}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function FloatingOnlineMembersWidget() {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<"all" | "online" | "ausente" | "offline">("all");

  const { data: members = [] } = useMembers();
  const panelRef = useRef<HTMLDivElement>(null);

  // Fecha o popup ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Contagens
  const onlineMembers = useMemo(() => members.filter((m) => m.presence_status === "online"), [members]);
  const ausenteMembers = useMemo(() => members.filter((m) => m.presence_status === "ausente"), [members]);
  const offlineMembers = useMemo(
    () => members.filter((m) => !m.presence_status || m.presence_status === "offline"),
    [members]
  );
  const totalOnline = onlineMembers.length;

  // Filtragem de busca
  const filteredMembers = (list: Member[]) => {
    if (!memberSearch.trim()) return list;
    const q = memberSearch.toLowerCase();
    return list.filter((m) => {
      const nameMatch = m.nome?.toLowerCase().includes(q);
      const nickMatch = m.nickname?.toLowerCase().includes(q);
      const idMatch = m.user_id?.toLowerCase().includes(q) || m.discord_id?.includes(q);
      const nivelMatch = (m.nivel || "").toLowerCase().includes(q);
      return nameMatch || nickMatch || idMatch || nivelMatch;
    });
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50">
      {/* BOTÃO FLUTUANTE DE MEMBROS ONLINE */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-95 group select-none",
          isOpen
            ? "border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/30"
            : "border-border/80 bg-card/95 text-foreground hover:bg-secondary hover:border-emerald-500/60 shadow-xl"
        )}
        title={`${totalOnline} membro(s) online agora • Clique para ver lista completa`}
      >
        {/* Ícone de Membros */}
        <div className="relative flex items-center justify-center">
          <Users
            className={cn(
              "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
              isOpen ? "text-white" : "text-emerald-400"
            )}
          />

          {/* Ping pulsante verde se houver pessoas online */}
          {totalOnline > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Label Membros */}
        <span className={cn("text-xs font-black tracking-tight", isOpen ? "text-white" : "text-foreground")}>
          Membros
        </span>

        {/* Badge de quantidade online */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-black shadow-xs",
            isOpen
              ? "bg-white/20 text-white"
              : totalOnline > 0
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {totalOnline > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
          <span>{totalOnline} online</span>
        </div>

        <ChevronDown
          className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* POPUP DE MEMBROS ONLINE (Alta Densidade & Design Premium) */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-0 sm:inset-auto sm:bottom-[78px] sm:right-0 sm:top-auto sm:w-[420px] sm:max-w-[calc(100vw-2.5rem)] sm:h-[580px] sm:max-h-[calc(100vh-100px)] rounded-t-3xl sm:rounded-3xl border-t sm:border border-border/80 bg-card/98 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 duration-200 flex flex-col z-[999]">
          {/* HEADER DO POPUP */}
          <div className="px-4 py-3.5 border-b border-border/60 bg-secondary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                  Membros da Facção
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {totalOnline} online
                  </span>
                </h3>
                <p className="text-[10.5px] text-muted-foreground">
                  Status em tempo real dos integrantes
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
              title="Fechar painel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* BARRA DE PESQUISA */}
          <div className="p-3 border-b border-border/50 bg-card/60 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Buscar membro por nome, apelido, ID..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs bg-secondary/40 border-border/60 rounded-xl"
              />
            </div>

            {/* FILTROS POR STATUS */}
            <div className="grid grid-cols-4 gap-1">
              {(["all", "online", "ausente", "offline"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setMemberFilter(filter)}
                  className={cn(
                    "py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border text-center select-none cursor-pointer",
                    memberFilter === filter
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {filter === "all"
                    ? `Todos (${members.length})`
                    : filter === "online"
                    ? `Online (${onlineMembers.length})`
                    : filter === "ausente"
                    ? `Ausente (${ausenteMembers.length})`
                    : `Off (${offlineMembers.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE MEMBROS ALTA DENSIDADE */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {/* SEÇÃO ONLINE */}
            {(memberFilter === "all" || memberFilter === "online") && filteredMembers(onlineMembers).length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE AGORA
                  </span>
                  <span className="font-bold">{filteredMembers(onlineMembers).length}</span>
                </div>
                <div className="space-y-0.5">
                  {filteredMembers(onlineMembers).map((m) => (
                    <CompactMemberRow
                      key={m.user_id}
                      member={m}
                      isSelf={m.user_id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO AUSENTE */}
            {(memberFilter === "all" || memberFilter === "ausente") && filteredMembers(ausenteMembers).length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <span className="flex items-center gap-1.5">
                    <Moon className="h-3 w-3" />
                    AUSENTE / AFK
                  </span>
                  <span className="font-bold">{filteredMembers(ausenteMembers).length}</span>
                </div>
                <div className="space-y-0.5">
                  {filteredMembers(ausenteMembers).map((m) => (
                    <CompactMemberRow
                      key={m.user_id}
                      member={m}
                      isSelf={m.user_id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO OFFLINE */}
            {(memberFilter === "all" || memberFilter === "offline") && filteredMembers(offlineMembers).length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black font-mono text-zinc-400 uppercase tracking-wider bg-zinc-500/5 rounded-lg border border-zinc-500/20">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-zinc-500" />
                    OFFLINE
                  </span>
                  <span className="font-bold">{filteredMembers(offlineMembers).length}</span>
                </div>
                <div className="space-y-0.5">
                  {filteredMembers(offlineMembers).map((m) => (
                    <CompactMemberRow
                      key={m.user_id}
                      member={m}
                      isSelf={m.user_id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredMembers(members).length === 0 && (
              <div className="text-center py-12 text-muted-foreground space-y-1">
                <p className="text-xs font-bold text-foreground">Nenhum membro encontrado</p>
                <p className="text-[11px]">Tente buscar por outro nome ou ID.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
