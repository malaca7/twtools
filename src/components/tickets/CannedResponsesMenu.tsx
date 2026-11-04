import { useState, useMemo } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Search,
  Lock,
  Sparkles,
  Check,
  Copy,
  ChevronRight,
  X,
  FileText,
  CornerDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  category: "atendimento" | "provas" | "reembolso" | "denuncia" | "conclusao" | "notas" | "operacional" | "personalizado";
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
    id: "bau_log_check",
    category: "operacional",
    title: "📦 Verificação de Baú e Suprimentos",
    text: "Estamos verificando os logs operacionais de entrada e saída do baú para checagem dos itens mencionados. Em breve retornaremos com a conclusão.",
  },
  {
    id: "rules_warning",
    category: "atendimento",
    title: "📜 Orientação sobre Regras do Grupo",
    text: "Lembramos a todos os integrantes que condutas contrárias ao estatuto da facção, ausência injustificada em ações ou conflitos internos são passíveis de advertência disciplinar.",
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

const CATEGORY_TABS = [
  { id: "all", label: "Todas" },
  { id: "atendimento", label: "👋 Atendimento" },
  { id: "provas", label: "📸 Provas" },
  { id: "reembolso", label: "💰 Reembolso" },
  { id: "operacional", label: "📦 Operacional" },
  { id: "denuncia", label: "⚠️ Denúncia" },
  { id: "conclusao", label: "✨ Conclusão" },
  { id: "notas", label: "🔒 Notas Internas" },
  { id: "personalizado", label: "⭐ Minhas Macros" },
] as const;

const STORAGE_KEY = "tw_custom_canned_responses";

interface CannedResponsesMenuProps {
  onSelect: (text: string, isInternal?: boolean) => void;
  disabled?: boolean;
}

export function CannedResponsesMenu({ onSelect, disabled = false }: CannedResponsesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);

  // Formulário de criação
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newIsInternal, setNewIsInternal] = useState(false);
  const [newCategory, setNewCategory] = useState<CannedResponseTemplate["category"]>("atendimento");

  // Custom responses salvas no localStorage
  const [customResponses, setCustomResponses] = useState<CannedResponseTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allResponses = useMemo(() => {
    return [...customResponses, ...DEFAULT_CANNED_RESPONSES];
  }, [customResponses]);

  const filteredResponses = useMemo(() => {
    return allResponses.filter((r) => {
      // Filtro de categoria
      if (selectedCategory !== "all") {
        if (selectedCategory === "notas" && !r.isInternal) return false;
        if (selectedCategory !== "notas" && r.category !== selectedCategory) return false;
      }

      // Filtro de busca
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        r.title.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [allResponses, selectedCategory, searchTerm]);

  const handleInsert = (text: string, isInternal?: boolean) => {
    onSelect(text, isInternal);
    setIsOpen(false);
    toast.success("Resposta rápida inserida no chamado! ⚡", {
      description: text.slice(0, 75) + (text.length > 75 ? "..." : ""),
      id: "macro-inserted-toast",
    });
  };

  const handleCopyOnly = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado para a área de transferência!");
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) {
      toast.error("Preencha o título e o conteúdo da resposta rápida.");
      return;
    }

    const created: CannedResponseTemplate = {
      id: `custom_${Date.now()}`,
      category: newIsInternal ? "notas" : newCategory,
      title: newTitle.trim(),
      text: newText.trim(),
      isInternal: newIsInternal,
    };

    const updated = [created, ...customResponses];
    setCustomResponses(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    toast.success("Macro personalizada criada com sucesso!");
    setIsCreating(false);
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
    toast.success("Macro personalizada removida.");
  };

  return (
    <>
      {/* BOTÃO PRINCIPAL DE ACESSO */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="h-7 text-xs gap-1.5 font-bold border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg cursor-pointer shadow-2xs transition-all active:scale-95"
        title="Abrir biblioteca de respostas rápidas e macros operacionais"
      >
        <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
        <span className="hidden sm:inline">Respostas Rápidas</span>
        <span className="sm:hidden">Macros</span>
      </Button>

      {/* MODAL DIALOG COMPLETO E PRODUTIVO DE RESPOSTAS RÁPIDAS */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-card/95 backdrop-blur-md border-border/80 rounded-2xl p-0 overflow-hidden shadow-2xl">
          {/* Cabeçalho */}
          <div className="p-4 sm:p-5 border-b border-border/70 bg-gradient-to-r from-amber-500/10 via-secondary/30 to-amber-500/5 shrink-0 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
                <Zap className="h-5 w-5 fill-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <span>Respostas Rápidas & Macros</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10">
                    {allResponses.length} Modelos
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Selecione um modelo pronto para inserir na resposta ou crie suas próprias macros operacionais.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreating((prev) => !prev)}
              className={cn(
                "h-8 text-xs font-bold gap-1.5 rounded-xl transition-all shadow-xs shrink-0",
                isCreating
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-cyan-500 hover:bg-cyan-600 text-black"
              )}
            >
              {isCreating ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Voltar à Lista</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nova Macro</span>
                </>
              )}
            </Button>
          </div>

          {/* MODO CRIAÇÃO DE NOVA MACRO */}
          {isCreating ? (
            <form onSubmit={handleSaveCustom} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Criar Novo Modelo de Resposta</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Salve respostas padronizadas para acelerar atendimentos recorrentes na facção.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="macro_title" className="text-xs font-bold">
                    Título / Identificador da Macro *
                  </Label>
                  <Input
                    id="macro_title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: 🚗 Veículo Apreendido / Resgate de Carro"
                    className="text-xs bg-secondary/40 border-border/70 rounded-xl"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="macro_text" className="text-xs font-bold">
                    Texto Completo da Mensagem *
                  </Label>
                  <Textarea
                    id="macro_text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Escreva o texto que será automaticamente colado no chamado..."
                    rows={4}
                    className="text-xs bg-secondary/40 border-border/70 rounded-xl resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Inserir como Nota Interna Privada</span>
                    </Label>
                    <p className="text-[11px] text-amber-200/80">
                      Ao selecionar, o chamado ativará automaticamente o modo de nota confidencial (visível apenas para a gerência).
                    </p>
                  </div>
                  <Switch checked={newIsInternal} onCheckedChange={setNewIsInternal} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-1.5 rounded-xl shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Salvar Modelo</span>
                </Button>
              </div>
            </form>
          ) : (
            /* MODO LISTA E BUSCA DE RESPOSTAS RÁPIDAS */
            <div className="flex flex-col flex-1 overflow-hidden p-4 sm:p-5 space-y-3.5">
              {/* Barra de Busca */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar modelo por título, conteúdo ou palavra-chave..."
                  className="pl-9 pr-9 h-9 text-xs bg-secondary/50 border-border/70 rounded-xl focus-visible:ring-cyan-500/40"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Categorias Tabs em Carrossel Horizontal */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                {CATEGORY_TABS.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count =
                    cat.id === "all"
                      ? allResponses.length
                      : cat.id === "personalizado"
                      ? customResponses.length
                      : cat.id === "notas"
                      ? allResponses.filter((r) => r.isInternal).length
                      : allResponses.filter((r) => r.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                        isSelected
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-2xs"
                          : "bg-secondary/40 border-border/60 hover:bg-secondary/70 hover:text-foreground text-muted-foreground"
                      )}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Grade de Cards de Respostas Rápidas */}
              <div className="flex-1 overflow-y-auto pr-1">
                {filteredResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs font-semibold">Nenhum modelo encontrado.</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      Tente buscar por outro termo ou limpe os filtros.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {filteredResponses.map((item) => {
                      const isCustom = item.category === "personalizado";
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleInsert(item.text, item.isInternal)}
                          className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-amber-500/50 hover:bg-secondary/40 transition-all cursor-pointer shadow-2xs space-y-2.5"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground group-hover:text-amber-300 transition-colors line-clamp-1">
                                {item.title}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {item.isInternal && (
                                  <Badge variant="outline" className="text-[8px] py-0 px-1 border-amber-500/40 text-amber-400 bg-amber-500/10 gap-0.5 rounded-full font-bold">
                                    <Lock className="h-2 w-2" />
                                    Nota
                                  </Badge>
                                )}
                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteCustom(item.id, e)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Excluir macro personalizada"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed font-sans">
                              {item.text}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                            <button
                              type="button"
                              onClick={(e) => handleCopyOnly(item.text, e)}
                              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono transition-colors"
                              title="Copiar texto para área de transferência"
                            >
                              <Copy className="h-2.5 w-2.5" />
                              <span>Copiar</span>
                            </button>

                            <span className="text-amber-400 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              <span>Inserir</span>
                              <CornerDownLeft className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rodapé Informativo */}
          {!isCreating && (
            <div className="p-3 bg-secondary/30 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground px-4 shrink-0">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Clique em qualquer cartão para colar o texto no chamado.</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 text-xs rounded-lg"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
