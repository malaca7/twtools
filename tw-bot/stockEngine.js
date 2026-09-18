const { Events } = require('discord.js');
const { Pool } = require('pg');

let dbPool = null;

function initStockEngine(client) {
  console.log("📦 [STOCK-ENGINE] Iniciando motor de estoque via logs do Discord...");

  if (process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    console.warn("⚠️ [STOCK-ENGINE] DATABASE_URL não definido no bot. Engine de estoque não vai funcionar.");
    return;
  }

  client.on(Events.MessageCreate, async (message) => {
    try {
      // Evitar mensagens de bots normais, mas aceitar de webhooks ou bots específicos se for o caso
      // Pelo screenshot o remetente é "Cidade Alta APP", que provavelmente é um Webhook ou Bot.
      // Se for Webhook, message.webhookId estará preenchido. Se for bot, message.author.bot == true.
      if (!message.author.bot && !message.webhookId) return; // Somente bots/webhooks geram as logs

      // Vamos buscar as configurações ativas do banco
      const configRes = await dbPool.query(`SELECT channel_id FROM public.discord_stock_config WHERE is_active = true`);
      const configRows = configRes.rows;

      if (configRows.length === 0) return;
      const validChannels = configRows.map(c => c.channel_id).filter(id => id);
      
      // Se o canal atual não estiver na lista de canais configurados, ignora
      if (validChannels.length > 0 && !validChannels.includes(message.channelId)) {
        return;
      }

      if (message.embeds.length === 0) return;

      const embed = message.embeds[0];
      const title = embed.title || '';
      const authorNameField = embed.author?.name || '';
      const description = embed.description || '';

      // Tentar extrair as informações principais
      // "Andrew Delucca Ferreira - ID 274" -> author.name
      // "📦 Baú" -> no description ou fields
      
      let rawText = '';
      if (authorNameField) rawText += authorNameField + '\n';
      if (title) rawText += title + '\n';
      if (description) rawText += description + '\n';
      embed.fields.forEach(f => {
        rawText += f.name + '\n' + f.value + '\n';
      });

      // Se a log não tiver características de log de estoque, ignorar
      if (!rawText.includes('Saldo líquido') && !rawText.includes('Detalhes da movimentação')) return;

      console.log(`📦 [STOCK-ENGINE] Detectada log de estoque (Mensagem: ${message.id})`);

      // 1. Extrair Game ID e Nome
      let gamePlayerId = null;
      let authorName = authorNameField;
      const idMatch = authorNameField.match(/ID\s+(\d+)/i);
      if (idMatch) {
        gamePlayerId = idMatch[1];
      }

      // 2. Extrair itens e quantidades do Saldo Líquido
      // O formato no discord é (linha por linha): 
      // Micro Uzi -1
      // MP5 +1
      // Conjunto de Attachs da G36C Mk2 -1
      const parsedItems = [];
      
      // Quebrar a rawText por linhas
      const lines = rawText.split('\n');
      let parsingSaldoLiquido = false;
      let bauName = 'Baú'; // Valor padrão
      
      // Tentativa de achar o nome do baú caso esteja explícito (ex: "📦 Baú")
      for (const line of lines) {
        if (line.includes('📦')) {
          bauName = line.replace('📦', '').trim();
        }
      }

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (line === 'Detalhes da movimentação' || line === '📄 Detalhes da movimentação') {
          parsingSaldoLiquido = false;
        }

        if (parsingSaldoLiquido && line.length > 0) {
          // Extrair Padrão: "Nome do Item [+-]Quantidade"
          // Ex: "Micro Uzi -1" ou "Munição Submetralhadora -119"
          const itemMatch = line.match(/^(.+?)\s+([+-]\d+)$/);
          if (itemMatch) {
            const itemName = itemMatch[1].trim();
            const qtyChange = parseInt(itemMatch[2].trim(), 10);
            
            if (!isNaN(qtyChange)) {
              parsedItems.push({
                bau_name: bauName,
                item_name: itemName,
                quantity_change: qtyChange
              });
            }
          }
        }

        if (line === 'Saldo líquido' || line === '📊 Saldo líquido') {
          parsingSaldoLiquido = true;
        }
      }

      if (parsedItems.length === 0) {
        console.log("⚠️ [STOCK-ENGINE] Nenhum item detectado na log, ignorando.");
        return;
      }

      // 3. Enviar para a RPC process_discord_stock_log
      const rpcQuery = `
        SELECT public.process_discord_stock_log(
          $1::TEXT, $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT, $7::JSONB, $8::JSONB
        ) as result
      `;
      const values = [
        message.id,
        message.guildId,
        message.channelId,
        authorName,
        gamePlayerId,
        rawText,
        JSON.stringify(embed.toJSON()),
        JSON.stringify(parsedItems)
      ];

      const res = await dbPool.query(rpcQuery, values);
      const resultObj = res.rows[0].result;

      if (resultObj.success) {
        console.log(`✅ [STOCK-ENGINE] Log processada com sucesso! Log ID: ${resultObj.log_id}`);
      } else {
        console.warn(`⚠️ [STOCK-ENGINE] Falha ao processar log: ${resultObj.error}`);
      }

    } catch (err) {
      console.error("❌ [STOCK-ENGINE] Erro crítico no listener de mensagens:", err);
    }
  });
}

module.exports = { initStockEngine };
