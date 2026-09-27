import React, { useState, useEffect } from "react";
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
import { getProxiedImageUrl } from "@/services/postimagesService";

export interface BauIconProps {
  icone?: string | null;
  foto_url?: string | null;
  imagem_url?: string | null;
  nome?: string;
  className?: string;
  imgClassName?: string;
  fallbackEmoji?: string;
  showPhoto?: boolean;
}

export const BauIcon: React.FC<BauIconProps> = ({
  icone,
  foto_url,
  imagem_url,
  nome,
  className = "w-5 h-5",
  imgClassName,
  fallbackEmoji = "📦",
  showPhoto = true,
}) => {
  const photo = (foto_url || imagem_url)?.trim();
  const [imgError, setImgError] = useState(false);
  const [useDirectPhoto, setUseDirectPhoto] = useState(false);

  useEffect(() => {
    setImgError(false);
    setUseDirectPhoto(false);
  }, [photo]);

  const proxiedPhoto = photo ? getProxiedImageUrl(photo) : "";
  const currentPhoto = useDirectPhoto ? photo : (proxiedPhoto || photo);

  const handlePhotoError = () => {
    if (!useDirectPhoto && proxiedPhoto !== photo && photo) {
      setUseDirectPhoto(true);
    } else {
      setImgError(true);
    }
  };

  if (showPhoto && currentPhoto && !imgError) {
    return (
      <img
        key={currentPhoto}
        src={currentPhoto}
        alt={nome || "Baú"}
        referrerPolicy="no-referrer"
        className={cn(
          "shrink-0 rounded-lg object-cover border border-border/80 shadow-xs",
          className,
          imgClassName
        )}
        loading="lazy"
        onError={handlePhotoError}
      />
    );
  }

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
