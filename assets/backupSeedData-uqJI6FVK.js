var e=function(e){return`/`+e},t={},n=function(n,r,i){let a=Promise.resolve();if(r&&r.length>0){let n=document.getElementsByTagName(`link`),o=document.querySelector(`meta[property=csp-nonce]`),s=o?.nonce||o?.getAttribute(`nonce`);function c(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function l(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}a=c(r.map(r=>{if(r=e(r,i),r=l(r),r in t)return;t[r]=!0;let a=r.endsWith(`.css`);for(let e=n.length-1;e>=0;e--){let t=n[e];if(t.href===r&&(!a||t.rel===`stylesheet`))return}let o=document.createElement(`link`);if(o.rel=a?`stylesheet`:`modulepreload`,a||(o.as=`script`),o.crossOrigin=``,o.href=r,s&&o.setAttribute(`nonce`,s),document.head.appendChild(o),a)return new Promise((e,t)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>t(Error(`Unable to preload CSS for ${r}`)))})}))}function o(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return a.then(e=>{for(let t of e||[])t.status===`rejected`&&o(t.reason);return n().catch(o)})},r={_migration_meta:{migrated_at:`2026-10-13T19:27:32.833Z`,sources:[`Supabase efwqhqevfxlschyhbiao (Tabelas públicas e auth)`,`Neon DB (Chat completo: 190 mensagens, 18 conversas, 1798 logs de auditoria)`,`Catálogos oficiais da Facção (Insígnias, Loja, XP, Armazém, Escalas, Tags, Metas)`],stats:{action_scale_members:1,action_scales:2,announcement_reads:4,announcements:1,audit_logs:1798,auth_users:15,baus:2,cash_fund_movements:89,categories:9,chat_conversations:18,chat_message_reactions:3,chat_messages:190,chat_participants:38,custom_roles:7,discord_stock_config:1,discord_stock_logs:66,goals:2,insignias:8,member_follows:6,member_stream_accounts:1,member_tags:6,product_baus:53,product_recipes:5,products:37,profile_post_likes:2,profile_posts:1,profiles:12,raw_materials:6,role_permissions:26,shop_items:12,signup_requests:15,stock_movements:604,stream_integration_logs:5,stream_sessions:1,stream_system_config:1,system_coins_config:1,user_presence:14,user_roles:14,verification_badge_config:1,warehouse_stock:37,xp_rules_config:10},total_collections:42},action_scale_members:{"7f3ddad8-47ee-409d-ab6f-30d9f35a56bf_860f8be7-6e51-4a47-8c14-9ca912d3c20a":{justificativa:``,reacao:`👍`,respondido_em:`2026-10-25T19:11:27.213Z`,status_presenca:`confirmado`},"scale_op_pista_semanal_9bb128e3-6e65-43a3-8b60-00f4dd860e0d":{criado_em:`2026-10-13T19:27:19.281Z`,id:`scale_op_pista_semanal_9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,justificativa:`Comando geral da operação`,member_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,posto_funcao:`Comandante de Ação`,reacao:`👍`,scale_id:`scale_op_pista_semanal`,status_presenca:`confirmado`,tipo_vaga:`titular`}},action_scales:{"7f3ddad8-47ee-409d-ab6f-30d9f35a56bf":{atualizado_em:`2026-10-25T19:12:01.214Z`,criado_em:`2026-10-25T19:10:33.975Z`,data_hora:`2026-10-25T20:00:00.000Z`,data_hora_chamada:`2026-10-25T19:45:00.000Z`,gerente_id:`860f8be7-6e51-4a47-8c14-9ca912d3c20a`,gerente_nome:`Malaca`,id:`7f3ddad8-47ee-409d-ab6f-30d9f35a56bf`,local_posto:`Joalheria Nova`,motivo_cancelamento:`Jjj`,status:`cancelada`,tipo_acao:`assalto`,titulo:`Joialheria Nova`,vagas_limite:8,vagas_reservas:1},scale_escolta_blindada:{atualizado_em:`2026-10-25T19:09:11.742Z`,criado_em:`2026-10-13T19:27:19.281Z`,data_hora:`2026-10-15T19:27:19.281Z`,data_hora_chamada:`2026-10-15T18:27:19.281Z`,descricao:`Escolta tática de comboio com insumos e armamentos para reabastecimento dos depósitos externos.`,gerente_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,gerente_nome:`Malaca`,id:`scale_escolta_blindada`,local_posto:`Galpão Industrial - Doca 2`,metadata:{radio_frequencia:`100.8`,veiculos_blindados:!0},motivo_cancelamento:`Aaa`,status:`cancelada`,tipo_acao:`Logística Tática`,titulo:`Escolta Blindada de Carga Pesada`,vagas_limite:8,vagas_reservas:2},scale_op_pista_semanal:{atualizado_em:`2026-10-25T19:09:05.293Z`,criado_em:`2026-10-13T19:27:19.281Z`,data_hora:`2026-10-14T19:27:19.281Z`,data_hora_chamada:`2026-10-14T18:27:19.281Z`,descricao:`Patrulhamento preventivo e demonstração de presença militarizada nas principais rotas da facção.`,gerente_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,gerente_nome:`Malaca`,id:`scale_op_pista_semanal`,local_posto:`QG Twin Wheels - Pátio Sul`,metadata:{obrigatorio_colete:!0,radio_frequencia:`100.5`},motivo_cancelamento:`Aaa`,status:`cancelada`,tipo_acao:`Patrulha e Ação`,titulo:`Operação de Pista & Domínio de Território`,vagas_limite:12,vagas_reservas:3}},announcement_reads:{"e7e823d0-c7ca-4acb-89e1-8b996ff55c21_5eb49e12-e1ea-4180-9206-29105b3f1ea6":{announcement_id:`e7e823d0-c7ca-4acb-89e1-8b996ff55c21`,read_at:`2026-09-16T16:15:13.765Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e7e823d0-c7ca-4acb-89e1-8b996ff55c21_6e2f5d10-d684-4caf-8c1e-636b9d1a84d6":{announcement_id:`e7e823d0-c7ca-4acb-89e1-8b996ff55c21`,read_at:`2026-09-15T20:53:03.022Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"e7e823d0-c7ca-4acb-89e1-8b996ff55c21_c5ef6dc6-e126-4027-80c3-319f0a870315":{announcement_id:`e7e823d0-c7ca-4acb-89e1-8b996ff55c21`,read_at:`2026-09-13T06:58:03.930Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"e7e823d0-c7ca-4acb-89e1-8b996ff55c21_ce2aa0d1-43a9-44ab-b5fa-8021589b28d2":{announcement_id:`e7e823d0-c7ca-4acb-89e1-8b996ff55c21`,read_at:`2026-09-16T15:22:27.506Z`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`}},announcements:{"e7e823d0-c7ca-4acb-89e1-8b996ff55c21":{author_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,content:`Teste aviso`,created_at:`2026-09-13T04:30:48.117Z`,id:`e7e823d0-c7ca-4acb-89e1-8b996ff55c21`,priority:`urgente`,title:`Teste aviso`,updated_at:`2026-09-13T04:30:48.117Z`}},audit_logs:{"f2a147ed-b665-4a49-8890-2b46f4d39ee8":{action:`session_start`,created_at:`2026-09-09T16:48:51.521Z`,entity:`user_presence`,id:`f2a147ed-b665-4a49-8890-2b46f4d39ee8`,new_data:{_meta:{logged_at:`2026-09-09T16:48:51.385Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,user_name:`Toretto`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f2ac492d-48b1-4c03-9d0e-b2c192d4b069":{action:`session_end`,created_at:`2026-09-11T14:42:25.973Z`,entity:`user_presence`,id:`f2ac492d-48b1-4c03-9d0e-b2c192d4b069`,new_data:{_meta:{logged_at:`2026-09-11T14:42:24.503Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},duration_formatted:`1min`,reason:`fechamento_aba`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f2ad8970-02ce-4a76-b90b-4736cfa884e3":{action:`create_movement`,created_at:`2026-09-08T17:42:52.695Z`,entity:`stock_movements`,entity_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,id:`f2ad8970-02ce-4a76-b90b-4736cfa884e3`,new_data:{_meta:{logged_at:`2026-09-08T17:42:50.345Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:0,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,product_name:`Chip Ilegal`,quantity:2,reason:`Movimentação Operacional de Estoque`,resulting_balance:2,type:`entrada`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f2e55bb0-bdc7-4f84-b7b5-c7be7c1ae272":{action:`create_movement`,created_at:`2026-08-21T23:46:06.755Z`,entity:`stock_movements`,entity_id:`425db6cd-2b78-4b4c-b867-f46f92a1653d`,id:`f2e55bb0-bdc7-4f84-b7b5-c7be7c1ae272`,new_data:{product_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,quantity:1,type:`saida`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f2f5bfe2-6843-463a-835c-c535f9e7a55b":{action:`session_end`,created_at:`2026-09-13T04:06:17.693Z`,entity:`user_presence`,id:`f2f5bfe2-6843-463a-835c-c535f9e7a55b`,new_data:{_meta:{logged_at:`2026-09-13T04:06:02.249Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},duration_formatted:`1h 5min`,reason:`fechamento_aba`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f33916e8-2c17-4262-a3a9-f9c0020c9cea":{action:`session_start`,created_at:`2026-09-13T02:30:53.394Z`,entity:`user_presence`,id:`f33916e8-2c17-4262-a3a9-f9c0020c9cea`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T02:30:37.641Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-13T02:30:37.620Z`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f36e5032-3c18-49c2-a6d3-41586dd97450":{action:`send_notification`,created_at:`2026-09-13T02:47:58.044Z`,entity:`notifications`,entity_id:`notif_1789267671125_a6tyl`,id:`f36e5032-3c18-49c2-a6d3-41586dd97450`,new_data:{category:`info`,created_at:`2026-09-13T02:47:51.125Z`,recipient:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,title:`Mensagem de Medusa`,type:`chat`},user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f37c4b8f-6a43-4bcb-be44-8c18f90256ba":{action:`create_movement`,created_at:`2026-09-12T13:42:34.701Z`,entity:`stock_movements`,entity_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,id:`f37c4b8f-6a43-4bcb-be44-8c18f90256ba`,new_data:{_meta:{logged_at:`2026-09-12T13:42:33.887Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,bau_name:`BAÚ QG`,previous_balance:44,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,product_name:`LockPick`,quantity:10,reason:`Movimentação Operacional de Estoque`,resulting_balance:34,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f39dcd2e-b6e2-4dae-b57a-7d17820d77f9":{action:`create_movement`,created_at:`2026-08-22T00:39:20.863Z`,entity:`stock_movements`,entity_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,id:`f39dcd2e-b6e2-4dae-b57a-7d17820d77f9`,new_data:{_meta:{logged_at:`2026-08-22T00:39:20.832Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0 (Edition std-2)`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Baú Caixote`,previous_balance:0,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,product_name:`Cocaina`,quantity:599,reason:`Movimentação Operacional de Estoque`,resulting_balance:599,type:`entrada`},user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f3a6303a-c041-4112-838c-a4e6417035c5":{action:`session_start`,created_at:`2026-09-13T03:40:54.970Z`,entity:`user_presence`,id:`f3a6303a-c041-4112-838c-a4e6417035c5`,new_data:{_meta:{logged_at:`2026-09-13T03:40:39.393Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-13T03:40:39.390Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f3c646c0-c1fd-4d64-a15b-ec5f884e10c6":{action:`session_start`,created_at:`2026-08-21T23:17:04.956Z`,entity:`user_presence`,id:`f3c646c0-c1fd-4d64-a15b-ec5f884e10c6`,new_data:{online_since:`2026-08-21T23:17:04.950Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f3db2c3f-de64-4c1c-a726-aee9a0e5f3d5":{action:`batch_movement`,created_at:`2026-09-13T15:43:55.312Z`,entity:`stock_movements`,id:`f3db2c3f-de64-4c1c-a726-aee9a0e5f3d5`,new_data:{_meta:{logged_at:`2026-09-13T15:43:52.895Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},entradas:0,products:[`78bbf10a-c4ee-4410-b736-2505c8fbedea`],saidas:1,total_items:1},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f3f688d6-f6f4-4704-84e6-974756e5617a":{action:`create_movement`,created_at:`2026-09-09T23:20:54.133Z`,entity:`stock_movements`,entity_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,id:`f3f688d6-f6f4-4704-84e6-974756e5617a`,new_data:{_meta:{logged_at:`2026-09-09T23:20:42.077Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:4,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,product_name:`MP5`,quantity:5,reason:`Movimentação Operacional de Estoque`,resulting_balance:9,type:`entrada`},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f3f99b79-c445-4936-9d90-714a5a035108":{action:`session_start`,created_at:`2026-09-12T00:37:50.055Z`,entity:`user_presence`,id:`f3f99b79-c445-4936-9d90-714a5a035108`,new_data:{_meta:{logged_at:`2026-09-12T00:37:45.478Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition std-2)`},online_since:`2026-09-12T00:37:45.467Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f40cf6fd-b2a1-4268-9735-8181892fdb36":{action:`create_movement`,created_at:`2026-09-12T13:59:13.801Z`,entity:`stock_movements`,entity_id:`afce5758-097f-41ee-b351-6160f6ebec61`,id:`f40cf6fd-b2a1-4268-9735-8181892fdb36`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:10,global_balance:10,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:5,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f430b9fb-0da2-4fac-9fb0-ef87a4e7f25b":{action:`create_cash_movement`,created_at:`2026-08-21T14:58:14.333Z`,entity:`cash_fund_movements`,entity_id:`ed2730b9-f074-4ec5-b8a0-474ed23ccd7c`,id:`f430b9fb-0da2-4fac-9fb0-ef87a4e7f25b`,new_data:{amount:72e3,id:`ed2730b9-f074-4ec5-b8a0-474ed23ccd7c`,motive:`lock e c4`,previous_balance:209957,resulting_balance:137957,type:`saida`,user_name:`TT`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f4375eba-cb8c-4090-a46c-0dab51e13852":{action:`batch_movement`,created_at:`2026-09-09T15:48:24.772Z`,entity:`stock_movements`,id:`f4375eba-cb8c-4090-a46c-0dab51e13852`,new_data:{_meta:{logged_at:`2026-09-09T15:48:25.583Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition ms_store)`},entradas:0,products:[`78bbf10a-c4ee-4410-b736-2505c8fbedea`,`82f15c69-b575-43cb-9abe-0fbd2a223fc3`],saidas:2,total_items:2},user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"f4515694-6525-4ef7-875b-06812e00e739":{action:`create_movement`,created_at:`2026-09-08T22:44:01.434Z`,entity:`stock_movements`,entity_id:`caf786d9-e95c-49e6-9d93-b3037c095b70`,id:`f4515694-6525-4ef7-875b-06812e00e739`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:214,global_balance:301,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:20,type:`saida`},user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"f4998b84-9201-43fd-b89d-d841d7160216":{action:`create_movement`,created_at:`2026-09-08T17:55:48.046Z`,entity:`stock_movements`,entity_id:`1fe46fc0-1346-4544-9536-4d1ab8e7889f`,id:`f4998b84-9201-43fd-b89d-d841d7160216`,new_data:{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,chest_balance:0,global_balance:0,product_id:`4e683441-0730-489a-ba27-bd2903709bf5`,quantity:165682,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f49f930d-d261-4732-8d2d-3e6c6e8c6fa3":{action:`create_movement`,created_at:`2026-09-08T20:37:29.470Z`,entity:`stock_movements`,entity_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,id:`f49f930d-d261-4732-8d2d-3e6c6e8c6fa3`,new_data:{_meta:{logged_at:`2026-09-08T20:37:27.071Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:532,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,product_name:`Cocaina`,quantity:50,reason:`Movimentação Operacional de Estoque`,resulting_balance:482,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f509b4e7-7f3b-4c0b-b290-1cf6fc5ccc59":{action:`session_start`,created_at:`2026-09-10T17:45:21.233Z`,entity:`user_presence`,id:`f509b4e7-7f3b-4c0b-b290-1cf6fc5ccc59`,new_data:{_meta:{logged_at:`2026-09-10T17:45:05.769Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-10T17:45:05.765Z`,reason:`retorno_ausencia`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f5133adc-28de-49cc-8563-4ffd19ab19fa":{action:`create_movement`,created_at:`2026-09-08T21:14:44.120Z`,entity:`stock_movements`,entity_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,id:`f5133adc-28de-49cc-8563-4ffd19ab19fa`,new_data:{_meta:{logged_at:`2026-09-08T21:21:26.950Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:20,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,product_name:`FN Five Seven`,quantity:2,reason:`Movimentação Operacional de Estoque`,resulting_balance:18,type:`saida`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f52eac2b-b9e8-43cf-b546-e8e1bd1f28e2":{action:`create_movement`,created_at:`2026-08-22T02:45:30.725Z`,entity:`stock_movements`,entity_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,id:`f52eac2b-b9e8-43cf-b546-e8e1bd1f28e2`,new_data:{_meta:{logged_at:`2026-08-22T02:45:30.602Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Baú Caixote`,previous_balance:600,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,product_name:`Cocaina`,quantity:600,reason:`Comprado com mudinho`,resulting_balance:1200,type:`entrada`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f52f652e-3de0-4420-a754-7c54087c2377":{action:`create_movement`,created_at:`2026-09-09T15:48:23.719Z`,entity:`stock_movements`,entity_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,id:`f52f652e-3de0-4420-a754-7c54087c2377`,new_data:{_meta:{logged_at:`2026-09-09T15:48:24.561Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition ms_store)`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:271,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,product_name:`LockPick`,quantity:14,reason:`Movimentação Operacional de Estoque`,resulting_balance:257,type:`saida`},user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"f56eabfa-b368-4475-a882-a3f59b89a3ed":{action:`send_notification`,entity:`notifications`,entity_id:`notif_1793418181865_8y662`,id:`f56eabfa-b368-4475-a882-a3f59b89a3ed`,new_data:{category:`info`,created_at:`2026-10-31T03:43:01.865Z`,recipient:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,title:`Resposta no Chamado #003`,type:`ticket`}},"f56ec017-65da-4225-b12f-eee5182001c4":{action:`create_cash_movement`,created_at:`2026-09-08T20:13:46.326Z`,entity:`cash_fund_movements`,entity_id:`83b7b8f4-5807-45e8-b2f4-8eadc3b3ed41`,id:`f56ec017-65da-4225-b12f-eee5182001c4`,new_data:{amount:2,id:`83b7b8f4-5807-45e8-b2f4-8eadc3b3ed41`,motive:`acerto`,previous_balance:352531,resulting_balance:352533,type:`entrada`,user_name:`Toretto`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f599991e-640c-43f8-a90f-1e3ec192f711":{action:`session_end`,created_at:`2026-09-12T22:01:31.427Z`,entity:`user_presence`,id:`f599991e-640c-43f8-a90f-1e3ec192f711`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-12T22:01:19.206Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},duration_formatted:`2h 43min`,reason:`fechamento_aba`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f5a38c69-c85f-4e39-9df3-42e4110eba17":{action:`create_movement`,created_at:`2026-09-08T19:08:45.860Z`,entity:`stock_movements`,entity_id:`d10457cf-d620-4302-823e-79e12dcbc45c`,id:`f5a38c69-c85f-4e39-9df3-42e4110eba17`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:2,global_balance:5,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:2,type:`saida`},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f5e112eb-6ff3-4356-9d0b-cdacf5143c73":{action:`session_end`,created_at:`2026-08-22T11:16:17.866Z`,entity:`user_presence`,id:`f5e112eb-6ff3-4356-9d0b-cdacf5143c73`,new_data:{_meta:{logged_at:`2026-08-22T11:14:40.367Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},duration_formatted:`2min`,reason:`fechamento_aba`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f63c1485-9bc0-4e03-a883-76849e0ee416":{action:`session_start`,created_at:`2026-09-13T01:09:32.743Z`,entity:`user_presence`,id:`f63c1485-9bc0-4e03-a883-76849e0ee416`,new_data:{_meta:{logged_at:`2026-09-13T01:09:20.693Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-13T01:09:20.688Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f6631d71-d255-4cec-9600-64ecaa6b54f9":{action:`create_movement`,created_at:`2026-08-21T23:46:16.742Z`,entity:`stock_movements`,entity_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,id:`f6631d71-d255-4cec-9600-64ecaa6b54f9`,new_data:{_meta:{logged_at:`2026-08-21T23:44:39.062Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Baú Caixote`,previous_balance:467,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,product_name:`Munição de pistola`,quantity:1,reason:`Transferência para Baú Ármario de parede Grande (Transferência em Lote entre Baús)`,resulting_balance:466,type:`saida`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f69a47f9-73b9-46b1-b3b4-982f0b182dd5":{action:`create_category`,created_at:`2026-08-19T21:25:41.266Z`,entity:`public.categories`,entity_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,id:`f69a47f9-73b9-46b1-b3b4-982f0b182dd5`,new_data:{ativo:!0,nome:`Consumíveis`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f6c7308a-47e7-4508-8e13-ab5bb5de0568":{action:`session_end`,created_at:`2026-09-09T23:39:49.833Z`,entity:`user_presence`,id:`f6c7308a-47e7-4508-8e13-ab5bb5de0568`,new_data:{_meta:{logged_at:`2026-09-09T23:39:49.650Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},duration_formatted:`59min`,reason:`fechamento_aba`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f6ce2e58-39a9-48c5-92ca-f5732ae9b3ba":{action:`session_start`,created_at:`2026-09-11T20:25:17.492Z`,entity:`user_presence`,id:`f6ce2e58-39a9-48c5-92ca-f5732ae9b3ba`,new_data:{_meta:{logged_at:`2026-09-11T20:25:14.125Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-11T20:25:14.122Z`,reason:`retorno_ausencia`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f7468dad-cc5d-4274-b2d3-8c3887e443bb":{action:`create_movement`,created_at:`2026-09-11T14:41:16.751Z`,entity:`stock_movements`,entity_id:`ea1ba54b-9af9-4cb9-90a1-8397c21791f5`,id:`f7468dad-cc5d-4274-b2d3-8c3887e443bb`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:38,global_balance:74,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:24,type:`saida`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f751d1a7-4be2-40bc-bc69-15a657a64d2e":{action:`session_end`,created_at:`2026-08-22T12:03:30.685Z`,entity:`user_presence`,id:`f751d1a7-4be2-40bc-bc69-15a657a64d2e`,new_data:{_meta:{logged_at:`2026-08-22T12:01:53.195Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0`},duration_formatted:`33h 19min`,reason:`logout_usuario`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,user_name:`Membro`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f7680046-d41b-45b8-996d-0c0ea65d6da6":{action:`create_movement`,created_at:`2026-09-09T22:19:58.410Z`,entity:`stock_movements`,entity_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,id:`f7680046-d41b-45b8-996d-0c0ea65d6da6`,new_data:{_meta:{logged_at:`2026-09-09T22:19:54.339Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,bau_name:`BAÚ QG`,previous_balance:230,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,product_name:`LockPick`,quantity:3,reason:`foi retirado e não contabilizado`,resulting_balance:227,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f79a2e5c-851d-4c7b-a5ea-aef937a1780e":{action:`session_absence`,created_at:`2026-09-11T00:28:36.358Z`,entity:`user_presence`,id:`f79a2e5c-851d-4c7b-a5ea-aef937a1780e`,new_data:{_meta:{logged_at:`2026-09-11T00:28:21.210Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},reason:`inatividade_timeout`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f7a3d987-543b-43c4-b797-1af521274933":{action:`session_end`,created_at:`2026-08-26T14:19:05.957Z`,entity:`user_presence`,id:`f7a3d987-543b-43c4-b797-1af521274933`,new_data:{_meta:{logged_at:`2026-08-26T14:19:05.825Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},duration_formatted:`1min`,reason:`fechamento_aba`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f7ae0188-cf68-472d-a882-1c5070707a0e":{action:`session_end`,created_at:`2026-09-13T03:00:36.387Z`,entity:`user_presence`,id:`f7ae0188-cf68-472d-a882-1c5070707a0e`,new_data:{_meta:{logged_at:`2026-09-13T03:00:29.818Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition std-2)`},duration_formatted:`1min`,reason:`fechamento_aba`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f7c60120-d2ce-4289-a51c-a63cc11d427c":{action:`session_start`,created_at:`2026-09-11T10:42:33.745Z`,entity:`user_presence`,id:`f7c60120-d2ce-4289-a51c-a63cc11d427c`,new_data:{_meta:{logged_at:`2026-09-11T10:42:30.487Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-11T10:42:30.481Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f7f52e32-26eb-414d-a7f9-164981a6ea25":{action:`session_start`,created_at:`2026-08-22T11:35:16.723Z`,entity:`user_presence`,id:`f7f52e32-26eb-414d-a7f9-164981a6ea25`,new_data:{_meta:{logged_at:`2026-08-22T11:33:39.187Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},online_since:`2026-08-22T11:33:39.142Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f82aefef-1a2d-433f-8fc4-0d921b64af68":{action:`create_movement`,created_at:`2026-08-20T20:54:19.028Z`,entity:`stock_movements`,entity_id:`c5eb4d9a-12ec-4693-99f3-1c18552bfd1a`,id:`f82aefef-1a2d-433f-8fc4-0d921b64af68`,new_data:{product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantity:2,type:`entrada`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f834cfa0-73f9-4bfc-9157-85c32eadd61e":{action:`batch_movement`,created_at:`2026-09-11T14:41:22.246Z`,entity:`stock_movements`,id:`f834cfa0-73f9-4bfc-9157-85c32eadd61e`,new_data:{_meta:{logged_at:`2026-09-11T14:41:20.779Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},entradas:0,products:[`82f15c69-b575-43cb-9abe-0fbd2a223fc3`],saidas:1,total_items:1},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f8494e5c-781d-4b31-a976-6008b4d6927e":{action:`session_start`,created_at:`2026-09-09T22:40:08.922Z`,entity:`user_presence`,id:`f8494e5c-781d-4b31-a976-6008b4d6927e`,new_data:{_meta:{logged_at:`2026-09-09T22:40:08.345Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-09T22:40:08.341Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f84cfb7c-28ef-4d04-8349-c744b5f37936":{action:`create_movement`,created_at:`2026-08-21T23:46:57.600Z`,entity:`stock_movements`,entity_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,id:`f84cfb7c-28ef-4d04-8349-c744b5f37936`,new_data:{_meta:{logged_at:`2026-08-21T23:45:19.927Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Baú Caixote`,previous_balance:6,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,product_name:`FN Five Seven`,quantity:1,reason:`Transferência para Baú Ármario de parede Grande (Transferência em Lote entre Baús)`,resulting_balance:5,type:`saida`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f86a5b2e-e059-45b8-81e4-a6c962df4df9":{action:`session_start`,created_at:`2026-09-12T23:24:29.639Z`,entity:`user_presence`,id:`f86a5b2e-e059-45b8-81e4-a6c962df4df9`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-12T23:24:17.399Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-12T23:24:17.375Z`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f89ae5e4-c3b2-41b6-8ff5-5d2dbcde32e0":{action:`create_movement`,created_at:`2026-08-29T18:52:54.058Z`,entity:`stock_movements`,entity_id:`22a6bbf9-a852-4eec-92e1-537f3f0d063b`,id:`f89ae5e4-c3b2-41b6-8ff5-5d2dbcde32e0`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:1,type:`saida`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f8c40344-86ff-407f-ad21-ff132ec8d315":{action:`session_start`,created_at:`2026-09-13T01:46:15.236Z`,entity:`user_presence`,id:`f8c40344-86ff-407f-ad21-ff132ec8d315`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T01:46:03.306Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-13T01:46:03.298Z`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f8cef5f5-754d-4c81-aeeb-5fce39597e93":{action:`session_start`,created_at:`2026-08-27T21:41:18.813Z`,entity:`user_presence`,id:`f8cef5f5-754d-4c81-aeeb-5fce39597e93`,new_data:{_meta:{logged_at:`2026-08-27T21:39:09.344Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,user_name:`Malaca`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f8d30ac7-2c9e-46b6-a830-bbe435aefcac":{action:`session_start`,created_at:`2026-08-22T01:00:49.795Z`,entity:`user_presence`,id:`f8d30ac7-2c9e-46b6-a830-bbe435aefcac`,new_data:{_meta:{logged_at:`2026-08-22T00:59:11.673Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},online_since:`2026-08-22T00:59:11.656Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f919c751-d794-4de8-8806-5e3cc5998098":{action:`session_end`,created_at:`2026-09-13T01:39:50.860Z`,entity:`user_presence`,id:`f919c751-d794-4de8-8806-5e3cc5998098`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T01:39:38.916Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},duration_formatted:`6h 21min`,reason:`fechamento_aba`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f95a1c04-1b51-4d05-b053-e0fb0a3bd5fb":{action:`save_dev_configuration`,created_at:`2026-09-12T00:55:24.377Z`,entity:`dev_configuration`,id:`f95a1c04-1b51-4d05-b053-e0fb0a3bd5fb`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-12T00:55:10.494Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},devAuditLogs:!0,devSystemNotifications:!0,developerBypassMode:!0},old_data:{devAuditLogs:!0,devSystemNotifications:!0,developerBypassMode:!1},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f9692b14-513a-4766-8d2d-348e71f31904":{action:`login`,created_at:`2026-08-24T17:49:07.205Z`,entity:`auth`,id:`f9692b14-513a-4766-8d2d-348e71f31904`,new_data:{_meta:{logged_at:`2026-08-24T17:49:06.974Z`,severity:`info`,user_agent:`Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,user_name:`Malaca`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f9a17d41-a684-43af-a704-87758d4fc421":{action:`session_start`,created_at:`2026-09-13T01:19:27.798Z`,entity:`user_presence`,id:`f9a17d41-a684-43af-a704-87758d4fc421`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T01:19:15.838Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-13T01:19:15.829Z`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"f9dd2941-8a8c-4e50-866e-a7e800d105a5":{action:`create_movement`,created_at:`2026-08-21T23:46:07.509Z`,entity:`stock_movements`,entity_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,id:`f9dd2941-8a8c-4e50-866e-a7e800d105a5`,new_data:{_meta:{logged_at:`2026-08-21T23:44:29.834Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Baú Caixote`,previous_balance:1,product_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,product_name:`Tec-9`,quantity:1,reason:`Transferência para Baú Ármario de parede Grande (Transferência em Lote entre Baús)`,resulting_balance:0,type:`saida`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fa085425-799f-448f-b273-47c4c1e01dfe":{action:`session_start`,created_at:`2026-09-13T00:14:37.678Z`,entity:`user_presence`,id:`fa085425-799f-448f-b273-47c4c1e01dfe`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T00:14:25.457Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-13T00:14:25.454Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fa2072ea-7b27-4ede-8ebc-4377688ae5e8":{action:`session_start`,created_at:`2026-08-22T11:21:50.819Z`,entity:`user_presence`,id:`fa2072ea-7b27-4ede-8ebc-4377688ae5e8`,new_data:{_meta:{logged_at:`2026-08-22T11:20:13.319Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},online_since:`2026-08-22T11:20:13.296Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fa361fb1-a20d-4c20-9222-fee23e07de6b":{action:`approve_signup`,created_at:`2026-08-21T01:22:08.271Z`,entity:`signup_requests`,entity_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,id:`fa361fb1-a20d-4c20-9222-fee23e07de6b`,new_data:{nivel:`novato`,status:`aprovado`},old_data:{status:`pendente`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fa858ad2-422f-4cfa-af79-9e9cf0f01778":{action:`batch_movement`,created_at:`2026-09-12T02:51:39.450Z`,entity:`stock_movements`,id:`fa858ad2-422f-4cfa-af79-9e9cf0f01778`,new_data:{_meta:{logged_at:`2026-09-12T02:51:39.295Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},entradas:0,products:[`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,`78bbf10a-c4ee-4410-b736-2505c8fbedea`],saidas:2,total_items:2},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"faf0307b-6f64-4d53-8d29-4a87f8775429":{action:`session_absence`,created_at:`2026-08-22T11:08:20.157Z`,entity:`user_presence`,id:`faf0307b-6f64-4d53-8d29-4a87f8775429`,new_data:{_meta:{logged_at:`2026-08-22T11:08:19.573Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},reason:`inatividade_2min`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"faf2c74e-2d1e-443a-80ea-eb1cb5ff15bb":{action:`session_absence`,created_at:`2026-08-22T04:39:51.326Z`,entity:`user_presence`,id:`faf2c74e-2d1e-443a-80ea-eb1cb5ff15bb`,new_data:{_meta:{logged_at:`2026-08-22T04:39:49.676Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},reason:`inatividade_20min`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fb3766ec-16f7-4b76-ad78-ae770372b1c7":{action:`create_movement`,created_at:`2026-08-21T23:58:25.033Z`,entity:`stock_movements`,entity_id:`034cda0d-a345-4d9b-aa32-10b64b736c92`,id:`fb3766ec-16f7-4b76-ad78-ae770372b1c7`,new_data:{product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:1,type:`saida`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fb4d157d-da96-449d-970d-458cec284d08":{action:`create_movement`,created_at:`2026-09-11T10:43:05.887Z`,entity:`stock_movements`,entity_id:`acb00745-dacd-47e2-95c0-2227e06a94e0`,id:`fb4d157d-da96-449d-970d-458cec284d08`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:62,global_balance:124,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:11,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fb56e766-0f66-43da-b79b-38ea3e146c21":{action:`session_start`,created_at:`2026-09-10T20:24:10.675Z`,entity:`user_presence`,id:`fb56e766-0f66-43da-b79b-38ea3e146c21`,new_data:{_meta:{logged_at:`2026-09-10T20:31:01.575Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-10T20:31:01.564Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fbecf655-dbb6-4e86-9347-d9fd92764a69":{action:`session_start`,created_at:`2026-09-11T22:23:41.617Z`,entity:`user_presence`,id:`fbecf655-dbb6-4e86-9347-d9fd92764a69`,new_data:{_meta:{logged_at:`2026-09-11T22:30:36.759Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-11T22:30:36.740Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fbf6aecc-402a-434d-b407-037adcce0139":{action:`create_movement`,created_at:`2026-09-13T05:25:55.008Z`,entity:`stock_movements`,entity_id:`8a477527-1329-47cd-b1db-1260d368a24e`,id:`fbf6aecc-402a-434d-b407-037adcce0139`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:44,global_balance:44,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:1,type:`saida`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fc005d7f-c614-4a14-bc5e-a1b0522d95b6":{action:`session_start`,created_at:`2026-09-08T20:11:31.560Z`,entity:`user_presence`,id:`fc005d7f-c614-4a14-bc5e-a1b0522d95b6`,new_data:{_meta:{logged_at:`2026-09-08T20:11:30.224Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-08T20:11:30.221Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fc1bb4ec-5987-4df2-b361-6595ca1bf1c6":{action:`session_start`,created_at:`2026-09-13T02:18:02.266Z`,entity:`user_presence`,id:`fc1bb4ec-5987-4df2-b361-6595ca1bf1c6`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T02:17:50.370Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-13T02:17:50.359Z`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"fc274ed7-96e5-498e-a09f-1f8644e8228f":{action:`create_movement`,created_at:`2026-09-08T19:08:44.661Z`,entity:`stock_movements`,entity_id:`8d835f4a-bfa9-4071-8743-0e9d7550b7cc`,id:`fc274ed7-96e5-498e-a09f-1f8644e8228f`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:0,global_balance:0,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantity:1,type:`saida`},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fc2d408e-afac-4c5a-bbb2-fad1b422e5ab":{action:`session_end`,created_at:`2026-09-13T03:22:54.062Z`,entity:`user_presence`,id:`fc2d408e-afac-4c5a-bbb2-fad1b422e5ab`,new_data:{_meta:{logged_at:`2026-09-13T03:22:38.557Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},duration_formatted:`22min`,reason:`fechamento_aba`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fc42bd82-afbc-4798-96a9-2801994dbe8f":{action:`batch_movement`,created_at:`2026-09-08T17:57:28.727Z`,entity:`stock_movements`,id:`fc42bd82-afbc-4798-96a9-2801994dbe8f`,new_data:{_meta:{logged_at:`2026-09-08T17:57:26.377Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},entradas:0,products:[`78bbf10a-c4ee-4410-b736-2505c8fbedea`],saidas:1,total_items:1},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fc6744b4-2e93-40b7-a9cf-08f36ffb78e4":{action:`create_movement`,created_at:`2026-08-22T02:54:23.649Z`,entity:`stock_movements`,entity_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,id:`fc6744b4-2e93-40b7-a9cf-08f36ffb78e4`,new_data:{_meta:{logged_at:`2026-08-22T02:54:23.906Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0 (Edition std-2)`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Baú Caixote`,previous_balance:550,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,product_name:`Maconha`,quantity:50,reason:`fazer dinheiro pra familia`,resulting_balance:500,type:`saida`},user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"fc8f3181-f6ef-4a5c-bd5e-3655cb912c1e":{action:`create_movement`,created_at:`2026-09-09T16:49:13.413Z`,entity:`stock_movements`,entity_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,id:`fc8f3181-f6ef-4a5c-bd5e-3655cb912c1e`,new_data:{_meta:{logged_at:`2026-09-09T16:49:13.277Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,bau_name:`BAÚ QG`,previous_balance:4,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,product_name:`Uzi`,quantity:1,reason:`Movimentação Operacional de Estoque`,resulting_balance:3,type:`saida`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fc9809f3-19e2-4ee8-9335-76853bf0ce3b":{action:`session_absence`,created_at:`2026-09-12T15:00:14.603Z`,entity:`user_presence`,id:`fc9809f3-19e2-4ee8-9335-76853bf0ce3b`,new_data:{_meta:{logged_at:`2026-09-12T15:00:09.897Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},reason:`inatividade_timeout`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fc9fa7d6-4c38-435f-99f7-bb888265035c":{action:`create_cash_movement`,created_at:`2026-08-22T02:31:04.652Z`,entity:`cash_fund_movements`,id:`fc9fa7d6-4c38-435f-99f7-bb888265035c`,new_data:{_meta:{logged_at:`2026-08-22T02:31:03.253Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},amount:48e3,motive:`Compra de Meta`,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fcaabe38-8045-474f-b145-3b7aa193fd64":{action:`batch_movement`,created_at:`2026-09-10T17:45:37.462Z`,entity:`stock_movements`,id:`fcaabe38-8045-474f-b145-3b7aa193fd64`,new_data:{_meta:{logged_at:`2026-09-10T17:45:22.000Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},entradas:0,products:[`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,`9548eee0-3083-489b-b57f-7d5a2b5358eb`,`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`],saidas:4,total_items:4},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fcad1de5-2270-454f-b167-9f15e66440eb":{action:`page_view`,created_at:`2026-08-21T23:33:26.690Z`,entity:`navigation`,id:`fcad1de5-2270-454f-b167-9f15e66440eb`,new_data:{_meta:{logged_at:`2026-08-21T23:31:49.001Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},page:`/membros`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fd1b1c27-2edb-49f0-94ad-2de06911890e":{action:`create_movement`,created_at:`2026-09-10T17:45:37.194Z`,entity:`stock_movements`,entity_id:`7e6c1545-d2f2-4fa4-99a4-0a1f004b1948`,id:`fd1b1c27-2edb-49f0-94ad-2de06911890e`,new_data:{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,chest_balance:46,global_balance:46,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:1,type:`saida`},user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fd3243f4-e37e-4852-898e-1bd51195a938":{action:`session_start`,created_at:`2026-09-12T00:45:27.955Z`,entity:`user_presence`,id:`fd3243f4-e37e-4852-898e-1bd51195a938`,new_data:{_meta:{logged_at:`2026-09-12T00:45:24.456Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-09-12T00:45:24.454Z`,reason:`retorno_ausencia`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fd4b4197-a51f-4a77-9714-02a9722c3f3c":{action:`session_start`,created_at:`2026-08-23T13:57:57.458Z`,entity:`user_presence`,id:`fd4b4197-a51f-4a77-9714-02a9722c3f3c`,new_data:{_meta:{logged_at:`2026-08-23T13:56:03.894Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},online_since:`2026-08-23T13:56:03.872Z`,reason:`retorno_ausencia`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fd55460a-9509-4dff-8796-1d556bd86e0d":{action:`session_end`,created_at:`2026-09-08T19:33:27.995Z`,entity:`user_presence`,id:`fd55460a-9509-4dff-8796-1d556bd86e0d`,new_data:{_meta:{logged_at:`2026-09-08T19:40:10.782Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},duration_formatted:`74h 21min`,reason:`fechamento_aba`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fd5e5449-6b99-4951-bbc6-0407f7eba53e":{action:`create_movement`,created_at:`2026-08-20T20:46:17.648Z`,entity:`stock_movements`,entity_id:`a96dcd1e-c039-4e36-89da-02cdc021f702`,id:`fd5e5449-6b99-4951-bbc6-0407f7eba53e`,new_data:{product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:39,type:`entrada`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fd67e973-0057-4ae8-b164-48839d7820bb":{action:`session_absence`,created_at:`2026-09-10T05:06:43.458Z`,entity:`user_presence`,id:`fd67e973-0057-4ae8-b164-48839d7820bb`,new_data:{_meta:{logged_at:`2026-09-10T05:13:29.875Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},reason:`inatividade_timeout`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fd6e9bd8-81d0-4a99-8f35-ba548e7a3d63":{action:`create_movement`,created_at:`2026-09-13T05:25:54.005Z`,entity:`stock_movements`,entity_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,id:`fd6e9bd8-81d0-4a99-8f35-ba548e7a3d63`,new_data:{_meta:{logged_at:`2026-09-13T05:32:52.974Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:9,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,product_name:`MP5`,quantity:2,reason:`Movimentação Operacional de Estoque`,resulting_balance:7,type:`saida`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fd76a9eb-a1e6-4667-ae43-858098c82e2a":{action:`login`,created_at:`2026-08-22T11:05:49.731Z`,entity:`auth`,id:`fd76a9eb-a1e6-4667-ae43-858098c82e2a`,new_data:{_meta:{logged_at:`2026-08-22T11:05:49.126Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,user_name:`Andrew Delucca Ferreira`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fe0b28f8-bfd0-4ca9-ac7e-8826efadc56d":{action:`session_end`,created_at:`2026-09-13T00:33:16.681Z`,entity:`user_presence`,id:`fe0b28f8-bfd0-4ca9-ac7e-8826efadc56d`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-13T00:33:04.658Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},duration_formatted:`18min`,reason:`fechamento_aba`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fe2b89e3-0c69-4626-b6a0-ebb775ba6f40":{action:`webhook_post_message`,created_at:`2026-09-12T19:56:00.023Z`,entity:`{"webhookId":"webhook_1789242723806","webhookName":"TW | Logs de Baú  QG","guildId":"1535505650308620400","channelId":"1535637509818548234","title":"🧪 Teste de Conexão: TW | Logs de Baú  QG","sender":"Malaca","actor":"Malaca"}`,id:`fe2b89e3-0c69-4626-b6a0-ebb775ba6f40`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-12T19:55:47.626Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`}},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"fe2ee4ab-4838-4cd9-ac66-00626dd87711":{action:`update_member_details`,created_at:`2026-09-12T19:18:56.970Z`,entity:`members`,entity_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,id:`fe2ee4ab-4838-4cd9-ac66-00626dd87711`,new_data:{_meta:{is_dev_action:!0,logged_at:`2026-09-12T19:18:44.215Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},game_id:`274`,is_developer:!0,nome:`Andrew Delucca Ferreira`,target_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,target_name:`Andrew Delucca Ferreira`,telefone:`762-762`},old_data:{game_id:`274`,nome:`Andrew Delucca Ferreira`,telefone:`762-762`},user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"fe327ad9-578a-4ed9-9ec3-1530df9d0e78":{action:`create_movement`,created_at:`2026-08-22T02:19:25.180Z`,entity:`stock_movements`,entity_id:`48ee1b42-d643-4b18-b2de-a2e2fd0a78fe`,id:`fe327ad9-578a-4ed9-9ec3-1530df9d0e78`,new_data:{product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:4,type:`saida`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fe49c8d6-4af3-48f6-9dee-364b1681d5ee":{action:`session_start`,created_at:`2026-08-29T18:50:19.653Z`,entity:`user_presence`,id:`fe49c8d6-4af3-48f6-9dee-364b1681d5ee`,new_data:{_meta:{logged_at:`2026-08-29T18:50:19.423Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},online_since:`2026-08-29T18:50:19.418Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"fe818ae7-0f34-4a7c-b309-e29cc493ca54":{action:`session_absence`,created_at:`2026-08-22T11:38:43.531Z`,entity:`user_presence`,id:`fe818ae7-0f34-4a7c-b309-e29cc493ca54`,new_data:{_meta:{logged_at:`2026-08-22T11:38:42.946Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},reason:`inatividade_2min`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fece614a-4aaf-4dc1-9e1a-f904c223961c":{action:`session_end`,created_at:`2026-09-09T19:01:23.227Z`,entity:`user_presence`,id:`fece614a-4aaf-4dc1-9e1a-f904c223961c`,new_data:{_meta:{logged_at:`2026-09-09T19:01:23.088Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},duration_formatted:`1min`,reason:`fechamento_aba`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fefec961-64bd-4189-b4ef-fb04ec5109a0":{action:`batch_movement`,created_at:`2026-09-11T01:51:38.952Z`,entity:`stock_movements`,id:`fefec961-64bd-4189-b4ef-fb04ec5109a0`,new_data:{_meta:{logged_at:`2026-09-11T01:51:40.472Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},entradas:0,products:[`78bbf10a-c4ee-4410-b736-2505c8fbedea`],saidas:1,total_items:1},user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"ff298813-efd0-4c99-aa1e-7e41bab26c13":{action:`create_movement`,created_at:`2026-09-09T19:01:22.252Z`,entity:`stock_movements`,entity_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,id:`ff298813-efd0-4c99-aa1e-7e41bab26c13`,new_data:{_meta:{logged_at:`2026-09-09T19:01:22.107Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`},bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,bau_name:`Báu Casa`,previous_balance:235,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,product_name:`LockPick`,quantity:5,reason:`Movimentação Operacional de Estoque`,resulting_balance:230,type:`saida`},user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ff509b5a-229c-43ff-a55f-5c850d2a52ab":{action:`create_movement`,created_at:`2026-08-20T20:43:52.032Z`,entity:`stock_movements`,entity_id:`2b55e127-e7b3-411e-b27b-40fb79c66323`,id:`ff509b5a-229c-43ff-a55f-5c850d2a52ab`,new_data:{product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:411,type:`entrada`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ff5b8621-5f14-429e-bf70-44b8cdaa689a":{action:`session_start`,created_at:`2026-08-22T11:12:41.439Z`,entity:`user_presence`,id:`ff5b8621-5f14-429e-bf70-44b8cdaa689a`,new_data:{_meta:{logged_at:`2026-08-22T11:12:40.841Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},online_since:`2026-08-22T11:12:40.837Z`,reason:`retorno_ausencia`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ff69fc24-9e98-47f8-93e8-bf29d537cde0":{action:`session_start`,created_at:`2026-09-13T01:53:05.034Z`,entity:`user_presence`,id:`ff69fc24-9e98-47f8-93e8-bf29d537cde0`,new_data:{_meta:{logged_at:`2026-09-13T01:52:53.108Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0`},online_since:`2026-09-13T01:52:53.103Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"ff7cf811-26f8-458f-89aa-5bba35d4f0b2":{action:`session_end`,created_at:`2026-08-28T21:23:38.535Z`,entity:`user_presence`,id:`ff7cf811-26f8-458f-89aa-5bba35d4f0b2`,new_data:{_meta:{logged_at:`2026-08-28T21:29:34.589Z`,severity:`warning`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0`},duration_formatted:`6h 15min`,reason:`fechamento_aba`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"ffe22627-0d6a-4957-9931-eefb1abb5eb4":{action:`transfer_between_chests`,created_at:`2026-08-21T23:59:32.671Z`,entity:`stock_movements`,id:`ffe22627-0d6a-4957-9931-eefb1abb5eb4`,new_data:{_meta:{logged_at:`2026-08-21T23:57:54.992Z`,severity:`info`,user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`},from_bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,from_bau_name:`Baú Caixote`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,product_name:`Munição de pistola`,quantity:1,reason:`Transferência em Lote entre Baús`,to_bau_id:`91570e19-36a4-4f7c-b0af-e5720013dc2c`,to_bau_name:`Baú Ármario de parede Grande`},user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`}},auth_identities:{"18fee478-2d64-4cea-9b67-51d95ad98376":{created_at:`2026-08-20T15:00:51.310Z`,email:`lukaasgogos2010@gmail.com`,id:`18fee478-2d64-4cea-9b67-51d95ad98376`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,custom_claims:{global_name:`𝙇𝘾`},email:`lukaasgogos2010@gmail.com`,email_verified:!0,full_name:`lcsluuca`,iss:`https://discord.com/api`,name:`lcsluuca#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,provider_id:`251079840931774465`,sub:`251079840931774465`},last_sign_in_at:`2026-08-20T15:00:51.310Z`,provider:`discord`,provider_id:`251079840931774465`,updated_at:`2026-09-15T18:21:22.794Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"3dc01ce5-d6f2-43ae-8b63-15e25e007561":{created_at:`2026-08-28T15:08:26.720Z`,email:`gustavomiguelmatos2@gmail.com`,id:`3dc01ce5-d6f2-43ae-8b63-15e25e007561`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,custom_claims:{global_name:`L7NNON`},email:`gustavomiguelmatos2@gmail.com`,email_verified:!0,full_name:`_l7._`,iss:`https://discord.com/api`,name:`_l7._#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,provider_id:`857308338382700565`,sub:`857308338382700565`},last_sign_in_at:`2026-08-28T15:08:26.720Z`,provider:`discord`,provider_id:`857308338382700565`,updated_at:`2026-09-16T16:07:48.799Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"4c356cfd-3b18-4950-a737-ea1497343503":{created_at:`2026-08-27T02:46:29.004Z`,email:`alisanttt2002@gmail.com`,id:`4c356cfd-3b18-4950-a737-ea1497343503`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png`,custom_claims:{global_name:`ALISSON DANIEL`},email:`alisanttt2002@gmail.com`,email_verified:!0,full_name:`alisson_daniel48`,iss:`https://discord.com/api`,name:`alisson_daniel48#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png`,provider_id:`1490783713187860712`,sub:`1490783713187860712`},last_sign_in_at:`2026-08-27T02:46:29.004Z`,provider:`discord`,provider_id:`1490783713187860712`,updated_at:`2026-08-27T02:46:29.004Z`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},"56c8101f-2f06-4bff-9724-8b7c99192f3e":{created_at:`2026-08-19T19:26:25.181Z`,id:`56c8101f-2f06-4bff-9724-8b7c99192f3e`,identity_data:{sub:`999888777666`},provider:`discord`,provider_id:`999888777666`,updated_at:`2026-08-19T19:26:25.181Z`,user_id:`3487cc59-c4fb-45ed-8ed6-ef874ba39c37`},"5d5e0ef9-dd48-4b78-abd8-632a9972a456":{created_at:`2026-08-28T18:31:12.860Z`,email:`igorsantosaaz@gmail.com`,id:`5d5e0ef9-dd48-4b78-abd8-632a9972a456`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png`,custom_claims:{global_name:`ᴹᴬᶜᴬÉ`},email:`igorsantosaaz@gmail.com`,email_verified:!0,full_name:`macae`,iss:`https://discord.com/api`,name:`macae#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png`,provider_id:`628374267095941131`,sub:`628374267095941131`},last_sign_in_at:`2026-08-28T18:31:12.860Z`,provider:`discord`,provider_id:`628374267095941131`,updated_at:`2026-09-05T03:30:25.410Z`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"61bd343a-ed7a-4d95-859c-9fa3a3250c43":{created_at:`2026-08-24T02:52:39.622Z`,email:`matheusdario481@gmail.com`,id:`61bd343a-ed7a-4d95-859c-9fa3a3250c43`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/622074568248393749/8991db8634e27e554f63d86f7ba14368.png`,custom_claims:{global_name:`Adam`},email:`matheusdario481@gmail.com`,email_verified:!0,full_name:`adamft.`,iss:`https://discord.com/api`,name:`adamft.#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/622074568248393749/8991db8634e27e554f63d86f7ba14368.png`,provider_id:`622074568248393749`,sub:`622074568248393749`},last_sign_in_at:`2026-08-24T02:52:39.622Z`,provider:`discord`,provider_id:`622074568248393749`,updated_at:`2026-09-15T02:12:56.145Z`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"67bcc479-8d2f-45b9-b00c-4b5a5b1f15ef":{created_at:`2026-08-27T02:44:45.163Z`,email:`carbis231@gmail.com`,id:`67bcc479-8d2f-45b9-b00c-4b5a5b1f15ef`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png`,custom_claims:{global_name:`ZECA`},email:`carbis231@gmail.com`,email_verified:!0,full_name:`carlospvc`,iss:`https://discord.com/api`,name:`carlospvc#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png`,provider_id:`711610919850999869`,sub:`711610919850999869`},last_sign_in_at:`2026-08-27T02:44:45.162Z`,provider:`discord`,provider_id:`711610919850999869`,updated_at:`2026-08-27T02:44:45.163Z`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"7f04feb3-161f-4178-b2df-f31cf561fb5d":{created_at:`2026-08-20T20:34:07.903Z`,email:`karyknms@gmail.com`,id:`7f04feb3-161f-4178-b2df-f31cf561fb5d`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,custom_claims:{global_name:`𝙼̷𝙴̷𝙳̷𝚄̷𝚂̷𝙰̷`},email:`karyknms@gmail.com`,email_verified:!0,full_name:`karianny`,iss:`https://discord.com/api`,name:`karianny#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,provider_id:`343459063616765953`,sub:`343459063616765953`},last_sign_in_at:`2026-08-20T20:34:07.903Z`,provider:`discord`,provider_id:`343459063616765953`,updated_at:`2026-09-16T03:05:33.292Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"abbefb22-cbfa-4b2c-9b3b-29725b8d0e9c":{created_at:`2026-08-19T19:23:04.574Z`,email:`developers@twtools.local`,id:`abbefb22-cbfa-4b2c-9b3b-29725b8d0e9c`,identity_data:{email:`developers@twtools.local`,sub:`b68c9ae7-2e94-4bfd-ac42-68dea5309f7e`},last_sign_in_at:`2026-08-19T19:23:04.574Z`,provider:`email`,provider_id:`b68c9ae7-2e94-4bfd-ac42-68dea5309f7e`,updated_at:`2026-08-19T19:23:04.574Z`,user_id:`b68c9ae7-2e94-4bfd-ac42-68dea5309f7e`},"ac31e680-9100-49a5-9af3-86bb687bc268":{created_at:`2026-09-01T00:49:24.868Z`,email:`ns1660209@gmail.com`,id:`ac31e680-9100-49a5-9af3-86bb687bc268`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png`,custom_claims:{global_name:`Javali444`},email:`ns1660209@gmail.com`,email_verified:!0,full_name:`nyco123.`,iss:`https://discord.com/api`,name:`nyco123.#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png`,provider_id:`1245186033868603476`,sub:`1245186033868603476`},last_sign_in_at:`2026-09-01T00:49:24.868Z`,provider:`discord`,provider_id:`1245186033868603476`,updated_at:`2026-09-01T00:49:24.868Z`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},"c1ba2cc4-8dc7-49df-9ca2-58e2cb78c68d":{created_at:`2026-09-14T20:31:37.190Z`,email:`malaca7x@gmail.com`,id:`c1ba2cc4-8dc7-49df-9ca2-58e2cb78c68d`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,custom_claims:{global_name:`malaca`},email:`malaca7x@gmail.com`,email_verified:!0,full_name:`malaca7x`,iss:`https://discord.com/api`,name:`malaca7x#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,provider_id:`722320491767136346`,sub:`722320491767136346`},last_sign_in_at:`2026-09-14T20:31:37.190Z`,provider:`discord`,provider_id:`722320491767136346`,updated_at:`2026-09-19T02:36:23.487Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"cd25318d-2e87-4e72-b2a2-bf591492578e":{created_at:`2026-08-19T19:34:03.933Z`,email:`rogeriosantanajr@gmail.com`,id:`cd25318d-2e87-4e72-b2a2-bf591492578e`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,custom_claims:{global_name:`𝒎𝒂𝒍𝒂𝒄𝒂`},email:`rogeriosantanajr@gmail.com`,email_verified:!0,full_name:`malaca7`,iss:`https://discord.com/api`,name:`malaca7#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,provider_id:`917826984778797087`,sub:`917826984778797087`},last_sign_in_at:`2026-08-19T19:34:03.933Z`,provider:`discord`,provider_id:`917826984778797087`,updated_at:`2026-09-19T04:28:21.554Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"dc9ffef7-f478-45e1-b32d-ef29512749e8":{created_at:`2026-08-21T00:50:33.808Z`,email:`livedoball@gmail.com`,id:`dc9ffef7-f478-45e1-b32d-ef29512749e8`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png`,custom_claims:{global_name:`MatheusHen`},email:`livedoball@gmail.com`,email_verified:!0,full_name:`manball2590`,iss:`https://discord.com/api`,name:`manball2590#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png`,provider_id:`899381358823104513`,sub:`899381358823104513`},last_sign_in_at:`2026-08-21T00:50:33.808Z`,provider:`discord`,provider_id:`899381358823104513`,updated_at:`2026-09-06T18:59:08.763Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e116dd7b-93e9-4433-943d-bbc13fde9f75":{created_at:`2026-08-22T03:38:35.305Z`,email:`eltonvargas977@gmail.com`,id:`e116dd7b-93e9-4433-943d-bbc13fde9f75`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/815425543998668860/3452e007099e8c9f3584b8b98ff9e0ee.png`,custom_claims:{global_name:`Skk`},email:`eltonvargas977@gmail.com`,email_verified:!0,full_name:`skk_v2`,iss:`https://discord.com/api`,name:`skk_v2#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/815425543998668860/3452e007099e8c9f3584b8b98ff9e0ee.png`,provider_id:`815425543998668860`,sub:`815425543998668860`},last_sign_in_at:`2026-08-22T03:38:35.305Z`,provider:`discord`,provider_id:`815425543998668860`,updated_at:`2026-09-05T03:02:46.718Z`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"eea9b156-a9d2-4123-b3b6-a6e732c175f8":{created_at:`2026-08-29T21:39:15.317Z`,email:`malacarogeriojr@gmail.com`,id:`eea9b156-a9d2-4123-b3b6-a6e732c175f8`,identity_data:{avatar_url:`https://cdn.discordapp.com/avatars/1532134651148107807/666b438ecec491b541185802a32916e4.png`,custom_claims:{global_name:`omalacap1`},email:`malacarogeriojr@gmail.com`,email_verified:!0,full_name:`malacap1`,iss:`https://discord.com/api`,name:`malacap1#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/1532134651148107807/666b438ecec491b541185802a32916e4.png`,provider_id:`1532134651148107807`,sub:`1532134651148107807`},last_sign_in_at:`2026-08-29T21:39:15.317Z`,provider:`discord`,provider_id:`1532134651148107807`,updated_at:`2026-08-29T21:48:07.172Z`,user_id:`e804c543-4e0a-4c45-9930-4450739d3b36`}},auth_users:{"23bb2cb3-4bc8-48e9-b38e-78d50874083f":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-21T00:50:33.819Z`,created_at:`2026-08-21T00:50:33.789Z`,email:`livedoball@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-21T00:50:33.819Z`,id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png`,custom_claims:{global_name:`MatheusHen`},email:`livedoball@gmail.com`,email_verified:!0,full_name:`manball2590`,iss:`https://discord.com/api`,name:`manball2590#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png`,provider_id:`899381358823104513`,sub:`899381358823104513`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-11T16:55:35.446Z`},"2a974403-195b-4a1c-8c80-85afc1e77391":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-20T20:34:07.916Z`,created_at:`2026-08-20T20:34:07.878Z`,email:`karyknms@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-20T20:34:07.916Z`,id:`2a974403-195b-4a1c-8c80-85afc1e77391`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-16T03:05:33.300Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,custom_claims:{global_name:`𝙼̷𝙴̷𝙳̷𝚄̷𝚂̷𝙰̷`},email:`karyknms@gmail.com`,email_verified:!0,full_name:`karianny`,iss:`https://discord.com/api`,name:`karianny#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,provider_id:`343459063616765953`,sub:`343459063616765953`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-22T04:23:04.969Z`},"3487cc59-c4fb-45ed-8ed6-ef874ba39c37":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-19T19:26:25.181Z`,created_at:`2026-08-19T19:26:25.181Z`,email:`teste@discord.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-19T19:26:25.181Z`,encrypted_password:`$2a$06$HGxJEZnot.jc2O.EHb519Opc.qe8o1.dJtJKVTLycYjo3LwXsT4VW`,id:`3487cc59-c4fb-45ed-8ed6-ef874ba39c37`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{nickname:`Teste`,nome:`Jogador Teste`,telefone:`123-456`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-08-19T19:26:25.181Z`},"3820da50-73d2-4d03-a467-efcbe4a8bfdf":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-27T02:44:45.178Z`,created_at:`2026-08-27T02:44:45.144Z`,email:`carbis231@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-27T02:44:45.178Z`,id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-08-27T02:44:45.194Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png`,custom_claims:{global_name:`ZECA`},email:`carbis231@gmail.com`,email_verified:!0,full_name:`carlospvc`,iss:`https://discord.com/api`,name:`carlospvc#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png`,provider_id:`711610919850999869`,sub:`711610919850999869`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-08-31T15:39:29.042Z`},"3c062f9c-cb7a-4a8b-8d78-0fe5693098a5":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-28T18:31:12.877Z`,created_at:`2026-08-28T18:31:12.817Z`,email:`igorsantosaaz@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-28T18:31:12.877Z`,id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-05T03:30:25.417Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png`,custom_claims:{global_name:`ᴹᴬᶜᴬÉ`},email:`igorsantosaaz@gmail.com`,email_verified:!0,full_name:`macae`,iss:`https://discord.com/api`,name:`macae#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png`,provider_id:`628374267095941131`,sub:`628374267095941131`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-13T21:59:06.314Z`},"4c7381e6-6d54-44af-bc7f-0daecdbad782":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-27T02:46:29.014Z`,created_at:`2026-08-27T02:46:28.990Z`,email:`alisanttt2002@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-27T02:46:29.014Z`,id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-08-27T02:46:29.019Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png`,custom_claims:{global_name:`ALISSON DANIEL`},email:`alisanttt2002@gmail.com`,email_verified:!0,full_name:`alisson_daniel48`,iss:`https://discord.com/api`,name:`alisson_daniel48#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png`,provider_id:`1490783713187860712`,sub:`1490783713187860712`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-08-27T22:25:34.631Z`},"5eb49e12-e1ea-4180-9206-29105b3f1ea6":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-28T15:08:26.735Z`,created_at:`2026-08-28T15:08:26.702Z`,email:`gustavomiguelmatos2@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-28T15:08:26.735Z`,id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-16T16:07:48.812Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,custom_claims:{global_name:`L7NNON`},email:`gustavomiguelmatos2@gmail.com`,email_verified:!0,full_name:`_l7._`,iss:`https://discord.com/api`,name:`_l7._#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,provider_id:`857308338382700565`,sub:`857308338382700565`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-22T15:26:33.900Z`},"6e2f5d10-d684-4caf-8c1e-636b9d1a84d6":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-19T19:34:03.939Z`,created_at:`2026-08-19T19:34:03.923Z`,email:`rogeriosantanajr@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-19T19:34:03.939Z`,id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-19T04:28:21.562Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,custom_claims:{global_name:`𝒎𝒂𝒍𝒂𝒄𝒂`},email:`rogeriosantanajr@gmail.com`,email_verified:!0,full_name:`malaca7`,iss:`https://discord.com/api`,name:`malaca7#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,provider_id:`917826984778797087`,sub:`917826984778797087`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-21T20:42:56.555Z`},"aaf63496-1cee-4e65-92ff-66c411ba1920":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-09-01T00:49:24.879Z`,created_at:`2026-09-01T00:49:24.844Z`,email:`ns1660209@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-09-01T00:49:24.879Z`,id:`aaf63496-1cee-4e65-92ff-66c411ba1920`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-01T00:49:24.890Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png`,custom_claims:{global_name:`Javali444`},email:`ns1660209@gmail.com`,email_verified:!0,full_name:`nyco123.`,iss:`https://discord.com/api`,name:`nyco123.#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png`,provider_id:`1245186033868603476`,sub:`1245186033868603476`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-01T00:49:24.939Z`},"b68c9ae7-2e94-4bfd-ac42-68dea5309f7e":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-19T19:23:04.574Z`,created_at:`2026-08-19T19:23:04.574Z`,email:`developers@twtools.local`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-19T19:23:04.574Z`,encrypted_password:`$2a$06$o25QwGbtZfqpr7SQ1xXpZ.fIfzYaiCQocDe8dS7nPqlv4cpN0gd9C`,id:`b68c9ae7-2e94-4bfd-ac42-68dea5309f7e`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`email`,providers:[`email`]},raw_user_meta_data:{nickname:`developers`,nome:`developers`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-08-19T19:23:04.574Z`},"c5ef6dc6-e126-4027-80c3-319f0a870315":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-09-14T20:31:37.196Z`,created_at:`2026-09-14T20:31:37.180Z`,email:`malaca7x@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-09-14T20:31:37.196Z`,id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-19T02:36:23.504Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,custom_claims:{global_name:`malaca`},email:`malaca7x@gmail.com`,email_verified:!0,full_name:`malaca7x`,iss:`https://discord.com/api`,name:`malaca7x#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,provider_id:`722320491767136346`,sub:`722320491767136346`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-22T14:32:00.611Z`},"ce2aa0d1-43a9-44ab-b5fa-8021589b28d2":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-24T02:52:39.633Z`,created_at:`2026-08-24T02:52:39.607Z`,email:`matheusdario481@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-24T02:52:39.633Z`,id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-15T02:12:56.165Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/622074568248393749/b51cce5fe8cac229077cdd25ebc301eb.png?size=512`,custom_claims:{global_name:`Adam`},email:`matheusdario481@gmail.com`,email_verified:!0,full_name:`adamft.`,iss:`https://discord.com/api`,name:`adamft.#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/622074568248393749/8991db8634e27e554f63d86f7ba14368.png`,provider_id:`622074568248393749`,sub:`622074568248393749`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-22T17:56:08.856Z`},"d8261681-8469-4643-bca0-5fc154b3a25b":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-20T15:00:51.325Z`,created_at:`2026-08-20T15:00:51.265Z`,email:`lukaasgogos2010@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-20T15:00:51.325Z`,id:`d8261681-8469-4643-bca0-5fc154b3a25b`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-15T18:21:22.809Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,custom_claims:{global_name:`𝙇𝘾`},email:`lukaasgogos2010@gmail.com`,email_verified:!0,full_name:`lcsluuca`,iss:`https://discord.com/api`,name:`lcsluuca#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,provider_id:`251079840931774465`,sub:`251079840931774465`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-19T19:15:12.098Z`},"e804c543-4e0a-4c45-9930-4450739d3b36":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-29T21:39:15.331Z`,created_at:`2026-08-29T21:39:15.285Z`,email:`malacarogeriojr@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-29T21:39:15.331Z`,id:`e804c543-4e0a-4c45-9930-4450739d3b36`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-08-29T21:48:07.182Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/1532134651148107807/666b438ecec491b541185802a32916e4.png`,custom_claims:{global_name:`omalacap1`},email:`malacarogeriojr@gmail.com`,email_verified:!0,full_name:`malacap1`,iss:`https://discord.com/api`,name:`malacap1#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/1532134651148107807/666b438ecec491b541185802a32916e4.png`,provider_id:`1532134651148107807`,sub:`1532134651148107807`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-08-30T18:02:08.471Z`},"f970371a-246e-4109-8a08-d197a41f0906":{aud:`authenticated`,confirmation_token:``,confirmed_at:`2026-08-22T03:38:35.315Z`,created_at:`2026-08-22T03:38:35.283Z`,email:`eltonvargas977@gmail.com`,email_change:``,email_change_confirm_status:0,email_change_token_current:``,email_change_token_new:``,email_confirmed_at:`2026-08-22T03:38:35.315Z`,id:`f970371a-246e-4109-8a08-d197a41f0906`,instance_id:`00000000-0000-0000-0000-000000000000`,is_anonymous:!1,is_sso_user:!1,last_sign_in_at:`2026-09-05T03:02:46.721Z`,phone_change:``,phone_change_token:``,raw_app_meta_data:{provider:`discord`,providers:[`discord`]},raw_user_meta_data:{avatar_url:`https://cdn.discordapp.com/avatars/815425543998668860/b974de8cf7b86f95dec282cb7180d087.png?size=512`,custom_claims:{global_name:`Skk`},email:`eltonvargas977@gmail.com`,email_verified:!0,full_name:`skk_v2`,iss:`https://discord.com/api`,name:`skk_v2#0`,phone_verified:!1,picture:`https://cdn.discordapp.com/avatars/815425543998668860/3452e007099e8c9f3584b8b98ff9e0ee.png`,provider_id:`815425543998668860`,sub:`815425543998668860`},reauthentication_token:``,recovery_token:``,role:`authenticated`,updated_at:`2026-09-20T18:48:13.581Z`}},baus:{"074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{ativo:!0,created_at:`2026-08-29T13:24:52.654Z`,descricao:`ESSE BAU TERÁ TUDO DO QG`,discord_channel_id:`1535637509818548234`,discord_guild_id:`1535505650308620400`,foto_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bau_1789784363387_bau2.png`,icone:`box`,id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bau_1789784363387_bau2.png`,nome:`BAÚ QG`,tipo_gestao:`automatico`,updated_at:`2026-09-19T02:19:26.079Z`},"d90e05cb-86cd-4b8b-a18a-b79d5096d902":{ativo:!0,created_at:`2026-09-01T00:12:05.714Z`,descricao:`Baú padrão para alocação de itens e produtos.`,icone:`box`,id:`d90e05cb-86cd-4b8b-a18a-b79d5096d902`,nome:`Baú Caixote`,tipo_gestao:`manual`,updated_at:`2026-09-01T00:12:05.714Z`},"efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{ativo:!0,created_at:`2026-08-20T20:38:36.840Z`,descricao:`Báus que ficam localizados na casa`,foto_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bau_1789784371665_bau.png`,icone:`flask-conical`,id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bau_1789784371665_bau.png`,nome:`Báu Casa`,tipo_gestao:`manual`,updated_at:`2026-09-19T02:19:33.963Z`}},cash_fund_movements:{"047b9ccc-4590-476c-9f13-dd1306d7a1a2":{amount:`114000.00`,created_at:`2026-09-13T00:37:58.563Z`,id:`047b9ccc-4590-476c-9f13-dd1306d7a1a2`,motive:`compra de 3 g3`,previous_balance:`239503.00`,resulting_balance:`125503.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-13T00:37:58.563Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"06258151-5fbb-4bb9-92b3-8488a0099573":{amount:`9500.00`,created_at:`2026-09-06T14:16:08.916Z`,id:`06258151-5fbb-4bb9-92b3-8488a0099573`,motive:`Retirada para compra de munição`,previous_balance:`246791.00`,resulting_balance:`237291.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-06T14:16:08.916Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"073b9fbf-757c-43eb-a8ce-0baf9fc41f79":{amount:`42000.00`,created_at:`2026-08-24T18:00:44.800Z`,id:`073b9fbf-757c-43eb-a8ce-0baf9fc41f79`,motive:`contrabando`,previous_balance:`175398.00`,resulting_balance:`133398.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-24T18:00:44.800Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"083e7013-37fb-4125-b85f-c0b58d03fdbb":{amount:`57000.00`,created_at:`2026-09-02T21:49:52.125Z`,id:`083e7013-37fb-4125-b85f-c0b58d03fdbb`,motive:`contrabando`,previous_balance:`121117.00`,resulting_balance:`64117.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T21:49:52.125Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"1693776f-5cc0-4da6-9bff-82d24ba02e41":{amount:`90000.00`,created_at:`2026-09-08T20:43:38.954Z`,id:`1693776f-5cc0-4da6-9bff-82d24ba02e41`,motive:`contrabando`,previous_balance:`352533.00`,resulting_balance:`262533.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-08T20:43:38.954Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"170fced8-550c-4e24-96e7-2cb9611f7104":{amount:`36000.00`,created_at:`2026-09-09T22:34:59.103Z`,id:`170fced8-550c-4e24-96e7-2cb9611f7104`,motive:`2000 mil muni pistol`,previous_balance:`400423.00`,resulting_balance:`364423.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-09T22:34:59.103Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"1c808892-7093-430b-82c2-f81af35d9aad":{amount:`1000.00`,created_at:`2026-09-05T17:16:38.456Z`,id:`1c808892-7093-430b-82c2-f81af35d9aad`,motive:`teste`,previous_balance:`221500.00`,resulting_balance:`220500.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-05T17:16:38.456Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"1d46e9d1-b0cf-4be0-894f-5ce9d08de415":{amount:`55000.00`,created_at:`2026-08-28T17:27:06.703Z`,id:`1d46e9d1-b0cf-4be0-894f-5ce9d08de415`,motive:`armas sub`,previous_balance:`193063.00`,resulting_balance:`138063.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-28T17:27:06.703Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"1ea11bd3-8b0f-4362-a0db-6fb29e35bb83":{amount:`65000.00`,created_at:`2026-09-06T14:16:52.521Z`,id:`1ea11bd3-8b0f-4362-a0db-6fb29e35bb83`,motive:`Feito compra de armamento`,notes:`ganhamos uma a mais`,previous_balance:`237291.00`,resulting_balance:`172291.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-06T14:16:52.521Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"1f2719db-8f72-47d4-8b11-e031b6231634":{amount:`33500.00`,created_at:`2026-08-22T00:41:17.540Z`,id:`1f2719db-8f72-47d4-8b11-e031b6231634`,motive:`Compra de coca`,previous_balance:`218441.00`,resulting_balance:`184941.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-22T00:41:17.540Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"24a4ca49-e1d4-4a26-b03c-8702779f93a0":{amount:`48000.00`,created_at:`2026-08-22T02:31:04.446Z`,id:`24a4ca49-e1d4-4a26-b03c-8702779f93a0`,motive:`Compra de Meta`,previous_balance:`208191.00`,resulting_balance:`160191.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-22T02:31:04.446Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"2586f2e2-4332-4d7a-9d3d-bc5c2c1e85c2":{amount:`40000.00`,created_at:`2026-09-02T23:40:40.292Z`,id:`2586f2e2-4332-4d7a-9d3d-bc5c2c1e85c2`,motive:`lavagem porcentagem ação`,previous_balance:`85000.00`,resulting_balance:`125000.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T23:40:40.292Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"26a53f34-6f3e-47c8-89bb-639625381f1a":{amount:`1001.00`,created_at:`2026-09-08T20:13:36.220Z`,id:`26a53f34-6f3e-47c8-89bb-639625381f1a`,motive:`errod`,previous_balance:`353532.00`,resulting_balance:`352531.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-08T20:13:36.220Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"26b65711-2cdc-4969-a8e9-b1aeb777d8cd":{amount:`46741.00`,created_at:`2026-09-08T20:12:31.396Z`,id:`26b65711-2cdc-4969-a8e9-b1aeb777d8cd`,motive:`kayn`,previous_balance:`226791.00`,resulting_balance:`273532.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-08T20:12:31.396Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"2920c7dd-f4ba-4794-8ed3-0a0e55c969e9":{amount:`31864.00`,created_at:`2026-08-21T15:08:44.891Z`,id:`2920c7dd-f4ba-4794-8ed3-0a0e55c969e9`,motive:`dinheiro do bau`,previous_balance:`137957.00`,resulting_balance:`169821.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-21T15:08:44.891Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"29bb9cb1-f093-43f5-b386-4c85705f2c10":{amount:`39000.00`,created_at:`2026-08-28T17:27:22.006Z`,id:`29bb9cb1-f093-43f5-b386-4c85705f2c10`,motive:`coca`,previous_balance:`138063.00`,resulting_balance:`99063.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-28T17:27:22.006Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"2ae90881-8efa-4919-b360-2f5e90247e95":{amount:`13250.00`,created_at:`2026-08-22T00:42:28.235Z`,id:`2ae90881-8efa-4919-b360-2f5e90247e95`,motive:`Fiz os cálculos para concertar o valor`,previous_balance:`184941.00`,resulting_balance:`198191.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T00:42:28.235Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"2c7ab2d0-ce49-4274-9663-9130b0c0301a":{amount:`98500.00`,created_at:`2026-08-21T01:04:23.262Z`,id:`2c7ab2d0-ce49-4274-9663-9130b0c0301a`,motive:`O que tem no banco registrado`,previous_balance:`0.00`,resulting_balance:`98500.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-21T01:04:23.262Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"2d161c5e-9020-49ee-8631-f7a8d55b5e84":{amount:`112890.00`,created_at:`2026-09-09T22:09:59.332Z`,id:`2d161c5e-9020-49ee-8631-f7a8d55b5e84`,motive:`lavagem porcentagem ação`,previous_balance:`287533.00`,resulting_balance:`400423.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-09T22:09:59.332Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"2d9f4228-02bc-4071-80a1-174478b7ed98":{amount:`65000.00`,created_at:`2026-08-22T15:59:31.235Z`,id:`2d9f4228-02bc-4071-80a1-174478b7ed98`,motive:`armas sub`,previous_balance:`338398.00`,resulting_balance:`273398.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-22T15:59:31.235Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"33ae34ef-ec82-433b-aa75-b4bf788247c2":{amount:`106000.00`,created_at:`2026-09-08T20:12:50.462Z`,id:`33ae34ef-ec82-433b-aa75-b4bf788247c2`,motive:`macae`,previous_balance:`273532.00`,resulting_balance:`379532.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-08T20:12:50.462Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"34c47ef6-3ecb-44c7-aa79-ad1f0b625ba5":{amount:`150000`,created_at:`2026-09-15T21:57:46.417Z`,id:`34c47ef6-3ecb-44c7-aa79-ad1f0b625ba5`,motive:`lavagem porcentagem ação paleto`,previous_balance:`75503.00`,resulting_balance:`225503.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-15T21:57:46.417Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"353c3b06-9904-4a12-a77a-eb864bb9c649":{amount:`18427.00`,created_at:`2026-08-22T14:41:47.662Z`,id:`353c3b06-9904-4a12-a77a-eb864bb9c649`,motive:`droga`,previous_balance:`269971.00`,resulting_balance:`288398.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T14:41:47.662Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"382d987d-2df0-41fb-896d-2ca88b1b7f80":{amount:`28665.00`,created_at:`2026-08-24T18:01:44.384Z`,id:`382d987d-2df0-41fb-896d-2ca88b1b7f80`,motive:`drogas`,previous_balance:`133398.00`,resulting_balance:`162063.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-24T18:01:44.384Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"3d1ee416-6dd3-4d32-bb67-a0ed63731fd6":{amount:`45500.00`,created_at:`2026-09-06T14:20:55.815Z`,id:`3d1ee416-6dd3-4d32-bb67-a0ed63731fd6`,motive:`Compra de droga`,previous_balance:`172291.00`,resulting_balance:`126791.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-06T14:20:55.815Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"3eb627b9-b940-409a-91f1-52bb7e5a4da7":{amount:`1000.00`,created_at:`2026-09-05T17:16:32.372Z`,id:`3eb627b9-b940-409a-91f1-52bb7e5a4da7`,motive:`teste`,previous_balance:`220500.00`,resulting_balance:`221500.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-05T17:16:32.372Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"3f73c541-9f9f-4b21-8970-1c71eb44a6a1":{amount:`100000.00`,created_at:`2026-09-04T11:12:12.909Z`,id:`3f73c541-9f9f-4b21-8970-1c71eb44a6a1`,motive:`lavagem porcentagem ação`,previous_balance:`101000.00`,resulting_balance:`201000.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-04T11:12:12.909Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"464b1e55-8bdd-4e44-9fa9-c91685b3450b":{amount:`19000.00`,created_at:`2026-09-13T00:02:07.290Z`,id:`464b1e55-8bdd-4e44-9fa9-c91685b3450b`,motive:`munição de sub`,previous_balance:`258503.00`,resulting_balance:`239503.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-13T00:02:07.290Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"546998e7-011c-405c-9a87-784065fc2581":{amount:`48000.00`,created_at:`2026-08-22T02:31:15.722Z`,id:`546998e7-011c-405c-9a87-784065fc2581`,motive:`Compra de maconha`,previous_balance:`160191.00`,resulting_balance:`112191.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-22T02:31:15.722Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"54fb64e5-0a9c-492f-a2c7-ca8347c6212d":{amount:`18241.00`,created_at:`2026-08-22T12:33:39.441Z`,id:`54fb64e5-0a9c-492f-a2c7-ca8347c6212d`,motive:`venda droga`,previous_balance:`214418.00`,resulting_balance:`232659.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T12:33:39.441Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"5530f477-aafe-4eda-9c04-72e884d97e12":{amount:`10000.00`,created_at:`2026-08-22T02:08:32.506Z`,id:`5530f477-aafe-4eda-9c04-72e884d97e12`,motive:`droga`,previous_balance:`198191.00`,resulting_balance:`208191.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T02:08:32.506Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"59a00ffe-c5fc-45a4-8ab7-9f3ebb73d384":{amount:`398.00`,created_at:`2026-09-02T20:57:42.359Z`,id:`59a00ffe-c5fc-45a4-8ab7-9f3ebb73d384`,motive:`concertando valor`,previous_balance:`98500.00`,resulting_balance:`98898.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T20:57:42.359Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"59bc412d-6086-4c96-8911-90dc17bd620b":{amount:`15000.00`,created_at:`2026-09-11T00:32:00.678Z`,id:`59bc412d-6086-4c96-8911-90dc17bd620b`,motive:`ship`,previous_balance:`234423.00`,resulting_balance:`219423.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-11T00:32:00.678Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"59ef414e-a3a4-40f3-8fc4-6d34522c9b78":{amount:`35000.00`,created_at:`2026-08-29T13:28:25.656Z`,id:`59ef414e-a3a4-40f3-8fc4-6d34522c9b78`,motive:`tt`,previous_balance:`121791.00`,resulting_balance:`156791.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-29T13:28:25.656Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"5a3eda2d-9ce3-478d-ad33-82616937e2d1":{amount:`23100.00`,created_at:`2026-08-29T13:28:14.198Z`,id:`5a3eda2d-9ce3-478d-ad33-82616937e2d1`,motive:`LENON`,previous_balance:`98691.00`,resulting_balance:`121791.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-29T13:28:14.198Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"5a404d74-4c01-45cb-b802-6857edc3d13c":{amount:`32500.00`,created_at:`2026-09-02T21:50:54.394Z`,id:`5a404d74-4c01-45cb-b802-6857edc3d13c`,motive:`drofas`,previous_balance:`123117.00`,resulting_balance:`90617.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T21:50:54.394Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"5e394f12-b141-470b-b01a-83b54ee8986b":{amount:`66000.00`,created_at:`2026-09-02T21:50:20.906Z`,id:`5e394f12-b141-470b-b01a-83b54ee8986b`,motive:`drogas`,previous_balance:`164117.00`,resulting_balance:`98117.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T21:50:20.906Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"6112f47a-3494-4706-a398-733fc83312fa":{amount:`1000.00`,created_at:`2026-09-03T20:24:12.045Z`,id:`6112f47a-3494-4706-a398-733fc83312fa`,motive:`teste`,previous_balance:`2000.00`,resulting_balance:`1000.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-03T20:24:12.045Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"6177573e-3964-48d1-b8ac-44cdca16581f":{amount:`84000.00`,created_at:`2026-09-13T00:01:56.622Z`,id:`6177573e-3964-48d1-b8ac-44cdca16581f`,motive:`compra de contrabando`,previous_balance:`342503.00`,resulting_balance:`258503.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-13T00:01:56.622Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"629c7cad-d559-44d5-a040-f7fc2ed5e38a":{amount:`18636.00`,created_at:`2026-08-22T13:46:18.179Z`,id:`629c7cad-d559-44d5-a040-f7fc2ed5e38a`,motive:`droga`,previous_balance:`251335.00`,resulting_balance:`269971.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T13:46:18.179Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"6751fb66-1e99-4b47-aac8-e3216a4a258d":{amount:`69000.00`,created_at:`2026-09-03T02:36:24.328Z`,id:`6751fb66-1e99-4b47-aac8-e3216a4a258d`,motive:`RISE`,previous_balance:`70000.00`,resulting_balance:`1000.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-03T02:36:24.328Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"6b833f67-6e3d-40d6-bcf2-e6ab0a569fb6":{amount:`36540.00`,created_at:`2026-09-11T14:57:33.097Z`,id:`6b833f67-6e3d-40d6-bcf2-e6ab0a569fb6`,motive:`sla`,previous_balance:`305963.00`,resulting_balance:`342503.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-11T14:57:33.097Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"73d32fb5-9910-4f8b-a388-cf25b208ef26":{amount:`58291.00`,created_at:`2026-09-02T20:56:41.951Z`,id:`73d32fb5-9910-4f8b-a388-cf25b208ef26`,motive:`concertando valor`,previous_balance:`156791.00`,resulting_balance:`98500.00`,status:`estornado`,type:`saida`,updated_at:`2026-09-02T20:57:12.663Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"7411a483-02b1-4ff7-9487-8c7052c74ca5":{amount:`398.00`,created_at:`2026-09-02T21:51:46.028Z`,id:`7411a483-02b1-4ff7-9487-8c7052c74ca5`,motive:`deluca`,previous_balance:`190398.00`,resulting_balance:`190000.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T21:51:46.028Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"79ebc5b9-fd33-4c98-829e-24bdbeae1a64":{amount:`100000.00`,created_at:`2026-09-02T21:50:08.187Z`,id:`79ebc5b9-fd33-4c98-829e-24bdbeae1a64`,motive:`DEPOSITO`,previous_balance:`64117.00`,resulting_balance:`164117.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T21:50:08.187Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"7f02361f-a721-4ceb-9533-877f92445c8d":{amount:`130000.00`,created_at:`2026-09-09T23:05:31.255Z`,id:`7f02361f-a721-4ceb-9533-877f92445c8d`,motive:`5 uzi e 5 mp5`,previous_balance:`364423.00`,resulting_balance:`234423.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-09T23:05:31.255Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"812a4ca8-6571-4753-ab45-525baf179306":{amount:`65000.00`,created_at:`2026-09-04T14:46:47.653Z`,id:`812a4ca8-6571-4753-ab45-525baf179306`,motive:`lavagem porcentagem ação`,previous_balance:`201000.00`,resulting_balance:`266000.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-04T14:46:47.653Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"813febd5-ed1a-464e-a327-8b59abad698c":{amount:`219.00`,created_at:`2026-09-02T20:58:32.220Z`,id:`813febd5-ed1a-464e-a327-8b59abad698c`,motive:`concertando valor`,previous_balance:`98898.00`,resulting_balance:`99117.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T20:58:32.220Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"8352c98c-8e68-41c3-ba2d-e4bdf9ade292":{amount:`12957.00`,created_at:`2026-08-21T14:11:31.005Z`,id:`8352c98c-8e68-41c3-ba2d-e4bdf9ade292`,motive:`venda de drogas`,previous_balance:`197000.00`,resulting_balance:`209957.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-21T14:11:31.005Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"83b7b8f4-5807-45e8-b2f4-8eadc3b3ed41":{amount:`2.00`,created_at:`2026-09-08T20:13:46.326Z`,id:`83b7b8f4-5807-45e8-b2f4-8eadc3b3ed41`,motive:`acerto`,previous_balance:`352531.00`,resulting_balance:`352533.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-08T20:13:46.326Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"99caeabf-1a92-429e-b676-c34eb9c2312d":{amount:`45500.00`,created_at:`2026-09-02T23:35:22.232Z`,id:`99caeabf-1a92-429e-b676-c34eb9c2312d`,motive:`compra de maconha`,previous_balance:`170500.00`,resulting_balance:`125000.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T23:35:22.232Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"9a871d06-3fd2-43db-97e0-06607b272c11":{amount:`40000.00`,created_at:`2026-08-22T16:23:00.355Z`,id:`9a871d06-3fd2-43db-97e0-06607b272c11`,motive:`DROGAS`,previous_balance:`273398.00`,resulting_balance:`233398.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-22T16:23:00.355Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"9b86e4df-4709-4408-b39f-3d1a3da86122":{amount:`100000.00`,created_at:`2026-09-06T18:59:48.542Z`,id:`9b86e4df-4709-4408-b39f-3d1a3da86122`,motive:`drogas joao`,previous_balance:`126791.00`,resulting_balance:`226791.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-06T18:59:48.542Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"9ce5606f-ad95-4c3d-969b-c12a5977e98b":{amount:`19000.00`,created_at:`2026-08-23T02:48:24.368Z`,id:`9ce5606f-ad95-4c3d-969b-c12a5977e98b`,motive:`Munição sub`,previous_balance:`233398.00`,resulting_balance:`214398.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-23T02:48:24.368Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"a0d75689-4e33-4155-8ae2-d9c1fa812612":{amount:`26000.00`,created_at:`2026-09-08T20:13:06.706Z`,id:`a0d75689-4e33-4155-8ae2-d9c1fa812612`,motive:`arma toretto`,previous_balance:`379532.00`,resulting_balance:`353532.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-08T20:13:06.706Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"a467b986-6a65-4c12-93a0-a56263431936":{amount:`100000.00`,created_at:`2026-09-04T02:55:16.344Z`,id:`a467b986-6a65-4c12-93a0-a56263431936`,motive:`lavagem porcentagem ação`,previous_balance:`1000.00`,resulting_balance:`101000.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-04T02:55:16.344Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"a77172a8-8a7e-4965-989d-98d5d4d94871":{amount:`10000.00`,created_at:`2026-09-08T20:43:52.064Z`,id:`a77172a8-8a7e-4965-989d-98d5d4d94871`,motive:`chave`,previous_balance:`262533.00`,resulting_balance:`252533.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-08T20:43:52.064Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"a8e81f52-f428-442c-9f3e-25edd4a8f88c":{amount:`35000.00`,created_at:`2026-09-09T22:08:41.241Z`,id:`a8e81f52-f428-442c-9f3e-25edd4a8f88c`,motive:`concertar o valor`,previous_balance:`252533.00`,resulting_balance:`287533.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-09T22:08:41.241Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ab0a53c3-5476-40db-b267-b424f707e069":{amount:`38500.00`,created_at:`2026-08-22T03:28:55.128Z`,id:`ab0a53c3-5476-40db-b267-b424f707e069`,motive:`drogas`,previous_balance:`112191.00`,resulting_balance:`150691.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T03:28:55.128Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ab5f4cfb-c04e-4633-9562-02b5ff03cc8e":{amount:`219.00`,created_at:`2026-09-02T21:51:30.835Z`,id:`ab5f4cfb-c04e-4633-9562-02b5ff03cc8e`,motive:`deluca`,previous_balance:`190617.00`,resulting_balance:`190398.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T21:51:30.835Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"afcf1a33-414c-4bb3-8c62-85e27242406d":{amount:`45500.00`,created_at:`2026-09-03T02:07:29.208Z`,id:`afcf1a33-414c-4bb3-8c62-85e27242406d`,motive:`meta`,previous_balance:`115500.00`,resulting_balance:`70000.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-03T02:07:29.208Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"b0c71c7a-1f94-4366-9644-4de0e4c82276":{amount:`36540.00`,created_at:`2026-09-11T14:57:28.119Z`,id:`b0c71c7a-1f94-4366-9644-4de0e4c82276`,motive:`sla`,previous_balance:`269423.00`,resulting_balance:`305963.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-11T14:57:28.119Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"b3c837ae-f40d-4b2f-a264-a0c98d7d1328":{amount:`18676.00`,created_at:`2026-08-22T13:10:55.215Z`,id:`b3c837ae-f40d-4b2f-a264-a0c98d7d1328`,motive:`droga`,previous_balance:`232659.00`,resulting_balance:`251335.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T13:10:55.215Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"b66d7499-adf6-4ef3-8cde-710eea0b4385":{amount:`25000`,created_at:`2026-09-15T21:58:00.604Z`,id:`b66d7499-adf6-4ef3-8cde-710eea0b4385`,motive:`corrigindo valor`,previous_balance:`225503.00`,resulting_balance:`200503.00`,status:`estornado`,type:`saida`,updated_at:`2026-09-15T21:58:14.317Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"b6c4f9e4-988a-46b8-8e52-d7944717c4cb":{amount:`50000.00`,created_at:`2026-09-11T14:56:04.859Z`,id:`b6c4f9e4-988a-46b8-8e52-d7944717c4cb`,motive:`lavagem porcentagem ação`,previous_balance:`219423.00`,resulting_balance:`269423.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-11T14:56:04.859Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"b747b963-f701-4f65-b9c5-03bd6a23501c":{amount:`78000.00`,created_at:`2026-09-02T21:49:33.538Z`,id:`b747b963-f701-4f65-b9c5-03bd6a23501c`,motive:`ARMA`,previous_balance:`199117.00`,resulting_balance:`121117.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T21:49:33.538Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"b950b4f0-43af-465e-868f-78e24fbbc1f7":{amount:`50000.00`,created_at:`2026-08-22T15:59:17.383Z`,id:`b950b4f0-43af-465e-868f-78e24fbbc1f7`,motive:`ação`,previous_balance:`288398.00`,resulting_balance:`338398.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T15:59:17.383Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"c7571314-bb01-466b-97ca-48f5b1ab57a8":{amount:`9500.00`,created_at:`2026-09-03T01:44:43.415Z`,id:`c7571314-bb01-466b-97ca-48f5b1ab57a8`,motive:`muni sub`,previous_balance:`125000.00`,resulting_balance:`115500.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-03T01:44:43.415Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"c93fd85a-24ea-41dc-b198-a9ef551c32ad":{amount:`48620.00`,created_at:`2026-08-21T18:49:48.869Z`,id:`c93fd85a-24ea-41dc-b198-a9ef551c32ad`,motive:`drogas`,previous_balance:`169821.00`,resulting_balance:`218441.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-21T18:49:48.869Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"caefefa1-378b-4bd2-86bf-6e7386117083":{amount:`22244.00`,created_at:`2026-08-22T11:06:05.982Z`,id:`caefefa1-378b-4bd2-86bf-6e7386117083`,motive:`droga`,previous_balance:`173143.00`,resulting_balance:`195387.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T11:06:05.982Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"cbff6320-d345-4946-97be-8f0e2344961e":{amount:`22452.00`,created_at:`2026-08-22T04:22:02.451Z`,id:`cbff6320-d345-4946-97be-8f0e2344961e`,motive:`50% venda droga`,previous_balance:`150691.00`,resulting_balance:`173143.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T04:22:02.451Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"cc6af2c8-d935-43af-a991-8a30fd6daf03":{amount:`19500.00`,created_at:`2026-09-02T22:58:44.757Z`,id:`cc6af2c8-d935-43af-a991-8a30fd6daf03`,motive:`compra de 300 coca`,previous_balance:`190000.00`,resulting_balance:`170500.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-02T22:58:44.757Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ce8d9211-f1cb-4b9f-bb05-223969f9f895":{amount:`50000.00`,created_at:`2026-09-13T20:46:31.430Z`,id:`ce8d9211-f1cb-4b9f-bb05-223969f9f895`,motive:`cartão criptofrafado`,previous_balance:`125503.00`,resulting_balance:`75503.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-13T20:46:31.430Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"d207deb5-df05-420e-bea0-05ba64edfc07":{amount:`40000.00`,created_at:`2026-09-02T23:40:29.514Z`,id:`d207deb5-df05-420e-bea0-05ba64edfc07`,motive:`lavagem porcentagem ação`,previous_balance:`125000.00`,resulting_balance:`85000.00`,status:`estornado`,type:`saida`,updated_at:`2026-09-02T23:40:33.503Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"d3687392-e741-45bf-b402-876ed81c541a":{amount:`372.00`,created_at:`2026-08-28T17:27:38.641Z`,id:`d3687392-e741-45bf-b402-876ed81c541a`,motive:`nao sei quem foi`,previous_balance:`99063.00`,resulting_balance:`98691.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-28T17:27:38.641Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"dac5d9cb-cdbd-4a2f-8183-a4710e36d986":{amount:`44285.00`,created_at:`2026-09-04T01:06:54.619Z`,id:`dac5d9cb-cdbd-4a2f-8183-a4710e36d986`,motive:`lavagem familia`,previous_balance:`1000.00`,resulting_balance:`45285.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-04T01:06:54.619Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"dcb502dc-888c-4354-ac0f-1bcd9517a4e0":{amount:`25000.00`,created_at:`2026-09-02T21:50:40.435Z`,id:`dcb502dc-888c-4354-ac0f-1bcd9517a4e0`,motive:`drogas venda`,previous_balance:`98117.00`,resulting_balance:`123117.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T21:50:40.435Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ddf24c56-c957-4619-a78b-7270f9fd8a4b":{amount:`45500.00`,created_at:`2026-09-05T11:33:12.518Z`,id:`ddf24c56-c957-4619-a78b-7270f9fd8a4b`,motive:`droga que toretto nao nabe registrar nessa krl`,previous_balance:`266000.00`,resulting_balance:`220500.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-05T11:33:12.518Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"de8e362b-1309-482d-92bb-9994448a7bc0":{amount:`25000`,created_at:`2026-09-15T21:58:23.877Z`,id:`de8e362b-1309-482d-92bb-9994448a7bc0`,motive:`compra com a vortex`,previous_balance:`200503.00`,resulting_balance:`175503.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-15T21:58:23.877Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e1ad4d3e-ce39-4ead-9dff-03d1d5bb7769":{amount:`26291.00`,created_at:`2026-09-05T22:22:12.162Z`,id:`e1ad4d3e-ce39-4ead-9dff-03d1d5bb7769`,motive:`porcentagem droga`,previous_balance:`220500.00`,resulting_balance:`246791.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-05T22:22:12.162Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e403529a-3ad4-4749-b7db-078999b62a14":{amount:`98500.00`,created_at:`2026-08-21T01:11:59.291Z`,id:`e403529a-3ad4-4749-b7db-078999b62a14`,motive:`caixa atual`,previous_balance:`98500.00`,resulting_balance:`197000.00`,status:`estornado`,type:`entrada`,updated_at:`2026-08-21T01:12:11.298Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ebe4677b-bdd3-4af9-9fdd-8754c2d68364":{amount:`100000.00`,created_at:`2026-09-02T21:49:20.380Z`,id:`ebe4677b-bdd3-4af9-9fdd-8754c2d68364`,motive:`DEPOSITO`,previous_balance:`99117.00`,resulting_balance:`199117.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T21:49:20.380Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ed2730b9-f074-4ec5-b8a0-474ed23ccd7c":{amount:`72000.00`,created_at:`2026-08-21T14:58:14.333Z`,id:`ed2730b9-f074-4ec5-b8a0-474ed23ccd7c`,motive:`lock e c4`,previous_balance:`209957.00`,resulting_balance:`137957.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-21T14:58:14.333Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"efed9558-7eee-488f-9908-0598e67beca3":{amount:`31000.00`,created_at:`2026-08-28T17:26:50.020Z`,id:`efed9558-7eee-488f-9908-0598e67beca3`,motive:`drogas`,previous_balance:`162063.00`,resulting_balance:`193063.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-28T17:26:50.020Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f54057a2-4aec-479c-9194-5571f06b87a0":{amount:`44285.00`,created_at:`2026-09-04T01:25:31.492Z`,id:`f54057a2-4aec-479c-9194-5571f06b87a0`,motive:`confundi`,previous_balance:`45285.00`,resulting_balance:`1000.00`,status:`ativo`,type:`saida`,updated_at:`2026-09-04T01:25:31.492Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f6daf27d-3e04-4180-9002-5c069903bbc9":{amount:`1000.00`,created_at:`2026-09-03T20:24:03.175Z`,id:`f6daf27d-3e04-4180-9002-5c069903bbc9`,motive:`teste`,previous_balance:`1000.00`,resulting_balance:`2000.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-03T20:24:03.175Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f7d49095-1059-4b6c-a5be-6cc86d991cba":{amount:`100000.00`,created_at:`2026-09-02T21:51:07.763Z`,id:`f7d49095-1059-4b6c-a5be-6cc86d991cba`,motive:`deposito`,previous_balance:`90617.00`,resulting_balance:`190617.00`,status:`ativo`,type:`entrada`,updated_at:`2026-09-02T21:51:07.763Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fb90dd1e-317a-44e0-a054-857d69fefe4f":{amount:`39000.00`,created_at:`2026-08-23T03:16:28.772Z`,id:`fb90dd1e-317a-44e0-a054-857d69fefe4f`,motive:`la firma`,previous_balance:`214398.00`,resulting_balance:`175398.00`,status:`ativo`,type:`saida`,updated_at:`2026-08-23T03:16:28.772Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fe48b5b7-ac56-457e-ac47-f7b024d5ba54":{amount:`19031.00`,created_at:`2026-08-22T12:03:37.821Z`,id:`fe48b5b7-ac56-457e-ac47-f7b024d5ba54`,motive:`droga`,previous_balance:`195387.00`,resulting_balance:`214418.00`,status:`ativo`,type:`entrada`,updated_at:`2026-08-22T12:03:37.821Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`}},categories:{"4267449b-85b8-414a-8f09-19da6412b830":{ativo:!0,created_at:`2026-09-03T16:35:38.944Z`,descricao:`Tudo para carros e motos`,id:`4267449b-85b8-414a-8f09-19da6412b830`,nome:`Carros/Motos`,updated_at:`2026-09-03T16:35:38.944Z`},"60b9fb54-8cb0-4500-876f-35fe46fdb469":{ativo:!0,created_at:`2026-08-19T21:25:15.442Z`,id:`60b9fb54-8cb0-4500-876f-35fe46fdb469`,nome:`Drogas`,updated_at:`2026-09-14T22:37:00.584Z`},"61f7a5a4-810c-43a7-9564-035470046dc9":{ativo:!0,created_at:`2026-09-03T16:37:15.745Z`,id:`61f7a5a4-810c-43a7-9564-035470046dc9`,nome:`Outros`,updated_at:`2026-09-03T16:37:15.745Z`},"6d6ef224-4bc9-4714-a72a-d9925809b884":{ativo:!0,created_at:`2026-08-29T19:14:46.707Z`,id:`6d6ef224-4bc9-4714-a72a-d9925809b884`,nome:`Munições`,updated_at:`2026-08-29T19:14:46.707Z`},"7d21df15-d4d3-4834-924b-e303af2a2b68":{ativo:!0,created_at:`2026-08-20T12:10:04.247Z`,descricao:``,id:`7d21df15-d4d3-4834-924b-e303af2a2b68`,nome:`Dinheiro`,updated_at:`2026-08-20T23:13:59.125Z`},"8549d526-c881-4da7-8eaa-459a6d52fd60":{ativo:!0,created_at:`2026-08-19T21:25:07.294Z`,id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,nome:`Armas`,updated_at:`2026-09-14T22:36:52.413Z`},"90fe003d-a32e-4702-97b4-4c138ec90b21":{ativo:!0,created_at:`2026-09-19T01:08:13.812Z`,descricao:`Ammunition`,id:`90fe003d-a32e-4702-97b4-4c138ec90b21`,nome:`Ammunition`,updated_at:`2026-09-19T01:08:13.812Z`},"bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611":{ativo:!0,created_at:`2026-08-19T21:25:40.909Z`,id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,nome:`Consumíveis`,updated_at:`2026-08-19T21:25:40.909Z`},"f880b531-a65f-4193-ab96-1965fc84560a":{ativo:!0,created_at:`2026-09-19T00:56:23.483Z`,descricao:`Attachs`,id:`f880b531-a65f-4193-ab96-1965fc84560a`,nome:`Attachs`,updated_at:`2026-09-19T00:56:23.483Z`}},chat_conversations:{"021145cf-30ce-44a0-8aa0-baa3115e9ccc":{created_at:`2026-09-05T05:19:25.839Z`,created_by:`f970371a-246e-4109-8a08-d197a41f0906`,ephemeral_ttl_hours:0,id:`021145cf-30ce-44a0-8aa0-baa3115e9ccc`,is_archived:!1,last_message_at:`2026-09-05T05:19:25.839Z`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T05:19:25.839Z`},"1477bbb2-87e0-4ff3-8d97-2853c6f0e09b":{created_at:`2026-09-05T04:10:33.334Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,is_archived:!1,last_message:`ver agora`,last_message_at:`2026-09-13T04:29:02.867Z`,last_message_sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-13T04:29:02.867Z`},"15474c3a-9ec8-4b97-94c7-fac1cb065809":{created_at:`2026-08-30T14:42:17.245Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`15474c3a-9ec8-4b97-94c7-fac1cb065809`,is_archived:!1,last_message:`Ta ae?`,last_message_at:`2026-08-30T16:03:05.931Z`,last_message_sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,only_admins_can_post:!1,type:`private`,updated_at:`2026-08-30T16:03:05.931Z`},"187d260c-c793-475e-b894-73b233120084":{created_at:`2026-09-05T04:36:16.054Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`187d260c-c793-475e-b894-73b233120084`,is_archived:!1,last_message:`ai formatei novamente o pc botando o windows normal`,last_message_at:`2026-09-05T04:39:52.086Z`,last_message_sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T04:39:52.086Z`},"29a2305d-070f-4b53-b375-9d88cb408fe2":{created_at:`2026-08-29T21:53:11.130Z`,created_by:`e804c543-4e0a-4c45-9930-4450739d3b36`,ephemeral_ttl_hours:0,id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,is_archived:!1,last_message:`oi`,last_message_at:`2026-08-30T17:30:48.984Z`,last_message_sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,only_admins_can_post:!1,type:`private`,updated_at:`2026-08-30T17:30:48.984Z`},"29cdbce5-b3da-4c22-8672-7102dce8e2e0":{created_at:`2026-09-05T03:36:15.636Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`29cdbce5-b3da-4c22-8672-7102dce8e2e0`,is_archived:!1,last_message:`ee`,last_message_at:`2026-09-05T04:07:56.807Z`,last_message_sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,only_admins_can_post:!1,title:`malaca`,type:`group`,updated_at:`2026-09-05T04:07:56.807Z`},"3429c102-2507-4059-abc2-00e9c8c36450":{avatar_url:`https://adgdivossyzpwofouhrh.supabase.co/storage/v1/object/public/chat-attachments/uploads/1788567234217_hd8pa28.png`,created_at:`2026-09-05T00:13:28.153Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,description:`by malaca`,ephemeral_ttl_hours:0,id:`3429c102-2507-4059-abc2-00e9c8c36450`,is_archived:!1,last_message:`🚪 Dev saiu do grupo.`,last_message_at:`2026-09-05T04:42:50.451Z`,last_message_sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,only_admins_can_post:!1,title:`Patch Notes - Desenvolvedor`,type:`group`,updated_at:`2026-09-05T04:42:50.451Z`},"37b30922-5e38-4d31-a7cd-ab029fe88bc8":{created_at:`2026-09-05T04:30:11.634Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`37b30922-5e38-4d31-a7cd-ab029fe88bc8`,is_archived:!1,last_message:`?`,last_message_at:`2026-09-05T04:30:38.956Z`,last_message_sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T04:30:38.956Z`},"6081969d-c71b-4764-9dfb-7cbbc65f3c99":{created_at:`2026-08-29T03:03:48.842Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`6081969d-c71b-4764-9dfb-7cbbc65f3c99`,is_archived:!1,last_message:`oi`,last_message_at:`2026-09-02T21:48:04.019Z`,last_message_sender_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-02T21:48:04.019Z`},"6e7e063d-eedf-48d4-983b-19155d913418":{created_at:`2026-08-30T16:18:46.928Z`,created_by:`e804c543-4e0a-4c45-9930-4450739d3b36`,ephemeral_ttl_hours:0,id:`6e7e063d-eedf-48d4-983b-19155d913418`,is_archived:!1,last_message:`uuuuuuuu`,last_message_at:`2026-08-30T16:58:08.786Z`,last_message_sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,only_admins_can_post:!1,title:`teste`,type:`group`,updated_at:`2026-08-30T16:58:08.786Z`},"7703a674-a449-42fb-b5a1-4f17c3d98ee1":{created_at:`2026-09-12T00:59:39.942Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,is_archived:!1,last_message:`kkkk`,last_message_at:`2026-09-13T04:30:04.993Z`,last_message_sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-13T04:30:04.993Z`},"89eda40a-79e9-4517-8225-e13db0732c64":{created_at:`2026-08-30T01:14:33.045Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`89eda40a-79e9-4517-8225-e13db0732c64`,is_archived:!1,last_message:`ficou top`,last_message_at:`2026-09-05T00:39:24.357Z`,last_message_sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T00:39:24.357Z`},"8b306251-3b1d-4877-909e-9d6a230d4be7":{created_at:`2026-09-03T13:32:34.192Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`8b306251-3b1d-4877-909e-9d6a230d4be7`,is_archived:!1,last_message:`ta ae?`,last_message_at:`2026-09-03T13:32:38.626Z`,last_message_sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-03T13:32:38.626Z`},"9bee2fca-c44d-4d78-8068-93055dbfb6e3":{created_at:`2026-09-05T04:36:10.196Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`9bee2fca-c44d-4d78-8068-93055dbfb6e3`,is_archived:!1,last_message_at:`2026-09-05T04:36:10.196Z`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T04:36:10.196Z`},"b1a500fe-0948-4742-bb80-abd52c9c0a4f":{created_at:`2026-08-29T18:03:34.948Z`,created_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,ephemeral_ttl_hours:0,id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,is_archived:!1,last_message:`rapaz ta ficando moderno isso aqui em`,last_message_at:`2026-09-05T04:10:26.638Z`,last_message_sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T04:10:26.638Z`},"d1662444-0465-44ca-9cc4-0b4d6e4e94de":{created_at:`2026-08-29T05:22:58.477Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,is_archived:!1,last_message:`aa`,last_message_at:`2026-09-06T00:13:54.550Z`,last_message_sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T04:35:01.545Z`},"db5ff371-5cc0-4492-8997-673b05460c1b":{created_at:`2026-09-05T17:34:56.299Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`db5ff371-5cc0-4492-8997-673b05460c1b`,is_archived:!1,last_message:`ta ae?`,last_message_at:`2026-09-05T17:35:01.880Z`,last_message_sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-05T17:34:56.299Z`},"efbbf233-fa06-4244-84c3-e47f4c7aef86":{created_at:`2026-09-11T22:45:07.882Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,ephemeral_ttl_hours:0,id:`efbbf233-fa06-4244-84c3-e47f4c7aef86`,is_archived:!1,last_message:`ta ae`,last_message_at:`2026-09-11T22:45:31.156Z`,last_message_sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,only_admins_can_post:!1,type:`private`,updated_at:`2026-09-11T22:45:07.882Z`}},chat_message_reactions:{"6427c3b5-66d0-40d4-9ce4-d296d38c3209":{created_at:`2026-09-04T14:48:38.865Z`,emoji:`❤️`,id:`6427c3b5-66d0-40d4-9ce4-d296d38c3209`,message_id:`df6410c1-c21b-49b3-8f65-c47e502c334e`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"66b69a20-a536-4220-98d2-77dc864b97e8":{created_at:`2026-09-04T14:48:37.808Z`,emoji:`❤️`,id:`66b69a20-a536-4220-98d2-77dc864b97e8`,message_id:`f5882eb0-80bd-47a8-913e-344455a56ebf`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"d6e04df9-f8b9-43dd-a7df-b9f36ce72725":{created_at:`2026-09-05T03:53:29.908Z`,emoji:`😂`,id:`d6e04df9-f8b9-43dd-a7df-b9f36ce72725`,message_id:`ee0b8946-f4e8-4737-ae43-6e94d109a745`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`}},chat_messages:{"011959a4-6d4a-44c6-9985-1f8a5768c20c":{content:`vlw mesmo`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:13:47.644Z`,id:`011959a4-6d4a-44c6-9985-1f8a5768c20c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:13:47.644Z`},"021b72b3-03fe-4842-ae88-b215ae63f221":{content:`?`,conversation_id:`37b30922-5e38-4d31-a7cd-ab029fe88bc8`,created_at:`2026-09-05T04:30:38.956Z`,id:`021b72b3-03fe-4842-ae88-b215ae63f221`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:30:38.956Z`},"03530ee0-868b-4458-a876-e1188c0f3a63":{content:`eai`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-04T23:26:58.827Z`,id:`03530ee0-868b-4458-a876-e1188c0f3a63`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-04T23:26:58.827Z`},"04e79375-e8cb-401a-b711-4663d7b7e27e":{content:`eeeeee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:00:08.209Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`04e79375-e8cb-401a-b711-4663d7b7e27e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:00:08.209Z`},"074f7b33-6a64-4770-8d88-31fd506708e2":{content:`ele não para de mandar mensagem pra mim`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T02:48:04.446Z`,id:`074f7b33-6a64-4770-8d88-31fd506708e2`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T02:48:04.446Z`},"0940c9ad-948c-408b-81a5-c30917e79c91":{content:`ee`,conversation_id:`29cdbce5-b3da-4c22-8672-7102dce8e2e0`,created_at:`2026-09-05T04:07:56.807Z`,id:`0940c9ad-948c-408b-81a5-c30917e79c91`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:07:56.807Z`},"1151e2c9-d767-4b66-8cae-f1ff331f2b2c":{content:`nem tinha visto esse chat`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-03T23:35:00.783Z`,id:`1151e2c9-d767-4b66-8cae-f1ff331f2b2c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T23:35:00.783Z`},"1168563e-3bc3-4a55-a3db-ae7a953b34e0":{content:`fala`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-29T22:18:00.009Z`,id:`1168563e-3bc3-4a55-a3db-ae7a953b34e0`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T22:18:00.009Z`},"117d1f7e-b238-491b-afed-7ebef7a85d9d":{content:`pera, deixa eu corrigir a notificação`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:31:53.577Z`,id:`117d1f7e-b238-491b-afed-7ebef7a85d9d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:31:53.577Z`},"11ecefab-f277-45f2-82a8-afdf69f5bccc":{content:`gostou da pagina de meta?`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-04T23:27:03.130Z`,id:`11ecefab-f277-45f2-82a8-afdf69f5bccc`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-04T23:27:03.130Z`},"125165ec-b30a-4a58-84ec-815b175c6cf9":{content:`@malaca`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T02:01:05.565Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`125165ec-b30a-4a58-84ec-815b175c6cf9`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T02:01:05.565Z`},"145e0237-226d-4a17-abf8-b3fb0ba73411":{content:`fiz`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:55:00.361Z`,id:`145e0237-226d-4a17-abf8-b3fb0ba73411`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:55:00.361Z`},"1478ab39-29a7-4b0d-bcc7-663132f7805c":{content:`fala nesse aqui kk`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:10:38.730Z`,id:`1478ab39-29a7-4b0d-bcc7-663132f7805c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:38.730Z`},"14b70335-bd6f-4b10-9f8c-998d94b20116":{content:`ta ae?`,conversation_id:`db5ff371-5cc0-4492-8997-673b05460c1b`,created_at:`2026-09-05T17:35:01.880Z`,id:`14b70335-bd6f-4b10-9f8c-998d94b20116`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T17:35:01.880Z`},"158b0cfd-9437-4e04-9a1f-f42ef6dc0439":{content:`a`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:19:30.126Z`,id:`158b0cfd-9437-4e04-9a1f-f42ef6dc0439`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:19:30.126Z`},"15a1caeb-b056-4312-ad8f-3548994402a7":{content:`aaaaee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:59:21.684Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`15a1caeb-b056-4312-ad8f-3548994402a7`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:59:21.684Z`},"181f09fd-d32e-47ed-8d9a-d9a437aa5754":{content:`aa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T05:48:54.110Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`181f09fd-d32e-47ed-8d9a-d9a437aa5754`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T05:48:54.110Z`},"1a51eeca-10d1-4361-b911-a2feb5363a3a":{content:`Oi`,conversation_id:`15474c3a-9ec8-4b97-94c7-fac1cb065809`,created_at:`2026-08-30T14:42:21.283Z`,id:`1a51eeca-10d1-4361-b911-a2feb5363a3a`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-30T14:42:21.283Z`},"1e0dc4a6-92f8-49a9-aaaf-a39511f3612d":{content:`não foi pra você, acho que ta bugado, deixa eu ver`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:28:36.687Z`,id:`1e0dc4a6-92f8-49a9-aaaf-a39511f3612d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:28:36.687Z`},"1ebb4662-80a7-4d61-a697-40e9f4e30b65":{content:`ee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:09:53.906Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`1ebb4662-80a7-4d61-a697-40e9f4e30b65`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:09:53.906Z`},"20179a04-b92e-4948-94d8-0bfd8a90358f":{content:`olha ele ai`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T01:03:06.657Z`,id:`20179a04-b92e-4948-94d8-0bfd8a90358f`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T01:03:06.657Z`},"20815879-fb6a-4b4f-bcfd-0ddb234f9781":{content:`ficou top`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-05T00:39:24.357Z`,id:`20815879-fb6a-4b4f-bcfd-0ddb234f9781`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:39:24.357Z`},"2300cf9a-9b95-4ae0-a831-820c051b8682":{content:`iji`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-03T23:29:26.897Z`,id:`2300cf9a-9b95-4ae0-a831-820c051b8682`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T23:29:26.897Z`},"23d1c0b2-e547-41d1-8c2e-d27c4527930a":{content:`Ta ae?`,conversation_id:`15474c3a-9ec8-4b97-94c7-fac1cb065809`,created_at:`2026-08-30T16:03:05.931Z`,id:`23d1c0b2-e547-41d1-8c2e-d27c4527930a`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-30T16:03:05.931Z`},"258db096-33e0-42e2-b8b8-bcd052c9b1b2":{content:`ta  aprontando por ai`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T01:03:48.265Z`,id:`258db096-33e0-42e2-b8b8-bcd052c9b1b2`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T01:03:48.265Z`},"262723bd-24bf-4d52-8f88-739e697fe100":{content:`🔓 Malaca liberou o envio de mensagens para todos os participantes.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:23:09.241Z`,id:`262723bd-24bf-4d52-8f88-739e697fe100`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:23:09.241Z`},"2af70764-1f90-4aa4-8827-0e878b1036d4":{content:`mano não ta dando`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:30:53.191Z`,id:`2af70764-1f90-4aa4-8827-0e878b1036d4`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:30:53.191Z`},"2b25d051-8c38-4852-87fa-9d78b59b8d9e":{content:`oi`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T05:37:39.363Z`,id:`2b25d051-8c38-4852-87fa-9d78b59b8d9e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T05:37:39.363Z`},"2b5d3dc7-d1eb-48ac-9893-c23bdfbf1554":{content:`não`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-13T04:29:43.182Z`,id:`2b5d3dc7-d1eb-48ac-9893-c23bdfbf1554`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T04:29:43.182Z`},"2b7b7bf8-ce3a-49fc-a6b1-83305c1fa634":{content:`a mensagem apaga`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:55:24.585Z`,id:`2b7b7bf8-ce3a-49fc-a6b1-83305c1fa634`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:55:24.585Z`},"2ca5ab5b-c1c9-4dff-8cce-68631aa9893c":{content:`ta ae?`,conversation_id:`15474c3a-9ec8-4b97-94c7-fac1cb065809`,created_at:`2026-08-30T14:42:22.333Z`,id:`2ca5ab5b-c1c9-4dff-8cce-68631aa9893c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-30T14:42:22.333Z`},"2cc9f23b-d5fd-4abe-8496-89354fad483d":{content:`🖼️ Malaca alterou a foto do grupo.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:13:56.686Z`,id:`2cc9f23b-d5fd-4abe-8496-89354fad483d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:13:56.686Z`},"2e257778-2885-488c-87ea-413a4a2e78f2":{content:`aaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:58:55.872Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`2e257778-2885-488c-87ea-413a4a2e78f2`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:58:55.872Z`},"30bcb222-51a7-49e8-b32d-723f75bb20b6":{content:`mensagem não ta ficando`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-06T00:07:25.961Z`,id:`30bcb222-51a7-49e8-b32d-723f75bb20b6`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-06T00:07:25.961Z`},"30f097be-96a7-4aca-a801-c33b9e3a06a7":{content:`tava em partida`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:55:05.261Z`,id:`30f097be-96a7-4aca-a801-c33b9e3a06a7`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:55:05.261Z`},"32b8c963-fdc3-4db3-9c02-7e5f694dacbb":{content:`adorei`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-09-05T04:10:16.405Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`32b8c963-fdc3-4db3-9c02-7e5f694dacbb`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:16.405Z`},"33aa6ac3-fd68-4e11-ab43-0c31601e54e4":{content:`tão usando sistema de chat?`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-03T23:29:41.744Z`,id:`33aa6ac3-fd68-4e11-ab43-0c31601e54e4`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T23:29:41.744Z`},"353b81e2-e6ad-49fd-a3d5-b4bd1a933496":{content:`Oi`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:53:19.901Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`353b81e2-e6ad-49fd-a3d5-b4bd1a933496`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:53:19.901Z`},"35722d6c-fdb6-40ac-9e5d-c1915c0b79f0":{content:`ss`,conversation_id:`187d260c-c793-475e-b894-73b233120084`,created_at:`2026-09-05T04:36:29.610Z`,id:`35722d6c-fdb6-40ac-9e5d-c1915c0b79f0`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:36:29.610Z`},"36a99027-4666-45a5-b40a-c792329a19b3":{content:`iiiiiiiiiiiiiiiiiiiiiii`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:56:28.477Z`,forwarded_from_name:`DevT`,id:`36a99027-4666-45a5-b40a-c792329a19b3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!0,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:56:28.477Z`},"38b8d784-5d35-4754-b64b-ec43a25537e3":{content:`oi`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:18:52.636Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`38b8d784-5d35-4754-b64b-ec43a25537e3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:18:52.636Z`},"39016647-d58b-4955-b34a-bfd5ac6fef81":{content:`real mesmo`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-03T23:35:03.759Z`,id:`39016647-d58b-4955-b34a-bfd5ac6fef81`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T23:35:03.759Z`},"39e29a60-6a21-451c-a8ae-c5db35baf4de":{content:`aaa`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-29T22:26:43.982Z`,id:`39e29a60-6a21-451c-a8ae-c5db35baf4de`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T22:26:43.982Z`},"3bc19e25-07f3-4e8f-929d-d43cfdf7b172":{content:`🔒 Malaca definiu que somente administradores podem enviar mensagens neste grupo.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:19:45.244Z`,id:`3bc19e25-07f3-4e8f-929d-d43cfdf7b172`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:19:45.244Z`},"42097697-73d6-4407-8b0a-55dabc30cf5c":{content:`Oi`,conversation_id:`efbbf233-fa06-4244-84c3-e47f4c7aef86`,created_at:`2026-09-11T22:45:15.089Z`,id:`42097697-73d6-4407-8b0a-55dabc30cf5c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`delivered`,thread_reply_count:0,updated_at:`2026-09-11T22:45:15.089Z`},"423a77fc-7242-48f7-b675-0673046672b4":{content:`ee`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-29T22:26:58.157Z`,id:`423a77fc-7242-48f7-b675-0673046672b4`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-29T22:26:58.157Z`},"427e43ab-64fd-478f-96b3-ad861f16f012":{content:`🔒 Malaca definiu que somente administradores podem enviar mensagens neste grupo.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:23:18.049Z`,id:`427e43ab-64fd-478f-96b3-ad861f16f012`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:23:18.049Z`},"428298a8-398f-43a9-9080-fb4edcb0d96d":{content:`nem a sua fica`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:56:18.000Z`,id:`428298a8-398f-43a9-9080-fb4edcb0d96d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:56:18.000Z`},"432a07d8-ad4a-40b7-a21e-cd3c4b0af542":{content:`🚫 Mensagem apagada`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:19:42.012Z`,id:`432a07d8-ad4a-40b7-a21e-cd3c4b0af542`,is_deleted_for_everyone:!0,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:28:36.948Z`},"45a537f8-4144-4b6f-9384-85ae27a12357":{content:`ue`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:55:17.785Z`,id:`45a537f8-4144-4b6f-9384-85ae27a12357`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:55:17.785Z`},"473cc2d5-5046-4ecf-910a-9693e574124c":{content:`aaaaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:23:41.568Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`473cc2d5-5046-4ecf-910a-9693e574124c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:23:41.568Z`},"48d09656-c8f2-46f3-b1c7-eedeed67a83b":{content:`mensagem ta sumindo`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T23:15:09.277Z`,id:`48d09656-c8f2-46f3-b1c7-eedeed67a83b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T23:15:09.277Z`},"48e72669-d193-4533-bdc8-a9dfe4a9d803":{content:`aaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:10:00.028Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`48e72669-d193-4533-bdc8-a9dfe4a9d803`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:00.028Z`},"4a0389e7-ec65-4873-a357-5385f07ecabc":{content:`ta certo`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T02:48:39.175Z`,id:`4a0389e7-ec65-4873-a357-5385f07ecabc`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T02:48:39.175Z`},"4ada67f4-d254-4006-9044-e41db0657038":{content:`oi`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-06T00:07:17.322Z`,id:`4ada67f4-d254-4006-9044-e41db0657038`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-06T00:07:17.322Z`},"4af9cb7c-199c-4958-a3cf-2c006aef5d62":{content:`ta ae?`,conversation_id:`8b306251-3b1d-4877-909e-9d6a230d4be7`,created_at:`2026-09-03T13:32:38.626Z`,id:`4af9cb7c-199c-4958-a3cf-2c006aef5d62`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T13:32:38.626Z`},"4afa6e53-bc88-47f2-aa27-3d327504aec8":{content:`🎉 Grupo "Patch Notes - Desenvolvedor" criado.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:13:28.892Z`,id:`4afa6e53-bc88-47f2-aa27-3d327504aec8`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:13:28.892Z`},"4d1922b2-76fc-49d7-8a0f-a806fff8c375":{content:`iiiiiiiiiiiiiiiiiiiiiii`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:56:15.387Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`4d1922b2-76fc-49d7-8a0f-a806fff8c375`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:56:15.387Z`},"4db2b124-3dfa-4bae-a781-c9d0d9ae8999":{content:`@Malaca`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:34:37.596Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`4db2b124-3dfa-4bae-a781-c9d0d9ae8999`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,mentions:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:34:37.596Z`},"4de4517a-7a53-42ed-9e49-daf8d98eeb46":{content:`aaaaaaaaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:59:12.979Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`4de4517a-7a53-42ed-9e49-daf8d98eeb46`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:59:12.979Z`},"4e28f71b-367e-4af4-9fd3-d4f5e0b3cf83":{content:"da então só `Ctrl + R`",conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:31:24.732Z`,id:`4e28f71b-367e-4af4-9fd3-d4f5e0b3cf83`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:31:24.732Z`},"4e2af2d8-8d17-47a4-9316-68e784969566":{content:`🚀 *PATCH NOTE — SISTEMA DE METAS*

- Implementada a nova *Página de Metas & Contribuições Semanais*.
- Controle de metas e arrecadações
- Acompanhamento dos membros
- Envio e validação de comprovantes
- Progresso e indicadores semanais
- Gestão de metas cadastradas`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T00:19:31.295Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`4e2af2d8-8d17-47a4-9316-68e784969566`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:19:31.295Z`},"52b25b2c-f3ef-4dc7-b0d8-813890fb60fa":{content:`aaaaaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:10:16.620Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`52b25b2c-f3ef-4dc7-b0d8-813890fb60fa`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:16.620Z`},"53368fc9-d7f0-4f08-bb05-710d9575c1f0":{content:`Oii`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T16:39:04.738Z`,id:`53368fc9-d7f0-4f08-bb05-710d9575c1f0`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T16:39:04.738Z`},"53f7ab3d-b4f0-43fd-8aae-dddcad246475":{content:`ta de folga`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-13T04:29:59.311Z`,id:`53f7ab3d-b4f0-43fd-8aae-dddcad246475`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T04:29:59.311Z`},"54cabdc2-6294-4b68-83eb-e4420acdf84a":{content:`uuuuuuuu`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:58:08.786Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`54cabdc2-6294-4b68-83eb-e4420acdf84a`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:58:08.786Z`},"55189d5f-cd8d-4c84-86a8-43b25c5ceadf":{content:`que vou ficar doida`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:10:47.772Z`,id:`55189d5f-cd8d-4c84-86a8-43b25c5ceadf`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:47.772Z`},"566799ee-efd4-4ec7-83f8-99ea72e63379":{content:`aaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:23:49.741Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`566799ee-efd4-4ec7-83f8-99ea72e63379`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:23:49.741Z`},"56d7a9a3-c356-47f2-8b11-c28fb4c34623":{content:`oxe`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:56:07.137Z`,id:`56d7a9a3-c356-47f2-8b11-c28fb4c34623`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:56:07.137Z`},"5739ac19-46c0-4a80-8b71-c41d86d1df42":{content:`ver agora`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T04:29:02.867Z`,id:`5739ac19-46c0-4a80-8b71-c41d86d1df42`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`sent`,thread_reply_count:0,updated_at:`2026-09-13T04:29:02.867Z`},"57e56ff3-3987-4dbd-bf98-1b4580dde08b":{content:`aaaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:34:16.583Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`57e56ff3-3987-4dbd-bf98-1b4580dde08b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:34:16.583Z`},"5a039ebc-c587-4414-889c-a3772c4da409":{content:`ta ae?`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-12T00:53:36.314Z`,id:`5a039ebc-c587-4414-889c-a3772c4da409`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-12T00:53:36.314Z`},"5b020a94-b187-4aa5-90c2-80d0ceb10be9":{content:`Tititi`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-09-04T03:09:19.454Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`5b020a94-b187-4aa5-90c2-80d0ceb10be9`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-04T03:09:19.454Z`},"5ce1cd18-5d2f-459e-8847-4e276e8b5306":{content:`Oi`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-08-29T05:23:04.233Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`5ce1cd18-5d2f-459e-8847-4e276e8b5306`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T05:23:04.233Z`},"5dd50712-38c8-41ff-b133-f6adfa228fe5":{content:`aaaaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:24:29.200Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`5dd50712-38c8-41ff-b133-f6adfa228fe5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:24:29.200Z`},"5eddca5e-d84e-4d09-89c3-f3d748b46ad3":{content:`ver se normalizou agora`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T05:37:55.490Z`,id:`5eddca5e-d84e-4d09-89c3-f3d748b46ad3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,reply_to_id:`656c782a-1633-49c1-8202-00d3fb01aa88`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T05:37:55.490Z`},"5f2feaba-61f1-485c-9e37-cfe5bf83dc96":{content:`🎉 Grupo "malaca" criado.`,conversation_id:`29cdbce5-b3da-4c22-8672-7102dce8e2e0`,created_at:`2026-09-05T03:36:16.264Z`,id:`5f2feaba-61f1-485c-9e37-cfe5bf83dc96`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:36:16.264Z`},"5f5023e8-8a09-4d35-8c93-96ea904282db":{content:`kkkk`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:11:14.875Z`,id:`5f5023e8-8a09-4d35-8c93-96ea904282db`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:11:14.875Z`},"6003b771-6008-4243-9863-a80e1478cd40":{content:`ue`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:55:59.845Z`,id:`6003b771-6008-4243-9863-a80e1478cd40`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:55:59.845Z`},"60769f21-7f0e-411b-9356-744f60b594b8":{content:`a`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:19:20.222Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`60769f21-7f0e-411b-9356-744f60b594b8`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:19:20.222Z`},"60aad8be-c1a8-4cc8-8b0c-b57bbf34f83e":{content:`spu formada mais estou inferrujada`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:14:09.240Z`,id:`60aad8be-c1a8-4cc8-8b0c-b57bbf34f83e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:14:09.240Z`},"61015937-6c72-4385-bc29-c67d726ae268":{content:`Oi`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:47:19.923Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`61015937-6c72-4385-bc29-c67d726ae268`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:47:19.923Z`},"64882c04-f3c2-44b3-a6ea-e2a7ad9c2387":{content:`to testando o chat`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-08-31T16:57:46.502Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`64882c04-f3c2-44b3-a6ea-e2a7ad9c2387`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-31T16:57:46.502Z`},"656c782a-1633-49c1-8202-00d3fb01aa88":{content:`Agora to pelo celular`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T05:01:44.622Z`,id:`656c782a-1633-49c1-8202-00d3fb01aa88`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T05:01:44.622Z`},"6613a204-dee7-4ff8-9487-124f22bcddb9":{content:`as notificações ta aparecendo pra todo mundo, vou corrigir`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:31:13.796Z`,id:`6613a204-dee7-4ff8-9487-124f22bcddb9`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:31:13.796Z`},"67df13da-656f-4beb-b203-4529ad694a94":{content:`eu vi`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T02:47:56.270Z`,id:`67df13da-656f-4beb-b203-4529ad694a94`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T02:47:56.270Z`},"685d2668-4208-42f1-b907-3b50bbd7eb10":{content:`to corrigindo agora`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T02:48:26.832Z`,id:`685d2668-4208-42f1-b907-3b50bbd7eb10`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T02:48:26.832Z`},"6988ff3b-2e64-40f1-80b2-54a1bf4439a9":{content:`oi`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-12T02:18:22.993Z`,id:`6988ff3b-2e64-40f1-80b2-54a1bf4439a9`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-12T02:18:22.993Z`},"6a977169-6a4c-4e1a-8a6b-d3d3a13025b9":{content:`aa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-06T00:13:54.550Z`,id:`6a977169-6a4c-4e1a-8a6b-d3d3a13025b9`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-06T00:13:54.550Z`},"6e059714-17c3-4ac7-8d6e-d2f8396dfab5":{content:`ee`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:20:11.950Z`,id:`6e059714-17c3-4ac7-8d6e-d2f8396dfab5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:20:11.950Z`},"6eae0024-5301-4b0a-a504-73e3f759d0a3":{content:`ajustando umas coisas aqui no sistema e ao mesmo tempo programando um bot`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T01:18:50.578Z`,id:`6eae0024-5301-4b0a-a504-73e3f759d0a3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T01:18:50.578Z`},"72226190-4880-4871-82d2-60fff80d2d20":{content:`voltou`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-06T00:07:44.889Z`,id:`72226190-4880-4871-82d2-60fff80d2d20`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-06T00:07:44.889Z`},"73d660b1-c04e-451d-8921-eb20e91907bc":{content:`eeeeee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:00:27.385Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`73d660b1-c04e-451d-8921-eb20e91907bc`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:00:27.385Z`},"762c0d03-317d-42f9-9361-d8dbf6f7d624":{content:`ue vc ta falando mais não chega`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:24:50.518Z`,id:`762c0d03-317d-42f9-9361-d8dbf6f7d624`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:24:50.518Z`},"769db1ba-c908-4647-aab0-6f22dd8bfe58":{content:`rapaz ta ficando moderno isso aqui em`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-09-05T04:10:26.638Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`769db1ba-c908-4647-aab0-6f22dd8bfe58`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:26.638Z`},"790742fc-10c1-4d5f-a7e3-343328770ad9":{content:`oi`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:46:13.297Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`790742fc-10c1-4d5f-a7e3-343328770ad9`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:46:13.297Z`},"79fa6c65-0f3d-4225-a3e2-a6222204b487":{content:`Ta ae?`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-08-29T05:30:25.263Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`79fa6c65-0f3d-4225-a3e2-a6222204b487`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T05:30:25.263Z`},"7a286d66-a0b8-4c6f-9e81-ac5abcf384dd":{content:`ta ae?`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:47:30.013Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`7a286d66-a0b8-4c6f-9e81-ac5abcf384dd`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:47:30.013Z`},"7c2d0ce3-edef-4746-837b-1975c3c5ad3f":{content:`Opaaa`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T01:03:31.583Z`,id:`7c2d0ce3-edef-4746-837b-1975c3c5ad3f`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T01:03:31.583Z`},"7cd79e2a-299c-4329-9839-08ca5f0778c0":{content:`ta ae?`,conversation_id:`37b30922-5e38-4d31-a7cd-ab029fe88bc8`,created_at:`2026-09-05T04:30:16.866Z`,id:`7cd79e2a-299c-4329-9839-08ca5f0778c0`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:30:16.866Z`},"81eea7b9-c9a9-4bba-ba9b-64ee15b847c6":{content:`não chega aonde ?`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:25:21.422Z`,id:`81eea7b9-c9a9-4bba-ba9b-64ee15b847c6`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:25:21.422Z`},"8301e7b9-cd9c-4d60-9233-47fa4c2c05ae":{content:`oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:46:29.989Z`,id:`8301e7b9-cd9c-4d60-9233-47fa4c2c05ae`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:46:29.989Z`},"83df96ef-2da5-4881-88a0-1fec8fd3f7f5":{content:`eee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:35:01.545Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`83df96ef-2da5-4881-88a0-1fec8fd3f7f5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:35:01.545Z`},"84439161-c8f0-49ba-8251-05348737aaf6":{content:`kkkk`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-13T04:30:04.993Z`,id:`84439161-c8f0-49ba-8251-05348737aaf6`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T04:30:04.993Z`},"869f5d49-b795-4101-a400-e5995dbba459":{content:`oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T17:30:48.984Z`,id:`869f5d49-b795-4101-a400-e5995dbba459`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T17:30:48.984Z`},"875f08c6-429b-4210-a094-324fe0df393b":{content:`kkkkkk`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:31:20.037Z`,id:`875f08c6-429b-4210-a094-324fe0df393b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:31:20.037Z`},"8f9ba251-5e03-4946-97d3-ad5cf3619842":{content:`🔒 DevT definiu que somente administradores podem enviar mensagens neste grupo.`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:28:07.088Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`8f9ba251-5e03-4946-97d3-ad5cf3619842`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`delivered`,thread_reply_count:0,updated_at:`2026-08-30T16:28:07.088Z`},"8fa15b38-3e71-44f5-bdd7-d0222f0182af":{content:`uuuuuuuu`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:58:23.753Z`,forwarded_from_name:`DevT`,id:`8fa15b38-3e71-44f5-bdd7-d0222f0182af`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!0,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:58:23.753Z`},"9366677c-c274-4a42-95f8-11d4703a2a89":{content:`iiiiiiiiiiiiiiiiiiiiiii`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:56:43.950Z`,id:`9366677c-c274-4a42-95f8-11d4703a2a89`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!0,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:56:43.950Z`},"93c41d42-2ae2-4ec1-a447-0ed73cbbb4ad":{content:`@Dev`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:35:02.412Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`93c41d42-2ae2-4ec1-a447-0ed73cbbb4ad`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,mentions:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:35:02.412Z`},"943c89af-c769-4974-b735-701e8646e4d1":{content:`que nada`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:18:56.179Z`,id:`943c89af-c769-4974-b735-701e8646e4d1`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:18:56.179Z`},"970982ce-c8c4-4182-a607-3994b92acd2f":{content:`eaee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:35:47.612Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`970982ce-c8c4-4182-a607-3994b92acd2f`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:35:47.612Z`},"99eac777-8042-43fe-8469-b382a858dfac":{content:`ta ae?`,conversation_id:`187d260c-c793-475e-b894-73b233120084`,created_at:`2026-09-05T04:36:21.929Z`,id:`99eac777-8042-43fe-8469-b382a858dfac`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:36:21.929Z`},"9a565e38-6a99-4868-8144-9acf191a2daa":{content:`🚪 Dev saiu do grupo.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T04:42:50.451Z`,id:`9a565e38-6a99-4868-8144-9acf191a2daa`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:42:50.451Z`},"a0d4859e-bfb5-4943-bcb8-4202645599fc":{content:`vai me da aula`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:13:58.657Z`,id:`a0d4859e-bfb5-4943-bcb8-4202645599fc`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:13:58.657Z`},"a2c90234-450d-4f11-9a24-9ef721f944a5":{content:`ta ae?`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T02:51:02.377Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`a2c90234-450d-4f11-9a24-9ef721f944a5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T02:51:02.377Z`},"a3e05b2a-189e-433d-a1f8-b40112445b19":{content:`Oi`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-08T22:39:41.557Z`,id:`a3e05b2a-189e-433d-a1f8-b40112445b19`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-08T22:39:41.557Z`},"aa46fc91-c844-4d6c-a2ee-37aaff16fd54":{content:`mano vc desenvolvi bem as coisas`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:11:23.153Z`,id:`aa46fc91-c844-4d6c-a2ee-37aaff16fd54`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:11:23.153Z`},"ac2b5ff4-ec5a-4caa-b7f5-982c1e1a916c":{content:`oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T17:30:36.951Z`,id:`ac2b5ff4-ec5a-4caa-b7f5-982c1e1a916c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T17:30:36.951Z`},"ad1ba9e6-823c-4134-b8f6-99cc2da1629d":{content:`aaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T05:49:19.832Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`ad1ba9e6-823c-4134-b8f6-99cc2da1629d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T05:49:19.832Z`},"adb90435-3ece-408e-8a1e-2253e3230074":{content:`@Malaca`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T02:50:47.484Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`adb90435-3ece-408e-8a1e-2253e3230074`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,mentions:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T02:50:47.484Z`},"ae69a9f6-103f-491a-95e2-d0680810e73d":{content:`aeee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:59:05.296Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`ae69a9f6-103f-491a-95e2-d0680810e73d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:59:05.296Z`},"af8fc80b-3a2d-41a4-a1bb-90212efa3061":{content:`aaaaaaaaaaa`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:58:07.309Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`af8fc80b-3a2d-41a4-a1bb-90212efa3061`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:58:07.309Z`},"b096805d-3a54-4656-9804-01cca3b4d56d":{content:`kkkk`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-13T04:29:54.483Z`,id:`b096805d-3a54-4656-9804-01cca3b4d56d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T04:29:54.483Z`},"b25ee94b-8ce8-4f45-a46d-17a5d9a93e8e":{content:`Oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:18:33.854Z`,id:`b25ee94b-8ce8-4f45-a46d-17a5d9a93e8e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:18:33.854Z`},"b2c3f849-a0d0-4055-b77f-cfe2530a7384":{content:`aeee`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:59:47.864Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`b2c3f849-a0d0-4055-b77f-cfe2530a7384`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:59:47.864Z`},"b3ed5125-4f56-4c86-8ad4-b3084591764d":{content:`Oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T15:41:42.542Z`,id:`b3ed5125-4f56-4c86-8ad4-b3084591764d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T15:41:42.542Z`},"b60172be-17fc-4057-b724-668e81499fb3":{content:`vc fez aaaaaaaaaaaa`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:25:33.647Z`,id:`b60172be-17fc-4057-b724-668e81499fb3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:25:33.647Z`},"b98326bf-fc98-4b65-b0a1-fc89ecc8f41e":{content:`aa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T23:09:51.406Z`,id:`b98326bf-fc98-4b65-b0a1-fc89ecc8f41e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T23:09:51.406Z`},"b9d46fcb-4a0c-47d7-b843-67c9986228ed":{content:`ok`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:32:01.887Z`,id:`b9d46fcb-4a0c-47d7-b843-67c9986228ed`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:32:01.887Z`},"b9dfc492-2431-4c66-8e0d-da55f639b74c":{content:`Oi`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:56:14.841Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`b9dfc492-2431-4c66-8e0d-da55f639b74c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:56:14.841Z`},"ba36957e-c6bc-4326-ae18-d8abf704b598":{content:`vizualização unica`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:56:23.372Z`,id:`ba36957e-c6bc-4326-ae18-d8abf704b598`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:56:23.372Z`},"ba65d76f-67aa-4981-b434-469839e16beb":{content:`teste via rpc`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T02:55:32.259Z`,id:`ba65d76f-67aa-4981-b434-469839e16beb`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T02:55:32.259Z`},"bc6f2067-4e5f-483b-9af0-e1323c79c7e5":{content:`precisando de algo ?`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:56:56.441Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`bc6f2067-4e5f-483b-9af0-e1323c79c7e5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:56:56.441Z`},"bd3c7d4c-b3c0-4233-9541-d330619c1ed3":{content:`oi`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:53:29.419Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`bd3c7d4c-b3c0-4233-9541-d330619c1ed3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:53:29.419Z`},"be75a6e4-ea3e-4866-b790-6c556e7ac6bc":{content:`🔓 DevT liberou o envio de mensagens para todos os participantes.`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:28:17.407Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`be75a6e4-ea3e-4866-b790-6c556e7ac6bc`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`delivered`,thread_reply_count:0,updated_at:`2026-08-30T16:28:17.407Z`},"c27682f3-929f-4583-8fe6-86491904c5a5":{content:`rapaz`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-03T23:34:55.787Z`,id:`c27682f3-929f-4583-8fe6-86491904c5a5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T23:34:55.787Z`},"c670339f-9a27-41a9-9119-91840fd85acf":{content:`eai`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:45:43.381Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`c670339f-9a27-41a9-9119-91840fd85acf`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:55:46.113Z`},"c7585945-d18e-4841-abbc-adafae85ad33":{content:"faz denovo da então só `Ctrl + R` umas 3x",conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:35:25.748Z`,id:`c7585945-d18e-4841-abbc-adafae85ad33`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:35:25.748Z`},"c90e0749-a0fd-491d-8525-4e3aa2e0cc55":{content:`🚫 Mensagem apagada`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:56:10.132Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`c90e0749-a0fd-491d-8525-4e3aa2e0cc55`,is_deleted_for_everyone:!0,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:56:21.753Z`},"cb0f3136-edd3-479c-b5a7-85e41cba6e0e":{content:`🎉 Grupo "teste" criado.`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:18:47.799Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`cb0f3136-edd3-479c-b5a7-85e41cba6e0e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`delivered`,thread_reply_count:0,updated_at:`2026-08-30T16:18:47.799Z`},"cd287d1b-ae46-49a1-b5c3-724c393f99b4":{content:`e não apareceu em canto nenhum`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:25:41.598Z`,id:`cd287d1b-ae46-49a1-b5c3-724c393f99b4`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:25:41.598Z`},"cdf4702d-ade7-4415-be88-f8600b48acff":{content:`aaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T03:35:24.627Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`cdf4702d-ade7-4415-be88-f8600b48acff`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:35:24.627Z`},"cf2c3302-6b21-418f-8968-8b573633fe5b":{content:`falaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:57:54.473Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`cf2c3302-6b21-418f-8968-8b573633fe5b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:57:54.473Z`},"d21601f5-8a06-47a2-a851-9037a8a96c76":{content:`kkk`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-09-05T04:10:24.269Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`d21601f5-8a06-47a2-a851-9037a8a96c76`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:24.269Z`},"d25c5706-c498-4ddf-945a-406c46d81a8b":{content:`quem sou eu, sou fraco ainda`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:14:28.885Z`,id:`d25c5706-c498-4ddf-945a-406c46d81a8b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:14:28.885Z`},"d33202ba-18d2-4fff-aa6e-d06029cd6d14":{content:`oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-29T22:12:34.807Z`,id:`d33202ba-18d2-4fff-aa6e-d06029cd6d14`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T22:12:34.807Z`},"d3b89700-262b-4e91-a545-8d2e61cf1024":{content:`Oi`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-08-29T18:03:41.716Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`d3b89700-262b-4e91-a545-8d2e61cf1024`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T18:03:41.716Z`},"d429cae7-c04d-4b0a-b3c2-bc0a5bb7e225":{content:`ai formatei novamente o pc botando o windows normal`,conversation_id:`187d260c-c793-475e-b894-73b233120084`,created_at:`2026-09-05T04:39:52.086Z`,id:`d429cae7-c04d-4b0a-b3c2-bc0a5bb7e225`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:39:52.086Z`},"d4e6c794-479f-41eb-88e7-f7f17c1c7568":{content:`Oi`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T00:06:29.283Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`d4e6c794-479f-41eb-88e7-f7f17c1c7568`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:06:29.283Z`},"d551536a-47a9-4f03-8d9d-ad3f26c265ce":{content:`oi`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T23:28:21.110Z`,id:`d551536a-47a9-4f03-8d9d-ad3f26c265ce`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T23:28:21.110Z`},"d630ac74-2b97-4454-80c7-7ffb116ec3d3":{content:`Oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T15:41:29.774Z`,id:`d630ac74-2b97-4454-80c7-7ffb116ec3d3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T15:41:29.774Z`},"d80bbcc3-32b5-417e-9365-f62e9ebbc22d":{content:`to afim de colar no fivem porem to banido do five, depois que formatei pc levei banimento de 35  dias`,conversation_id:`187d260c-c793-475e-b894-73b233120084`,created_at:`2026-09-05T04:39:27.133Z`,id:`d80bbcc3-32b5-417e-9365-f62e9ebbc22d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:39:27.133Z`},"d8379c33-b42f-4e87-932b-821a0b2d34f6":{content:`oieee`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-07T03:44:04.788Z`,id:`d8379c33-b42f-4e87-932b-821a0b2d34f6`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-07T03:44:04.788Z`},"d9381551-2eec-4605-be87-c31c626c1a0a":{content:`eai`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T00:10:37.193Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`d9381551-2eec-4605-be87-c31c626c1a0a`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:10:37.193Z`},"d94a85a8-4db5-4bb5-b782-6338baddc9cb":{content:`deu certo`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:31:36.488Z`,id:`d94a85a8-4db5-4bb5-b782-6338baddc9cb`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:31:36.488Z`},"da459086-d8f5-4c52-83e2-e8ad74388d7f":{content:`a`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:19:06.090Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`da459086-d8f5-4c52-83e2-e8ad74388d7f`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:19:06.090Z`},"dad0176f-38ab-499c-af55-e5897371d149":{content:`🚀 *PATCH NOTE — SISTEMA DE METAS*

- Implementada a nova Página de *Metas & Contribuições Semanais*
- Controle de metas e arrecadações
- Acompanhamento dos membros
- Envio e validação de comprovantes
- Progresso e indicadores semanais
- Gestão de metas cadastradas`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:29:06.449Z`,id:`dad0176f-38ab-499c-af55-e5897371d149`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:29:06.449Z`},"dbb6486a-0096-4696-b5ec-86561261e39f":{content:`⭐ Dev foi promovido a Administrador por Malaca.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T01:13:35.296Z`,id:`dbb6486a-0096-4696-b5ec-86561261e39f`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:13:35.296Z`},"df0ccaa0-eded-4c97-862a-10a894ff8070":{content:`Oi, testando`,conversation_id:`6081969d-c71b-4764-9dfb-7cbbc65f3c99`,created_at:`2026-08-29T03:03:59.711Z`,id:`df0ccaa0-eded-4c97-862a-10a894ff8070`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T03:03:59.711Z`},"df6410c1-c21b-49b3-8f65-c47e502c334e":{content:`pagina de metas eu fiz: https://2w.malaca.com.br/metas`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-04T00:46:37.157Z`,id:`df6410c1-c21b-49b3-8f65-c47e502c334e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-04T00:46:37.157Z`},"dfc7cda5-fc1d-44c3-bcfc-3ca4e09011c4":{content:`iiiiiiiiiiiiiiiiiiiiiii`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T17:05:40.373Z`,forwarded_from_name:`DevT`,id:`dfc7cda5-fc1d-44c3-bcfc-3ca4e09011c4`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!0,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T18:34:30.341Z`},"e06b4373-d0c4-4f62-8442-03384719861a":{content:`Oi`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-03T23:14:04.810Z`,id:`e06b4373-d0c4-4f62-8442-03384719861a`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-03T23:14:04.810Z`},"e0eb1b4f-ef0f-4f2f-ba2a-a6dd41abf2ea":{content:`kkkkk`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-13T02:48:37.312Z`,id:`e0eb1b4f-ef0f-4f2f-ba2a-a6dd41abf2ea`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T02:48:37.312Z`},"e1045863-199b-49ff-a958-3715d5655f51":{content:`pera`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:56:13.185Z`,id:`e1045863-199b-49ff-a958-3715d5655f51`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:56:13.185Z`},"e1b82b31-56cd-45e0-ab71-8a47f1b8c73e":{content:`iai`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T23:14:59.137Z`,id:`e1b82b31-56cd-45e0-ab71-8a47f1b8c73e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T23:14:59.137Z`},"e1f06419-455b-4a4c-8f62-eee4d8dcd4dd":{content:`?`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T23:15:00.588Z`,id:`e1f06419-455b-4a4c-8f62-eee4d8dcd4dd`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T23:15:00.588Z`},"e258dfe4-78c9-4402-af5e-2ab309de1384":{content:`🔓 Malaca liberou o envio de mensagens para todos os participantes.`,conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,created_at:`2026-09-05T00:26:16.851Z`,id:`e258dfe4-78c9-4402-af5e-2ab309de1384`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`system`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T00:26:16.851Z`},"e368098b-c90d-4db7-b824-a3f47799da79":{content:`Minha gerente moral`,conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,created_at:`2026-08-31T16:57:34.290Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`e368098b-c90d-4db7-b824-a3f47799da79`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-08-31T16:57:34.290Z`},"e4271e98-0207-4d0b-90b2-07a041c6285c":{content:`aa`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T16:20:15.432Z`,id:`e4271e98-0207-4d0b-90b2-07a041c6285c`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:20:15.432Z`},"e7484b77-5dc8-4a02-8464-157c6ed7f002":{content:`to sim`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T01:56:44.182Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`e7484b77-5dc8-4a02-8464-157c6ed7f002`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T01:56:44.182Z`},"e8a92c76-cc62-4cae-b12a-a12b89b3a91f":{content:`oii`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-12T03:06:02.660Z`,id:`e8a92c76-cc62-4cae-b12a-a12b89b3a91f`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-12T03:06:02.660Z`},"e980c912-c983-4379-b7dd-b943fba662b0":{content:`ta ae`,conversation_id:`efbbf233-fa06-4244-84c3-e47f4c7aef86`,created_at:`2026-09-11T22:45:31.156Z`,id:`e980c912-c983-4379-b7dd-b943fba662b0`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`delivered`,thread_reply_count:0,updated_at:`2026-09-11T22:45:31.156Z`},"ebaeab5f-f1e5-448e-9b37-073721986369":{content:`oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-30T17:30:24.902Z`,id:`ebaeab5f-f1e5-448e-9b37-073721986369`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T17:30:24.902Z`},"ee0b8946-f4e8-4737-ae43-6e94d109a745":{content:`a`,conversation_id:`29cdbce5-b3da-4c22-8672-7102dce8e2e0`,created_at:`2026-09-05T03:38:24.041Z`,id:`ee0b8946-f4e8-4737-ae43-6e94d109a745`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T03:38:24.041Z`},"f240e406-3ef3-4ceb-a8c7-2f02b6346330":{content:`eai mano`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T02:55:57.944Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`f240e406-3ef3-4ceb-a8c7-2f02b6346330`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T02:55:57.944Z`},"f38a1fe0-1aeb-4a1a-ad81-4b72dc24bbea":{content:`Oi, o staff respondeu?`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-13T04:29:26.236Z`,id:`f38a1fe0-1aeb-4a1a-ad81-4b72dc24bbea`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T04:29:26.236Z`},"f3a70e3f-48ac-4f2e-984a-439672a87f4e":{content:`eitaaa`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:10:43.791Z`,id:`f3a70e3f-48ac-4f2e-984a-439672a87f4e`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:43.791Z`},"f3f64767-56f6-4eb1-a5c0-987c1c7bac05":{content:`aaaaaaaa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:24:19.004Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`f3f64767-56f6-4eb1-a5c0-987c1c7bac05`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:24:19.004Z`},"f418e55a-a283-4e84-b1b6-323a5c90ffa7":{content:`ta ae?`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-12T00:59:52.737Z`,id:`f418e55a-a283-4e84-b1b6-323a5c90ffa7`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-12T00:59:52.737Z`},"f4fce8f6-55cb-46f2-b5e6-e2155db60af3":{content:`aa`,conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,created_at:`2026-08-30T16:20:06.069Z`,deleted_for_users:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],id:`f4fce8f6-55cb-46f2-b5e6-e2155db60af3`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`sent`,thread_reply_count:0,updated_at:`2026-08-30T16:20:06.069Z`},"f5882eb0-80bd-47a8-913e-344455a56ebf":{content:`pagina de metas eu fiz: https://2w.malaca.com.br/metas`,conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,created_at:`2026-09-04T00:55:54.247Z`,id:`f5882eb0-80bd-47a8-913e-344455a56ebf`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`read`,thread_reply_count:0,updated_at:`2026-09-04T00:55:54.247Z`},"f7203fd4-8b70-43b4-99a7-27d6c3c6ffe4":{content:`acho que foi por causa do windows modificado que usei`,conversation_id:`187d260c-c793-475e-b894-73b233120084`,created_at:`2026-09-05T04:39:39.221Z`,id:`f7203fd4-8b70-43b4-99a7-27d6c3c6ffe4`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:39:39.221Z`},"f954e401-dc69-4102-a099-d17f2ef3b891":{content:`oi`,conversation_id:`6081969d-c71b-4764-9dfb-7cbbc65f3c99`,created_at:`2026-09-02T21:48:04.019Z`,id:`f954e401-dc69-4102-a099-d17f2ef3b891`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,status:`read`,thread_reply_count:0,updated_at:`2026-09-02T21:48:04.019Z`},"f958d27c-c7cd-4cbb-bf18-ac31a38c509b":{content:`falou que segunda feira o dev deles trabalha`,conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,created_at:`2026-09-13T04:29:53.332Z`,id:`f958d27c-c7cd-4cbb-bf18-ac31a38c509b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`read`,thread_reply_count:0,updated_at:`2026-09-13T04:29:53.332Z`},"fa84c69c-cec6-4e6e-9bf8-f9627b04f0be":{content:`desculpa a demora`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:55:13.189Z`,id:`fa84c69c-cec6-4e6e-9bf8-f9627b04f0be`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:55:13.189Z`},"fcbc6d5b-4a71-46f9-832f-b6f693afbb3d":{content:`Oi`,conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,created_at:`2026-08-29T21:53:17.654Z`,id:`fcbc6d5b-4a71-46f9-832f-b6f693afbb3d`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`e804c543-4e0a-4c45-9930-4450739d3b36`,status:`read`,thread_reply_count:0,updated_at:`2026-08-29T21:53:17.654Z`},"fcc87e7d-fc0b-4b4a-869b-52a12f1ed96b":{content:`ja desenrola bem`,conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:19:00.673Z`,id:`fcc87e7d-fc0b-4b4a-869b-52a12f1ed96b`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:19:00.673Z`},"fd2ea743-bd11-4f17-80f2-e421f83081b5":{content:`aa`,conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,created_at:`2026-09-05T04:10:08.374Z`,deleted_for_users:[`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`],id:`fd2ea743-bd11-4f17-80f2-e421f83081b5`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:10:08.374Z`},"fd99448c-3091-4b1d-9776-9ef3277a87d8":{content:"da ai um `Ctrl + Shift + R` umas 3x ai no navegador",conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,created_at:`2026-09-05T04:29:12.591Z`,id:`fd99448c-3091-4b1d-9776-9ef3277a87d8`,is_deleted_for_everyone:!1,is_edited:!1,is_forwarded:!1,is_pinned:!1,message_type:`text`,sender_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,status:`read`,thread_reply_count:0,updated_at:`2026-09-05T04:29:12.591Z`}},chat_moderation_logs:{_schema_info:{empty:!0,original_table:`chat_moderation_logs`}},chat_participants:{"018b48ae-917b-448a-8927-b629315f3a3d":{conversation_id:`8b306251-3b1d-4877-909e-9d6a230d4be7`,id:`018b48ae-917b-448a-8927-b629315f3a3d`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-03T13:32:34.591Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"05076b51-806f-4b47-a164-95eef6021d2a":{conversation_id:`db5ff371-5cc0-4492-8997-673b05460c1b`,id:`05076b51-806f-4b47-a164-95eef6021d2a`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T17:34:56.739Z`,last_read_at:`2026-09-08T03:11:05.157Z`,role:`member`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"0f673e3b-fe06-4d51-a379-b9429448db1d":{conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,id:`0f673e3b-fe06-4d51-a379-b9429448db1d`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T18:03:35.327Z`,last_read_at:`2026-09-05T04:24:39.803Z`,role:`member`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"132f2a5d-d519-4f24-a041-ccf9cd6fe322":{conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,id:`132f2a5d-d519-4f24-a041-ccf9cd6fe322`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T21:53:11.509Z`,last_read_at:`2026-08-30T17:30:49.248Z`,role:`admin`,user_id:`e804c543-4e0a-4c45-9930-4450739d3b36`},"139edac1-5e75-4626-bb3d-c7e06bf85289":{conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,id:`139edac1-5e75-4626-bb3d-c7e06bf85289`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:10:33.711Z`,last_read_at:`2026-09-13T04:28:42.806Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"1ae819a4-5c5e-4395-b21d-2edd40f56aea":{conversation_id:`6081969d-c71b-4764-9dfb-7cbbc65f3c99`,id:`1ae819a4-5c5e-4395-b21d-2edd40f56aea`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T03:03:49.835Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"1ede840b-e7c6-4823-899d-418d930409cb":{conversation_id:`021145cf-30ce-44a0-8aa0-baa3115e9ccc`,id:`1ede840b-e7c6-4823-899d-418d930409cb`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T05:19:26.106Z`,last_read_at:`2026-09-09T04:47:31.899Z`,role:`admin`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"265be8ca-ca10-4f66-be16-bb1e31183cba":{conversation_id:`b1a500fe-0948-4742-bb80-abd52c9c0a4f`,deleted_at:`2026-09-05T04:10:53.382Z`,id:`265be8ca-ca10-4f66-be16-bb1e31183cba`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T18:03:35.327Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"271cf736-3eb4-4260-b7ed-7f4f7548a815":{conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,deleted_at:`2026-09-01T15:13:19.489Z`,id:`271cf736-3eb4-4260-b7ed-7f4f7548a815`,is_archived:!1,is_muted:!1,is_pinned:!0,joined_at:`2026-08-30T16:18:47.085Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`member`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"2be8d527-e2bf-4f82-9e5f-0728bc6026f2":{conversation_id:`37b30922-5e38-4d31-a7cd-ab029fe88bc8`,id:`2be8d527-e2bf-4f82-9e5f-0728bc6026f2`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:30:12.021Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"3cc58e05-a768-4e4e-a8a9-b917daabb0db":{conversation_id:`15474c3a-9ec8-4b97-94c7-fac1cb065809`,id:`3cc58e05-a768-4e4e-a8a9-b917daabb0db`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-30T14:42:17.648Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"3dd911da-2cff-41db-b0c8-dba6d347c147":{conversation_id:`efbbf233-fa06-4244-84c3-e47f4c7aef86`,id:`3dd911da-2cff-41db-b0c8-dba6d347c147`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-11T22:45:08.808Z`,last_read_at:`2026-09-11T22:44:58.398Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"4f1d0577-acba-4c7c-8aad-e5b921473c55":{conversation_id:`efbbf233-fa06-4244-84c3-e47f4c7aef86`,id:`4f1d0577-acba-4c7c-8aad-e5b921473c55`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-11T22:45:08.808Z`,last_read_at:`2026-09-11T22:45:08.808Z`,role:`member`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"4fcf6f22-4d97-499b-b98d-fc041f968ebb":{conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,id:`4fcf6f22-4d97-499b-b98d-fc041f968ebb`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-12T00:59:40.243Z`,last_read_at:`2026-09-13T04:30:24.649Z`,role:`member`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"51f2638a-ee84-4a56-af73-757733a66444":{conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,id:`51f2638a-ee84-4a56-af73-757733a66444`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T00:13:27.736Z`,last_read_at:`2026-09-05T04:43:21.117Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"6400956c-f7a1-4729-b061-c07bed8483bd":{conversation_id:`021145cf-30ce-44a0-8aa0-baa3115e9ccc`,id:`6400956c-f7a1-4729-b061-c07bed8483bd`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T05:19:26.106Z`,last_read_at:`2026-09-09T04:36:23.797Z`,role:`member`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"76ddbc61-f128-45a0-b736-2d2d516437d4":{conversation_id:`7703a674-a449-42fb-b5a1-4f17c3d98ee1`,id:`76ddbc61-f128-45a0-b736-2d2d516437d4`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-12T00:59:40.243Z`,last_read_at:`2026-09-13T04:52:37.667Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"7d3630c8-2120-4446-8a00-6c84e22845c6":{conversation_id:`db5ff371-5cc0-4492-8997-673b05460c1b`,id:`7d3630c8-2120-4446-8a00-6c84e22845c6`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T17:34:56.739Z`,last_read_at:`2026-09-05T17:34:56.588Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"7ea79ba5-c84f-4d68-8c46-e27cb6294957":{conversation_id:`15474c3a-9ec8-4b97-94c7-fac1cb065809`,id:`7ea79ba5-c84f-4d68-8c46-e27cb6294957`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-30T14:42:17.648Z`,last_read_at:`2026-09-08T03:11:07.381Z`,role:`member`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"857ba93f-8bf0-4cf5-b48e-62ef836b0bb1":{conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,id:`857ba93f-8bf0-4cf5-b48e-62ef836b0bb1`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T00:13:27.736Z`,last_read_at:`2026-09-05T15:10:50.410Z`,role:`member`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"8608c119-d8c4-4ac8-8966-04b8f6dc2a70":{conversation_id:`6081969d-c71b-4764-9dfb-7cbbc65f3c99`,id:`8608c119-d8c4-4ac8-8966-04b8f6dc2a70`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T03:03:49.835Z`,last_read_at:`2026-09-05T03:43:18.306Z`,role:`member`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"88ccb91c-8e0a-4365-acc9-2a9c5a192cf2":{conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,id:`88ccb91c-8e0a-4365-acc9-2a9c5a192cf2`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-30T01:14:33.595Z`,last_read_at:`2026-09-05T00:39:14.801Z`,role:`member`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"8a91f00a-08c1-4e6b-bcbb-911c15a4d947":{conversation_id:`6e7e063d-eedf-48d4-983b-19155d913418`,id:`8a91f00a-08c1-4e6b-bcbb-911c15a4d947`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-30T16:18:47.085Z`,last_read_at:`2026-08-30T16:58:02.165Z`,role:`admin`,user_id:`e804c543-4e0a-4c45-9930-4450739d3b36`},"8de3eec8-ca2a-4f57-8b0f-8fef0cc1c962":{conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,id:`8de3eec8-ca2a-4f57-8b0f-8fef0cc1c962`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T00:13:27.736Z`,last_read_at:`2026-09-05T04:54:53.930Z`,role:`member`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"9eb82ce8-7e89-4ec2-9c5c-e3e56c10ccbd":{conversation_id:`37b30922-5e38-4d31-a7cd-ab029fe88bc8`,id:`9eb82ce8-7e89-4ec2-9c5c-e3e56c10ccbd`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:30:12.021Z`,last_read_at:`2026-09-09T04:47:21.319Z`,role:`member`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"b79f998a-111e-4c6d-9ad2-1b2986d14dc8":{conversation_id:`187d260c-c793-475e-b894-73b233120084`,id:`b79f998a-111e-4c6d-9ad2-1b2986d14dc8`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:36:16.346Z`,last_read_at:`2026-09-05T04:43:25.197Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"bad6d099-f947-43b6-bc78-cf02f18effac":{conversation_id:`3429c102-2507-4059-abc2-00e9c8c36450`,id:`bad6d099-f947-43b6-bc78-cf02f18effac`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T00:13:27.736Z`,last_read_at:`2026-09-06T13:26:02.926Z`,role:`member`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"bb49dc9c-3101-4022-9304-36cf6e0ae6d6":{conversation_id:`89eda40a-79e9-4517-8225-e13db0732c64`,id:`bb49dc9c-3101-4022-9304-36cf6e0ae6d6`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-30T01:14:33.595Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"c0a4bc94-6d67-4abf-8a1a-a801d998bba1":{conversation_id:`187d260c-c793-475e-b894-73b233120084`,id:`c0a4bc94-6d67-4abf-8a1a-a801d998bba1`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:36:16.346Z`,last_read_at:`2026-09-05T15:11:55.579Z`,role:`member`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"c1081ba1-ab8c-4ddc-bdd6-d882c228c49d":{conversation_id:`29a2305d-070f-4b53-b375-9d88cb408fe2`,id:`c1081ba1-ab8c-4ddc-bdd6-d882c228c49d`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T21:53:11.509Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`member`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"c83305b3-1a92-42ef-bd71-4256be5477c3":{conversation_id:`8b306251-3b1d-4877-909e-9d6a230d4be7`,id:`c83305b3-1a92-42ef-bd71-4256be5477c3`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-03T13:32:34.591Z`,last_read_at:`2026-09-08T03:04:50.757Z`,role:`member`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"d0e09c36-d08e-4921-96a6-136d20ecf9a5":{conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,id:`d0e09c36-d08e-4921-96a6-136d20ecf9a5`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T05:22:58.865Z`,last_read_at:`2026-09-05T05:49:17.101Z`,role:`member`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"d3e4d9e2-7141-46c3-9c9d-0bae23391611":{conversation_id:`29cdbce5-b3da-4c22-8672-7102dce8e2e0`,id:`d3e4d9e2-7141-46c3-9c9d-0bae23391611`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T03:36:15.176Z`,last_read_at:`2026-09-05T05:49:06.486Z`,role:`admin`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"d5a7675d-0eb4-4efb-a7db-e77019227184":{conversation_id:`d1662444-0465-44ca-9cc4-0b4d6e4e94de`,deleted_at:`2026-09-05T05:55:23.718Z`,id:`d5a7675d-0eb4-4efb-a7db-e77019227184`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-08-29T05:22:58.865Z`,last_read_at:`2026-09-13T04:29:39.932Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"db8c7315-445a-4edf-b3a0-32d2d4d34575":{conversation_id:`9bee2fca-c44d-4d78-8068-93055dbfb6e3`,id:`db8c7315-445a-4edf-b3a0-32d2d4d34575`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:36:10.518Z`,last_read_at:`2026-09-05T04:36:10.466Z`,role:`admin`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`},"de9f43ca-43ec-4c0f-bde7-bae69d9553e0":{conversation_id:`1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,id:`de9f43ca-43ec-4c0f-bde7-bae69d9553e0`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:10:33.711Z`,last_read_at:`2026-09-13T02:59:28.624Z`,role:`member`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"e0e200a8-fc0e-4a90-bc20-03d0ddd9c451":{conversation_id:`9bee2fca-c44d-4d78-8068-93055dbfb6e3`,id:`e0e200a8-fc0e-4a90-bc20-03d0ddd9c451`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T04:36:10.518Z`,last_read_at:`2026-09-05T04:36:10.518Z`,role:`member`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"fca74f77-ad49-42b0-8dc9-e1419315ec7a":{conversation_id:`29cdbce5-b3da-4c22-8672-7102dce8e2e0`,id:`fca74f77-ad49-42b0-8dc9-e1419315ec7a`,is_archived:!1,is_muted:!1,is_pinned:!1,joined_at:`2026-09-05T03:36:15.176Z`,last_read_at:`2026-09-06T16:14:07.581Z`,role:`member`,user_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`}},chat_reminders:{_schema_info:{empty:!0,original_table:`chat_reminders`}},chat_reports:{_schema_info:{empty:!0,original_table:`chat_reports`}},chat_saved_messages:{_schema_info:{empty:!0,original_table:`chat_saved_messages`}},chat_user_folders:{_schema_info:{empty:!0,original_table:`chat_user_folders`}},custom_roles:{"01":{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Acesso administrativo completo de liderança`,id:`01`,is_system:!0,module_permissions:{auditoria:`manage`,baus:`manage`,categorias:`manage`,dashboard:`manage`,desempenho:`manage`,fundo_caixa:`manage`,gestao_cargos:`manage`,membros:`manage`,movimentacoes:`manage`,produtos:`manage`,vendas:`manage`},nome:`01`,rank:90,updated_at:`2026-08-20T23:07:07.468Z`},"02":{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Administra operações, estoque e membros`,id:`02`,is_system:!0,module_permissions:{auditoria:`manage`,baus:`manage`,categorias:`manage`,dashboard:`manage`,desempenho:`manage`,fundo_caixa:`manage`,gestao_cargos:`view`,membros:`manage`,movimentacoes:`manage`,produtos:`manage`,vendas:`manage`},nome:`02`,rank:80,updated_at:`2026-08-20T23:07:07.468Z`},desenvolvedor:{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Acesso total de desenvolvimento e administração de sistema`,id:`desenvolvedor`,is_system:!0,module_permissions:{auditoria:`manage`,baus:`manage`,categorias:`manage`,dashboard:`manage`,desempenho:`manage`,fundo_caixa:`manage`,gestao_cargos:`manage`,membros:`manage`,movimentacoes:`manage`,produtos:`manage`,vendas:`manage`},nome:`Desenvolvedor`,rank:100,updated_at:`2026-08-20T23:07:07.468Z`},gerente:{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Operações, estoque, vendas e acompanhamento de metas`,id:`gerente`,is_system:!0,module_permissions:{auditoria:`none`,baus:`manage`,categorias:`manage`,dashboard:`manage`,desempenho:`manage`,fundo_caixa:`view`,gestao_cargos:`none`,membros:`manage`,movimentacoes:`manage`,produtos:`manage`,vendas:`manage`},nome:`Gerente`,rank:70,updated_at:`2026-08-20T23:07:07.468Z`},membro:{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Acesso operacional e relatórios próprios`,id:`membro`,is_system:!0,module_permissions:{auditoria:`none`,baus:`view`,categorias:`view`,dashboard:`view`,desempenho:`view`,fundo_caixa:`none`,gestao_cargos:`none`,membros:`view`,movimentacoes:`manage`,produtos:`view`,vendas:`manage`},nome:`Membro`,rank:40,updated_at:`2026-08-20T23:07:07.468Z`},motoqueiro:{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Operações próprias, vendas e movimentações de estoque`,id:`motoqueiro`,is_system:!0,module_permissions:{auditoria:`none`,baus:`view`,categorias:`view`,dashboard:`view`,desempenho:`view`,fundo_caixa:`none`,gestao_cargos:`none`,membros:`view`,movimentacoes:`manage`,produtos:`view`,vendas:`manage`},nome:`Motoqueiro`,rank:50,updated_at:`2026-08-20T23:07:07.468Z`},novato:{created_at:`2026-08-20T23:07:07.468Z`,descricao:`Acesso inicial limitado para leitura`,id:`novato`,is_system:!0,module_permissions:{auditoria:`none`,baus:`view`,categorias:`view`,dashboard:`view`,desempenho:`view`,fundo_caixa:`none`,gestao_cargos:`none`,membros:`none`,movimentacoes:`none`,produtos:`view`,vendas:`none`},nome:`Novato`,rank:10,updated_at:`2026-08-20T23:07:07.468Z`}},discord_stock_config:{"5997be53-3053-4bae-8d4c-126efb6f4b6d":{allow_negative_stock:!0,bau_channels:{"074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,channel_id:`1535637509818548234`,guild_id:`1535505650308620400`,is_active:!0,tipo_gestao:`automatico`},"d90e05cb-86cd-4b8b-a18a-b79d5096d902":{bau_id:`d90e05cb-86cd-4b8b-a18a-b79d5096d902`,channel_id:``,guild_id:``,is_active:!0,tipo_gestao:`manual`},"efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,channel_id:``,guild_id:``,is_active:!0,tipo_gestao:`manual`}},channel_id:`1535637509818548234`,created_at:`2026-09-17T03:15:11.693Z`,default_bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,guild_id:`1535505650308620400`,id:`5997be53-3053-4bae-8d4c-126efb6f4b6d`,is_active:!0,item_mappings:{"barra maciça":`Barra Maciça`,caderneta:`Caderneta`,capuz:`Capuz`,cocaina:`Cocaina`,colete:`Colete`,"conjunto de attachs da g36c mk2":`Conjunto de Attachs da G36C Mk2`,"conjunto de attachs da mtar":`Conjunto de Attachs da MTAR`,"envelope manchado":`Envelope Manchado`,esmerilhadeira:`Esmerilhadeira`,"explosivo c4":`C4`,"fn five seven":`FN Five Seven`,"g36c mk2":`G36C Mk2`,"galão de combustível":`Galão de Gasolina`,"glock 19":`Glock 19`,hacking:`Hacking`,"kit de reparo simples":`Kit de Reparo Simples`,lockpick:`LockPick`,metanfetamina:`Metanfetamina`,"micro uzi":`Uzi`,mp5:`MP5`,"munição pistola":`Munição de pistola`,"munição rifle":`Munição Rifle`,"munição submetralhadora":`Munição SUB`,"pendrive de invasão":`Pendrive de Invasão`,"pé de cabra":`Pé de Cabra`,"silent bypass":`Silent Bypass`,tablet:`Tablet`,"taco de beisebol":`Taco de Beisebol`,thermite:`Thermite`},last_message_id:`1567228863677726742`,last_processed_at:`2026-11-03T20:34:19.221Z`,last_status:`success`,updated_at:`2026-11-03T20:34:19.221Z`}},discord_stock_logs:{"ee7fddbb-7691-4105-8d13-346c8a60c502":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-23T07:46:23.872Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`ee7fddbb-7691-4105-8d13-346c8a60c502`,message_id:`1563005055924441159`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Glock 19`,quantity_change:3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição de pistola`,quantity_change:27}],raw_content:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Glock 19**  \`+3\`
**Munição Pistola**  \`+27\`
​
​
🧾 Detalhes da movimentação
Glock 19
↳ +3 adicionados
Munição Pistola
↳ +27 adicionados`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Glock 19**  `+3`\n**Munição Pistola**  `+27`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Glock 19
↳ +3 adicionados
Munição Pistola
↳ +27 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-23T01:44:04.381000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"eea74188-d8f2-4e23-9228-f67e6189bccb":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T00:14:19.058Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`eea74188-d8f2-4e23-9228-f67e6189bccb`,message_id:`1561469732652064990`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-50}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -50 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -50 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T20:03:14.424000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"eeb76bd0-5ada-4ce7-907e-214fb342d374":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-25T22:45:15.071Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`eeb76bd0-5ada-4ce7-907e-214fb342d374`,message_id:`1564047215461146727`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MTAR-21`,quantity_change:-1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:-209},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:3}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**MTAR\\-21**  \`-1\`
**Munição Submetralhadora**  \`-209\`
**Algemas**  \`+3\`
​
​
🧾 Detalhes da movimentação
MTAR\\-21
↳ -1 removido
Munição Submetralhadora
↳ -209 removidos
Algemas
↳ +3 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MTAR\\-21**  `-1`\n**Munição Submetralhadora**  `-209`\n**Algemas**  `+3`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MTAR\\-21
↳ -1 removido
Munição Submetralhadora
↳ -209 removidos
Algemas
↳ +3 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1564047215461146726`,timestamp:`2026-10-25T22:45:14.659000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"eee995ef-7ae4-40b1-bba6-9900719c2da5":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-11-01T13:39:32.167Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`eee995ef-7ae4-40b1-bba6-9900719c2da5`,message_id:`1566446597875961947`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Kit de Reparo Avançado`,quantity_change:-1}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Kit de Reparo Avançado**  \`-1\`
​
​
🧾 Detalhes da movimentação
Kit de Reparo Avançado
↳ -1 removido`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Kit de Reparo Avançado**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Kit de Reparo Avançado
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566446597875961946`,timestamp:`2026-11-01T13:39:31.949000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"ef63acea-c21a-43da-b341-cc4f7645050f":{author_name:`Medusa Toretto`,channel_id:`1535637509818548234`,created_at:`2026-09-19T23:27:41.533Z`,game_player_id:`6079`,guild_id:`1535505650308620400`,id:`ef63acea-c21a-43da-b341-cc4f7645050f`,message_id:`1551011929730973716`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:-15}],raw_content:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -15 removidos`,raw_embeds:{author:{name:`Medusa Toretto • ID 6079`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-15`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -15 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1551011928430739571`,timestamp:`2026-09-19T23:27:40.003000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f028d22f-2ef3-4fb5-bd55-20bbc20505a7":{author_name:`zeca`,channel_id:`1535637509818548234`,created_at:`2026-10-20T21:36:39.108Z`,game_player_id:`8393`,guild_id:`1535505650308620400`,id:`f028d22f-2ef3-4fb5-bd55-20bbc20505a7`,message_id:`1562218012851830974`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-8},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Dinheiro Marcado`,quantity_change:-10525}],raw_content:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-8\`
**Dinheiro Marcado**  \`-10525\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -8 removidos
Dinheiro Marcado
↳ -10525 removidos`,raw_embeds:{author:{name:`ZECA SLIM • ID 8393`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-8`\n**Dinheiro Marcado**  `-10525`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -8 removidos
Dinheiro Marcado
↳ -10525 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1562218010754682900`,timestamp:`2026-10-20T21:36:38.196000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f0f605b4-eed8-4398-b705-f914a6a748c0":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-10-24T03:49:01.437Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`f0f605b4-eed8-4398-b705-f914a6a748c0`,message_id:`1563398887035641897`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:-10},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-20}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-10\`
**Lockpick**  \`-20\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -10 removidos
Lockpick
↳ -20 removidos`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Hacking**  `-10`\n**Lockpick**  `-20`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Hacking
↳ -10 removidos
Lockpick
↳ -20 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1563398887035641896`,timestamp:`2026-10-24T03:49:01.034000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f13259ad-795f-4f98-8d72-497acf094fbb":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-21T03:46:39.316Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f13259ad-795f-4f98-8d72-497acf094fbb`,message_id:`1562311127596015720`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:-19}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-19\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -19 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `-19`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ -19 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1562311127596015719`,timestamp:`2026-10-21T03:46:38.995000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f16510e1-b325-4ca9-bb4e-2a4b4a1e4ae3":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-24T22:29:58.502Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f16510e1-b325-4ca9-bb4e-2a4b4a1e4ae3`,message_id:`1563680984199594015`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-30}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-30\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -30 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-30`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -30 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1563680984199594014`,timestamp:`2026-10-24T22:29:58.245000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f1725ccc-2afe-4a23-ba1c-faecb29a3756":{author_name:`Babalu • ID 7`,channel_id:`1535637509818548234`,created_at:`2026-10-27T17:27:08.046Z`,error_message:`Nenhum item válido identificado no formato esperado`,game_player_id:`7`,guild_id:`1535505650308620400`,id:`f1725ccc-2afe-4a23-ba1c-faecb29a3756`,message_id:`1564691935539634310`,raw_content:`
Babalu • ID 7
📦 Baú
​
Evento
✅ Webhook configurado`,raw_embeds:{author:{name:`Babalu • ID 7`},color:5763719,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`Evento`,value:`✅ Webhook configurado`}],footer:{text:`Evento de configuração do armazenamento`},id:`1564691935539634309`,timestamp:`2026-10-27T17:27:07.811000+00:00`,title:`📦 Baú`,type:`rich`},status:`error`},"f1a2e017-d72f-4e99-93e5-46f72f87b7c8":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-25T00:37:36.351Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f1a2e017-d72f-4e99-93e5-46f72f87b7c8`,message_id:`1563713103542362195`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`FN Five Seven`,quantity_change:2}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`+2\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ +2 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**FN Five Seven**  `+2`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`FN Five Seven
↳ +2 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1563713103542362194`,timestamp:`2026-10-25T00:37:36.060000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f1db016f-2784-484c-80a8-f05f859650e1":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-18T23:44:56.305Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`f1db016f-2784-484c-80a8-f05f859650e1`,message_id:`1561502066290065510`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`G36C Mk2`,quantity_change:1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:-6},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:-302}],raw_content:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`+1\`
**MP5**  \`-6\`
**Munição Submetralhadora**  \`-302\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado
MP5
↳ -6 removidos
Munição Submetralhadora
↳ -302 removidos`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**G36C Mk2**  `+1`\n**MP5**  `-6`\n**Munição Submetralhadora**  `-302`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`G36C Mk2
↳ +1 adicionado
MP5
↳ -6 removidos
Munição Submetralhadora
↳ -302 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T22:11:43.745000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f1e24571-9b8d-479e-af33-dc9494bc6a64":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-25T17:10:59.010Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f1e24571-9b8d-479e-af33-dc9494bc6a64`,message_id:`1563916043406151723`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:110}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+110\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +110 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `+110`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ +110 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-25T14:04:00.812000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f1e60343-f073-4808-a19f-2210fa52d438":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T02:59:24.061Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`f1e60343-f073-4808-a19f-2210fa52d438`,message_id:`1561523124405801086`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:152},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Plano de Segurança`,quantity_change:3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Missão`,quantity_change:1}],raw_content:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MP5**  `+3`\n**Munição Submetralhadora**  `+152`\n**Plano de Segurança**  `+3`\n**Missão**  `+1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T23:35:24.399000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f2661f29-6430-4e59-b7fe-eb22d852efb6":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-29T13:07:49.163Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f2661f29-6430-4e59-b7fe-eb22d852efb6`,message_id:`1565351450916167681`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:8}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+8\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +8 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `+8`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ +8 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565351450916167680`,timestamp:`2026-10-29T13:07:48.582000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f276ac21-2250-4654-bd5b-c847d4c81850":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-15T03:41:35.617Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f276ac21-2250-4654-bd5b-c847d4c81850`,message_id:`1560135526537764895`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:-50}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Submetralhadora**  \`-50\`
​
​
🧾 Detalhes da movimentação
Munição Submetralhadora
↳ -50 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Munição Submetralhadora**  `-50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Munição Submetralhadora
↳ -50 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560135526537764894`,timestamp:`2026-10-15T03:41:35.312000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f284fbad-bf71-4922-a8e4-c71f609aa370":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-16T21:31:15.998Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f284fbad-bf71-4922-a8e4-c71f609aa370`,message_id:`1560767106838962227`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:3}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MP5**  `+3`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MP5
↳ +3 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560767106838962226`,timestamp:`2026-10-16T21:31:15.721000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f2b7c3ea-f6e0-4893-bfd7-2b3a0a05581a":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-09-19T00:28:59.339Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`f2b7c3ea-f6e0-4893-bfd7-2b3a0a05581a`,message_id:`1550644108392013927`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:100},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`FN Five Seven`,quantity_change:-5},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Caderneta`,quantity_change:1}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+100\`
**FN Five Seven**  \`-5\`
**Glock 19**  \`±0\`
**Caderneta**  \`+1\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +100 adicionados
FN Five Seven
↳ +4 adicionados · -9 removidos
Glock 19
↳ +1 adicionado · -1 removido
Caderneta
↳ +1 adicionado`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `+100`\n**FN Five Seven**  `-5`\n**Glock 19**  `±0`\n**Caderneta**  `+1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ +100 adicionados
FN Five Seven
↳ +4 adicionados · -9 removidos
Glock 19
↳ +1 adicionado · -1 removido
Caderneta
↳ +1 adicionado`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-09-18T23:06:04.832000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f2b868dc-c094-4e0a-89e6-7b306f43a50c":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-09-22T20:47:44.172Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f2b868dc-c094-4e0a-89e6-7b306f43a50c`,message_id:`1552058838180438047`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-12}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-12\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -12 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-12`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -12 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1552058838180438046`,timestamp:`2026-09-22T20:47:42.693000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f2f0157a-d9f1-4e25-bb62-40ee6e300f4c":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T02:48:41.251Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f2f0157a-d9f1-4e25-bb62-40ee6e300f4c`,message_id:`1565909329142485172`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-15}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -15 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-15`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -15 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T02:04:37.109000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f35bf25c-479b-4ff4-9913-953c7f4baebd":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-22T00:24:56.029Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f35bf25c-479b-4ff4-9913-953c7f4baebd`,message_id:`1562311127596015720`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:-19}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-19\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -19 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `-19`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ -19 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-21T03:46:38.995000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f38efa58-4764-4a3c-af87-4e43260999f6":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-28T15:54:42.785Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f38efa58-4764-4a3c-af87-4e43260999f6`,message_id:`1565031063766569116`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Pendrive de Invasão`,quantity_change:-2}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Pendrive de Invasão**  \`-2\`
​
​
🧾 Detalhes da movimentação
Pendrive de Invasão
↳ -2 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Pendrive de Invasão**  `-2`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Pendrive de Invasão
↳ -2 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565031063766569115`,timestamp:`2026-10-28T15:54:42.343000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f3a5fde8-e78f-45a0-9ac0-1c72b5ca2253":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-23T01:44:44.826Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`f3a5fde8-e78f-45a0-9ac0-1c72b5ca2253`,message_id:`1563005223860043857`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:19}],raw_content:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+19\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +19 adicionados`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Hacking**  `+19`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Hacking
↳ +19 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1563005223860043856`,timestamp:`2026-10-23T01:44:44.353000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f3af8280-0d5b-4380-893c-850909d1e9ed":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-16T21:15:35.466Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f3af8280-0d5b-4380-893c-850909d1e9ed`,message_id:`1560763161798516769`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-10}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-10\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -10 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-10`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -10 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560763161798516768`,timestamp:`2026-10-16T21:15:35.139000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f3de79ad-cecc-42bf-a38b-ea274df814ae":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-03T19:50:17.443Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`f3de79ad-cecc-42bf-a38b-ea274df814ae`,message_id:`1567167850911637669`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Metanfetamina`,quantity_change:-100}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Metanfetamina**  \`-100\`
​
​
🧾 Detalhes da movimentação
Metanfetamina
↳ -100 removidos`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Metanfetamina**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Metanfetamina
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T13:25:32.055000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f3f4aeef-9910-457f-9aae-d96a30adbb10":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-23T01:12:00.422Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f3f4aeef-9910-457f-9aae-d96a30adbb10`,message_id:`1562984739483164684`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:1584}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1584\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1584 adicionados`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `+1584`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +1584 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-23T00:23:20.162000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f3fbeb77-ba31-4dd1-ac07-fa24f498982b":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-11-02T04:43:21.390Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f3fbeb77-ba31-4dd1-ac07-fa24f498982b`,message_id:`1566674051706130433`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-20}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-20\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -20 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-20`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -20 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566674051706130432`,timestamp:`2026-11-02T04:43:21.143000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f40d21a1-288d-4e7a-a020-122ab31f1f74":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T04:19:35.245Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f40d21a1-288d-4e7a-a020-122ab31f1f74`,message_id:`1565909035331362948`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-15}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-15\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -15 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-15`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -15 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T02:03:27.058000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f41aa8b9-6a35-4cc9-a387-24ed67252741":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T05:28:40.378Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f41aa8b9-6a35-4cc9-a387-24ed67252741`,message_id:`1565909369001082943`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:15}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +15 adicionados`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `+15`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ +15 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T02:04:46.610000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f471d357-1c21-4560-8afd-5a2ea28a957f":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-10-16T11:34:11.761Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`f471d357-1c21-4560-8afd-5a2ea28a957f`,message_id:`1560616849027235952`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:10}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+10\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +10 adicionados`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `+10`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ +10 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560616849027235950`,timestamp:`2026-10-16T11:34:11.470000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f492517d-8414-41d6-a2f9-fc3815b52779":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-16T22:55:28.121Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f492517d-8414-41d6-a2f9-fc3815b52779`,message_id:`1560788296601444433`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:-5}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`-5\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados · -7 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MP5**  `-5`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MP5
↳ +2 adicionados · -7 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560788296601444432`,timestamp:`2026-10-16T22:55:27.637000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f49e9903-025a-4bc3-ac10-22668a4e4c84":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-11-02T02:05:56.463Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f49e9903-025a-4bc3-ac10-22668a4e4c84`,message_id:`1566634436580212777`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-20}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-20\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -20 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-20`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -20 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566634436580212776`,timestamp:`2026-11-02T02:05:56.114000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f4dab73f-4d8f-4f60-9ecf-a9a0a58cc7b6":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-30T03:08:53.113Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f4dab73f-4d8f-4f60-9ecf-a9a0a58cc7b6`,message_id:`1565563113590362243`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:198}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+198\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +198 adicionados`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `+198`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +198 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565563113590362242`,timestamp:`2026-10-30T03:08:52.831000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f4fc9bd6-8df1-4203-9b16-17448f0c2869":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T06:45:29.892Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f4fc9bd6-8df1-4203-9b16-17448f0c2869`,message_id:`1565909329142485172`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-15}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -15 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-15`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -15 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T02:04:37.109000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f553fec6-e65f-41c6-9510-fbc7ae76ee6c":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-09-19T00:28:57.979Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`f553fec6-e65f-41c6-9510-fbc7ae76ee6c`,message_id:`1550636354260701286`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Metanfetamina`,quantity_change:-122},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Cocaína`,quantity_change:-201}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Metanfetamina**  \`-122\`
**Cocaína**  \`-201\`
​
​
🧾 Detalhes da movimentação
Metanfetamina
↳ -122 removidos
Cocaína
↳ -201 removidos`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Metanfetamina**  `-122`\n**Cocaína**  `-201`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Metanfetamina
↳ -122 removidos
Cocaína
↳ -201 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-09-18T22:35:16.049000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f562d6be-ba64-4407-ab94-e93edd236cc2":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-21T03:46:56.015Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f562d6be-ba64-4407-ab94-e93edd236cc2`,message_id:`1562311193350242376`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:19}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+19\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +19 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `+19`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ +19 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1562311193350242375`,timestamp:`2026-10-21T03:46:54.551000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f57bd9c8-8070-4e6f-9597-3d0c25139fc9":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-02T21:36:15.989Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`f57bd9c8-8070-4e6f-9597-3d0c25139fc9`,message_id:`1566928958644293705`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Cocaina`,quantity_change:-50}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`-50\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ -50 removidos`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Cocaína**  `-50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Cocaína
↳ -50 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566928958644293704`,timestamp:`2026-11-02T21:36:15.758000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f57e7ffa-d3b8-4da7-9c78-5fd640741bec":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-09-19T02:04:12.333Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`f57e7ffa-d3b8-4da7-9c78-5fd640741bec`,message_id:`test_cidade_alta_2254_1789783449116`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Barra Maciça`,quantity_change:-1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-16}],raw_content:`Andrew Delucca Ferreira • ID 274
📦 Baú
📊 Saldo líquido
Barra Maciça -1
Lockpick -16
🧾 Detalhes da movimentação
Barra Maciça
↳ -1 removido
Lockpick
↳ -16 removidos
Movimentações agrupadas em uma janela de 30 segundos • Hoje às 22:54`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},description:`📦 Baú

📊 Saldo líquido
Barra Maciça -1
Lockpick -16

🧾 Detalhes da movimentação
Barra Maciça
↳ -1 removido
Lockpick
↳ -16 removidos

Movimentações agrupadas em uma janela de 30 segundos • Hoje às 22:54`},status:`success`},"f591f476-2187-4292-a2aa-929ac835f942":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-29T23:41:45.997Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f591f476-2187-4292-a2aa-929ac835f942`,message_id:`1565510990500593875`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:-322},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:-1}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Submetralhadora**  \`-322\`
**MP5**  \`-1\`
​
​
🧾 Detalhes da movimentação
Munição Submetralhadora
↳ -322 removidos
MP5
↳ -1 removido`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Munição Submetralhadora**  `-322`\n**MP5**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Munição Submetralhadora
↳ -322 removidos
MP5
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565510990500593874`,timestamp:`2026-10-29T23:41:45.686000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f5b6adbf-2b1f-4d9d-b645-3ef43bb44fcc":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-28T15:59:55.832Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f5b6adbf-2b1f-4d9d-b645-3ef43bb44fcc`,message_id:`1565032377753796691`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`G36C Mk2`,quantity_change:-1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição Rifle`,quantity_change:-55}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`-1\`
**Munição Rifle**  \`-55\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ -1 removido
Munição Rifle
↳ -55 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**G36C Mk2**  `-1`\n**Munição Rifle**  `-55`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`G36C Mk2
↳ -1 removido
Munição Rifle
↳ -55 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565032377753796690`,timestamp:`2026-10-28T15:59:55.356000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f5b84abd-d1cb-4685-b9f8-49ad4bda70da":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-18T15:07:19.313Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f5b84abd-d1cb-4685-b9f8-49ad4bda70da`,message_id:`1561395259697537197`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-100},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:190}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-100\`
**Chapa de Metal**  \`+190\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -100 removidos
Chapa de Metal
↳ +190 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-100`\n**Chapa de Metal**  `+190`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -100 removidos
Chapa de Metal
↳ +190 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561395259697537196`,timestamp:`2026-10-18T15:07:19.002000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f5bfa3e4-d573-45f8-a6e0-c5d6c8c3edd3":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T03:10:56.561Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f5bfa3e4-d573-45f8-a6e0-c5d6c8c3edd3`,message_id:`1561471221600616600`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-400}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-400\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -400 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-400`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -400 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T20:09:09.762000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f5ddfb28-66b9-4210-84e6-922f3b7292e4":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-11-02T03:50:10.802Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f5ddfb28-66b9-4210-84e6-922f3b7292e4`,message_id:`1566660668357091380`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-16}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-16\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -16 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-16`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -16 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566660668357091379`,timestamp:`2026-11-02T03:50:10.374000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f5e6a13e-4daa-491a-aecc-dc09ee6f2581":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-13T21:22:45.219Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`f5e6a13e-4daa-491a-aecc-dc09ee6f2581`,message_id:`1559677800787480648`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-150}],raw_content:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-150\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -150 removidos`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-150`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -150 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1559677800787480647`,timestamp:`2026-10-13T21:22:44.842000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f645ee1a-02bb-470a-9b66-6ba804583e24":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-09-23T22:54:42.584Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`f645ee1a-02bb-470a-9b66-6ba804583e24`,message_id:`1552453181110222929`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`G36C Mk2`,quantity_change:1}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**G36C Mk2**  \`±0\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado · -1 removido`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**G36C Mk2**  `±0`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`G36C Mk2
↳ +1 adicionado · -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1552453181110222928`,timestamp:`2026-09-23T22:54:41.024000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f65a1f45-0194-436c-947c-dea8e423cc07":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T03:36:54.205Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f65a1f45-0194-436c-947c-dea8e423cc07`,message_id:`1565909369001082943`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:15}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +15 adicionados`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `+15`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ +15 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T02:04:46.610000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f6c7ef71-b13d-4281-ace6-f25b63e76eff":{author_name:`zeca`,channel_id:`1535637509818548234`,created_at:`2026-10-13T21:13:11.733Z`,game_player_id:`8393`,guild_id:`1535505650308620400`,id:`f6c7ef71-b13d-4281-ace6-f25b63e76eff`,message_id:`1559629413010768035`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Cocaina`,quantity_change:2},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Metanfetamina`,quantity_change:74}],raw_content:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`+2\`
**Metanfetamina**  \`+74\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ +2 adicionados
Metanfetamina
↳ +74 adicionados`,raw_embeds:{author:{name:`ZECA SLIM • ID 8393`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Cocaína**  `+2`\n**Metanfetamina**  `+74`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Cocaína
↳ +2 adicionados
Metanfetamina
↳ +74 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-13T18:10:28.351000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f7228fb1-3c75-468c-86c7-a3155a66f599":{author_name:`Malaca`,channel_id:`1535637509818548234`,created_at:`2026-10-30T22:26:24.900Z`,game_player_id:`5669`,guild_id:`1535505650308620400`,id:`f7228fb1-3c75-468c-86c7-a3155a66f599`,message_id:`1565854414785216712`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chip Ilegal`,quantity_change:-1}],raw_content:`
Malaca • ID 5669
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,raw_embeds:{author:{name:`Malaca • ID 5669`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chip Ilegal**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chip Ilegal
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565854412440735856`,timestamp:`2026-10-30T22:26:24.037000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f7250f52-21d1-4a25-98e8-f84021156f7b":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-31T00:00:58.859Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f7250f52-21d1-4a25-98e8-f84021156f7b`,message_id:`1565868906697064719`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:-10}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-10\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -10 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `-10`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ -10 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-30T23:23:59.649000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f73b67d1-a6ec-4a2b-be37-26d0ee84a1d1":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-29T05:05:11.105Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f73b67d1-a6ec-4a2b-be37-26d0ee84a1d1`,message_id:`1565186903890726973`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:-3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição de pistola`,quantity_change:-100}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-3\`
**Munição Pistola**  \`-100\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -3 removidos
Munição Pistola
↳ -100 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `-3`\n**Munição Pistola**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ -3 removidos
Munição Pistola
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-29T02:13:57.481000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f74824d9-8eca-4836-b0fb-20284abefd94":{author_name:`Medusa Toretto`,channel_id:`1535637509818548234`,created_at:`2026-09-19T02:57:06.183Z`,game_player_id:`6079`,guild_id:`1535505650308620400`,id:`f74824d9-8eca-4836-b0fb-20284abefd94`,message_id:`1550702242271723553`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:5}],raw_content:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+5\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +5 adicionados`,raw_embeds:{author:{name:`Medusa Toretto • ID 6079`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Hacking**  `+5`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Hacking
↳ +5 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1550702242271723552`,timestamp:`2026-09-19T02:57:05.067000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f7527fe7-7271-4b71-84f6-317c9b9668d8":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-30T22:58:22.875Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f7527fe7-7271-4b71-84f6-317c9b9668d8`,message_id:`1565728451242238023`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:-21}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-21\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -21 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `-21`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ -21 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-30T14:05:52.360000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f7813a98-8439-4a29-ace1-19f67d3e81bd":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-22T00:24:31.249Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f7813a98-8439-4a29-ace1-19f67d3e81bd`,message_id:`1562308147471716353`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-2}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-2\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -2 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-2`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -2 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-21T03:34:48.458000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f78385d2-4894-4818-a5b3-7dd3ceb3ecee":{author_name:`Cherryl Strauus • ID 10398`,channel_id:`1535637509818548234`,created_at:`2026-10-13T21:39:31.904Z`,game_player_id:`10398`,guild_id:`1535505650308620400`,id:`f78385d2-4894-4818-a5b3-7dd3ceb3ecee`,message_id:`1559641856252317882`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Taco de Beisebol`,quantity_change:1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Bandagem`,quantity_change:2},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:9}],raw_content:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Taco de Beisebol**  \`+1\`
**Bandagem**  \`+2\`
**Lockpick**  \`+9\`
​
​
🧾 Detalhes da movimentação
Taco de Beisebol
↳ +1 adicionado
Bandagem
↳ +2 adicionados
Lockpick
↳ +9 adicionados`,raw_embeds:{author:{name:`Cherryl Strauus • ID 10398`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Taco de Beisebol**  `+1`\n**Bandagem**  `+2`\n**Lockpick**  `+9`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Taco de Beisebol
↳ +1 adicionado
Bandagem
↳ +2 adicionados
Lockpick
↳ +9 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-13T18:59:55.077000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f78eafef-5c0c-4647-b94b-9cbd30af4d21":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T00:14:19.455Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f78eafef-5c0c-4647-b94b-9cbd30af4d21`,message_id:`1561469784745312389`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:50}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +50 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `+50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ +50 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T20:03:27.133000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f7918758-3f33-48e9-bb6b-21a58829c092":{author_name:`JOAO SK`,channel_id:`1535637509818548234`,created_at:`2026-10-19T18:23:23.914Z`,game_player_id:`897`,guild_id:`1535505650308620400`,id:`f7918758-3f33-48e9-bb6b-21a58829c092`,message_id:`1561806991943405609`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Glock 19`,quantity_change:-1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição de pistola`,quantity_change:-50}],raw_content:`
joao sk ford • ID 897
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Glock 19**  \`-1\`
**Munição Pistola**  \`-50\`
​
​
🧾 Detalhes da movimentação
Glock 19
↳ -1 removido
Munição Pistola
↳ -50 removidos`,raw_embeds:{author:{name:`joao sk ford • ID 897`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Glock 19**  `-1`\n**Munição Pistola**  `-50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Glock 19
↳ -1 removido
Munição Pistola
↳ -50 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561806991943405608`,timestamp:`2026-10-19T18:23:23.663000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f7a6827a-970c-48ea-8d47-f7756c88d797":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-03T19:53:00.193Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`f7a6827a-970c-48ea-8d47-f7756c88d797`,message_id:`1567167804380024895`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Maconha`,quantity_change:-100}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`-100\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ -100 removidos`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Maconha**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Maconha
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T13:25:20.953000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f800f61d-f61e-4ed8-8b6e-d2e95b7d9598":{author_name:`Vanynho • ID 8359`,channel_id:`1535637509818548234`,created_at:`2026-10-19T20:48:43.390Z`,game_player_id:`8359`,guild_id:`1535505650308620400`,id:`f800f61d-f61e-4ed8-8b6e-d2e95b7d9598`,message_id:`1561843563614961686`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-25}],raw_content:`
Vanynho • ID 8359
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-25\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -25 removidos`,raw_embeds:{author:{name:`Vanynho • ID 8359`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-25`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -25 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561843563614961685`,timestamp:`2026-10-19T20:48:43.080000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f84cb619-24f6-4b5f-92d8-b3079dd8b69f":{author_name:`zeca`,channel_id:`1535637509818548234`,created_at:`2026-10-13T19:34:50.320Z`,game_player_id:`8393`,guild_id:`1535505650308620400`,id:`f84cb619-24f6-4b5f-92d8-b3079dd8b69f`,message_id:`1559621150311579720`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Cocaina`,quantity_change:-67},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Metanfetamina`,quantity_change:-132}],raw_content:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`-67\`
**Metanfetamina**  \`-132\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ -67 removidos
Metanfetamina
↳ -132 removidos`,raw_embeds:{author:{name:`ZECA SLIM • ID 8393`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Cocaína**  `-67`\n**Metanfetamina**  `-132`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Cocaína
↳ -67 removidos
Metanfetamina
↳ -132 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-13T17:37:38.440000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f85da02f-d331-4709-b2ca-8957cd52f4be":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-28T01:35:45.657Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f85da02f-d331-4709-b2ca-8957cd52f4be`,message_id:`1564814902214918298`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-5}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-5\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -5 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-5`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -5 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1564814902214918297`,timestamp:`2026-10-28T01:35:45.327000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f8941e0b-fb58-4e47-a12d-4c4f3747c88b":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-15T16:49:28.382Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f8941e0b-fb58-4e47-a12d-4c4f3747c88b`,message_id:`1560333803094810708`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:-11}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Algemas**  \`-11\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -11 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `-11`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ -11 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560333803094810707`,timestamp:`2026-10-15T16:49:28.028000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f8a6077d-36c1-4a86-b037-b2469289a166":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-11-01T02:51:59.415Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f8a6077d-36c1-4a86-b037-b2469289a166`,message_id:`1566283637530431569`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-350}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-350\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -350 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-350`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -350 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566283636381061260`,timestamp:`2026-11-01T02:51:58.446000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f8d524e8-7332-4995-ac0e-3b309dcdca58":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T01:00:34.117Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f8d524e8-7332-4995-ac0e-3b309dcdca58`,message_id:`1561525613389418497`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:2},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:304},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Plano de Segurança`,quantity_change:-3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Missão`,quantity_change:-1}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+304\`
**Plano de Segurança**  \`-3\`
**Missão**  \`-1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MP5**  `+2`\n**Munição Submetralhadora**  `+304`\n**Plano de Segurança**  `-3`\n**Missão**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T23:45:17.820000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f8e12aaa-507f-4b8d-b1a9-aa4964c0b982":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T18:55:07.229Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f8e12aaa-507f-4b8d-b1a9-aa4964c0b982`,message_id:`1561814974928527381`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:435},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:2},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-12}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Submetralhadora**  \`+435\`
**MP5**  \`+2\`
**Lockpick**  \`-12\`
​
​
🧾 Detalhes da movimentação
Munição Submetralhadora
↳ +435 adicionados
MP5
↳ +2 adicionados
Lockpick
↳ -12 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Munição Submetralhadora**  `+435`\n**MP5**  `+2`\n**Lockpick**  `-12`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Munição Submetralhadora
↳ +435 adicionados
MP5
↳ +2 adicionados
Lockpick
↳ -12 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561814974928527380`,timestamp:`2026-10-19T18:55:06.872000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f8f69ebe-ae6d-4252-b0a2-a2ab9c642c51":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-18T15:09:16.569Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f8f69ebe-ae6d-4252-b0a2-a2ab9c642c51`,message_id:`1561395751504973985`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:100}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`±0\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +100 adicionados · -100 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `±0`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ +100 adicionados · -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561395751504973984`,timestamp:`2026-10-18T15:09:16.282000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f90070d0-e0ad-4158-bb86-fe0b647ab038":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-29T02:08:39.142Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f90070d0-e0ad-4158-bb86-fe0b647ab038`,message_id:`1565185567409574090`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:990}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+990\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +990 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `+990`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +990 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565185567409574089`,timestamp:`2026-10-29T02:08:38.295000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f9149ec8-91ad-4815-9dfc-d0dc1a2fe486":{author_name:`JOAO SK`,channel_id:`1535637509818548234`,created_at:`2026-10-21T03:28:10.919Z`,game_player_id:`897`,guild_id:`1535505650308620400`,id:`f9149ec8-91ad-4815-9dfc-d0dc1a2fe486`,message_id:`1562306478910734337`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Placa Falsa`,quantity_change:-1}],raw_content:`
joao sk ford • ID 897
📦 Baú
​
📊 Saldo líquido
**Placa Falsa**  \`-1\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -1 removido`,raw_embeds:{author:{name:`joao sk ford • ID 897`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Placa Falsa**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Placa Falsa
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1562306478910734336`,timestamp:`2026-10-21T03:28:10.640000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f914f97e-748b-4d76-ad93-6ea94ab4d857":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-23T01:12:27.987Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f914f97e-748b-4d76-ad93-6ea94ab4d857`,message_id:`1562984900733308999`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:474}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+474\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1881 adicionados · -1407 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `+474`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +1881 adicionados · -1407 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-23T00:23:58.993000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f921f9a8-5b78-4752-b0cc-36f8bffa06c5":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-11-02T03:23:29.134Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f921f9a8-5b78-4752-b0cc-36f8bffa06c5`,message_id:`1566653950999134239`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:1782}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Chapa de Metal**  \`+1782\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1782 adicionados`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `+1782`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +1782 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566653950999134238`,timestamp:`2026-11-02T03:23:28.760000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f92ae954-ea4c-4477-84bc-ad970d343f12":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-14T22:22:18.416Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f92ae954-ea4c-4477-84bc-ad970d343f12`,message_id:`1560055175727554622`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-50},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Metanfetamina`,quantity_change:-97}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-50\`
**Metanfetamina**  \`-97\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -50 removidos
Metanfetamina
↳ -97 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-50`\n**Metanfetamina**  `-97`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -50 removidos
Metanfetamina
↳ -97 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560055175727554621`,timestamp:`2026-10-14T22:22:18.015000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f93ea512-67d6-4d08-986d-3995359408e9":{author_name:`Rebarba Allecrim BomBom • ID 5372`,channel_id:`1535637509818548234`,created_at:`2026-10-18T04:36:15.350Z`,game_player_id:`5372`,guild_id:`1535505650308620400`,id:`f93ea512-67d6-4d08-986d-3995359408e9`,message_id:`1561236445908308051`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chip Ilegal`,quantity_change:-1}],raw_content:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,raw_embeds:{author:{name:`Rebarba Allecrim BomBom • ID 5372`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chip Ilegal**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chip Ilegal
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561236445908308050`,timestamp:`2026-10-18T04:36:14.950000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f943c59e-ec39-4148-bbcb-8d65ec02cd97":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-25T18:05:16.877Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f943c59e-ec39-4148-bbcb-8d65ec02cd97`,message_id:`1563915202511118357`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Thermite`,quantity_change:25},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Placa Falsa`,quantity_change:100}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Thermite**  \`+25\`
**Placa Falsa**  \`+100\`
​
​
🧾 Detalhes da movimentação
Thermite
↳ +25 adicionados
Placa Falsa
↳ +100 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Thermite**  `+25`\n**Placa Falsa**  `+100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Thermite
↳ +25 adicionados
Placa Falsa
↳ +100 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-25T14:00:40.206000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f99342a4-c916-47d9-93ac-a7997892b515":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T05:28:39.374Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f99342a4-c916-47d9-93ac-a7997892b515`,message_id:`1565909192592859247`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Kit de Reparo Avançado`,quantity_change:5},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-200}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Kit de Reparo Avançado**  \`+5\`
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Kit de Reparo Avançado
↳ +5 adicionados
Lockpick
↳ -200 removidos`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Kit de Reparo Avançado**  `+5`\n**Lockpick**  `-200`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Kit de Reparo Avançado
↳ +5 adicionados
Lockpick
↳ -200 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T02:04:04.485000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f9963110-e070-4841-be3b-0d59f94b6201":{author_name:`Rebarba Allecrim BomBom • ID 5372`,channel_id:`1535637509818548234`,created_at:`2026-10-31T01:52:04.323Z`,game_player_id:`5372`,guild_id:`1535505650308620400`,id:`f9963110-e070-4841-be3b-0d59f94b6201`,message_id:`1565906170240049232`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Maconha`,quantity_change:-1}],raw_content:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`-1\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ -1 removido`,raw_embeds:{author:{name:`Rebarba Allecrim BomBom • ID 5372`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Maconha**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Maconha
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565906169812484157`,timestamp:`2026-10-31T01:52:03.959000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f9b3fbf9-7e46-41b1-a143-d94f86ebbbf8":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-03T19:52:35.924Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`f9b3fbf9-7e46-41b1-a143-d94f86ebbbf8`,message_id:`1567159648618815590`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Cocaina`,quantity_change:-100}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`-100\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ -100 removidos`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Cocaína**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Cocaína
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T12:52:56.394000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f9d27416-e86d-4f55-a8cc-69b12aa19e3d":{author_name:`Medusa Toretto`,channel_id:`1535637509818548234`,created_at:`2026-11-02T04:42:12.285Z`,game_player_id:`6079`,guild_id:`1535505650308620400`,id:`f9d27416-e86d-4f55-a8cc-69b12aa19e3d`,message_id:`1566673761087004683`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-50},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-30}],raw_content:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-50\`
**Explosivo C4**  \`-30\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -50 removidos
Explosivo C4
↳ -30 removidos`,raw_embeds:{author:{name:`Medusa Toretto • ID 6079`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-50`\n**Explosivo C4**  `-30`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -50 removidos
Explosivo C4
↳ -30 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566673761087004682`,timestamp:`2026-11-02T04:42:11.910000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"f9d34488-3007-4a97-b4bf-2cccec857cdc":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-23T00:24:34.270Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`f9d34488-3007-4a97-b4bf-2cccec857cdc`,message_id:`1562985047538016307`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:99}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+99\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +99 adicionados`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `+99`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +99 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1562985047538016306`,timestamp:`2026-10-23T00:24:34.029000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"f9de5d4b-311b-4cd0-99fd-9064ba18f7d1":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-11-02T16:49:07.655Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`f9de5d4b-311b-4cd0-99fd-9064ba18f7d1`,message_id:`1566856698038190203`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chapa de Metal`,quantity_change:-29}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-29\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +990 adicionados · -1019 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chapa de Metal**  `-29`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chapa de Metal
↳ +990 adicionados · -1019 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566856698038190202`,timestamp:`2026-11-02T16:49:07.349000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"fa19f1dc-d5c7-4645-a897-9ea93a48f94c":{author_name:`Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-19T18:20:38.604Z`,game_player_id:`494`,guild_id:`1535505650308620400`,id:`fa19f1dc-d5c7-4645-a897-9ea93a48f94c`,message_id:`1561806298511708172`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Esmerilhadeira`,quantity_change:1}],raw_content:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Esmerilhadeira**  \`+1\`
​
​
🧾 Detalhes da movimentação
Esmerilhadeira
↳ +1 adicionado`,raw_embeds:{author:{name:`Metthews Toretto Ortega • ID 494`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Esmerilhadeira**  `+1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Esmerilhadeira
↳ +1 adicionado`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561806298511708170`,timestamp:`2026-10-19T18:20:38.344000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fa3b963a-f05a-46c9-8255-bdf018fc5ba2":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-23T01:29:02.454Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`fa3b963a-f05a-46c9-8255-bdf018fc5ba2`,message_id:`1563001271362003066`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-10}],raw_content:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -10 removidos`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-10`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -10 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1563001271362003065`,timestamp:`2026-10-23T01:29:01.997000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fa4a1db7-8d0b-42a4-a801-855fea0c9fb8":{author_name:`Paquetá Stifler • ID 204`,channel_id:`1535637509818548234`,created_at:`2026-10-26T20:54:01.262Z`,game_player_id:`204`,guild_id:`1535505650308620400`,id:`fa4a1db7-8d0b-42a4-a801-855fea0c9fb8`,message_id:`1564381611372322897`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Silent Bypass`,quantity_change:-1}],raw_content:`
Paquetá Stifler • ID 204
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-3\`
**Silent Bypass**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -3 removidos
Silent Bypass
↳ -1 removido`,raw_embeds:{author:{name:`Paquetá Stifler • ID 204`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-3`\n**Silent Bypass**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -3 removidos
Silent Bypass
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1564381611372322896`,timestamp:`2026-10-26T20:54:00.747000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fab43dce-8d18-4bd9-9d93-a472d35b71c1":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-03T19:52:59.504Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`fab43dce-8d18-4bd9-9d93-a472d35b71c1`,message_id:`1567159677194739726`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Metanfetamina`,quantity_change:-100}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Metanfetamina**  \`-100\`
​
​
🧾 Detalhes da movimentação
Metanfetamina
↳ -100 removidos`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Metanfetamina**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Metanfetamina
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T12:53:03.396000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"faca920a-fbb2-447a-9b8c-b9d67a5ae50e":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-18T14:43:00.792Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`faca920a-fbb2-447a-9b8c-b9d67a5ae50e`,message_id:`1561389141416087694`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chip Ilegal`,quantity_change:8},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:20}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`+8\`
**Hacking**  \`+20\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ +8 adicionados
Hacking
↳ +20 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chip Ilegal**  `+8`\n**Hacking**  `+20`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chip Ilegal
↳ +8 adicionados
Hacking
↳ +20 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561389141416087693`,timestamp:`2026-10-18T14:43:00.284000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fae4cc8b-9383-4f13-81a2-a04be263fd3c":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-10-18T11:14:48.560Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`fae4cc8b-9383-4f13-81a2-a04be263fd3c`,message_id:`1561231890864672770`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Dinheiro Marcado`,quantity_change:-10740},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-15},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Placa Falsa`,quantity_change:-1}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Dinheiro Marcado**  \`-10740\`
**Lockpick**  \`-15\`
**Placa Falsa**  \`-1\`
​
​
🧾 Detalhes da movimentação
Dinheiro Marcado
↳ -10740 removidos
Lockpick
↳ -15 removidos
Placa Falsa
↳ -1 removido`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Dinheiro Marcado**  `-10740`\n**Lockpick**  `-15`\n**Placa Falsa**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Dinheiro Marcado
↳ -10740 removidos
Lockpick
↳ -15 removidos
Placa Falsa
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T04:18:08.926000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fae6fabd-86fa-4a52-bfed-ab4a51f9545d":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-29T05:45:10.984Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`fae6fabd-86fa-4a52-bfed-ab4a51f9545d`,message_id:`1565186903890726973`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Algemas`,quantity_change:-3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição de pistola`,quantity_change:-100}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-3\`
**Munição Pistola**  \`-100\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -3 removidos
Munição Pistola
↳ -100 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Algemas**  `-3`\n**Munição Pistola**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Algemas
↳ -3 removidos
Munição Pistola
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-29T02:13:57.481000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fb1c40d1-fb31-4a82-8987-bc69a81d1cc5":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-24T01:24:41.387Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`fb1c40d1-fb31-4a82-8987-bc69a81d1cc5`,message_id:`1563334961841315933`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`FN Five Seven`,quantity_change:1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição de pistola`,quantity_change:58}],raw_content:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`+1\`
**Munição Pistola**  \`+58\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ +1 adicionado
Munição Pistola
↳ +58 adicionados`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**FN Five Seven**  `+1`\n**Munição Pistola**  `+58`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`FN Five Seven
↳ +1 adicionado
Munição Pistola
↳ +58 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-23T23:34:59.861000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"fb753e8d-cf4e-4268-8967-7af62f9a961e":{author_name:`Medusa Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T05:29:10.839Z`,game_player_id:`6079`,guild_id:`1535505650308620400`,id:`fb753e8d-cf4e-4268-8967-7af62f9a961e`,message_id:`1565932152573395107`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Chip Ilegal`,quantity_change:-1}],raw_content:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,raw_embeds:{author:{name:`Medusa Toretto • ID 6079`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Chip Ilegal**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Chip Ilegal
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-31T03:35:18.638000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fbb69ada-6b56-4c18-aece-a25bae98a832":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T18:44:28.896Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`fbb69ada-6b56-4c18-aece-a25bae98a832`,message_id:`1561812297469665302`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Hacking`,quantity_change:-1},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Kit Médico`,quantity_change:-2},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Bandagem`,quantity_change:-5}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Hacking**  \`-1\`
**Kit Médico**  \`-2\`
**Bandagem**  \`-5\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -1 removido
Kit Médico
↳ -2 removidos
Bandagem
↳ -5 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Hacking**  `-1`\n**Kit Médico**  `-2`\n**Bandagem**  `-5`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Hacking
↳ -1 removido
Kit Médico
↳ -2 removidos
Bandagem
↳ -5 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561812297469665301`,timestamp:`2026-10-19T18:44:28.642000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"fbe0fcc9-ee43-4575-a271-1d3b18d8518a":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-15T03:27:14.036Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`fbe0fcc9-ee43-4575-a271-1d3b18d8518a`,message_id:`1560131912247418953`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:-3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:-150}],raw_content:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`-3\`
**Munição Submetralhadora**  \`-150\`
​
​
🧾 Detalhes da movimentação
MP5
↳ -3 removidos
Munição Submetralhadora
↳ -150 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MP5**  `-3`\n**Munição Submetralhadora**  `-150`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MP5
↳ -3 removidos
Munição Submetralhadora
↳ -150 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1560131912247418952`,timestamp:`2026-10-15T03:27:13.609000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"fc028791-bbb7-4065-87ce-394a51f0f0a5":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-03T18:59:51.595Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`fc028791-bbb7-4065-87ce-394a51f0f0a5`,message_id:`1567159622958321877`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Maconha`,quantity_change:-100}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`-100\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ -100 removidos`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Maconha**  `-100`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Maconha
↳ -100 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T12:52:50.393000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fc958593-87d1-499a-888f-134192bc9f22":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-03T18:59:54.058Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`fc958593-87d1-499a-888f-134192bc9f22`,message_id:`1567178529395708006`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Maconha`,quantity_change:1}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`+1\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +1 adicionado`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Maconha**  `+1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Maconha
↳ +1 adicionado`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T14:07:58.091000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fd4b5a6b-e85e-4e20-bd94-0b96ebf62f8a":{author_name:`Rebarba Allecrim BomBom • ID 5372`,channel_id:`1535637509818548234`,created_at:`2026-11-03T18:08:18.388Z`,game_player_id:`5372`,guild_id:`1535505650308620400`,id:`fd4b5a6b-e85e-4e20-bd94-0b96ebf62f8a`,message_id:`1567228863677726742`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-50}],raw_content:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-50\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -50 removidos`,raw_embeds:{author:{name:`Rebarba Allecrim BomBom • ID 5372`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -50 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-11-03T17:27:58.645000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fda6cd70-085f-4f82-a024-d39402c2afd3":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T03:10:56.912Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`fda6cd70-085f-4f82-a024-d39402c2afd3`,message_id:`1561471459526971515`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:50}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+50\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +50 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `+50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ +50 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T20:10:06.498000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fde4d853-3c4b-4c60-8670-0704b8121a5b":{author_name:`Medusa Toretto`,channel_id:`1535637509818548234`,created_at:`2026-10-31T04:18:14.337Z`,game_player_id:`6079`,guild_id:`1535505650308620400`,id:`fde4d853-3c4b-4c60-8670-0704b8121a5b`,message_id:`1565942954802290729`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-6}],raw_content:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-6\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -6 removidos`,raw_embeds:{author:{name:`Medusa Toretto • ID 6079`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `-6`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ -6 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1565942954802290728`,timestamp:`2026-10-31T04:18:13.919000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fde55696-7bc6-411b-be55-eef1175b7816":{author_name:`Andrew Delucca Ferreira`,channel_id:`1535637509818548234`,created_at:`2026-10-18T04:18:09.149Z`,game_player_id:`274`,guild_id:`1535505650308620400`,id:`fde55696-7bc6-411b-be55-eef1175b7816`,message_id:`1561231890864672770`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Dinheiro Marcado`,quantity_change:-10740},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:-15},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Placa Falsa`,quantity_change:-1}],raw_content:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Dinheiro Marcado**  \`-10740\`
**Lockpick**  \`-15\`
**Placa Falsa**  \`-1\`
​
​
🧾 Detalhes da movimentação
Dinheiro Marcado
↳ -10740 removidos
Lockpick
↳ -15 removidos
Placa Falsa
↳ -1 removido`,raw_embeds:{author:{name:`Andrew Delucca Ferreira • ID 274`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Dinheiro Marcado**  `-10740`\n**Lockpick**  `-15`\n**Placa Falsa**  `-1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Dinheiro Marcado
↳ -10740 removidos
Lockpick
↳ -15 removidos
Placa Falsa
↳ -1 removido`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1561231890864672768`,timestamp:`2026-10-18T04:18:08.926000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fdebe48e-2cc2-4168-a1e2-7a63ed657268":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-13T21:30:28.888Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`fdebe48e-2cc2-4168-a1e2-7a63ed657268`,message_id:`1559679745610747916`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`C4`,quantity_change:-5}],raw_content:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-5\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -5 removidos`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Explosivo C4**  `-5`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Explosivo C4
↳ -5 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1559679745610747914`,timestamp:`2026-10-13T21:30:28.597000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"fe1958ff-436c-4f7a-8579-6f42f4857f7f":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T03:28:11.241Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`fe1958ff-436c-4f7a-8579-6f42f4857f7f`,message_id:`1561471459526971515`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`LockPick`,quantity_change:50}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+50\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +50 adicionados`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Lockpick**  `+50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Lockpick
↳ +50 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T20:10:06.498000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"feeacf78-922c-4e35-b882-ebc7fa09fa24":{author_name:`lennon dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-19T03:10:58.183Z`,game_player_id:`655`,guild_id:`1535505650308620400`,id:`feeacf78-922c-4e35-b882-ebc7fa09fa24`,message_id:`1561523124405801086`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`MP5`,quantity_change:3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Munição SUB`,quantity_change:152},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Plano de Segurança`,quantity_change:3},{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Missão`,quantity_change:1}],raw_content:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,raw_embeds:{author:{name:`lennon will dacoro • ID 655`},color:14920734,content_scan_version:4,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**MP5**  `+3`\n**Munição Submetralhadora**  `+152`\n**Plano de Segurança**  `+3`\n**Missão**  `+1`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},timestamp:`2026-10-18T23:35:24.399000+00:00`,title:`📦 Mesa de Trabalho`,type:`rich`},status:`success`},"ff32ca69-9940-4c28-9ee7-c4a75b8cbe53":{author_name:`Mindy Leclerc • ID 1010`,channel_id:`1535637509818548234`,created_at:`2026-11-02T17:34:25.864Z`,game_player_id:`1010`,guild_id:`1535505650308620400`,id:`ff32ca69-9940-4c28-9ee7-c4a75b8cbe53`,message_id:`1566868098823491816`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Maconha`,quantity_change:50}],raw_content:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`+50\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +50 adicionados`,raw_embeds:{author:{name:`Mindy Leclerc • ID 1010`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Maconha**  `+50`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Maconha
↳ +50 adicionados`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566868098823491815`,timestamp:`2026-11-02T17:34:25.593000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`},"ffc7e6f6-f74f-4c38-94c8-4445b04c2d70":{author_name:`Macaé Dacoro`,channel_id:`1535637509818548234`,created_at:`2026-10-31T09:15:30.776Z`,game_player_id:`590`,guild_id:`1535505650308620400`,id:`ffc7e6f6-f74f-4c38-94c8-4445b04c2d70`,message_id:`1566017766388146187`,parsed_items:[{bau_name:`BAÚ QG`,is_transfer:!1,item_name:`Kit de Reparo Avançado`,quantity_change:-2}],raw_content:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Kit de Reparo Avançado**  \`-2\`
​
​
🧾 Detalhes da movimentação
Kit de Reparo Avançado
↳ -2 removidos`,raw_embeds:{author:{name:`Macaé Dacoro • ID 590`},color:14920734,content_scan_version:0,description:`​`,fields:[{inline:!1,name:`📊 Saldo líquido`,value:"**Kit de Reparo Avançado**  `-2`"},{inline:!1,name:`​`,value:`​`},{inline:!1,name:`🧾 Detalhes da movimentação`,value:`Kit de Reparo Avançado
↳ -2 removidos`}],footer:{text:`Movimentações agrupadas em uma janela de 30 segundos`},id:`1566017766388146186`,timestamp:`2026-10-31T09:15:30.517000+00:00`,title:`📦 Baú`,type:`rich`},status:`success`}},entregas_metas:{gsub_1788577336958_j6e6u:{amount:38e3,created_at:`2026-09-05T03:02:16.958Z`,delivered_at:`2026-09-05T06:01:00.000Z`,goal_id:`wgoal_1788577280632_qsx4q`,goal_title:`Meta Semanal - Teste Desenvolvedor`,id:`gsub_1788577336958_j6e6u`,member_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,member_name:`Developers`,member_nickname:`Dev`,member_role:`membro`,proof_url:`data:image/png;base64,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`,receiver_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png?size=512`,receiver_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,receiver_name:`Malaca`,receiver_role:`membro`,reviewed_at:`2026-09-05T03:05:01.373Z`,reviewed_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,reviewed_by_name:`Malaca`,status:`aprovado`,unit_name:`R$`,updated_at:`2026-09-05T03:05:01.373Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},gsub_1789820424596_7tdqu:{amount:29e3,created_at:`2026-09-19T12:20:24.596Z`,delivered_at:`2026-09-19T15:18:00.000Z`,goal_id:`goal_default_1789820318555`,goal_title:`Meta Semanal Operacional`,id:`gsub_1789820424596_7tdqu`,member_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,member_name:`Malaca`,member_role:`membro`,receiver_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,receiver_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,receiver_name:`Dev`,receiver_role:`membro`,reviewed_at:`2026-09-19T12:21:40.957Z`,reviewed_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,reviewed_by_name:`Malaca`,status:`aprovado`,unit_name:`R$`,updated_at:`2026-09-19T12:21:40.957Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`}},goal_submissions:{gsub_1788481127067_lc:{amount:5e4,created_at:`2026-09-04T11:12:12.000Z`,delivered_at:`2026-09-04T11:12:12.000Z`,goal_id:`goal_default_1788481127067`,goal_title:`Meta Semanal Operacional - 01 LC`,id:`gsub_1788481127067_lc`,member_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,member_name:`Andrew Delucca Ferreira`,member_nickname:`01 LC`,member_role:`01`,notes:`Contribuição semanal própria de liderança 01 LC.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-09-04T11:15:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},gsub_1788481127067_medusa:{amount:5e4,created_at:`2026-09-06T14:20:55.000Z`,delivered_at:`2026-09-06T14:20:55.000Z`,goal_id:`goal_default_1788481127067`,goal_title:`Meta Semanal Operacional - 01 LC`,id:`gsub_1788481127067_medusa`,member_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,member_name:`Medusa Toretto`,member_nickname:`Medusa`,member_role:`gerente`,notes:`Pagamento de meta semanal da gerência para 01 LC.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-09-06T14:25:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},gsub_1788481127067_toretto:{amount:5e4,created_at:`2026-09-03T02:07:29.000Z`,delivered_at:`2026-09-03T02:07:29.000Z`,goal_id:`goal_default_1788481127067`,goal_title:`Meta Semanal Operacional - 01 LC`,id:`gsub_1788481127067_toretto`,member_avatar:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png?size=512`,member_name:`Toretto`,member_role:`02`,notes:`Pagamento de meta semanal efetuado e entregue para 01 LC (registro de caixa).`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-09-03T02:10:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},gsub_oct_aisson:{amount:5e4,created_at:`2026-10-13T19:30:00.000Z`,delivered_at:`2026-10-13T19:30:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_aisson`,member_avatar:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png?size=512`,member_name:`Aisson da vila`,member_nickname:`da vila`,member_role:`membro`,notes:`Meta semanal entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T19:35:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},gsub_oct_boateiro:{amount:5e4,created_at:`2026-10-13T18:00:00.000Z`,delivered_at:`2026-10-13T18:00:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_boateiro`,member_avatar:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png?size=512`,member_name:`Boateiro Perick`,member_nickname:`Gaúcho`,member_role:`motoqueiro`,notes:`Meta semanal paga com sucesso.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T18:05:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},gsub_oct_kaim:{amount:5e4,created_at:`2026-10-13T15:25:00.000Z`,delivered_at:`2026-10-13T15:25:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_kaim`,member_avatar:`https://cdn.discordapp.com/avatars/622074568248393749/b51cce5fe8cac229077cdd25ebc301eb.png?size=512`,member_name:`KAIM FOSTER`,member_nickname:`KAIM`,member_role:`membro`,notes:`Meta semanal 100% entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T15:30:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},gsub_oct_lc:{amount:5e4,created_at:`2026-10-12T16:00:00.000Z`,delivered_at:`2026-10-12T16:00:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_lc`,member_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,member_name:`Andrew Delucca Ferreira`,member_nickname:`01 LC`,member_role:`01`,notes:`Contribuição semanal de liderança 01 LC.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-12T16:05:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},gsub_oct_lennon:{amount:5e4,created_at:`2026-10-13T16:00:00.000Z`,delivered_at:`2026-10-13T16:00:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_lennon`,member_avatar:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,member_name:`lennon dacoro`,member_nickname:`lennon`,member_role:`gerente`,notes:`Meta semanal quitada.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T16:05:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},gsub_oct_macae:{amount:5e4,created_at:`2026-10-13T17:15:00.000Z`,delivered_at:`2026-10-13T17:15:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_macae`,member_avatar:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png?size=512`,member_name:`Macaé Dacoro`,member_nickname:`Macaé`,member_role:`gerente`,notes:`Meta de outubro entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T17:20:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},gsub_oct_medusa:{amount:5e4,created_at:`2026-10-13T11:45:00.000Z`,delivered_at:`2026-10-13T11:45:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_medusa`,member_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,member_name:`Medusa Toretto`,member_nickname:`Medusa`,member_role:`gerente`,notes:`Entrega de meta semanal gerência paga.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T11:50:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},gsub_oct_sk:{amount:5e4,created_at:`2026-10-13T14:10:00.000Z`,delivered_at:`2026-10-13T14:10:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_sk`,member_avatar:`https://cdn.discordapp.com/avatars/815425543998668860/b974de8cf7b86f95dec282cb7180d087.png?size=512`,member_name:`JOAO SK`,member_nickname:`SK`,member_role:`gerente`,notes:`Meta semanal cumprida.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T14:15:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},gsub_oct_toretto:{amount:5e4,created_at:`2026-10-12T14:30:00.000Z`,delivered_at:`2026-10-12T14:30:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_toretto`,member_avatar:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png?size=512`,member_name:`Toretto`,member_role:`02`,notes:`Meta semanal de outubro paga.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-12T14:35:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},gsub_oct_zeca:{amount:5e4,created_at:`2026-10-13T18:45:00.000Z`,delivered_at:`2026-10-13T18:45:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_zeca`,member_avatar:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png?size=512`,member_name:`zeca`,member_nickname:`zeca`,member_role:`membro`,notes:`Meta semanal entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T18:50:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`}},goals:{goal_default_1788481127067:{created_at:`2026-09-04T00:18:47.067Z`,created_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,created_by_name:`01 LC (Andrew Delucca Ferreira)`,description:`Meta semanal operacional de liderança criada pelo 01 LC para arrecadação da família.`,id:`goal_default_1788481127067`,is_active:!1,period_end:`2026-09-07`,period_start:`2026-09-01`,scope:`todos`,target_role:`membro`,target_value:5e4,title:`Meta Semanal Operacional - 01 LC`,type:`financeiro`,unit_name:`R$`,updated_at:`2026-10-14T08:18:51.133Z`}},insignias:{falcao_vigia:{active:!0,bg_color:`rgba(251, 146, 60, 0.15)`,border_color:`rgba(251, 146, 60, 0.35)`,category:`seguranca`,color:`#fb923c`,created_at:`2026-10-13T19:27:19.280Z`,description:`Dedicação contínua na vigilância e inteligência de território.`,icon:`Eye`,id:`falcao_vigia`,name:`Falcão da Guarda`,rarity:`epico`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:350},guardiao_bau:{active:!0,bg_color:`rgba(56, 189, 248, 0.15)`,border_color:`rgba(56, 189, 248, 0.35)`,category:`logistica`,color:`#38bdf8`,created_at:`2026-10-13T19:27:19.280Z`,description:`Auditoria exemplar e zelo constante pelo patrimônio e baús do grupo.`,icon:`Boxes`,id:`guardiao_bau`,name:`Guardião do Depósito`,rarity:`comum`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:50},iniciacao_asfalto:{active:!0,bg_color:`rgba(148, 163, 184, 0.15)`,border_color:`rgba(148, 163, 184, 0.35)`,category:`honra`,color:`#94a3b8`,created_at:`2026-10-13T19:27:19.280Z`,description:`Integrado oficialmente às operações da Twin Wheels.`,icon:`Shield`,id:`iniciacao_asfalto`,name:`Iniciação no Asfalto`,rarity:`comum`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:0},lideranca_suprema:{active:!0,bg_color:`rgba(244, 63, 94, 0.15)`,border_color:`rgba(244, 63, 94, 0.35)`,category:`lideranca`,color:`#f43f5e`,created_at:`2026-10-13T19:27:19.280Z`,description:`Comando executivo respeitado, mentor de novos talentos e guia operacional.`,icon:`Crown`,id:`lideranca_suprema`,name:`Liderança Suprema`,rarity:`lendario`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:500},mestre_logistica:{active:!0,bg_color:`rgba(168, 85, 247, 0.15)`,border_color:`rgba(168, 85, 247, 0.35)`,category:`logistica`,color:`#a855f7`,created_at:`2026-10-13T19:27:19.280Z`,description:`Eficiência impecável na cadeia de suprimentos e transporte blindado.`,icon:`Truck`,id:`mestre_logistica`,name:`Mestre da Logística`,rarity:`epico`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:250},mito_twin_wheels:{active:!0,bg_color:`rgba(232, 121, 249, 0.15)`,border_color:`rgba(232, 121, 249, 0.35)`,category:`honra`,color:`#e879f9`,created_at:`2026-10-13T19:27:19.280Z`,description:`Distinção máxima concedida a pilares inquestionáveis da história do grupo.`,icon:`Sparkles`,id:`mito_twin_wheels`,name:`Mito Twin Wheels`,rarity:`mitico`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:1e3},negociador_ouro:{active:!0,bg_color:`rgba(250, 204, 21, 0.15)`,border_color:`rgba(250, 204, 21, 0.35)`,category:`vendas`,color:`#facc15`,created_at:`2026-10-13T19:27:19.280Z`,description:`Fechamento de acordos comerciais de grande vulto para a facção.`,icon:`DollarSign`,id:`negociador_ouro`,name:`Negociador de Ouro`,rarity:`raro`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:150},operador_tatica:{active:!0,bg_color:`rgba(52, 211, 153, 0.15)`,border_color:`rgba(52, 211, 153, 0.35)`,category:`operacoes`,color:`#34d399`,created_at:`2026-10-13T19:27:19.280Z`,description:`Disciplina máxima e precisão em ações e operações de campo.`,icon:`Target`,id:`operador_tatica`,name:`Operador Tático`,rarity:`raro`,updated_at:`2026-10-13T19:27:19.280Z`,xp_cost:100}},member_follows:{"031af048-05f8-4788-b5fe-d1e8916746e6":{created_at:`2026-09-19T00:35:27.971Z`,follower_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,following_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,id:`031af048-05f8-4788-b5fe-d1e8916746e6`,notify_posts:!0},"6248a824-1e9e-4080-8b3f-be6a0b5a97d9":{created_at:`2026-09-19T08:01:32.560Z`,follower_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,following_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,id:`6248a824-1e9e-4080-8b3f-be6a0b5a97d9`,notify_posts:!0},"9779717a-1896-4dbb-b0d7-734842b0d810":{created_at:`2026-09-19T12:06:44.215Z`,follower_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,following_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`,id:`9779717a-1896-4dbb-b0d7-734842b0d810`,notify_posts:!0},"b5c3c5bb-08df-4253-9e35-c72c49e5c07c":{created_at:`2026-09-19T08:02:45.722Z`,follower_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,following_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,id:`b5c3c5bb-08df-4253-9e35-c72c49e5c07c`,notify_posts:!0},"d1edee1f-9f0f-4a5c-85d4-0d53cfc966b0":{created_at:`2026-09-19T12:06:47.090Z`,follower_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,following_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,id:`d1edee1f-9f0f-4a5c-85d4-0d53cfc966b0`,notify_posts:!0},"e72761ac-28f0-4ae5-9bb6-7a83bd0887d0":{created_at:`2026-09-17T00:26:48.183Z`,follower_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,following_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,id:`e72761ac-28f0-4ae5-9bb6-7a83bd0887d0`,notify_posts:!0}},member_stream_accounts:{"73f8cfdb-478c-45f3-bee5-443c21367692":{avatar_url:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,channel_name:`malaca7x`,channel_url:`https://twitch.tv/malaca7x`,created_at:`2026-09-17T00:45:32.000Z`,display_name:`Malaca`,id:`73f8cfdb-478c-45f3-bee5-443c21367692`,is_active:!0,platform:`twitch`,updated_at:`2026-09-19T03:06:14.168Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`}},member_stream_preferences:{_schema_info:{empty:!0,original_table:`member_stream_preferences`}},member_tag_assignments:{"c5ef6dc6-e126-4027-80c3-319f0a870315_dev":{assigned_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,created_at:`2026-10-23T00:57:46.839Z`,id:`c5ef6dc6-e126-4027-80c3-319f0a870315_dev`,member_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,tag_id:`dev`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`}},member_tags:{bloqueado:{color:`#dd0e0e`,description:`Bloqueado`,discord_sync_enabled:!0,icon:`Lock`,id:`bloqueado`,is_active:!0,is_system:!0,name:`Bloqueado`,order_index:0,rules:{block_login:!0,block_operations:!0,is_blocked:!0},updated_at:`2026-10-31T03:03:59.642Z`},copilot:{color:`#06b6d4`,description:`copilot`,discord_sync_enabled:!0,icon:`CreditCard`,id:`copilot`,is_active:!0,is_system:!0,name:`copilot`,rules:{allow_sales_counter:!1,block_cash_fund:!1,block_escalas:!1,block_login:!1,block_movements:!1,block_operations:!1,block_productions:!1,block_sales:!1,can_access_ceo:!1,can_create_announcements:!1,can_manage_escalas:!1,can_manage_members:!1,can_reverse_sales:!1,can_sell:!1,can_view_all_sales:!1,can_view_all_tickets:!1,can_view_escalas:!1,can_view_sensitive_data:!1,experimental_features:!1,is_blocked:!1,is_ceo:!1},updated_at:`2026-11-03T20:03:07.123Z`},deskticket:{color:`#10b981`,description:`Atendimento Ticket`,discord_sync_enabled:!0,icon:`ShieldCheck`,id:`deskticket`,is_active:!0,is_system:!1,name:`Atendimento Ticket`,order_index:2,permissions:[`atendimento_tickets.view`,`view_members`,`claim_tickets`,`reply_tickets`,`transfer_tickets`,`change_ticket_status`,`internal_notes_tickets`,`manage_ticket_members`,`close_tickets`,`view_sensitive_data`,`view_all_tickets`],rules:{block_cash_fund:!1,can_access_ceo:!1,can_view_all_tickets:!0,can_view_sensitive_data:!0,is_ceo:!1},updated_at:`2026-10-31T04:23:51.915Z`},produzir:{color:`#10b981`,description:`Estação operacional de manufatura de itens e consumo de matérias-primas.`,discord_sync_enabled:!0,icon:`Settings`,id:`produzir`,is_active:!0,is_system:!1,name:`Produzir`,order_index:3,permissions:[`productions.view`,`productions.create`,`warehouse.transfer`],rules:{can_adjust_warehouse_stock:!0,can_deposit_cash_fund:!1,can_manage_production_recipes:!0,can_manage_productions:!0,can_manage_raw_materials:!0,can_transfer_warehouse:!0},updated_at:`2026-10-31T03:03:59.642Z`},vendas:{color:`#0ea5e9`,description:`Registro e conferência de vendas e saída de estoque.`,discord_sync_enabled:!0,icon:`ShoppingCart`,id:`vendas`,is_active:!0,is_system:!1,name:`Vendas`,order_index:4,permissions:[`view_sales`,`create_sale`],rules:{allow_sales_counter:!0,can_reverse_sales:!0,can_sell:!0,can_view_all_sales:!1},updated_at:`2026-10-31T03:03:59.642Z`}},member_verifications:{"6e2f5d10-d684-4caf-8c1e-636b9d1a84d6":{created_at:`2026-11-03T20:32:49.342Z`,id:`ver_6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,is_verified:!0,request_id:`174749fd-7152-44e8-9a2a-fde985b48f2e`,updated_at:`2026-11-03T20:32:49.342Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,verified_at:`2026-11-03T20:32:49.342Z`,verified_by:`ceo`},"c5ef6dc6-e126-4027-80c3-319f0a870315":{created_at:`2026-10-24T01:28:09.146Z`,id:`ver_c5ef6dc6-e126-4027-80c3-319f0a870315`,is_verified:!0,request_id:`d6a0dce8-d5f8-4148-b214-53cb85d70162`,updated_at:`2026-10-24T01:28:09.146Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,verified_at:`2026-10-24T01:28:09.146Z`,verified_by:`ceo`},"d8261681-8469-4643-bca0-5fc154b3a25b":{created_at:`2026-10-31T05:08:18.380Z`,id:`ver_d8261681-8469-4643-bca0-5fc154b3a25b`,is_verified:!0,updated_at:`2026-10-31T05:08:18.380Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,verified_at:`2026-10-31T05:08:18.380Z`,verified_by:`ceo`}},metas:{goal_default_1788481127067:{created_at:`2026-09-04T00:18:47.067Z`,created_by_name:`Liderança Twin Wheels`,description:`Meta semanal padrão de contribuição da família Twin Wheels. Entregue os insumos ou dinheiro para um líder/gerente em serviço e anexe o print do F8.`,id:`goal_default_1788481127067`,is_active:!1,period_end:`2026-09-07`,period_start:`2026-09-01`,target_scope:`todos`,target_value:5e4,title:`Meta Semanal Operacional`,type:`financeiro`,unit_name:`R$`,updated_at:`2026-09-04T16:25:36.520Z`},goal_default_1789820318555:{created_at:`2026-09-14T00:00:00.000Z`,created_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,created_by_name:`Malaca`,description:`Meta semanal padrão de contribuição da família Twin Wheels. Entregue os insumos ou dinheiro para um líder/gerente em serviço e anexe o print do F8.`,id:`goal_default_1789820318555`,is_active:!1,period_end:`2026-09-20`,period_start:`2026-09-14`,target_scope:`todos`,target_value:5e4,title:`Meta Semanal Operacional - Setembro`,type:`financeiro`,unit_name:`R$`,updated_at:`2026-09-19T12:21:40.957Z`},goal_estoque_lockpick:{created_at:`2026-10-13T19:27:19.281Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,created_by_name:`Liderança`,description:`Manter a reserva estratégica de LockPicks no Baú Principal acima de 300 unidades.`,id:`goal_estoque_lockpick`,is_active:!1,period_end:`2026-10-17`,period_start:`2026-10-13`,target_scope:`todos`,target_value:300,title:`Meta de Abastecimento: LockPicks`,type:`quantidade`,unit_name:`itens`,updated_at:`2026-10-13T21:34:03.653Z`},goal_vendas_semana:{created_at:`2026-10-13T19:27:19.281Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,created_by_name:`Liderança`,description:`Atingir o faturamento bruto estipulado em vendas diretas e parcerias.`,id:`goal_vendas_semana`,is_active:!1,period_end:`2026-10-19`,period_start:`2026-10-13`,target_scope:`todos`,target_value:5e5,title:`Meta Semanal de Faturamento Comercial`,type:`faturamento`,unit_name:`itens`,updated_at:`2026-10-13T21:34:03.653Z`},wgoal_1788577280632_qsx4q:{created_at:`2026-09-05T03:01:20.632Z`,created_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,created_by_name:`Malaca`,description:`Meta Semanal de Dinheiro Sujo`,id:`wgoal_1788577280632_qsx4q`,is_active:!0,period_end:`2026-09-13`,period_start:`2026-09-07`,target_scope:`todos`,target_value:5e4,title:`Meta Semanal - Teste Desenvolvedor`,type:`quantidade`,unit_name:`R$`,updated_at:`2026-10-13T21:34:03.652Z`},wgoal_vigente_20261012:{created_at:`2026-10-12T00:00:00.000Z`,created_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,created_by_name:`Malaca`,description:`Meta semanal de contribuição da família Twin Wheels (Semana de 12/10 a 18/10). Entregue os insumos ou dinheiro para a liderança em serviço e anexe o comprovante com print do F8.`,id:`wgoal_vigente_20261012`,is_active:!0,period_end:`2026-10-18`,period_start:`2026-10-12`,target_scope:`todos`,target_value:5e4,title:`Meta Semanal Operacional - Outubro`,type:`financeiro`,unit_name:`R$`,updated_at:`2026-10-13T20:48:33.123Z`}},metas_entregues:{gsub_1788577336958_j6e6u:{amount:38e3,created_at:`2026-09-05T03:02:16.958Z`,delivered_at:`2026-09-05T06:01:00.000Z`,goal_id:`wgoal_1788577280632_qsx4q`,goal_title:`Meta Semanal - Teste Desenvolvedor`,id:`gsub_1788577336958_j6e6u`,member_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,member_name:`Developers`,member_nickname:`Dev`,member_role:`membro`,proof_url:`data:image/png;base64,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`,receiver_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png?size=512`,receiver_id:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,receiver_name:`Malaca`,receiver_role:`membro`,reviewed_at:`2026-09-05T03:05:01.373Z`,reviewed_by:`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,reviewed_by_name:`Malaca`,status:`aprovado`,unit_name:`R$`,updated_at:`2026-09-05T03:05:01.373Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},gsub_1789820424596_7tdqu:{amount:29e3,created_at:`2026-09-19T12:20:24.596Z`,delivered_at:`2026-09-19T15:18:00.000Z`,goal_id:`goal_default_1789820318555`,goal_title:`Meta Semanal Operacional`,id:`gsub_1789820424596_7tdqu`,member_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,member_name:`Malaca`,member_role:`membro`,receiver_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,receiver_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,receiver_name:`Dev`,receiver_role:`membro`,reviewed_at:`2026-09-19T12:21:40.957Z`,reviewed_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,reviewed_by_name:`Malaca`,status:`aprovado`,unit_name:`R$`,updated_at:`2026-09-19T12:21:40.957Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`}},platform_settings:{dev_configuration:{key:`dev_configuration`,updated_at:`2026-10-31T05:10:00.959Z`,value:`{"developerBypassMode":false,"devAuditLogs":true,"devSystemNotifications":false,"devThemeColor":"gradient-sunset","ceoThemeColor":"pearl-jade","memberThemeColor":"gradient-amethyst","devPanelIcon":"Terminal","ceoPanelIcon":"Crown","memberPanelIcon":"Users"}`},dev_permissions:{key:`dev_permissions`,updated_at:`2026-10-31T07:33:33.875Z`,value:`["verification.view_page","verification.request","verification.cancel_own","verification.manage","verification.review","verification.grant_direct","verification.revoke","verification.config","verification.requirements","verification.audit","raw_materials.view","raw_materials.create","raw_materials.edit","raw_materials.delete","raw_materials.adjust","raw_materials.transfer_bau","raw_materials.history","productions.view","productions.create","productions.edit","productions.delete","view_productions","create_production","warehouse.view","warehouse.transfer","warehouse.transfer_storage","warehouse.transfer_sale","warehouse.adjust","warehouse.history","view_warehouse","production_management.view","production_management.products","production_management.raw_materials","production_management.productions","production_management.settings","production_management.reports","view_production_management","sales.view","sales.create","sales.edit","sales.cancel","sales.history","escalas.view","escalas.details","escalas.create","escalas.edit","escalas.delete","escalas.publish","escalas.cancel","escalas.manage_members","escalas.add_participants","escalas.remove_participants","escalas.confirm_presence","escalas.manage_slots","escalas.substitute","escalas.history","escalas.settings","view_stock_management","life_view_following","life_view_bookmarks","post_life","life_post_image","life_post_video","life_mention_members","life_use_hashtags","life_like_posts","life_bookmark_posts","life_comment_posts","life_delete_own_comment","life_delete_own_post","life_follow_members","life_pin_posts","life_moderate_posts","life_moderate_comments","manage_life","view_stock_management","manage_stock_products","manage_stock_categories","manage_stock_baus","adjust_stock_balance","manage_stock_balance","view_chat","create_chat_group","manage_chat_groups","view_absences","request_absence","manage_absences","view_all_absences","view_cash_fund","manage_cash_fund","reverse_cash_fund","delete_cash_movement","view_stock","view_movements","create_movement","reverse_movement","delete_movement","view_movement_balances","view_movement_baus","view_baus","manage_baus","view_all_movements","view_sales","create_sale","reverse_sale","delete_sale","view_products","manage_products","view_categories","manage_categories","view_members","view_sensitive_data","approve_requests","change_roles","promote_members","edit_members","delete_members","view_consolidated_financials","manage_roles","manage_announcements","view_rankings","view_rankings_xp","view_rankings_financial","view_rankings_movements","view_insignias","grant_insignia","manage_insignias_catalog","view_shop","buy_shop_items","manage_shop","evaluate_member","manage_xp_rules","adjust_member_xp","view_member_xp","view_performance","manage_performance","inspect_member_performance","view_goals","manage_goals","view_hierarchy","manage_hierarchy","view_audit","manage_platform_settings","manage_menu_settings","trigger_force_cache_purge","view_patch_notes","manage_patch_notes","view_tickets","create_ticket","reply_tickets","reply_ticket","view_all_tickets","atendimento_tickets.view","view_atendimento_tickets","claim_tickets","claim_ticket","transfer_tickets","transfer_ticket","change_ticket_status","internal_notes_tickets","manage_ticket_members","close_tickets","close_ticket","reopen_tickets","reopen_ticket","delete_tickets","delete_ticket","manage_tickets","view_notifications","send_notifications","manage_notifications","configure_notifications_sound","view_ceo_notifications","create_ceo_notification","edit_ceo_notification","delete_ceo_notification","toggle_ceo_notification_active","view_ceo_warnings","manage_ceo_warnings","view_ceo_stock_adjustments","manage_ceo_stock_adjustments","ceo_adjust_stock_balance","ceo_stock_add","ceo_stock_remove","view_ceo_tag_permissions","manage_ceo_tag_permissions","create_ceo_tag","edit_ceo_tag","delete_ceo_tag","manage_ceo_tag_permissions_detail","manage_ceo_tag_rules","assign_ceo_tag","view_dev_tags","manage_dev_tags","view_dev_warnings","manage_dev_warnings","view_dev_notifications","manage_dev_notification_rules","create_dev_notification","edit_dev_notification","delete_dev_notification","simulate_dev_notification","toggle_dev_notification_active","purge_dev_notifications","inspect_dev_notification_payload","export_dev_notifications","manage_dev_notification_sounds","broadcast_dev_emergency_alert","view_lives","manage_lives","link_stream_account","manage_stream_accounts","force_end_live_session","simulate_live_stream","configure_stream_api","view_stream_logs","view_profile","edit_profile_data","edit_profile_banner","edit_profile_bio","edit_profile_custom_url","edit_profile_appearance","view_dev_hub","manage_dev_bot","manage_dev_patch_notes","manage_dev_performance","manage_dev_permissions","manage_dev_config","manage_dev_menu","manage_dev_gamification","view_dev_shop","create_dev_shop_item","edit_dev_shop_item","delete_dev_shop_item","manage_dev_shop_prices","manage_dev_shop_stock","manage_dev_shop_orders","deliver_dev_shop_order","refund_dev_shop_order","view_dev_coins","grant_dev_coins","deduct_dev_coins","view_dev_coins_transactions","manage_dev_coins_rates","manage_dev_coins_batch","view_ceo","manage_ceo_bot","bot_send_message","bot_add_app","bot_change_status","bot_change_name","bot_change_avatar","bot_change_banner","bot_change_presence","bot_restart","bot_power_toggle","bot_invite","bot_manage_roles","bot_manage_token","bot_view_intents","bot_change_intents","bot_manage_discloud_config","manage_ceo_webhooks","webhook_send_message","webhook_test","webhook_create","webhook_edit","webhook_delete","webhook_toggle_active","webhook_copy_url","webhook_view_code","webhook_save_config","view_ceo_financials","estoque.visualizar","estoque.ajustar","estoque.adicionar","estoque.remover","estoque.corrigir","estoque.configurar","estoque.auditoria","view_warnings","view_all_warnings","create_warning","create_suspension","edit_warning","revoke_warning","delete_warning","view_warning_details","export_warnings","manage_warnings","manage_permissions","view_life","view_dashboard"]`}},postimages_cache:{img_0001:{cdnUrl:`https://i.postimg.cc/0QcWXL76/algema.png`,localPath:`D:\\Imagens\\itenscdagtarp\\algema.png`,pageUrl:`https://postimg.cc/Vr0WdZG1/e2f60e7f`},img_0002:{cdnUrl:`https://i.postimg.cc/qMdwXJPG/item-16.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novositens\\item_16.png`,pageUrl:`https://postimg.cc/MXd1zSKc/36f3f143`},img_0003:{cdnUrl:`https://i.postimg.cc/8PV4Bp2t/c4.png`,localPath:`D:\\Imagens\\itenscdagtarp\\c4.png`,pageUrl:`https://postimg.cc/MXd1zSKQ/75e403e7`},img_0004:{cdnUrl:`https://i.postimg.cc/5Nq3PcJq/capuz.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novositens\\capuz.png`,pageUrl:`https://postimg.cc/vcTfBNcc/da568eff`},img_0005:{cdnUrl:`https://i.postimg.cc/X7c82MWx/chip-tablet.png`,localPath:`D:\\Imagens\\itenscdagtarp\\chip_tablet.png`,pageUrl:`https://postimg.cc/QHC1tyHW/fd08ab7e`},img_0006:{cdnUrl:`https://i.postimg.cc/c4MmDqW2/cocaina.png`,localPath:`D:\\Imagens\\itenscdagtarp\\cocaina.png`,pageUrl:`https://postimg.cc/nCrBzPCG/dfcf3a24`},img_0007:{cdnUrl:`https://i.postimg.cc/bNHT6X8c/dinheirosujo.png`,localPath:`D:\\Imagens\\itenscdagtarp\\dinheirosujo.png`,pageUrl:`https://postimg.cc/rKsxmPKQ/8f328010`},img_0008:{cdnUrl:`https://i.postimg.cc/zXSjdm58/envelopemanchado.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novositens\\envelopemanchado.png`,pageUrl:`https://postimg.cc/SJRCsvJv/7e922602`},img_0009:{cdnUrl:`https://i.postimg.cc/mgLSJd2x/fiveseven.png`,localPath:`D:\\Imagens\\itenscdagtarp\\fiveseven.png`,pageUrl:`https://postimg.cc/F76cJVLG/7e06e615`},img_0010:{cdnUrl:`https://i.postimg.cc/DwvcHCyn/galaogasolina.png`,localPath:`D:\\Imagens\\itenscdagtarp\\galaogasolina.png`,pageUrl:`https://postimg.cc/qzFnCx35/933a4d4c`},img_0011:{cdnUrl:`https://i.postimg.cc/vZYvkPHD/hacking.png`,localPath:`D:\\Imagens\\itenscdagtarp\\hacking.png`,pageUrl:`https://postimg.cc/3dqpDFGH/857ee60d`},img_0012:{cdnUrl:`https://i.postimg.cc/y81TtfY3/kitreparo-basico.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\kitreparo_basico.png`,pageUrl:`https://postimg.cc/ppS8nJjP/8ade683c`},img_0013:{cdnUrl:`https://i.postimg.cc/2S0xD4VV/maconha.png`,localPath:`D:\\Imagens\\itenscdagtarp\\maconha.png`,pageUrl:`https://postimg.cc/PC8Dbvbj/51e5bc1b`},img_0014:{cdnUrl:`https://i.postimg.cc/kgTymxBs/maparotahorarios.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novositens\\maparotahorarios.png`,pageUrl:`https://postimg.cc/5XFz5Q5Q/f416f418`},img_0015:{cdnUrl:`https://i.postimg.cc/6QTf5yv0/metafetamina.png`,localPath:`D:\\Imagens\\itenscdagtarp\\metafetamina.png`,pageUrl:`https://postimg.cc/sBdhTfKQ/bd76433b`},img_0016:{cdnUrl:`https://i.postimg.cc/Gp9xhHD1/Chat-GPT-Image-18-de-set-de-2026-22-08-46.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\ChatGPT Image 18 de set. de 2026, 22_08_46.png`,pageUrl:`https://postimg.cc/SXFMgQVZ/de6244dc`},img_0017:{cdnUrl:`https://i.postimg.cc/R0qLVNtv/munipistola.png`,localPath:`D:\\Imagens\\itenscdagtarp\\munipistola.png`,pageUrl:`https://postimg.cc/HJDy6W3N/32b33edf`},img_0018:{cdnUrl:`https://i.postimg.cc/TPhJYpbP/munisub.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\munisub.png`,pageUrl:`https://postimg.cc/yJ4ZL6vq/fa1143d5`},img_0019:{cdnUrl:`https://i.postimg.cc/25JFqrdC/pedecabra.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\pedecabra.png`,pageUrl:`https://postimg.cc/Y46mZcyP/2a2bf81d`},img_0020:{cdnUrl:`https://i.postimg.cc/MG4bcq0Z/item-19.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novositens\\item_19.png`,pageUrl:`https://postimg.cc/sBYZqF0b/d91dd621`},img_0021:{cdnUrl:`https://i.postimg.cc/HLK4Jd0r/Chat-GPT-Image-18-de-set-de-2026-22-39-19.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\ChatGPT Image 18 de set. de 2026, 22_39_19.png`,pageUrl:`https://postimg.cc/B8T1kWV3/014453fa`},img_0022:{cdnUrl:`https://i.postimg.cc/6QSL7tVZ/Chat-GPT-Image-18-de-set-de-2026-22-10-56.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\ChatGPT Image 18 de set. de 2026, 22_10_56.png`,pageUrl:`https://postimg.cc/bGx2WXBY/05a47765`},img_0023:{cdnUrl:`https://i.postimg.cc/JhgcyM35/Chat-GPT-Image-18-de-set-de-2026-22-15-29.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\ChatGPT Image 18 de set. de 2026, 22_15_29.png`,pageUrl:`https://postimg.cc/sBYZqFNM/a7552fdb`},img_0024:{cdnUrl:`https://i.postimg.cc/26ZdhMTx/tec9.png`,localPath:`D:\\Imagens\\itenscdagtarp\\tec9.png`,pageUrl:`https://postimg.cc/xJ9bSswk/51e4a6db`},img_0025:{cdnUrl:`https://i.postimg.cc/W3kmgCSY/uzi.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\uzi.png`,pageUrl:`https://postimg.cc/sQ3ZRnk5/1d8f1325`},img_0026:{cdnUrl:`https://i.postimg.cc/MTQ0VNtg/bau2.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\bau2.png`,pageUrl:`https://postimg.cc/343DHLsZ/9942266d`},img_0027:{cdnUrl:`https://i.postimg.cc/8cgRH4n9/bau.png`,localPath:`D:\\Imagens\\itenscdagtarp\\novos+qualidade\\bau.png`,pageUrl:`https://postimg.cc/bDLSYxP9/a88f6c5f`},img_0028:{cdnUrl:`https://i.postimg.cc/5yWB3gRd/bannermalaca02.png`,localPath:`D:\\Imagens\\bannermalaca02.png`,pageUrl:`https://postimg.cc/YG8L267b/cf067d03`},img_0029:{cdnUrl:`https://i.postimg.cc/Xq6f8Lz3/fotoperfilmalaca01.png`,localPath:`D:\\Imagens\\fotoperfilmalaca01.png`,pageUrl:`https://postimg.cc/Q9SKNQDn/150ce681`}},product_baus:{"136e0eb4-48b6-41df-b7e6-29bff020b1f4_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`136e0eb4-48b6-41df-b7e6-29bff020b1f4`,quantidade:`0`,updated_at:`2026-09-19T02:04:42.368Z`},"142cb569-5e89-404f-a368-52302695649a_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`142cb569-5e89-404f-a368-52302695649a`,quantidade:`-2`,updated_at:`2026-09-19T02:04:42.530Z`},"14cec745-48a3-4d9c-82eb-6ce1c0b927ff_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantidade:`1742.00`,updated_at:`2026-11-03T10:37:26.120Z`},"14cec745-48a3-4d9c-82eb-6ce1c0b927ff_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantidade:`0`,updated_at:`2026-09-09T16:51:09.517Z`},"1b75731b-da5e-4c39-bda2-ca850ced85a2_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`1b75731b-da5e-4c39-bda2-ca850ced85a2`,quantidade:`0`,updated_at:`2026-09-19T07:29:51.932Z`},"297e437f-504d-4715-8d4c-9b1616853d39_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`297e437f-504d-4715-8d4c-9b1616853d39`,quantidade:`49.00`,updated_at:`2026-11-02T22:09:22.238Z`},"3267a6ef-8238-4669-9bac-bbe70f6c90d2_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`3267a6ef-8238-4669-9bac-bbe70f6c90d2`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:34.019Z`},"3f09da87-3965-4df3-9fb3-69c59e9c510a_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`3f09da87-3965-4df3-9fb3-69c59e9c510a`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:34.019Z`},"477b2f1d-fcae-4dbb-85ca-6df1303543a8_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`477b2f1d-fcae-4dbb-85ca-6df1303543a8`,quantidade:`1200.00`,updated_at:`2026-11-02T16:47:54.105Z`},"47fe8ea7-2f12-458a-8f3b-eb85cd87a37e_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantidade:`1.00`,updated_at:`2026-10-19T21:09:36.362Z`},"47fe8ea7-2f12-458a-8f3b-eb85cd87a37e_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantidade:`4`,updated_at:`2026-09-13T05:25:52.525Z`},"48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantidade:`-8.00`,updated_at:`2026-11-02T03:24:47.672Z`},"48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantidade:`5`,updated_at:`2026-09-13T05:25:53.747Z`},"4cdef5ea-d501-4e9d-aa35-a62b16b54546_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`4cdef5ea-d501-4e9d-aa35-a62b16b54546`,quantidade:`0`,updated_at:`2026-09-19T03:42:51.263Z`},"4cdef5ea-d501-4e9d-aa35-a62b16b54546_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`4cdef5ea-d501-4e9d-aa35-a62b16b54546`,quantidade:`10`,updated_at:`2026-09-16T16:08:13.686Z`},"4e683441-0730-489a-ba27-bd2903709bf5_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`4e683441-0730-489a-ba27-bd2903709bf5`,quantidade:`0`,updated_at:`2026-09-19T07:29:51.932Z`},"4e683441-0730-489a-ba27-bd2903709bf5_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`4e683441-0730-489a-ba27-bd2903709bf5`,quantidade:`0`,updated_at:`2026-09-02T20:43:34.924Z`},"4fa7961f-b4c7-495a-bfc3-c8819ee7b218_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantidade:`-15952.00`,updated_at:`2026-11-03T20:34:19.221Z`},"4fa7961f-b4c7-495a-bfc3-c8819ee7b218_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantidade:`45`,updated_at:`2026-09-16T03:07:01.765Z`},"50ca904d-24ed-4dda-a0aa-352d28dac501_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`50ca904d-24ed-4dda-a0aa-352d28dac501`,quantidade:`-2`,updated_at:`2026-09-19T03:13:46.630Z`},"50e818d1-07c8-43e6-8b0e-da97a240007a_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`50e818d1-07c8-43e6-8b0e-da97a240007a`,quantidade:`0`,updated_at:`2026-09-19T03:43:36.913Z`},"6a02d235-8c20-4353-aead-308aa086908d_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`6a02d235-8c20-4353-aead-308aa086908d`,quantidade:`0.00`,updated_at:`2026-10-19T19:53:51.887Z`},"6db947d4-c77f-4f3f-877e-a24b7a941f72_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`6db947d4-c77f-4f3f-877e-a24b7a941f72`,quantidade:`-68.00`,updated_at:`2026-11-02T04:38:06.799Z`},"7436e45e-11fa-4d46-aaed-835e3c3346ed_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`7436e45e-11fa-4d46-aaed-835e3c3346ed`,quantidade:`0.00`,updated_at:`2026-10-19T18:44:59.946Z`},"78bbf10a-c4ee-4410-b736-2505c8fbedea_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantidade:`100`,updated_at:`2026-09-19T03:33:43.621Z`},"78bbf10a-c4ee-4410-b736-2505c8fbedea_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantidade:`170`,updated_at:`2026-09-19T23:42:50.671Z`},"7b02d693-4d8b-4422-ba10-303ffa51114d_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantidade:`-30.00`,updated_at:`2026-10-13T21:13:44.990Z`},"7b02d693-4d8b-4422-ba10-303ffa51114d_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantidade:`5`,updated_at:`2026-09-16T03:09:44.331Z`},"7b5e2260-81d9-450f-b5a4-736e68526e96_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`7b5e2260-81d9-450f-b5a4-736e68526e96`,quantidade:`0`,updated_at:`2026-09-19T02:04:42.290Z`},"7c27ff76-2758-4ce0-82ad-2ffff36cc603_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`7c27ff76-2758-4ce0-82ad-2ffff36cc603`,quantidade:`-1`,updated_at:`2026-09-19T02:04:42.368Z`},"7cdb9246-bc0a-42a4-9f8e-dbbef125657d_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`7cdb9246-bc0a-42a4-9f8e-dbbef125657d`,quantidade:`6.00`,updated_at:`2026-11-02T03:24:34.019Z`},"82f15c69-b575-43cb-9abe-0fbd2a223fc3_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantidade:`70.00`,updated_at:`2026-11-03T02:36:54.669Z`},"82f15c69-b575-43cb-9abe-0fbd2a223fc3_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantidade:`10`,updated_at:`2026-09-16T03:06:24.227Z`},"8a54d84a-85f7-4c87-8046-e50caf91cac3_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`8a54d84a-85f7-4c87-8046-e50caf91cac3`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:47.672Z`},"8d0daf4d-4312-44b7-85ad-bb9699a574c5_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`8d0daf4d-4312-44b7-85ad-bb9699a574c5`,quantidade:`1.00`,updated_at:`2026-10-15T17:01:32.683Z`},"92c73e60-a6a7-46cd-b397-1e12d165ae48_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantidade:`-1478.00`,updated_at:`2026-11-03T20:34:18.214Z`},"92c73e60-a6a7-46cd-b397-1e12d165ae48_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantidade:`300`,updated_at:`2026-09-19T03:38:29.848Z`},"9548eee0-3083-489b-b57f-7d5a2b5358eb_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantidade:`0.00`,updated_at:`2026-10-28T15:58:56.381Z`},"9548eee0-3083-489b-b57f-7d5a2b5358eb_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantidade:`11`,updated_at:`2026-09-15T21:47:03.858Z`},"9c4806d3-06f0-4261-a0fa-dc2485b8eeb5_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`9c4806d3-06f0-4261-a0fa-dc2485b8eeb5`,quantidade:`0.00`,updated_at:`2026-10-18T11:14:49.074Z`},"a45fba52-7769-4533-b4b1-581e228d21f0_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`a45fba52-7769-4533-b4b1-581e228d21f0`,quantidade:`-3.00`,updated_at:`2026-10-20T23:18:04.367Z`},"b3b621ad-3849-4796-9349-76538ea50413_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantidade:`-8.00`,updated_at:`2026-11-02T17:38:30.194Z`},"b41bc442-af3c-4f76-a623-bb0de67615b4_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`b41bc442-af3c-4f76-a623-bb0de67615b4`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:34.019Z`},"b5be6116-04b1-4478-a1d8-1ba1c139b2f5_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`b5be6116-04b1-4478-a1d8-1ba1c139b2f5`,quantidade:`-1.00`,updated_at:`2026-10-30T01:34:18.433Z`},"b626f466-ef86-408d-9f46-d3460030d8f9_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`b626f466-ef86-408d-9f46-d3460030d8f9`,quantidade:`-5`,updated_at:`2026-09-19T02:04:42.085Z`},"b9e76652-8ec0-475e-8ded-19bf5de5fcff_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`b9e76652-8ec0-475e-8ded-19bf5de5fcff`,quantidade:`0.00`,updated_at:`2026-10-27T14:10:43.292Z`},"bbe4e806-d169-465b-a115-de1e0341f1e5_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,quantidade:`6800.00`,updated_at:`2026-11-02T16:51:24.813Z`},"bc1a1b1d-bf46-434c-9b50-532153eac358_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,quantidade:`0`,updated_at:`2026-08-29T18:59:55.316Z`},"bc1a1b1d-bf46-434c-9b50-532153eac358_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,quantidade:`0`,updated_at:`2026-09-02T20:29:43.658Z`},"bc5bf239-cd25-4c14-b5ed-777f81b1e2a6_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`bc5bf239-cd25-4c14-b5ed-777f81b1e2a6`,quantidade:`56531.00`,updated_at:`2026-11-03T20:34:18.886Z`},"c02ba803-5c22-43dc-9cbf-3c9c3024b136_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c02ba803-5c22-43dc-9cbf-3c9c3024b136`,quantidade:`-7.00`,updated_at:`2026-10-26T20:54:01.262Z`},"c27a7a9d-818a-4564-a5c4-abbd68491cae_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c27a7a9d-818a-4564-a5c4-abbd68491cae`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:34.019Z`},"c2907fa5-47cc-460a-b3ab-b3e0bbf81185_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantidade:`2.00`,updated_at:`2026-10-30T23:04:46.759Z`},"c2907fa5-47cc-460a-b3ab-b3e0bbf81185_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantidade:`5`,updated_at:`2026-09-08T21:15:55.518Z`},"c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantidade:`-714.00`,updated_at:`2026-11-03T20:34:17.879Z`},"c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantidade:`99`,updated_at:`2026-09-16T03:11:34.744Z`},"c422f268-e769-4512-9a54-364dea648720_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantidade:`-2.00`,updated_at:`2026-11-03T00:48:59.427Z`},"c51b7c2b-f376-4426-82fe-d82eb8c265cc_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantidade:`-1842.00`,updated_at:`2026-11-03T10:30:54.903Z`},"c51b7c2b-f376-4426-82fe-d82eb8c265cc_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantidade:`7`,updated_at:`2026-09-18T12:29:03.868Z`},"c7430b4e-bd97-4f85-83ce-702492fe1d80_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantidade:`-370.00`,updated_at:`2026-11-03T10:36:20.793Z`},"cdd413b5-72c8-46b0-b40e-48c7af307902_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`cdd413b5-72c8-46b0-b40e-48c7af307902`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:34.019Z`},"cff66aa8-ae22-4dd5-bc6b-fcf912b147ea_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,quantidade:`-1734.00`,updated_at:`2026-11-03T00:48:59.427Z`},"d9ad7c1f-93a7-44f5-afc0-75430299e5d9_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`d9ad7c1f-93a7-44f5-afc0-75430299e5d9`,quantidade:`5.00`,updated_at:`2026-11-02T01:26:27.312Z`},"db625331-3858-4923-8a33-c9a4eaa1c449_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`db625331-3858-4923-8a33-c9a4eaa1c449`,quantidade:`4.00`,updated_at:`2026-10-25T00:42:38.598Z`},"dc58cd24-e100-4494-a97b-c1337d701cae_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantidade:`1.00`,updated_at:`2026-10-19T06:03:39.385Z`},"e10817fd-7798-4604-b4e2-4249dfe9273d_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantidade:`4212.00`,updated_at:`2026-11-02T17:38:30.194Z`},"e10817fd-7798-4604-b4e2-4249dfe9273d_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantidade:`0`,updated_at:`2026-09-08T21:14:44.937Z`},"e1f38312-9061-466b-8ea7-b3c3729e839c_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantidade:`51217.00`,updated_at:`2026-11-03T10:34:15.635Z`},"e616ccac-1edb-46f6-a77b-e0471817c5ce_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`e616ccac-1edb-46f6-a77b-e0471817c5ce`,quantidade:`-2.00`,updated_at:`2026-11-02T03:24:34.019Z`},"e93a1f12-8ebd-489e-83d6-65fd1a856501_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantidade:`-1571.00`,updated_at:`2026-11-03T20:34:18.550Z`},"e93a1f12-8ebd-489e-83d6-65fd1a856501_efa1d61c-958a-47f7-8b48-48b91b6b2f0a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantidade:`0`,updated_at:`2026-09-07T02:59:27.391Z`},"ec788fac-98b5-4d2c-8769-0135f14dc539_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantidade:`-96.00`,updated_at:`2026-11-02T22:14:25.438Z`},"f51aedf9-7881-41cb-98e2-31a243a0ed6e_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`f51aedf9-7881-41cb-98e2-31a243a0ed6e`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:34.019Z`},"f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7`,quantidade:`158.00`,updated_at:`2026-11-02T22:28:20.928Z`},"fedee638-2ff2-4aca-ba4d-1fab729fcbf7_074aa6aa-a481-4cf6-bb8c-8e9044b2b687":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,product_id:`fedee638-2ff2-4aca-ba4d-1fab729fcbf7`,quantidade:`0.00`,updated_at:`2026-11-02T03:24:47.672Z`}},product_recipes:{"142cb569-5e89-404f-a368-52302695649a_rm_aco_maciço":{created_at:`2026-10-18T04:34:17.552Z`,id:`142cb569-5e89-404f-a368-52302695649a_rm_aco_maciço`,product_id:`142cb569-5e89-404f-a368-52302695649a`,production_yield:1,quantity_required:1,raw_material_id:`rm_aco_maciço`,updated_at:`2026-10-13T19:27:19.281Z`},"142cb569-5e89-404f-a368-52302695649a_rm_kevlar":{created_at:`2026-10-18T04:34:17.552Z`,id:`142cb569-5e89-404f-a368-52302695649a_rm_kevlar`,product_id:`142cb569-5e89-404f-a368-52302695649a`,production_yield:1,quantity_required:3,raw_material_id:`rm_kevlar`,updated_at:`2026-10-13T19:27:19.281Z`},"78bbf10a-c4ee-4410-b736-2505c8fbedea_b08bb347-b36c-4a23-8df7-21e4256dfeb6":{created_at:`2026-10-18T04:46:45.928Z`,id:`78bbf10a-c4ee-4410-b736-2505c8fbedea_b08bb347-b36c-4a23-8df7-21e4256dfeb6`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,production_yield:2,quantity_required:2,raw_material_id:`b08bb347-b36c-4a23-8df7-21e4256dfeb6`,updated_at:`2026-10-18T04:46:45.928Z`},"78bbf10a-c4ee-4410-b736-2505c8fbedea_e0b0b3d8-6da5-4325-91d6-cbb9878ea520":{created_at:`2026-10-18T04:46:45.928Z`,id:`78bbf10a-c4ee-4410-b736-2505c8fbedea_e0b0b3d8-6da5-4325-91d6-cbb9878ea520`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,production_yield:2,quantity_required:5,raw_material_id:`e0b0b3d8-6da5-4325-91d6-cbb9878ea520`,updated_at:`2026-10-18T04:46:45.928Z`},"c51b7c2b-f376-4426-82fe-d82eb8c265cc_rm_circuitos_chips":{created_at:`2026-10-18T04:34:17.552Z`,id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc_rm_circuitos_chips`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,production_yield:2,quantity_required:2,raw_material_id:`rm_circuitos_chips`,updated_at:`2026-10-13T19:27:19.281Z`},"c51b7c2b-f376-4426-82fe-d82eb8c265cc_rm_polvora":{created_at:`2026-10-18T04:34:17.552Z`,id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc_rm_polvora`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,production_yield:2,quantity_required:4,raw_material_id:`rm_polvora`,updated_at:`2026-10-13T19:27:19.281Z`},"cff66aa8-ae22-4dd5-bc6b-fcf912b147ea_rm_aco_maciço":{created_at:`2026-10-18T04:34:17.552Z`,id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea_rm_aco_maciço`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,production_yield:30,quantity_required:2,raw_material_id:`rm_aco_maciço`,updated_at:`2026-10-13T19:27:19.281Z`},"cff66aa8-ae22-4dd5-bc6b-fcf912b147ea_rm_polvora":{created_at:`2026-10-18T04:34:17.552Z`,id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea_rm_polvora`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,production_yield:30,quantity_required:3,raw_material_id:`rm_polvora`,updated_at:`2026-10-13T19:27:19.281Z`},"e10817fd-7798-4604-b4e2-4249dfe9273d_rm_aco_maciço":{created_at:`2026-10-18T04:34:17.552Z`,id:`e10817fd-7798-4604-b4e2-4249dfe9273d_rm_aco_maciço`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,production_yield:50,quantity_required:1,raw_material_id:`rm_aco_maciço`,updated_at:`2026-10-13T19:27:19.281Z`},"e10817fd-7798-4604-b4e2-4249dfe9273d_rm_polvora":{created_at:`2026-10-18T04:34:17.552Z`,id:`e10817fd-7798-4604-b4e2-4249dfe9273d_rm_polvora`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,production_yield:50,quantity_required:2,raw_material_id:`rm_polvora`,updated_at:`2026-10-13T19:27:19.281Z`}},products:{"136e0eb4-48b6-41df-b7e6-29bff020b1f4":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`Registro de Movimentação`,created_at:`2026-09-19T02:04:42.129Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`136e0eb4-48b6-41df-b7e6-29bff020b1f4`,nome:`Registro de Movimentação`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T02:04:42.368Z`},"142cb569-5e89-404f-a368-52302695649a":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`Colete`,created_at:`2026-09-19T00:51:36.425Z`,estoque_atual:`-2`,estoque_minimo:`0`,id:`142cb569-5e89-404f-a368-52302695649a`,nome:`Colete`,preco_sugerido:`0`,production_yield:1,unidade:`un`,updated_at:`2026-09-19T02:04:42.530Z`},"14cec745-48a3-4d9c-82eb-6ce1c0b927ff":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`6d6ef224-4bc9-4714-a72a-d9925809b884`,cda_name:`Munição Submetralhadora`,created_at:`2026-08-23T02:48:44.198Z`,estoque_atual:`1742.00`,estoque_minimo:`0`,id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789778836056_munisub.png`,nome:`Munição SUB`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T10:37:26.120Z`},"1b115ea2-e111-4cce-ab3c-676c6de91054":{ativo:!0,can_be_produced:!1,can_be_sold:!1,descricao:`Gatilhos, percursores, molas e receptores para montagem de armamento.`,estoque_atual:85,estoque_minimo:0,id:`1b115ea2-e111-4cce-ab3c-676c6de91054`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780521946_uzi.png`,nome:`Peças Mecânicas de Armas`,preco_sugerido:0,unidade:`kit`},"1b75731b-da5e-4c39-bda2-ca850ced85a2":{ativo:!0,categoria_id:`4267449b-85b8-414a-8f09-19da6412b830`,cda_name:`Galão de Combustível`,created_at:`2026-09-03T18:39:35.958Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`1b75731b-da5e-4c39-bda2-ca850ced85a2`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788461008307_03_galao_gasolina.png`,nome:`Galão de Gasolina`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T07:29:51.932Z`},"297e437f-504d-4715-8d4c-9b1616853d39":{ativo:!0,cda_name:`Kit de Reparo Avançado`,created_at:`2026-10-28T23:39:48.498Z`,estoque_atual:`49.00`,estoque_minimo:`0.00`,id:`297e437f-504d-4715-8d4c-9b1616853d39`,nome:`Kit de Reparo Avançado`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T22:09:22.238Z`},"3267a6ef-8238-4669-9bac-bbe70f6c90d2":{ativo:!0,cda_name:`Álcool em Gel`,created_at:`2026-11-02T02:14:44.501Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`3267a6ef-8238-4669-9bac-bbe70f6c90d2`,nome:`Álcool em Gel`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"364659e6-f3d5-46fb-bf64-a8cb2436278c":{ativo:!0,can_be_produced:!1,can_be_sold:!1,descricao:`Componentes avançados para placas de decodificação e pendrives de invasão.`,estoque_atual:95,estoque_minimo:0,id:`364659e6-f3d5-46fb-bf64-a8cb2436278c`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460654889_item_19.png`,nome:`Chips Eletrônicos & Circuitos`,preco_sugerido:0,unidade:`un`},"3f09da87-3965-4df3-9fb3-69c59e9c510a":{ativo:!0,cda_name:`Roupa de mergulho`,created_at:`2026-10-19T17:37:27.150Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`3f09da87-3965-4df3-9fb3-69c59e9c510a`,nome:`Roupa de mergulho`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"400900a7-dd2c-4291-bcc2-27aa807133cf":{ativo:!0,categoria_id:`f880b531-a65f-4193-ab96-1965fc84560a`,cda_name:`Conjunto de Attachs da MTAR`,created_at:`2026-09-19T01:19:39.917Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`400900a7-dd2c-4291-bcc2-27aa807133cf`,nome:`Conjunto de Attachs da MTAR`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T01:19:39.917Z`},"477b2f1d-fcae-4dbb-85ca-6df1303543a8":{ativo:!0,can_be_produced:!1,can_be_sold:!1,created_at:`2026-10-18T04:13:24.723Z`,descricao:`Matéria-prima: Tela LCD`,estoque_atual:`1200.00`,estoque_minimo:0,id:`477b2f1d-fcae-4dbb-85ca-6df1303543a8`,nome:`Tela LCD`,preco_sugerido:0,production_yield:1,sale_available_quantity:0,unidade:`un`,updated_at:`2026-11-02T16:47:54.105Z`},"47fe8ea7-2f12-458a-8f3b-eb85cd87a37e":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`micro uzi`,created_at:`2026-08-22T16:00:15.834Z`,estoque_atual:`5.00`,estoque_minimo:`0`,id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780521946_uzi.png`,nome:`Uzi`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-19T21:09:36.362Z`},"48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`MP5`,created_at:`2026-09-02T20:34:31.979Z`,estoque_atual:`-3.00`,estoque_minimo:`0`,id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780146954_chatgpt_image_18_de_set._de_2026__22_08_46.png`,nome:`MP5`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-02T03:24:47.672Z`},"4cdef5ea-d501-4e9d-aa35-a62b16b54546":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,created_at:`2026-08-20T20:50:21.853Z`,estoque_atual:`10`,estoque_minimo:`0`,id:`4cdef5ea-d501-4e9d-aa35-a62b16b54546`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964843081_algema.png`,nome:`Algema`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T03:42:51.263Z`},"4e683441-0730-489a-ba27-bd2903709bf5":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`7d21df15-d4d3-4834-924b-e303af2a2b68`,created_at:`2026-08-21T21:36:00.448Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`4e683441-0730-489a-ba27-bd2903709bf5`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787965020089_dinheirosujo.png`,nome:`Dinheiro Sujo`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T07:29:51.932Z`},"4fa7961f-b4c7-495a-bfc3-c8819ee7b218":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,cda_name:`LockPick`,created_at:`2026-08-20T18:29:16.592Z`,estoque_atual:`-15907.00`,estoque_minimo:`0`,id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964928163_hacking.png`,nome:`Hacking`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T20:34:19.221Z`},"50ca904d-24ed-4dda-a0aa-352d28dac501":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Tablet`,created_at:`2026-09-19T01:11:31.825Z`,estoque_atual:`-2`,estoque_minimo:`0`,id:`50ca904d-24ed-4dda-a0aa-352d28dac501`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780286007_chatgpt_image_18_de_set._de_2026__22_10_56.png`,nome:`Tablet`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T03:13:46.630Z`},"50e818d1-07c8-43e6-8b0e-da97a240007a":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,created_at:`2026-09-03T18:44:40.483Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`50e818d1-07c8-43e6-8b0e-da97a240007a`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788461078113_item_15.png`,nome:`Mapa de Rotas e Horários`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T03:43:36.913Z`},"6a02d235-8c20-4353-aead-308aa086908d":{ativo:!0,cda_name:`Cordas`,created_at:`2026-10-19T17:37:27.150Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`6a02d235-8c20-4353-aead-308aa086908d`,nome:`Cordas`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-10-19T19:53:51.887Z`},"6db947d4-c77f-4f3f-877e-a24b7a941f72":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Esmerilhadeira`,created_at:`2026-09-19T01:07:49.178Z`,estoque_atual:`-68.00`,estoque_minimo:`0`,id:`6db947d4-c77f-4f3f-877e-a24b7a941f72`,nome:`Esmerilhadeira`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-02T04:38:06.799Z`},"6e59ec4d-5d42-40d4-ae6f-b7952061bd8e":{ativo:!0,can_be_produced:!1,can_be_sold:!1,created_at:`2026-10-18T04:13:41.333Z`,descricao:`Matéria-prima: Linha`,estoque_atual:0,estoque_minimo:0,id:`6e59ec4d-5d42-40d4-ae6f-b7952061bd8e`,nome:`Linha`,preco_sugerido:0,production_yield:1,sale_available_quantity:0,unidade:`un`,updated_at:`2026-10-18T04:13:41.333Z`},"6f99a55a-46af-411c-affc-15cbce601d62":{ativo:!0,can_be_produced:!1,can_be_sold:!1,descricao:`Composto altamente inflamável para fabricação de munições e explosivos.`,estoque_atual:450,estoque_minimo:0,id:`6f99a55a-46af-411c-affc-15cbce601d62`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964928163_hacking.png`,nome:`Pólvora Pura`,preco_sugerido:0,unidade:`kg`},"7436e45e-11fa-4d46-aaed-835e3c3346ed":{ativo:!0,cda_name:`Kit Médico`,created_at:`2026-10-19T17:37:09.585Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`7436e45e-11fa-4d46-aaed-835e3c3346ed`,nome:`Kit Médico`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-10-19T18:44:59.946Z`},"78bbf10a-c4ee-4410-b736-2505c8fbedea":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,can_be_produced:!0,can_be_sold:!0,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,cda_name:`Lockpick`,created_at:`2026-08-19T21:28:08.189Z`,estoque_atual:`270`,estoque_minimo:`10`,id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,imagem_url:`https://i.postimg.cc/tTMjSjr5/image.png`,nome:`LockPick`,preco_sugerido:0,production_yield:2,unidade:`un`,updated_at:`2026-10-18T04:46:45.928Z`},"7b02d693-4d8b-4422-ba10-303ffa51114d":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,cda_name:`Capuz`,created_at:`2026-08-20T20:50:50.616Z`,estoque_atual:`-25.00`,estoque_minimo:`0`,id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460638042_capuz.png`,nome:`Capuz`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-13T21:13:44.990Z`},"7b5e2260-81d9-450f-b5a4-736e68526e96":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Caderneta`,created_at:`2026-09-19T00:42:47.296Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`7b5e2260-81d9-450f-b5a4-736e68526e96`,nome:`Caderneta`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T02:04:42.290Z`},"7c27ff76-2758-4ce0-82ad-2ffff36cc603":{ativo:!0,categoria_id:`f880b531-a65f-4193-ab96-1965fc84560a`,cda_name:`Conjunto de Attachs da G36C Mk2`,created_at:`2026-09-19T00:56:54.134Z`,descricao:`Conjunto de Attachs da G36C Mk2`,estoque_atual:`-1`,estoque_minimo:`0`,id:`7c27ff76-2758-4ce0-82ad-2ffff36cc603`,nome:`Conjunto de Attachs da G36C Mk2`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T02:04:42.368Z`},"7cdb9246-bc0a-42a4-9f8e-dbbef125657d":{ativo:!0,cda_name:`Bandagem`,created_at:`2026-10-13T19:34:52.978Z`,estoque_atual:`6.00`,estoque_minimo:`0.00`,id:`7cdb9246-bc0a-42a4-9f8e-dbbef125657d`,nome:`Bandagem`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"82f15c69-b575-43cb-9abe-0fbd2a223fc3":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,created_at:`2026-08-20T20:49:17.904Z`,estoque_atual:`80.00`,estoque_minimo:`0`,id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964875502_chip_tablet.png`,nome:`Chip Ilegal`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T02:36:54.669Z`},"8a54d84a-85f7-4c87-8046-e50caf91cac3":{ativo:!0,cda_name:`Chave de Casa`,created_at:`2026-11-02T02:17:13.101Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`8a54d84a-85f7-4c87-8046-e50caf91cac3`,nome:`Chave de Casa`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:47.672Z`},"8d0daf4d-4312-44b7-85ad-bb9699a574c5":{ativo:!0,categoria_id:`90fe003d-a32e-4702-97b4-4c138ec90b21`,cda_name:`Taco de Beisebol`,created_at:`2026-09-19T01:15:02.839Z`,estoque_atual:`1.00`,estoque_minimo:`0`,id:`8d0daf4d-4312-44b7-85ad-bb9699a574c5`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780550310_chatgpt_image_18_de_set._de_2026__22_15_29.png`,nome:`Taco de Beisebol`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-15T17:01:32.683Z`},"92788434-c6ab-47e8-b613-765f916a2075":{ativo:!0,can_be_produced:!1,can_be_sold:!1,descricao:`Ligas de aço temperado para estojos, canos de armas e ferramentas pesadas.`,estoque_atual:120,estoque_minimo:0,id:`92788434-c6ab-47e8-b613-765f916a2075`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788461055568_item_14.png`,nome:`Aço de Alta Resistência`,preco_sugerido:0,unidade:`barra`},"92c73e60-a6a7-46cd-b397-1e12d165ae48":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`60b9fb54-8cb0-4500-876f-35fe46fdb469`,cda_name:`metanfetamina`,created_at:`2026-08-20T20:40:22.274Z`,estoque_atual:`-1178.00`,estoque_minimo:`0`,id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460999536_01_metafetamina.png`,nome:`Metanfetamina`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T20:34:18.214Z`},"9548eee0-3083-489b-b57f-7d5a2b5358eb":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,cda_name:`Pendrive de Invasão`,created_at:`2026-08-20T20:50:41.862Z`,estoque_atual:`11.00`,estoque_minimo:`0`,id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460654889_item_19.png`,nome:`Pendrive de Invasão`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-28T15:58:56.381Z`},"9c4806d3-06f0-4261-a0fa-dc2485b8eeb5":{ativo:!0,can_be_produced:!1,can_be_sold:!1,created_at:`2026-10-18T04:14:52.301Z`,descricao:`Matéria-prima: Tecido (Pano)`,estoque_atual:`0.00`,estoque_minimo:0,id:`9c4806d3-06f0-4261-a0fa-dc2485b8eeb5`,nome:`Tecido (Pano)`,preco_sugerido:0,production_yield:1,sale_available_quantity:0,unidade:`un`,updated_at:`2026-10-18T11:14:49.074Z`},"a45fba52-7769-4533-b4b1-581e228d21f0":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Envelope Manchado`,created_at:`2026-09-03T18:44:18.812Z`,estoque_atual:`-3.00`,estoque_minimo:`0`,id:`a45fba52-7769-4533-b4b1-581e228d21f0`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788461055568_item_14.png`,nome:`Envelope Manchado`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-20T23:18:04.367Z`},"b3b621ad-3849-4796-9349-76538ea50413":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`Glock 19`,created_at:`2026-09-19T00:50:00.428Z`,estoque_atual:`-8.00`,estoque_minimo:`0`,id:`b3b621ad-3849-4796-9349-76538ea50413`,nome:`Glock 19`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-02T17:38:30.194Z`},"b41bc442-af3c-4f76-a623-bb0de67615b4":{ativo:!0,cda_name:`Energético`,created_at:`2026-11-02T02:14:44.501Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`b41bc442-af3c-4f76-a623-bb0de67615b4`,nome:`Energético`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"b5be6116-04b1-4478-a1d8-1ba1c139b2f5":{ativo:!0,cda_name:`MTAR-21`,created_at:`2026-10-24T18:22:55.375Z`,estoque_atual:`-1.00`,estoque_minimo:`0.00`,id:`b5be6116-04b1-4478-a1d8-1ba1c139b2f5`,nome:`MTAR-21`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-10-30T01:34:18.433Z`},"b626f466-ef86-408d-9f46-d3460030d8f9":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`Pé de Cabra`,created_at:`2026-09-19T00:55:38.995Z`,estoque_atual:`-5`,estoque_minimo:`0`,id:`b626f466-ef86-408d-9f46-d3460030d8f9`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789779332754_pedecabra.png`,nome:`Pé de Cabra`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-19T02:04:42.085Z`},"b9e76652-8ec0-475e-8ded-19bf5de5fcff":{ativo:!0,cda_name:`Mochila`,created_at:`2026-10-26T19:15:16.635Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`b9e76652-8ec0-475e-8ded-19bf5de5fcff`,nome:`Mochila`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-10-27T14:10:43.292Z`},"bb87c069-478e-457f-8ff1-85357676463f":{ativo:!0,can_be_produced:!1,can_be_sold:!1,descricao:`Aço de precisão fino utilizado na confecção de gazuas e lockpicks.`,estoque_atual:300,estoque_minimo:0,id:`bb87c069-478e-457f-8ff1-85357676463f`,imagem_url:`https://i.postimg.cc/tTMjSjr5/image.png`,nome:`Pinos de Tensão & Travas`,preco_sugerido:0,unidade:`conjunto`},"bbe4e806-d169-465b-a115-de1e0341f1e5":{ativo:!0,cda_name:`Arame`,created_at:`2026-10-13T23:00:20.847Z`,estoque_atual:`6800.00`,estoque_minimo:`0.00`,id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,nome:`Arame`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T16:51:24.813Z`},"bc1a1b1d-bf46-434c-9b50-532153eac358":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,created_at:`2026-08-20T20:49:44.966Z`,estoque_atual:`0`,estoque_minimo:`0`,id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787965005916_tec9.png`,nome:`Tec-9`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-09-02T20:29:43.658Z`},"bc5bf239-cd25-4c14-b5ed-777f81b1e2a6":{ativo:!0,cda_name:`Dinheiro Marcado`,created_at:`2026-10-16T22:34:39.565Z`,estoque_atual:`56531.00`,estoque_minimo:`0.00`,id:`bc5bf239-cd25-4c14-b5ed-777f81b1e2a6`,nome:`Dinheiro Marcado`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-03T20:34:18.886Z`},"c02ba803-5c22-43dc-9cbf-3c9c3024b136":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Silent Bypass`,created_at:`2026-09-19T01:18:28.012Z`,estoque_atual:`-7.00`,estoque_minimo:`0`,id:`c02ba803-5c22-43dc-9cbf-3c9c3024b136`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789781979873_chatgpt_image_18_de_set._de_2026__22_39_19.png`,nome:`Silent Bypass`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-26T20:54:01.262Z`},"c27a7a9d-818a-4564-a5c4-abbd68491cae":{ativo:!0,cda_name:`Spray Brasil`,created_at:`2026-11-02T02:14:44.501Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`c27a7a9d-818a-4564-a5c4-abbd68491cae`,nome:`Spray Brasil`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"c2907fa5-47cc-460a-b3ab-b3e0bbf81185":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`FN Five Seven`,created_at:`2026-08-20T20:49:36.003Z`,estoque_atual:`7.00`,estoque_minimo:`0`,id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964915752_fiveseven.png`,nome:`FN Five Seven`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-30T23:04:46.759Z`},"c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`60b9fb54-8cb0-4500-876f-35fe46fdb469`,cda_name:`cocaina`,created_at:`2026-08-20T20:40:55.555Z`,estoque_atual:`-615.00`,estoque_minimo:`0`,id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460967080_02_cocaina.png`,nome:`Cocaina`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T20:34:17.879Z`},"c422f268-e769-4512-9a54-364dea648720":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`G36C Mk2`,created_at:`2026-09-19T00:43:35.269Z`,estoque_atual:`-2.00`,estoque_minimo:`0`,id:`c422f268-e769-4512-9a54-364dea648720`,nome:`G36C Mk2`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T00:48:59.427Z`},"c51b7c2b-f376-4426-82fe-d82eb8c265cc":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`bbfb09dc-d783-4ea9-a38b-cc0fdbe0a611`,cda_name:`Explosivo C4`,created_at:`2026-08-20T18:28:59.507Z`,estoque_atual:`-1835.00`,estoque_minimo:`0`,id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964861864_c4.png`,nome:`C4`,preco_sugerido:`0`,production_yield:2,unidade:`un`,updated_at:`2026-11-03T10:30:54.903Z`},"c7430b4e-bd97-4f85-83ce-702492fe1d80":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`Algemas`,created_at:`2026-09-23T21:11:58.758Z`,estoque_atual:`-370.00`,estoque_minimo:`0`,id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,nome:`Algemas`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T10:36:20.793Z`},"cdd413b5-72c8-46b0-b40e-48c7af307902":{ativo:!0,cda_name:`Skate`,created_at:`2026-11-02T02:14:44.501Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`cdd413b5-72c8-46b0-b40e-48c7af307902`,nome:`Skate`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"cff66aa8-ae22-4dd5-bc6b-fcf912b147ea":{ativo:!0,categoria_id:`8549d526-c881-4da7-8eaa-459a6d52fd60`,cda_name:`Munição Rifle`,created_at:`2026-09-19T00:49:24.939Z`,estoque_atual:`-1734.00`,estoque_minimo:`0`,id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,nome:`Munição Rifle`,preco_sugerido:`0`,production_yield:30,unidade:`un`,updated_at:`2026-11-03T00:48:59.427Z`},"d9ad7c1f-93a7-44f5-afc0-75430299e5d9":{ativo:!0,cda_name:`Plano de Segurança`,created_at:`2026-10-18T23:35:24.806Z`,estoque_atual:`5.00`,estoque_minimo:`0.00`,id:`d9ad7c1f-93a7-44f5-afc0-75430299e5d9`,nome:`Plano de Segurança`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T01:26:27.312Z`},"db625331-3858-4923-8a33-c9a4eaa1c449":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Barra Maciça`,created_at:`2026-09-19T00:58:08.724Z`,estoque_atual:`4.00`,estoque_minimo:`0`,id:`db625331-3858-4923-8a33-c9a4eaa1c449`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789791861249_97e1dad2-2097-4123-91a9-c52c20963546.png`,nome:`Barra Maciça`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-10-25T00:42:38.598Z`},"dc58cd24-e100-4494-a97b-c1337d701cae":{ativo:!0,cda_name:`Missão`,created_at:`2026-10-18T23:35:24.806Z`,estoque_atual:`1.00`,estoque_minimo:`0.00`,id:`dc58cd24-e100-4494-a97b-c1337d701cae`,nome:`Missão`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-10-19T06:03:39.385Z`},"e10817fd-7798-4604-b4e2-4249dfe9273d":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`6d6ef224-4bc9-4714-a72a-d9925809b884`,cda_name:`Munição Pistola`,created_at:`2026-08-20T20:49:56.123Z`,estoque_atual:`4212.00`,estoque_minimo:`0`,id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964990040_munipistola.png`,nome:`Munição de pistola`,preco_sugerido:`0`,production_yield:50,unidade:`un`,updated_at:`2026-11-02T17:38:30.194Z`},"e1f38312-9061-466b-8ea7-b3c3729e839c":{ativo:!0,cda_name:`Chapa de Metal`,created_at:`2026-10-13T23:00:27.828Z`,estoque_atual:`51217.00`,estoque_minimo:`0.00`,id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,nome:`Chapa de Metal`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-03T10:34:15.635Z`},"e616ccac-1edb-46f6-a77b-e0471817c5ce":{ativo:!0,categoria_id:`4267449b-85b8-414a-8f09-19da6412b830`,cda_name:`Kit de Reparo Simples`,created_at:`2026-09-19T01:12:23.668Z`,estoque_atual:`-2.00`,estoque_minimo:`0`,id:`e616ccac-1edb-46f6-a77b-e0471817c5ce`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780338238_kitreparo_basico.png`,nome:`Kit de Reparo Simples`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"e93a1f12-8ebd-489e-83d6-65fd1a856501":{ativo:!0,bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,categoria_id:`60b9fb54-8cb0-4500-876f-35fe46fdb469`,created_at:`2026-08-20T20:40:47.098Z`,estoque_atual:`-1571.00`,estoque_minimo:`0`,id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460988747_04_maconha.png`,nome:`Maconha`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-03T20:34:18.550Z`},"eaef82a6-70ec-48d2-849b-8ed5242988bf":{ativo:!0,can_be_produced:!1,can_be_sold:!1,descricao:`Fibras entrelaçadas de máxima proteção balística para confecção de coletes.`,estoque_atual:60,estoque_minimo:0,id:`eaef82a6-70ec-48d2-849b-8ed5242988bf`,imagem_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460638042_capuz.png`,nome:`Tecido Kevlar Balístico`,preco_sugerido:0,unidade:`m²`},"ec788fac-98b5-4d2c-8769-0135f14dc539":{ativo:!0,cda_name:`Placa Falsa`,created_at:`2026-10-13T19:34:51.169Z`,estoque_atual:`-96.00`,estoque_minimo:`0.00`,id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,nome:`Placa Falsa`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T22:14:25.438Z`},"f51aedf9-7881-41cb-98e2-31a243a0ed6e":{ativo:!0,cda_name:`Cesta de Ovos`,created_at:`2026-11-02T02:16:18.166Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`f51aedf9-7881-41cb-98e2-31a243a0ed6e`,nome:`Cesta de Ovos`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:34.019Z`},"f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7":{ativo:!0,categoria_id:`61f7a5a4-810c-43a7-9564-035470046dc9`,cda_name:`Thermite`,created_at:`2026-09-19T01:06:47.935Z`,estoque_atual:`158.00`,estoque_minimo:`0`,id:`f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7`,nome:`Thermite`,preco_sugerido:`0`,unidade:`un`,updated_at:`2026-11-02T22:28:20.928Z`},"fedee638-2ff2-4aca-ba4d-1fab729fcbf7":{ativo:!0,cda_name:`Pistola Automática`,created_at:`2026-11-02T02:15:26.330Z`,estoque_atual:`0.00`,estoque_minimo:`0.00`,id:`fedee638-2ff2-4aca-ba4d-1fab729fcbf7`,nome:`Pistola Automática`,preco_sugerido:`0.00`,unidade:`un`,updated_at:`2026-11-02T03:24:47.672Z`}},profile_post_bookmarks:{_schema_info:{empty:!0,original_table:`profile_post_bookmarks`}},profile_post_comments:{_schema_info:{empty:!0,original_table:`profile_post_comments`}},profile_post_likes:{"06533030-a5a9-4b5e-b73e-e8a0afadb8d4":{created_at:`2026-09-19T19:07:02.970Z`,id:`06533030-a5a9-4b5e-b73e-e8a0afadb8d4`,post_id:`c5b79f4f-3d16-4503-b608-f3c2293beeb4`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"5f29229d-10bb-4b60-81b5-b566389dd4aa":{created_at:`2026-09-21T20:11:41.988Z`,id:`5f29229d-10bb-4b60-81b5-b566389dd4aa`,post_id:`c5b79f4f-3d16-4503-b608-f3c2293beeb4`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`}},profile_posts:{"c5b79f4f-3d16-4503-b608-f3c2293beeb4":{author_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,comments_count:0,content:`#TwinWheels`,created_at:`2026-09-19T19:06:48.471Z`,id:`c5b79f4f-3d16-4503-b608-f3c2293beeb4`,likes_count:1,media_type:`image`,media_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/chat-attachments/life_c5ef6dc6-e126-4027-80c3-319f0a870315_1789844784243.png`,pinned:!1,tags:[`twinwheels`],updated_at:`2026-09-19T19:06:48.471Z`}},profiles:{"09cf28ba-eab1-4794-a4d0-ff11bb764c31":{avatar_url:`https://cdn.discordapp.com/avatars/857308338382700565/a_8e51109a344a892bc401a4485eaf26ee.gif?size=512`,bio:`Gerência Operacional da Twin Wheels. Abastecimento e supervisão de vendas.`,created_at:`2026-08-28T15:08:57.984Z`,custom_status:`Twin Wheels conexão forte 🏍️`,custom_theme:{is_ceo:!1},custom_url:`lennon`,data_entrada:`2026-08-28T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/857308338382700565/a_8e51109a344a892bc401a4485eaf26ee.gif?size=512`,discord_email:`gustavomiguelmatos2@gmail.com`,discord_id:`857308338382700565`,discord_username:`_l7._#0`,game_id:`655`,id:`09cf28ba-eab1-4794-a4d0-ff11bb764c31`,is_ceo:!1,is_developer:!1,nickname:`lennon`,nome:`lennon dacoro`,status:`ativo`,telefone:`000-094`,updated_at:`2026-11-01T14:14:49.595Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"144d6caf-0576-48aa-b89d-2f911c32a101":{avatar_url:`https://cdn.discordapp.com/avatars/815425543998668860/a71da4d7e78e6fce6687cc9cdf612ebc.png?size=512`,bio:`Gerência da Família Twin Wheels. Operações táticas e logística de materiais.`,created_at:`2026-08-22T03:39:11.420Z`,custom_status:`Na pista sempre ativo ⚡`,custom_theme:{is_ceo:!1},custom_url:`sk`,data_entrada:`2026-08-22T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/815425543998668860/a71da4d7e78e6fce6687cc9cdf612ebc.png?size=512`,discord_email:`eltonvargas977@gmail.com`,discord_id:`815425543998668860`,discord_username:`skk_v2#0`,game_id:`897`,id:`144d6caf-0576-48aa-b89d-2f911c32a101`,is_ceo:!1,is_developer:!1,nickname:`SK`,nome:`JOAO SK`,status:`ativo`,telefone:`286-290`,updated_at:`2026-10-22T12:35:24.109Z`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"23bb2cb3-4bc8-48e9-b38e-78d50874083f":{is_verified:!1,updated_at:`2026-11-03T20:15:43.702Z`,is_ceo:!1},"2f4c335e-b4d3-4dbb-82a7-dc04081b7358":{avatar_url:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png?size=512`,bio:`Membro ativo da Twin Wheels. Cumprimento regular de metas e apoio em eventos.`,created_at:`2026-08-27T02:45:31.505Z`,custom_status:`Lealdade e respeito 👊`,custom_theme:{is_ceo:!1},custom_url:`zeca`,data_entrada:`2026-08-27T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png?size=512`,discord_email:`carbis231@gmail.com`,discord_id:`711610919850999869`,discord_username:`carlospvc#0`,game_id:`8393`,id:`2f4c335e-b4d3-4dbb-82a7-dc04081b7358`,is_ceo:!1,is_developer:!1,nickname:`zeca`,nome:`zeca`,status:`ativo`,telefone:`295-015`,updated_at:`2026-10-18T23:36:42.236Z`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"6e2f5d10-d684-4caf-8c1e-636b9d1a84d6":{custom_theme:{banner_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/banner_crop_c5ef6dc6-e126-4027-80c3-319f0a870315_1789761401598.png`,bgPattern:`cyber_grid`,borderGlowSpeed:`normal`,borderRadius:`smooth`,brightness:100,cardStyle:`glassmorphism`,contrast:130,custom_url:`malaca`,fontFamily:`space_grotesk`,glowEffectsEnabled:!1,glowIntensity:`medium`,hoverZoomEnabled:!1,is_ceo:!1,pageTransitionsEnabled:!1,public_profile_enabled:!0,saturation:100,social_links:{twitch:`malaca7x`},statusPulseEnabled:!1,textBrightness:105,themeStyle:`cyberpunk`,uiDensity:`normal`,is_developer:!1},is_ceo:!1,is_developer:!1,is_verified:!0,updated_at:`2026-11-03T20:41:59.366Z`},"72e8dfd2-bbbd-4a04-bb20-805d8069546d":{avatar_url:`https://cdn.discordapp.com/avatars/622074568248393749/56497321dc3ec14109f8114f8c8e608e.png?size=512`,bio:`Membro operacional da Twin Wheels. Produção, entregas e abastecimento de baús.`,created_at:`2026-08-24T02:54:03.599Z`,custom_status:`Trabalho sério em equipe 🔧`,custom_theme:{is_ceo:!1},custom_url:`kaim`,data_entrada:`2026-08-24T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/622074568248393749/56497321dc3ec14109f8114f8c8e608e.png?size=512`,discord_email:`matheusdario481@gmail.com`,discord_id:`622074568248393749`,discord_username:`adamft.#0`,game_id:`5251`,id:`72e8dfd2-bbbd-4a04-bb20-805d8069546d`,is_ceo:!1,is_developer:!1,nickname:`KAIM`,nome:`KAIM FOSTER`,status:`ativo`,telefone:`181-778`,updated_at:`2026-10-30T22:35:38.141Z`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"860f8be7-6e51-4a47-8c14-9ca912d3c20a":{avatar_url:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,custom_theme:{banner_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/banner_crop_c5ef6dc6-e126-4027-80c3-319f0a870315_1789761401598.png`,bgPattern:`subtle_dots`,borderGlowSpeed:`normal`,borderRadius:`smooth`,brightness:100,cardStyle:`glassmorphism`,contrast:100,customPrimaryColor:`gradient:linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)|#2563eb`,custom_url:`malaca7x`,fontFamily:`space_grotesk`,glowEffectsEnabled:!1,glowIntensity:`medium`,hoverZoomEnabled:!1,is_ceo:!1,is_developer:!0,pageTransitionsEnabled:!1,public_profile_enabled:!0,saturation:100,social_links:{discord:`malaca7x`,twitch:`malaca7x`},statusPulseEnabled:!1,textBrightness:100,themeStyle:`malaca_drkoled`,uiDensity:`compact`},custom_url:`malaca7x`,data_entrada:`2026-09-04T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,discord_email:`malaca7x@gmail.com`,discord_id:`722320491767136346`,discord_username:`malaca7x#0`,game_id:`5669`,id:`860f8be7-6e51-4a47-8c14-9ca912d3c20a`,is_ceo:!1,is_developer:!0,is_verified:!0,nickname:`Malaca`,nome:`Malaca`,social_links:{discord:`malaca7x`,twitch:`malaca7x`},status:`ativo`,telefone:`870-143`,updated_at:`2026-11-03T19:58:32.433Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,verified_at:`2026-10-24T01:28:09.146Z`,verified_title:`Verificado Oficial`},"868d2644-884e-4e2a-8d0a-c95775a75c37":{avatar_url:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png?size=512`,bio:`Motoqueiro da Twin Wheels. Especialista em rotas rápidas e entregas da facção.`,created_at:`2026-09-01T00:50:16.868Z`,custom_status:`Acelerando forte nas ruas 🏍️💨`,custom_theme:{is_ceo:!1},custom_url:`gaucho`,data_entrada:`2026-09-01T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png?size=512`,discord_email:`ns1660209@gmail.com`,discord_id:`1245186033868603476`,discord_username:`nyco123.#0`,game_id:`2646`,id:`868d2644-884e-4e2a-8d0a-c95775a75c37`,is_ceo:!1,is_developer:!1,nickname:`Gaúcho`,nome:`Boateiro Perick`,status:`ativo`,telefone:`120-069`,updated_at:`2026-10-18T23:36:42.765Z`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},"8f78c340-bcb0-452b-80ee-fd49ee7ce471":{avatar_url:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,created_at:`2026-08-19T19:41:42.103Z`,custom_theme:{is_ceo:!1,is_developer:!1},custom_url:`dev`,data_entrada:`2026-08-19T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,discord_email:`rogeriosantanajr@gmail.com`,discord_id:`917826984778797087`,discord_username:`malaca7#0`,game_id:`5669`,id:`8f78c340-bcb0-452b-80ee-fd49ee7ce471`,is_ceo:!1,is_developer:!1,is_verified:!0,nickname:`Dev`,nome:`Developers`,social_links:{twitch:`malaca7x`},status:`ativo`,telefone:`870-143`,updated_at:`2026-11-03T20:41:59.366Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,verified_at:`2026-11-03T20:32:49.342Z`,verified_title:`Verificado Oficial`},"a224df42-cc1d-4ded-a353-7ff22cfeaa1c":{avatar_url:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png?size=512`,bio:`Membro operacional Twin Wheels. Linha de frente nas produções semanais.`,created_at:`2026-08-27T02:47:25.485Z`,custom_status:`Firme na missão da vila 💥`,custom_theme:{is_ceo:!1},custom_url:`davila`,data_entrada:`2026-08-27T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png?size=512`,discord_email:`alisanttt2002@gmail.com`,discord_id:`1490783713187860712`,discord_username:`alisson_daniel48#0`,game_id:`8228`,id:`a224df42-cc1d-4ded-a353-7ff22cfeaa1c`,is_ceo:!1,is_developer:!1,nickname:`da vila`,nome:`Aisson da vila`,status:`ativo`,telefone:`688-102`,updated_at:`2026-10-18T23:36:43.117Z`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},"b4ab8112-36c7-4086-8364-ff2388472db8":{avatar_url:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,bio:`Gerência da Twin Wheels. Controle administrativo e acompanhamento de metas dos membros.`,created_at:`2026-08-20T20:36:45.146Z`,custom_status:`Foco e disciplina 🐍`,custom_theme:{is_ceo:!1},custom_url:`medusa`,data_entrada:`2026-08-20T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,discord_email:`karyknms@gmail.com`,discord_id:`343459063616765953`,discord_username:`karianny#0`,game_id:`6079`,id:`b4ab8112-36c7-4086-8364-ff2388472db8`,is_ceo:!1,is_developer:!1,nickname:`Medusa`,nome:`Medusa Toretto`,status:`ativo`,telefone:`005-056`,updated_at:`2026-10-18T23:36:43.293Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"b4ca3610-8701-437d-9afb-bb02bae62ea7":{avatar_url:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png?size=512`,bio:`Gerência Twin Wheels. Organização interna e suporte operacional.`,created_at:`2026-08-28T18:31:57.109Z`,custom_status:`Sempre pronto pras missões 🛡️`,custom_theme:{is_ceo:!1},custom_url:`macae`,data_entrada:`2026-08-28T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png?size=512`,discord_email:`igorsantosaaz@gmail.com`,discord_id:`628374267095941131`,discord_username:`macae#0`,game_id:`590`,id:`b4ca3610-8701-437d-9afb-bb02bae62ea7`,is_ceo:!1,is_developer:!1,nickname:`Macaé`,nome:`Macaé Dacoro`,status:`ativo`,telefone:`021-000`,updated_at:`2026-10-18T23:36:43.469Z`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"c5ef6dc6-e126-4027-80c3-319f0a870315":{custom_theme:{banner_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/banner_crop_c5ef6dc6-e126-4027-80c3-319f0a870315_1789761401598.png`,bgPattern:`subtle_dots`,borderGlowSpeed:`normal`,borderRadius:`smooth`,brightness:100,cardStyle:`glassmorphism`,contrast:100,customPrimaryColor:`gradient:linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)|#2563eb`,custom_url:`malaca7x`,fontFamily:`space_grotesk`,glowEffectsEnabled:!1,glowIntensity:`medium`,hoverZoomEnabled:!1,is_ceo:!1,is_developer:!0,pageTransitionsEnabled:!1,public_profile_enabled:!0,saturation:100,social_links:{discord:`malaca7x`,twitch:`malaca7x`},statusPulseEnabled:!1,textBrightness:100,themeStyle:`malaca_drkoled`,uiDensity:`compact`},is_ceo:!1,is_verified:!0,updated_at:`2026-11-03T19:58:32.433Z`},"d1259975-cf8a-4fd7-ab94-83d8fb1f66aa":{avatar_url:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,bio:`Liderança Geral 01 LC da Twin Wheels. Coordenação operacional, gestão de caixas e liderança da família.`,created_at:`2026-08-20T15:40:19.043Z`,custom_status:`Liderança Twin Wheels 01 LC ⚔️`,custom_theme:{is_ceo:!0},custom_url:`lc`,data_entrada:`2026-08-20T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,discord_email:`lukaasgogos2010@gmail.com`,discord_id:`251079840931774465`,discord_username:`lcsluuca#0`,game_id:`274`,id:`d1259975-cf8a-4fd7-ab94-83d8fb1f66aa`,is_ceo:!0,is_developer:!1,is_verified:!0,nickname:`01 LC`,nome:`Andrew Delucca Ferreira`,status:`ativo`,telefone:`762-762`,updated_at:`2026-10-31T05:08:18.380Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,verified_at:`2026-10-31T05:08:18.381Z`,verified_title:`Verificado`},"d8261681-8469-4643-bca0-5fc154b3a25b":{is_verified:!0,updated_at:`2026-10-31T05:08:18.380Z`,is_ceo:!0,custom_theme:{is_ceo:!0}},"discord-417371428141400067":{avatar_url:`https://cdn.discordapp.com/avatars/417371428141400067/5c577e0ef8c7445a1d709462a13a6570.png?size=512`,created_at:`2026-10-25T20:10:44.900Z`,data_entrada:`2026-10-25`,discord_avatar_url:`https://cdn.discordapp.com/avatars/417371428141400067/5c577e0ef8c7445a1d709462a13a6570.png?size=512`,discord_email:`nicolas.tortato@gmail.com`,discord_id:`417371428141400067`,discord_username:`nicolastortato`,game_id:`8732`,id:`discord-417371428141400067`,nickname:`Nicolas`,nome:`Nicolas Kovarik Void`,status:`pendente`,telefone:`104-700`,updated_at:`2026-10-25T20:10:44.900Z`,user_id:`discord-417371428141400067`,is_ceo:!1},"f42598be-eba5-409e-92d0-f1a9026056e8":{avatar_url:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png?size=512`,bio:`Sub-Líder 02 da Twin Wheels. Comando de campo e segurança operacional.`,created_at:`2026-08-21T00:51:28.965Z`,custom_status:`Twin Wheels Sempre!`,custom_theme:{is_ceo:!1},custom_url:`toretto`,data_entrada:`2026-08-21T03:00:00.000Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png?size=512`,discord_email:`livedoball@gmail.com`,discord_id:`899381358823104513`,discord_username:`manball2590#0`,game_id:`494`,id:`f42598be-eba5-409e-92d0-f1a9026056e8`,is_ceo:!1,is_developer:!1,is_verified:!1,nickname:`02 Toretto`,nome:`Toretto`,status:`ativo`,telefone:`000-494`,updated_at:`2026-10-31T05:08:39.154Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,verified_at:`2026-10-31T05:08:39.155Z`}},raw_materials:{"842e163a-9f5a-489b-8688-840525d53691":{id:`842e163a-9f5a-489b-8688-840525d53691`,is_active:!0,min_stock:0,name:`Tecido (Pano)`,product_id:`9c4806d3-06f0-4261-a0fa-dc2485b8eeb5`,stock_quantity:0,unit:`un`},"b08bb347-b36c-4a23-8df7-21e4256dfeb6":{id:`b08bb347-b36c-4a23-8df7-21e4256dfeb6`,is_active:!0,min_stock:0,name:`Arame`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,stock_quantity:0,unit:`un`},"e0b0b3d8-6da5-4325-91d6-cbb9878ea520":{id:`e0b0b3d8-6da5-4325-91d6-cbb9878ea520`,is_active:!0,min_stock:0,name:`Chapa de Metal`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,stock_quantity:0,unit:`un`},"e5e6734c-9bd4-4bc9-bb6c-0b7b7b53feef":{id:`e5e6734c-9bd4-4bc9-bb6c-0b7b7b53feef`,is_active:!0,min_stock:0,name:`Tela LCD`,product_id:`477b2f1d-fcae-4dbb-85ca-6df1303543a8`,stock_quantity:0,unit:`un`},"eaca0c65-ccc9-4290-9f7f-f189aeb5cfec":{id:`eaca0c65-ccc9-4290-9f7f-f189aeb5cfec`,is_active:!0,min_stock:0,name:`Linha`,product_id:`6e59ec4d-5d42-40d4-ae6f-b7952061bd8e`,stock_quantity:0,unit:`un`},rm_aco_maciço:{created_at:`2026-10-13T19:27:19.281Z`,description:`Ligas de aço temperado para estojos, canos de armas e ferramentas pesadas.`,id:`rm_aco_maciço`,image_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788461055568_item_14.png`,is_active:!0,name:`Aço de Alta Resistência`,product_id:`92788434-c6ab-47e8-b613-765f916a2075`,stock_quantity:120,unit:`barra`,updated_at:`2026-10-14T13:43:04.373Z`},rm_circuitos_chips:{created_at:`2026-10-13T19:27:19.281Z`,description:`Componentes avançados para placas de decodificação e pendrives de invasão.`,id:`rm_circuitos_chips`,image_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460654889_item_19.png`,is_active:!0,name:`Chips Eletrônicos & Circuitos`,product_id:`364659e6-f3d5-46fb-bf64-a8cb2436278c`,stock_quantity:95,unit:`un`,updated_at:`2026-10-14T13:43:04.767Z`},rm_kevlar:{created_at:`2026-10-13T19:27:19.281Z`,description:`Fibras entrelaçadas de máxima proteção balística para confecção de coletes.`,id:`rm_kevlar`,image_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1788460638042_capuz.png`,is_active:!0,name:`Tecido Kevlar Balístico`,product_id:`eaef82a6-70ec-48d2-849b-8ed5242988bf`,stock_quantity:60,unit:`m²`,updated_at:`2026-10-14T13:43:05.170Z`},rm_pecas_armas:{created_at:`2026-10-13T19:27:19.281Z`,description:`Gatilhos, percursores, molas e receptores para montagem de armamento.`,id:`rm_pecas_armas`,image_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1789780521946_uzi.png`,is_active:!0,name:`Peças Mecânicas de Armas`,product_id:`1b115ea2-e111-4cce-ab3c-676c6de91054`,stock_quantity:85,unit:`kit`,updated_at:`2026-10-14T13:43:06.097Z`},rm_pinos_lockpick:{created_at:`2026-10-13T19:27:19.281Z`,description:`Aço de precisão fino utilizado na confecção de gazuas e lockpicks.`,id:`rm_pinos_lockpick`,image_url:`https://i.postimg.cc/tTMjSjr5/image.png`,is_active:!0,name:`Pinos de Tensão & Travas`,product_id:`bb87c069-478e-457f-8ff1-85357676463f`,stock_quantity:300,unit:`conjunto`,updated_at:`2026-10-14T13:43:06.288Z`},rm_polvora:{created_at:`2026-10-13T19:27:19.281Z`,description:`Composto altamente inflamável para fabricação de munições e explosivos.`,id:`rm_polvora`,image_url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/item_1787964928163_hacking.png`,is_active:!0,name:`Pólvora Pura`,product_id:`6f99a55a-46af-411c-affc-15cbce601d62`,stock_quantity:450,unit:`kg`,updated_at:`2026-10-14T13:43:06.468Z`}},role_permissions:{"01":{level:`01`,nivel:`01`,permissions:`view_dashboard,view_chat,create_chat_group,manage_chat_groups,view_cash_fund,manage_cash_fund,reverse_cash_fund,delete_cash_movement,view_movements,view_all_movements,view_sales,create_sale,reverse_sale,delete_sale,view_members,view_sensitive_data,approve_requests,change_roles,promote_members,edit_members,delete_members,view_consolidated_financials,manage_roles,manage_announcements,view_rankings,view_performance,manage_performance,inspect_member_performance,view_goals,manage_goals,view_hierarchy,manage_hierarchy,view_audit,view_financials,manage_members,view_all_sales,view_absences,request_absence,manage_absences,view_all_absences,create_ticket,view_all_tickets,manage_tickets,view_movement_baus,view_movement_balances,estoque.visualizar,estoque.auditoria,estoque.ajustar,estoque.adicionar,estoque.remover,estoque.corrigir,estoque.configurar,reverse_movement,create_movement,view_life,life_view_following,life_view_bookmarks,post_life,life_post_image,life_post_video,life_mention_members,life_use_hashtags,life_like_posts,life_bookmark_posts,life_comment_posts,life_delete_own_comment,life_delete_own_post,life_follow_members,life_pin_posts,life_moderate_posts,life_moderate_comments,view_lives,link_stream_account,manage_stream_accounts,force_end_live_session,manage_lives,view_stream_logs,view_notifications,manage_notifications,view_stock_management,manage_stock_products,manage_stock_categories,manage_stock_baus,adjust_stock_balance,manage_stock_balance,escalas.view,escalas.details,escalas.create,escalas.edit,escalas.delete,escalas.publish,escalas.cancel,escalas.manage_members,escalas.add_participants,escalas.remove_participants,escalas.confirm_presence,escalas.manage_slots,escalas.substitute,escalas.history,escalas.settings,verification.view_page,verification.request,verification.cancel_own,reply_tickets,claim_tickets,transfer_tickets,change_ticket_status,internal_notes_tickets,manage_ticket_members,close_tickets,reopen_tickets,view_rankings_xp,view_insignias,grant_insignia,view_shop,buy_shop_items,evaluate_member,view_member_xp,manage_xp_rules,view_profile,edit_profile_data,edit_profile_banner,edit_profile_bio,edit_profile_custom_url,edit_profile_appearance`.split(`,`),updated_at:`2026-10-24T04:32:03.390Z`},"02":{level:`02`,nivel:`02`,permissions:`view_dashboard,view_chat,create_chat_group,manage_chat_groups,view_cash_fund,manage_cash_fund,reverse_cash_fund,delete_cash_movement,view_movements,view_all_movements,view_sales,create_sale,reverse_sale,delete_sale,view_members,view_sensitive_data,approve_requests,change_roles,promote_members,edit_members,delete_members,view_consolidated_financials,manage_roles,manage_announcements,view_rankings,view_performance,manage_performance,inspect_member_performance,view_goals,manage_goals,view_hierarchy,manage_hierarchy,view_audit,view_profile,view_financials,manage_members,view_all_sales,view_absences,request_absence,manage_absences,view_all_absences,view_tickets,create_ticket,view_all_tickets,manage_tickets,view_movement_baus,view_movement_balances,estoque.visualizar,estoque.auditoria,estoque.ajustar,estoque.adicionar,estoque.remover,estoque.corrigir,estoque.configurar,reverse_movement,create_movement,view_stock_management,adjust_stock_balance,manage_stock_balance,view_life,life_view_following,life_view_bookmarks,post_life,life_post_image,life_post_video,life_mention_members,life_use_hashtags,life_like_posts,life_bookmark_posts,life_comment_posts,life_delete_own_comment,life_delete_own_post,life_follow_members,life_pin_posts,life_moderate_posts,life_moderate_comments,view_lives,link_stream_account,force_end_live_session,view_notifications,manage_notifications,manage_stock_products,manage_stock_categories,manage_stock_baus,escalas.view,escalas.details,escalas.create,escalas.edit,escalas.delete,escalas.publish,escalas.cancel,escalas.manage_members,escalas.add_participants,escalas.remove_participants,escalas.confirm_presence,escalas.manage_slots,escalas.substitute,escalas.history,escalas.settings,verification.view_page,verification.request,verification.cancel_own,reply_tickets,claim_tickets,transfer_tickets,change_ticket_status,internal_notes_tickets,manage_ticket_members,close_tickets,reopen_tickets,view_member_xp,evaluate_member,view_rankings_xp,view_insignias,grant_insignia,view_shop,buy_shop_items`.split(`,`),updated_at:`2026-10-19T04:35:42.022Z`},ceo:{id:`ceo`,level:`ceo`,nivel:`ceo`,permissions:`view_dashboard,view_cash_fund,manage_cash_fund,view_stock,view_movements,view_baus,manage_baus,view_all_movements,view_sales,create_sale,reverse_sale,view_products,manage_products,view_categories,manage_categories,view_members,manage_roles,manage_announcements,view_rankings,view_performance,inspect_member_performance,view_goals,manage_goals,view_hierarchy,view_audit,view_profile,view_chat,create_chat_group,manage_chat_groups,view_absences,manage_absences,view_all_absences,view_tickets,create_ticket,manage_tickets,view_notifications,view_ceo_financials,view_ceo,request_absence,view_movement_baus,view_movement_balances,manage_performance,webhook_copy_url,view_ceo_notifications,create_ceo_notification,toggle_ceo_notification_active,estoque.visualizar,estoque.auditoria,create_movement,reverse_cash_fund,view_ceo_stock_adjustments,manage_ceo_stock_adjustments,ceo_adjust_stock_balance,ceo_stock_add,ceo_stock_remove,manage_ceo_bot,view_stock_management,manage_stock_products,manage_stock_categories,manage_stock_baus,adjust_stock_balance,manage_stock_balance,manage_ceo_webhooks,view_ceo_tag_permissions,create_ceo_tag,edit_ceo_tag,delete_ceo_tag,assign_ceo_tag,atendimento_tickets.view,view_all_tickets,claim_tickets,reply_tickets,transfer_tickets,change_ticket_status,internal_notes_tickets,manage_ticket_members,close_tickets,reopen_tickets,view_warnings,view_all_warnings,create_warning,create_suspension,edit_warning,revoke_warning,view_warning_details,manage_warnings,raw_materials.view,raw_materials.create,raw_materials.edit,raw_materials.delete,raw_materials.adjust,raw_materials.transfer_bau,raw_materials.history,production_management.view,production_management.products,production_management.raw_materials,production_management.productions,production_management.settings,production_management.reports,productions.view,productions.create,productions.edit,productions.delete,warehouse.view,warehouse.transfer,warehouse.transfer_storage,warehouse.transfer_sale,warehouse.adjust,warehouse.history,manage_hierarchy,reverse_movement,view_rankings_xp,grant_insignia,buy_shop_items,view_shop,manage_shop,manage_insignias_catalog,evaluate_member,manage_xp_rules,verification.view_page,verification.request,verification.cancel_own,escalas.view,escalas.details,escalas.create,escalas.edit,escalas.publish,escalas.cancel,escalas.manage_members,escalas.add_participants,escalas.remove_participants,escalas.confirm_presence,escalas.manage_slots,escalas.substitute,escalas.history,escalas.settings,manage_notifications,send_notifications,edit_profile_data,edit_profile_banner,edit_profile_bio,edit_profile_custom_url,edit_profile_appearance,manage_ceo_tag_permissions,view_ceo_warnings,manage_ceo_warnings,verification.manage,verification.review,verification.grant_direct,verification.revoke,verification.audit,bot_change_presence,bot_change_name,bot_change_avatar,bot_change_banner,view_sensitive_data,view_consolidated_financials,approve_requests,edit_members`.split(`,`),updated_at:`2026-11-03T19:52:55.235Z`},desenvolvedor:{id:`desenvolvedor`,level:`desenvolvedor`,nivel:`desenvolvedor`,permissions:`verification.view_page,verification.request,verification.cancel_own,verification.manage,verification.review,verification.grant_direct,verification.revoke,verification.config,verification.requirements,verification.audit,raw_materials.view,raw_materials.create,raw_materials.edit,raw_materials.delete,raw_materials.adjust,raw_materials.transfer_bau,raw_materials.history,productions.view,productions.create,productions.edit,productions.delete,view_productions,create_production,warehouse.view,warehouse.transfer,warehouse.transfer_storage,warehouse.transfer_sale,warehouse.adjust,warehouse.history,view_warehouse,production_management.view,production_management.products,production_management.raw_materials,production_management.productions,production_management.settings,production_management.reports,view_production_management,sales.view,sales.create,sales.edit,sales.cancel,sales.history,escalas.view,escalas.details,escalas.create,escalas.edit,escalas.delete,escalas.publish,escalas.cancel,escalas.manage_members,escalas.add_participants,escalas.remove_participants,escalas.confirm_presence,escalas.manage_slots,escalas.substitute,escalas.history,escalas.settings,view_stock_management,life_view_following,life_view_bookmarks,post_life,life_post_image,life_post_video,life_mention_members,life_use_hashtags,life_like_posts,life_bookmark_posts,life_comment_posts,life_delete_own_comment,life_delete_own_post,life_follow_members,life_pin_posts,life_moderate_posts,life_moderate_comments,manage_life,view_stock_management,manage_stock_products,manage_stock_categories,manage_stock_baus,adjust_stock_balance,manage_stock_balance,view_chat,create_chat_group,manage_chat_groups,view_absences,request_absence,manage_absences,view_all_absences,view_cash_fund,manage_cash_fund,reverse_cash_fund,delete_cash_movement,view_stock,view_movements,create_movement,reverse_movement,delete_movement,view_movement_balances,view_movement_baus,view_baus,manage_baus,view_all_movements,view_sales,create_sale,reverse_sale,delete_sale,view_products,manage_products,view_categories,manage_categories,view_members,view_sensitive_data,approve_requests,change_roles,promote_members,edit_members,delete_members,view_consolidated_financials,manage_roles,manage_announcements,view_rankings,view_rankings_xp,view_rankings_financial,view_rankings_movements,view_insignias,grant_insignia,manage_insignias_catalog,view_shop,buy_shop_items,manage_shop,evaluate_member,manage_xp_rules,adjust_member_xp,view_member_xp,view_performance,manage_performance,inspect_member_performance,view_goals,manage_goals,view_hierarchy,manage_hierarchy,view_audit,manage_platform_settings,manage_menu_settings,trigger_force_cache_purge,view_patch_notes,manage_patch_notes,view_tickets,create_ticket,reply_tickets,reply_ticket,view_all_tickets,atendimento_tickets.view,view_atendimento_tickets,claim_tickets,claim_ticket,transfer_tickets,transfer_ticket,change_ticket_status,internal_notes_tickets,manage_ticket_members,close_tickets,close_ticket,reopen_tickets,reopen_ticket,delete_tickets,delete_ticket,manage_tickets,view_notifications,send_notifications,manage_notifications,configure_notifications_sound,view_ceo_notifications,create_ceo_notification,edit_ceo_notification,delete_ceo_notification,toggle_ceo_notification_active,view_ceo_warnings,manage_ceo_warnings,view_ceo_stock_adjustments,manage_ceo_stock_adjustments,ceo_adjust_stock_balance,ceo_stock_add,ceo_stock_remove,view_ceo_tag_permissions,manage_ceo_tag_permissions,create_ceo_tag,edit_ceo_tag,delete_ceo_tag,manage_ceo_tag_permissions_detail,manage_ceo_tag_rules,assign_ceo_tag,view_dev_tags,manage_dev_tags,view_dev_warnings,manage_dev_warnings,view_dev_notifications,manage_dev_notification_rules,create_dev_notification,edit_dev_notification,delete_dev_notification,simulate_dev_notification,toggle_dev_notification_active,purge_dev_notifications,inspect_dev_notification_payload,export_dev_notifications,manage_dev_notification_sounds,broadcast_dev_emergency_alert,view_lives,manage_lives,link_stream_account,manage_stream_accounts,force_end_live_session,simulate_live_stream,configure_stream_api,view_stream_logs,view_profile,edit_profile_data,edit_profile_banner,edit_profile_bio,edit_profile_custom_url,edit_profile_appearance,view_dev_hub,manage_dev_bot,manage_dev_patch_notes,manage_dev_performance,manage_dev_permissions,manage_dev_config,manage_dev_menu,manage_dev_gamification,view_dev_shop,create_dev_shop_item,edit_dev_shop_item,delete_dev_shop_item,manage_dev_shop_prices,manage_dev_shop_stock,manage_dev_shop_orders,deliver_dev_shop_order,refund_dev_shop_order,view_dev_coins,grant_dev_coins,deduct_dev_coins,view_dev_coins_transactions,manage_dev_coins_rates,manage_dev_coins_batch,view_ceo,manage_ceo_bot,bot_send_message,bot_add_app,bot_change_status,bot_change_name,bot_change_avatar,bot_change_banner,bot_change_presence,bot_restart,bot_power_toggle,bot_invite,bot_manage_roles,bot_manage_token,bot_view_intents,bot_change_intents,bot_manage_discloud_config,manage_ceo_webhooks,webhook_send_message,webhook_test,webhook_create,webhook_edit,webhook_delete,webhook_toggle_active,webhook_copy_url,webhook_view_code,webhook_save_config,view_ceo_financials,estoque.visualizar,estoque.ajustar,estoque.adicionar,estoque.remover,estoque.corrigir,estoque.configurar,estoque.auditoria,view_warnings,view_all_warnings,create_warning,create_suspension,edit_warning,revoke_warning,delete_warning,view_warning_details,export_warnings,manage_warnings,manage_permissions,view_life,view_dashboard`.split(`,`),updated_at:`2026-10-31T07:33:33.663Z`},gerente:{level:`gerente`,nivel:`gerente`,permissions:`view_dashboard,view_all_movements,view_sales,create_sale,view_all_sales,view_members,change_roles,view_financials,approve_requests,manage_cash_fund,reverse_cash_fund,reverse_sale,edit_members,manage_announcements,view_performance,view_rankings,view_goals,manage_goals,view_cash_fund,manage_performance,inspect_member_performance,promote_members,view_movements,view_profile,view_hierarchy,view_chat,create_chat_group,view_consolidated_financials,view_sensitive_data,view_absences,request_absence,manage_absences,view_tickets,create_ticket,view_all_tickets,manage_tickets,view_movement_baus,view_movement_balances,estoque.visualizar,estoque.auditoria,create_movement,view_life,life_view_following,life_view_bookmarks,post_life,life_post_image,life_post_video,life_mention_members,life_use_hashtags,life_like_posts,life_bookmark_posts,life_comment_posts,life_delete_own_comment,life_delete_own_post,life_follow_members,life_moderate_posts,life_moderate_comments,view_lives,link_stream_account,force_end_live_session,view_notifications,manage_notifications,reverse_movement,edit_profile_data,edit_profile_banner,edit_profile_bio,edit_profile_custom_url,edit_profile_appearance,escalas.view,escalas.details,escalas.create,escalas.edit,escalas.publish,escalas.cancel,escalas.manage_members,escalas.add_participants,escalas.remove_participants,escalas.confirm_presence,escalas.manage_slots,escalas.substitute,escalas.settings,verification.view_page,verification.request,verification.cancel_own,close_tickets,manage_ticket_members,internal_notes_tickets,change_ticket_status,transfer_tickets,claim_tickets,reply_tickets,view_member_xp,evaluate_member,buy_shop_items,view_shop,grant_insignia,view_insignias,view_rankings_xp`.split(`,`),updated_at:`2026-10-19T04:36:16.607Z`},membro:{level:`membro`,nivel:`membro`,permissions:`view_dashboard,view_chat,create_chat_group,view_absences,request_absence,view_rankings,view_performance,view_goals,view_hierarchy,view_tickets,create_ticket,view_notifications,view_profile,view_movements,view_all_movements,view_movement_balances,view_movement_baus,create_movement,view_life,life_view_following,life_view_bookmarks,post_life,life_post_image,life_post_video,life_mention_members,life_use_hashtags,life_like_posts,life_bookmark_posts,life_comment_posts,life_delete_own_comment,life_delete_own_post,life_follow_members,view_lives,link_stream_account,force_end_live_session,manage_notifications,edit_profile_bio,edit_profile_custom_url,edit_profile_appearance,edit_profile_banner,escalas.view,escalas.details,escalas.confirm_presence,verification.view_page,verification.request,verification.cancel_own,view_rankings_xp,evaluate_member,view_insignias,view_members,reply_tickets`.split(`,`),updated_at:`2026-10-31T07:24:30.274Z`},motoqueiro:{level:`motoqueiro`,nivel:`motoqueiro`,permissions:`view_dashboard,view_performance,view_rankings,view_chat,create_chat_group,view_absences,request_absence,view_goals,view_tickets,create_ticket,view_movements,view_all_movements,view_movement_baus,view_movement_balances,estoque.visualizar,estoque.auditoria,create_movement,view_life,life_view_following,life_view_bookmarks,post_life,life_post_image,life_post_video,life_mention_members,life_use_hashtags,life_like_posts,life_bookmark_posts,life_comment_posts,life_delete_own_comment,life_delete_own_post,life_follow_members,view_lives,link_stream_account,force_end_live_session,view_notifications,manage_notifications,view_hierarchy,view_members,view_profile,edit_profile_banner,edit_profile_bio,edit_profile_custom_url,edit_profile_appearance,escalas.view,escalas.details,escalas.confirm_presence,verification.view_page,verification.request,verification.cancel_own,evaluate_member,view_rankings_xp,view_insignias,view_shop,buy_shop_items,reply_tickets`.split(`,`),updated_at:`2026-10-31T03:02:15.007Z`},novato:{level:`novato`,nivel:`novato`,permissions:[`view_dashboard`,`view_profile`,`view_performance`,`view_chat`,`create_chat_group`,`view_tickets`,`create_ticket`,`view_lives`,`link_stream_account`,`force_end_live_session`,`view_notifications`,`manage_notifications`],updated_at:`2026-10-31T02:40:29.493Z`},system_absences_list:{level:`system_absences_list`,nivel:`system_absences_list`,permissions:{absences:[{created_at:`2026-10-31T04:52:18.543Z`,days_count:33,end_date:`2026-12-02`,id:`abs_1793422338543_63gd2`,member_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,member_name:`Malaca`,member_nickname:`Malaca`,member_role:`motoqueiro`,reason:`motivo_pessoal`,reason_details:`Resolvendo bronca família, e fazendo mudança`,start_date:`2026-10-31`,status:`pendente`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{created_at:`2026-09-19T01:34:34.182Z`,days_count:35,end_date:`2026-10-03`,id:`abs_1789781674182_u59pb`,member_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,member_name:`Malaca`,member_role:`membro`,reason:`problemas_tecnicos`,reason_details:`Problemas com FiveM`,reviewed_at:`2026-09-19T01:34:50.764Z`,reviewed_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,reviewed_by_name:`Malaca`,start_date:`2026-08-30`,status:`aprovado`,updated_at:`2026-09-19T01:34:50.764Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`}]},updated_at:`2026-10-31T04:52:18.745Z`},system_bots_v1:{level:`system_bots_v1`,nivel:`system_bots_v1`,permissions:[{applicationId:`1536184283197079622`,avatarUrl:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bot/avatar_1789618051056_twin_wheell_pro.png`,commands:[{actions:[{config:{color:`#10B981`,description:`Olá {{user.mention}}! O Slash Command foi executado com sucesso.
<frase>`},id:`act_1789792830904`,name:`Resposta do Slash Command`,order:1,type:`send_message`}],botId:`bot_twin_wheels_official`,createdAt:`2026-09-19T04:40:30.904Z`,description:`Oi`,enabled:!1,guildId:`1535505650308620400`,id:`cmd_1789792830904`,isSlash:!0,name:`oi`,parameters:[{defaultValue:``,description:`texto`,id:`param_1789792850261_0biz`,name:`frase`,required:!0,type:`string`}],prefix:`/`,updatedAt:`2026-09-19T04:43:32.760Z`}],createdAt:`2026-09-13T03:52:45.308Z`,description:`Bot de Twin Wheels`,enabled:!1,events:[{actions:[{config:{channelId:`1548413371194286314`,color:`#8B5CF6`,description:`Bem-vindo ao servidor, {{user.name}}!`},id:`act_1789277319913`,name:`Enviar Mensagem de Boas-vindas`,order:1,type:`send_message`}],botId:`bot_twin_wheels_official`,conditions:[{id:`group_1789275908623`,logic:`AND`}],createdAt:`2026-09-13T05:04:11.870Z`,description:`Quando um usuario entra`,enabled:!1,guildId:`all`,id:`evt_1789275851870`,name:`Evento: Novo Membro Entrou no Servidor`,triggerType:`member_join`,updatedAt:`2026-09-13T05:29:50.556Z`}],guildId:`1537229296697999462`,id:`bot_twin_wheels_official`,name:`Twin Wheels`,prefix:`/`,stats:{commandsCount:1,errorsCount:0,eventsCount:1,lastExecutedAt:`2026-09-13T05:28:01.929Z`,timersCount:2,totalExecutions:49},status:`online`,timers:[{actions:[{config:{color:`#06B6D4`,description:`Atenção membros da Twin Wheels! Lembramos que as entregas de insumos e cotas do baú encerram às 23:59.

Registre todas as suas movimentações no painel web!`,title:`⏰ Lembrete: Entrega de Metas Diárias`},id:`act_timer_embed`,name:`Disparar Lembrete`,order:1,type:`send_message`}],botId:`bot_twin_wheels_official`,createdAt:`2026-09-13T03:52:45.309Z`,description:`Envia um aviso automático todos os dias para lembrar os membros sobre as cotas diárias de entrega.`,enabled:!0,executionCount:14,guildId:`all`,id:`timer_daily_meta`,lastRunAt:`2026-09-12T23:52:45.309Z`,name:`Lembrete Diário de Metas`,nextRunAt:`2026-09-13T23:52:45.309Z`,repeat:!0,scheduleConfig:{timeOfDay:`20:00`,timezone:`America/Sao_Paulo`},scheduleType:`daily`,updatedAt:`2026-09-13T03:52:45.309Z`},{actions:[{config:{color:`#06B6D4`,description:`Mensagem agendada pelo timer`},id:`act_1789275199390`,name:`Lembrete Programado`,order:1,type:`send_message`}],botId:`bot_twin_wheels_official`,createdAt:`2026-09-13T04:53:19.390Z`,description:``,enabled:!0,executionCount:0,guildId:`all`,id:`timer_1789275199390`,name:`1 min`,repeat:!0,scheduleConfig:{intervalMinutes:1,timeOfDay:`20:00`,timezone:`America/Sao_Paulo`},scheduleType:`interval`,updatedAt:`2026-09-13T04:53:19.390Z`}],updatedAt:`2026-10-29T04:24:03.240Z`,variables:[{botId:`bot_twin_wheels_official`,description:`Valor da cota semanal por membro da facção`,id:`var_meta_semanal`,name:`meta_semanal`,scope:`bot`,type:`number`,value:`50000`},{botId:`bot_twin_wheels_official`,description:`Texto padrão de status da facção`,id:`var_mensagem_status`,name:`status_msg`,scope:`global`,type:`string`,value:`Twin Wheels no topo! 🏍️`}]}],updated_at:`2026-10-29T04:24:03.240Z`},system_ceo_config:{level:`system_ceo_config`,nivel:`system_ceo_config`,permissions:{activeCeoUserIds:[],allowAnnouncements:!0,allowFinancials:!0,allowManageBot:!0,allowStockAdjustments:!0,allowWebhooks:!0,badgeColor:`gold`,badgeLabel:`CEO`,description:`Diretoria Executiva da facção Twin Wheels. Gestão operacional avançada e liderança de negócios.`,enabled:!0,executiveBypassLevel:!1,showRealBalance:!0,themeColor:`amber`,updatedAt:`2026-11-03T20:41:59.366Z`},updated_at:`2026-11-03T20:42:00.688Z`},system_ceo_menu_config:{level:`system_ceo_menu_config`,nivel:`system_ceo_menu_config`,permissions:{categories:[`CEO`],items:[{category:`CEO`,iconName:`LayoutDashboard`,id:`ceo-dashboard`,order:0,title:`Visão Geral & Métricas`,url:`/ceo/dashboard`,visible:!0},{category:`CEO`,iconName:`Bot`,id:`ceo-bot`,order:1,title:`Gerenciar Bot`,url:`/ceo/bot`,visible:!0},{category:`CEO`,iconName:`Webhook`,id:`ceo-webhooks`,order:2,title:`WebHook Discord`,url:`/ceo/webhooks`,visible:!0},{category:`CEO`,iconName:`Landmark`,id:`ceo-financas`,order:3,title:`Fundo de Caixa & Finanças`,url:`/ceo/financas`,visible:!1},{category:`CEO`,iconName:`Sliders`,id:`ceo-ajustes-estoque`,order:4,title:`Ajustes de Estoque`,url:`/ceo/ajustes-estoque`,visible:!0},{category:`CEO`,iconName:`Tags`,id:`ceo-tags`,order:5,title:`Gerenciar Tags`,url:`/ceo/tags`,visible:!0},{category:`CEO`,iconName:`BadgeCheck`,id:`ceo-selos`,order:6,title:`Gerenciar Selos`,url:`/ceo/selos`,visible:!0},{category:`CEO`,iconName:`BellRing`,id:`ceo-notificacoes`,order:7,title:`Central de Notificações`,url:`/ceo/notificacoes`,visible:!0},{category:`CEO`,iconName:`ShieldAlert`,id:`ceo-advertencias`,order:8,title:`Advertências & Suspensões`,url:`/ceo/advertencias`,visible:!0}]},updated_at:`2026-10-19T01:20:58.969Z`},system_dev_config:{level:`system_dev_config`,nivel:`system_dev_config`,permissions:{ceoPanelIcon:`Crown`,ceoThemeColor:`pearl-jade`,devAuditLogs:!0,devPanelIcon:`Terminal`,devSystemNotifications:!1,devThemeColor:`gradient-sunset`,developerBypassMode:!1,memberPanelIcon:`Users`,memberThemeColor:`gradient-amethyst`},updated_at:`2026-10-31T05:10:00.743Z`},system_dev_menu_config:{level:`system_dev_menu_config`,nivel:`system_dev_menu_config`,permissions:{categories:[`Dev Tools`,`Dev Gestão`],categoryIcons:{"Dev Gestão":`Gauge`,"Dev Tools":`Wrench`},items:[{category:`Dev Tools`,iconName:`Code2`,id:`dev-configuracao`,order:0,title:`Configurações Dev`,url:`/dev/configuracao`,visible:!0},{category:`Dev Tools`,iconName:`Bot`,id:`dev-bot`,order:1,title:`Gerenciar Bot`,url:`/dev/bot`,visible:!0},{category:`Dev Gestão`,iconName:`Boxes`,id:`dev-estoque`,order:2,title:`Estoque`,url:`/dev/estoque`,visible:!0},{category:`Dev Gestão`,iconName:`Award`,id:`dev-xp-insignias`,order:3,title:`Xp e insígnias`,url:`/dev/xp-insignias`,visible:!0},{category:`Dev Tools`,iconName:`KeyRound`,id:`dev-permissoes`,order:4,title:`Permissões (Paineis)`,url:`/dev/permissoes`,visible:!0},{category:`Dev Gestão`,iconName:`Coins`,id:`dev-coins`,order:5,title:`Gestão de TW Coins`,url:`/dev/coins`,visible:!0},{category:`Dev Gestão`,iconName:`ShoppingBag`,id:`dev-loja`,order:6,title:`Gestão da Loja`,url:`/dev/gestaoloja`,visible:!0},{category:`Dev Gestão`,iconName:`BellRing`,id:`dev-notificacoes`,order:7,title:`Central de Notificações`,url:`/dev/notificacoes`,visible:!0},{category:`Dev Gestão`,iconName:`ShieldAlert`,id:`dev-advertencias`,order:8,title:`Advertências & Suspensões`,url:`/dev/advertencias`,visible:!0},{category:`Dev Gestão`,iconName:`Store`,id:`dev-loja-oficial`,order:9,title:`Loja`,url:`/dev/loja`,visible:!1},{category:`Dev Tools`,iconName:`Sliders`,id:`dev-menu-lateral`,order:10,title:`Menu Lateral (Paineis)`,url:`/dev/menu-lateral`,visible:!0},{category:`Dev Tools`,iconName:`Sparkles`,id:`dev-patch-notes`,order:11,title:`Patch Notes`,url:`/dev/patch-notes`,visible:!1},{category:`Dev Tools`,iconName:`TrendingUp`,id:`dev-desempenho`,order:12,title:`Gestão Desempenho`,url:`/dev/desempenho`,visible:!1}]},updated_at:`2026-10-19T01:20:19.826Z`},system_discord_config:{level:`system_discord_config`,nivel:`system_discord_config`,permissions:{botActivityType:`Custom`,botAvatarUrl:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bot/avatar_1789618051056_twin_wheell_pro.png`,botBannerUrl:`https://eptcwuzfnarrvextneuu.supabase.co/storage/v1/object/public/products/bot/bot_banner_1793247728423_chatgpt_image_9_de_ago._de_2026_22_38_40_pro.png`,botName:`Twin Wheels`,botRoles:[{color:`#5865f2`,id:`1`,name:`『 🤖 』 Bots`},{color:`#f2f3f5`,id:`2`,name:`TW | Bot`}],botStatus:`online`,botStatusText:`by malaca`,botStreamingUrl:``,botToken:``,clientId:`1536184283197079622`,discloudApiToken:``,discloudAppId:`twin`,embedColors:{announcements:`#EAB308`,cashFund:`#F59E0B`,errors:`#EF4444`,goals:`#EC4899`,logins:`#10B981`,members:`#8B5CF6`,movements:`#0284C7`,roles:`#6366F1`,sales:`#10B981`,system:`#06B6D4`},enabled:!1,enabledEvents:{announcements:!0,cashFund:!0,forcePurge:!0,goals:!0,logins:!0,members:!0,pageViews:!1,roles:!0,sales:!0,stockMovements:!0,systemErrors:!0},footerIconUrl:`https://i.ibb.co/ymH1BQPQ/Uma124.png`,footerText:`Twin Wheels RP • Sistema Integrado de Logs`,guildId:`1537229296697999462`,guildName:`TW | Logs`,intentGuildMembers:`always`,intentMessageContent:`always`,intentPresences:`always`,isBotRunning:!0,logChannels:{announcementsChannelId:``,cashFundChannelId:``,generalLogsChannelId:`1538375505953165312`,goalsChannelId:``,membersChannelId:``,salesChannelId:``,stockMovementsChannelId:``,systemChannelId:``},serverIconUrl:``},updated_at:`2026-10-29T04:24:02.731Z`},system_discord_stock_config:{level:`system_discord_stock_config`,nivel:`system_discord_stock_config`,updated_at:`2026-09-16T22:51:06.369Z`},system_discord_webhooks:{level:`system_discord_webhooks`,nivel:`system_discord_webhooks`,permissions:{antiSpam:{autoDeleteChannelSpam:!1,blockDiscordInvites:!0,blockIpLoggers:!1,blockPhishingLinks:!0,blockTelegramLinks:!0,channelRateLimitEnabled:!0,customBlockedDomains:[`t.me`,`telegram.me`,`telegram.dog`,`grabify.link`,`iplogger`,`2no.co`,`yip.su`,`discord-nitro`,`free-nitro`],customBlockedDomainsEnabled:!0,customBlockedPhrases:[`to use this bot, you must join`,`programming & development tools`,`resources • services everything you need`,`a-tools x`,`a_toolsx`,`free nitro`,`steam gift card`,`crypto airdrop`,`claim free nitro`,`airdrop token`],customBlockedPhrasesEnabled:!0,duplicateProtectionEnabled:!1,duplicateWindowSeconds:45,enabled:!0,ipRateLimitEnabled:!0,maxMessagesPerMinutePerChannel:20,maxRequestsPerMinutePerIp:25,notifyOnSpamBlocked:!1,rateLimitEnabled:!1,stats:{totalBlocked:0}},defaultAvatarUrl:`https://i.ibb.co/ymH1BQPQ/Uma124.png`,defaultFooterText:`Twin Wheels RP • Canal de Mensagens`,defaultGuildId:`1535505650308620400`,defaultUsername:`Twin Wheels RP`,enabled:!0,updatedAt:`2026-11-01T07:56:09.125Z`,webhooks:[{avatarUrl:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/webhooks/avatar_1789809892274_twin_wheell.png`,channelId:`1535637509818548234`,createdAt:`2026-09-12T21:30:48.283Z`,defaultDescription:`by malaca`,defaultTitle:`💻 Teste Desenvolvedor`,description:`Logs de Baú QG`,embedColor:`#008FFD`,enabled:!0,footerText:`Twin Wheels • Logs de Baú QG`,guildId:`1535505650308620400`,id:`webhook_1789248648283`,lastStatus:`success`,lastTriggeredAt:`2026-09-12T21:35:09.223Z`,mentionRoles:`@everyone`,name:`TW | Logs de Baú QG`,showTimestamp:!0,thumbnailUrl:`https://adgdivossyzpwofouhrh.supabase.co/storage/v1/object/public/products/webhooks/avatar_1789248796551_twin_wheell.png`,updatedAt:`2026-09-19T09:25:05.350Z`,useCodeblockField:!0,username:`Twin Wheels`,webhookUrl:`https://discord.com/api/webhooks/1548409284000485420/AoRhvOaaA-yNUdWHcV-TZUNx4gOLxWFddthfe3kfHKpycQ2SmyaUsQiSNTnagelHzlsR`}]},updated_at:`2026-11-01T07:56:09.125Z`},system_force_cache_purge:{level:`system_force_cache_purge`,nivel:`system_force_cache_purge`,permissions:{reason:`Atualização de melhorias e limpeza de cache`,requested_by_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,requested_by_name:`Malaca`,timestamp:1793738493805},updated_at:`2026-11-03T20:41:34.199Z`},system_goal_submissions:{level:`system_goal_submissions`,nivel:`system_goal_submissions`,permissions:{submissions:[{amount:5e4,created_at:`2026-09-04T11:12:12.000Z`,delivered_at:`2026-09-04T11:12:12.000Z`,goal_id:`goal_default_1788481127067`,goal_title:`Meta Semanal Operacional - 01 LC`,id:`gsub_1788481127067_lc`,member_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,member_name:`Andrew Delucca Ferreira`,member_nickname:`01 LC`,member_role:`01`,notes:`Contribuição semanal própria de liderança 01 LC.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-09-04T11:15:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},{amount:5e4,created_at:`2026-09-06T14:20:55.000Z`,delivered_at:`2026-09-06T14:20:55.000Z`,goal_id:`goal_default_1788481127067`,goal_title:`Meta Semanal Operacional - 01 LC`,id:`gsub_1788481127067_medusa`,member_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,member_name:`Medusa Toretto`,member_nickname:`Medusa`,member_role:`gerente`,notes:`Pagamento de meta semanal da gerência para 01 LC.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-09-06T14:25:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},{amount:5e4,created_at:`2026-09-03T02:07:29.000Z`,delivered_at:`2026-09-03T02:07:29.000Z`,goal_id:`goal_default_1788481127067`,goal_title:`Meta Semanal Operacional - 01 LC`,id:`gsub_1788481127067_toretto`,member_avatar:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png?size=512`,member_name:`Toretto`,member_role:`02`,notes:`Pagamento de meta semanal efetuado e entregue para 01 LC (registro de caixa).`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-09-03T02:10:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},{amount:5e4,created_at:`2026-10-13T19:30:00.000Z`,delivered_at:`2026-10-13T19:30:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_aisson`,member_avatar:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png?size=512`,member_name:`Aisson da vila`,member_nickname:`da vila`,member_role:`membro`,notes:`Meta semanal entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T19:35:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},{amount:5e4,created_at:`2026-10-13T18:00:00.000Z`,delivered_at:`2026-10-13T18:00:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_boateiro`,member_avatar:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png?size=512`,member_name:`Boateiro Perick`,member_nickname:`Gaúcho`,member_role:`motoqueiro`,notes:`Meta semanal paga com sucesso.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T18:05:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},{amount:5e4,created_at:`2026-10-13T15:25:00.000Z`,delivered_at:`2026-10-13T15:25:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_kaim`,member_avatar:`https://cdn.discordapp.com/avatars/622074568248393749/b51cce5fe8cac229077cdd25ebc301eb.png?size=512`,member_name:`KAIM FOSTER`,member_nickname:`KAIM`,member_role:`membro`,notes:`Meta semanal 100% entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T15:30:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},{amount:5e4,created_at:`2026-10-12T16:00:00.000Z`,delivered_at:`2026-10-12T16:00:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_lc`,member_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,member_name:`Andrew Delucca Ferreira`,member_nickname:`01 LC`,member_role:`01`,notes:`Contribuição semanal de liderança 01 LC.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-12T16:05:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},{amount:5e4,created_at:`2026-10-13T16:00:00.000Z`,delivered_at:`2026-10-13T16:00:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_lennon`,member_avatar:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,member_name:`lennon dacoro`,member_nickname:`lennon`,member_role:`gerente`,notes:`Meta semanal quitada.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T16:05:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},{amount:5e4,created_at:`2026-10-13T17:15:00.000Z`,delivered_at:`2026-10-13T17:15:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_macae`,member_avatar:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png?size=512`,member_name:`Macaé Dacoro`,member_nickname:`Macaé`,member_role:`gerente`,notes:`Meta de outubro entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T17:20:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},{amount:5e4,created_at:`2026-10-13T11:45:00.000Z`,delivered_at:`2026-10-13T11:45:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_medusa`,member_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,member_name:`Medusa Toretto`,member_nickname:`Medusa`,member_role:`gerente`,notes:`Entrega de meta semanal gerência paga.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T11:50:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},{amount:5e4,created_at:`2026-10-13T14:10:00.000Z`,delivered_at:`2026-10-13T14:10:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_sk`,member_avatar:`https://cdn.discordapp.com/avatars/815425543998668860/b974de8cf7b86f95dec282cb7180d087.png?size=512`,member_name:`JOAO SK`,member_nickname:`SK`,member_role:`gerente`,notes:`Meta semanal cumprida.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T14:15:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},{amount:5e4,created_at:`2026-10-12T14:30:00.000Z`,delivered_at:`2026-10-12T14:30:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_toretto`,member_avatar:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png?size=512`,member_name:`Toretto`,member_role:`02`,notes:`Meta semanal de outubro paga.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-12T14:35:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},{amount:5e4,created_at:`2026-10-13T18:45:00.000Z`,delivered_at:`2026-10-13T18:45:00.000Z`,goal_id:`wgoal_vigente_20261012`,goal_title:`Meta Semanal Operacional - Outubro`,id:`gsub_oct_zeca`,member_avatar:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png?size=512`,member_name:`zeca`,member_nickname:`zeca`,member_role:`membro`,notes:`Meta semanal entregue.`,receiver_avatar:`https://cdn.discordapp.com/avatars/251079840931774465/bc49dbece09cd0baa136c16a04af6da2.png`,receiver_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,receiver_name:`01 LC (Andrew Delucca Ferreira)`,receiver_role:`01`,reviewed_at:`2026-10-13T18:50:00.000Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,reviewed_by_name:`01 LC`,status:`aprovado`,unit_name:`R$`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`}]},updated_at:`2026-10-16T14:55:46.131Z`},system_menu_config:{level:`system_menu_config`,nivel:`system_menu_config`,permissions:{categories:[`Eu`,`Twin Wheels`,`Produção`,`Moderação`,`Administração`],deletedItemIds:[`estoque`],items:[{category:`Eu`,id:`perfil`,isCustom:!1,order:0,title:`Meu Perfil`,url:`/perfil`,visible:!0},{category:`Eu`,iconName:`Bell`,id:`notificacoes`,isCustom:!1,order:1,title:`Notificações`,url:`/notificacoes`,visible:!0},{category:`Eu`,id:`desempenho`,isCustom:!1,order:2,title:`Meu Desempenho`,url:`/desempenho`,visible:!0},{category:`Eu`,iconName:`BadgeCheck`,id:`solicitar-selo`,isCustom:!1,order:3,title:`Solicitar Verificação`,url:`/solicitar-selo`,visible:!0},{category:`Eu`,iconName:`BadgeCheck`,id:`ceo-selos`,isCustom:!1,order:4,title:`Gerenciar Selos`,url:`/ceo/selos`,visible:!0},{category:`Eu`,iconName:`ShoppingBag`,id:`loja`,isCustom:!1,order:5,title:`Loja Twin Wheels`,url:`/loja`,visible:!1},{category:`Twin Wheels`,id:`dashboard`,isCustom:!1,order:6,title:`Dashboard`,url:`/dashboard`,visible:!0},{category:`Twin Wheels`,id:`movimentacoes`,isCustom:!1,order:7,title:`Movimentações`,url:`/movimentacoes`,visible:!0},{category:`Twin Wheels`,id:`hierarquia`,isCustom:!1,order:8,title:`Hierarquia`,url:`/hierarquia`,visible:!0},{category:`Twin Wheels`,id:`membros`,isCustom:!1,order:9,title:`Membros`,url:`/membros`,visible:!0},{category:`Twin Wheels`,id:`metas`,isCustom:!1,order:10,title:`Metas`,url:`/metas`,visible:!0},{category:`Twin Wheels`,iconName:`Swords`,id:`escalas`,isCustom:!1,order:11,title:`Escala de Ação`,url:`/escalas`,visible:!0},{category:`Twin Wheels`,id:`tickets`,isCustom:!1,order:12,title:`Tickets / Ouvidoria`,url:`/tickets`,visible:!0},{category:`Twin Wheels`,id:`ausencias`,isCustom:!1,order:13,title:`Ausências`,url:`/ausencias`,visible:!0},{category:`Twin Wheels`,id:`rankings`,isCustom:!1,order:14,title:`Rankings`,url:`/rankings`,visible:!1},{category:`Produção`,id:`vendas`,isCustom:!1,order:15,title:`Vendas`,url:`/vendas`,visible:!0},{category:`Produção`,iconName:`Factory`,id:`produzir`,isCustom:!1,order:16,title:`Produzir`,url:`/producoes/produzir`,visible:!0},{category:`Produção`,iconName:`Layers`,id:`materias-primas`,isCustom:!1,order:17,title:`Matérias-Primas`,url:`/producoes/materias-primas`,visible:!0},{category:`Produção`,iconName:`Sliders`,id:`gestao-producao`,isCustom:!1,order:18,title:`Gestão de Produção`,url:`/producoes/gestao`,visible:!0},{category:`Produção`,iconName:`Warehouse`,id:`armazem`,isCustom:!1,order:19,title:`Armazém`,url:`/producoes/armazem`,visible:!0},{category:`Moderação`,id:`avisos`,isCustom:!1,order:20,title:`Enviar Avisos`,url:`/avisos`,visible:!0},{category:`Moderação`,iconName:`Headphones`,id:`atendimento-tickets`,isCustom:!1,order:21,title:`Atendimento Ticket`,url:`/atendimento-tickets`,visible:!0},{category:`Moderação`,iconName:`ShieldAlert`,id:`advertencias`,isCustom:!1,order:22,title:`Advertências`,url:`/advertencias`,visible:!0},{category:`Administração`,id:`fundo-caixa`,isCustom:!1,order:23,title:`Fundo de Caixa`,url:`/fundo-caixa`,visible:!0},{category:`Administração`,iconName:`PackageCheck`,id:`gestao-estoque`,isCustom:!1,order:24,title:`Gestão de Estoque`,url:`/gestao-estoque`,visible:!0},{category:`Administração`,iconName:`ShieldCheck`,id:`cargos`,isCustom:!1,order:25,title:`Gerenciamento de Cargos`,url:`/cargos`,visible:!0},{category:`Administração`,iconName:`Tags`,id:`ceo-tags`,isCustom:!1,order:26,title:`Gerenciar Tags`,url:`/ceo/tags`,visible:!1}]},updated_at:`2026-10-31T07:26:18.335Z`},system_notification_rules:{level:`system_notification_rules`,nivel:`system_notification_rules`,permissions:{roles:{"01":[`live`,`announcement`,`ticket`,`goal`,`movement`,`signup`,`sale`,`stock_alert`,`achievement`,`absence`,`feedback`,`role_update`,`member_warning`,`cash_fund`,`security_alert`,`patch_notes`],"02":[`live`,`announcement`,`ticket`,`goal`,`movement`,`signup`,`sale`,`stock_alert`,`achievement`,`absence`,`feedback`,`role_update`,`member_warning`,`cash_fund`,`security_alert`,`patch_notes`],gerente:[`live`,`announcement`,`ticket`,`goal`,`movement`,`signup`,`sale`,`stock_alert`,`achievement`,`absence`,`feedback`,`role_update`,`member_warning`,`cash_fund`,`patch_notes`],membro:[`live`,`announcement`,`goal`],motoqueiro:[`live`,`announcement`,`goal`],novato:[`live`,`announcement`,`goal`]},tags:{tag_ceo:[`live`,`announcement`,`ticket`,`goal`,`movement`,`signup`,`sale`,`patch_notes`],tag_dev:[`movement`,`stock_alert`,`goal`,`sale`,`achievement`,`live`,`ticket`,`chat`,`absence`,`signup`,`feedback`,`announcement`,`role_update`,`member_warning`,`cash_fund`,`security_alert`,`system`,`bot_sync`,`patch_notes`]},updated_at:`2026-09-19T09:39:20.427Z`,updated_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`},updated_at:`2026-09-19T09:39:20.530Z`},system_notifications_data:{level:`system_notifications_data`,nivel:`system_notifications_data`,permissions:{notifications:[{category:`success`,created_at:`2026-10-31T05:24:03.249Z`,id:`notif_1793424243249_bnxfq`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Seu chamado "Teste ticket" foi finalizado por Malaca. Motivo: "Chamado concluído e resolvido pela gerência."`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Chamado #005 finalizado`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-10-31T05:23:52.789Z`,id:`notif_1793424232789_54rh7`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Malaca: "Aa"`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Resposta no Chamado #005`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-10-31T05:23:47.301Z`,id:`notif_1793424227301_4tjei`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Developers: "Ttt"`,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,title:`Resposta no Chamado #005`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-10-31T05:23:29.040Z`,id:`notif_1793424209040_ah1xj`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Status do seu chamado "Teste ticket" foi alterado para "Aguardando".`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Status do Chamado #005 atualizado`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-10-31T05:21:45.035Z`,id:`notif_1793424105035_lhkuc`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Developers: "Teste"`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,title:`Resposta no Chamado #005`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-10-31T05:20:36.630Z`,id:`notif_1793424036630_5wojn`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Malaca: "Oi"`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Resposta no Chamado #005`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-10-31T05:20:30.990Z`,id:`notif_1793424030990_fy4wk`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Malaca assumiu o atendimento do seu chamado.`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Chamado #005 em atendimento`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`alert`,created_at:`2026-10-31T05:19:15.475Z`,id:`notif_1793423955475_tre9x`,is_active:!0,link:`/tickets/tkt_1793423954822_7y5du`,message:`Developers abriu um chamado: "Teste" (Denúncia Interna)`,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Chamado #006`,type:`ticket`,user_id:`all`},{category:`alert`,created_at:`2026-10-31T05:17:35.829Z`,id:`notif_1793423855829_avvfw`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Developers abriu um chamado: "Teste ticket" (Outros)`,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Chamado #005`,type:`ticket`,user_id:`all`},{category:`warning`,created_at:`2026-10-31T04:52:19.472Z`,id:`notif_1793422339472_utf4t`,is_active:!0,link:`/ausencias`,message:`Malaca solicitou licença de 33 dia(s) (2026-10-31 a 2026-12-02). Motivo: motivo_pessoal`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Nova Solicitação de Licença`,type:`absence`,user_id:`all`},{category:`success`,created_at:`2026-10-31T04:45:25.230Z`,id:`notif_1793421925230_ap61f`,is_active:!0,link:`/tickets/tkt_1792953104240_3omjn`,message:`Seu chamado "Cccccccc" foi finalizado por Malaca. Motivo: "Chamado concluído e resolvido pela gerência."`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Chamado #002 finalizado`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-10-31T04:44:55.604Z`,id:`notif_1793421895605_msonc`,is_active:!0,link:`/tickets/tkt_1793253546601_aaif7`,message:`Seu chamado "Aaaaa" foi finalizado por Malaca. Motivo: "Chamado concluído e resolvido pela gerência."`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Chamado #003 finalizado`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-10-31T03:43:01.865Z`,id:`notif_1793418181865_8y662`,is_active:!0,link:`/tickets/tkt_1793253546601_aaif7`,message:`Malaca: "Oi"`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Resposta no Chamado #003`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-10-31T02:58:59.325Z`,id:`notif_1793415539325_3g2sm`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Seu chamado "Xxxxxx" foi finalizado por Dev. Motivo: "Chamado concluído e resolvido pela gerência."`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Dev`,title:`Chamado #004 finalizado`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-10-31T02:58:46.086Z`,id:`notif_1793415526086_smdbe`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Developers: "aaaaa"`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,title:`Resposta no Chamado #004`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`warning`,created_at:`2026-10-31T02:58:04.902Z`,id:`notif_1793415484902_w9ztw`,is_active:!0,link:`/tickets`,message:`Você foi removido(a) do chamado "Xxxxxx" por Dev.`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Dev`,title:`Removido do Chamado #004`,type:`ticket`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},{category:`info`,created_at:`2026-10-31T02:57:53.219Z`,id:`notif_1793415473219_4b1t1`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Dev adicionou você como participante no chamado: "Xxxxxx".`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Dev`,title:`Adicionado ao Chamado #004`,type:`ticket`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},{category:`info`,created_at:`2026-10-31T02:57:30.688Z`,id:`notif_1793415450688_gq2cq`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Status do seu chamado "Xxxxxx" foi alterado para "Aguardando".`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,title:`Status do Chamado #004 atualizado`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-10-31T02:57:00.232Z`,id:`notif_1793415420232_5vb30`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Developers assumiu o atendimento do seu chamado.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,title:`Chamado #004 em atendimento`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-10-31T00:44:21.754Z`,id:`notif_1793407461754_xgopn`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Motoqueiro" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-10-31T00:42:03.859Z`,id:`notif_1793407323859_a2446`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Developers: "Oi"`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,title:`Resposta no Chamado #004`,type:`ticket`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-10-29T06:56:35.184Z`,id:`notif_1793256995184_5991w`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-10-29T05:59:53.970Z`,id:`notif_1793253593970_5a246`,is_active:!0,link:`/tickets/tkt_1793253593356_vr7rf`,message:`Malaca abriu um chamado: "Xxxxxx" (Denúncia Interna)`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Chamado #004`,type:`ticket`,user_id:`all`},{category:`info`,created_at:`2026-10-29T05:59:07.207Z`,id:`notif_1793253547207_cxl53`,is_active:!0,link:`/tickets/tkt_1793253546601_aaif7`,message:`Developers abriu um chamado: "Aaaaa" (Dúvidas Gerais)`,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Chamado #003`,type:`ticket`,user_id:`all`},{category:`info`,created_at:`2026-10-25T20:10:45.054Z`,id:`notif_1792959045054_2krz7`,is_active:!0,link:`/membros?tab=pendentes`,message:`Nicolas Kovarik Void (Nicolas) solicitou aprovação de cadastro na plataforma.`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Pedido de Cadastro`,type:`signup`,user_id:`all`},{category:`info`,created_at:`2026-10-25T18:31:44.865Z`,id:`notif_1792953104865_lhtdg`,is_active:!0,link:`/tickets/tkt_1792953104240_3omjn`,message:`Developers abriu um chamado: "Cccccccc" (Dúvidas Gerais)`,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Chamado #002`,type:`ticket`,user_id:`all`},{category:`info`,created_at:`2026-10-25T18:29:13.641Z`,id:`notif_1792952953641_sresz`,is_active:!0,link:`/tickets/tkt_1792952953037_edf8t`,message:`Malaca abriu um chamado: "Teste" (Dúvidas Gerais)`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Novo Chamado #001`,type:`ticket`,user_id:`all`},{category:`success`,created_at:`2026-10-19T01:48:51.190Z`,id:`notif_1792374531190_f5vqy`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-10-19T01:48:47.060Z`,id:`notif_1792374527060_rcmll`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Motoqueiro" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-10-18T04:07:07.476Z`,id:`notif_1792296427476_7dgl1`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Motoqueiro" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`error`,created_at:`2026-10-15T00:30:03.997Z`,id:`notif_1792024203997_523pi`,is_active:!0,link:`/metas`,message:`Sua entrega de 50000 R$ para "Meta Semanal Operacional - 01 LC" foi rejeitado por Liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],sender_name:`Liderança`,title:`Entrega de Meta Não Aprovada`,type:`goal`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`error`,created_at:`2026-10-13T21:45:17.152Z`,id:`notif_1791927917152_57zfl`,is_active:!0,link:`/metas`,message:`Sua entrega de 38000 R$ para "Meta Semanal - Teste Desenvolvedor" foi rejeitado por Liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],sender_name:`Liderança`,title:`Entrega de Meta Não Aprovada`,type:`goal`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`error`,created_at:`2026-10-13T21:44:58.545Z`,id:`notif_1791927898545_x4gys`,is_active:!0,link:`/metas`,message:`Sua entrega de 29000 R$ para "Meta Semanal Operacional" foi rejeitado por Liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_name:`Liderança`,title:`Entrega de Meta Não Aprovada`,type:`goal`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-09-19T12:21:41.274Z`,id:`notif_1789820501274_juzhl`,is_active:!0,link:`/metas`,message:`Sua entrega de 29000 R$ para "Meta Semanal Operacional" foi aprovado por Malaca.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Entrega de Meta Aprovada! 🎯`,type:`goal`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-09-19T12:20:25.047Z`,id:`notif_1789820425047_i2ac1`,is_active:!0,link:`/metas`,message:`Malaca registrou entrega de 29000 R$ para "Meta Semanal Operacional".`,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Nova Entrega de Meta`,type:`goal`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-19T07:39:01.268Z`,id:`notif_1789803541268_6gr5q`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-19T07:33:49.711Z`,id:`notif_1789803229711_zio80`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Gerente" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-19T03:17:33.806Z`,id:`notif_1789787853806_ou27v`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "02" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-19T01:34:50.932Z`,id:`notif_1789781690932_hivt7`,is_active:!0,link:`/ausencias`,message:`Sua solicitação de licença (2026-08-30 a 2026-10-03) foi aprovado por Malaca.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Licença Aprovada! 🏖️`,type:`absence`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`warning`,created_at:`2026-09-19T01:34:34.415Z`,id:`notif_1789781674415_0gn8m`,is_active:!0,link:`/ausencias`,message:`Malaca solicitou licença de 35 dia(s) (2026-08-30 a 2026-10-03). Motivo: problemas_tecnicos`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`,`d8261681-8469-4643-bca0-5fc154b3a25b`],sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Nova Solicitação de Licença`,type:`absence`,user_id:`all`},{category:`warning`,created_at:`2026-09-19T01:33:39.610Z`,id:`notif_1789781619610_jaol3`,is_active:!0,link:`/ausencias`,message:`Malaca solicitou licença de 38 dia(s) (2026-08-27 a 2026-10-03). Motivo: problemas_tecnicos`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`,`d8261681-8469-4643-bca0-5fc154b3a25b`],sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,target_roles:[`01`,`02`,`gerente`,`desenvolvedor`],title:`Nova Solicitação de Licença`,type:`absence`,user_id:`all`},{category:`success`,created_at:`2026-09-18T22:53:28.631Z`,id:`notif_1789772008631_pa0gn`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-09-18T22:53:07.976Z`,id:`notif_1789771987976_3x2fx`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "01" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-09-18T21:10:24.377Z`,id:`notif_1789765824377_5lh9l`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-18T21:02:57.432Z`,id:`notif_1789765377432_mmvvf`,is_active:!0,link:`/perfil`,message:`Seu cargo foi atualizado para "01" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-17T01:41:30.096Z`,id:`notif_1789609290096_62z0j`,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-09-17T01:27:37.235Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789608457235_4fj5d`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`arrasou`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,sender_name:`Medusa`,title:`Mensagem de Medusa`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-09-17T00:58:53.789Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789606733789_te122`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`ta aprontando ai`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,sender_name:`Medusa`,title:`Mensagem de Medusa`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-09-17T00:58:47.168Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789606727168_lsfqm`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`oieee`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/809dd739d76dadcff2a2529793d33864.png?size=512`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,sender_name:`Medusa`,title:`Mensagem de Medusa`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-09-17T00:08:23.315Z`,id:`notif_1789603703315_pnra5`,link:`/perfil`,message:`Seu cargo foi atualizado para "Novato" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-16T22:12:02.412Z`,id:`notif_1789596722412_60mk2`,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`success`,created_at:`2026-09-16T22:11:17.725Z`,id:`notif_1789596677725_sftfj`,link:`/perfil`,message:`Seu cargo foi atualizado para "01" pela liderança.`,read_by:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},{category:`info`,created_at:`2026-09-16T12:57:57.447Z`,id:`notif_1789563477447_qtci2`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`Tititi`,read_by:[`2a974403-195b-4a1c-8c80-85afc1e77391`],sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Mensagem de Malaca`,type:`chat`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},{category:`info`,created_at:`2026-09-16T03:05:43.180Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789527943180_41kra`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`titi`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,sender_name:`Medusa`,title:`Mensagem de Medusa`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-09-16T03:05:41.893Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789527941893_ub9ov`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`a funcionar`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,sender_name:`Medusa`,title:`Mensagem de Medusa`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-09-16T03:05:39.341Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789527939341_8rd76`,link:`/chat?conv=1477bbb2-87e0-4ff3-8d97-2853c6f0e09b`,message:`volto`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,sender_id:`2a974403-195b-4a1c-8c80-85afc1e77391`,sender_name:`Medusa`,title:`Mensagem de Medusa`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-09-15T20:55:24.736Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789505724736_nk1uw`,link:`/perfil`,message:`Seu cargo foi atualizado para "Membro" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`success`,created_at:`2026-09-15T20:55:21.777Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789505721777_gqs0o`,link:`/perfil`,message:`Seu cargo foi atualizado para "Novato" pela liderança.`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],title:`Cargo Atualizado! 🛡️`,type:`system`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`info`,created_at:`2026-09-15T00:50:29.368Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789433429368_iuisg`,link:`/chat?conv=d1662444-0465-44ca-9cc4-0b4d6e4e94de`,message:`Oi`,read_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Dev`,title:`Mensagem de Dev`,type:`chat`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},{category:`error`,created_at:`2026-09-13T04:30:47.652Z`,deleted_by:[`c5ef6dc6-e126-4027-80c3-319f0a870315`],id:`notif_1789273847652_3vtw6`,link:`/avisos`,message:`Teste aviso`,read_by:[`d8261681-8469-4643-bca0-5fc154b3a25b`,`9bb128e3-6e65-43a3-8b60-00f4dd860e0d`,`c5ef6dc6-e126-4027-80c3-319f0a870315`,`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,`2a974403-195b-4a1c-8c80-85afc1e77391`],sender_id:`d8261681-8469-4643-bca0-5fc154b3a25b`,title:`Novo Comunicado: Teste aviso`,type:`announcement`,user_id:`all`}]},updated_at:`2026-10-31T05:24:03.254Z`},system_patch_notes:{level:`system_patch_notes`,nivel:`system_patch_notes`,permissions:{notes:[{author_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png`,author_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,author_name:`Malaca`,category:`feature`,created_at:`2026-09-19T08:15:46.921Z`,description:`Twin Life`,id:`patch-1789805746922-g5yxc`,images:[{caption:``,id:`img-1789805737498-qbro`,name:`IMG_1466.jpeg`,size:233686,url:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/chat-attachments/patch-notes/1789805736795_IMG_1466.jpeg`}],is_published:!0,pinned:!1,title:`Twin Life (Rede Social)`,updated_at:`2026-09-19T08:15:46.921Z`,version:`v1.0`},{author_id:`dev-team`,author_name:`Equipe de Engenharia TW`,category:`feature`,changes:[`Foco automático instantâneo no campo de digitação ao ingressar em conversas ou acionar ações de resposta.`,`Card de citação de resposta visualmente idêntico ao WhatsApp com borda de acento colorido, ícones de anexo, miniatura de foto e rolagem suave.`,`Destaque visual de alta densidade para chats não lidos com borda esmeralda, indicador pulsante e ação rápida 'Ler todas'.`,`WebSocket Realtime Broadcast direto eliminando qualquer delay no envio e recebimento de mensagens.`,`Filtro de privacidade impedindo que notificações sejam emitidas para usuários que não façam parte da conversa.`],created_at:`2026-09-18T19:51:29.601Z`,description:`Reformulação integral do sistema de chat corporativo do grupo. Introdução de entrega via WebSocket de latência ultrabaixa (15ms), citação de respostas idêntica ao WhatsApp, e controle visual de mensagens não lidas no balão de chat.`,id:`patch-v2-4-0`,is_published:!0,pinned:!0,title:`Chat em Tempo Real, Citação WhatsApp & Notificações`,updated_at:`2026-09-18T19:51:29.601Z`,version:`v2.4.0`},{author_id:`dev-team`,author_name:`Equipe de Engenharia TW`,category:`feature`,changes:[`Painel de controle de ausências e licenças com cálculo dinâmico de período e justificativas.`,`Edição e reversão de status de validação de comprovantes com histórico de ações.`,`Indicadores de presença em tempo real e tempo de serviço online no GTA RP.`],created_at:`2026-09-14T07:51:29.601Z`,description:`Aprimoramento dos fluxos administrativos de gestão de membros e prestação de contas das metas operacionais do grupo.`,id:`patch-v2-3-0`,is_published:!0,pinned:!1,title:`Central de Licenças & Validação de Comprovantes`,updated_at:`2026-09-14T07:51:29.601Z`,version:`v2.3.0`},{author_id:`dev-team`,author_name:`Equipe de Engenharia TW`,category:`security`,changes:[`DeveloperGuard protegendo páginas restritas de engenharia contra acessos indevidos.`,`Inspeção de desempenho de membros em tempo real com exportação de métricas.`,`Logs de auditoria imutáveis com rastreamento de transações financeiras e estoque.`],created_at:`2026-09-07T07:51:29.601Z`,description:`Implementação de guardas de segurança backend para a Tag Desenvolvedor e matriz de permissões dedicadas.`,id:`patch-v2-2-0`,is_published:!0,pinned:!1,title:`Módulo Dev, Auditoria e Segurança Granular`,updated_at:`2026-09-07T07:51:29.601Z`,version:`v2.2.0`}]},updated_at:`2026-09-19T08:15:46.923Z`},system_platform_settings:{level:`system_platform_settings`,nivel:`system_platform_settings`,permissions:{allowMovementsWithoutBau:!1,autoOfflineMinutes:20,borderGlowSpeed:`normal`,brightness:100,cardStyle:`glassmorphism`,cityRpName:`Cidade Alta RP`,cityRpTag:`CDA`,contactEmail:``,contrast:100,defaultNewRole:`Novato / Recruta`,description:`Sistema interno de gestão da facção Twin Wheels. Controle de estoque, vendas, membros, cargos, desempenho e muito mais.`,factionCode:``,factionDiscordUrl:``,factionName:`Twin Wheels`,factionTag:`TW`,factionType:``,fivemConnectUrl:`connect cpx.rp`,fontFamily:`space_grotesk`,footerCopyrightText:`Todos os direitos reservados.`,footerCustomNote:``,footerDeveloperDiscord:`malaca7x`,footerDeveloperName:`malaca`,footerDeveloperRole:`Desenvolvido por`,footerDividerSymbol:`•`,footerFactionText:`Twin Wheels`,footerShowDeveloperCredits:!0,footerShowDiscordCopy:!0,footerShowSupportLink:!0,footerShowVersion:!0,footerShowYear:!0,footerYear:`Automático`,glowEffectsEnabled:!0,headquartersLocation:`Perto do Píer · Setor Sul`,heartbeatSeconds:15,hideOldAnnouncementsDays:7,hoverZoomEnabled:!0,idleTimeoutSeconds:600,instagramHandle:``,maintenanceActive:!1,maintenanceAllowDevAccess:!0,maintenanceDurationMinutes:1439,maintenanceEstimatedEnd:`2026-10-22T23:50:00.000Z`,maintenanceHistory:[{authorName:`Malaca`,durationMinutes:906,endedAt:`2026-10-22T14:56:35.891Z`,id:`maint_1792680995891`,message:`Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes.`,severity:`destructive`,startedAt:`2026-10-21T23:50:51.379Z`,title:`Manutenção Preventiva de Sistema`}],maintenanceMessage:`Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes.`,maintenanceSeverity:`destructive`,maintenanceStartedAt:`2026-10-21T23:50:51.379Z`,maintenanceTargetType:`all`,maintenanceTitle:`Manutenção Preventiva de Sistema`,minCityTime:`50 horas de voo`,minRecruitAge:`16 anos`,motd:`Bora bater as metas da semana e manter o estoque abastecido!`,motto:`Velocidade, lealdade e precisão em cada curva.`,notificationToastPosition:`top-right`,notifyPendingSignups:!0,onlineAlertEnabled:!1,operatingHours:`18:00h às 02:00h`,pageTransitionsEnabled:!0,platformBannerUrl:``,platformFaviconUrl:``,platformLogoUrl:``,radioFrequency:`2W MHz`,recruitmentFormUrl:``,rulesSummary:`Respeito mútuo, lealdade à facção, prestação de contas dos baús e discrição total em ações externas.`,showAnnouncementBanner:!0,showConsolidatedCashToOperators:!1,showSystemStatusNotice:!1,slogan:`Gestão Interna`,soundEffectsEnabled:!1,soundVolume:60,startPageCeo:`/ceo/dashboard`,startPageDev:`/dev/configuracao/plataforma/comunicados`,startPageUser:`/dashboard`,statusPulseEnabled:!0,supportDiscordUrl:``,systemStatusNotice:``,systemStatusType:`destructive`,systemVersion:`v2.5.0`,themeStyle:`cyberpunk`,tiktokHandle:``,weeklyGoalFarm:`100 insumos`,weeklyGoalHours:`10h semanais`,welcomeMessage:`Bem-vindo à Twin Wheels! Leia as regras e procure um líder para sua integração.`},updated_at:`2026-10-31T07:27:19.331Z`},system_streams_config:{level:`system_streams_config`,nivel:`system_streams_config`,updated_at:`2026-09-17T00:56:21.736Z`},system_tickets_data:{level:`system_tickets_data`,nivel:`system_tickets_data`,permissions:{tickets:[{assigned_to_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,assigned_to_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,assigned_to_name:`Malaca`,assigned_to_nickname:`Malaca`,assigned_to_role:`motoqueiro`,category:`outros`,closed_at:`2026-10-31T05:24:02.621Z`,closed_by_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,closed_by_name:`Malaca`,closed_reason:`Chamado concluído e resolvido pela gerência.`,created_at:`2026-10-31T05:17:35.184Z`,creator_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,creator_name:`Developers`,creator_nickname:`Dev`,creator_role:`membro`,description:`Testando`,id:`tkt_1793423855184_lnuyt`,messages:[{content:`Oi`,created_at:`2026-10-31T05:20:35.994Z`,id:`msg_1793424035994_q1m1h`,is_internal_note:!1,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,sender_nickname:`Malaca`,sender_role:`motoqueiro`,ticket_id:`tkt_1793423855184_lnuyt`},{content:`Teste`,created_at:`2026-10-31T05:21:44.412Z`,id:`msg_1793424104412_wvwoy`,is_internal_note:!1,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,sender_nickname:`Dev`,sender_role:`membro`,ticket_id:`tkt_1793423855184_lnuyt`},{content:`Ttt`,created_at:`2026-10-31T05:23:46.646Z`,id:`msg_1793424226646_ecwot`,is_internal_note:!1,sender_avatar:`https://cdn.discordapp.com/avatars/917826984778797087/79180e31491b72e5aeb74f51a4da0548.png?size=512`,sender_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,sender_name:`Developers`,sender_nickname:`Dev`,sender_role:`membro`,ticket_id:`tkt_1793423855184_lnuyt`},{content:`Aa`,created_at:`2026-10-31T05:23:52.171Z`,id:`msg_1793424232171_isk7w`,is_internal_note:!1,sender_avatar:`https://cdn.discordapp.com/avatars/722320491767136346/f05c8c458c75ddbf9d2c3b7f90684af5.png?size=512`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,sender_nickname:`Malaca`,sender_role:`motoqueiro`,ticket_id:`tkt_1793423855184_lnuyt`}],priority:`urgente`,status:`fechado`,subject:`Teste ticket`,ticket_number:5,updated_at:`2026-10-31T05:24:02.621Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`}]},updated_at:`2026-10-31T05:24:02.827Z`},system_weekly_goals:{level:`system_weekly_goals`,nivel:`system_weekly_goals`,permissions:{goals:[{created_at:`2026-09-04T00:18:47.067Z`,created_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,created_by_name:`01 LC (Andrew Delucca Ferreira)`,description:`Meta semanal operacional de liderança criada pelo 01 LC para arrecadação da família.`,id:`goal_default_1788481127067`,is_active:!1,period_end:`2026-09-07`,period_start:`2026-09-01`,scope:`todos`,target_role:`membro`,target_value:5e4,title:`Meta Semanal Operacional - 01 LC`,type:`financeiro`,unit_name:`R$`,updated_at:`2026-10-14T08:18:51.133Z`}]},updated_at:`2026-10-16T14:53:44.411Z`}},sales:{_schema_info:{empty:!0,original_table:`sales`}},shop_items:{shop_item_caixa_misteriosa:{active:!0,category:`recursos`,created_at:`2026-10-13T19:27:19.280Z`,description:`Abra uma caixa surpresa contendo recursos raros, TW Coins extras ou itens especiais da facção.`,display_order:104,icon:`Gift`,id:`shop_item_caixa_misteriosa`,price_coins:80,price_xp:0,rarity:`comum`,title:`Caixa de Suprimentos Misteriosa`},shop_item_destaque_perfil:{active:!0,category:`personalizacao`,created_at:`2026-10-13T19:27:19.280Z`,description:`Sua foto e canal recebem destaque no topo do painel e banner holográfico exclusivo no perfil público.`,display_order:103,icon:`Sparkles`,id:`shop_item_destaque_perfil`,price_coins:180,price_xp:0,rarity:`epico`,title:`Destaque VIP no Perfil Oficial`},shop_item_falcao_vigia:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Dedicação contínua na vigilância e inteligência de território.`,display_order:5,icon:`Eye`,id:`shop_item_falcao_vigia`,insignia_id:`falcao_vigia`,price_coins:350,price_xp:0,rarity:`epico`,title:`Falcão da Guarda`},shop_item_guardiao_bau:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Auditoria exemplar e zelo constante pelo patrimônio e baús do grupo.`,display_order:1,icon:`Boxes`,id:`shop_item_guardiao_bau`,insignia_id:`guardiao_bau`,price_coins:50,price_xp:0,rarity:`comum`,title:`Guardião do Depósito`},shop_item_kit_assalto:{active:!0,category:`recursos`,created_at:`2026-10-13T19:27:19.280Z`,description:`Conjunto com coletes reforçados, munição pesada e suprimentos médicos de pronta entrega no Baú da facção.`,display_order:101,icon:`Boxes`,id:`shop_item_kit_assalto`,price_coins:150,price_xp:0,rarity:`raro`,title:`Kit Operacional de Assalto`},shop_item_lideranca_suprema:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Comando executivo respeitado, mentor de novos talentos e guia operacional.`,display_order:6,icon:`Crown`,id:`shop_item_lideranca_suprema`,insignia_id:`lideranca_suprema`,price_coins:500,price_xp:0,rarity:`lendario`,title:`Liderança Suprema`},shop_item_mestre_logistica:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Eficiência impecável na cadeia de suprimentos e transporte blindado.`,display_order:4,icon:`Truck`,id:`shop_item_mestre_logistica`,insignia_id:`mestre_logistica`,price_coins:250,price_xp:0,rarity:`epico`,title:`Mestre da Logística`},shop_item_mito_twin_wheels:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Distinção máxima concedida a pilares inquestionáveis da história do grupo.`,display_order:7,icon:`Sparkles`,id:`shop_item_mito_twin_wheels`,insignia_id:`mito_twin_wheels`,price_coins:1e3,price_xp:0,rarity:`mitico`,title:`Mito Twin Wheels`},shop_item_negociador_ouro:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Fechamento de acordos comerciais de grande vulto para a facção.`,display_order:3,icon:`DollarSign`,id:`shop_item_negociador_ouro`,insignia_id:`negociador_ouro`,price_coins:150,price_xp:0,rarity:`raro`,title:`Negociador de Ouro`},shop_item_operador_tatica:{active:!0,category:`insignias`,created_at:`2026-10-13T19:27:19.280Z`,description:`Disciplina máxima e precisão em ações e operações de campo.`,display_order:2,icon:`Target`,id:`shop_item_operador_tatica`,insignia_id:`operador_tatica`,price_coins:100,price_xp:0,rarity:`raro`,title:`Operador Tático`},shop_item_vale_tunagem:{active:!0,category:`veiculos`,created_at:`2026-10-13T19:27:19.280Z`,description:`Voucher de mecânica com direito a blindagem máxima, motor nível 5 e nitro customizado na oficina parceira.`,display_order:102,icon:`Truck`,id:`shop_item_vale_tunagem`,price_coins:300,price_xp:0,rarity:`lendario`,stock:15,title:`Vale Tunagem Completa`},shop_item_vip_discord:{active:!0,category:`vantagens`,created_at:`2026-10-13T19:27:19.280Z`,description:`Receba o cargo exclusivo VIP no Discord com cor personalizada e destaque na lista de membros por 30 dias.`,display_order:100,icon:`Crown`,id:`shop_item_vip_discord`,price_coins:250,price_xp:0,rarity:`epico`,stock:20,title:`Tag VIP no Discord Twin Wheels`}},signup_requests:{"36faeb85-ac86-4a93-88ec-ceb74b5a37de":{created_at:`2026-08-19T22:27:18.029Z`,id:`36faeb85-ac86-4a93-88ec-ceb74b5a37de`,nickname:`𝙇𝘾`,nome:`lcsluuca`,requested_at:`2026-08-19T22:27:18.029Z`,status:`aprovado`,telefone:`000-000`,updated_at:`2026-08-19T22:28:52.051Z`,user_id:`af7e8b1b-4779-46ab-b34d-53a954766fec`},"4361ed60-f806-4096-a1bf-4050f4f36912":{created_at:`2026-08-29T21:39:38.228Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/1532134651148107807/666b438ecec491b541185802a32916e4.png`,discord_email:`malacarogeriojr@gmail.com`,discord_id:`1532134651148107807`,discord_username:`malacap1#0`,game_id:`123`,id:`4361ed60-f806-4096-a1bf-4050f4f36912`,nickname:`DevT`,nome:`Dev Teste`,requested_at:`2026-08-29T21:39:38.228Z`,reviewed_at:`2026-08-29T21:51:30.646Z`,reviewed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`aprovado`,telefone:`111-111`,updated_at:`2026-08-29T21:51:30.646Z`,user_id:`e804c543-4e0a-4c45-9930-4450739d3b36`},"4afa8e10-e94d-4a71-b77b-2ed9898eff70":{created_at:`2026-09-01T00:50:16.868Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/1245186033868603476/cc240b56578aa0d646ed4139122c756e.png`,discord_email:`ns1660209@gmail.com`,discord_id:`1245186033868603476`,discord_username:`nyco123.#0`,game_id:`2646`,id:`4afa8e10-e94d-4a71-b77b-2ed9898eff70`,nickname:`Gaúcho`,nome:`Boateiro Perick`,requested_at:`2026-09-01T00:50:16.868Z`,reviewed_at:`2026-09-01T00:50:43.883Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`aprovado`,telefone:`120-069`,updated_at:`2026-09-01T00:50:43.883Z`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},"540f1840-303e-42b9-b9b7-5abb260736a8":{created_at:`2026-08-21T00:51:28.965Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/899381358823104513/231b0a7df070b8deee449477d1bc8f2f.png`,discord_email:`livedoball@gmail.com`,discord_id:`899381358823104513`,discord_username:`manball2590#0`,game_id:`494`,id:`540f1840-303e-42b9-b9b7-5abb260736a8`,nickname:`TT`,nome:`Toretto`,requested_at:`2026-08-21T00:51:28.965Z`,reviewed_at:`2026-08-21T00:51:35.355Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`aprovado`,telefone:`000-494`,updated_at:`2026-08-21T00:51:35.355Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"6873a8f8-ad60-4c75-9180-432f9187efd4":{created_at:`2026-08-24T02:54:03.599Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/622074568248393749/3a0721ea69ab754083ae06fca0fcbb21.png`,discord_email:`matheusdario481@gmail.com`,discord_id:`622074568248393749`,discord_username:`adamft.#0`,game_id:`5251`,id:`6873a8f8-ad60-4c75-9180-432f9187efd4`,nickname:`KAIM`,nome:`KAIM FOSTER`,requested_at:`2026-08-24T02:54:03.599Z`,reviewed_at:`2026-08-24T03:32:43.045Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`aprovado`,telefone:`181-778`,updated_at:`2026-08-24T03:32:43.045Z`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"6c5d6ea6-2218-4357-a71b-c3524ae167a1":{created_at:`2026-08-19T19:26:25.181Z`,id:`6c5d6ea6-2218-4357-a71b-c3524ae167a1`,nickname:`Teste`,nome:`Jogador Teste`,requested_at:`2026-08-19T19:26:25.181Z`,reviewed_at:`2026-08-19T21:20:19.886Z`,reviewed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`rejeitado`,telefone:`123-456`,updated_at:`2026-08-19T21:20:19.886Z`,user_id:`3487cc59-c4fb-45ed-8ed6-ef874ba39c37`},"72b22c88-2e26-41ce-8d62-728ce01ac6cb":{created_at:`2026-08-20T20:36:45.146Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/343459063616765953/afa6959ddde5e7b0bca558946ee7c285.png`,discord_email:`karyknms@gmail.com`,discord_id:`343459063616765953`,discord_username:`karianny#0`,game_id:`6079`,id:`72b22c88-2e26-41ce-8d62-728ce01ac6cb`,nickname:`Medusa`,nome:`Medusa Toretto`,requested_at:`2026-08-20T20:36:45.146Z`,reviewed_at:`2026-08-20T20:36:59.700Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`aprovado`,telefone:`005-056`,updated_at:`2026-08-20T20:36:59.700Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"8807f550-0bba-4a71-a59d-5e32716827d3":{created_at:`2026-08-22T03:39:11.420Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/815425543998668860/40457d932a2bdc24b985329761cbdfba.png`,discord_email:`eltonvargas977@gmail.com`,discord_id:`815425543998668860`,discord_username:`skk_v2#0`,game_id:`897`,id:`8807f550-0bba-4a71-a59d-5e32716827d3`,nickname:`SK`,nome:`JOAO SK`,requested_at:`2026-08-22T03:39:11.420Z`,reviewed_at:`2026-08-22T12:08:13.455Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`aprovado`,telefone:`286-290`,updated_at:`2026-08-22T12:08:13.455Z`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"903fca30-3ec2-4051-b15e-29a65c44cf0b":{created_at:`2026-08-21T01:21:21.832Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/722320491767136346/16e142b99717bde0cbc1b7e4d24283b5.png`,discord_email:`malaca7x@gmail.com`,discord_id:`722320491767136346`,discord_username:`malaca7k#0`,game_id:`12345`,id:`903fca30-3ec2-4051-b15e-29a65c44cf0b`,nickname:`Dev`,nome:`Developers`,requested_at:`2026-09-04T01:53:09.484Z`,reviewed_at:`2026-09-04T01:53:29.354Z`,reviewed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`aprovado`,telefone:`000-000`,updated_at:`2026-09-04T01:53:29.354Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"9c47d59e-9acc-494e-be13-748aab840cc4":{created_at:`2026-08-27T02:47:25.485Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/1490783713187860712/06dcf1eeb438b36a8487078ff12cf7a7.png`,discord_email:`alisanttt2002@gmail.com`,discord_id:`1490783713187860712`,discord_username:`alisson_daniel48#0`,game_id:`8228`,id:`9c47d59e-9acc-494e-be13-748aab840cc4`,nickname:`da vila`,nome:`Aisson da vila`,requested_at:`2026-08-27T02:47:25.485Z`,reviewed_at:`2026-08-27T02:48:27.602Z`,reviewed_by:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,status:`aprovado`,telefone:`688-102`,updated_at:`2026-08-27T02:48:27.602Z`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},"a057af14-6854-4539-8112-9bf6080eb712":{created_at:`2026-08-27T02:45:31.505Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/711610919850999869/7af6eba7eb0c07309d04941b09a3069a.png`,discord_email:`carbis231@gmail.com`,discord_id:`711610919850999869`,discord_username:`carlospvc#0`,game_id:`8393`,id:`a057af14-6854-4539-8112-9bf6080eb712`,nickname:`zeca`,nome:`zeca`,requested_at:`2026-08-27T02:45:31.505Z`,reviewed_at:`2026-08-27T02:45:57.095Z`,reviewed_by:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,status:`aprovado`,telefone:`295-015`,updated_at:`2026-08-27T02:45:57.095Z`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"ab6b9abc-e75a-4b74-9940-ad509a86575a":{created_at:`2026-08-19T19:41:42.103Z`,id:`ab6b9abc-e75a-4b74-9940-ad509a86575a`,nome:`malaca7`,requested_at:`2026-08-19T19:41:42.103Z`,status:`aprovado`,telefone:`000-000`,updated_at:`2026-08-19T21:34:07.685Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"b3aa86d0-94ca-489e-a2b4-9f83c54f7fdd":{created_at:`2026-08-28T18:31:57.109Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/628374267095941131/f3ab06d2230eaef957ccc12d874ea205.png`,discord_email:`igorsantosaaz@gmail.com`,discord_id:`628374267095941131`,discord_username:`macae#0`,game_id:`590`,id:`b3aa86d0-94ca-489e-a2b4-9f83c54f7fdd`,nickname:`Macaé`,nome:`Macaé Dacoro`,requested_at:`2026-08-28T18:31:57.109Z`,reviewed_at:`2026-08-29T12:57:55.998Z`,reviewed_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,status:`aprovado`,telefone:`021-000`,updated_at:`2026-08-29T12:57:55.998Z`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"de85c2f9-4838-4e5f-bedc-912c4e0f816c":{created_at:`2026-08-28T15:08:57.984Z`,discord_avatar_url:`https://cdn.discordapp.com/avatars/857308338382700565/f079d216ad175877321a68edc82725a5.png`,discord_email:`gustavomiguelmatos2@gmail.com`,discord_id:`857308338382700565`,discord_username:`_l7._#0`,game_id:`655`,id:`de85c2f9-4838-4e5f-bedc-912c4e0f816c`,nickname:`lennon`,nome:`lennon dacoro`,requested_at:`2026-08-28T15:08:57.984Z`,reviewed_at:`2026-08-28T16:16:29.172Z`,reviewed_by:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`,status:`aprovado`,telefone:`000-094`,updated_at:`2026-08-28T16:16:29.172Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"discord-722320491767136346":{status:`cancelled`},"e45255f5-c4b7-4a8d-b078-88e8b2e54a4c":{created_at:`2026-08-20T15:02:44.691Z`,game_id:`274`,id:`e45255f5-c4b7-4a8d-b078-88e8b2e54a4c`,nome:`Andrew Delucca Ferreira`,requested_at:`2026-08-20T15:02:44.691Z`,reviewed_at:`2026-08-20T15:40:19.043Z`,reviewed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,status:`aprovado`,telefone:`762-762`,updated_at:`2026-08-20T15:40:19.043Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},req_1792959044745:{discord_avatar_url:`https://cdn.discordapp.com/avatars/417371428141400067/5c577e0ef8c7445a1d709462a13a6570.png?size=512`,discord_email:`nicolas.tortato@gmail.com`,discord_id:`417371428141400067`,discord_username:`nicolastortato`,game_id:`8732`,id:`req_1792959044745`,nickname:`Nicolas`,nome:`Nicolas Kovarik Void`,requested_at:`2026-10-25T20:10:44.745Z`,status:`pendente`,telefone:`104-700`,user_id:`discord-417371428141400067`}},stock_movements:{"e201fc35-23a1-4e68-90ab-57fe92d62078":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T18:55:07.229Z`,discord_message_id:`1561814974928527381`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e201fc35-23a1-4e68-90ab-57fe92d62078`,origin:`discord`,previous_balance:`-10.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Submetralhadora**  \`+435\`
**MP5**  \`+2\`
**Lockpick**  \`-12\`
​
​
🧾 Detalhes da movimentação
Munição Submetralhadora
↳ +435 adicionados
MP5
↳ +2 adicionados
Lockpick
↳ -12 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-8.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e202d6b7-49ca-4ff3-b97a-bf9270083502":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-22T22:40:59.927Z`,discord_message_id:`1562958982614749375`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e202d6b7-49ca-4ff3-b97a-bf9270083502`,origin:`discord`,previous_balance:`-329.00`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,quantity:`500.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Glock 19**  \`-3\`
**G36C Mk2**  \`+1\`
**Munição Rifle**  \`+500\`
**Munição Pistola**  \`-150\`
​
​
🧾 Detalhes da movimentação
Glock 19
↳ -3 removidos
G36C Mk2
↳ +1 adicionado
Munição Rifle
↳ +500 adicionados
Munição Pistola
↳ -150 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`171.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e20d55b0-565a-43e4-8fc9-f0fe08e5ff5e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T01:34:18.433Z`,discord_message_id:`1565539312190226573`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e20d55b0-565a-43e4-8fc9-f0fe08e5ff5e`,origin:`discord`,previous_balance:`772.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`250.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MTAR\\-21**  \`-1\`
**Munição Submetralhadora**  \`-250\`
​
​
🧾 Detalhes da movimentação
MTAR\\-21
↳ -1 removido
Munição Submetralhadora
↳ -250 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`522.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e21c74a2-5ede-4a5d-ba6a-f6c6ae902c59":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T17:10:34.534Z`,id:`e21c74a2-5ede-4a5d-ba6a-f6c6ae902c59`,origin:`legacy`,previous_balance:`650`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`600`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"e22b4837-cdbc-4079-9345-f08b935a3c27":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T04:25:39.830Z`,discord_message_id:`1561231890864672770`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`e22b4837-cdbc-4079-9345-f08b935a3c27`,origin:`discord`,previous_balance:`-30.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`1.00`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Dinheiro Marcado**  \`-10740\`
**Lockpick**  \`-15\`
**Placa Falsa**  \`-1\`
​
​
🧾 Detalhes da movimentação
Dinheiro Marcado
↳ -10740 removidos
Lockpick
↳ -15 removidos
Placa Falsa
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-31.00`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e26185ce-bfaa-4ef3-8fe1-f4fa44bbef97":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T21:48:59.497Z`,id:`e26185ce-bfaa-4ef3-8fe1-f4fa44bbef97`,origin:`legacy`,previous_balance:`2`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`1`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e269e5f1-1d5a-4f7d-a3ff-b93248e76541":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-01T03:04:02.475Z`,discord_message_id:`1566286670360350831`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e269e5f1-1d5a-4f7d-a3ff-b93248e76541`,origin:`discord`,previous_balance:`40101.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`792.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+792\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +792 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`40893.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e28e274e-a2c7-4b19-a0f1-020cbb1c7ef7":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T17:10:36.482Z`,id:`e28e274e-a2c7-4b19-a0f1-020cbb1c7ef7`,origin:`legacy`,previous_balance:`700`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`650`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"e2bee3a0-ff1c-4517-bdc0-314d62459981":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T23:55:20.840Z`,id:`e2bee3a0-ff1c-4517-bdc0-314d62459981`,origin:`legacy`,previous_balance:`0`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`30`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`30`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e2c0c205-f070-4b74-ac65-4167c99bbcd3":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T14:53:12.648Z`,discord_message_id:`1563915916864127037`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e2c0c205-f070-4b74-ac65-4167c99bbcd3`,origin:`discord`,previous_balance:`-946.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`90.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+90\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +90 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-856.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e2c8d705-c94e-416f-a45b-5ca4c0d34d30":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T14:25:07.408Z`,discord_message_id:`1565731421534945354`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e2c8d705-c94e-416f-a45b-5ca4c0d34d30`,origin:`discord`,previous_balance:`-19.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+119\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +119 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-17.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e2c9109f-7cdb-4255-bb0b-ca8382f644ba":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T23:44:56.820Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e2c9109f-7cdb-4255-bb0b-ca8382f644ba`,origin:`discord`,previous_balance:`1.00`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e3025014-c943-4f47-a4bc-8ba714cd9d6d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T22:58:01.703Z`,discord_message_id:`1559701776918388858`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e3025014-c943-4f47-a4bc-8ba714cd9d6d`,origin:`discord`,previous_balance:`-281.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`30.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+30\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +30 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-251.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e32c3f4b-a358-43f1-8b57-ad2c9a344bac":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:05.784Z`,discord_message_id:`1561525613389418497`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e32c3f4b-a358-43f1-8b57-ad2c9a344bac`,origin:`discord`,previous_balance:`674.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`304.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+304\`
**Plano de Segurança**  \`-3\`
**Missão**  \`-1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`978.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e349e20d-0d02-46ab-a47a-20031f1a84ac":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-14T00:10:19.574Z`,discord_message_id:`1559719971335180299`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e349e20d-0d02-46ab-a47a-20031f1a84ac`,origin:`discord`,previous_balance:`5.00`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`550.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`+550\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ +550 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`555.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e35310bc-977e-41ed-bc35-17bfb0efd723":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:36:28.646Z`,discord_message_id:`1565731497606906031`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e35310bc-977e-41ed-bc35-17bfb0efd723`,origin:`discord`,previous_balance:`1980.00`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:`426.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Pistola**  \`+426\`
​
​
🧾 Detalhes da movimentação
Munição Pistola
↳ +426 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2406.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e39292fd-b7cd-47a1-8b05-edb41876a3df":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T23:00:36.477Z`,discord_message_id:`1559702425819156503`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e39292fd-b7cd-47a1-8b05-edb41876a3df`,origin:`discord`,previous_balance:`-542.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`542.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+542\`
**Arame**  \`+100\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +542 adicionados
Arame
↳ +100 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`0.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e396a88a-7c9a-46b1-9c39-492e2c6e6cd1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T03:21:45.157Z`,discord_message_id:`1566653515382661292`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e396a88a-7c9a-46b1-9c39-492e2c6e6cd1`,origin:`discord`,previous_balance:`47356.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`594.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-594\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -594 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`46762.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e3a5368e-841e-4ae7-97ad-faea8a7f386c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T22:30:43.288Z`,discord_message_id:`1566942662873972901`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e3a5368e-841e-4ae7-97ad-faea8a7f386c`,origin:`discord`,previous_balance:`52207.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`990.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-990\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -990 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`51217.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e3a7d93e-6f72-42b5-90a5-b261e972b214":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-23T22:54:42.584Z`,discord_message_id:`1552453181110222929`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`e3a7d93e-6f72-42b5-90a5-b261e972b214`,origin:`discord`,previous_balance:`-5`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:`1`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**G36C Mk2**  \`±0\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado · -1 removido`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-4`,status:`success`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e3d2df69-9453-4c1d-ba7e-7badc8199568":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T00:59:59.313Z`,discord_message_id:`1561472725330042982`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e3d2df69-9453-4c1d-ba7e-7badc8199568`,origin:`discord`,previous_balance:`-3151.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`200.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -200 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-3351.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e3e4bfc8-505b-4ace-aae1-0b9b188b0e97":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-21T02:29:12.334Z`,discord_message_id:`1562291637118574613`,discord_user_name:`JOAO SK`,game_player_id:`897`,id:`e3e4bfc8-505b-4ace-aae1-0b9b188b0e97`,origin:`discord`,previous_balance:`-49.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`10.00`,raw_log:`
joao sk ford • ID 897
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-10\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-59.00`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"e3efaf92-8151-470b-abbf-b7c8fa622daa":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-21T22:32:29.374Z`,discord_message_id:`1562594430731419650`,discord_user_name:`JOAO SK`,game_player_id:`897`,id:`e3efaf92-8151-470b-abbf-b7c8fa622daa`,origin:`discord`,previous_balance:`-8618.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
joao sk ford • ID 897
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-10\`
**Placa Falsa**  \`-2\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +10 adicionados · -20 removidos
Placa Falsa
↳ -2 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8628.00`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"e3f16750-a645-4050-8072-ddf4cb6ee2d6":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-12T00:22:05.896Z`,id:`e3f16750-a645-4050-8072-ddf4cb6ee2d6`,origin:`legacy`,previous_balance:`29`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`28`,status:`completed`,type:`saida`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"e40dadbb-cb4d-4e2f-bc40-095181e614b1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T06:03:37.858Z`,discord_message_id:`1561472725330042982`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e40dadbb-cb4d-4e2f-bc40-095181e614b1`,origin:`discord`,previous_balance:`-7547.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`200.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -200 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-7747.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e412c869-965c-44f9-8af0-5d68069ecec3":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T03:15:33.508Z`,discord_message_id:`1565909369001082943`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e412c869-965c-44f9-8af0-5d68069ecec3`,origin:`discord`,previous_balance:`-13379.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`15.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +15 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-13364.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e41bf0ee-9503-4516-b455-8d897850363d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:13:14.403Z`,discord_message_id:`1559642026927202305`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`e41bf0ee-9503-4516-b455-8d897850363d`,origin:`discord`,previous_balance:`-7.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`5.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Placa Falsa**  \`-5\`
**Algemas**  \`-2\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -5 removidos
Algemas
↳ -2 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-12.00`,status:`completed`,type:`saida`},"e427f8d1-9fc5-4ed7-9afc-bad4baf8e580":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T03:21:26.149Z`,discord_message_id:`1566653435678564453`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e427f8d1-9fc5-4ed7-9afc-bad4baf8e580`,origin:`discord`,previous_balance:`45475.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`1881.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1881\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +2079 adicionados · -198 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`47356.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e439ff4a-2f5c-4634-b514-93d51fdef08b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T01:24:39.122Z`,discord_message_id:`1563031595466752002`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e439ff4a-2f5c-4634-b514-93d51fdef08b`,origin:`discord`,previous_balance:`-8815.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-10\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8825.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e47c1e7b-23af-4920-971a-97d9043610d8":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T02:06:00.935Z`,id:`e47c1e7b-23af-4920-971a-97d9043610d8`,origin:`legacy`,previous_balance:`0`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`1`,status:`completed`,type:`entrada`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"e4ccc7fb-eb15-4d5f-94a2-d0425a628e16":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T05:07:00.101Z`,id:`e4ccc7fb-eb15-4d5f-94a2-d0425a628e16`,origin:`legacy`,previous_balance:`50`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`700`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`750`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e4d3cb5e-1de9-4de6-9507-144f1fc8e97a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T19:50:19.328Z`,id:`e4d3cb5e-1de9-4de6-9507-144f1fc8e97a`,origin:`legacy`,previous_balance:`298`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`348`,status:`completed`,type:`entrada`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"e4da6d44-da46-4587-9cbb-8547c8031136":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T19:51:46.834Z`,id:`e4da6d44-da46-4587-9cbb-8547c8031136`,origin:`legacy`,previous_balance:`2`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantity:`3`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`5`,status:`completed`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e4ee5c25-67e7-4cae-998b-67319cb30344":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T06:45:30.619Z`,discord_message_id:`1565916568637145209`,discord_user_name:`Rebarba Allecrim BomBom • ID 5372`,game_player_id:`5372`,id:`e4ee5c25-67e7-4cae-998b-67319cb30344`,origin:`discord`,previous_balance:`79.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`78.00`,status:`completed`,type:`saida`},"e52f73e4-e53b-4826-bef9-01a9a4d0b633":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T03:04:39.861Z`,id:`e52f73e4-e53b-4826-bef9-01a9a4d0b633`,origin:`legacy`,previous_balance:`548`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`498`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e5459553-0a53-476b-9f1e-4b811549c4fb":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T23:02:39.153Z`,discord_message_id:`1565501147102318786`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e5459553-0a53-476b-9f1e-4b811549c4fb`,origin:`discord`,previous_balance:`30647.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`487.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-487\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -487 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`30160.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e55a9734-15f0-4416-8f4a-d6420d635cdc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-22T05:49:36.519Z`,discord_message_id:`1551832821390254131`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e55a9734-15f0-4416-8f4a-d6420d635cdc`,origin:`discord`,previous_balance:`7`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`6`,status:`success`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e564d714-8bf0-4fcf-b212-31d9befe1fe1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:05.784Z`,discord_message_id:`1561525613389418497`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e564d714-8bf0-4fcf-b212-31d9befe1fe1`,origin:`discord`,previous_balance:`2.00`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+304\`
**Plano de Segurança**  \`-3\`
**Missão**  \`-1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e5a69cc3-c3b4-4d10-854f-8c8281d5412a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T03:13:46.630Z`,discord_message_id:`1550706435120439297`,discord_user_name:`Malaca`,game_player_id:`5669`,id:`e5a69cc3-c3b4-4d10-854f-8c8281d5412a`,origin:`discord`,previous_balance:`-1`,product_id:`50ca904d-24ed-4dda-a0aa-352d28dac501`,quantity:`1`,raw_log:`
Malaca • ID 5669
📦 BAÚ QG

📊 Saldo líquido
Chip Ilegal \`-1\`
Tablet \`-1\`

🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido
Tablet
↳ -1 removido

Movimentações agrupadas em uma janela de 30 segundos • Hoje às 00:10`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-2`,status:`success`,type:`saida`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"e5b5d19c-e3cd-45b5-a677-0f134f350ed5":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T17:02:03.009Z`,discord_message_id:`1560336968402083861`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e5b5d19c-e3cd-45b5-a677-0f134f350ed5`,origin:`discord`,previous_balance:`-36.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-1\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-37.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e5cb50de-7314-417f-8ac1-933bf6b0016b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T01:07:12.893Z`,discord_message_id:`1563720553712590980`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e5cb50de-7314-417f-8ac1-933bf6b0016b`,origin:`discord`,previous_balance:`29689.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`99.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chapa de Metal**  \`-99\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -99 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`29590.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e5e1b542-9d7f-489e-b05b-f016050220ec":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T15:04:54.456Z`,discord_message_id:`1560433506956345375`,discord_user_name:`Alice Armani • ID 425`,game_player_id:`425`,id:`e5e1b542-9d7f-489e-b05b-f016050220ec`,origin:`discord`,previous_balance:`-411.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`5.00`,raw_log:`
Alice Armani • ID 425
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-2\`
**Lockpick**  \`-6\`
**Explosivo C4**  \`-5\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -2 removidos
Lockpick
↳ -6 removidos
Explosivo C4
↳ -5 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-416.00`,status:`completed`,type:`saida`},"e6038850-1bd9-4716-a397-fd13aef861dd":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T04:18:14.337Z`,discord_message_id:`1565942954802290729`,discord_user_name:`Medusa Toretto`,game_player_id:`6079`,id:`e6038850-1bd9-4716-a397-fd13aef861dd`,origin:`discord`,previous_balance:`-13565.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`6.00`,raw_log:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-6\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -6 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-13571.00`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"e605bf3d-3701-4198-8fd1-73c61c7958fc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:19:24.460Z`,discord_message_id:`1565854414785216712`,discord_user_name:`Malaca`,game_player_id:`5669`,id:`e605bf3d-3701-4198-8fd1-73c61c7958fc`,origin:`discord`,previous_balance:`-3.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
Malaca • ID 5669
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-4.00`,status:`completed`,type:`saida`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"e60e2f0d-8a38-4498-a19f-cc650ca44b1a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T04:25:38.476Z`,discord_message_id:`1561182901490421832`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e60e2f0d-8a38-4498-a19f-cc650ca44b1a`,origin:`discord`,previous_balance:`-3.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+100\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +100 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e6163fca-60cc-4021-bcce-4fae3e43880f":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T02:04:42.530Z`,discord_message_id:`1550646285785104507`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`e6163fca-60cc-4021-bcce-4fae3e43880f`,origin:`discord`,previous_balance:`-1`,product_id:`8d0daf4d-4312-44b7-85ad-bb9699a574c5`,quantity:`1`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Tablet**  \`-2\`
**Kit de Reparo Simples**  \`-2\`
**Galão de Combustível**  \`-1\`
**Taco de Beisebol**  \`-1\`
**Colete**  \`-1\`
​
​
🧾 Detalhes da movimentação
Tablet
↳ -2 removidos
Kit de Reparo Simples
↳ -2 removidos
Galão de Combustível
↳ -1 removido
Taco de Beisebol
↳ -1 removido
Colete
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-2`,status:`success`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e635a245-0d6a-4fe2-9ea9-b798278fac93":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T03:03:14.945Z`,id:`e635a245-0d6a-4fe2-9ea9-b798278fac93`,origin:`legacy`,previous_balance:`600`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`550`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"e63e368b-9b84-436c-be16-25e2d8fc7533":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T13:59:22.005Z`,discord_message_id:`1563914872616652972`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e63e368b-9b84-436c-be16-25e2d8fc7533`,origin:`discord`,previous_balance:`-8810.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`400.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-400\`
**Thermite**  \`-5\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -400 removidos
Thermite
↳ -5 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-9210.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e64100a0-1685-4980-a3d4-056608aea0d4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T18:05:16.466Z`,discord_message_id:`1563915134156410923`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e64100a0-1685-4980-a3d4-056608aea0d4`,origin:`discord`,previous_balance:`-61.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`100.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Placa Falsa**  \`-100\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-161.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e65154bc-ecca-4e70-95a7-035f510a8b6a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T03:10:58.183Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e65154bc-ecca-4e70-95a7-035f510a8b6a`,origin:`discord`,previous_balance:`984.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`152.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`1136.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e65d0118-e68d-4bc3-aca1-70dbb10f383f":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T04:00:21.422Z`,discord_message_id:`1560140248573284466`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e65d0118-e68d-4bc3-aca1-70dbb10f383f`,origin:`discord`,previous_balance:`-1131.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`8.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Silent Bypass**  \`-2\`
**Lockpick**  \`-8\`
​
​
🧾 Detalhes da movimentação
Silent Bypass
↳ -2 removidos
Lockpick
↳ -8 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1139.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e670edca-db62-4f64-b834-9beb205b54ec":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:01.867Z`,discord_message_id:`1561415454453670010`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`e670edca-db62-4f64-b834-9beb205b54ec`,origin:`discord`,previous_balance:`-4463.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`4.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+4\`
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +4 adicionados
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-4459.00`,status:`completed`,type:`entrada`},"e67fcc58-6ab4-42c7-961c-fcc1b874707e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T02:15:45.630Z`,discord_message_id:`1565187355860664492`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e67fcc58-6ab4-42c7-961c-fcc1b874707e`,origin:`discord`,previous_balance:`-1334.00`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,quantity:`100.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`-2\`
**Munição Rifle**  \`-100\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ -2 removidos
Munição Rifle
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1434.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e697d645-f522-49e4-89c4-4c04ee2e646b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:00:59.196Z`,discord_message_id:`1565877660108722179`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e697d645-f522-49e4-89c4-4c04ee2e646b`,origin:`discord`,previous_balance:`-38.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`20.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`+20\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ +20 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-18.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e6bf5c0d-7b42-42c3-a0b9-ae13d4dea1e6":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T03:24:34.019Z`,discord_message_id:`1566654223305805895`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e6bf5c0d-7b42-42c3-a0b9-ae13d4dea1e6`,origin:`discord`,previous_balance:`1.00`,product_id:`e616ccac-1edb-46f6-a77b-e0471817c5ce`,quantity:`3.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Skate**  \`-1\`
**Roupa de mergulho**  \`-1\`
**Energético**  \`-11\`
**Spray Brasil**  \`-12\`
**Kit de Reparo Simples**  \`-3\`
**Algemas**  \`-1\`
**Álcool em Gel**  \`-1\`
**Bandagem**  \`-9\`
**Cesta de Ovos**  \`-1\`
​
​
🧾 Detalhes da movimentação
Skate
↳ -1 removido
Roupa de mergulho
↳ -1 removido
Energético
↳ -11 removidos
Spray Brasil
↳ -12 removidos
Kit de Reparo Simples
↳ -3 removidos
Algemas
↳ -1 removido
Álcool em Gel
↳ -1 removido
Bandagem
↳ -9 removidos
Cesta de Ovos
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-2.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e6c2fe2a-0904-470f-90b9-89b9efbf3ae8":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-20T00:22:01.323Z`,discord_message_id:`1561897242498039839`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e6c2fe2a-0904-470f-90b9-89b9efbf3ae8`,origin:`discord`,previous_balance:`-44.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`5.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+5\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +5 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-39.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e6d0837f-1d39-48e1-a97d-a52d63aea12a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T01:24:40.478Z`,discord_message_id:`1563318472665075866`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e6d0837f-1d39-48e1-a97d-a52d63aea12a`,origin:`discord`,previous_balance:`-57.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`9.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-9\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -9 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-66.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e6dde5d7-6140-489a-ae77-25d7b7b1e0f7":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T15:41:40.133Z`,discord_message_id:`1563915438105034833`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e6dde5d7-6140-489a-ae77-25d7b7b1e0f7`,origin:`discord`,previous_balance:`29689.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`99.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-190\`
**Algemas**  \`-15\`
**Chapa de Metal**  \`-99\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -190 removidos
Algemas
↳ -15 removidos
Chapa de Metal
↳ -99 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`29590.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e6df9656-a873-4320-b984-f9271e998ad1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T03:10:58.183Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e6df9656-a873-4320-b984-f9271e998ad1`,origin:`discord`,previous_balance:`1.00`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e6e84d4d-d598-413f-9d08-c9cd3666a586":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-01T00:29:46.845Z`,id:`e6e84d4d-d598-413f-9d08-c9cd3666a586`,origin:`legacy`,previous_balance:`18`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`4`,reason:`verifiquei no bau e tem menos quantidade`,resulting_balance:`14`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"e706d166-cd89-4a21-a86c-1db500fa420a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T23:23:05.574Z`,discord_message_id:`1565868678988431453`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e706d166-cd89-4a21-a86c-1db500fa420a`,origin:`discord`,previous_balance:`-1561.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`165.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+165\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +165 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1396.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e7152790-11e3-48ea-9e4f-147d1059700d":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-12T19:30:34.734Z`,id:`e7152790-11e3-48ea-9e4f-147d1059700d`,origin:`legacy`,previous_balance:`8`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`4`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`4`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e7241e9b-d853-4b24-99a9-939b4688cef2":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-06T12:56:45.154Z`,id:`e7241e9b-d853-4b24-99a9-939b4688cef2`,origin:`legacy`,previous_balance:`621`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`150`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`771`,status:`completed`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e7270543-3bd8-40a4-9030-c6a76b4481d8":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T01:12:01.709Z`,discord_message_id:`1562984900733308999`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e7270543-3bd8-40a4-9030-c6a76b4481d8`,origin:`discord`,previous_balance:`17564.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`474.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+474\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1881 adicionados · -1407 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`18038.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e73f8e77-e599-4856-b130-ba19687b9582":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T22:30:04.632Z`,discord_message_id:`1566942500697018523`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e73f8e77-e599-4856-b130-ba19687b9582`,origin:`discord`,previous_balance:`-15352.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`200.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`±0\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +200 adicionados · -200 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-15152.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e740baca-b24a-420d-b75c-41edea16b880":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T14:08:28.125Z`,discord_message_id:`1565729103041273998`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e740baca-b24a-420d-b75c-41edea16b880`,origin:`discord`,previous_balance:`-37.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-38.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e80b16bc-aacd-4a29-86a1-3de86835be33":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:59:24.061Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e80b16bc-aacd-4a29-86a1-3de86835be33`,origin:`discord`,previous_balance:`1.00`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e82d0ee9-2ce3-43a5-91f5-2098677c8b24":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:36:27.892Z`,discord_message_id:`1565731421534945354`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e82d0ee9-2ce3-43a5-91f5-2098677c8b24`,origin:`discord`,previous_balance:`1190.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`119.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+119\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +119 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`1309.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e8449789-a836-4b54-a640-f976a51046d7":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:36:27.892Z`,discord_message_id:`1565731421534945354`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e8449789-a836-4b54-a640-f976a51046d7`,origin:`discord`,previous_balance:`-15.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+119\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +119 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-13.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e84bbbbc-7cfb-4abd-a139-6847ad7721fc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T17:10:58.040Z`,discord_message_id:`1563915916864127037`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e84bbbbc-7cfb-4abd-a139-6847ad7721fc`,origin:`discord`,previous_balance:`-1006.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`90.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+90\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +90 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-916.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e84ce3d8-fbe5-49d7-9b28-df716b3d6363":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T23:09:00.406Z`,id:`e84ce3d8-fbe5-49d7-9b28-df716b3d6363`,origin:`legacy`,previous_balance:`49`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`2`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`47`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"e85b654d-3a58-48de-91b4-300119ed33ab":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T10:33:07.150Z`,discord_message_id:`1567124460165791765`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e85b654d-3a58-48de-91b4-300119ed33ab`,origin:`discord`,previous_balance:`-15752.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`500.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-500\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -500 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-16252.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e8647e38-88c4-4e9f-a68e-c1ac4a1df977":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T00:14:20.799Z`,discord_message_id:`1561502066290065510`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e8647e38-88c4-4e9f-a68e-c1ac4a1df977`,origin:`discord`,previous_balance:`-2.00`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`+1\`
**MP5**  \`-6\`
**Munição Submetralhadora**  \`-302\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado
MP5
↳ -6 removidos
Munição Submetralhadora
↳ -302 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e8857ac1-000f-47e7-b951-cb8e4c569963":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T09:15:30.776Z`,discord_message_id:`1566017766388146187`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e8857ac1-000f-47e7-b951-cb8e4c569963`,origin:`discord`,previous_balance:`52.00`,product_id:`297e437f-504d-4715-8d4c-9b1616853d39`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Kit de Reparo Avançado**  \`-2\`
​
​
🧾 Detalhes da movimentação
Kit de Reparo Avançado
↳ -2 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`50.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e8969428-4cd5-43e4-82d5-f59257bfe4a1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-20T00:21:49.444Z`,discord_message_id:`1561897192124583978`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e8969428-4cd5-43e4-82d5-f59257bfe4a1`,origin:`discord`,previous_balance:`-39.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`5.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Algemas**  \`-5\`
**Chapa de Metal**  \`-99\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -5 removidos
Chapa de Metal
↳ -99 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-44.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e8a0a8a5-5307-48b3-acc5-29ce384ad6e5":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-08T17:55:35.583Z`,id:`e8a0a8a5-5307-48b3-acc5-29ce384ad6e5`,origin:`legacy`,previous_balance:`165682`,product_id:`4e683441-0730-489a-ba27-bd2903709bf5`,quantity:`165682`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`331364`,status:`completed`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e8e7cf94-9db0-4d3b-b8a2-5db0c904bcff":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:13:11.232Z`,discord_message_id:`1559621150311579720`,discord_user_name:`zeca`,game_player_id:`8393`,id:`e8e7cf94-9db0-4d3b-b8a2-5db0c904bcff`,origin:`discord`,previous_balance:`289.00`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`132.00`,raw_log:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`-67\`
**Metanfetamina**  \`-132\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ -67 removidos
Metanfetamina
↳ -132 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`157.00`,status:`completed`,type:`saida`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"e9189d66-b429-4c21-84ec-84c4ef53c4bb":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T21:42:32.177Z`,id:`e9189d66-b429-4c21-84ec-84c4ef53c4bb`,origin:`legacy`,previous_balance:`250`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`450`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`700`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e97ca5b9-c669-4901-a9ef-115f5689fe00":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T21:13:56.740Z`,discord_message_id:`1560762747669446821`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e97ca5b9-c669-4901-a9ef-115f5689fe00`,origin:`discord`,previous_balance:`-4.00`,product_id:`6db947d4-c77f-4f3f-877e-a24b7a941f72`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Esmerilhadeira**  \`+1\`
​
​
🧾 Detalhes da movimentação
Esmerilhadeira
↳ +3 adicionados · -2 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-3.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e9985b53-a640-4c05-b431-212191f71d42":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T05:29:09.356Z`,discord_message_id:`1565909329142485172`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e9985b53-a640-4c05-b431-212191f71d42`,origin:`discord`,previous_balance:`-14183.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`15.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -15 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-14198.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e9a15baf-412f-4860-9c77-0def7dfbe105":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T02:48:41.604Z`,discord_message_id:`1565909369001082943`,discord_user_name:`Toretto`,game_player_id:`494`,id:`e9a15baf-412f-4860-9c77-0def7dfbe105`,origin:`discord`,previous_balance:`-13178.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`15.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +15 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-13163.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"e9b3b1e2-9875-4fb0-9b01-a027bb08cf3c":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T02:31:40.330Z`,id:`e9b3b1e2-9875-4fb0-9b01-a027bb08cf3c`,origin:`legacy`,previous_balance:`180`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`225`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`405`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e9b5b998-ee03-42e4-8598-92d5da5abf95":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T04:36:15.350Z`,discord_message_id:`1561236445908308051`,discord_user_name:`Rebarba Allecrim BomBom • ID 5372`,game_player_id:`5372`,id:`e9b5b998-ee03-42e4-8598-92d5da5abf95`,origin:`discord`,previous_balance:`-6.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-7.00`,status:`completed`,type:`saida`},"e9d5e3b0-d528-4529-b68d-523092399bbe":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T01:03:32.399Z`,discord_message_id:`1564806793723388017`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`e9d5e3b0-d528-4529-b68d-523092399bbe`,origin:`discord`,previous_balance:`12.00`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`±0\`
**Glock 19**  \`-1\`
**Munição Pistola**  \`-185\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ +2 adicionados · -2 removidos
Glock 19
↳ -1 removido
Munição Pistola
↳ -185 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`11.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"e9edcda7-47c5-4b3b-8d55-8770f0a3f991":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T23:38:13.836Z`,discord_message_id:`1566959651482771519`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e9edcda7-47c5-4b3b-8d55-8770f0a3f991`,origin:`discord`,previous_balance:`-15152.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`400.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-400\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -400 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-15552.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"e9ee3c6e-0f58-416e-9544-7f947f48bfaa":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T15:54:12.273Z`,discord_message_id:`1565030936788074608`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`e9ee3c6e-0f58-416e-9544-7f947f48bfaa`,origin:`discord`,previous_balance:`11.00`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantity:`6.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Glock 19**  \`-6\`
**Munição Pistola**  \`-500\`
​
​
🧾 Detalhes da movimentação
Glock 19
↳ -6 removidos
Munição Pistola
↳ -500 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`5.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ea1ba54b-9af9-4cb9-90a1-8397c21791f5":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-11T14:41:16.751Z`,id:`ea1ba54b-9af9-4cb9-90a1-8397c21791f5`,origin:`legacy`,previous_balance:`62`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`24`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`38`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ea1f8026-2e97-4d22-8429-722daeaaf77d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T17:10:55.737Z`,discord_message_id:`1563915438105034833`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ea1f8026-2e97-4d22-8429-722daeaaf77d`,origin:`discord`,previous_balance:`-9970.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`190.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-190\`
**Algemas**  \`-15\`
**Chapa de Metal**  \`-99\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -190 removidos
Algemas
↳ -15 removidos
Chapa de Metal
↳ -99 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-10160.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ea5a9e0a-fe26-4109-aac5-ee3d5e942c1d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T03:26:05.721Z`,discord_message_id:`1565929831718199321`,discord_user_name:`Rebarba Allecrim BomBom • ID 5372`,game_player_id:`5372`,id:`ea5a9e0a-fe26-4109-aac5-ee3d5e942c1d`,origin:`discord`,previous_balance:`-1351.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`1.00`,raw_log:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-1\`
**Placa Falsa**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -1 removido
Placa Falsa
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1352.00`,status:`completed`,type:`saida`},"ea5b1e67-260c-4da0-aa63-0c20269ce315":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:36:25.766Z`,discord_message_id:`1565728451242238023`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ea5b1e67-260c-4da0-aa63-0c20269ce315`,origin:`discord`,previous_balance:`40956.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`21.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-21\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -21 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`40935.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ea6e7b03-398f-43c2-8ca1-79ecaef64f6d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T16:20:51.467Z`,discord_message_id:`1565037644017041431`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ea6e7b03-398f-43c2-8ca1-79ecaef64f6d`,origin:`discord`,previous_balance:`-1139.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`5.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-5\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -5 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1144.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ea704a0c-d3ba-4a38-af96-f4c393cdbed6":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T23:08:08.288Z`,discord_message_id:`1560791485442424833`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`ea704a0c-d3ba-4a38-af96-f4c393cdbed6`,origin:`discord`,previous_balance:`-4.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`5.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+5\`
**Munição Submetralhadora**  \`+250\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +5 adicionados
Munição Submetralhadora
↳ +250 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`1.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"ea721357-99d8-4d77-9b7a-008a3253c331":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T17:09:24.958Z`,discord_message_id:`1563600312814801059`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ea721357-99d8-4d77-9b7a-008a3253c331`,origin:`discord`,previous_balance:`-101.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-6\`
**Algemas**  \`-1\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -6 removidos
Algemas
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-102.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ea81b9f7-0156-4dc1-a22e-fbcb75682d94":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:59:24.061Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`ea81b9f7-0156-4dc1-a22e-fbcb75682d94`,origin:`discord`,previous_balance:`830.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`152.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`982.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"ea8aae3e-93be-48c5-b1d4-a7e347a88935":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-16T03:11:34.744Z`,id:`ea8aae3e-93be-48c5-b1d4-a7e347a88935`,origin:`legacy`,previous_balance:`484`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`385`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`99`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"ea8b3b2b-676e-471c-ba29-bdabc899fc35":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T03:23:00.907Z`,discord_message_id:`1566653832694333471`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ea8b3b2b-676e-471c-ba29-bdabc899fc35`,origin:`discord`,previous_balance:`-70.00`,product_id:`6db947d4-c77f-4f3f-877e-a24b7a941f72`,quantity:`12.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Esmerilhadeira**  \`+12\`
**Chapa de Metal**  \`+1386\`
​
​
🧾 Detalhes da movimentação
Esmerilhadeira
↳ +12 adicionados
Chapa de Metal
↳ +1458 adicionados · -72 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-58.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"eaacd9a8-0855-43d3-bfa4-f2bfc84b6bc0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T01:04:27.725Z`,discord_message_id:`1563719862067667026`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`eaacd9a8-0855-43d3-bfa4-f2bfc84b6bc0`,origin:`discord`,previous_balance:`1950.00`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,quantity:`100.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Arame**  \`+100\`
​
​
🧾 Detalhes da movimentação
Arame
↳ +100 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2050.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ead0191c-5279-4423-ba73-a4d6d41b50b1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T22:38:32.347Z`,discord_message_id:`1564045526041624680`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ead0191c-5279-4423-ba73-a4d6d41b50b1`,origin:`discord`,previous_balance:`28629.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`1060.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1060\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1060 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`29689.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ead232eb-d9d2-46b0-a340-b910f0bfd3a5":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T08:19:41.198Z`,discord_message_id:`1563030105973067857`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ead232eb-d9d2-46b0-a340-b910f0bfd3a5`,origin:`discord`,previous_balance:`-8793.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`6.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-6\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -6 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8799.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ead6bee7-9229-4061-ac77-0b44cc06e223":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T04:21:13.893Z`,id:`ead6bee7-9229-4061-ac77-0b44cc06e223`,origin:`legacy`,previous_balance:`200`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`150`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`50`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"eaeea5fa-39d4-41e2-8902-5e02f45e12cc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:36:27.373Z`,discord_message_id:`1565729574765985875`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`eaeea5fa-39d4-41e2-8902-5e02f45e12cc`,origin:`discord`,previous_balance:`0.00`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`-2\`
**Glock 19**  \`-1\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ -2 removidos
Glock 19
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"eb37bc33-ae04-4796-ac58-ba126523961b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T01:00:00.156Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`eb37bc33-ae04-4796-ac58-ba126523961b`,origin:`discord`,previous_balance:`60.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`152.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`212.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"eb3997d3-7737-40da-acb6-250cf030f991":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T23:38:36.791Z`,discord_message_id:`1565147808858775585`,discord_user_name:`Nicolas Kovarik Void`,game_player_id:`8732`,id:`eb3997d3-7737-40da-acb6-250cf030f991`,origin:`discord`,previous_balance:`-1143.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`1.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1144.00`,status:`completed`,type:`saida`,user_id:`discord-417371428141400067`},"eb487f25-4941-4537-a664-b3137c5da19e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-26T19:15:16.635Z`,discord_message_id:`1564356761765286081`,discord_user_name:`Paquetá Stifler • ID 204`,game_player_id:`204`,id:`eb487f25-4941-4537-a664-b3137c5da19e`,origin:`discord`,previous_balance:`0.00`,product_id:`b9e76652-8ec0-475e-8ded-19bf5de5fcff`,quantity:`2.00`,raw_log:`
Paquetá Stifler • ID 204
📦 Baú
​
📊 Saldo líquido
**Mochila**  \`+2\`
​
​
🧾 Detalhes da movimentação
Mochila
↳ +2 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2.00`,status:`completed`,type:`entrada`},"eb54dc40-c1e6-4ac8-84db-b43890ebbdee":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T03:30:47.009Z`,id:`eb54dc40-c1e6-4ac8-84db-b43890ebbdee`,origin:`legacy`,previous_balance:`419`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`100`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`319`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"eb9ca83a-aa20-42bc-87dc-9f2543a5521b":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T00:30:19.038Z`,id:`eb9ca83a-aa20-42bc-87dc-9f2543a5521b`,origin:`legacy`,previous_balance:`24`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`23`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"eb9ce44b-c2ec-4e03-975d-d3b0f3873ed1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:13:45.924Z`,discord_message_id:`1559641856252317882`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`eb9ce44b-c2ec-4e03-975d-d3b0f3873ed1`,origin:`discord`,previous_balance:`4.00`,product_id:`7cdb9246-bc0a-42a4-9f8e-dbbef125657d`,quantity:`2.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Taco de Beisebol**  \`+1\`
**Bandagem**  \`+2\`
**Lockpick**  \`+9\`
​
​
🧾 Detalhes da movimentação
Taco de Beisebol
↳ +1 adicionado
Bandagem
↳ +2 adicionados
Lockpick
↳ +9 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`6.00`,status:`completed`,type:`entrada`},"ebaa3953-58cc-41d6-ad28-a3f528ac76ea":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T17:39:04.820Z`,discord_message_id:`1566869268862345237`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ebaa3953-58cc-41d6-ad28-a3f528ac76ea`,origin:`discord`,previous_balance:`-14974.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`23.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+23\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +23 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-14951.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ebc4f725-17f4-47fd-80a1-df043a4ea248":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T22:43:37.627Z`,discord_message_id:`1560422929093759028`,discord_user_name:`Paquetá Stifler • ID 204`,game_player_id:`204`,id:`ebc4f725-17f4-47fd-80a1-df043a4ea248`,origin:`discord`,previous_balance:`-1126.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
Paquetá Stifler • ID 204
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-10\`
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -10 removidos
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1136.00`,status:`completed`,type:`saida`},"ec1430ba-e949-42a4-8094-680747f875fc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:59:22.814Z`,discord_message_id:`1561471459526971515`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ec1430ba-e949-42a4-8094-680747f875fc`,origin:`discord`,previous_balance:`-5981.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+50\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +50 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-5931.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ec250c62-b461-44ed-8860-099e47f9f84c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-05T02:53:05.220Z`,id:`ec250c62-b461-44ed-8860-099e47f9f84c`,origin:`legacy`,previous_balance:`5`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`2`,reason:`perca`,resulting_balance:`3`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ec394946-e69f-4495-87b7-2fdc418a60af":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-20T17:20:31.022Z`,discord_message_id:`1551281913413636129`,discord_user_name:`JOAO SK`,game_player_id:`897`,id:`ec394946-e69f-4495-87b7-2fdc418a60af`,origin:`discord`,previous_balance:`-48`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`8`,raw_log:`
joao sk ford • ID 897
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-8\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -8 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-56`,status:`success`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"ec436f63-c307-439e-95a1-e51fa1531df1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T06:03:39.385Z`,discord_message_id:`1561525613389418497`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ec436f63-c307-439e-95a1-e51fa1531df1`,origin:`discord`,previous_balance:`6.00`,product_id:`d9ad7c1f-93a7-44f5-afc0-75430299e5d9`,quantity:`3.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+304\`
**Plano de Segurança**  \`-3\`
**Missão**  \`-1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`3.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ec483833-7912-4b41-8d27-173108c6a9fc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-01T02:57:55.764Z`,discord_message_id:`1566285132019794063`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ec483833-7912-4b41-8d27-173108c6a9fc`,origin:`discord`,previous_balance:`38517.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`1584.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1584\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1584 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`40101.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ec4c8117-1443-40f0-acac-c09a1772540f":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-06T00:59:31.736Z`,id:`ec4c8117-1443-40f0-acac-c09a1772540f`,origin:`legacy`,previous_balance:`50`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`150`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`200`,status:`completed`,type:`entrada`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"ec4cf606-8b7c-4fb9-b760-2430134c7e8a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T21:09:36.362Z`,discord_message_id:`1561848818805243956`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ec4cf606-8b7c-4fb9-b760-2430134c7e8a`,origin:`discord`,previous_balance:`2.00`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+1\`
**Munição Submetralhadora**  \`-58\`
**Micro Uzi**  \`-1\`
**Plano de Segurança**  \`+1\`
**Placa Falsa**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +1 adicionado
Munição Submetralhadora
↳ +271 adicionados · -329 removidos
Micro Uzi
↳ -1 removido
Plano de Segurança
↳ +1 adicionado
Placa Falsa
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ec4f67ea-b0bb-4574-a90e-a1908a15ba3e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T17:45:08.913Z`,discord_message_id:`1563915865299226737`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ec4f67ea-b0bb-4574-a90e-a1908a15ba3e`,origin:`discord`,previous_balance:`-876.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`150.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-150\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -150 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1026.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ec5c2e69-5046-467e-8b08-1682ffeb8016":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T18:44:28.896Z`,discord_message_id:`1561812297469665302`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ec5c2e69-5046-467e-8b08-1682ffeb8016`,origin:`discord`,previous_balance:`3.00`,product_id:`7436e45e-11fa-4d46-aaed-835e3c3346ed`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Hacking**  \`-1\`
**Kit Médico**  \`-2\`
**Bandagem**  \`-5\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -1 removido
Kit Médico
↳ -2 removidos
Bandagem
↳ -5 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ec770fca-78fd-4726-b4b2-82bf0fdbba22":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T23:35:24.806Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`ec770fca-78fd-4726-b4b2-82bf0fdbba22`,origin:`discord`,previous_balance:`-98.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`152.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`54.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"ec8b1a78-ea0f-406d-9334-bb3f9177f45b":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-08T17:42:52.494Z`,id:`ec8b1a78-ea0f-406d-9334-bb3f9177f45b`,origin:`legacy`,previous_balance:`0`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`2`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`2`,status:`completed`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ecae6247-7639-483d-b749-82c11f0d8254":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T06:45:29.379Z`,discord_message_id:`1565909192592859247`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ecae6247-7639-483d-b749-82c11f0d8254`,origin:`discord`,previous_balance:`47.00`,product_id:`297e437f-504d-4715-8d4c-9b1616853d39`,quantity:`5.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Kit de Reparo Avançado**  \`+5\`
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Kit de Reparo Avançado
↳ +5 adicionados
Lockpick
↳ -200 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`52.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ecb565d9-250a-4363-848a-f76d72889053":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T23:42:01.945Z`,discord_message_id:`1563699118025482270`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`ecb565d9-250a-4363-848a-f76d72889053`,origin:`discord`,previous_balance:`6.00`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`-1\`
**Munição Rifle**  \`-150\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ -1 removido
Munição Rifle
↳ -150 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`5.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"eceea996-93d2-43db-bdce-06776c0b6e43":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-02T00:11:25.978Z`,id:`eceea996-93d2-43db-bdce-06776c0b6e43`,origin:`legacy`,previous_balance:`190`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`10`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`180`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"ecf0d6e2-88c0-445b-95b4-2077a6d6dd8c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T17:22:21.768Z`,discord_message_id:`1561791631668019313`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ecf0d6e2-88c0-445b-95b4-2077a6d6dd8c`,origin:`discord`,previous_balance:`-9.00`,product_id:`c02ba803-5c22-43dc-9cbf-3c9c3024b136`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Silent Bypass**  \`+2\`
​
​
🧾 Detalhes da movimentação
Silent Bypass
↳ +2 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-7.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ed0a77b8-18b5-4ba9-823d-caf82a83da67":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T13:06:49.558Z`,discord_message_id:`1565351199165906975`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ed0a77b8-18b5-4ba9-823d-caf82a83da67`,origin:`discord`,previous_balance:`-284.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`15.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+15\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +15 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-269.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ed1c4f27-c262-461d-b2ac-d7594e1260f0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T19:34:53.904Z`,discord_message_id:`1559642291696570550`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`ed1c4f27-c262-461d-b2ac-d7594e1260f0`,origin:`discord`,previous_balance:`7.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`2.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+2\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +2 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`9.00`,status:`completed`,type:`entrada`},"ed221fc8-e591-4a05-b34d-bf2444bf4511":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:04.223Z`,discord_message_id:`1561472725330042982`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ed221fc8-e591-4a05-b34d-bf2444bf4511`,origin:`discord`,previous_balance:`-4819.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`200.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -200 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-5019.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ed24d092-4b9f-42ba-a107-dc83d70672fd":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T03:15:31.963Z`,discord_message_id:`1565909109872664729`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ed24d092-4b9f-42ba-a107-dc83d70672fd`,origin:`discord`,previous_balance:`-1340.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`9.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+9\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +9 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1331.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ed32cb47-e7d6-446c-8230-daa3c2482f72":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T02:04:42.210Z`,discord_message_id:`1550642994309365951`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`ed32cb47-e7d6-446c-8230-daa3c2482f72`,origin:`discord`,previous_balance:`0`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantity:`1`,raw_log:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**FN Five Seven**  \`+14\`
**Glock 19**  \`+1\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ +14 adicionados
Glock 19
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`1`,status:`success`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"ed3e1744-d7ce-4618-815b-0ee8819a059b":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T19:55:14.116Z`,id:`ed3e1744-d7ce-4618-815b-0ee8819a059b`,origin:`legacy`,previous_balance:`174`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:`174`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`0`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"ed575a7a-0ad8-409f-ba06-c88bbe5aa94b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:00:58.519Z`,discord_message_id:`1565868865152483329`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ed575a7a-0ad8-409f-ba06-c88bbe5aa94b`,origin:`discord`,previous_balance:`-1466.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`70.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+70\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +70 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1396.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ed5dbd8e-d152-4615-9a0e-a9a3b5c60aac":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-08-31T00:43:09.736Z`,id:`ed5dbd8e-d152-4615-9a0e-a9a3b5c60aac`,origin:`legacy`,previous_balance:`123`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`8`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`115`,status:`completed`,type:`saida`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"ed711a43-faa3-4d2c-b298-b38963a4c4aa":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T02:14:04.662Z`,discord_message_id:`1565186932466778133`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ed711a43-faa3-4d2c-b298-b38963a4c4aa`,origin:`discord`,previous_balance:`-246.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`4.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+4\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +4 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-242.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ede3f417-1e93-41e1-8a55-7c6687c20cc4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T22:31:45.293Z`,discord_message_id:`1563681432117977229`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ede3f417-1e93-41e1-8a55-7c6687c20cc4`,origin:`discord`,previous_balance:`-60.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`8.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Placa Falsa**  \`-8\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -8 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-68.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ee410ed5-b46a-4ede-8fba-caa1b6b1973d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T19:49:26.090Z`,discord_message_id:`1561828643703890061`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ee410ed5-b46a-4ede-8fba-caa1b6b1973d`,origin:`discord`,previous_balance:`2.00`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`-2\`
**Glock 19**  \`+1\`
**Munição Pistola**  \`+78\`
​
​
🧾 Detalhes da movimentação
MP5
↳ -2 removidos
Glock 19
↳ +1 adicionado
Munição Pistola
↳ +250 adicionados · -172 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`3.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ee42db82-060e-4a4a-b426-11998cc8b510":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T14:45:47.430Z`,discord_message_id:`1565729574765985875`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ee42db82-060e-4a4a-b426-11998cc8b510`,origin:`discord`,previous_balance:`10.00`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`-2\`
**Glock 19**  \`-1\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ -2 removidos
Glock 19
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`8.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ee4d5259-f355-49f1-9770-107ec86e0fa7":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T23:09:56.513Z`,id:`ee4d5259-f355-49f1-9770-107ec86e0fa7`,origin:`legacy`,previous_balance:`2`,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`1`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"ee67a71e-b4a7-4115-bde2-ccaf9ecceb00":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T02:48:39.294Z`,discord_message_id:`1565907221185822913`,discord_user_name:`Rebarba Allecrim BomBom • ID 5372`,game_player_id:`5372`,id:`ee67a71e-b4a7-4115-bde2-ccaf9ecceb00`,origin:`discord`,previous_balance:`-1295.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`1.00`,raw_log:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-1\`
**Explosivo C4**  \`-1\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -1 removido
Explosivo C4
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1296.00`,status:`completed`,type:`saida`},"ee75fb7e-8e70-41a1-afc4-ee835615b102":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:00:57.845Z`,discord_message_id:`1565868678988431453`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ee75fb7e-8e70-41a1-afc4-ee835615b102`,origin:`discord`,previous_balance:`-1561.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`165.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+165\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +165 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1396.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ee80a429-3a24-4635-8add-fcef389fd19e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T15:41:46.757Z`,discord_message_id:`1563915992449552475`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ee80a429-3a24-4635-8add-fcef389fd19e`,origin:`discord`,previous_balance:`-876.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-926.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ee82e6d5-cffb-4f8b-ab75-5135e90a51e1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T15:41:44.741Z`,discord_message_id:`1563915738417209415`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ee82e6d5-cffb-4f8b-ab75-5135e90a51e1`,origin:`discord`,previous_balance:`-135.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`15.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Algemas**  \`-15\`
**Chapa de Metal**  \`+99\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -15 removidos
Chapa de Metal
↳ +99 adicionados`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-150.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ef129605-8d62-49d1-bbfb-b886896f8574":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T22:15:00.943Z`,discord_message_id:`1559677800787480648`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`ef129605-8d62-49d1-bbfb-b886896f8574`,origin:`discord`,previous_balance:`-562.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`150.00`,raw_log:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-150\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -150 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-712.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"ef82dc5c-80cc-4650-9dfc-16b3d2cfa72a":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T00:28:32.908Z`,id:`ef82dc5c-80cc-4650-9dfc-16b3d2cfa72a`,origin:`legacy`,previous_balance:`50`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`1`,reason:`CF`,resulting_balance:`51`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"efae874b-79cc-4dcf-bc56-a6a36fee45bc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:40:49.615Z`,discord_message_id:`1561469732652064990`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`efae874b-79cc-4dcf-bc56-a6a36fee45bc`,origin:`discord`,previous_balance:`-396.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-446.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"efc3a749-08eb-4ce9-a2f5-433cf614e3c5":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T18:20:17.841Z`,discord_message_id:`1561806211312132148`,discord_user_name:`Toretto`,game_player_id:`494`,id:`efc3a749-08eb-4ce9-a2f5-433cf614e3c5`,origin:`discord`,previous_balance:`4286.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`1485.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1485\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1485 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`5771.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"efcbd3cc-55ff-4233-a717-8622d475a139":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T01:06:23.977Z`,discord_message_id:`1563720349726539897`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`efcbd3cc-55ff-4233-a717-8622d475a139`,origin:`discord`,previous_balance:`-826.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +50 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-776.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"efdabb62-d3b1-4ce5-9f8e-95bd0fa0cb13":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-26T19:14:33.916Z`,discord_message_id:`1564356583515881483`,discord_user_name:`Paquetá Stifler • ID 204`,game_player_id:`204`,id:`efdabb62-d3b1-4ce5-9f8e-95bd0fa0cb13`,origin:`discord`,previous_balance:`-1005.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`3.00`,raw_log:`
Paquetá Stifler • ID 204
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-3\`
**Silent Bypass**  \`-1\`
**Placa Falsa**  \`-1\`
**Algemas**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -3 removidos
Silent Bypass
↳ -1 removido
Placa Falsa
↳ -1 removido
Algemas
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1008.00`,status:`completed`,type:`saida`},"efdc427d-68b8-4467-b3e5-7b19c5dea203":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-09T22:26:54.861Z`,id:`efdc427d-68b8-4467-b3e5-7b19c5dea203`,origin:`legacy`,previous_balance:`165`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`65`,reason:`foi retirado e não contabilizado`,resulting_balance:`100`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"efe04f54-36f6-4b63-8b19-fa9e85b24c4c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T16:50:37.589Z`,discord_message_id:`1566857075236274327`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`efe04f54-36f6-4b63-8b19-fa9e85b24c4c`,origin:`discord`,previous_balance:`51008.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`396.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Arame**  \`+500\`
**Chapa de Metal**  \`-396\`
​
​
🧾 Detalhes da movimentação
Arame
↳ +500 adicionados
Chapa de Metal
↳ -396 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`50612.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"eff96704-3d5e-4eff-9f27-92496d720bdd":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:41:56.792Z`,discord_message_id:`1565868906697064719`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`eff96704-3d5e-4eff-9f27-92496d720bdd`,origin:`discord`,previous_balance:`-302.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`10.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-10\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-312.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f0049ba3-db52-4ca7-becd-c6b808a89437":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T17:37:09.585Z`,discord_message_id:`1561795355354341558`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f0049ba3-db52-4ca7-becd-c6b808a89437`,origin:`discord`,previous_balance:`-7733.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Submetralhadora**  \`-250\`
**Kit Médico**  \`+4\`
**Bandagem**  \`+5\`
**Hacking**  \`+1\`
**Lockpick**  \`+12\`
​
​
🧾 Detalhes da movimentação
Munição Submetralhadora
↳ -250 removidos
Kit Médico
↳ +4 adicionados
Bandagem
↳ +5 adicionados
Hacking
↳ +1 adicionado
Lockpick
↳ +12 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-7732.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f009a71a-269f-49af-b0b6-e53d91655349":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T13:55:00.110Z`,discord_message_id:`1565725714223865877`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f009a71a-269f-49af-b0b6-e53d91655349`,origin:`discord`,previous_balance:`3950.00`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,quantity:`400.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Arame**  \`+400\`
**Chapa de Metal**  \`-297\`
​
​
🧾 Detalhes da movimentação
Arame
↳ +400 adicionados
Chapa de Metal
↳ -297 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`4350.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f024cc3f-438e-4472-bd6d-f150d3f0f78c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T00:23:04.819Z`,discord_message_id:`1562984671770443877`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f024cc3f-438e-4472-bd6d-f150d3f0f78c`,origin:`discord`,previous_balance:`9.00`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1089\`
**G36C Mk2**  \`-1\`
**Munição Rifle**  \`-50\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1089 adicionados
G36C Mk2
↳ -1 removido
Munição Rifle
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`8.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f02e564b-fc7a-4cb1-baec-34ad3070171b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-20T13:00:33.525Z`,discord_message_id:`1562088134404210731`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f02e564b-fc7a-4cb1-baec-34ad3070171b`,origin:`discord`,previous_balance:`-471.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`40.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-40\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -40 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-511.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f0333272-b4a6-473f-81b6-d28ac040d6dc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T14:45:45.895Z`,discord_message_id:`1565728451242238023`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f0333272-b4a6-473f-81b6-d28ac040d6dc`,origin:`discord`,previous_balance:`40977.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`21.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`-21\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ -21 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`40956.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f039131c-dee7-46bd-8bf9-172d87d83445":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T16:18:34.015Z`,discord_message_id:`1565037067782586549`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f039131c-dee7-46bd-8bf9-172d87d83445`,origin:`discord`,previous_balance:`-21.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-22.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f03b93e3-827a-49b4-8527-b0a9ca059f2e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T19:50:18.121Z`,discord_message_id:`1567178560987336889`,discord_user_name:`Mindy Leclerc • ID 1010`,game_player_id:`1010`,id:`f03b93e3-827a-49b4-8527-b0a9ca059f2e`,origin:`discord`,previous_balance:`-83736.00`,product_id:`bc5bf239-cd25-4c14-b5ed-777f81b1e2a6`,quantity:`21896.00`,raw_log:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Dinheiro Marcado**  \`+21896\`
​
​
🧾 Detalhes da movimentação
Dinheiro Marcado
↳ +21896 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-61840.00`,status:`completed`,type:`entrada`},"f082dcfd-2d31-46d2-bc22-f09ab40e6767":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T23:44:56.820Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f082dcfd-2d31-46d2-bc22-f09ab40e6767`,origin:`discord`,previous_balance:`3.00`,product_id:`d9ad7c1f-93a7-44f5-afc0-75430299e5d9`,quantity:`3.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`6.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f08ae283-4207-4520-8dbe-ac69862de11e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:58:23.681Z`,discord_message_id:`1565729041980456972`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f08ae283-4207-4520-8dbe-ac69862de11e`,origin:`discord`,previous_balance:`-1406.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`10.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+10\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +10 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1396.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f0de8cf4-6d5d-4679-840f-acb96c77474a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T02:04:42.571Z`,discord_message_id:`1550686599136813058`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f0de8cf4-6d5d-4679-840f-acb96c77474a`,origin:`discord`,previous_balance:`103`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`16`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Barra Maciça**  \`-1\`
**Lockpick**  \`-16\`
​
​
🧾 Detalhes da movimentação
Barra Maciça
↳ -1 removido
Lockpick
↳ -16 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`87`,status:`success`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f0eb48bf-2c85-433a-8127-f28c304666cb":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T19:34:51.944Z`,discord_message_id:`1559640946671493131`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`f0eb48bf-2c85-433a-8127-f28c304666cb`,origin:`discord`,previous_balance:`0.00`,product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantity:`10.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Capuz**  \`-10\`
​
​
🧾 Detalhes da movimentação
Capuz
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-10.00`,status:`completed`,type:`saida`},"f101a57b-d8ce-4a50-a454-13ec581a885c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T03:28:12.476Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f101a57b-d8ce-4a50-a454-13ec581a885c`,origin:`discord`,previous_balance:`1.00`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f18ea24b-3459-4b75-b466-cd3f103c22e2":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:40:50.640Z`,discord_message_id:`1561471459526971515`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f18ea24b-3459-4b75-b466-cd3f103c22e2`,origin:`discord`,previous_balance:`-5425.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`+50\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +50 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-5375.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f19036ac-aa55-4574-91f5-91ad64b3c7a1":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T05:45:14.216Z`,discord_message_id:`1565187734862045185`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f19036ac-aa55-4574-91f5-91ad64b3c7a1`,origin:`discord`,previous_balance:`-28.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-29.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f1b20af8-0590-4b08-bf8d-d33d61c456f9":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T13:52:31.718Z`,discord_message_id:`1565725091222782013`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f1b20af8-0590-4b08-bf8d-d33d61c456f9`,origin:`discord`,previous_balance:`39669.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`244.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Tela LCD**  \`-100\`
**Chapa de Metal**  \`+244\`
​
​
🧾 Detalhes da movimentação
Tela LCD
↳ +50 adicionados · -150 removidos
Chapa de Metal
↳ +297 adicionados · -53 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`39913.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f1e276fa-ddad-4a53-a644-82b9cbb9e967":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-01T19:42:39.922Z`,discord_message_id:`1566537982310228199`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f1e276fa-ddad-4a53-a644-82b9cbb9e967`,origin:`discord`,previous_balance:`4962.00`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:`250.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Glock 19**  \`-1\`
**G36C Mk2**  \`+1\`
**Munição Rifle**  \`+445\`
**Hacking**  \`+23\`
**Munição Pistola**  \`-250\`
​
​
🧾 Detalhes da movimentação
Glock 19
↳ -1 removido
G36C Mk2
↳ +1 adicionado
Munição Rifle
↳ +445 adicionados
Hacking
↳ +23 adicionados
Munição Pistola
↳ -250 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`4712.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f1ed8159-53ad-444c-90ed-29dfee8e7493":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T18:46:20.839Z`,discord_message_id:`1560363215664189571`,discord_user_name:`JOAO SK`,game_player_id:`897`,id:`f1ed8159-53ad-444c-90ed-29dfee8e7493`,origin:`discord`,previous_balance:`-1116.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
joao sk ford • ID 897
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1126.00`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"f1f63165-c339-432d-aaab-52d47b9b9083":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T21:31:26.363Z`,discord_message_id:`1560767150317117581`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f1f63165-c339-432d-aaab-52d47b9b9083`,origin:`discord`,previous_balance:`-941.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`20.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+20\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +20 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-921.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f20c5a91-57a2-4c86-92ed-48010058cf7c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T10:31:37.958Z`,discord_message_id:`1567124086038077451`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f20c5a91-57a2-4c86-92ed-48010058cf7c`,origin:`discord`,previous_balance:`-15552.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`350.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-350\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -350 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-15902.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f2a00366-1440-47c7-b9a3-cfd133d9f57c":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-08-29T18:59:52.531Z`,id:`f2a00366-1440-47c7-b9a3-cfd133d9f57c`,origin:`legacy`,previous_balance:`0`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`293`,reason:`Saldo Inicial de Estoque`,resulting_balance:`293`,status:`completed`,type:`entrada`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f2aa8c8f-26e9-4bbc-9cf7-c1507a21d3b1":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-13T14:18:19.688Z`,id:`f2aa8c8f-26e9-4bbc-9cf7-c1507a21d3b1`,origin:`legacy`,previous_balance:`44`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`3`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`41`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f2c84eaa-ea68-46b5-acab-1eb1e198ec59":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T15:59:55.832Z`,discord_message_id:`1565032377753796691`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f2c84eaa-ea68-46b5-acab-1eb1e198ec59`,origin:`discord`,previous_balance:`-1379.00`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,quantity:`55.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`-1\`
**Munição Rifle**  \`-55\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ -1 removido
Munição Rifle
↳ -55 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1434.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f2f25232-ba82-4035-beeb-e8a70ee9d649":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T00:14:19.058Z`,discord_message_id:`1561469732652064990`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f2f25232-ba82-4035-beeb-e8a70ee9d649`,origin:`discord`,previous_balance:`-396.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-446.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f2f8c27d-2da0-4e6a-8cff-da1a4afff703":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T02:05:15.721Z`,discord_message_id:`1565909329142485172`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f2f8c27d-2da0-4e6a-8cff-da1a4afff703`,origin:`discord`,previous_balance:`-12962.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`15.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-15\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -15 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-12977.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f2fafda4-6615-4a66-93fa-64410abcedd4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-22T00:25:08.474Z`,discord_message_id:`1562594430731419650`,discord_user_name:`JOAO SK`,game_player_id:`897`,id:`f2fafda4-6615-4a66-93fa-64410abcedd4`,origin:`discord`,previous_balance:`-8650.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
joao sk ford • ID 897
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-10\`
**Placa Falsa**  \`-2\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ +10 adicionados · -20 removidos
Placa Falsa
↳ -2 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8660.00`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"f30f5051-322f-4599-8bba-d0311d85b585":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:25:22.654Z`,discord_message_id:`1559678460182667360`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f30f5051-322f-4599-8bba-d0311d85b585`,origin:`discord`,previous_balance:`-63.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`30.00`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-30\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -30 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-93.00`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f3122ac8-d2b6-456e-998e-1574e00a2d14":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T16:38:50.725Z`,discord_message_id:`1566854109775270050`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f3122ac8-d2b6-456e-998e-1574e00a2d14`,origin:`discord`,previous_balance:`5750.00`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Arame**  \`-50\`
**Chapa de Metal**  \`+99\`
​
​
🧾 Detalhes da movimentação
Arame
↳ -50 removidos
Chapa de Metal
↳ +99 adicionados`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`5700.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f31e0304-6d96-4423-b95e-eea70c56d3e2":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T03:24:34.019Z`,discord_message_id:`1566654223305805895`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f31e0304-6d96-4423-b95e-eea70c56d3e2`,origin:`discord`,previous_balance:`1.00`,product_id:`3267a6ef-8238-4669-9bac-bbe70f6c90d2`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Skate**  \`-1\`
**Roupa de mergulho**  \`-1\`
**Energético**  \`-11\`
**Spray Brasil**  \`-12\`
**Kit de Reparo Simples**  \`-3\`
**Algemas**  \`-1\`
**Álcool em Gel**  \`-1\`
**Bandagem**  \`-9\`
**Cesta de Ovos**  \`-1\`
​
​
🧾 Detalhes da movimentação
Skate
↳ -1 removido
Roupa de mergulho
↳ -1 removido
Energético
↳ -11 removidos
Spray Brasil
↳ -12 removidos
Kit de Reparo Simples
↳ -3 removidos
Algemas
↳ -1 removido
Álcool em Gel
↳ -1 removido
Bandagem
↳ -9 removidos
Cesta de Ovos
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`0.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f3435e73-280a-46db-8118-0a05f45d75da":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-15T19:32:08.733Z`,id:`f3435e73-280a-46db-8118-0a05f45d75da`,origin:`legacy`,previous_balance:`18`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`19`,status:`completed`,type:`entrada`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"f3553be1-b74e-4d37-8ca0-217235ff0ec4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T15:08:23.899Z`,discord_message_id:`1561395529680691363`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f3553be1-b74e-4d37-8ca0-217235ff0ec4`,origin:`discord`,previous_balance:`-1420.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`1420.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+1420\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +1420 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`0.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f35a5a0c-ebcd-4f9f-97e0-1a86a56e7270":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-12T02:51:37.903Z`,id:`f35a5a0c-ebcd-4f9f-97e0-1a86a56e7270`,origin:`legacy`,previous_balance:`23`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`2`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`21`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f366ecc2-cd0e-46e4-914f-b7ff94ad4cb3":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-28T16:16:55.955Z`,discord_message_id:`1565036656371699755`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f366ecc2-cd0e-46e4-914f-b7ff94ad4cb3`,origin:`discord`,previous_balance:`145.00`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`34.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`+34\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +34 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`179.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f369a048-9f36-448a-b281-28950577ff15":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T03:08:53.113Z`,discord_message_id:`1565563113590362243`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f369a048-9f36-448a-b281-28950577ff15`,origin:`discord`,previous_balance:`37590.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`198.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+198\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +198 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`37788.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f36db874-342b-4117-bf3f-993a4195f172":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:00:56.076Z`,discord_message_id:`1565731497606906031`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f36db874-342b-4117-bf3f-993a4195f172`,origin:`discord`,previous_balance:`3258.00`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:`426.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Pistola**  \`+426\`
​
​
🧾 Detalhes da movimentação
Munição Pistola
↳ +426 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`3684.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f3746007-cad1-43b3-86e6-6cd106627fe7":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T17:45:07.442Z`,discord_message_id:`1563915438105034833`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f3746007-cad1-43b3-86e6-6cd106627fe7`,origin:`discord`,previous_balance:`29689.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`99.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-190\`
**Algemas**  \`-15\`
**Chapa de Metal**  \`-99\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -190 removidos
Algemas
↳ -15 removidos
Chapa de Metal
↳ -99 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`29590.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f37683aa-e45c-413b-87da-fe8679b5962a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T00:01:23.828Z`,discord_message_id:`1565868630384705547`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f37683aa-e45c-413b-87da-fe8679b5962a`,origin:`discord`,previous_balance:`-1396.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`165.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-165\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -165 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1561.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f37da78a-b37e-4655-b0e1-a66faefcf220":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:59:21.714Z`,discord_message_id:`1561469732652064990`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f37da78a-b37e-4655-b0e1-a66faefcf220`,origin:`discord`,previous_balance:`-396.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-446.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f39c1756-7125-4b5f-88f3-2f560c378591":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T14:02:02.224Z`,discord_message_id:`1563915545202524172`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f39c1756-7125-4b5f-88f3-2f560c378591`,origin:`discord`,previous_balance:`-117.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`14.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+14\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +14 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-103.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f39fefdf-b9eb-4bc6-923b-f87f86a02a21":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T16:50:25.049Z`,discord_message_id:`1560334040928755807`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f39fefdf-b9eb-4bc6-923b-f87f86a02a21`,origin:`discord`,previous_balance:`-38.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`3.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+3\`
**Esmerilhadeira**  \`+8\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +3 adicionados
Esmerilhadeira
↳ +8 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-35.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f3b39914-fe09-4c98-bdca-abf4af2274c4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T03:36:53.411Z`,discord_message_id:`1565909192592859247`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f3b39914-fe09-4c98-bdca-abf4af2274c4`,origin:`discord`,previous_balance:`-13365.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`200.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Kit de Reparo Avançado**  \`+5\`
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Kit de Reparo Avançado
↳ +5 adicionados
Lockpick
↳ -200 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-13565.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f3ed7e11-9f09-452a-84b7-ded995664cf0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-26T19:14:33.916Z`,discord_message_id:`1564356583515881483`,discord_user_name:`Paquetá Stifler • ID 204`,game_player_id:`204`,id:`f3ed7e11-9f09-452a-84b7-ded995664cf0`,origin:`discord`,previous_balance:`-227.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`1.00`,raw_log:`
Paquetá Stifler • ID 204
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-3\`
**Silent Bypass**  \`-1\`
**Placa Falsa**  \`-1\`
**Algemas**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -3 removidos
Silent Bypass
↳ -1 removido
Placa Falsa
↳ -1 removido
Algemas
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-228.00`,status:`completed`,type:`saida`},"f41095b1-9216-4020-ac48-b360c6a67b17":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-21T03:46:19.133Z`,discord_message_id:`1562311042690842706`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f41095b1-9216-4020-ac48-b360c6a67b17`,origin:`discord`,previous_balance:`-59.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`13.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`±0\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +13 adicionados · -13 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-46.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f421e843-270f-4db4-bb5c-9491102ec01a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-23T21:11:58.758Z`,discord_message_id:`1552427326325657644`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f421e843-270f-4db4-bb5c-9491102ec01a`,origin:`discord`,previous_balance:`15`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantity:`4`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**FN Five Seven**  \`-4\`
**Glock 19**  \`±0\`
**Munição Pistola**  \`-250\`
**Micro Uzi**  \`+1\`
**Algemas**  \`+1\`
**Munição Submetralhadora**  \`+240\`
**Lockpick**  \`+2\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ -4 removidos
Glock 19
↳ +1 adicionado · -1 removido
Munição Pistola
↳ -250 removidos
Micro Uzi
↳ +1 adicionado
Algemas
↳ +1 adicionado
Munição Submetralhadora
↳ +240 adicionados
Lockpick
↳ +2 adicionados`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`11`,status:`success`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f4286d47-7a4c-45b9-9fa0-bc43ffa9ff2e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T11:14:48.247Z`,discord_message_id:`1561231615512944682`,discord_user_name:`Malaca`,game_player_id:`5669`,id:`f4286d47-7a4c-45b9-9fa0-bc43ffa9ff2e`,origin:`discord`,previous_balance:`0.00`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,quantity:`100.00`,raw_log:`
Malaca • ID 5669
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Arame**  \`-100\`
​
​
🧾 Detalhes da movimentação
Arame
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-100.00`,status:`completed`,type:`saida`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"f44860fb-1d53-41d3-9145-cbf15a8d6986":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T02:30:33.158Z`,id:`f44860fb-1d53-41d3-9145-cbf15a8d6986`,origin:`legacy`,previous_balance:`0`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`250`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`250`,status:`completed`,type:`entrada`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f44b9d6f-55d0-4698-8484-7d42fb171df0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-26T20:54:01.262Z`,discord_message_id:`1564381611372322897`,discord_user_name:`Paquetá Stifler • ID 204`,game_player_id:`204`,id:`f44b9d6f-55d0-4698-8484-7d42fb171df0`,origin:`discord`,previous_balance:`-6.00`,product_id:`c02ba803-5c22-43dc-9cbf-3c9c3024b136`,quantity:`1.00`,raw_log:`
Paquetá Stifler • ID 204
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-3\`
**Silent Bypass**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -3 removidos
Silent Bypass
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-7.00`,status:`completed`,type:`saida`},"f46afc27-14f3-41c4-ba6d-0ec63808156f":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-22T14:46:39.165Z`,discord_message_id:`1562839609552011486`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f46afc27-14f3-41c4-ba6d-0ec63808156f`,origin:`discord`,previous_balance:`-8660.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`90.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Lockpick**  \`-90\`
**Algemas**  \`-10\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -90 removidos
Algemas
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8750.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f486ab82-5d71-4bd5-908f-bb077f31dd97":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T00:14:21.382Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f486ab82-5d71-4bd5-908f-bb077f31dd97`,origin:`discord`,previous_balance:`-7.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`3.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-4.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f4ac6cf9-ca9e-430f-80d6-414c33f5e18a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T15:41:39.668Z`,discord_message_id:`1563915202511118357`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f4ac6cf9-ca9e-430f-80d6-414c33f5e18a`,origin:`discord`,previous_balance:`14.00`,product_id:`f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7`,quantity:`25.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Thermite**  \`+25\`
**Placa Falsa**  \`+100\`
​
​
🧾 Detalhes da movimentação
Thermite
↳ +25 adicionados
Placa Falsa
↳ +100 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`39.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f4b299ba-4e72-4137-b032-af4ddda7c317":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-22T00:15:06.361Z`,discord_message_id:`1562620274950807564`,discord_user_name:`Rebarba Allecrim BomBom • ID 5372`,game_player_id:`5372`,id:`f4b299ba-4e72-4137-b032-af4ddda7c317`,origin:`discord`,previous_balance:`-8633.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`6.00`,raw_log:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-5\`
**Lockpick**  \`-6\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -5 removidos
Lockpick
↳ -6 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8639.00`,status:`completed`,type:`saida`},"f4b3d8ba-19e1-4c62-b296-089f7246bb84":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T02:44:26.853Z`,discord_message_id:`1565556962668708021`,discord_user_name:`Medusa Toretto`,game_player_id:`6079`,id:`f4b3d8ba-19e1-4c62-b296-089f7246bb84`,origin:`discord`,previous_balance:`-22.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`3.00`,raw_log:`
Medusa Toretto • ID 6079
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`-3\`
​
​
🧾 Detalhes da movimentação
MP5
↳ -3 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-25.00`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f50356fb-5a95-4f18-ba90-31eeda1589ef":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T23:39:38.370Z`,discord_message_id:`1561886575640707145`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f50356fb-5a95-4f18-ba90-31eeda1589ef`,origin:`discord`,previous_balance:`-7746.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`29.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+29\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +29 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-7717.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f5104a32-b9f6-4a67-8df3-dd2803746af3":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T02:08:02.544Z`,discord_message_id:`1550636119115178125`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f5104a32-b9f6-4a67-8df3-dd2803746af3`,origin:`discord`,previous_balance:`-144`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`122`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`+201\`
**Metanfetamina**  \`+122\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ +201 adicionados
Metanfetamina
↳ +122 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-22`,status:`success`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f5125d16-ec1e-4a0e-9dbe-e567dcf914eb":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:39:33.906Z`,discord_message_id:`1559678004765003897`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f5125d16-ec1e-4a0e-9dbe-e567dcf914eb`,origin:`discord`,previous_balance:`-104.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`30.00`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-30\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -30 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-134.00`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f520ef26-645d-4ae1-8509-fa35eebb237c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T14:33:39.029Z`,discord_message_id:`1560433506956345375`,discord_user_name:`Alice Armani • ID 425`,game_player_id:`425`,id:`f520ef26-645d-4ae1-8509-fa35eebb237c`,origin:`discord`,previous_balance:`-1070.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`6.00`,raw_log:`
Alice Armani • ID 425
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-2\`
**Lockpick**  \`-6\`
**Explosivo C4**  \`-5\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -2 removidos
Lockpick
↳ -6 removidos
Explosivo C4
↳ -5 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1076.00`,status:`completed`,type:`saida`},"f5360b39-49b8-44ea-a501-584850610839":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T13:59:51.157Z`,discord_message_id:`1565726934267338803`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f5360b39-49b8-44ea-a501-584850610839`,origin:`discord`,previous_balance:`38976.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`495.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+495\`
**Arame**  \`-100\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +495 adicionados
Arame
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`39471.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f53bd5d9-eb05-4b6a-b8b6-f06b37887d59":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T02:04:42.085Z`,discord_message_id:`1550637104189411329`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f53bd5d9-eb05-4b6a-b8b6-f06b37887d59`,origin:`discord`,previous_balance:`0`,product_id:`142cb569-5e89-404f-a368-52302695649a`,quantity:`1`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Munição Pistola**  \`+31\`
**Colete**  \`-1\`
**Lockpick**  \`-31\`
**Explosivo C4**  \`-3\`
**Pé de Cabra**  \`-5\`
**Taco de Beisebol**  \`-1\`
​
​
🧾 Detalhes da movimentação
Munição Pistola
↳ +31 adicionados
Colete
↳ -1 removido
Lockpick
↳ -31 removidos
Explosivo C4
↳ -3 removidos
Pé de Cabra
↳ -5 removidos
Taco de Beisebol
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1`,status:`success`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f546fdb7-4f55-474a-9c06-d5fc10ada138":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T01:44:57.106Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f546fdb7-4f55-474a-9c06-d5fc10ada138`,origin:`discord`,previous_balance:`-10.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`3.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-7.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f56c5c21-863b-434e-9fb3-671696d11ffd":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:39:34.236Z`,discord_message_id:`1559678460182667360`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f56c5c21-863b-434e-9fb3-671696d11ffd`,origin:`discord`,previous_balance:`-134.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`30.00`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-30\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -30 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-164.00`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f57f33dd-efe7-4451-9e59-0970588d0294":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-08T19:54:53.537Z`,id:`f57f33dd-efe7-4451-9e59-0970588d0294`,origin:`legacy`,previous_balance:`3`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`4`,status:`completed`,type:`entrada`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"f58159df-6a3c-465c-a145-8db838f050a6":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T03:10:09.254Z`,discord_message_id:`1565563431652954197`,discord_user_name:`Medusa Toretto`,game_player_id:`6079`,id:`f58159df-6a3c-465c-a145-8db838f050a6`,origin:`discord`,previous_balance:`599.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`100.00`,raw_log:`
Medusa Toretto • ID 6079
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+1\`
**Munição Submetralhadora**  \`+100\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +1 adicionado
Munição Submetralhadora
↳ +100 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`699.00`,status:`completed`,type:`entrada`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f5a6a36e-16ee-46cc-9a33-e96a8fcef391":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T22:28:28.737Z`,discord_message_id:`1563680606532145264`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f5a6a36e-16ee-46cc-9a33-e96a8fcef391`,origin:`discord`,previous_balance:`1607.00`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:`250.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Glock 19**  \`-3\`
**G36C Mk2**  \`+1\`
**Munição Rifle**  \`+150\`
**Munição Pistola**  \`-250\`
​
​
🧾 Detalhes da movimentação
Glock 19
↳ -3 removidos
G36C Mk2
↳ +1 adicionado
Munição Rifle
↳ +150 adicionados
Munição Pistola
↳ -250 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1357.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f5c17f26-b5f2-4318-8f14-ab6e981d6a13":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-17T00:03:46.435Z`,discord_message_id:`1560805486469582970`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f5c17f26-b5f2-4318-8f14-ab6e981d6a13`,origin:`discord`,previous_balance:`-52.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`3.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`-2\`
**Munição Pistola**  \`-100\`
**Placa Falsa**  \`+3\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ -2 removidos
Munição Pistola
↳ -100 removidos
Placa Falsa
↳ +3 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-49.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f5dd4a4c-3a9b-448f-9d5f-0c1d4a9b2879":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T23:44:53.477Z`,discord_message_id:`1561415340376723478`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`f5dd4a4c-3a9b-448f-9d5f-0c1d4a9b2879`,origin:`discord`,previous_balance:`1484.00`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`1.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`+6\`
**Maconha**  \`+1\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ +6 adicionados
Maconha
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`1485.00`,status:`completed`,type:`entrada`},"f5e80fe4-bc5d-45a2-a271-be2d93827d5c":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T18:27:18.299Z`,id:`f5e80fe4-bc5d-45a2-a271-be2d93827d5c`,origin:`legacy`,previous_balance:`33`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`32`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f5eff555-fb76-4b5a-a542-d25df466a1ff":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T16:33:21.164Z`,id:`f5eff555-fb76-4b5a-a542-d25df466a1ff`,origin:`legacy`,previous_balance:`6`,product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantity:`5`,reason:`Teste de desenvolvimento`,resulting_balance:`1`,status:`completed`,type:`saida`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"f62c16b2-62d3-4b3b-bf24-514de4894194":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T04:38:24.069Z`,discord_message_id:`1566672804642947323`,discord_user_name:`Medusa Toretto`,game_player_id:`6079`,id:`f62c16b2-62d3-4b3b-bf24-514de4894194`,origin:`discord`,previous_balance:`-357.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`16.00`,raw_log:`
Medusa Toretto • ID 6079
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`±0\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +16 adicionados · -16 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-341.00`,status:`completed`,type:`entrada`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"f672c026-f431-4cb1-957c-8fa869907c53":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T01:26:27.312Z`,discord_message_id:`1566624499892228157`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f672c026-f431-4cb1-957c-8fa869907c53`,origin:`discord`,previous_balance:`4.00`,product_id:`d9ad7c1f-93a7-44f5-afc0-75430299e5d9`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+1\`
**Munição Submetralhadora**  \`+291\`
**Plano de Segurança**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +1 adicionado
Munição Submetralhadora
↳ +291 adicionados
Plano de Segurança
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`5.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f686c6f8-6604-49d1-a964-95e9a17abfc2":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T19:50:52.722Z`,discord_message_id:`1567167850911637669`,discord_user_name:`Mindy Leclerc • ID 1010`,game_player_id:`1010`,id:`f686c6f8-6604-49d1-a964-95e9a17abfc2`,origin:`discord`,previous_balance:`-878.00`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`100.00`,raw_log:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Metanfetamina**  \`-100\`
​
​
🧾 Detalhes da movimentação
Metanfetamina
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-978.00`,status:`completed`,type:`saida`},"f690b502-64b5-4a9f-ad04-33907cd56049":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T05:00:26.788Z`,discord_message_id:`1565186932466778133`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f690b502-64b5-4a9f-ad04-33907cd56049`,origin:`discord`,previous_balance:`-250.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`4.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+4\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +4 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-246.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f6973698-7bae-470f-a27a-3ae8d72f1ed7":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T02:04:42.530Z`,discord_message_id:`1550646285785104507`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f6973698-7bae-470f-a27a-3ae8d72f1ed7`,origin:`discord`,previous_balance:`0`,product_id:`e616ccac-1edb-46f6-a77b-e0471817c5ce`,quantity:`2`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Tablet**  \`-2\`
**Kit de Reparo Simples**  \`-2\`
**Galão de Combustível**  \`-1\`
**Taco de Beisebol**  \`-1\`
**Colete**  \`-1\`
​
​
🧾 Detalhes da movimentação
Tablet
↳ -2 removidos
Kit de Reparo Simples
↳ -2 removidos
Galão de Combustível
↳ -1 removido
Taco de Beisebol
↳ -1 removido
Colete
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-2`,status:`success`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f69f4a2f-ac87-47f1-8004-4eb609bc404b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T18:05:18.163Z`,discord_message_id:`1563915738417209415`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f69f4a2f-ac87-47f1-8004-4eb609bc404b`,origin:`discord`,previous_balance:`29590.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`99.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Algemas**  \`-15\`
**Chapa de Metal**  \`+99\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -15 removidos
Chapa de Metal
↳ +99 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`29689.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f6a4b863-8f99-4405-b1a7-e85e46313adc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T14:33:40.270Z`,discord_message_id:`1560606702938759270`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`f6a4b863-8f99-4405-b1a7-e85e46313adc`,origin:`discord`,previous_balance:`660.00`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`100.00`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Metanfetamina**  \`-100\`
​
​
🧾 Detalhes da movimentação
Metanfetamina
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`560.00`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f6e3c4e2-686f-4e00-b872-0d28ef33b3e0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:05.128Z`,discord_message_id:`1561523124405801086`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f6e3c4e2-686f-4e00-b872-0d28ef33b3e0`,origin:`discord`,previous_balance:`522.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`152.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+3\`
**Munição Submetralhadora**  \`+152\`
**Plano de Segurança**  \`+3\`
**Missão**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +3 adicionados
Munição Submetralhadora
↳ +152 adicionados
Plano de Segurança
↳ +3 adicionados
Missão
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`674.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f6ed042a-8359-4dfd-9038-82f5b66ccace":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-09T22:50:39.321Z`,id:`f6ed042a-8359-4dfd-9038-82f5b66ccace`,origin:`legacy`,previous_balance:`14`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`13`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f6ef1be2-2bd2-4503-97c7-dacf1a07d79e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T08:19:41.540Z`,discord_message_id:`1563030221379211335`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f6ef1be2-2bd2-4503-97c7-dacf1a07d79e`,origin:`discord`,previous_balance:`24499.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`396.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+396\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +396 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`24895.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f7269514-f7de-45df-af0b-7418ff968f76":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T23:44:53.879Z`,discord_message_id:`1561415454453670010`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`f7269514-f7de-45df-af0b-7418ff968f76`,origin:`discord`,previous_balance:`-1683.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`4.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+4\`
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +4 adicionados
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1679.00`,status:`completed`,type:`entrada`},"f7320daa-2cf6-43b4-afb6-43f5edc49c5c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T00:26:45.723Z`,discord_message_id:`1562985598141337621`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f7320daa-2cf6-43b4-afb6-43f5edc49c5c`,origin:`discord`,previous_balance:`8.00`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`-1\`
**Munição Rifle**  \`-500\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ -1 removido
Munição Rifle
↳ -500 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`7.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f7422d19-7f7a-48ed-b84c-bc21e3302b29":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:13:13.878Z`,discord_message_id:`1559641856252317882`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`f7422d19-7f7a-48ed-b84c-bc21e3302b29`,origin:`discord`,previous_balance:`-1.00`,product_id:`8d0daf4d-4312-44b7-85ad-bb9699a574c5`,quantity:`1.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Taco de Beisebol**  \`+1\`
**Bandagem**  \`+2\`
**Lockpick**  \`+9\`
​
​
🧾 Detalhes da movimentação
Taco de Beisebol
↳ +1 adicionado
Bandagem
↳ +2 adicionados
Lockpick
↳ +9 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`0.00`,status:`completed`,type:`entrada`},"f7434080-a182-45a4-bee1-c0f5cf854497":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T23:44:56.305Z`,discord_message_id:`1561502066290065510`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f7434080-a182-45a4-bee1-c0f5cf854497`,origin:`discord`,previous_balance:`0.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`6.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`+1\`
**MP5**  \`-6\`
**Munição Submetralhadora**  \`-302\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado
MP5
↳ -6 removidos
Munição Submetralhadora
↳ -302 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-6.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f74bb7ed-5dc9-4dee-9945-87126f83c5a4":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T00:28:51.253Z`,id:`f74bb7ed-5dc9-4dee-9945-87126f83c5a4`,origin:`legacy`,previous_balance:`4`,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantity:`2`,reason:`CF`,resulting_balance:`2`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f74d5be4-a689-4321-b27b-7ddba104094d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T05:29:10.403Z`,discord_message_id:`1565929831718199321`,discord_user_name:`Rebarba Allecrim BomBom • ID 5372`,game_player_id:`5372`,id:`f74d5be4-a689-4321-b27b-7ddba104094d`,origin:`discord`,previous_balance:`-81.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`1.00`,raw_log:`
Rebarba Allecrim BomBom • ID 5372
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-1\`
**Placa Falsa**  \`-1\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -1 removido
Placa Falsa
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-82.00`,status:`completed`,type:`saida`},"f7843126-d332-4d60-962e-943d12635a23":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-10T17:45:35.614Z`,id:`f7843126-d332-4d60-962e-943d12635a23`,origin:`legacy`,previous_balance:`5`,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantity:`1`,reason:`CF`,resulting_balance:`4`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f78ff6a9-71ad-46df-8abb-a70d5fc6208b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T01:17:54.063Z`,discord_message_id:`1565868678988431453`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f78ff6a9-71ad-46df-8abb-a70d5fc6208b`,origin:`discord`,previous_balance:`-1561.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`165.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+165\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +165 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1396.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f79aab47-1d18-4539-975b-e2e60e197960":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:04.573Z`,discord_message_id:`1561502066290065510`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`f79aab47-1d18-4539-975b-e2e60e197960`,origin:`discord`,previous_balance:`2.00`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`+1\`
**MP5**  \`-6\`
**Munição Submetralhadora**  \`-302\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado
MP5
↳ -6 removidos
Munição Submetralhadora
↳ -302 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`3.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"f79dab64-079f-4caa-9d59-1a9aa37f4a1e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-21T00:48:19.552Z`,discord_message_id:`1562266248958443573`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f79dab64-079f-4caa-9d59-1a9aa37f4a1e`,origin:`discord`,previous_balance:`-8578.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8588.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f7b59be3-024d-4bde-b4a4-293a70ca8028":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T20:03:16.196Z`,discord_message_id:`1561469732652064990`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f7b59be3-024d-4bde-b4a4-293a70ca8028`,origin:`discord`,previous_balance:`-396.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Explosivo C4**  \`-50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-446.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f7d137a2-6cbd-44f4-928f-f59161fb73d4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-25T17:10:54.550Z`,discord_message_id:`1563915134156410923`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f7d137a2-6cbd-44f4-928f-f59161fb73d4`,origin:`discord`,previous_balance:`-61.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`100.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Placa Falsa**  \`-100\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-161.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f7e46bb4-17f0-4c3c-bff9-4bb288250cef":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-05T20:45:42.717Z`,id:`f7e46bb4-17f0-4c3c-bff9-4bb288250cef`,origin:`legacy`,previous_balance:`373`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`323`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"f81f4d87-71f3-4a56-9b38-dd8f0514a46d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T16:28:09.725Z`,discord_message_id:`1561415603821220042`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`f81f4d87-71f3-4a56-9b38-dd8f0514a46d`,origin:`discord`,previous_balance:`1489.00`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`5.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`-5\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +40 adicionados · -45 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1484.00`,status:`completed`,type:`saida`},"f8365618-0b04-42b1-bf36-e7cfa41f6c97":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T04:25:40.593Z`,discord_message_id:`1561232107584491591`,discord_user_name:`Malaca`,game_player_id:`5669`,id:`f8365618-0b04-42b1-bf36-e7cfa41f6c97`,origin:`discord`,previous_balance:`-100.00`,product_id:`bbe4e806-d169-465b-a115-de1e0341f1e5`,quantity:`100.00`,raw_log:`
Malaca • ID 5669
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Arame**  \`+100\`
​
​
🧾 Detalhes da movimentação
Arame
↳ +100 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`0.00`,status:`completed`,type:`entrada`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"f8485e90-c8a9-4f39-bafb-f3b11323ff52":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T19:34:53.513Z`,discord_message_id:`1559642026927202305`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`f8485e90-c8a9-4f39-bafb-f3b11323ff52`,origin:`discord`,previous_balance:`-8.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`2.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Placa Falsa**  \`-5\`
**Algemas**  \`-2\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -5 removidos
Algemas
↳ -2 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-10.00`,status:`completed`,type:`saida`},"f84c79e6-0a15-412c-bc57-a54dbea8eccc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T07:46:26.432Z`,discord_message_id:`1563031595466752002`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f84c79e6-0a15-412c-bc57-a54dbea8eccc`,origin:`discord`,previous_balance:`-8792.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`10.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`-10\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-8802.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f866ba1d-c307-4c76-a0d8-ed8277f30c2a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T16:48:47.811Z`,discord_message_id:`1560333633082884218`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f866ba1d-c307-4c76-a0d8-ed8277f30c2a`,origin:`discord`,previous_balance:`-23.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Placa Falsa**  \`-50\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-73.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f879dac0-a68e-4998-9708-7f6eef76e73b":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-05T15:03:30.843Z`,id:`f879dac0-a68e-4998-9708-7f6eef76e73b`,origin:`legacy`,previous_balance:`10`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`2`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`8`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f88207b9-0295-4b0f-9b0d-87c188445f27":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T03:10:54.940Z`,discord_message_id:`1561415454453670010`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`f88207b9-0295-4b0f-9b0d-87c188445f27`,origin:`discord`,previous_balance:`-6131.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`4.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+4\`
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +4 adicionados
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-6127.00`,status:`completed`,type:`entrada`},"f8a9043b-5fee-4d65-9b4f-e7a72962b87a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T20:34:18.550Z`,discord_message_id:`1567178529395708006`,discord_user_name:`Mindy Leclerc • ID 1010`,game_player_id:`1010`,id:`f8a9043b-5fee-4d65-9b4f-e7a72962b87a`,origin:`discord`,previous_balance:`-1572.00`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`1.00`,raw_log:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`+1\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1571.00`,status:`completed`,type:`entrada`},"f8d35b8d-17b7-42c0-9c4a-4cf05ed9db8d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T16:49:44.208Z`,discord_message_id:`1560333869683834921`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f8d35b8d-17b7-42c0-9c4a-4cf05ed9db8d`,origin:`discord`,previous_balance:`-46.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`8.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`+8\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ +8 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-38.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f8ddf114-d156-4345-8e47-bf9462aead49":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T16:17:15.078Z`,discord_message_id:`1550903609296683059`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f8ddf114-d156-4345-8e47-bf9462aead49`,origin:`discord`,previous_balance:`35`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`3`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-2\`
**Lockpick**  \`-3\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -2 removidos
Lockpick
↳ -3 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`32`,status:`success`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f93b59d8-def1-4830-b75a-8e8b2fc9f11b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T21:52:37.354Z`,discord_message_id:`1561859644119457904`,discord_user_name:`Toretto`,game_player_id:`494`,id:`f93b59d8-def1-4830-b75a-8e8b2fc9f11b`,origin:`discord`,previous_balance:`500305.00`,product_id:`bc5bf239-cd25-4c14-b5ed-777f81b1e2a6`,quantity:`522000.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Dinheiro Marcado**  \`-522000\`
​
​
🧾 Detalhes da movimentação
Dinheiro Marcado
↳ -522000 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-21695.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"f93c07c3-b677-4a1d-99ba-ace7d4a52eda":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-22T00:24:56.029Z`,discord_message_id:`1562311127596015720`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f93c07c3-b677-4a1d-99ba-ace7d4a52eda`,origin:`discord`,previous_balance:`-15.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`19.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Algemas**  \`-19\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -19 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-34.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f93ee8ed-da20-4853-8d68-9d71ae336a33":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-31T01:37:26.227Z`,discord_message_id:`1565877660108722179`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f93ee8ed-da20-4853-8d68-9d71ae336a33`,origin:`discord`,previous_balance:`53.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`20.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`+20\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ +20 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`73.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f9524b34-7702-4101-bfff-842fb23fad06":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T12:52:56.940Z`,discord_message_id:`1567159648618815590`,discord_user_name:`Mindy Leclerc • ID 1010`,game_player_id:`1010`,id:`f9524b34-7702-4101-bfff-842fb23fad06`,origin:`discord`,previous_balance:`986.00`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`100.00`,raw_log:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`-100\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ -100 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`886.00`,status:`completed`,type:`saida`},"f970c0cc-8bea-4d11-92f5-e9d6f1c578f4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T03:28:13.151Z`,discord_message_id:`1561525613389418497`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`f970c0cc-8bea-4d11-92f5-e9d6f1c578f4`,origin:`discord`,previous_balance:`-12.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`2.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+304\`
**Plano de Segurança**  \`-3\`
**Missão**  \`-1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-10.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"f9be75ef-db7c-44aa-af8d-dd50311eb919":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-08-29T18:59:49.404Z`,id:`f9be75ef-db7c-44aa-af8d-dd50311eb919`,origin:`legacy`,previous_balance:`0`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`344`,reason:`Saldo Inicial de Estoque`,resulting_balance:`344`,status:`completed`,type:`entrada`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f9d14ef4-6b2a-4ba6-90a7-60a615ad7b44":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-03T18:59:54.058Z`,discord_message_id:`1567178529395708006`,discord_user_name:`Mindy Leclerc • ID 1010`,game_player_id:`1010`,id:`f9d14ef4-6b2a-4ba6-90a7-60a615ad7b44`,origin:`discord`,previous_balance:`-477.00`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`1.00`,raw_log:`
Mindy Leclerc • ID 1010
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`+1\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-476.00`,status:`completed`,type:`entrada`},"f9d9e959-fbda-4651-93e5-1bc91f8362a5":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-15T21:45:53.977Z`,id:`f9d9e959-fbda-4651-93e5-1bc91f8362a5`,origin:`legacy`,previous_balance:`171`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`111`,reason:`corrigindo estoque`,resulting_balance:`60`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fa0230d8-25bd-4f53-8da8-8e24b1ae6ac4":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T22:31:09.222Z`,discord_message_id:`1563681279923462375`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`fa0230d8-25bd-4f53-8da8-8e24b1ae6ac4`,origin:`discord`,previous_balance:`-804.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`30.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+30\`
**Lockpick**  \`+86\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +30 adicionados
Lockpick
↳ +86 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-774.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fa2a878c-30a8-49e3-876a-a12d4e813ccc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-19T19:42:46.548Z`,discord_message_id:`1550955330815525018`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`fa2a878c-30a8-49e3-876a-a12d4e813ccc`,origin:`discord`,previous_balance:`27`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`3`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-10\`
**Explosivo C4**  \`-3\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -10 removidos
Explosivo C4
↳ -3 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`24`,status:`success`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fa2bf07b-9227-4ade-abc4-a7da70d7011d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T14:25:05.867Z`,discord_message_id:`1565728719837069333`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`fa2bf07b-9227-4ade-abc4-a7da70d7011d`,origin:`discord`,previous_balance:`-1396.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`10.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-10\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +60 adicionados · -70 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-1406.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fa2e6d8a-eae8-477e-a82c-92d1c5e75f23":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T04:08:59.113Z`,discord_message_id:`1566665401624961160`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fa2e6d8a-eae8-477e-a82c-92d1c5e75f23`,origin:`discord`,previous_balance:`-84.00`,product_id:`ec788fac-98b5-4d2c-8769-0135f14dc539`,quantity:`2.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Placa Falsa**  \`-2\`
​
​
🧾 Detalhes da movimentação
Placa Falsa
↳ -2 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-86.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fa353c29-0958-408e-81af-c4e868436da2":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:13:02.410Z`,discord_message_id:`1561415603821220042`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`fa353c29-0958-408e-81af-c4e868436da2`,origin:`discord`,previous_balance:`1460.00`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:`5.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`-5\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ +40 adicionados · -45 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1455.00`,status:`completed`,type:`saida`},"fa64d85b-85db-4399-9ba2-384cebefc1bf":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-09T22:27:04.244Z`,id:`fa64d85b-85db-4399-9ba2-384cebefc1bf`,origin:`legacy`,previous_balance:`100`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`1`,reason:`pra mim`,resulting_balance:`99`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fa827f75-3e64-47a6-a5dd-b7c9d95269ac":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-16T14:33:40.952Z`,discord_message_id:`1560616478548435019`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`fa827f75-3e64-47a6-a5dd-b7c9d95269ac`,origin:`discord`,previous_balance:`-411.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`15.00`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-15\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -15 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-426.00`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fa8e1c70-a884-4e2b-a4ab-80cf3c7b2830":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-03T21:43:38.348Z`,id:`fa8e1c70-a884-4e2b-a4ab-80cf3c7b2830`,origin:`legacy`,previous_balance:`0`,product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantity:`3`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`3`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fb1e96be-f930-42c4-8365-5de78911481d":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T21:42:07.935Z`,discord_message_id:`1561857004841205924`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fb1e96be-f930-42c4-8365-5de78911481d`,origin:`discord`,previous_balance:`1336.00`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`300.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Maconha**  \`-600\`
**Cocaína**  \`-300\`
​
​
🧾 Detalhes da movimentação
Maconha
↳ -600 removidos
Cocaína
↳ -300 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1036.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fb3a0c8b-50b0-4965-a377-4c273e4a4ced":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-20T18:59:24.874Z`,discord_message_id:`1551306802275164172`,discord_user_name:`Andrew Delucca Ferreira`,game_player_id:`274`,id:`fb3a0c8b-50b0-4965-a377-4c273e4a4ced`,origin:`discord`,previous_balance:`15`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`20`,raw_log:`
Andrew Delucca Ferreira • ID 274
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+20\`
**Lockpick**  \`+50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +20 adicionados
Lockpick
↳ +50 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`35`,status:`success`,type:`entrada`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fb4afde2-17d5-49af-a3ad-86d3f76ecc1b":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-01T22:46:45.400Z`,id:`fb4afde2-17d5-49af-a3ad-86d3f76ecc1b`,origin:`legacy`,previous_balance:`205`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`15`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`190`,status:`completed`,type:`saida`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"fb4e835f-45bd-451b-9fa1-c1ee700bd82a":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T13:07:29.548Z`,discord_message_id:`1565351368867323955`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`fb4e835f-45bd-451b-9fa1-c1ee700bd82a`,origin:`discord`,previous_balance:`-247.00`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:`20.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Algemas**  \`-20\`
​
​
🧾 Detalhes da movimentação
Algemas
↳ -20 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-267.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fb603f67-2b7c-4b53-9edd-6cdc8f5a17ed":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-18T16:27:34.156Z`,discord_message_id:`1561415454453670010`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`fb603f67-2b7c-4b53-9edd-6cdc8f5a17ed`,origin:`discord`,previous_balance:`-1127.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`4.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Hacking**  \`+4\`
**Lockpick**  \`-10\`
​
​
🧾 Detalhes da movimentação
Hacking
↳ +4 adicionados
Lockpick
↳ -10 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1123.00`,status:`completed`,type:`entrada`},"fbaef3ad-aec6-40df-b2c2-3dbcd275fec0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T23:48:26.163Z`,discord_message_id:`1565512668956196995`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fbaef3ad-aec6-40df-b2c2-3dbcd275fec0`,origin:`discord`,previous_balance:`-23.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`-1\`
**Munição Submetralhadora**  \`-53\`
​
​
🧾 Detalhes da movimentação
MP5
↳ -1 removido
Munição Submetralhadora
↳ -53 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-24.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fbc0f508-b7cb-48f3-a5a3-d2ec28eb8e90":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-02T20:34:42.618Z`,id:`fbc0f508-b7cb-48f3-a5a3-d2ec28eb8e90`,origin:`legacy`,previous_balance:`0`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`6`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`6`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fbd5f584-1a5d-46d5-aef1-2f938fc8dd58":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T02:14:44.501Z`,discord_message_id:`1566636651550343289`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fbd5f584-1a5d-46d5-aef1-2f938fc8dd58`,origin:`discord`,previous_balance:`0.00`,product_id:`3267a6ef-8238-4669-9bac-bbe70f6c90d2`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Skate**  \`+1\`
**Roupa de mergulho**  \`+1\`
**Energético**  \`+21\`
**Spray Brasil**  \`+13\`
**Algemas**  \`+1\`
**Kit de Reparo Simples**  \`+3\`
**Álcool em Gel**  \`+1\`
**Bandagem**  \`+9\`
​
​
🧾 Detalhes da movimentação
Skate
↳ +1 adicionado
Roupa de mergulho
↳ +1 adicionado
Energético
↳ +21 adicionados
Spray Brasil
↳ +13 adicionados
Algemas
↳ +1 adicionado
Kit de Reparo Simples
↳ +3 adicionados
Álcool em Gel
↳ +1 adicionado
Bandagem
↳ +9 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`1.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fc39559b-57fb-44df-b5d4-3a08c448df01":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-21T21:56:18.066Z`,discord_message_id:`1562585346070544517`,discord_user_name:`Nicolas Kovarik Void • ID 8732`,game_player_id:`8732`,id:`fc39559b-57fb-44df-b5d4-3a08c448df01`,origin:`discord`,previous_balance:`-445.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`3.00`,raw_log:`
Nicolas Kovarik Void • ID 8732
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-3\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +3 adicionados · -6 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-448.00`,status:`completed`,type:`saida`},"fc48e239-f94c-4492-8f4a-32e99d231721":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-03T18:27:15.481Z`,id:`fc48e239-f94c-4492-8f4a-32e99d231721`,origin:`legacy`,previous_balance:`7`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantity:`6`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`1`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fc5373de-a699-49d1-a732-b78b0eb7f1fe":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T01:26:27.312Z`,discord_message_id:`1566624499892228157`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fc5373de-a699-49d1-a732-b78b0eb7f1fe`,origin:`discord`,previous_balance:`-9.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`1.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+1\`
**Munição Submetralhadora**  \`+291\`
**Plano de Segurança**  \`+1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +1 adicionado
Munição Submetralhadora
↳ +291 adicionados
Plano de Segurança
↳ +1 adicionado`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-8.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fc75d6f0-f2b2-4086-9e66-e0908907cb7b":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T19:34:50.320Z`,discord_message_id:`1559621150311579720`,discord_user_name:`zeca`,game_player_id:`8393`,id:`fc75d6f0-f2b2-4086-9e66-e0908907cb7b`,origin:`discord`,previous_balance:`347.00`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:`132.00`,raw_log:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`-67\`
**Metanfetamina**  \`-132\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ -67 removidos
Metanfetamina
↳ -132 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`215.00`,status:`completed`,type:`saida`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"fccbbd58-7ccb-492f-81cf-67708078fff9":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-24T04:11:54.227Z`,discord_message_id:`1563334961841315933`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`fccbbd58-7ccb-492f-81cf-67708078fff9`,origin:`discord`,previous_balance:`12.00`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantity:`1.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**FN Five Seven**  \`+1\`
**Munição Pistola**  \`+58\`
​
​
🧾 Detalhes da movimentação
FN Five Seven
↳ +1 adicionado
Munição Pistola
↳ +58 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`13.00`,status:`completed`,type:`entrada`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fcf84bc2-fc72-4bcf-a2e6-bac86ae2558e":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-23T08:19:40.504Z`,discord_message_id:`1563007965156614255`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fcf84bc2-fc72-4bcf-a2e6-bac86ae2558e`,origin:`discord`,previous_balance:`-583.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`40.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-40\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -40 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-623.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fd0d48c0-75e9-4fc5-90ff-53b193f8a94c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-09T22:18:57.301Z`,id:`fd0d48c0-75e9-4fc5-90ff-53b193f8a94c`,origin:`legacy`,previous_balance:`11`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantity:`3`,reason:`foi retirado e não contabilizado`,resulting_balance:`8`,status:`completed`,type:`saida`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"fd61fbb0-3e55-455c-81b8-6b0d34cd34c8":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T03:41:35.617Z`,discord_message_id:`1560135526537764895`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`fd61fbb0-3e55-455c-81b8-6b0d34cd34c8`,origin:`discord`,previous_balance:`-96.00`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Submetralhadora**  \`-50\`
​
​
🧾 Detalhes da movimentação
Munição Submetralhadora
↳ -50 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-146.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fd626d1f-3aec-4f60-85c6-844e05f9bd80":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T13:52:31.718Z`,discord_message_id:`1565725091222782013`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`fd626d1f-3aec-4f60-85c6-844e05f9bd80`,origin:`discord`,previous_balance:`819.00`,product_id:`477b2f1d-fcae-4dbb-85ca-6df1303543a8`,quantity:`100.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Tela LCD**  \`-100\`
**Chapa de Metal**  \`+244\`
​
​
🧾 Detalhes da movimentação
Tela LCD
↳ +50 adicionados · -150 removidos
Chapa de Metal
↳ +297 adicionados · -53 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`719.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fd7d73b7-562a-4ea7-9997-a03eb51228ef":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-11T18:05:34.826Z`,id:`fd7d73b7-562a-4ea7-9997-a03eb51228ef`,origin:`legacy`,previous_balance:`27`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`4`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`23`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fd921b03-83d0-4462-b160-720a3e16a596":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-15T17:01:32.683Z`,discord_message_id:`1560336829495120065`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`fd921b03-83d0-4462-b160-720a3e16a596`,origin:`discord`,previous_balance:`-4.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`6.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`+6\`
**Taco de Beisebol**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ +6 adicionados
Taco de Beisebol
↳ -1 removido`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"fd96435f-ccbc-4143-bce9-4d34c0bb2fc0":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-23T20:53:50.204Z`,discord_message_id:`1552422760779878491`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fd96435f-ccbc-4143-bce9-4d34c0bb2fc0`,origin:`discord`,previous_balance:`-119`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`22`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-22\`
**Explosivo C4**  \`-5\`
**Chip Ilegal**  \`-3\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -22 removidos
Explosivo C4
↳ -5 removidos
Chip Ilegal
↳ -3 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-141`,status:`success`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fdc3b6df-333c-4fdb-91a0-81b8fbf94e5c":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:13:11.733Z`,discord_message_id:`1559629413010768035`,discord_user_name:`zeca`,game_player_id:`8393`,id:`fdc3b6df-333c-4fdb-91a0-81b8fbf94e5c`,origin:`discord`,previous_balance:`68.00`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:`2.00`,raw_log:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Cocaína**  \`+2\`
**Metanfetamina**  \`+74\`
​
​
🧾 Detalhes da movimentação
Cocaína
↳ +2 adicionados
Metanfetamina
↳ +74 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`70.00`,status:`completed`,type:`entrada`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"fdd9f7a1-ec3f-407f-9c15-11c29a82ce76":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-08T19:54:54.563Z`,id:`fdd9f7a1-ec3f-407f-9c15-11c29a82ce76`,origin:`legacy`,previous_balance:`373`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:`50`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`423`,status:`completed`,type:`entrada`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"fde06e72-ef41-49bc-8c85-d52f99148bbc":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-09-09T16:49:07.271Z`,id:`fde06e72-ef41-49bc-8c85-d52f99148bbc`,origin:`legacy`,previous_balance:`87`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`22`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`65`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"fdf1799b-30cd-49bf-a702-ae63a9cc2d23":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-29T05:00:29.687Z`,discord_message_id:`1565213465553936457`,discord_user_name:`zeca`,game_player_id:`8393`,id:`fdf1799b-30cd-49bf-a702-ae63a9cc2d23`,origin:`discord`,previous_balance:`-25.00`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:`1.00`,raw_log:`
ZECA SLIM • ID 8393
📦 Baú
​
📊 Saldo líquido
**Chip Ilegal**  \`-1\`
​
​
🧾 Detalhes da movimentação
Chip Ilegal
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-26.00`,status:`completed`,type:`saida`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"fdf980cd-a780-44a5-99a0-af5c5de3d554":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T19:34:52.978Z`,discord_message_id:`1559641856252317882`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`fdf980cd-a780-44a5-99a0-af5c5de3d554`,origin:`discord`,previous_balance:`-2.00`,product_id:`8d0daf4d-4312-44b7-85ad-bb9699a574c5`,quantity:`1.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Taco de Beisebol**  \`+1\`
**Bandagem**  \`+2\`
**Lockpick**  \`+9\`
​
​
🧾 Detalhes da movimentação
Taco de Beisebol
↳ +1 adicionado
Bandagem
↳ +2 adicionados
Lockpick
↳ +9 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-1.00`,status:`completed`,type:`entrada`},"fe32cb19-0b70-482b-9c96-bffa161d1164":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-13T21:13:12.473Z`,discord_message_id:`1559636023040942213`,discord_user_name:`Cherryl Strauus • ID 10398`,game_player_id:`10398`,id:`fe32cb19-0b70-482b-9c96-bffa161d1164`,origin:`discord`,previous_balance:`-159.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`5.00`,raw_log:`
Cherryl Strauus • ID 10398
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`-3\`
**Lockpick**  \`-5\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ -3 removidos
Lockpick
↳ -5 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-164.00`,status:`completed`,type:`saida`},"febf7d61-fc56-41ba-9044-31e90c8c8b39":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T01:44:56.574Z`,discord_message_id:`1561502066290065510`,discord_user_name:`lennon dacoro`,game_player_id:`655`,id:`febf7d61-fc56-41ba-9044-31e90c8c8b39`,origin:`discord`,previous_balance:`-4.00`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:`6.00`,raw_log:`
lennon will dacoro • ID 655
📦 Mesa de Trabalho
​
📊 Saldo líquido
**G36C Mk2**  \`+1\`
**MP5**  \`-6\`
**Munição Submetralhadora**  \`-302\`
​
​
🧾 Detalhes da movimentação
G36C Mk2
↳ +1 adicionado
MP5
↳ -6 removidos
Munição Submetralhadora
↳ -302 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-10.00`,status:`completed`,type:`saida`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"fef90e75-1777-4f69-82ab-e6e7c6153460":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T22:14:30.450Z`,discord_message_id:`1566938582512570369`,discord_user_name:`Toretto`,game_player_id:`494`,id:`fef90e75-1777-4f69-82ab-e6e7c6153460`,origin:`discord`,previous_balance:`-14952.00`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:`200.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Baú
​
📊 Saldo líquido
**Lockpick**  \`-200\`
​
​
🧾 Detalhes da movimentação
Lockpick
↳ -200 removidos`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`-15152.00`,status:`completed`,type:`saida`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ff275f5c-283f-4a31-8285-eded2eeafab2":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T02:59:22.126Z`,discord_message_id:`1561469784745312389`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ff275f5c-283f-4a31-8285-eded2eeafab2`,origin:`discord`,previous_balance:`-446.00`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:`50.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Baú
​
📊 Saldo líquido
**Explosivo C4**  \`+50\`
​
​
🧾 Detalhes da movimentação
Explosivo C4
↳ +50 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`-396.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ff2c165b-6dd6-45db-924f-182111904a76":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-04T17:10:37.510Z`,id:`ff2c165b-6dd6-45db-924f-182111904a76`,origin:`legacy`,previous_balance:`105`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`10`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`95`,status:`completed`,type:`saida`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"ff4b17b3-05a8-466c-a821-af32ace24001":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-30T22:58:25.253Z`,discord_message_id:`1565731497606906031`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ff4b17b3-05a8-466c-a821-af32ace24001`,origin:`discord`,previous_balance:`2406.00`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:`426.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Munição Pistola**  \`+426\`
​
​
🧾 Detalhes da movimentação
Munição Pistola
↳ +426 adicionados`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`2832.00`,status:`completed`,type:`entrada`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ff57aa7b-ff6f-46f8-a3bb-fde53a5fdbc7":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-08-29T18:59:55.643Z`,id:`ff57aa7b-ff6f-46f8-a3bb-fde53a5fdbc7`,origin:`legacy`,previous_balance:`0`,product_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,quantity:`1`,reason:`Saldo Inicial de Estoque`,resulting_balance:`1`,status:`completed`,type:`entrada`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"ff6e5472-56e0-4537-b7d2-755b2ab98dee":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-10-19T01:00:00.781Z`,discord_message_id:`1561525613389418497`,discord_user_name:`Macaé Dacoro`,game_player_id:`590`,id:`ff6e5472-56e0-4537-b7d2-755b2ab98dee`,origin:`discord`,previous_balance:`2.00`,product_id:`dc58cd24-e100-4494-a97b-c1337d701cae`,quantity:`1.00`,raw_log:`
Macaé Dacoro • ID 590
📦 Mesa de Trabalho
​
📊 Saldo líquido
**MP5**  \`+2\`
**Munição Submetralhadora**  \`+304\`
**Plano de Segurança**  \`-3\`
**Missão**  \`-1\`
​
​
🧾 Detalhes da movimentação
MP5
↳ +2 adicionados
Munição Submetralhadora
↳ +304 adicionados
Plano de Segurança
↳ -3 removidos
Missão
↳ -1 removido`,reason:`Sincronizado via Discord Logs (saida)`,resulting_balance:`1.00`,status:`completed`,type:`saida`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"ffdb5287-2d9e-45f2-bf48-35376abede81":{bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,created_at:`2026-11-02T03:22:12.872Z`,discord_message_id:`1566653630839267440`,discord_user_name:`Toretto`,game_player_id:`494`,id:`ffdb5287-2d9e-45f2-bf48-35376abede81`,origin:`discord`,previous_balance:`47239.00`,product_id:`e1f38312-9061-466b-8ea7-b3c3729e839c`,quantity:`540.00`,raw_log:`
Metthews Toretto Ortega • ID 494
📦 Mesa de Trabalho
​
📊 Saldo líquido
**Chapa de Metal**  \`+540\`
​
​
🧾 Detalhes da movimentação
Chapa de Metal
↳ +2367 adicionados · -1827 removidos`,reason:`Sincronizado via Discord Logs (entrada)`,resulting_balance:`47779.00`,status:`completed`,type:`entrada`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"ffec9073-d32d-4b16-b770-6a7c59a82392":{bau_id:`efa1d61c-958a-47f7-8b48-48b91b6b2f0a`,created_at:`2026-09-16T23:23:33.232Z`,id:`ffec9073-d32d-4b16-b770-6a7c59a82392`,origin:`legacy`,previous_balance:`200`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:`5`,reason:`Movimentação Operacional de Estoque`,resulting_balance:`195`,status:`completed`,type:`saida`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`}},stream_integration_logs:{"70a68d90-9a56-43ca-8564-546c50b43e6a":{created_at:`2026-09-19T03:06:17.450Z`,details:{channel_url:`https://twitch.tv/malaca7x`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},event_type:`poll`,id:`70a68d90-9a56-43ca-8564-546c50b43e6a`,message:`Membro vinculou conta Twitch: malaca7x`,platform:`twitch`,status:`info`,streamer_name:`Malaca`},"952b65cb-4c97-4a50-80aa-34fe7516c1f5":{created_at:`2026-09-19T03:05:51.535Z`,details:{channel_url:`https://kick.com/malaca7x`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},event_type:`poll`,id:`952b65cb-4c97-4a50-80aa-34fe7516c1f5`,message:`Membro vinculou conta Kick: malaca7x`,platform:`kick`,status:`info`,streamer_name:`Malaca`},"b2b53d06-6319-45c2-91da-b7588cd18925":{created_at:`2026-09-19T03:03:52.024Z`,details:{channel_url:`https://tiktok.com/@malaca7x/live`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},event_type:`poll`,id:`b2b53d06-6319-45c2-91da-b7588cd18925`,message:`Membro vinculou conta TikTok: @malaca7x`,platform:`tiktok`,status:`info`,streamer_name:`Malaca`},"cb8a9f07-a5fb-43de-b666-5e4594f6d406":{created_at:`2026-09-18T18:48:10.187Z`,details:{category:`Grand Theft Auto V`,channel_name:`twinwheels_rp`,external_stream_id:`sim_1789757285719`,is_live:!0,last_checked_at:`2026-09-18T18:48:05.719Z`,notification_sent:!0,notified_at:`2026-09-18T18:48:05.719Z`,peak_viewers:21,platform:`youtube`,started_at:`2026-09-18T18:48:05.719Z`,stream_url:`https://youtube.tv/twinwheels_rp`,streamer_avatar:`https://i.ibb.co/ymH1BQPQ/Uma124.png`,streamer_name:`Dev Streamer Twin Wheels`,thumbnail_url:`https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60`,title:`🔴 [TESTE DEV] Patrulha Especial e Operação Twin Wheels RP`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,viewer_count:55},event_type:`simulated_live`,id:`cb8a9f07-a5fb-43de-b666-5e4594f6d406`,message:`Simulação de live disparada com sucesso pelo Painel Dev: "🔴 [TESTE DEV] Patrulha Especial e Operação Twin Wheels RP"`,platform:`youtube`,status:`success`,streamer_name:`Dev Streamer Twin Wheels`},"e736a8e5-5e27-40f9-9564-a3df70770ed7":{created_at:`2026-09-19T03:03:31.000Z`,details:{channel_url:`https://youtube.com/@xmalaca7x`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},event_type:`poll`,id:`e736a8e5-5e27-40f9-9564-a3df70770ed7`,message:`Membro vinculou conta YouTube: @xmalaca7x`,platform:`youtube`,status:`info`,streamer_name:`Malaca`}},stream_sessions:{"da462033-056d-46be-b899-8abd2e459846":{category:`Grand Theft Auto V`,channel_name:`twinwheels_rp`,created_at:`2026-09-18T18:48:09.622Z`,ended_at:`2026-09-18T19:02:35.777Z`,external_stream_id:`sim_1789757285719`,id:`da462033-056d-46be-b899-8abd2e459846`,is_live:!1,last_checked_at:`2026-09-18T18:48:05.719Z`,notification_sent:!0,notified_at:`2026-09-18T18:48:05.719Z`,peak_viewers:21,platform:`youtube`,started_at:`2026-09-18T18:48:05.719Z`,stream_url:`https://youtube.tv/twinwheels_rp`,streamer_avatar:`https://i.ibb.co/ymH1BQPQ/Uma124.png`,streamer_name:`Dev Streamer Twin Wheels`,thumbnail_url:`https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60`,title:`🔴 [TESTE DEV] Patrulha Especial e Operação Twin Wheels RP`,updated_at:`2026-09-18T19:02:35.777Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,viewer_count:55}},stream_system_config:[null,{discord_announcements_channel_id:`1549945217908736092`,discord_announcements_enabled:!0,global_polling_interval_seconds:60,id:1,notify_in_app:!0,platforms:{kick:{enabled:!0,pollingIntervalSeconds:60},tiktok:{enabled:!0,pollingIntervalSeconds:120},twitch:{clientId:``,clientSecret:``,enabled:!0,pollingIntervalSeconds:60},youtube:{apiKey:``,enabled:!0,pollingIntervalSeconds:120}},updated_at:`2026-09-17T00:59:16.533Z`,updated_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`}],system_bot_control:{action:`request_heartbeat`,timestamp:1793250304975},system_bot_heartbeat:{botId:`1536184283197079622`,botTag:`Twin Wheels#8065`,guildCount:2,guilds:[{icon:`4f4beed324c9ccfa04b3a748cfba1449`,iconUrl:`https://cdn.discordapp.com/icons/1535505650308620400/4f4beed324c9ccfa04b3a748cfba1449.webp?size=128`,id:`1535505650308620400`,isMain:!0,memberCount:30,name:`Twin Wheels`},{icon:`a_25287fd598b117fdebd41b7f779a304b`,iconUrl:`https://cdn.discordapp.com/icons/1537229296697999462/a_25287fd598b117fdebd41b7f779a304b.gif?size=128`,id:`1537229296697999462`,isMain:!1,memberCount:10,name:`malaca developers`}],memberCount:25,memoryMb:26,pingMs:24,status:`online`,timestamp:`2026-11-03T21:06:04.578Z`,uptimeSeconds:1929},system_coins_config:{exchange_enabled:!0,exchange_fee_percent:0,min_xp_exchange:1,updated_at:`2026-10-13T19:27:19.280Z`,xp_per_coin:1},system_realtime_events:{broadcasts:{"system-discord-bot-control":{event:`request_heartbeat`,originId:`tw_cli_1793250303837_33ikem5`,payload:{timestamp:1793250305179},timestamp:1793250305179,type:`broadcast`},"system-discord-config-sync":{event:`discord_config_updated`,originId:`tw_cli_1793247072198_zdq7mtb`,payload:{botActivityType:`Custom`,botAvatarUrl:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/bot/avatar_1789618051056_twin_wheell_pro.png`,botBannerUrl:`https://eptcwuzfnarrvextneuu.supabase.co/storage/v1/object/public/products/bot/bot_banner_1793247728423_chatgpt_image_9_de_ago._de_2026_22_38_40_pro.png`,botName:`Twin Wheels`,botRoles:[{color:`#5865f2`,id:`1`,name:`『 🤖 』 Bots`},{color:`#f2f3f5`,id:`2`,name:`TW | Bot`}],botStatus:`online`,botStatusText:`by malaca`,botStreamingUrl:``,botToken:``,clientId:`1536184283197079622`,discloudApiToken:``,discloudAppId:`twin`,embedColors:{announcements:`#EAB308`,cashFund:`#F59E0B`,errors:`#EF4444`,goals:`#EC4899`,logins:`#10B981`,members:`#8B5CF6`,movements:`#0284C7`,roles:`#6366F1`,sales:`#10B981`,system:`#06B6D4`},enabled:!1,enabledEvents:{announcements:!0,cashFund:!0,forcePurge:!0,goals:!0,logins:!0,members:!0,pageViews:!1,roles:!0,sales:!0,stockMovements:!0,systemErrors:!0},footerIconUrl:`https://i.ibb.co/ymH1BQPQ/Uma124.png`,footerText:`Twin Wheels RP • Sistema Integrado de Logs`,guildId:`1537229296697999462`,guildName:`TW | Logs`,intentGuildMembers:`always`,intentMessageContent:`always`,intentPresences:`always`,isBotRunning:!0,logChannels:{announcementsChannelId:``,cashFundChannelId:``,generalLogsChannelId:`1538375505953165312`,goalsChannelId:``,membersChannelId:``,salesChannelId:``,stockMovementsChannelId:``,systemChannelId:``},serverIconUrl:``},timestamp:1793247843470,type:`broadcast`},"system-discord-webhooks-sync":{event:`webhooks_updated`,originId:`tw_cli_1793519712463_ogg3aa0`,payload:{antiSpam:{autoDeleteChannelSpam:!1,blockDiscordInvites:!0,blockIpLoggers:!1,blockPhishingLinks:!0,blockTelegramLinks:!0,channelRateLimitEnabled:!0,customBlockedDomains:[`t.me`,`telegram.me`,`telegram.dog`,`grabify.link`,`iplogger`,`2no.co`,`yip.su`,`discord-nitro`,`free-nitro`],customBlockedDomainsEnabled:!0,customBlockedPhrases:[`to use this bot, you must join`,`programming & development tools`,`resources • services everything you need`,`a-tools x`,`a_toolsx`,`free nitro`,`steam gift card`,`crypto airdrop`,`claim free nitro`,`airdrop token`],customBlockedPhrasesEnabled:!0,duplicateProtectionEnabled:!1,duplicateWindowSeconds:45,enabled:!0,ipRateLimitEnabled:!0,maxMessagesPerMinutePerChannel:20,maxRequestsPerMinutePerIp:25,notifyOnSpamBlocked:!1,rateLimitEnabled:!1,stats:{totalBlocked:0}},defaultAvatarUrl:`https://i.ibb.co/ymH1BQPQ/Uma124.png`,defaultFooterText:`Twin Wheels RP • Canal de Mensagens`,defaultGuildId:`1535505650308620400`,defaultUsername:`Twin Wheels RP`,enabled:!0,updatedAt:`2026-11-01T07:56:09.125Z`,webhooks:[{avatarUrl:`https://efwqhqevfxlschyhbiao.supabase.co/storage/v1/object/public/products/webhooks/avatar_1789809892274_twin_wheell.png`,channelId:`1535637509818548234`,createdAt:`2026-09-12T21:30:48.283Z`,defaultDescription:`by malaca`,defaultTitle:`💻 Teste Desenvolvedor`,description:`Logs de Baú QG`,embedColor:`#008FFD`,enabled:!0,footerText:`Twin Wheels • Logs de Baú QG`,guildId:`1535505650308620400`,id:`webhook_1789248648283`,lastStatus:`success`,lastTriggeredAt:`2026-09-12T21:35:09.223Z`,mentionRoles:`@everyone`,name:`TW | Logs de Baú QG`,showTimestamp:!0,thumbnailUrl:`https://adgdivossyzpwofouhrh.supabase.co/storage/v1/object/public/products/webhooks/avatar_1789248796551_twin_wheell.png`,updatedAt:`2026-09-19T09:25:05.350Z`,useCodeblockField:!0,username:`Twin Wheels`,webhookUrl:`https://discord.com/api/webhooks/1548409284000485420/AoRhvOaaA-yNUdWHcV-TZUNx4gOLxWFddthfe3kfHKpycQ2SmyaUsQiSNTnagelHzlsR`}]},timestamp:1793519769330,type:`broadcast`},"system-force-cache-purge-channel":{event:`force_cache_purge`,originId:`tw_cli_1793738485846_arcsa9u`,payload:{reason:`Atualização de melhorias e limpeza de cache`,requested_by_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,requested_by_name:`Malaca`,timestamp:1793738493805},timestamp:1793738494453,type:`broadcast`},"system-platform-settings":{event:`platform_settings_updated`,originId:`tw_cli_1793429154351_lp4aiyk`,payload:{settings:{allowMovementsWithoutBau:!1,autoOfflineMinutes:20,borderGlowSpeed:`normal`,brightness:100,cardStyle:`glassmorphism`,cityRpName:`Cidade Alta RP`,cityRpTag:`CDA`,contactEmail:``,contrast:100,defaultNewRole:`Novato / Recruta`,description:`Sistema interno de gestão da facção Twin Wheels. Controle de estoque, vendas, membros, cargos, desempenho e muito mais.`,factionCode:``,factionDiscordUrl:``,factionName:`Twin Wheels`,factionTag:`TW`,factionType:``,fivemConnectUrl:`connect cpx.rp`,fontFamily:`space_grotesk`,footerCopyrightText:`Todos os direitos reservados.`,footerCustomNote:``,footerDeveloperDiscord:`malaca7x`,footerDeveloperName:`malaca`,footerDeveloperRole:`Desenvolvido por`,footerDividerSymbol:`•`,footerFactionText:`Twin Wheels`,footerShowDeveloperCredits:!0,footerShowDiscordCopy:!0,footerShowSupportLink:!0,footerShowVersion:!0,footerShowYear:!0,footerYear:`Automático`,glowEffectsEnabled:!0,headquartersLocation:`Perto do Píer · Setor Sul`,heartbeatSeconds:15,hideOldAnnouncementsDays:7,hoverZoomEnabled:!0,idleTimeoutSeconds:600,instagramHandle:``,maintenanceActive:!1,maintenanceAllowDevAccess:!0,maintenanceDurationMinutes:1439,maintenanceEstimatedEnd:`2026-10-22T23:50:00.000Z`,maintenanceHistory:[{authorName:`Malaca`,durationMinutes:906,endedAt:`2026-10-22T14:56:35.891Z`,id:`maint_1792680995891`,message:`Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes.`,severity:`destructive`,startedAt:`2026-10-21T23:50:51.379Z`,title:`Manutenção Preventiva de Sistema`}],maintenanceMessage:`Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes.`,maintenanceSeverity:`destructive`,maintenanceStartedAt:`2026-10-21T23:50:51.379Z`,maintenanceTargetType:`all`,maintenanceTitle:`Manutenção Preventiva de Sistema`,minCityTime:`50 horas de voo`,minRecruitAge:`16 anos`,motd:`Bora bater as metas da semana e manter o estoque abastecido!`,motto:`Velocidade, lealdade e precisão em cada curva.`,notificationToastPosition:`top-right`,notifyPendingSignups:!0,onlineAlertEnabled:!1,operatingHours:`18:00h às 02:00h`,pageTransitionsEnabled:!0,platformBannerUrl:``,platformFaviconUrl:``,platformLogoUrl:``,radioFrequency:`2W MHz`,recruitmentFormUrl:``,rulesSummary:`Respeito mútuo, lealdade à facção, prestação de contas dos baús e discrição total em ações externas.`,showAnnouncementBanner:!0,showConsolidatedCashToOperators:!1,showSystemStatusNotice:!1,slogan:`Gestão Interna`,soundEffectsEnabled:!1,soundVolume:60,startPageCeo:`/ceo/dashboard`,startPageDev:`/dev/configuracao/plataforma/comunicados`,startPageUser:`/dashboard`,statusPulseEnabled:!0,supportDiscordUrl:``,systemStatusNotice:``,systemStatusType:`destructive`,systemVersion:`v2.5.0`,themeStyle:`cyberpunk`,tiktokHandle:``,weeklyGoalFarm:`100 insumos`,weeklyGoalHours:`10h semanais`,welcomeMessage:`Bem-vindo à Twin Wheels! Leia as regras e procure um líder para sua integração.`}},timestamp:1793431639106,type:`broadcast`},tw_absences_realtime_sync:{event:`absences_sync`,originId:`tw_cli_1793422164010_oyaok9l`,payload:{timestamp:1793422339470},timestamp:1793422339470,type:`broadcast`},tw_notifications_realtime_sync:{event:`notification_broadcast`,originId:`tw_cli_1793424020742_nen1dod`,payload:{category:`success`,created_at:`2026-10-31T05:24:03.249Z`,id:`notif_1793424243249_bnxfq`,is_active:!0,link:`/tickets/tkt_1793423855184_lnuyt`,message:`Seu chamado "Teste ticket" foi finalizado por Malaca. Motivo: "Chamado concluído e resolvido pela gerência."`,sender_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,sender_name:`Malaca`,title:`Chamado #005 finalizado`,type:`ticket`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},timestamp:1793424243742,type:`broadcast`},tw_permissions_realtime_sync:{event:`permissions_changed`,originId:`tw_cli_1793738496839_guelbcw`,payload:{candidateIds:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,`8f78c340-bcb0-452b-80ee-fd49ee7ce471`,`917826984778797087`],timestamp:1793738521357,type:`ceo_config`},timestamp:1793738521789,type:`broadcast`},tw_tickets_realtime_sync:{event:`tickets_sync`,originId:`tw_cli_1793735932827_fyqb7vs`,payload:{timestamp:1793736187800},timestamp:1793736187800,type:`broadcast`}},latest:{candidateIds:[`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,`8f78c340-bcb0-452b-80ee-fd49ee7ce471`,`917826984778797087`],timestamp:1793738521357,type:`ceo_config`}},system_stock_sync_pulse:{author_name:`Rebarba Allecrim BomBom • ID 5372`,bau_id:`074aa6aa-a481-4cf6-bb8c-8e9044b2b687`,bau_name:`BAÚ QG`,channel_id:`1535637509818548234`,items_count:1,message_id:`1567228863677726742`,timestamp:1793738059454},tw_coins_config:{exchange_enabled:!0,exchange_fee_percent:0,min_xp_exchange:1,updated_at:`2026-10-13T19:27:19.280Z`,xp_per_coin:1},user_presence:{"00000000-0000-0000-0000-000000000000":{last_seen:`2026-09-15T19:27:58.552Z`,online_since:`2026-09-15T19:27:58.552Z`,status:`online`,total_seconds_online:`30`,updated_at:`2026-09-15T19:27:58.552Z`,user_id:`00000000-0000-0000-0000-000000000000`},"23bb2cb3-4bc8-48e9-b38e-78d50874083f":{last_seen:`2026-09-11T16:56:01.727Z`,online_since:`2026-09-11T16:55:37.381Z`,status:`offline`,total_seconds_online:`62790`,updated_at:`2026-09-11T16:56:01.727Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"2a974403-195b-4a1c-8c80-85afc1e77391":{last_seen:`2026-09-21T22:39:46.061Z`,online_since:`2026-09-21T22:29:30.649Z`,status:`online`,total_seconds_online:`2700`,updated_at:`2026-09-21T22:39:46.061Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"3820da50-73d2-4d03-a467-efcbe4a8bfdf":{last_seen:`2026-08-31T13:48:02.460Z`,online_since:`2026-08-31T13:42:30.510Z`,status:`offline`,total_seconds_online:`5130`,updated_at:`2026-08-31T13:48:02.460Z`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"3c062f9c-cb7a-4a8b-8d78-0fe5693098a5":{last_seen:`2026-09-13T20:01:02.218Z`,online_since:`2026-09-13T18:47:03.687Z`,status:`offline`,total_seconds_online:`152970`,updated_at:`2026-09-13T20:01:02.218Z`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"4c7381e6-6d54-44af-bc7f-0daecdbad782":{last_seen:`2026-08-27T22:59:58.657Z`,status:`offline`,total_seconds_online:`4125`,updated_at:`2026-09-14T22:37:00.628Z`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},"5eb49e12-e1ea-4180-9206-29105b3f1ea6":{last_seen:`2026-09-22T15:36:35.442Z`,online_since:`2026-09-22T15:26:34.935Z`,status:`online`,total_seconds_online:`72540`,updated_at:`2026-09-22T15:36:35.442Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"6e2f5d10-d684-4caf-8c1e-636b9d1a84d6":{last_seen:`2026-09-21T20:53:19.636Z`,online_since:`2026-09-21T20:53:19.636Z`,status:`online`,total_seconds_online:`341730`,updated_at:`2026-09-21T20:53:19.636Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"aaf63496-1cee-4e65-92ff-66c411ba1920":{last_seen:`2026-09-01T01:34:44.268Z`,online_since:`2026-09-01T01:34:43.315Z`,status:`offline`,total_seconds_online:`930`,updated_at:`2026-09-01T01:34:44.268Z`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},"c5ef6dc6-e126-4027-80c3-319f0a870315":{last_seen:`2026-09-22T14:32:16.410Z`,online_since:`2026-09-22T14:32:01.656Z`,status:`online`,total_seconds_online:`270525`,updated_at:`2026-09-22T14:32:16.410Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"ce2aa0d1-43a9-44ab-b5fa-8021589b28d2":{last_seen:`2026-09-20T22:49:47.492Z`,status:`offline`,total_seconds_online:`46530`,updated_at:`2026-09-20T22:49:47.492Z`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"d8261681-8469-4643-bca0-5fc154b3a25b":{last_seen:`2026-09-19T19:15:22.603Z`,status:`offline`,total_seconds_online:`412740`,updated_at:`2026-09-19T19:15:22.603Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"e804c543-4e0a-4c45-9930-4450739d3b36":{last_seen:`2026-08-30T18:50:15.689Z`,online_since:`2026-08-30T18:42:35.952Z`,status:`offline`,total_seconds_online:`10950`,updated_at:`2026-08-30T18:50:15.689Z`,user_id:`e804c543-4e0a-4c45-9930-4450739d3b36`},"f970371a-246e-4109-8a08-d197a41f0906":{last_seen:`2026-09-12T07:44:47.738Z`,online_since:`2026-09-12T07:44:46.172Z`,status:`offline`,total_seconds_online:`67395`,updated_at:`2026-09-12T07:44:47.738Z`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`}},user_roles:{"02cc1ce1-0bc5-4959-8671-f2f07bca420d":{created_at:`2026-08-27T02:48:27.602Z`,id:`02cc1ce1-0bc5-4959-8671-f2f07bca420d`,nivel:`membro`,updated_at:`2026-08-27T02:48:32.536Z`,user_id:`4c7381e6-6d54-44af-bc7f-0daecdbad782`},"15e24664-d026-47cc-81c7-7f18620ea5e3":{created_at:`2026-08-22T12:08:13.455Z`,id:`15e24664-d026-47cc-81c7-7f18620ea5e3`,nivel:`gerente`,updated_at:`2026-08-28T18:03:49.313Z`,user_id:`f970371a-246e-4109-8a08-d197a41f0906`},"4cf64f84-6516-4a56-b85f-3660206bd9e0":{created_at:`2026-08-20T15:40:19.043Z`,id:`4cf64f84-6516-4a56-b85f-3660206bd9e0`,nivel:`01`,updated_at:`2026-08-20T15:50:11.539Z`,user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},"5b0e3de0-7b23-443c-8267-0664b2c58de4":{created_at:`2026-08-28T16:16:29.172Z`,id:`5b0e3de0-7b23-443c-8267-0664b2c58de4`,nivel:`gerente`,updated_at:`2026-09-11T14:42:01.636Z`,user_id:`5eb49e12-e1ea-4180-9206-29105b3f1ea6`},"5fe3509a-2ab1-42ef-a2ff-b5eaa44c7d63":{created_at:`2026-09-15T19:27:58.066Z`,id:`5fe3509a-2ab1-42ef-a2ff-b5eaa44c7d63`,nivel:`membro`,updated_at:`2026-09-15T19:27:58.066Z`,user_id:`00000000-0000-0000-0000-000000000000`},"73ef7a59-6f51-4b61-9cc6-afea8c51b231":{created_at:`2026-08-24T03:32:43.045Z`,id:`73ef7a59-6f51-4b61-9cc6-afea8c51b231`,nivel:`membro`,updated_at:`2026-08-24T03:32:49.112Z`,user_id:`ce2aa0d1-43a9-44ab-b5fa-8021589b28d2`},"8b59659f-efd8-4ddf-b651-7c47cd18e439":{created_at:`2026-08-29T12:57:55.998Z`,id:`8b59659f-efd8-4ddf-b651-7c47cd18e439`,nivel:`gerente`,updated_at:`2026-09-11T14:41:56.990Z`,user_id:`3c062f9c-cb7a-4a8b-8d78-0fe5693098a5`},"9148cee4-0333-404e-b12f-368e8276df3e":{created_at:`2026-08-29T21:51:30.646Z`,id:`9148cee4-0333-404e-b12f-368e8276df3e`,nivel:`novato`,updated_at:`2026-08-29T21:51:30.646Z`,user_id:`e804c543-4e0a-4c45-9930-4450739d3b36`},"957c4e42-0d66-4bcc-bb12-a2e7b07228dc":{created_at:`2026-08-27T02:45:57.095Z`,id:`957c4e42-0d66-4bcc-bb12-a2e7b07228dc`,nivel:`membro`,updated_at:`2026-08-27T02:46:03.372Z`,user_id:`3820da50-73d2-4d03-a467-efcbe4a8bfdf`},"972811fb-04e4-4d34-b3dd-21c6c8e5766e":{created_at:`2026-09-01T00:50:43.883Z`,id:`972811fb-04e4-4d34-b3dd-21c6c8e5766e`,nivel:`motoqueiro`,updated_at:`2026-09-01T00:51:53.874Z`,user_id:`aaf63496-1cee-4e65-92ff-66c411ba1920`},"abc0b82d-c801-44a8-ab1d-c18203fec018":{created_at:`2026-08-21T00:51:35.355Z`,id:`abc0b82d-c801-44a8-ab1d-c18203fec018`,nivel:`02`,updated_at:`2026-09-04T13:56:23.514Z`,user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},"bfbe5870-a8e9-4743-86fa-c6716706778a":{created_at:`2026-08-19T21:34:07.685Z`,id:`bfbe5870-a8e9-4743-86fa-c6716706778a`,nivel:`membro`,updated_at:`2026-10-23T07:37:43.270Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"c2767457-f047-46e1-95d1-60c3351d8271":{created_at:`2026-08-20T20:36:59.700Z`,id:`c2767457-f047-46e1-95d1-60c3351d8271`,nivel:`gerente`,updated_at:`2026-08-20T20:37:04.708Z`,user_id:`2a974403-195b-4a1c-8c80-85afc1e77391`},"c53614c2-5651-42a8-a785-0cf29c87f3ef":{created_at:`2026-08-21T01:22:08.271Z`,id:`c53614c2-5651-42a8-a785-0cf29c87f3ef`,nivel:`motoqueiro`,updated_at:`2026-10-31T00:44:21.140Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"c5ef6dc6-e126-4027-80c3-319f0a870315":{nivel:`motoqueiro`,updated_at:`2026-10-31T00:44:21.335Z`}},verification_audit_logs:{audit_1792378374906_030lw:{action:`selo_removido`,created_at:`2026-10-19T02:52:53.316Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792378374906_030lw`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792378377483_c2rza1:{action:`revoke`,created_at:`2026-10-19T02:52:53.314Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792378377483_c2rza1`,performed_by:`ceo`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792378518800_s2mal:{action:`selo_concedido_direto`,created_at:`2026-10-19T02:55:16.934Z`,details:{custom_title:`Verificado`},id:`audit_1792378518800_s2mal`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792378520755_g4pnje:{action:`grant_direct`,created_at:`2026-10-19T02:55:16.934Z`,details:{custom_title:`Verificado`},id:`audit_1792378520755_g4pnje`,performed_by:`ceo`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792383413962_471wm:{action:`solicitacao_criada`,created_at:`2026-10-19T04:16:53.485Z`,details:{reason:`Testee`,request_id:`5641f807-6472-4552-b167-a06a21232b70`},id:`audit_1792383413962_471wm`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383436598_qhzqf:{action:`solicitacao_aprovada`,created_at:`2026-10-19T04:17:13.960Z`,details:{custom_title:`Verificado Oficial`,request_id:`5641f807-6472-4552-b167-a06a21232b70`},id:`audit_1792383436598_qhzqf`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383438932_clxm3m:{action:`approve_request`,created_at:`2026-10-19T04:17:13.959Z`,details:{custom_title:`Verificado Oficial`,request_id:`5641f807-6472-4552-b167-a06a21232b70`},id:`audit_1792383438932_clxm3m`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383523470_0ps9b:{action:`selo_removido`,created_at:`2026-10-19T04:18:41.778Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792383523470_0ps9b`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383525780_31i0p3:{action:`revoke`,created_at:`2026-10-19T04:18:41.777Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792383525780_31i0p3`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383538118_d9vwl:{action:`solicitacao_criada`,created_at:`2026-10-19T04:18:57.655Z`,details:{reason:`Aaaaaaa`,request_id:`d8aff1e5-ecaa-4e34-b48a-c75f8ee19d71`},id:`audit_1792383538118_d9vwl`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383548795_um8fy:{action:`solicitacao_cancelada`,created_at:`2026-10-19T04:19:07.811Z`,details:{request_id:`d8aff1e5-ecaa-4e34-b48a-c75f8ee19d71`},id:`audit_1792383548795_um8fy`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383565941_9p9qk:{action:`selo_concedido_direto`,created_at:`2026-10-19T04:19:24.066Z`,details:{custom_title:`Verificado`},id:`audit_1792383565941_9p9qk`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792383568042_n82bpt:{action:`grant_direct`,created_at:`2026-10-19T04:19:24.065Z`,details:{custom_title:`Verificado`},id:`audit_1792383568042_n82bpt`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792766867921_qlwj6:{action:`selo_removido`,created_at:`2026-10-23T14:47:39.060Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792766867921_qlwj6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792766869676_yo4dcg:{action:`revoke`,created_at:`2026-10-23T14:47:39.059Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792766869676_yo4dcg`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792766888388_291qq:{action:`solicitacao_criada`,created_at:`2026-10-23T14:48:08.004Z`,details:{reason:`Aaaaaaa`,request_id:`3052d795-3101-4167-8bfa-e4278e808150`},id:`audit_1792766888388_291qq`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792766920917_tx45q:{action:`solicitacao_aprovada`,created_at:`2026-10-23T14:48:39.190Z`,details:{custom_title:`Verificado Oficial`,request_id:`3052d795-3101-4167-8bfa-e4278e808150`},id:`audit_1792766920917_tx45q`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792766923235_g48cdh:{action:`approve_request`,created_at:`2026-10-23T14:48:39.190Z`,details:{custom_title:`Verificado Oficial`,request_id:`3052d795-3101-4167-8bfa-e4278e808150`},id:`audit_1792766923235_g48cdh`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792802640446_canz0:{action:`selo_removido`,created_at:`2026-10-24T00:43:59.483Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792802640446_canz0`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792802642153_z5ccds:{action:`revoke`,created_at:`2026-10-24T00:43:59.483Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792802642153_z5ccds`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792802650420_f5ggv:{action:`selo_removido`,created_at:`2026-10-24T00:44:09.509Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792802650420_f5ggv`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792802652112_blqb9b:{action:`revoke`,created_at:`2026-10-24T00:44:09.509Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792802652112_blqb9b`,performed_by:`ceo`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792805276463_ihh3y:{action:`solicitacao_criada`,created_at:`2026-10-24T01:27:56.087Z`,details:{reason:`aaaaaaaaaaa`,request_id:`d6a0dce8-d5f8-4148-b214-53cb85d70162`},id:`audit_1792805276463_ihh3y`,performed_by:`c5ef6dc6-e126-4027-80c3-319f0a870315`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792805290637_aal0l:{action:`solicitacao_aprovada`,created_at:`2026-10-24T01:28:09.146Z`,details:{custom_title:`Verificado Oficial`,request_id:`d6a0dce8-d5f8-4148-b214-53cb85d70162`},id:`audit_1792805290637_aal0l`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792805292773_42k2md:{action:`approve_request`,created_at:`2026-10-24T01:28:09.146Z`,details:{custom_title:`Verificado Oficial`,request_id:`d6a0dce8-d5f8-4148-b214-53cb85d70162`},id:`audit_1792805292773_42k2md`,performed_by:`ceo`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},audit_1792807346947_d9cnj:{action:`solicitacao_criada`,created_at:`2026-10-24T02:02:26.579Z`,details:{reason:`bbbbbbbbbbb`,request_id:`29761fb2-2445-4cde-86bf-7c41e7283ebe`},id:`audit_1792807346947_d9cnj`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792807373151_gm3om:{action:`solicitacao_rejeitada`,created_at:`2026-10-24T02:02:52.579Z`,details:{custom_title:`Verificado Oficial`,notes:`aaaaaaa`,request_id:`29761fb2-2445-4cde-86bf-7c41e7283ebe`},id:`audit_1792807373151_gm3om`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792807375272_i1wxm0:{action:`reject_request`,created_at:`2026-10-24T02:02:52.579Z`,details:{custom_title:`Verificado Oficial`,notes:`aaaaaaa`,request_id:`29761fb2-2445-4cde-86bf-7c41e7283ebe`},id:`audit_1792807375272_i1wxm0`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792807422033_ja0f5:{action:`solicitacao_criada`,created_at:`2026-10-24T02:03:41.663Z`,details:{reason:`aaaaaaaaaaaaa`,request_id:`b9231cd3-ffda-4f4e-b03a-516f0579cb01`},id:`audit_1792807422033_ja0f5`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792807428698_j2nmo:{action:`solicitacao_aprovada`,created_at:`2026-10-24T02:03:47.188Z`,details:{custom_title:`Verificado Oficial`,request_id:`b9231cd3-ffda-4f4e-b03a-516f0579cb01`},id:`audit_1792807428698_j2nmo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792807430771_cb18k2:{action:`approve_request`,created_at:`2026-10-24T02:03:47.188Z`,details:{custom_title:`Verificado Oficial`,request_id:`b9231cd3-ffda-4f4e-b03a-516f0579cb01`},id:`audit_1792807430771_cb18k2`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792952126484_296ns:{action:`selo_removido`,created_at:`2026-10-25T18:15:25.475Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792952126484_296ns`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792952127999_7a9l3i:{action:`revoke`,created_at:`2026-10-25T18:15:25.475Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1792952127999_7a9l3i`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792952163807_eg1l6:{action:`solicitacao_criada`,created_at:`2026-10-25T18:16:03.410Z`,details:{reason:`Bbbbbb`,request_id:`42478392-b2f8-425f-b4c6-c055e8a6f143`},id:`audit_1792952163807_eg1l6`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792952216115_0gx0o:{action:`solicitacao_aprovada`,created_at:`2026-10-25T18:16:54.544Z`,details:{custom_title:`Verificado Oficial`,request_id:`42478392-b2f8-425f-b4c6-c055e8a6f143`},id:`audit_1792952216115_0gx0o`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1792952218035_rd1g59:{action:`approve_request`,created_at:`2026-10-25T18:16:54.543Z`,details:{custom_title:`Verificado Oficial`,request_id:`42478392-b2f8-425f-b4c6-c055e8a6f143`},id:`audit_1792952218035_rd1g59`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1793423299718_lvg2r:{action:`selo_concedido_direto`,created_at:`2026-10-31T05:08:18.381Z`,details:{custom_title:`Verificado`},id:`audit_1793423299718_lvg2r`,target_user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},audit_1793423301436_e82jc7:{action:`grant_direct`,created_at:`2026-10-31T05:08:18.380Z`,details:{custom_title:`Verificado`},id:`audit_1793423301436_e82jc7`,performed_by:`ceo`,target_user_id:`d8261681-8469-4643-bca0-5fc154b3a25b`},audit_1793423320446_1wgvi:{action:`selo_concedido_direto`,created_at:`2026-10-31T05:08:39.155Z`,details:{custom_title:`Verificado`},id:`audit_1793423320446_1wgvi`,target_user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},audit_1793423321957_bxyvsv:{action:`grant_direct`,created_at:`2026-10-31T05:08:39.154Z`,details:{custom_title:`Verificado`},id:`audit_1793423321957_bxyvsv`,performed_by:`ceo`,target_user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},audit_1793736927611_bt13f:{action:`selo_removido`,created_at:`2026-11-03T20:15:26.583Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1793736927611_bt13f`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1793736929240_o2clm1:{action:`revoke`,created_at:`2026-11-03T20:15:26.583Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1793736929240_o2clm1`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1793736944699_8bro5:{action:`selo_removido`,created_at:`2026-11-03T20:15:43.702Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1793736944699_8bro5`,target_user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},audit_1793736946287_osgm36:{action:`revoke`,created_at:`2026-11-03T20:15:43.702Z`,details:{reason:`Selo revogado pela administração.`},id:`audit_1793736946287_osgm36`,performed_by:`ceo`,target_user_id:`23bb2cb3-4bc8-48e9-b38e-78d50874083f`},audit_1793737964228_nsffr:{action:`solicitacao_criada`,created_at:`2026-11-03T20:32:43.820Z`,details:{reason:`aaaaaa`,request_id:`174749fd-7152-44e8-9a2a-fde985b48f2e`},id:`audit_1793737964228_nsffr`,performed_by:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1793737970951_w1pdn:{action:`solicitacao_aprovada`,created_at:`2026-11-03T20:32:49.342Z`,details:{custom_title:`Verificado Oficial`,request_id:`174749fd-7152-44e8-9a2a-fde985b48f2e`},id:`audit_1793737970951_w1pdn`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},audit_1793737973006_dhimza:{action:`approve_request`,created_at:`2026-11-03T20:32:49.342Z`,details:{request_id:`174749fd-7152-44e8-9a2a-fde985b48f2e`},id:`audit_1793737973006_dhimza`,performed_by:`ceo`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`}},verification_badge_config:{default:{allow_self_request:!0,authorized_roles:[`ceo`,`desenvolvedor`,`01`,`02`,`gerente`],badge_color:`#38bdf8`,badge_description:`Selo oficial de membro verificado e autenticado pela liderança.`,badge_icon:`BadgeCheck`,badge_name:`Twin Wheels Verificado`,glow_style:`cyan`,id:`default`,requirements_config:{custom_instructions:`Preencha a justificativa detalhada para análise da liderança.`,min_days_in_faction:0,min_gamification_level:0,require_discord:!0,require_game_id:!0,require_phone:!1},tooltip_text:`Membro Verificado`,updated_at:`2026-11-03T20:33:36.625Z`}},verification_requests:{"174749fd-7152-44e8-9a2a-fde985b48f2e":{created_at:`2026-11-03T20:32:43.820Z`,id:`174749fd-7152-44e8-9a2a-fde985b48f2e`,reason:`aaaaaa`,reviewed_at:`2026-11-03T20:32:49.342Z`,reviewed_by:`ceo`,status:`aprovado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-11-03T20:32:49.342Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"23bb2cb3-4bc8-48e9-b38e-78d50874083f":{status:`revogado`,updated_at:`2026-11-03T20:15:43.702Z`},"29761fb2-2445-4cde-86bf-7c41e7283ebe":{created_at:`2026-10-24T02:02:26.579Z`,id:`29761fb2-2445-4cde-86bf-7c41e7283ebe`,reason:`bbbbbbbbbbb`,review_notes:`aaaaaaa`,reviewed_at:`2026-10-24T02:02:52.579Z`,reviewed_by:`ceo`,status:`rejeitado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-10-24T02:02:52.579Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"3052d795-3101-4167-8bfa-e4278e808150":{created_at:`2026-10-23T14:48:08.004Z`,id:`3052d795-3101-4167-8bfa-e4278e808150`,reason:`Aaaaaaa`,reviewed_at:`2026-10-23T14:48:39.190Z`,reviewed_by:`ceo`,status:`aprovado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-10-23T14:48:39.190Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"42478392-b2f8-425f-b4c6-c055e8a6f143":{created_at:`2026-10-25T18:16:03.410Z`,id:`42478392-b2f8-425f-b4c6-c055e8a6f143`,reason:`Bbbbbb`,reviewed_at:`2026-10-25T18:16:54.543Z`,reviewed_by:`ceo`,status:`aprovado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-10-25T18:16:54.543Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"5641f807-6472-4552-b167-a06a21232b70":{created_at:`2026-10-19T04:16:53.485Z`,id:`5641f807-6472-4552-b167-a06a21232b70`,reason:`Testee`,reviewed_at:`2026-10-19T04:17:13.959Z`,reviewed_by:`ceo`,status:`aprovado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-10-19T04:17:13.959Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"6e2f5d10-d684-4caf-8c1e-636b9d1a84d6":{status:`revogado`,updated_at:`2026-11-03T20:15:26.583Z`},"b9231cd3-ffda-4f4e-b03a-516f0579cb01":{created_at:`2026-10-24T02:03:41.663Z`,id:`b9231cd3-ffda-4f4e-b03a-516f0579cb01`,reason:`aaaaaaaaaaaaa`,reviewed_at:`2026-10-24T02:03:47.188Z`,reviewed_by:`ceo`,status:`aprovado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-10-24T02:03:47.188Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"c5ef6dc6-e126-4027-80c3-319f0a870315":{status:`revogado`,updated_at:`2026-10-24T00:44:09.509Z`},"d6a0dce8-d5f8-4148-b214-53cb85d70162":{created_at:`2026-10-24T01:27:56.087Z`,id:`d6a0dce8-d5f8-4148-b214-53cb85d70162`,reason:`aaaaaaaaaaa`,reviewed_at:`2026-10-24T01:28:09.146Z`,reviewed_by:`ceo`,status:`aprovado`,target_user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`,updated_at:`2026-10-24T01:28:09.146Z`,user_id:`c5ef6dc6-e126-4027-80c3-319f0a870315`},"d8aff1e5-ecaa-4e34-b48a-c75f8ee19d71":{created_at:`2026-10-19T04:18:57.655Z`,id:`d8aff1e5-ecaa-4e34-b48a-c75f8ee19d71`,reason:`Aaaaaaa`,status:`cancelado`,target_user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`,updated_at:`2026-10-19T04:19:09.242Z`,user_id:`6e2f5d10-d684-4caf-8c1e-636b9d1a84d6`},"f1520ede-d6b9-435b-a375-ee0219b43631":{created_at:`2026-10-19T01:22:26.302Z`,id:`f1520ede-d6b9-435b-a375-ee0219b43631`,reason:`Tenho Todos Requisitos Oficiais para Verificação`,requested_title:`Membro Verificado`,status:`pending`,updated_at:`2026-10-19T01:22:26.302Z`}},warehouse_stock:{"136e0eb4-48b6-41df-b7e6-29bff020b1f4":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_136e0eb4-48b6-41df-b7e6-29bff020b1f4`,product_id:`136e0eb4-48b6-41df-b7e6-29bff020b1f4`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"142cb569-5e89-404f-a368-52302695649a":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_142cb569-5e89-404f-a368-52302695649a`,product_id:`142cb569-5e89-404f-a368-52302695649a`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"14cec745-48a3-4d9c-82eb-6ce1c0b927ff":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,product_id:`14cec745-48a3-4d9c-82eb-6ce1c0b927ff`,quantity:104,updated_at:`2026-10-13T19:27:19.281Z`},"1b75731b-da5e-4c39-bda2-ca850ced85a2":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_1b75731b-da5e-4c39-bda2-ca850ced85a2`,product_id:`1b75731b-da5e-4c39-bda2-ca850ced85a2`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"400900a7-dd2c-4291-bcc2-27aa807133cf":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_400900a7-dd2c-4291-bcc2-27aa807133cf`,product_id:`400900a7-dd2c-4291-bcc2-27aa807133cf`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"47fe8ea7-2f12-458a-8f3b-eb85cd87a37e":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,product_id:`47fe8ea7-2f12-458a-8f3b-eb85cd87a37e`,quantity:5,updated_at:`2026-10-13T19:27:19.281Z`},"48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,product_id:`48fc9e17-e0f1-4c7d-bf8c-2700c4106c3e`,quantity:4,updated_at:`2026-10-13T19:27:19.281Z`},"4cdef5ea-d501-4e9d-aa35-a62b16b54546":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_4cdef5ea-d501-4e9d-aa35-a62b16b54546`,product_id:`4cdef5ea-d501-4e9d-aa35-a62b16b54546`,quantity:10,updated_at:`2026-10-13T19:27:19.281Z`},"4e683441-0730-489a-ba27-bd2903709bf5":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_4e683441-0730-489a-ba27-bd2903709bf5`,product_id:`4e683441-0730-489a-ba27-bd2903709bf5`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"4fa7961f-b4c7-495a-bfc3-c8819ee7b218":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,product_id:`4fa7961f-b4c7-495a-bfc3-c8819ee7b218`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"50ca904d-24ed-4dda-a0aa-352d28dac501":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_50ca904d-24ed-4dda-a0aa-352d28dac501`,product_id:`50ca904d-24ed-4dda-a0aa-352d28dac501`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"50e818d1-07c8-43e6-8b0e-da97a240007a":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_50e818d1-07c8-43e6-8b0e-da97a240007a`,product_id:`50e818d1-07c8-43e6-8b0e-da97a240007a`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"6db947d4-c77f-4f3f-877e-a24b7a941f72":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_6db947d4-c77f-4f3f-877e-a24b7a941f72`,product_id:`6db947d4-c77f-4f3f-877e-a24b7a941f72`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"78bbf10a-c4ee-4410-b736-2505c8fbedea":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_78bbf10a-c4ee-4410-b736-2505c8fbedea`,product_id:`78bbf10a-c4ee-4410-b736-2505c8fbedea`,quantity:270,updated_at:`2026-10-13T19:27:19.281Z`},"7b02d693-4d8b-4422-ba10-303ffa51114d":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_7b02d693-4d8b-4422-ba10-303ffa51114d`,product_id:`7b02d693-4d8b-4422-ba10-303ffa51114d`,quantity:5,updated_at:`2026-10-13T19:27:19.281Z`},"7b5e2260-81d9-450f-b5a4-736e68526e96":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_7b5e2260-81d9-450f-b5a4-736e68526e96`,product_id:`7b5e2260-81d9-450f-b5a4-736e68526e96`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"7c27ff76-2758-4ce0-82ad-2ffff36cc603":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_7c27ff76-2758-4ce0-82ad-2ffff36cc603`,product_id:`7c27ff76-2758-4ce0-82ad-2ffff36cc603`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"82f15c69-b575-43cb-9abe-0fbd2a223fc3":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_82f15c69-b575-43cb-9abe-0fbd2a223fc3`,product_id:`82f15c69-b575-43cb-9abe-0fbd2a223fc3`,quantity:10,updated_at:`2026-10-13T19:27:19.281Z`},"8d0daf4d-4312-44b7-85ad-bb9699a574c5":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_8d0daf4d-4312-44b7-85ad-bb9699a574c5`,product_id:`8d0daf4d-4312-44b7-85ad-bb9699a574c5`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"92c73e60-a6a7-46cd-b397-1e12d165ae48":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_92c73e60-a6a7-46cd-b397-1e12d165ae48`,product_id:`92c73e60-a6a7-46cd-b397-1e12d165ae48`,quantity:647,updated_at:`2026-10-13T19:27:19.281Z`},"9548eee0-3083-489b-b57f-7d5a2b5358eb":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_9548eee0-3083-489b-b57f-7d5a2b5358eb`,product_id:`9548eee0-3083-489b-b57f-7d5a2b5358eb`,quantity:10,updated_at:`2026-10-13T19:27:19.281Z`},"a45fba52-7769-4533-b4b1-581e228d21f0":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_a45fba52-7769-4533-b4b1-581e228d21f0`,product_id:`a45fba52-7769-4533-b4b1-581e228d21f0`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"b3b621ad-3849-4796-9349-76538ea50413":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_b3b621ad-3849-4796-9349-76538ea50413`,product_id:`b3b621ad-3849-4796-9349-76538ea50413`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"b626f466-ef86-408d-9f46-d3460030d8f9":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_b626f466-ef86-408d-9f46-d3460030d8f9`,product_id:`b626f466-ef86-408d-9f46-d3460030d8f9`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"bc1a1b1d-bf46-434c-9b50-532153eac358":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_bc1a1b1d-bf46-434c-9b50-532153eac358`,product_id:`bc1a1b1d-bf46-434c-9b50-532153eac358`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"c02ba803-5c22-43dc-9cbf-3c9c3024b136":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_c02ba803-5c22-43dc-9cbf-3c9c3024b136`,product_id:`c02ba803-5c22-43dc-9cbf-3c9c3024b136`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"c2907fa5-47cc-460a-b3ab-b3e0bbf81185":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,product_id:`c2907fa5-47cc-460a-b3ab-b3e0bbf81185`,quantity:16,updated_at:`2026-10-13T19:27:19.281Z`},"c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,product_id:`c3a3ea01-9ad7-4d92-8e2b-0fa83f30490f`,quantity:299,updated_at:`2026-10-13T19:27:19.281Z`},"c422f268-e769-4512-9a54-364dea648720":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_c422f268-e769-4512-9a54-364dea648720`,product_id:`c422f268-e769-4512-9a54-364dea648720`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"c51b7c2b-f376-4426-82fe-d82eb8c265cc":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_c51b7c2b-f376-4426-82fe-d82eb8c265cc`,product_id:`c51b7c2b-f376-4426-82fe-d82eb8c265cc`,quantity:37,updated_at:`2026-10-13T19:27:19.281Z`},"c7430b4e-bd97-4f85-83ce-702492fe1d80":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_c7430b4e-bd97-4f85-83ce-702492fe1d80`,product_id:`c7430b4e-bd97-4f85-83ce-702492fe1d80`,quantity:1,updated_at:`2026-10-13T19:27:19.281Z`},"cff66aa8-ae22-4dd5-bc6b-fcf912b147ea":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,product_id:`cff66aa8-ae22-4dd5-bc6b-fcf912b147ea`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"db625331-3858-4923-8a33-c9a4eaa1c449":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_db625331-3858-4923-8a33-c9a4eaa1c449`,product_id:`db625331-3858-4923-8a33-c9a4eaa1c449`,quantity:2,updated_at:`2026-10-13T19:27:19.281Z`},"e10817fd-7798-4604-b4e2-4249dfe9273d":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_e10817fd-7798-4604-b4e2-4249dfe9273d`,product_id:`e10817fd-7798-4604-b4e2-4249dfe9273d`,quantity:1016,updated_at:`2026-10-13T19:27:19.281Z`},"e616ccac-1edb-46f6-a77b-e0471817c5ce":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_e616ccac-1edb-46f6-a77b-e0471817c5ce`,product_id:`e616ccac-1edb-46f6-a77b-e0471817c5ce`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"e93a1f12-8ebd-489e-83d6-65fd1a856501":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_e93a1f12-8ebd-489e-83d6-65fd1a856501`,product_id:`e93a1f12-8ebd-489e-83d6-65fd1a856501`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`},"f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7":{created_at:`2026-10-13T19:27:19.281Z`,id:`ws_f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7`,product_id:`f6fa9f9c-4ec5-466c-8b9d-d893fe1fcfe7`,quantity:0,updated_at:`2026-10-13T19:27:19.281Z`}},weekly_goals:{goal_default_1788481127067:{created_at:`2026-09-04T00:18:47.067Z`,created_by:`d8261681-8469-4643-bca0-5fc154b3a25b`,created_by_name:`01 LC (Andrew Delucca Ferreira)`,description:`Meta semanal operacional de liderança criada pelo 01 LC para arrecadação da família.`,id:`goal_default_1788481127067`,is_active:!1,period_end:`2026-09-07`,period_start:`2026-09-01`,scope:`todos`,target_role:`membro`,target_value:5e4,title:`Meta Semanal Operacional - 01 LC`,type:`financeiro`,unit_name:`R$`,updated_at:`2026-10-14T08:18:51.133Z`}},xp_rules_config:{daily_presence:{action_type:`daily_presence`,category:`presence`,cooldown_seconds:86400,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:10,description:`Bônus diário de atividade na plataforma com heartbeat auditado.`,enabled:!0,name:`Presença Ativa Diária`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.5},goal_milestone:{action_type:`goal_milestone`,category:`performance`,cooldown_seconds:3600,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:50,description:`Conquista de meta do grupo estabelecida pela diretoria.`,enabled:!0,name:`Meta Operacional Atingida`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.9},peer_eval_given:{action_type:`peer_eval_given`,category:`evaluation`,cooldown_seconds:1800,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:15,description:`Exercício de liderança e auditoria ao avaliar um colega.`,enabled:!0,name:`Avaliação de Membro Realizada`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.25},peer_eval_received:{action_type:`peer_eval_received`,category:`evaluation`,cooldown_seconds:3600,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:30,description:`Reconhecimento por excelência operacional recebido de gerente/admin.`,enabled:!0,name:`Destaque em Avaliação (4 ou 5 Estrelas)`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.6},post_published:{action_type:`post_published`,category:`social`,cooldown_seconds:1800,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:10,description:`Compartilhamento de informe ou registro de operação no mural.`,enabled:!0,name:`Publicação Oficial no Feed`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.25},production_completed:{action_type:`production_completed`,category:`production`,cooldown_seconds:300,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:30,description:`Produção em escala de itens ou armamentos finalizada.`,enabled:!0,name:`Produção Concluída`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.6},sale_completed:{action_type:`sale_completed`,category:`sales`,cooldown_seconds:60,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:75,description:`Conclusão de venda de insumos/armamentos devidamente validada.`,enabled:!0,name:`Venda Comercial Concluída`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.75},stock_movement:{action_type:`stock_movement`,category:`logistics`,cooldown_seconds:120,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:20,description:`Abastecimento ou recolhimento registrado e auditado em baú físico.`,enabled:!0,name:`Movimentação em Baú`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.3},ticket_resolved:{action_type:`ticket_resolved`,category:`support`,cooldown_seconds:300,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:20,description:`Resolução de ticket ou mediação de suporte aos membros.`,enabled:!0,name:`Atendimento / Ticket Resolvido`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.5},warehouse_transfer:{action_type:`warehouse_transfer`,category:`logistics`,cooldown_seconds:180,created_at:`2026-10-13T19:27:19.280Z`,daily_cap:20,description:`Transferência de saldo produzido para armazém ou vitrine comercial.`,enabled:!0,name:`Transferência de Armazém`,updated_at:`2026-10-13T19:27:19.280Z`,xp_reward:.35}}};export{n,r as t};