import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Layers,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Trash2,
  Sliders,
  History,
  Info,
  Warehouse,
  ShieldAlert,
  Loader2,
  Sparkles,
  RotateCcw,
  Zap,
  HandMetal,
  PackagePlus,
  PackageMinus,
  Check,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useRawMaterials,
  useBaus,
  useProductBaus,
  useProducts,
  useRawMaterialMovements,
  useMembers,
  useCustomRoles,
} from "@/hooks/useData";
import { evaluateBauAccess } from "@/lib/bauPermissions";
import {
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  adjustRawMaterialStock,
  pullRawMaterialFromBau,
  transferRawMaterialToBau,
} from "@/services/productionService";
import { uploadImageToPostimages } from "@/services/postimagesService";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { ProductionNavHeader } from "@/components/productions/ProductionNavHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RawMaterial, Bau } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/producoes/materias-primas")({
  component: MateriasPrimasPage,
});

export function MateriasPrimasPage() {
  const { hasPermission, isDevMode, isCeoMode, level, memberTags, isDevUser, isCeoUser, panelMode } = useAuth();
  const queryClient = useQueryClient();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  // Permissões
  const canView =
    hasPermission("raw_materials.view") ||
    hasPermission("production_management.raw_materials") ||
    hasPermission("productions.view");

  const canCreate =
    hasPermission("raw_materials.create") ||
    hasPermission("production_management.raw_materials");

  const canEdit =
    hasPermission("raw_materials.edit") ||
    hasPermission("production_management.raw_materials");

  const canDelete =
    hasPermission("raw_materials.delete");

  const canAdjust =
    hasPermission("raw_materials.adjust") ||
    hasPermission("production_management.raw_materials");

  const canTransferBau =
    hasPermission("raw_materials.transfer_bau") ||
    hasPermission("production_management.raw_materials");

  // Dados
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useRawMaterials();
  const { data: baus = [], isLoading: loadingBaus } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const { data: products = [] } = useProducts();
  const { data: movements = [], isLoading: loadingMovements } = useRawMaterialMovements(undefined, 150);
  const { data: members = [] } = useMembers();
  const { data: customRoles = [] } = useCustomRoles();

  const currentRole = useMemo(() => {
    return customRoles.find((r) => r.id === level || r.nome?.toLowerCase() === level?.toLowerCase());
  }, [customRoles, level]);

  const userAuthContext = useMemo(
    () => ({
      level,
      customRoleId: currentRole?.id || level,
      roleName: currentRole?.nome || level,
      tagIds: memberTags.map((t) => t.id),
      tagNames: memberTags.map((t) => t.name),
      isDevUser,
      isCeoUser,
      panelMode,
    }),
    [level, currentRole, memberTags, isDevUser, isCeoUser, panelMode]
  );

  // Baús ativos (respeitando restrições de cargos e tags)
  const activeBaus = useMemo(
    () => baus.filter((b) => evaluateBauAccess(b, userAuthContext).isActiveForUser),
    [baus, userAuthContext]
  );

  // Baús em Modo de Movimentação MANUAL
  const manualBaus = useMemo(
    () =>
      activeBaus.filter(
        (b) =>
          (b as any).tipo_gestao?.toLowerCase() === "manual" ||
          !(b as any).discord_channel_id
      ),
    [activeBaus]
  );

  // Estados de Filtro
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "zero_stock" | "critical" | "inactive">("all");
  const [activeTab, setActiveTab] = useState("stock");

  // Mapa de Baús por ID
  const bauMap = useMemo(() => new Map(baus.map((b) => [b.id, b])), [baus]);

  // Função para buscar saldo de uma matéria-prima em um baú específico
  const getMaterialStockInBau = (mat: RawMaterial, bauId: string): number => {
    let prodId = mat.product_id;
    if (!prodId) {
      const match = products.find((p) => p.nome.trim().toLowerCase() === mat.name.trim().toLowerCase());
      prodId = match?.id;
    }
    if (!prodId) return 0;
    const found = productBaus.find((pb) => pb.bau_id === bauId && pb.product_id === prodId);
    return Math.round(Number(found?.quantidade || 0));
  };

  // Saldo total de uma matéria-prima em todos os baús ativos
  const getMaterialTotalInAllBaus = (mat: RawMaterial): number => {
    let total = 0;
    for (const b of activeBaus) {
      total += getMaterialStockInBau(mat, b.id);
    }
    return total;
  };

  // ----------------------------------------------------
  // MODAIS & OPERAÇÕES
  // ----------------------------------------------------

  // 1. Modal "Transferir de Baú Manual para Estoque"
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [selectedMaterialForPull, setSelectedMaterialForPull] = useState<RawMaterial | null>(null);
  const [selectedBauForPull, setSelectedBauForPull] = useState<string>("");
  const [pullQuantity, setPullQuantity] = useState<string>("10");
  const [pullReason, setPullReason] = useState<string>("");

  const activeBauSelectedForPull = useMemo(
    () => manualBaus.find((b) => b.id === selectedBauForPull) || activeBaus.find((b) => b.id === selectedBauForPull),
    [manualBaus, activeBaus, selectedBauForPull]
  );

  const isSelectedBauManual = useMemo(() => {
    if (!activeBauSelectedForPull) return false;
    return (
      (activeBauSelectedForPull as any).tipo_gestao?.toLowerCase() === "manual" ||
      !(activeBauSelectedForPull as any).discord_channel_id
    );
  }, [activeBauSelectedForPull]);

  const availableInSelectedBau = useMemo(() => {
    if (!selectedMaterialForPull || !selectedBauForPull) return 0;
    return getMaterialStockInBau(selectedMaterialForPull, selectedBauForPull);
  }, [selectedMaterialForPull, selectedBauForPull, productBaus]);

  const pullMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMaterialForPull) throw new Error("Selecione uma matéria-prima.");
      if (!selectedBauForPull) throw new Error("Selecione o baú manual de origem.");
      if (!isSelectedBauManual) {
        throw new Error("Apenas baús com modo de movimentação manual permitem transferência para o estoque.");
      }
      const qty = parseInt(pullQuantity, 10);
      if (isNaN(qty) || qty <= 0) throw new Error("Informe uma quantidade válida maior que zero.");

      if (qty > availableInSelectedBau) {
        throw new Error(
          `Saldo insuficiente no baú manual: possui ${availableInSelectedBau} e tentou transferir ${qty}.`
        );
      }

      return pullRawMaterialFromBau(
        selectedMaterialForPull.id,
        selectedBauForPull,
        qty,
        pullReason.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(
        `${res.quantity}x ${selectedMaterialForPull?.name} transferidos do Baú Manual para o estoque!`
      );
      setPullModalOpen(false);
      setPullReason("");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_material_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao transferir matérias-primas do baú manual");
    },
  });

  // Modal "Entrada Manual no Estoque"
  const [manualEntryModalOpen, setManualEntryModalOpen] = useState(false);
  const [selectedMaterialForEntry, setSelectedMaterialForEntry] = useState<RawMaterial | null>(null);
  const [manualEntryQuantity, setManualEntryQuantity] = useState<string>("50");
  const [manualEntryReason, setManualEntryReason] = useState<string>("");

  const manualEntryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMaterialForEntry) throw new Error("Selecione uma matéria-prima.");
      const qty = parseInt(manualEntryQuantity, 10);
      if (isNaN(qty) || qty <= 0) throw new Error("Informe uma quantidade inteira positiva.");
      return adjustRawMaterialStock(
        selectedMaterialForEntry.id,
        qty,
        manualEntryReason.trim() || "Entrada manual de matéria-prima"
      );
    },
    onSuccess: (res) => {
      toast.success(
        `Entrada manual realizada: +${manualEntryQuantity}x ${selectedMaterialForEntry?.name}! Novo saldo: ${res?.new_balance}`
      );
      setManualEntryModalOpen(false);
      setManualEntryReason("");
      setManualEntryQuantity("50");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_material_movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao realizar entrada manual");
    },
  });

  // 2. Modal "Devolver / Transferir para Baú"
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedMaterialForReturn, setSelectedMaterialForReturn] = useState<RawMaterial | null>(null);
  const [selectedBauForReturn, setSelectedBauForReturn] = useState<string>("");
  const [returnQuantity, setReturnQuantity] = useState<string>("10");
  const [returnReason, setReturnReason] = useState<string>("");

  const activeBauSelectedForReturn = useMemo(
    () => activeBaus.find((b) => b.id === selectedBauForReturn),
    [activeBaus, selectedBauForReturn]
  );

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMaterialForReturn) throw new Error("Selecione uma matéria-prima.");
      if (!selectedBauForReturn) throw new Error("Selecione o baú de destino.");
      const qty = parseInt(returnQuantity, 10);
      if (isNaN(qty) || qty <= 0) throw new Error("Informe uma quantidade válida maior que zero.");
      if (qty > selectedMaterialForReturn.stock_quantity) {
        throw new Error("Quantidade excede o saldo disponível no estoque.");
      }

      return transferRawMaterialToBau(
        selectedMaterialForReturn.id,
        selectedBauForReturn,
        qty,
        returnReason.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(
        `${res.quantity}x ${selectedMaterialForReturn?.name} transferidos para ${res.bau_nome}!`
      );
      setReturnModalOpen(false);
      setReturnReason("");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_material_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao transferir para baú");
    },
  });

  // 3. Modal "Ajuste Rápido de Estoque"
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustMaterial, setAdjustMaterial] = useState<RawMaterial | null>(null);
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [adjustAmount, setAdjustAmount] = useState<string>("10");
  const [adjustReasonText, setAdjustReasonText] = useState<string>("");

  const projectedStockAfterAdjust = useMemo(() => {
    if (!adjustMaterial) return 0;
    const current = adjustMaterial.stock_quantity;
    const amt = parseInt(adjustAmount, 10) || 0;
    return adjustMode === "add" ? current + amt : Math.max(0, current - amt);
  }, [adjustMaterial, adjustMode, adjustAmount]);

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustMaterial) return;
      const amt = parseInt(adjustAmount, 10);
      if (isNaN(amt) || amt <= 0) throw new Error("Informe uma quantidade inteira positiva.");
      const delta = adjustMode === "add" ? amt : -amt;
      if (adjustMaterial.stock_quantity + delta < 0) {
        throw new Error("O saldo de estoque não pode ficar negativo.");
      }
      return adjustRawMaterialStock(adjustMaterial.id, delta, adjustReasonText.trim() || undefined);
    },
    onSuccess: (res) => {
      toast.success(`Estoque de ${adjustMaterial?.name} ajustado com sucesso! Novo saldo: ${res?.new_balance}`);
      setAdjustModalOpen(false);
      setAdjustReasonText("");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_material_movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao ajustar estoque");
    },
  });

  // 4. Modal Cadastrar / Editar Matéria-Prima
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUnit, setFormUnit] = useState("un");
  const [formMinStock, setFormMinStock] = useState("0");
  const [formInitialStock, setFormInitialStock] = useState("0");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const openCreateForm = () => {
    setEditingMaterial(null);
    setFormName("");
    setFormDesc("");
    setFormUnit("un");
    setFormMinStock("10");
    setFormInitialStock("0");
    setFormImageUrl("");
    setFormIsActive(true);
    setMaterialFormOpen(true);
  };

  const openEditForm = (mat: RawMaterial) => {
    setEditingMaterial(mat);
    setFormName(mat.name);
    setFormDesc(mat.description || "");
    setFormUnit(mat.unit || "un");
    setFormMinStock(String(mat.min_stock || 0));
    setFormInitialStock(String(mat.stock_quantity || 0));
    setFormImageUrl(mat.image_url || "");
    setFormIsActive(mat.is_active !== false);
    setMaterialFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToPostimages(file);
      setFormImageUrl(url);
      toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
      toast.error("Falha no upload da imagem");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveMaterialMutation = useMutation({
    mutationFn: async () => {
      const name = formName.trim();
      if (!name) throw new Error("Informe o nome da matéria-prima.");
      const minS = Math.max(0, parseInt(formMinStock, 10) || 0);

      if (editingMaterial) {
        await updateRawMaterial(editingMaterial.id, {
          name,
          description: formDesc.trim() || null,
          unit: formUnit.trim() || "un",
          min_stock: minS,
          image_url: formImageUrl.trim() || null,
          is_active: formIsActive,
        });
      } else {
        const initStock = Math.max(0, parseInt(formInitialStock, 10) || 0);
        await createRawMaterial({
          name,
          description: formDesc.trim() || null,
          unit: formUnit.trim() || "un",
          stock_quantity: initStock,
          min_stock: minS,
          image_url: formImageUrl.trim() || null,
          is_active: formIsActive,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingMaterial
          ? "Matéria-prima atualizada com sucesso!"
          : "Matéria-prima cadastrada com sucesso!"
      );
      setMaterialFormOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao salvar matéria-prima");
    },
  });

  // 5. Modal Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!materialToDelete) return;
      return deleteRawMaterial(materialToDelete.id);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || "Matéria-prima removida com sucesso!");
      setDeleteModalOpen(false);
      setMaterialToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao excluir matéria-prima");
    },
  });

  // ----------------------------------------------------
  // LISTAGEM FILTRADA & KPI
  // ----------------------------------------------------
  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q));

      const qty = m.stock_quantity;
      const minS = m.min_stock || 0;

      let matchesStatus = true;
      if (statusFilter === "in_stock") matchesStatus = qty > 0;
      if (statusFilter === "zero_stock") matchesStatus = qty === 0;
      if (statusFilter === "critical") matchesStatus = qty <= minS;
      if (statusFilter === "inactive") matchesStatus = !m.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [rawMaterials, search, statusFilter]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const totalCount = rawMaterials.length;
    const totalStock = rawMaterials.reduce((sum, m) => sum + Number(m.stock_quantity || 0), 0);
    const criticalCount = rawMaterials.filter(
      (m) => m.is_active && m.stock_quantity <= (m.min_stock || 0)
    ).length;
    const inStockCount = rawMaterials.filter((m) => m.stock_quantity > 0).length;

    return { totalCount, totalStock, criticalCount, inStockCount };
  }, [rawMaterials]);

  if (!canView) {
    return <NoAccess message="Você não possui permissão para acessar o módulo de Matérias-Primas." />;
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Cabeçalho Principal */}
      <PageHeader
        title="Matérias-Primas & Insumos"
        description="Gestão exclusiva de estoque de matérias-primas: transfira de baú manual ou dê entrada manual para abastecer a produção."
      >
        <div className="flex flex-wrap items-center gap-2">
          {canTransferBau && (
            <Button
              onClick={() => {
                if (rawMaterials.length > 0) setSelectedMaterialForPull(rawMaterials[0]);
                if (manualBaus.length > 0) setSelectedBauForPull(manualBaus[0].id);
                setPullQuantity("10");
                setPullReason("");
                setPullModalOpen(true);
              }}
              variant="outline"
              className="bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold gap-2 shadow-sm"
              title="Transferir matérias-primas de um baú com modo de movimentação manual"
            >
              <ArrowDownLeft className="h-4 w-4 text-amber-400" />
              Transferir de Baú Manual
            </Button>
          )}

          {canAdjust && (
            <Button
              onClick={() => {
                if (rawMaterials.length > 0) setSelectedMaterialForEntry(rawMaterials[0]);
                setManualEntryQuantity("50");
                setManualEntryReason("");
                setManualEntryModalOpen(true);
              }}
              variant="outline"
              className="bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold gap-2 shadow-sm"
              title="Adicionar saldo de matéria-prima diretamente via entrada manual"
            >
              <PackagePlus className="h-4 w-4 text-emerald-400" />
              Entrada Manual
            </Button>
          )}

          {canCreate && (
            <Button
              onClick={openCreateForm}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold gap-2 shadow-md shadow-amber-600/20"
            >
              <Plus className="h-4 w-4" />
              Nova Matéria-Prima
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Barra de Navegação Unificada do Módulo de Produções */}
      <ProductionNavHeader currentTab="materias-primas" />

      {/* Grid de Métricas / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Insumos */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Total de Insumos
              </span>
              <div className="text-2xl font-black tracking-tight text-foreground font-mono">
                {stats.totalCount}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {stats.inStockCount} com saldo positivo
              </span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Saldo Físico Total */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Saldo em Estoque
              </span>
              <div className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
                {stats.totalStock.toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Unidades totais disponíveis
              </span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Nível Crítico / Reposição */}
        <Card
          className={cn(
            "border-border/60 bg-card/60 backdrop-blur-md shadow-sm transition-all",
            stats.criticalCount > 0 ? "border-rose-500/40 bg-rose-500/5 shadow-rose-500/5" : ""
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Estoque Crítico
              </span>
              <div
                className={cn(
                  "text-2xl font-black tracking-tight font-mono",
                  stats.criticalCount > 0 ? "text-rose-400" : "text-muted-foreground"
                )}
              >
                {stats.criticalCount}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {stats.criticalCount > 0
                  ? "Insumos abaixo do estoque mínimo"
                  : "Todos os níveis adequados"}
              </span>
            </div>
            <div
              className={cn(
                "h-11 w-11 rounded-2xl flex items-center justify-center border",
                stats.criticalCount > 0
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
                  : "bg-muted/40 border-border/40 text-muted-foreground"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Baús Conectados */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Baús Ativos
              </span>
              <div className="text-2xl font-black tracking-tight text-sky-400 font-mono">
                {activeBaus.length}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {activeBaus.filter((b) => (b as any).tipo_gestao === "manual").length} Manuais ·{" "}
                {activeBaus.filter((b) => (b as any).tipo_gestao !== "manual").length} Automáticos
              </span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Warehouse className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas e Visualizações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-secondary/40 p-1 rounded-2xl border border-border/60 h-auto">
            <TabsTrigger
              value="stock"
              className="text-xs font-semibold py-1.5 px-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Estoque de Matérias-Primas ({filteredMaterials.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="baus"
              className="text-xs font-semibold py-1.5 px-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <Boxes className="h-3.5 w-3.5" />
              <span>Insumos nos Baús ({activeBaus.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-xs font-semibold py-1.5 px-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              <span>Histórico & Auditoria ({movements.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Barra de Filtros Rápidos */}
          {activeTab === "stock" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar matéria-prima..."
                  className="pl-8 h-8 text-xs rounded-xl bg-background/60"
                />
              </div>

              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-8 text-xs w-[150px] rounded-xl bg-background/60">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Status</SelectItem>
                  <SelectItem value="in_stock" className="text-xs">Com Estoque (&gt; 0)</SelectItem>
                  <SelectItem value="zero_stock" className="text-xs">Zerados (= 0)</SelectItem>
                  <SelectItem value="critical" className="text-xs">Nível Crítico (&le; Mín)</SelectItem>
                  <SelectItem value="inactive" className="text-xs">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* ABA 1: ESTOQUE DE MATÉRIAS-PRIMAS */}
        {/* ============================================================== */}
        <TabsContent value="stock" className="space-y-4 m-0">
          <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  Catálogo de Insumos da Fábrica
                </CardTitle>
                <CardDescription className="text-xs">
                  Saldos físicos exclusivos para manufatura e consumo nas linhas de produção.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono border-amber-500/30 text-amber-300">
                {filteredMaterials.length} itens listados
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMaterials ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                  <span className="mt-2 block">Carregando estoque de matérias-primas...</span>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                    <Layers className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-foreground text-sm">Nenhuma matéria-prima encontrada</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {search || statusFilter !== "all"
                      ? "Nenhum insumo corresponde aos filtros aplicados."
                      : "Cadastre matérias-primas para iniciar as operações de manufatura."}
                  </p>
                  {canCreate && (
                    <Button onClick={openCreateForm} size="sm" className="text-xs font-bold gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      Cadastrar Primeira Matéria-Prima
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full text-left border-collapse text-xs">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-b border-border/60 text-muted-foreground font-semibold">
                        <TableHead className="p-3.5 pl-5">Matéria-Prima</TableHead>
                        <TableHead className="p-3.5 text-center">Unidade</TableHead>
                        <TableHead className="p-3.5 text-right font-mono">Estoque Físico</TableHead>
                        <TableHead className="p-3.5 text-right font-mono">Mínimo</TableHead>
                        <TableHead className="p-3.5 text-center">Disponível em Baús</TableHead>
                        <TableHead className="p-3.5 text-center">Status</TableHead>
                        <TableHead className="p-3.5 pr-5 text-right">Ações Operacionais</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border/40">
                      {filteredMaterials.map((mat) => {
                        const totalInBaus = getMaterialTotalInAllBaus(mat);
                        const isCritical = mat.stock_quantity <= (mat.min_stock || 0);

                        return (
                          <TableRow
                            key={mat.id}
                            className="hover:bg-muted/20 transition-colors group"
                          >
                            {/* Nome + Imagem */}
                            <TableCell className="p-3.5 pl-5">
                              <div className="flex items-center gap-3">
                                <ProductThumbnail
                                  imageUrl={mat.image_url}
                                  productName={mat.name}
                                  className="h-10 w-10 rounded-xl border border-border/60 shrink-0"
                                />
                                <div className="space-y-0.5">
                                  <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                    {mat.name}
                                    {!mat.is_active && (
                                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                        Inativo
                                      </Badge>
                                    )}
                                  </div>
                                  {mat.description && (
                                    <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[280px]">
                                      {mat.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Unidade */}
                            <TableCell className="p-3.5 text-center">
                              <Badge variant="outline" className="text-[11px] font-mono uppercase bg-secondary/30">
                                {mat.unit || "un"}
                              </Badge>
                            </TableCell>

                            {/* Saldo Atual */}
                            <TableCell className="p-3.5 text-right font-mono">
                              <div className="space-y-0.5">
                                <span
                                  className={cn(
                                    "text-sm font-black",
                                    mat.stock_quantity === 0
                                      ? "text-muted-foreground"
                                      : isCritical
                                      ? "text-rose-400 font-bold"
                                      : "text-emerald-400"
                                  )}
                                >
                                  {mat.stock_quantity.toLocaleString()} {mat.unit}
                                </span>
                              </div>
                            </TableCell>

                            {/* Estoque Mínimo */}
                            <TableCell className="p-3.5 text-right font-mono text-muted-foreground text-xs">
                              {(mat.min_stock || 0).toLocaleString()} {mat.unit}
                            </TableCell>

                            {/* Saldo nos Baús */}
                            <TableCell className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-xs font-bold">
                                <Boxes className="h-3 w-3 text-sky-400" />
                                {totalInBaus.toLocaleString()} {mat.unit}
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="p-3.5 text-center">
                              {mat.stock_quantity === 0 ? (
                                <Badge variant="outline" className="text-[10px] border-rose-500/30 bg-rose-500/10 text-rose-300">
                                  Zerado
                                </Badge>
                              ) : isCritical ? (
                                <Badge variant="outline" className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-300 font-semibold animate-pulse">
                                  Reposição
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                                  Adequado
                                </Badge>
                              )}
                            </TableCell>

                            {/* Ações */}
                            <TableCell className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Puxar do Baú Manual */}
                                {canTransferBau && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMaterialForPull(mat);
                                      if (manualBaus.length > 0) setSelectedBauForPull(manualBaus[0].id);
                                      setPullQuantity("10");
                                      setPullReason("");
                                      setPullModalOpen(true);
                                    }}
                                    className="h-7 px-2 text-[11px] gap-1 bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                    title="Transferir saldo de baú manual para o estoque"
                                  >
                                    <ArrowDownLeft className="h-3 w-3" />
                                    Puxar Baú
                                  </Button>
                                )}

                                {/* Entrada Manual */}
                                {canAdjust && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMaterialForEntry(mat);
                                      setManualEntryQuantity("50");
                                      setManualEntryReason("");
                                      setManualEntryModalOpen(true);
                                    }}
                                    className="h-7 px-2 text-[11px] gap-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                    title="Dar entrada manual no estoque desta matéria-prima"
                                  >
                                    <PackagePlus className="h-3 w-3 text-emerald-400" />
                                    Entrada
                                  </Button>
                                )}

                                {/* Devolver para Baú */}
                                {canTransferBau && mat.stock_quantity > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMaterialForReturn(mat);
                                      if (activeBaus.length > 0) setSelectedBauForReturn(activeBaus[0].id);
                                      setReturnQuantity("10");
                                      setReturnReason("");
                                      setReturnModalOpen(true);
                                    }}
                                    className="h-7 px-2 text-[11px] gap-1 bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
                                    title="Devolver / Transferir estoque para baú"
                                  >
                                    <ArrowUpRight className="h-3 w-3" />
                                    Devolver
                                  </Button>
                                )}

                                {/* Ajuste Manual */}
                                {canAdjust && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setAdjustMaterial(mat);
                                      setAdjustMode("add");
                                      setAdjustAmount("10");
                                      setAdjustReasonText("");
                                      setAdjustModalOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                    title="Ajuste manual de estoque"
                                  >
                                    <Sliders className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {/* Editar */}
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditForm(mat)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                    title="Editar matéria-prima"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {/* Excluir */}
                                {canDelete && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setMaterialToDelete(mat);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                    title="Excluir matéria-prima"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* ABA 2: INSUMOS NOS BAÚS */}
        {/* ============================================================== */}
        <TabsContent value="baus" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBaus.map((bau) => {
              const isManual =
                (bau as any).tipo_gestao?.toLowerCase() === "manual" || !(bau as any).discord_channel_id;

              // Encontra insumos que possuem saldo neste baú
              const materialsInThisBau = rawMaterials.map((mat) => {
                const stock = getMaterialStockInBau(mat, bau.id);
                return { mat, stock };
              });

              const itemsWithStock = materialsInThisBau.filter((item) => item.stock > 0);

              return (
                <Card
                  key={bau.id}
                  className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <CardHeader className="p-4 border-b border-border/40 bg-muted/10 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-sky-400" />
                        <CardTitle className="text-sm font-bold text-foreground">
                          {bau.nome}
                        </CardTitle>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {bau.descricao || "Baú operacional da facção"}
                      </p>
                    </div>

                    {/* Badge do Modo de Movimentação */}
                    <div className="shrink-0">
                      {isManual ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/15 border-amber-500/40 text-amber-300 text-[10px] font-bold gap-1 py-1"
                        >
                          <HandMetal className="h-3 w-3" />
                          Modo Manual
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-sky-500/15 border-sky-500/40 text-sky-300 text-[10px] font-bold gap-1 py-1"
                        >
                          <Zap className="h-3 w-3 text-sky-400" />
                          Modo Automático
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1">
                    {/* Alerta de Regra Operacional */}
                    <div
                      className={cn(
                        "p-2.5 rounded-xl text-[11px] border flex items-start gap-2",
                        isManual
                          ? "bg-amber-500/5 border-amber-500/20 text-amber-300/90"
                          : "bg-sky-500/5 border-sky-500/20 text-sky-300/90"
                      )}
                    >
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <div>
                        {isManual ? (
                          <span>
                            <strong>Regra de Débito:</strong> Ao puxar saldos deste baú, haverá{" "}
                            <strong>saída real e dedução imediata</strong> do baú.
                          </span>
                        ) : (
                          <span>
                            <strong>Regra de Sincronia:</strong> Ao puxar saldos deste baú automático, o saldo no baú{" "}
                            <strong>não será deduzido</strong>, creditando direto no estoque.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lista de Matérias-Primas no Baú */}
                    {itemsWithStock.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        Nenhuma matéria-prima com saldo neste baú.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {itemsWithStock.map(({ mat, stock }) => (
                          <div
                            key={mat.id}
                            className="py-2 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <ProductThumbnail
                                imageUrl={mat.image_url}
                                productName={mat.name}
                                className="h-7 w-7 rounded-lg border border-border/40 shrink-0"
                              />
                              <span className="font-semibold text-foreground">{mat.name}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sky-300">
                                {stock.toLocaleString()} {mat.unit}
                              </span>

                              {canTransferBau && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMaterialForPull(mat);
                                    setSelectedBauForPull(bau.id);
                                    setPullQuantity(String(Math.min(stock, 50)));
                                    setPullReason("");
                                    setPullModalOpen(true);
                                  }}
                                  className="h-6 px-2 text-[10px] gap-1 bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                >
                                  <ArrowDownLeft className="h-3 w-3" />
                                  Puxar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* ABA 3: HISTÓRICO & AUDITORIA */}
        {/* ============================================================== */}
        <TabsContent value="history" className="space-y-4 m-0">
          <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Auditoria de Movimentações de Insumos
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro cronológico de entradas de baús, consumos em produções e ajustes de estoque.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {movements.length} registros
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMovements ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <span className="mt-2 block">Carregando histórico de movimentações...</span>
                </div>
              ) : movements.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Nenhuma movimentação de matéria-prima registrada até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full text-left border-collapse text-xs">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-b border-border/60 text-muted-foreground font-semibold">
                        <TableHead className="p-3.5 pl-5">Data/Hora</TableHead>
                        <TableHead className="p-3.5">Matéria-Prima</TableHead>
                        <TableHead className="p-3.5 text-center">Operação</TableHead>
                        <TableHead className="p-3.5 text-right font-mono">Quantidade</TableHead>
                        <TableHead className="p-3.5 text-right font-mono">Saldo Após</TableHead>
                        <TableHead className="p-3.5">Responsável</TableHead>
                        <TableHead className="p-3.5 pr-5">Observação</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border/40">
                      {movements.map((mov) => {
                        const isPositive = mov.quantity > 0;
                        const author = members.find((m) => m.user_id === mov.user_id);
                        const authorName = author?.nickname || author?.nome || "Sistema";

                        let badgeColor = "border-muted-foreground/30 text-muted-foreground";
                        let typeLabel = mov.type;

                        if (mov.type === "BAU_ENTRY") {
                          badgeColor = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
                          typeLabel = "Entrada de Baú";
                        } else if (mov.type === "BAU_RETURN") {
                          badgeColor = "border-sky-500/40 bg-sky-500/10 text-sky-300";
                          typeLabel = "Devolução a Baú";
                        } else if (mov.type === "CONSUMPTION") {
                          badgeColor = "border-amber-500/40 bg-amber-500/10 text-amber-300";
                          typeLabel = "Consumo Produção";
                        } else if (mov.type === "ENTRY") {
                          badgeColor = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
                          typeLabel = "Entrada Manual";
                        } else if (mov.type === "ADJUSTMENT") {
                          badgeColor = "border-purple-500/40 bg-purple-500/10 text-purple-300";
                          typeLabel = "Ajuste Manual";
                        }

                        return (
                          <TableRow key={mov.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="p-3.5 pl-5 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                              {new Date(mov.created_at).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>

                            <TableCell className="p-3.5 font-bold text-foreground">
                              {mov.raw_material?.name || "Matéria-Prima"}
                            </TableCell>

                            <TableCell className="p-3.5 text-center">
                              <Badge variant="outline" className={cn("text-[10px] font-semibold", badgeColor)}>
                                {typeLabel}
                              </Badge>
                            </TableCell>

                            <TableCell className="p-3.5 text-right font-mono font-bold">
                              <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                                {isPositive ? `+${mov.quantity}` : mov.quantity}{" "}
                                {mov.raw_material?.unit || "un"}
                              </span>
                            </TableCell>

                            <TableCell className="p-3.5 text-right font-mono text-muted-foreground text-xs">
                              {mov.resulting_balance.toLocaleString()} {mov.raw_material?.unit || "un"}
                            </TableCell>

                            <TableCell className="p-3.5 font-medium text-foreground">
                              {authorName}
                            </TableCell>

                            <TableCell className="p-3.5 pr-5 text-muted-foreground text-xs max-w-xs truncate">
                              {mov.observation || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/* MODAL 1: TRANSFERIR DE BAÚ MANUAL PARA ESTOQUE */}
      {/* ============================================================== */}
      <Dialog open={pullModalOpen} onOpenChange={setPullModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ArrowDownLeft className="h-5 w-5 text-amber-400" />
              Transferir de Baú (Modo Manual) para Estoque
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transfira matérias-primas de um baú com modo de movimentação manual diretamente para o armazém.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Selecionar Matéria-Prima */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Matéria-Prima</Label>
              <Select
                value={selectedMaterialForPull?.id || ""}
                onChangeCapture={() => {}}
                onValueChange={(val) => {
                  const found = rawMaterials.find((m) => m.id === val);
                  setSelectedMaterialForPull(found || null);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                  <SelectValue placeholder="Selecione a matéria-prima" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} (Estoque atual: {m.stock_quantity} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Selecionar Baú de Origem (Apenas Manuais) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Baú de Origem (Modo Manual)</Label>
                <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                  {manualBaus.length} baú(s) manual(is)
                </span>
              </div>
              {manualBaus.length === 0 ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  ⚠️ Nenhum baú ativo em modo de movimentação manual foi encontrado. Apenas baús manuais permitem transferência de insumos para o estoque.
                </div>
              ) : (
                <Select value={selectedBauForPull} onValueChange={setSelectedBauForPull}>
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                    <SelectValue placeholder="Selecione o baú manual" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualBaus.map((b) => {
                      const stockInB = selectedMaterialForPull
                        ? getMaterialStockInBau(selectedMaterialForPull, b.id)
                        : 0;
                      return (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.nome} · [MODO MANUAL] · Disp: {stockInB} {selectedMaterialForPull?.unit || "un"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 3. Destaque Visual da Regra de Negócio */}
            {activeBauSelectedForPull && (
              <div className="p-3 rounded-xl border text-xs space-y-1.5 bg-amber-500/10 border-amber-500/30 text-amber-200">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <HandMetal className="h-4 w-4 text-amber-400" />
                    Baú em Modo de Movimentação MANUAL
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300">
                    Disponível no Baú: {availableInSelectedBau} {selectedMaterialForPull?.unit || "un"}
                  </Badge>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  ⚠️ <strong>Regra de Transferência Manual:</strong> A quantidade informada será{" "}
                  <strong>debitada do saldo do baú manual</strong> com registro de saída e creditada
                  no estoque de matérias-primas do armazém.
                </p>
              </div>
            )}

            {/* 4. Quantidade a Transferir */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade a Transferir</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPullQuantity("10")}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono"
                  >
                    10
                  </button>
                  <button
                    type="button"
                    onClick={() => setPullQuantity("50")}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono"
                  >
                    50
                  </button>
                  <button
                    type="button"
                    onClick={() => setPullQuantity("100")}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono"
                  >
                    100
                  </button>
                  {availableInSelectedBau > 0 && (
                    <button
                      type="button"
                      onClick={() => setPullQuantity(String(availableInSelectedBau))}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono"
                    >
                      TUDO ({availableInSelectedBau})
                    </button>
                  )}
                </div>
              </div>
              <Input
                type="number"
                min="1"
                max={availableInSelectedBau || undefined}
                value={pullQuantity}
                onChange={(e) => setPullQuantity(e.target.value)}
                placeholder="Ex: 50"
                className="h-9 text-xs rounded-xl bg-background/60 font-mono"
              />
            </div>

            {/* 5. Motivo / Observação */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo / Observação (Opcional)</Label>
              <Input
                value={pullReason}
                onChange={(e) => setPullReason(e.target.value)}
                placeholder="Ex: Abastecimento de linha de manufatura"
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPullModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={
                pullMutation.isPending ||
                !selectedMaterialForPull ||
                !selectedBauForPull ||
                availableInSelectedBau <= 0
              }
              onClick={() => pullMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white gap-1.5 shadow-md shadow-amber-600/20"
            >
              {pullMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: ENTRADA MANUAL NO ESTOQUE */}
      {/* ============================================================== */}
      <Dialog open={manualEntryModalOpen} onOpenChange={setManualEntryModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <PackagePlus className="h-5 w-5 text-emerald-400" />
              Entrada Manual de Matéria-Prima
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adicione insumos diretamente ao estoque do armazém com registro completo em auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Selecionar Matéria-Prima */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Matéria-Prima</Label>
              <Select
                value={selectedMaterialForEntry?.id || ""}
                onValueChange={(val) => {
                  const found = rawMaterials.find((m) => m.id === val);
                  setSelectedMaterialForEntry(found || null);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                  <SelectValue placeholder="Selecione a matéria-prima" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} (Saldo atual: {m.stock_quantity} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Previsão de Saldo */}
            {selectedMaterialForEntry && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Saldo Atual:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {selectedMaterialForEntry.stock_quantity} {selectedMaterialForEntry.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[11px]">Saldo Projetado:</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {selectedMaterialForEntry.stock_quantity + (parseInt(manualEntryQuantity, 10) || 0)}{" "}
                    {selectedMaterialForEntry.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Quantidade a Adicionar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade da Entrada</Label>
                <div className="flex items-center gap-1">
                  {["10", "50", "100", "500"].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setManualEntryQuantity(qty)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                min="1"
                value={manualEntryQuantity}
                onChange={(e) => setManualEntryQuantity(e.target.value)}
                placeholder="Ex: 50"
                className="h-9 text-xs rounded-xl bg-background/60 font-mono"
              />
            </div>

            {/* Motivo / Observação */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo / Observação (Opcional)</Label>
              <Input
                value={manualEntryReason}
                onChange={(e) => setManualEntryReason(e.target.value)}
                placeholder="Ex: Coleta externa, compra avulsa, doação de membro..."
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualEntryModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={manualEntryMutation.isPending || !selectedMaterialForEntry || !manualEntryQuantity}
              onClick={() => manualEntryMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md shadow-emerald-600/20"
            >
              {manualEntryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4" />
              )}
              Confirmar Entrada Manual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 2: DEVOLVER / TRANSFERIR PARA BAÚ */}
      {/* ============================================================== */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ArrowUpRight className="h-5 w-5 text-sky-400" />
              Transferir / Devolver para Baú
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Envie insumos do estoque de matérias-primas de volta para um baú da facção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-xs flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px]">Matéria-Prima:</span>
                <strong className="text-foreground text-sm">{selectedMaterialForReturn?.name}</strong>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">Saldo Disponível:</span>
                <strong className="text-emerald-400 font-mono text-sm">
                  {selectedMaterialForReturn?.stock_quantity} {selectedMaterialForReturn?.unit}
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Baú de Destino</Label>
              <Select value={selectedBauForReturn} onValueChange={setSelectedBauForReturn}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                  <SelectValue placeholder="Selecione o baú" />
                </SelectTrigger>
                <SelectContent>
                  {activeBaus.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.nome} · [{(b as any).tipo_gestao === "manual" ? "MANUAL" : "AUTOMÁTICO"}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade a Transferir</Label>
              <Input
                type="number"
                min="1"
                max={selectedMaterialForReturn?.stock_quantity || 1}
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(e.target.value)}
                className="h-9 text-xs rounded-xl bg-background/60 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo (Opcional)</Label>
              <Input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ex: Devolução de excedente de produção"
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setReturnModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={returnMutation.isPending || !selectedMaterialForReturn || !selectedBauForReturn}
              onClick={() => returnMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white gap-1.5"
            >
              {returnMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 3: AJUSTE RÁPIDO DE ESTOQUE */}
      {/* ============================================================== */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Sliders className="h-5 w-5 text-purple-400" />
              Ajuste Manual de Estoque
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Retifique o saldo físico de {adjustMaterial?.name} com registro detalhado em auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Saldo Atual:</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {adjustMaterial?.stock_quantity} {adjustMaterial?.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">Saldo Projetado:</span>
                <span className="font-mono text-sm font-bold text-purple-400">
                  {projectedStockAfterAdjust} {adjustMaterial?.unit}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={adjustMode === "add" ? "default" : "outline"}
                onClick={() => setAdjustMode("add")}
                className={cn(
                  "text-xs rounded-xl gap-1.5 font-bold",
                  adjustMode === "add" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                )}
              >
                <PackagePlus className="h-4 w-4" />
                Adicionar (+)
              </Button>
              <Button
                type="button"
                variant={adjustMode === "remove" ? "default" : "outline"}
                onClick={() => setAdjustMode("remove")}
                className={cn(
                  "text-xs rounded-xl gap-1.5 font-bold",
                  adjustMode === "remove" ? "bg-rose-600 hover:bg-rose-500 text-white" : ""
                )}
              >
                <PackageMinus className="h-4 w-4" />
                Remover (-)
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade da Variação</Label>
              <Input
                type="number"
                min="1"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="h-9 text-xs rounded-xl bg-background/60 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo da Retificação *</Label>
              <Input
                value={adjustReasonText}
                onChange={(e) => setAdjustReasonText(e.target.value)}
                placeholder="Ex: Auditoria semanal de contagem física"
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={adjustMutation.isPending || !adjustReasonText.trim()}
              onClick={() => adjustMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            >
              {adjustMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 4: CADASTRAR / EDITAR MATÉRIA-PRIMA */}
      {/* ============================================================== */}
      <Dialog open={materialFormOpen} onOpenChange={setMaterialFormOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-amber-400" />
              {editingMaterial ? "Editar Matéria-Prima" : "Cadastrar Nova Matéria-Prima"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina os parâmetros do insumo para utilização no catálogo de receitas da facção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Insumo *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Pólvora, Chapa de Metal, Tecido..."
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Unidade de Medida *</Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60 font-mono">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un" className="text-xs">un (Unidades)</SelectItem>
                    <SelectItem value="kg" className="text-xs">kg (Quilogramas)</SelectItem>
                    <SelectItem value="g" className="text-xs">g (Gramas)</SelectItem>
                    <SelectItem value="l" className="text-xs">l (Litros)</SelectItem>
                    <SelectItem value="ml" className="text-xs">ml (Mililitros)</SelectItem>
                    <SelectItem value="pct" className="text-xs">pct (Pacote)</SelectItem>
                    <SelectItem value="cx" className="text-xs">cx (Caixa)</SelectItem>
                    <SelectItem value="barra" className="text-xs">barra (Barras)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estoque Mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(e.target.value)}
                  placeholder="Ex: 20"
                  className="h-9 text-xs rounded-xl bg-background/60 font-mono"
                />
              </div>
            </div>

            {!editingMaterial && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estoque Inicial Físico</Label>
                <Input
                  type="number"
                  min="0"
                  value={formInitialStock}
                  onChange={(e) => setFormInitialStock(e.target.value)}
                  placeholder="0"
                  className="h-9 text-xs rounded-xl bg-background/60 font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Breve descrição ou instruções de uso..."
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Imagem / Ícone (URL ou Upload)</Label>
              <div className="flex gap-2">
                <Input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-xs rounded-xl bg-background/60 flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  <div className="h-9 px-3 rounded-xl border border-border/60 bg-secondary/50 hover:bg-secondary flex items-center justify-center text-xs gap-1 font-semibold text-muted-foreground hover:text-foreground">
                    {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setMaterialFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={saveMaterialMutation.isPending || !formName.trim()}
              onClick={() => saveMaterialMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
            >
              {saveMaterialMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingMaterial ? "Salvar Alterações" : "Cadastrar Insumo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 5: CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ============================================================== */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              Excluir Matéria-Prima
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja remover <strong>{materialToDelete?.name}</strong>? Se houver
              histórico ou receitas vinculadas, ela será desativada com segurança.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              className="text-xs rounded-xl font-bold gap-1.5"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
