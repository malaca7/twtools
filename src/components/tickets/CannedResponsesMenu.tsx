import { useState, useMemo, useEffect } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Search,
  MessageSquare,
  Lock,
  Sparkles,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CannedResponseTemplate {
  id: string;
  category: "atendimento" | "provas" | "reembolso" | "denuncia" | "conclusao" | "notas" | "personalizado";
  title: string;
  text: string;
  isInternal?: boolean;
}

export const DEFAULT_CANNED_RESPONSES: CannedResponseTemplate[] = [
  {
    id: "welcome",
    category: "atendimento",
    title: "👋 Saudação e Boas-Vindas",
    text: "Olá! Sou o atendente responsável pelo seu chamado. Já estou analisando sua solicitação com atenção e vou te auxiliar em todo o processo. Como podemos te ajudar?",
  },
  {
    id: "request_proofs",
    category: "provas",
    title: "📸 Solicitar Provas / Prints / Clipe",
    text: "Olá! Para darmos continuidade e validarmos sua solicitação, pedimos que anexe aqui prints, clipes de vídeo ou registros detalhando o ocorrido. Assim que anexar, analisaremos imediatamente.",
  },
  {
    id: "in_analysis",
    category: "atendimento",
    title: "⏳ Em Análise com a Gerência / 01",
    text: "Seu caso foi levado para alinhamento direto com a diretoria/gerência da facção. Pedimos que aguarde enquanto verificamos os detalhes internamente.",
  },
  {
    id: "waiting_member",
    category: "atendimento",
    title: "⏸️ Aguardando Resposta do Membro",
    text: "Estamos aguardando suas respostas/comprovações adicionais para prosseguir com o seu atendimento. Caso não haja retorno em até 48 horas, o chamado poderá ser finalizado automaticamente.",
  },
  {
    id: "refund_approved",
    category: "reembolso",
    title: "✅ Reembolso Aprovado",
    text: "Sua solicitação de reembolso foi avaliada e APROVADA com sucesso! Favor procurar um membro da tesouraria ou líder em jogo com seu passaporte para receber o ressarcimento acordado.",
  },
  {
    id: "refund_denied",
    category: "reembolso",
    title: "❌ Reembolso Negado",
    text: "Infelizmente sua solicitação de reembolso foi RECUSADA. Motivo: Falta de comprovação suficiente ou ocorrência fora dos critérios estabelecidos para ressarcimento da facção.",
  },
  {
    id: "report_under_investigation",
    category: "denuncia",
    title: "⚠️ Denúncia em Averiguação Confidencial",
    text: "Sua denúncia foi registrada sob sigilo e está sob investigação da liderança. Nenhuma represália será tolerada e as providências cabíveis estão sendo tomadas.",
  },
  {
    id: "resolved_success",
    category: "conclusao",
    title: "✨ Chamado Resolvido com Sucesso",
    text: "Sua solicitação foi concluída e o atendimento está sendo finalizado com êxito! Agradecemos sua colaboração e paciência. Bom jogo e conte conosco!",
  },
  {
    id: "internal_investigating",
    category: "notas",
    title: "🔒 Nota: Averiguação em Andamento",
    text: "[NOTA INTERNA] Integrante sob acompanhamento operacional. Aguardando verificação de logs no baú antes de qualquer liberação de recursos.",
    isInternal: true,
  },
  {
    id: "internal_approved_board",
    category: "notas",
    title: "🔒 Nota: Alinhado com Diretoria",
    text: "[NOTA INTERNA] Alinhado com o 01/02 em call. Decisão autorizada e aplicada nos registros do grupo.",
    isInternal: true,
  },
];

const STORAGE_KEY = "tw_custom_canned_responses";

interface CannedResponsesMenuProps {
  onSelect: (text: string, isInternal?: boolean) => void;
  disabled?: boolean;
}

export function CannedResponsesMenu({ onSelect, disabled = false }: CannedResponsesMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [customResponses, setCustomResponses] = useState<CannedResponseTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newIsInternal, setNewIsInternal] = useState(false);

  const allResponses = useMemo(() => {
    return [...customResponses, ...DEFAULT_CANNED_RESPONSES];
  }, [customResponses]);

  const filteredResponses = useMemo(() => {
    if (!searchTerm.trim()) return allResponses;
    const q = searchTerm.toLowerCase().trim();
    return allResponses.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [allResponses, searchTerm]);

  const handleSaveCustom = () => {
    if (!newTitle.trim() || !newText.trim()) {
      toast.error("Preencha o título e o texto do modelo.");
      return;
    }

    const created: CannedResponseTemplate = {
      id: `custom_${Date.now()}`,
      category: "personalizado",
      title: newTitle.trim(),
      text: newText.trim(),
      isInternal: newIsInternal,
    };

    const updated = [created, ...customResponses];
    setCustomResponses(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    toast.success("Modelo rápido criado com sucesso!");
    setIsNewDialogOpen(false);
    setNewTitle("");
    setNewText("");
    setNewIsInternal(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customResponses.filter((r) => r.id !== id);
    setCustomResponses(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    toast.success("Modelo personalizado removido.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 text-xs gap-1.5 font-bold border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg cursor-pointer"
            title="Inserir modelo de resposta rápida no chamado"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="hidden sm:inline">Respostas Rápidas</span>
            <span className="sm:hidden">Macros</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-80 sm:w-96 max-h-[460px] overflow-y-auto p-2 bg-card border-border shadow-2xl z-[10000]"
        >
          <div className="flex items-center justify-between px-2 py-1 mb-1.5">
            <DropdownMenuLabel className="p-0 text-xs font-bold flex items-center gap-1.5 text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              Modelos de Atendimento
            </DropdownMenuLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewDialogOpen(true)}
              className="h-6 px-2 text-[10px] font-bold gap-1 text-primary hover:bg-primary/10 rounded-md"
            >
              <Plus className="h-3 w-3" />
              Criar Novo
            </Button>
          </div>

          {/* Busca rápida de respostas */}
          <div className="px-1 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar modelo por título ou palavra-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-secondary/50 border-border/70 rounded-lg"
              />
            </div>
          </div>

          <DropdownMenuSeparator className="my-1" />

          {filteredResponses.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Nenhum modelo encontrado para "{searchTerm}".
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResponses.map((item) => {
                const isCustom = item.category === "personalizado";
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onSelect(item.text, item.isInternal)}
                    className="flex flex-col items-start gap-1 p-2 rounded-lg cursor-pointer hover:bg-secondary/70 focus:bg-secondary transition-all group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground group-hover:text-amber-300">
                        {item.isInternal && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10 gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            Nota
                          </Badge>
                        )}
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustom(item.id, e)}
                            className="text-muted-foreground hover:text-rose-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir este modelo personalizado"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0" />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 text-left leading-relaxed">
                      {item.text}
                    </p>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DIÁLOGO: CRIAR NOVO MODELO PERSONALIZADO */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-400">
              <Sparkles className="h-4 w-4" />
              Criar Modelo de Resposta Rápida
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Salve suas próprias respostas padronizadas para agilizar atendimentos repetitivos no dia a dia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título / Identificador do Modelo</Label>
              <Input
                placeholder="Ex: 🚗 Veículo Apreendido / Resgate"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs bg-secondary/40 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Texto da Mensagem</Label>
              <Textarea
                placeholder="Digite a resposta que será colada no chamado..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={4}
                className="text-xs bg-secondary/40 border-border resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  Inserir como Nota Interna
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, ao clicar no modelo ele marcará automaticamente como nota interna confidencial.
                </p>
              </div>
              <Switch checked={newIsInternal} onCheckedChange={setNewIsInternal} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCustom}
              className="text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Check className="h-3.5 w-3.5" />
              Salvar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

