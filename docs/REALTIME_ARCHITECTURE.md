# ⚡ Arquitetura de Sincronização Global em Tempo Real — Twin Wheels

Este documento descreve a arquitetura do sistema de sincronização reativa global em tempo real implementado na plataforma Twin Wheels.

---

## 1. Visão Geral da Arquitetura

O sistema transforma toda a plataforma em uma aplicação **reativa e auto-sincronizada**, onde qualquer inserção, alteração ou exclusão feita no banco de dados (por usuários, líderes, CEO, DEV ou bots) é propagada instantaneamente para todos os frontends conectados, sem que nenhuma página precise ser recarregada.

```
┌────────────────────────────────────────────────────────┐
│               PostgreSQL (Supabase)                    │
│   57 Tabelas Públicas com REPLICA IDENTITY FULL        │
│   Publicação: supabase_realtime                        │
└──────────────────────────┬─────────────────────────────┘
                           │ CDC (Change Data Capture)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Supabase Realtime (WebSocket)              │
│       postgres_changes (INSERT / UPDATE / DELETE)       │
└──────────────────────────┬─────────────────────────────┘
                           │ WSS Events
                           ▼
┌────────────────────────────────────────────────────────┐
│           useRealtimeSync (Global Engine)              │
│  - Debounce / Coalescência de Invalidações (50ms)      │
│  - BroadcastChannel Multi-Abas                         │
│  - Backoff Exponencial & Auto-Reconexão               │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│    TanStack Query Client     │ │   Eventos Específicos / Som   │
│  - Invalida queries ativas   │ │  - tw_auth_reload            │
│  - Refetch seguro com RLS    │ │  - tw_permissions_synced     │
│  - Atualiza componentes UI   │ │  - Audio cues / Notificações  │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Tecnologias Utilizadas

1. **Supabase Realtime (WebSocket / CDC)**:
   - Captura eventos de alteração diretamente do Write-Ahead Log (WAL) do PostgreSQL via publicação `supabase_realtime`.
   - Todas as 57 tabelas do schema `public` configuradas com `REPLICA IDENTITY FULL`.

2. **TanStack Query (React Query)**:
   - Gerencia o cache global de dados do frontend.
   - Recebe invalidações seletivas (`invalidateQueries({ queryKey })`) disparadas pelo motor de tempo real.
   - Refetches são executados apenas para queries montadas na tela (`refetchType: 'active'`), poupando banda e CPU.

3. **BroadcastChannel API**:
   - Canal dedicado `tw_global_realtime_sync` para comunicação instantânea entre abas e janelas do mesmo navegador no cliente.
   - Se um usuário realizar uma mutação ou receber um evento em uma aba, todas as outras abas recebem a invalidação imediatamente com latência zero de rede.

4. **Event Coalescing (Buffer de 50ms)**:
   - Evita tempestades de refetches (*micro-thrashes*) caso múltiplos registros sejam alterados em lote (ex.: importação de estoque ou vendas simultâneas).

---

## 3. Mapeamento de Tabelas e Query Keys

O arquivo [`src/lib/realtimeSync.ts`](file:///d:/dev/web/twtools/src/lib/realtimeSync.ts) centraliza o mapa `TABLE_QUERY_KEYS`, cobrindo 100% dos módulos do sistema:

| Módulo | Tabelas Monitoradas | Query Keys TanStack |
|---|---|---|
| **Usuários & Perfis** | `profiles`, `user_roles`, `custom_roles`, `user_badges` | `["auth"]`, `["members"]`, `["profiles"]`, `["user_roles"]` |
| **Tags & Permissões** | `member_tags`, `member_tag_assignments`, `role_permissions` | `["member_tags"]`, `["member_tag_assignments"]`, `["role_permissions"]` |
| **Estoque & Armazém** | `stock_items`, `stock_movements`, `raw_materials`, `product_materials` | `["stock"]`, `["stock_items"]`, `["stock_movements"]`, `["raw_materials"]` |
| **Vendas & Finanças** | `sales`, `sale_items`, `orders`, `transactions`, `faction_cash_fund` | `["sales"]`, `["orders"]`, `["transactions"]`, `["cash_fund"]`, `["dashboard"]` |
| **Produção** | `productions`, `production_items`, `production_goals`, `recipes` | `["productions"]`, `["production_goals"]`, `["recipes"]`, `["products"]` |
| **Gamificação & Ranking** | `xp_logs`, `insignias`, `gamification_badges`, `ranking_history` | `["ranking"]`, `["ranking_summary"]`, `["xp_logs"]`, `["insignias"]` |
| **Notificações & Avisos** | `notifications`, `announcements`, `announcement_read_status` | `["notifications"]`, `["unread_notifications_count"]`, `["announcements"]` |
| **Chat & Suporte** | `chat_messages`, `support_tickets`, `ticket_messages` | `["chat_messages"]`, `["tickets"]`, `["ticket_messages"]` |
| **Configurações & Sistema** | `platform_settings`, `maintenance_logs`, `audit_logs` | `["platform_settings"]`, `["audit_logs"]`, `["maintenance_logs"]` |

---

## 4. Eventos do Sistema

Os seguintes eventos canônicos estão formalizados no enum `REALTIME_EVENTS`:

- **Usuários**: `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `XP_UPDATED`
- **Permissões & Tags**: `TAG_CREATED`, `TAG_UPDATED`, `TAG_DELETED`, `PERMISSION_UPDATED`, `ROLE_UPDATED`
- **Catálogo & Estoque**: `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `STOCK_UPDATED`, `RAW_MATERIAL_UPDATED`
- **Produção**: `PRODUCTION_CREATED`, `PRODUCTION_UPDATED`, `PRODUCTION_GOAL_UPDATED`
- **Vendas**: `SALE_CREATED`, `SALE_UPDATED`, `SALE_DELETED`, `ORDER_CREATED`, `ORDER_UPDATED`
- **Gamificação & Ranking**: `RANKING_UPDATED`, `BADGE_ADDED`, `BADGE_REMOVED`, `XP_LOG_CREATED`
- **Notificações**: `NOTIFICATION_CREATED`, `NOTIFICATION_UPDATED`, `ANNOUNCEMENT_CREATED`
- **Sistema**: `SETTINGS_UPDATED`, `MAINTENANCE_TOGGLED`, `AUDIT_LOG_CREATED`

---

## 5. Como Adicionar Novos Eventos ou Novas Tabelas

1. Abra [`src/lib/realtimeSync.ts`](file:///d:/dev/web/twtools/src/lib/realtimeSync.ts).
2. Adicione a nova chave/tabela no objeto `TABLE_QUERY_KEYS`:
   ```ts
   TABLE_QUERY_KEYS: {
     ...
     minha_nova_tabela: [
       ["minha_query_key"],
       ["dashboard"],
     ],
   }
   ```
3. Se a tabela for nova no PostgreSQL, execute no banco para habilitar a replicação:
   ```sql
   ALTER TABLE public.minha_nova_tabela REPLICA IDENTITY FULL;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.minha_nova_tabela;
   ```
4. Se a alteração exigir ações de interface ou sons específicos, adicione um handler em [`src/hooks/useRealtimeSync.ts`](file:///d:/dev/web/twtools/src/hooks/useRealtimeSync.ts).

---

## 6. Como os Componentes Recebem Atualizações

Os componentes da aplicação utilizam o padrão padrão do TanStack Query:

```tsx
// Exemplo: O componente simplesmente lê os dados através do useQuery
export function MinhaListaDeVendas() {
  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
  });

  return (
    <div>
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}
```

Quando qualquer alteração ocorre no banco de dados na tabela `sales`:
1. O WebSocket recebe o evento `postgres_changes`.
2. O motor identifica a tabela `sales` e agenda a invalidação de `["sales"]`.
3. O TanStack Query reexecuta `fetchSales` em segundo plano de forma imperceptível.
4. A UI é renderizada reativamente com os novos dados, **sem nenhum recarregamento de página**.

---

## 7. Como Funciona a Reconexão e Tolerância a Falhas

- **Detecção de Queda**:
  - Escuta eventos nativos do navegador (`window.addEventListener('online')` e `'offline'`).
  - Monitora o status do canal do Supabase (`CHANNEL_ERROR`, `CLOSED`, `TIMED_OUT`).
- **Backoff Progressivo**:
  - Tentativas de reconexão utilizam espaçamento exponencial (1s, 2s, 4s, 8s... até 30s) para evitar sobrecarga no servidor.
- **Sincronização Pós-Reconexão**:
  - Quando a conexão é restabelecida com sucesso, o motor executa automaticamente um `queryClient.invalidateQueries({ refetchType: 'active' })` em lote.
  - Isso garante que quaisquer eventos perdidos durante o período de instabilidade sejam imediatamente recuperados do banco de dados.
- **Badge Visual**:
  - O componente [`RealtimeStatusBadge`](file:///d:/dev/web/twtools/src/components/layout/RealtimeStatusBadge.tsx) no topo da barra exibe o status atual com indicador luminoso:
    - 🟢 **Ao Vivo**: WebSocket conectado e ativo.
    - 🔵 **Sincronizando**: Processando pacotes e atualizando queries.
    - 🟡 **Reconectando**: Recuperando conexão com backoff progressivo.
    - 🔴 **Offline**: Conexão perdida (aguardando rede).

---

## 8. Segurança e Respeito Rigoroso a Permissões (RLS)

O sistema de tempo real foi projetado para nunca vazar dados confidenciais:

1. **Invalidação Indireta**:
   - Os eventos de tempo real funcionam prioritariamente como **gatilhos de invalidação de cache**.
   - O payload dos dados confidenciais não é consumido diretamente sem autorização.
2. **PostgreSQL Row Level Security (RLS)**:
   - Quando o frontend reexecuta a query invalidada (`refetch`), a requisição HTTP/REST é enviada ao Supabase utilizando o Bearer Token (JWT) da sessão atual do usuário logado.
   - O PostgreSQL avalia todas as políticas de segurança (RLS), cargos, tags e permissões do usuário antes de entregar as linhas.
   - Um usuário sem permissão nunca recebe dados aos quais não tem acesso.
3. **Atualização Reativa de Permissões**:
   - Se um administrador alterar a tag, cargo ou status de um usuário (ex.: bloquear usuário ou remover permissão de armazém), o evento dispara `tw_auth_reload`.
   - O hook `useAuth` recarrega as permissões em memória instantaneamente, e o acesso do usuário àquela tela ou operação é imediatamente restringido sem necessidade de logout ou F5.
