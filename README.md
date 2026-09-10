# Gemini OS/2 — Agente de Tráfego Pago para Advocacia (RS)

Desktop retrô estilo **OS/2 Warp** com apps alimentados pela IA Gemini. O app principal é o
**Agente de Tráfego Pago**, um gestor de mídia paga com IA focado na divulgação de escritório
de advocacia no **Rio Grande do Sul** — com alcance concentrado em **Pelotas e Porto Alegre** —
nas áreas:

- **Direito Médico** — defesa do médico (CRM, sindicâncias, erro médico)
- **Direito do Consumidor** — prestação de serviço aéreo (voo atrasado/cancelado, overbooking, bagagem)
- **Direito Digital** — LGPD, golpes virtuais, crimes digitais, contratos eletrônicos
- **Direito para Tecnologia da Informação** — contratos de software, SaaS, produtos e serviços de TI
- **Direito Público** — licitações, contratos administrativos, servidores públicos

## O que o agente gera

A partir de um breve briefing (escritório, área, plataforma, objetivo, orçamento mensal e regiões
de alcance), o agente produz:

- Estratégia da campanha e descrição do cliente ideal (ICP)
- 3 variações de anúncios prontos (título, texto e CTA)
- Palavras-chave de busca **regionais** (ex.: "advogado direito médico Pelotas") e negativas
- Segmentações de público com contexto local do RS
- Distribuição do orçamento por canal/etapa do funil (com valores em R$)
- KPIs para acompanhamento (CPL, CTR, custo por consulta etc.)
- **Notas de conformidade com a publicidade advocatícia** — Provimento 205/2021 do CFOAB

O plano pode ser **refinado em conversa**: peça ajustes ("foco em médicos de Pelotas",
"mais 2 anúncios") e o agente retorna o plano atualizado.

## 🚀 Agente direto no Google Ads

Com as credenciais configuradas, o agente **atua diretamente na sua conta Google Ads**:

1. **Validação** — a campanha (orçamento diário, campanha de Pesquisa, critérios geográficos de
   Pelotas/Porto Alegre, palavras-chave em frase e anúncio responsivo) é testada com
   `validate_only`: o Google confere tudo **sem criar nem cobrar nada**.
2. **Publicação** — a campanha é criada de verdade, **sempre PAUSADA**, com segmentação por
   **presença** (somente pessoas fisicamente no RS). Você revisa e ativa no painel do Google Ads.

### Configuração (passo a passo)

Copie `.env.local.example` para `.env.local` e preencha:

| Variável | Onde obter |
| --- | --- |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Conta de administrador (MCC) Google Ads → **Ferramentas → Central de APIs** |
| `GOOGLE_ADS_CUSTOMER_ID` | ID da conta onde as campanhas serão criadas (10 dígitos) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | (Opcional) ID da conta MCC que gerencia a conta acima |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → credenciais OAuth 2.0, tipo **Aplicativo da Web**, escopo `.../auth/adwords` |
| `GOOGLE_ADS_REFRESH_TOKEN` | Preenchido **automaticamente** pelo botão "Conectar conta Google" no app |
| `GOOGLE_ADS_API_VERSION` | (Opcional) Padrão `v24` (suportada até ~mai/2027). Confira as versões vigentes nas [release notes](https://developers.google.com/google-ads/api/docs/release-notes) |

No cliente OAuth, cadastre o URI de redirecionamento:

- Local: `http://localhost:5173/api/google-ads/auth/callback`
- Preview hospedado: `https://SEU-HOST/api/google-ads/auth/callback` (o app mostra o URI exato ao clicar em conectar)

Depois clique em **"Conectar conta Google Ads"** no painel do app — o refresh token é salvo
automaticamente no `.env.local`.

**Segurança:** as credenciais do Google Ads ficam apenas no servidor (middleware do Vite);
nunca vão para o bundle do navegador. Para testar sem custo, use uma
[conta de teste do Google Ads](https://developers.google.com/google-ads/api/docs/best-practices/test-accounts)
ou deixe tudo pausado até revisar.

## Outros apps do desktop

Recipe Book, To-Do List, Image Studio, Text Editor, Planilhas e Navegador Web.

## Rodar localmente

**Pré-requisito:** Node.js

1. Instale as dependências:
   `npm install`
2. Copie `.env.local.example` para `.env.local` e defina ao menos a `GEMINI_API_KEY`
3. Rode o app:
   `npm run dev`
4. Dê um duplo clique no ícone **Tráfego Pago** na área de trabalho.
