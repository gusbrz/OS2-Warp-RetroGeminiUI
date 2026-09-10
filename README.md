# Gemini OS/2 — Agente de Tráfego Pago para Advocacia

Desktop retrô estilo **OS/2 Warp** com apps alimentados pela IA Gemini. O app principal é o
**Agente de Tráfego Pago**, um gestor de mídia paga com IA focado na divulgação de escritório
de advocacia nas áreas:

- **Direito Médico** — defesa do médico (CRM, sindicâncias, erro médico)
- **Direito do Consumidor** — prestação de serviço aéreo (voo atrasado/cancelado, overbooking, bagagem)
- **Direito Digital** — LGPD, golpes virtuais, crimes digitais, contratos eletrônicos
- **Direito para Tecnologia da Informação** — contratos de software, SaaS, produtos e serviços de TI
- **Direito Público** — licitações, contratos administrativos, servidores públicos

## O que o agente gera

A partir de um breve briefing (escritório, área, plataforma, objetivo e orçamento mensal), o agente produz:

- Estratégia da campanha e descrição do cliente ideal (ICP)
- 3 variações de anúncios prontos (título, texto e CTA)
- Palavras-chave de busca e palavras-chave negativas
- Segmentações de público
- Distribuição do orçamento por canal/etapa do funil (com valores em R$)
- KPIs para acompanhamento (CPL, CTR, custo por consulta etc.)
- **Notas de conformidade com a publicidade advocatícia** — Provimento 205/2021 do CFOAB
  (sem promessa de resultados, sem linguagem mercantilista, tom sóbrio e informativo)

O plano pode ser **refinado em conversa**: peça ajustes ("foco em médicos de São Paulo",
"mais 2 anúncios para Instagram") e o agente retorna o plano atualizado.

## Outros apps do desktop

Recipe Book, To-Do List, Image Studio, Text Editor, Planilhas e Navegador Web.

## Rodar localmente

**Pré-requisito:** Node.js

1. Instale as dependências:
   `npm install`
2. Defina a `GEMINI_API_KEY` em [.env.local](.env.local) com sua chave da API Gemini
3. Rode o app:
   `npm run dev`
4. Dê um duplo clique no ícone **Tráfego Pago** na área de trabalho.
