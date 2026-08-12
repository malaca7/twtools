import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { MovementDialog } from "@/components/operations/MovementDialog";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, useProducts } from "@/hooks/useData";
import { currency, num } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/estoque")({
  component: EstoquePage,
});

function EstoquePage() {
  const [term, setTerm] = useState("");
  const { hasPermission } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const list = products.filter((p) =>
    p.nome.toLowerCase().includes(term.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Estoque"
        description="Saldo atual por produto, com alerta de estoque mínimo."
        actions={
          hasPermission("create_movement") ? (
            <div className="flex gap-2">
              <MovementDialog
                defaultType="entrada"
                trigger={
                  <Button variant="outline" size="sm">
                    <ArrowDownCircle className="mr-1 h-4 w-4" /> Entrada
                  </Button>
                }
              />
              <MovementDialog
                defaultType="saida"
                trigger={
                  <Button
                    size="sm"
                    className="bg-gradient-brand text-primary-foreground hover:opacity-90"
                  >
                    <ArrowUpCircle className="mr-1 h-4 w-4" /> Saída
                  </Button>
                }
              />
            </div>
          ) : null
        }
      />

      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar produto..."
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando estoque...</p>
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Cadastre produtos na aba Produtos para controlar o estoque."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const atual = Number(p.estoque_atual);
            const minimo = Number(p.estoque_minimo);
            const low = atual <= minimo;
            const category = categories.find((c) => c.id === p.categoria_id);
            return (
              <Card key={p.id} className="surface-card">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {category?.nome ?? "Sem categoria"} · {currency(p.preco_sugerido)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        low
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-success/40 bg-success/10 text-success"
                      }
                    >
                      {low ? "Estoque baixo" : "Ok"}
                    </Badge>
                  </div>
                  <Progress value={minimo ? Math.min(100, (atual / (minimo * 2)) * 100) : 100} />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {num(atual)} {p.unidade}
                    </span>{" "}
                    · mínimo {num(minimo)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
