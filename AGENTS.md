# Twin Wheels — Recomendações e Guias de Desenvolvimento

Projeto Twin Wheels — Gestão de Facção GTA RP.

- **Regra de Conclusão, Deploy e Bot Discloud:** Sempre que concluir totalmente as tarefas e modificações solicitadas, realizar obrigatoriamente:
  1. O deploy da aplicação web para a branch `gh-pages` com mensagem/título de deploy descritivo e coerente com a última modificação realizada (ex.: `npm run deploy:spa`).
  2. Atualizar o pacote zip do bot (`powershell Compress-Archive ... tw-bot/tw-bot.zip`).
  3. Fazer o rebuild / commit do bot no Discloud (`discloud app commit twin tw-bot/tw-bot.zip`).
  4. Reiniciar o bot no Discloud (`discloud app restart twin`).

