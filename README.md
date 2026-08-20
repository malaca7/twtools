# Twin Wheels — Gestão de Facção GTA RP

Plataforma interna Twin Wheels para controle de estoque, movimentações, vendas, metas e acompanhamento de desempenho dos membros no GTA RP.

## Recursos

- **Estoque & Movimentações**: Controle completo de suprimentos, depósitos e transferências.
- **Vendas & Finanças**: Registro de vendas, cálculo de comissões e histórico de transações.
- **Membros & Níveis**: Gestão de hierarquia, permissões e aprovação de cadastros.
- **Rankings & Metas**: Ranking de produtividade e acompanhamento de metas individuais e da facção.

## Tecnologias

- **Frontend / Meta-framework**: React, TanStack Start, TypeScript, Tailwind CSS
- **Backend / Database**: Supabase (Auth, Postgres, Realtime, RLS)
- **UI Components**: Radix UI / Shadcn UI, Lucide Icons

## Desenvolvimento Local

1. Instale as dependências:
```sh
npm install
# ou
bun install
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico
```

3. Inicie o servidor em modo de desenvolvimento:
```sh
npm run dev
# ou
bun dev
```
