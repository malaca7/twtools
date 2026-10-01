import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Factory, Warehouse, Sliders, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ProductionNavHeaderProps {
  currentTab: "produzir" | "armazem" | "gestao" | "vendas";
  className?: string;
}

export function ProductionNavHeader({ currentTab, className }: ProductionNavHeaderProps) {
  const { hasPermission, isDevMode, isCeoMode } = useAuth();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const canViewProduzir = isDevMode || hasPermission("productions.view") || hasPermission("productions.create") || hasPermission("view_productions");
  const canViewArmazem = isDevMode || hasPermission("warehouse.view") || hasPermission("warehouse.transfer") || hasPermission("view_warehouse");
  const canViewGestao = isDevMode || hasPermission("production_management.view") || hasPermission("view_production_management");
  const canViewVendas = isDevMode || hasPermission("view_sales") || hasPermission("sales.view");

  const items = [
    {
      id: "produzir",
      label: "Estação de Produção",
      shortLabel: "Produzir",
      href: `${prefix}/producoes/produzir`,
      icon: Factory,
      visible: canViewProduzir,
      activeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10",
      activeIconColor: "text-amber-400",
    },
    {
      id: "armazem",
      label: "Armazém Central",
      shortLabel: "Armazém",
      href: `${prefix}/producoes/armazem`,
      icon: Warehouse,
      visible: canViewArmazem,
      activeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10",
      activeIconColor: "text-emerald-400",
    },
    {
      id: "gestao",
      label: "Gestão & Fábrica",
      shortLabel: "Gestão",
      href: `${prefix}/producoes/gestao`,
      icon: Sliders,
      visible: canViewGestao,
      activeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10",
      activeIconColor: "text-sky-400",
    },
    {
      id: "vendas",
      label: "Vendas",
      shortLabel: "Vendas",
      href: `${prefix}/vendas`,
      icon: ShoppingCart,
      visible: canViewVendas,
      activeColor: "bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/10",
      activeIconColor: "text-violet-400",
    },
  ].filter((i) => i.visible);

  return (
    <nav
      aria-label="Navegação do Módulo de Produções"
      className={cn(
        "flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/35 border border-border/60 overflow-x-auto scrollbar-none max-w-full",
        className
      )}
    >
      {items.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap border shrink-0 cursor-pointer",
              isActive
                ? cn(item.activeColor, "border")
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? item.activeIconColor : "text-muted-foreground")} />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
