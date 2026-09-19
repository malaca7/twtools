import React, { useState } from "react";
import {
  Radio,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Link as LinkIcon,
  Sparkles,
  Search,
  Check,
  Globe,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SOCIAL_PLATFORMS,
  SocialPlatformButton,
  type SocialPlatformKey,
} from "@/components/profile/SocialPlatformIcons";
import type { SocialLinks } from "@/types/profileFeed";
import { cn } from "@/lib/utils";

interface SocialNetworksConfigCardProps {
  socialLinks: SocialLinks;
  onChange: (updated: SocialLinks) => void;
  className?: string;
}

export function SocialNetworksConfigCard({
  socialLinks,
  onChange,
  className,
}: SocialNetworksConfigCardProps) {
  const [activePlatformFilter, setActivePlatformFilter] = useState<"all" | "linked">("all");

  const platformsList = Object.keys(SOCIAL_PLATFORMS) as SocialPlatformKey[];

  const linkedCount = platformsList.filter((k) => Boolean(socialLinks[k]?.trim())).length;

  const handleUpdate = (platform: SocialPlatformKey, value: string) => {
    const clean = value.trim();
    const next: SocialLinks = {
      ...socialLinks,
      [platform]: clean || undefined,
    };
    onChange(next);
  };

  const handleClear = (platform: SocialPlatformKey) => {
    const next: SocialLinks = { ...socialLinks };
    delete next[platform];
    onChange(next);
  };

  const displayedPlatforms =
    activePlatformFilter === "linked"
      ? platformsList.filter((k) => Boolean(socialLinks[k]?.trim()))
      : platformsList;

  return (
    <Card className={cn("surface-card border-border/80", className)}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-rose-400" />
              <CardTitle className="text-base font-semibold text-foreground">
                Redes Sociais & Contas Vinculadas
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
              >
                {linkedCount} {linkedCount === 1 ? "vinculada" : "vinculadas"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Vincule suas contas para exibir botões modernos com apenas os ícones oficiais no seu perfil público.
            </CardDescription>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-secondary/60 p-1 rounded-xl border border-border/60 text-xs">
            <Button
              type="button"
              size="sm"
              variant={activePlatformFilter === "all" ? "secondary" : "ghost"}
              onClick={() => setActivePlatformFilter("all")}
              className="h-7 px-2.5 text-[11px] font-bold rounded-lg"
            >
              Todas ({platformsList.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activePlatformFilter === "linked" ? "secondary" : "ghost"}
              onClick={() => setActivePlatformFilter("linked")}
              className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1"
            >
              <span>Vinculadas</span>
              <span className="text-primary font-mono font-bold">({linkedCount})</span>
            </Button>
          </div>
        </div>

        {/* Live Preview of Connected Icons */}
        {linkedCount > 0 && (
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-border/40 mt-3">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Prévia dos botões no seu perfil público:
            </span>
            <div className="flex items-center gap-2">
              {platformsList
                .filter((k) => Boolean(socialLinks[k]?.trim()))
                .map((platform) => (
                  <SocialPlatformButton
                    key={platform}
                    platform={platform}
                    value={socialLinks[platform]!}
                    size="sm"
                  />
                ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          {displayedPlatforms.map((platform) => {
            const meta = SOCIAL_PLATFORMS[platform];
            const currentValue = socialLinks[platform] || "";
            const isLinked = Boolean(currentValue.trim());
            const finalUrl = isLinked ? meta.formatUrl(currentValue) : "";
            const IconComponent = meta.icon;

            return (
              <div
                key={platform}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all space-y-2.5",
                  isLinked
                    ? "bg-secondary/40 border-primary/40 shadow-xs"
                    : "bg-secondary/15 border-border/60 hover:border-border"
                )}
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-transform",
                        isLinked
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-secondary/80 text-muted-foreground border border-border/60"
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground truncate">{meta.name}</span>
                        {isLinked ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono border-emerald-500/40 text-emerald-400 bg-emerald-500/10 py-0 px-1"
                          >
                            ● Vinculado
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Não vinculado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions when linked: Test & Clear */}
                  {isLinked && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(finalUrl, "_blank", "noopener,noreferrer")}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                        title="Abrir e testar link direto da conta"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClear(platform)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        title="Desvincular rede social"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Input Field with Prefix */}
                <div className="relative flex items-center">
                  {meta.prefix && (
                    <span className="absolute left-3 text-muted-foreground text-xs font-mono font-bold pointer-events-none select-none">
                      {meta.prefix}
                    </span>
                  )}
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleUpdate(platform, e.target.value)}
                    placeholder={meta.placeholder}
                    className={cn(
                      "h-8 text-xs font-medium rounded-xl transition-all",
                      meta.prefix ? (meta.prefix.length > 5 ? "pl-20" : "pl-8") : "pl-3",
                      isLinked && "border-primary/40 bg-background/80"
                    )}
                  />
                </div>

                {/* Link Preview when linked */}
                {isLinked && (
                  <p className="text-[10px] font-mono text-muted-foreground truncate pl-1 flex items-center gap-1">
                    <LinkIcon className="h-2.5 w-2.5 text-primary shrink-0" />
                    <span className="truncate">{finalUrl}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {displayedPlatforms.length === 0 && (
          <div className="py-8 text-center space-y-2 border border-dashed border-border/70 rounded-2xl">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-bold text-foreground">Nenhuma rede social vinculada ainda.</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Selecione a aba "Todas" para conectar suas contas de redes sociais e canais de streaming.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivePlatformFilter("all")}
              className="text-xs h-8 mt-2"
            >
              Ver Todas as Plataformas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
