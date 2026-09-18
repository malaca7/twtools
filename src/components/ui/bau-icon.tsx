import React from "react";
import {
  Box,
  Package,
  Shield,
  FlaskConical,
  Archive,
  Database,
  Warehouse,
  Lock,
  Gem,
  DollarSign,
  Key,
  FolderLock,
  Layers,
  Container,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BauIconProps {
  icone?: string | null;
  className?: string;
  fallbackEmoji?: string;
}

export const BauIcon: React.FC<BauIconProps> = ({
  icone,
  className = "w-5 h-5",
  fallbackEmoji = "📦",
}) => {
  if (!icone) {
    return <Box className={cn("shrink-0", className)} />;
  }

  const clean = icone.trim().toLowerCase();

  // If it's an emoji (character length is short and contains unicode emoji)
  const isEmoji = /\p{Extended_Pictographic}/u.test(icone);
  if (isEmoji && !clean.includes("-") && !clean.includes("box") && !clean.includes("package")) {
    return <span className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}>{icone}</span>;
  }

  switch (clean) {
    case "box":
    case "caixa":
    case "📦":
      return <Box className={cn("shrink-0", className)} />;
    case "package":
    case "pacote":
    case "embrulho":
      return <Package className={cn("shrink-0", className)} />;
    case "shield":
    case "armas":
    case "protecao":
    case "🛡️":
      return <Shield className={cn("shrink-0", className)} />;
    case "flask-conical":
    case "flask":
    case "insumos":
    case "quimicos":
    case "drogas":
    case "🧪":
      return <FlaskConical className={cn("shrink-0", className)} />;
    case "archive":
    case "arquivo":
    case "gaveta":
      return <Archive className={cn("shrink-0", className)} />;
    case "database":
    case "banco":
      return <Database className={cn("shrink-0", className)} />;
    case "warehouse":
    case "armazem":
    case "galpao":
      return <Warehouse className={cn("shrink-0", className)} />;
    case "lock":
    case "cadeado":
    case "seguro":
    case "🔒":
      return <Lock className={cn("shrink-0", className)} />;
    case "gem":
    case "diamante":
    case "joias":
    case "💎":
      return <Gem className={cn("shrink-0", className)} />;
    case "dollar-sign":
    case "dollar":
    case "dinheiro":
    case "💰":
      return <DollarSign className={cn("shrink-0", className)} />;
    case "key":
    case "chave":
    case "🔑":
      return <Key className={cn("shrink-0", className)} />;
    case "folder-lock":
      return <FolderLock className={cn("shrink-0", className)} />;
    case "layers":
      return <Layers className={cn("shrink-0", className)} />;
    case "container":
      return <Container className={cn("shrink-0", className)} />;
    default:
      if (isEmoji) {
        return <span className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}>{icone}</span>;
      }
      return <Box className={cn("shrink-0", className)} />;
  }
};
