# Agente LLM-Judiciário — metodologia e operação

> Janela **"Agente LLM-Judiciário"** na área de trabalho do Gemini OS/2 · CLI `npm run agente` · testes `npm test`

## 1. O que o agente responde

> *"Quais LLMs o Poder Judiciário brasileiro usa — em especial o TJRS (plataforma GAIA), o TRF4 e a Justiça do Trabalho (TRT/CSJT)?"*

A pergunta parece simples e não é. Tribunais anunciam "IA generativa", contratam **produtos**
(Copilot, NotebookLM, Rovo) que embutem modelos, compram **nuvem** (Bedrock, Vertex AI via SERPRO)
que dá acesso a **famílias** de modelos, e publicam isso em lugares diferentes — quando publicam.
Um agente que resume notícias responde errado com confiança. Este responde em camadas, cada uma
com o nível de asserção que a evidência suporta.

## 2. Arquitetura

```
data/judiciaryLlmCorpus.ts    corpus curado: tribunais, soluções, modelos, evidências (URL + citação literal)
        │
agents/types.ts               contratos (Evidence, AiSolution, Judgement, AgentReport…)
        │
agents/llmIntelAgent.ts       motor: pipeline de 9 passos, scoring, vereditos, markdown/CSV
        │            ▲
        │            └── services/llmIntelService.ts   coleta ao vivo (Gemini + Busca Google),
        │                                               que só ALIMENTA o mesmo scoring
apps/JudicialAiAgentApp.tsx   UI OS/2: traço do agente, vereditos, matriz, lacunas, fontes, relatório
scripts/jud-llm-agent.mjs     mesma execução, headless, gravando docs/RELATORIO-LLM-JUDICIARIO.md
scripts/agent-smoke.mjs       testes das regras epistêmicas (não testam layout)
```

O motor é **determinístico e offline**: roda sem chave de API e dá sempre a mesma resposta para o
mesmo corpus. O modo ao vivo é aditivo — nunca substitui a regra de prova.

### Os 9 passos (visíveis na aba "Traço do agente")

| Passo | O que faz |
| --- | --- |
| `interpretar-consulta` | Normaliza, resolve "TJ/RS" → tjrs, identifica ferramentas e sinaliza homônimos |
| `planejar-investigacao` | Fixa a ordem das classes de fonte (canônica antes de imprensa) |
| `varrer-catalogo` | Filtra as soluções no escopo |
| `reunir-evidencia` | Anexa fontes por solução (inclusive por `modelLinks`) |
| `classificar-fontes` | Pesa oficial / auditoria / normativo / imprensa / fornecedor / acadêmico |
| `atribuir-vereditos` | Score por par *solução × modelo* e nível de asserção |
| `inferencia-contextual` | Quando não há declaração, tenta inferir — e recusa quando não pode |
| `cobertura-lacunas` | Mede o quanto cada tribunal declara e gera perguntas de verificação |
| `sintetizar-relatorio` | Narrativa, ressalvas e checklist |

## 3. Régua epistêmica (o coração do agente)

```
score = 0,42·confiabilidade_máxima
      + 0,18·corroboração (docs e fontes independentes)
      + 0,18·recência (data vs. coleta; neutro se ausente)
      + 0,22·especificidade (a fonte NOMEIA o modelo?)
      + 0,05 bônus canônico
      − 0,08 se a atribuição veio de fonte que descreve o conjunto
```

| Nível | Condição |
| --- | --- |
| **CONFIRMADO** | score ≥ 0,72 **e** uma fonte `oficial`/`auditoria`/`normativo` nomeia o modelo |
| **PROVÁVEL** | score ≥ 0,55 e a fonte nomeia o modelo |
| **INDÍCIO** | score ≥ 0,38, ou nomeação só por fonte secundária, ou inferência contextual |
| **NÃO DECLARADO** | virou *lacuna* com perguntas prontas — nunca um veredito |

Quatro travas adicionais, cada uma com um caso real que as motivou:

1. **Imprensa sozinha não confirma.** O TJRS declarou a Claude/GPT-4o/Gemini/Nova em entrevista à
   *Baguete*; sem documento institucional, o TJRS fica em "provável", não "confirmado".
2. **Fonte coletiva não vira veredito individual.** "O tribunal usa modelos como Claude, GPT-4o,
   Gemini e Nova" fala da *plataforma*. Atribuir os quatro à GAIA SEI seria invenção — a evidência
   de vários destinos usa `modelLinks` por solução, e o que restar sem link vira lacuna.
3. **Homônimo nunca é inferido por nome.** "Gemini" no PJe é módulo de agrupamento de processos em
   produção desde 06/03/2021, anterior à família da Google; "GAIA" também é um modelo aberto (Gemma 3,
   CEIA-UFG/Google) e um benchmark. O agente recusa a inferência e explica por quê.
4. **Suíte não é modelo.** Copilot, NotebookLM e Rovo entram como produtos; o `kind` os separa de
   `llm`/`modelo-aberto`, e o passo de inferência só aceita LLMs de verdade.

## 4. O que a coleta atual mostra

Resumo (reabra as fontes antes de citar — ver §6):

| Órgão | Solução | Modelo | Base |
| --- | --- | --- | --- |
| **TJRS** | GAIA (plataforma mestra, 8 agentes) | Claude, GPT-4o, Gemini, Amazon Nova — abordagem "agnóstica", servida no **Amazon Bedrock** | entrevista à Baguete (DITIC/TJ-RS) + GZH → *provável* |
| **TJRS** | GAIA Minuta (jAI + AWS, plug-in do eproc) | **Claude** (via Amazon) e **Gemini** (Google) | GZH, que afirma "opera sob dois motores" → *provável* |
| **TJRS** | GAIA Copilot / Petição Inicial / SALUS / SEI | ecossistema Microsoft (Copilot, 2.600 licenças); SEI usa módulo da Anatel na Azure | *indício* — nenhum modelo nomeado |
| **TRT-4 (RS)** | **Galileu** | **Gemini Flash**, exclusivamente | **TCU** (auditoria) → *confirmado* |
| **TRF4 / JF4R** | Gemini + NotebookLM contratados; agente **GRALHA** | família **Gemini** (contratação institucional); GRALHA = *indício* Gemini | portal do TRF4 → *confirmado* para a contratação |
| **CSJT (todos os TRTs)** | **Chat-JT** | **Gemini 2.0 Flash, Llama 3.1 405B, Llama 3.3 70B** (v1.06) | ConJur → *provável*; família Gemini *confirmada* pelo TRT-7/TRT-11 |
| **CNJ** | Res. 615/2025 + Sinapses | — | obriga a indicar modelos, versões, fornecedores e código de registro |

Contraste que o agente faz e assessoria nenhuma faz: **Justiça do Trabalho e TRF4 dependem de um
fornecedor só** (família Gemini via Contrato Estruturante de Nuvem CSJT↔SERPRO, hospedado no Vertex
AI — o próprio TCU recomenda redundância), enquanto o **TJRS montou arquitetura multi-provedor na AWS**.
Quem precisa de soberania/continuidade deveria ler isso antes de copiar a "IA do TJRS".

## 5. Como usar

```bash
# na interface
npm install && npm run dev     # abra a janela "Agente LLM-Judiciário"

# linha de comando
npm run agente -- "qual modelo o TRT-4 usa no Galileu"
npm run agente --                      # panorama completo + docs/RELATORIO-LLM-JUDICIARIO.md
npm run agente -- --list                # catálogo de soluções monitoradas
npm run agente -- "TJRS" --levels confirmado,provavel --out relatorio-tjrs.md --csv tjrs.csv
npm run agente -- "" --json             # saída estruturada (integração com outras ferramentas)

# regras epistêmicas
npm test
```

Sem `GEMINI_API_KEY` no `.env.local`, o botão "Pesquisar ao vivo" fica desabilitado e o agente roda
integralmente sobre o corpus — decisão deliberada: a auditoria não pode depender de uma API disponível.

## 6. Atualizando o corpus (procedimento)

1. **Comece pelo canônico.** Catálogo Sinapses/CNJ, página de transparência de TI do tribunal (o
   padrão do TRT-7 é a melhor referência), ETP/termo de referência no PNCP, acórdãos do TCU.
2. **Registre a evidência como objeto**: `claim` (o que a fonte sustenta), `quote` (trecho literal),
   `url`, `source`, `publishedOn`, `type`, `reliability`, `explicitModel`, `solutionIds`, `modelIds`
   e — quando a fonte cobre mais de uma solução — `modelLinks` por solução.
3. Se a fonte não nomeia modelo, **não invente `modelIds`**: abra uma `openQuestions` na ficha da
   solução. É isso que produz a lista de lacunas, muitas vezes mais útil que a resposta.
4. Rode `npm test` (exige URL, citação > 25 caracteres, âncora para cada veredito) e
   `npm run agente -- "" --out docs/RELATORIO-LLM-JUDICIARIO.md`.
5. Suba `CORPUS_VERSION` para a data da coleta.

### Alvos concretos para as próximas rodadas

- Nº do contrato TJRS↔jAI e a matriz de roteamento entre modelos no Bedrock.
- Ficha da GAIA Minuta/Assistente no Sinapses (a Res. 615/2025 exige versão e fornecedor).
- ETP/ata da contratação Google do TRF4 e o modelo que atende o GRALHA.
- Nº, relator e data do acórdão do TCU que auditou o Galileu (a coleta achou o inteiro teor pela
  Pesquisa Integrada, sem fechar a identificação).
- Páginas de transparência de TI do TRT-4 e do TJRS no padrão da do TRT-7 — se existirem, é o fim da
  necessidade de imprensa para confirmar LLM de tribunal.

## 7. Limitações

- O corpus é **retrato**, não vigilância contínua: versões de modelo mudam sem anúncio.
- `reliability` é calibração editorial, não verdade formal — o nível depende do *tipo* de fonte de
  forma deliberada.
- O agente cobre o que foi pedido (TJRS/GAIA, TRF4, TRT/CSJT) + comparativos que servem de régua
  (STJ Logos, TRF3 SIGMA, TRT-7, TRT-11). Não é censo nacional dos 90+ tribunais.
- Modo ao vivo herda os erros do motor de busca: por isso cada achado externo precisa de URL e
  citação, e entra como evidência, jamais como conclusão.
