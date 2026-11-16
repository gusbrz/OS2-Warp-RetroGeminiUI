# Gemini OS/2 Home Edition

A generative UI experience for home tasks, styled after the classic IBM OS/2 Warp operating system and powered by the Gemini API.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

Sem chave de API o desktop abre normalmente: só ficam desabilitadas as janelas que geram conteúdo com
o modelo (Recipe Book, Image Studio, Planilhas via IA e o botão "Pesquisar ao vivo" do Agente
LLM-Judiciário).

## Apps

| Janela | O que faz |
| --- | --- |
| Recipe Book · To-Do List · Image Studio · Text Editor · Planilhas · Navegador Web | utilidades gerativas do desktop |
| **Agente LLM-Judiciário** | agente de inteligência que investiga **quais LLMs o Poder Judiciário brasileiro usa** — TJRS (plataforma GAIA), TRF4/JF4R e a Justiça do Trabalho (TRT/CSJT), com trilha de evidências |

### Agente LLM-Judiciário

Abra o ícone na área de trabalho (duplo clique) para ver o traço do agente, os vereditos com nível de
asserção, a matriz *tribunal × modelo*, as lacunas com perguntas prontas para LAI e o relatório em
Markdown/CSV. Metodologia completa, régua epistêmica e procedimento de atualização do corpus:
[docs/agente-llm-judiciario.md](docs/agente-llm-judiciario.md).

```bash
npm run agente -- "qual LLM o TJRS usa na GAIA Minuta"   # mesmo agente, headless
npm run agente -- "" --out docs/RELATORIO-LLM-JUDICIARIO.md
npm test                                                  # verifica as regras de prova do agente
npm run typecheck
```

O motor é determinístico e funciona offline sobre `data/judiciaryLlmCorpus.ts` (corpus curado com
URL + citação literal por afirmação). Com `GEMINI_API_KEY`, o botão **Pesquisar ao vivo** acrescenta
fontes coletadas com grounding na Busca Google — que entram no mesmo scoring como evidência, nunca
como conclusão.
