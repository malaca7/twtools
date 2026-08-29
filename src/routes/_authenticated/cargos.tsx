import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  Landmark,
  Package,
  Tags,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  Trophy,
  ScrollText,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useCustomRoles, useMembers } from "@/hooks/useData";
import { saveCustomRole, deleteCustomRole, reorderCustomRoles } from "@/lib/app-api";
import { errorMessage } from "@/lib/format";
import { CustomRole, SystemModule, ModuleAccessLevel } from "@/lib/app-types";
import { LEVEL_RANK } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cargos")({
  component: CargosPage,
});

export const MODULE_DEFINITIONS: {
  key: SystemModule;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", label: "Dashboard", description: "Painel de avisos em destaque e resumo geral do grupo", icon: LayoutDashboard },
  { key: "fundo_caixa", label: "Fundo de Caixa Geral", description: "Entradas, saídas e saldo financeiro acumulado do grupo", icon: Landmark },
  { key: "produtos", label: "Produtos & Catálogo", description: "Catálogo de insumos, coletes, armamentos e regras de preço", icon: Package },
  { key: "categorias", label: "Categorias de Produtos", description: "Classificação dos itens em categorias operacionais", icon: Tags },
  { key: "baus", label: "Baús Operacionais", description: "Locais físicos e depósitos de armazenamento", icon: Boxes },
  { key: "movimentacoes", label: "Movimentações de Estoque", description: "Entradas e saídas operacionais do inventário", icon: ArrowLeftRight },
  { key: "vendas", label: "Vendas & Faturamento", description: "Registro e acompanhamento de vendas efetuadas", icon: ShoppingCart },
  { key: "membros", label: "Gestão de Membros", description: "Aprovação de cadastros, vínculos do Discord e gestão de cargos", icon: Users },
  { key: "desempenho", label: "Rankings & Metas", description: "Pódio de movimentadores, vendedores e metas operacionais", icon: Trophy },
  { key: "auditoria", label: "Histórico de Auditoria", description: "Logs transparentes em linguagem natural de todas as ações", icon: ScrollText },
  { key: "gestao_cargos", label: "Gerenciamento de Cargos", description: "Criação, reordenação e matriz de permissões dos cargos", icon: ShieldCheck },
];

function CargosPage() {
  const { level: currentUserLevel, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canAccess = hasPermission("manage_roles");

  const { data: dbRoles = [], isLoading: loadingRoles } = useCustomRoles();
  const { data: members = [] } = useMembers();

  // Dialog State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleId, setRoleId] = useState("");
  const [roleNome, setRoleNome] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [modulePerms, setModulePerms] = useState<Record<SystemModule, ModuleAccessLevel>>({
    dashboard: "view",
    fundo_caixa: "none",
    produtos: "view",
    categorias: "view",
    baus: "view",
    movimentacoes: "view",
    vendas: "view",
    membros: "none",
    desempenho: "view",
    auditoria: "none",
    gestao_cargos: "none",
  });

  // Delete State
  const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);

  // Local ordered roles state for smooth drag/up/down reordering
  const [localRoles, setLocalRoles] = useState<CustomRole[]>([]);

  useEffect(() => {
    if (dbRoles.length > 0) {
      const filtered = dbRoles.filter((r) => r.id !== "desenvolvedor" && r.nome.toLowerCase() !== "desenvolvedor");
      setLocalRoles(filtered);
    }
  }, [dbRoles]);

  const handleOpenRoleModal = (role?: CustomRole) => {
    if (role) {
      setEditingRole(role);
      setRoleId(role.id);
      setRoleNome(role.nome);
      setRoleDesc(role.descricao || "");

      const permState: Record<SystemModule, ModuleAccessLevel> = {
        dashboard: role.module_permissions?.dashboard || "none",
        fundo_caixa: role.module_permissions?.fundo_caixa || "none",
        produtos: role.module_permissions?.produtos || "none",
        categorias: role.module_permissions?.categorias || "none",
        baus: role.module_permissions?.baus || "none",
        movimentacoes: role.module_permissions?.movimentacoes || "none",
        vendas: role.module_permissions?.vendas || "none",
        membros: role.module_permissions?.membros || "none",
        desempenho: role.module_permissions?.desempenho || "none",
        auditoria: role.module_permissions?.auditoria || "none",
        gestao_cargos: role.module_permissions?.gestao_cargos || "none",
      };
      setModulePerms(permState);
    } else {
      setEditingRole(null);
      setRoleId("");
      setRoleNome("");
      setRoleDesc("");
      setModulePerms({
        dashboard: "view",
        fundo_caixa: "none",
        produtos: "view",
        categorias: "view",
        baus: "view",
        movimentacoes: "view",
        vendas: "view",
        membros: "none",
        desempenho: "view",
        auditoria: "none",
        gestao_cargos: "none",
      });
    }
    setRoleModalOpen(true);
  };

  // Save Role Mutation
  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      if (!roleNome.trim()) throw new Error("Informe o nome do cargo.");
      const idToUse = editingRole ? editingRole.id : roleId.trim() || roleNome.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

      await saveCustomRole({
        id: idToUse,
        nome: roleNome.trim(),
        descricao: roleDesc.trim() || undefined,
        rank: editingRole ? editingRole.rank : (localRoles.length + 1) * 10,
        module_permissions: modulePerms,
      });
    },
    onSuccess: () => {
      toast.success(editingRole ? "Cargo atualizado com sucesso!" : "Cargo criado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      setRoleModalOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async () => {
      if (!deletingRole) return;
      await deleteCustomRole(deletingRole.id);
    },
    onSuccess: () => {
      toast.success("Cargo removido com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      setDeletingRole(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Move Up / Move Down Mutation
  const moveRole = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localRoles.length) return;

    const updated = [...localRoles];
    const itemA = updated[index];
    const itemB = updated[newIndex];
    if (!itemA || !itemB) return;

    updated[index] = itemB;
    updated[newIndex] = itemA;

    setLocalRoles(updated);

    try {
      const orderedIds = updated.map((r) => r.id);
      await reorderCustomRoles(orderedIds);
      toast.success("Hierarquia dos cargos reorganizada!");
      void queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
    } catch (err) {
      toast.error(errorMessage(err));
      setLocalRoles(dbRoles);
    }
  };

  if (!canAccess) return <NoAccess />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Gerenciamento de Cargos e Permissões"
        description="Configure a estrutura hierárquica do grupo e defina permissões específicas página por página."
        actions={
          <Button
            onClick={() => handleOpenRoleModal()}
            className="bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Cargo
          </Button>
        }
      />

      <Card className="surface-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Cargos e Ordem Hierárquica ({localRoles.length})
          </CardTitle>
          <CardDescription className="text-xs">
            O cargo posicionado no topo representa o <strong>maior nível hierárquico</strong>. Use os botões ⬆️ e ⬇️ para alterar a ordem.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loadingRoles ? (
            <TableSkeleton rows={5} />
          ) : localRoles.length === 0 ? (
            <EmptyState title="Nenhum cargo encontrado" description="Cadastre os cargos no botão acima." />
          ) : (
            <div className="space-y-3">
              {localRoles.map((role, idx) => {
                const countMembers = members.filter((m) => m.nivel === role.id).length;
                const isTop = idx === 0;
                const isBottom = idx === localRoles.length - 1;

                return (
                  <div
                    key={role.id}
                    className="p-4 rounded-xl border border-border bg-background/80 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      {/* REORDER BUTTONS */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={isTop}
                          onClick={() => moveRole(idx, "up")}
                          title="Mover para cima (Aumentar Rank)"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={isBottom}
                          onClick={() => moveRole(idx, "down")}
                          title="Mover para baixo (Diminuir Rank)"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{role.nome}</h4>
                          {role.is_system ? (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                              Sistema
                            </Badge>
                          ) : null}
                          <Badge variant="secondary" className="text-[10px]">
                            {countMembers} {countMembers === 1 ? "membro" : "membros"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {role.descricao || "Sem descrição"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-border bg-card hover:bg-secondary"
                        onClick={() => handleOpenRoleModal(role)}
                        title="Editar nome e descrição do cargo"
                      >
                        <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Editar Cargo
                      </Button>

                      {!role.is_system ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingRole(role)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO DE CONFIGURAÇÃO DE CARGO E PERMISSÕES */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {editingRole ? `Configurar Cargo: ${editingRole.nome}` : "Criar Novo Cargo"}
            </DialogTitle>
            <DialogDescription>
              Defina o nível de acesso para cada módulo do painel (Sem Acesso, Visualizar ou Visualizar + Gerenciar).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-nome" className="text-xs font-semibold">
                  Nome do Cargo
                </Label>
                <Input
                  id="role-nome"
                  placeholder="Ex: Sub-Líder, Capitão Tático, Recruta"
                  value={roleNome}
                  onChange={(e) => setRoleNome(e.target.value)}
                  className="text-xs"
                />
              </div>

              {!editingRole ? (
                <div className="space-y-2">
                  <Label htmlFor="role-id" className="text-xs font-semibold">
                    Identificador (Código)
                  </Label>
                  <Input
                    id="role-id"
                    placeholder="Ex: sub_lider, capitao"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc" className="text-xs font-semibold">
                Descrição do Cargo
              </Label>
              <Textarea
                id="role-desc"
                placeholder="Responsabilidades e escopo deste cargo..."
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button variant="ghost" onClick={() => setRoleModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90"
              disabled={saveRoleMutation.isPending}
              onClick={() => saveRoleMutation.mutate()}
            >
              {saveRoleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Estrutura do Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog open={Boolean(deletingRole)} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Excluir Cargo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cargo <strong>{deletingRole?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deletingRole && members.filter((m) => m.nivel === deletingRole.id).length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Atenção: Existem <strong>{members.filter((m) => m.nivel === deletingRole.id).length} membros</strong> atribuídos a este cargo. Altere o cargo deles antes de excluí-lo.
              </span>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingRole(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteRoleMutation.isPending}
              onClick={() => deleteRoleMutation.mutate()}
            >
              {deleteRoleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
