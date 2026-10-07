import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CeoBadge, DevBadge } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTheme } from "@/lib/panelTheme";

interface CeoGuardProps {
  children: ReactNode;
}

export function CeoGuard({ children }: CeoGuardProps) {
  const { isCeoUser, isDevUser, loading, hasPermission } = useAuth();
  const { ceoStyle, devStyle, CeoIcon, DevIcon } = usePanelTheme();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: `${ceoStyle.primaryHex}40`, borderTopColor: ceoStyle.primaryHex }}
          />
          <p className="text-xs text-muted-foreground font-medium">Verificando credenciais executivas (Tag CEO)...</p>
        </div>
      </div>
    );
  }

  const hasAccess = Boolean(
    isCeoUser ||
    isDevUser ||
    hasPermission("view_ceo") ||
    hasPermission("view_ceo_tag_permissions") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("create_ceo_tag") ||
    hasPermission("edit_ceo_tag") ||
    hasPermission("delete_ceo_tag") ||
    hasPermission("assign_ceo_tag") ||
    hasPermission("manage_ceo_tag_rules") ||
    hasPermission("manage_ceo_tag_permissions_detail") ||
    hasPermission("view_warnings") ||
    hasPermission("manage_warnings") ||
    hasPermission("view_ceo_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("view_ceo_financials") ||
    hasPermission("manage_ceo_bot") ||
    hasPermission("manage_ceo_webhooks") ||
    hasPermission("view_ceo_stock_adjustments") ||
    hasPermission("view_ceo_notifications") ||
    hasPermission("verification.manage")
  );

  if (!hasAccess) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-4 sm:p-8 animate-in fade-in-50 duration-300">
        <Card
          className="max-w-md w-full surface-card text-center p-6 space-y-5 transition-all"
          style={{
            borderColor: `${ceoStyle.primaryHex}35`,
            backgroundColor: `${ceoStyle.primaryHex}06`,
            boxShadow: `0 0 35px ${ceoStyle.primaryHex}15`,
          }}
        >
          <CardHeader className="p-0 space-y-3">
            <div
              className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center shadow-md transition-all"
              style={{
                backgroundColor: `${ceoStyle.primaryHex}20`,
                borderColor: `${ceoStyle.primaryHex}40`,
                borderWidth: "1px",
                color: ceoStyle.primaryHex,
              }}
            >
              <CeoIcon className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="text-[10px] font-mono font-bold"
                style={{
                  borderColor: `${ceoStyle.primaryHex}40`,
                  color: ceoStyle.primaryHex,
                  backgroundColor: `${ceoStyle.primaryHex}15`,
                }}
              >
                DIRETORIA EXECUTIVA · 403
              </Badge>
              <CardTitle className="text-lg font-black text-foreground">
                Painel Restrito à Diretoria (Tag CEO)
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 text-xs text-muted-foreground space-y-4">
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              <span>Este painel é de uso exclusivo para membros com</span>
              <CeoBadge size="sm" />
              <span>ou</span>
              <DevBadge size="sm" />
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-[0.7rem] text-left space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" style={{ color: ceoStyle.primaryHex }} /> Política de Acesso Executivo:
              </span>
              <p className="text-muted-foreground">
                Apenas quem possui a Tag Dev pode atribuir a Tag CEO a um membro do grupo. Se você deveria ter acesso a este painel, contate a diretoria de desenvolvimento.
              </p>
            </div>
          </CardContent>

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full text-xs font-bold border-border/80 hover:bg-secondary">
              <Link to="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Voltar ao Painel Operacional
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
