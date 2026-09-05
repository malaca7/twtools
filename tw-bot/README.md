# Twin Wheels Sync & Discord Logs Bot 🤖

Servidor backend do **Bot oficial da Twin Wheels** (Discord.js v14 + Supabase Realtime).

## Funcionalidades

1. **Sincronização de Fotos de Perfil em Tempo Real**:
   - Escuta eventos `userUpdate` e `guildMemberUpdate` para atualizar avatares do Supabase instantaneamente.
2. **Sistema Automatizado de Logs em Discord Embeds**:
   - Escuta a tabela `audit_logs` do Supabase em tempo real.
   - Constrói Discord Embeds ricos, com cores categorizadas, emojis, campos detalhados e timestamps dinâmicos.
   - Envia para os canais específicos configurados pelo painel Dev da plataforma (Estoque, Vendas, Fundo de Caixa, Membros, Metas, Avisos, Purga de Cache, Sistema).
   - Suporta fallback inteligente via Webhooks HTTP caso o canal não seja encontrado no cache.
3. **Painel de Configuração Dev Integrado**:
   - Todas as configurações de canais (IDs e Webhook URLs), ativação de eventos, paleta de cores e presença do bot são configuráveis diretamente na página **Dev → Configuração → Discord & Bot de Logs**.

## Pré-requisitos

- **Node.js** v18+ instalado.
- **Bot criado no Discord Developer Portal**.
- Chave **Service Role Key** do seu Supabase (`SUPABASE_SERVICE_ROLE_KEY`).

## Passo a Passo de Configuração

### 1. Criar o Bot no Discord Developer Portal
1. Acesse [Discord Developer Portal](https://discord.com/developers/applications).
2. Crie ou selecione sua aplicação.
3. Na aba **Bot**:
   - Ative em **Privileged Gateway Intents**:
     - ✅ **Server Members Intent**
     - ✅ **Presence Intent**
   - Clique em **Reset Token** para obter o seu `DISCORD_BOT_TOKEN`.
4. Na aba **OAuth2** > **URL Generator**:
   - Escopos: `bot`, `applications.commands`
   - Permissões do Bot: `Send Messages`, `Embed Links`, `Attach Files`, `View Channels`, `Read Message History`.
   - Copie a URL gerada e convide o bot para o seu servidor Discord.

### 2. Variáveis de Ambiente (.env)
Preencha o arquivo `.env` dentro da pasta `tw-bot`:
```env
DISCORD_BOT_TOKEN=seu_token_aqui
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 3. Rodando o Bot
```bash
npm install
npm start
```
Após iniciado, o bot exibirá:
`✅ Twin Wheels Bot conectado com sucesso`
`⚡ [REALTIME] Conectando listener de audit_logs e role_permissions no Supabase...`

### 4. Hospedagem (Discloud / Railway / Render / VPS)
O bot já possui suporte nativo para **Discloud** (configurado em `discloud.config`) com endpoint HTTP na porta 8080 para health checks contínuos.
