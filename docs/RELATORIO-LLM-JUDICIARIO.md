# LLMs utilizados pelo Poder Judiciário brasileiro

**Consulta:** (busca ampla)  
**Gerado em:** 16/11/2026, 13:49:26 (agente offline, corpus curado)  
**Corpus:** v.2026.11.16 · 31 evidências · 22 soluções · 28 vereditos

## 1. Conclusões

- Escopo investigado: todo o Judiciário mapeado. Corpus 2026.11.16 (coletado em 2026-11-16).
- Com peso institucional: CSJT usa Google Gemini (família) no(a) Chat-JT (assistente institucional da Justiça do Trabalho); TRT-7 usa Google Gemini (família) no(a) Google Workspace / Gemini / NotebookLM (TRT-7); TRT-7 usa NotebookLM 〔suíte, não LLM isolado〕 no(a) Google Workspace / Gemini / NotebookLM (TRT-7); TRT-4 usa Gemini Flash (2.0 Flash / Gemini Flash) no(a) Galileu; TRT-4 usa Google Gemini (família) no(a) Galileu; TRF3 usa Gemini 1.5 Pro / Gemini Pro no(a) SIGMA 2.0; TRT-11 usa Google Gemini (família) no(a) Assistente institucional do TRT-11; TRT-11 usa Gemini 1.5 Pro / Gemini Pro no(a) Assistente institucional do TRT-11; TRF4 usa Google Gemini (família) no(a) Gemini e NotebookLM contratados pela JF4R; TRF4 usa NotebookLM 〔suíte, não LLM isolado〕 no(a) Gemini e NotebookLM contratados pela JF4R.
- Provável (fonte especializada nomeia o modelo, falta documento oficial): CSJT/Chat-JT (assistente institucional da Justiça do Trabalho) → Gemini Flash (2.0 Flash / Gemini Flash); CSJT/Chat-JT (assistente institucional da Justiça do Trabalho) → Meta Llama 3.1 405B; CSJT/Chat-JT (assistente institucional da Justiça do Trabalho) → Meta Llama 3.3 70B; TJRS/GAIA Explica aí, tchê! → Google Gemini (família); TJRS/GAIA Minuta → Anthropic Claude; TJRS/GAIA Minuta → Google Gemini (família); TJRS/GAIA → Anthropic Claude; TJRS/GAIA → OpenAI GPT-4o; TJRS/GAIA → Google Gemini (família); TJRS/GAIA → Amazon Nova; STJ/Logos (STJ) → OpenAI GPT-4o.
- Padrão dominante: a família Gemini (Google) é o fio condutor — chega aos tribunais sobretudo pelo Contrato Estruturante de Nuvem do CSJT com o SERPRO, que hospeda modelos no Google Cloud Vertex AI; o TRT-4 opera o Galileu exclusivamente com Gemini Flash. O TJRS segue rota distinta (Amazon Bedrock) e mantém postura multi-modelo: Claude, GPT-4o, Gemini e Nova.
- Cobertura de divulgação: TJRS 44% (9 solução(ões)) · TRF4 67% (3 solução(ões)) · TRT-4 50% (2 solução(ões)) · CSJT 33% (3 solução(ões)) · STJ 100% (1 solução(ões)) · TRF3 100% (1 solução(ões)) · TRT-7 50% (2 solução(ões)) · TRT-11 100% (1 solução(ões)).
- Lacunas: TJRS/GAIA Assistente; TJRS/GAIA Salus; TJRS/GAIA SEI; TRT-4/Módulo "GEMINI" do PJe (agrupamento por similitude); TRF4/Tramitação Ágil (Inspiralab / eproc); CSJT/Gemini do PJe (módulo de agrupamento de processos) — sem declaração pública de LLM na coleta.
- Armadilha de nomeação: "GAIA" e "Gemini" têm homônimos que produzem falso positivo em busca automática; verifique a seção de desambiguação.

## 2. Vereditos

| Tribunal | Solução | Modelo | Provedor | Nível | Score | Fontes indep. |
| --- | --- | --- | --- | --- | --- | --- |
| CSJT | Chat-JT (assistente institucional da Justiça do Trabalho) | Google Gemini (família) | Google | CONFIRMADO | 0.96 | 2 |
| TRT-7 | Google Workspace / Gemini / NotebookLM (TRT-7) | Google Gemini (família) | Google | CONFIRMADO | 0.90 | 1 |
| TRT-7 | Google Workspace / Gemini / NotebookLM (TRT-7) | NotebookLM 〔suíte, não LLM isolado〕 | Google | CONFIRMADO | 0.90 | 1 |
| TRT-4 | Galileu | Gemini Flash (2.0 Flash / Gemini Flash) | Google | CONFIRMADO | 0.85 | 1 |
| TRT-4 | Galileu | Google Gemini (família) | Google | CONFIRMADO | 0.85 | 1 |
| TRF3 | SIGMA 2.0 | Gemini 1.5 Pro / Gemini Pro | Google | CONFIRMADO | 0.84 | 1 |
| TRT-11 | Assistente institucional do TRT-11 | Google Gemini (família) | Google | CONFIRMADO | 0.82 | 1 |
| TRT-11 | Assistente institucional do TRT-11 | Gemini 1.5 Pro / Gemini Pro | Google | CONFIRMADO | 0.82 | 1 |
| TRF4 | Gemini e NotebookLM contratados pela JF4R | Google Gemini (família) | Google | CONFIRMADO | 0.82 | 1 |
| TRF4 | Gemini e NotebookLM contratados pela JF4R | NotebookLM 〔suíte, não LLM isolado〕 | Google | CONFIRMADO | 0.82 | 1 |
| TRT-7 | Atlassian Rovo (TRT-7) | Atlassian Rovo 〔suíte, não LLM isolado〕 | Atlassian | INDÍCIO | 0.78 | 1 |
| CSJT | Chat-JT (assistente institucional da Justiça do Trabalho) | Gemini Flash (2.0 Flash / Gemini Flash) | Google | PROVÁVEL | 0.74 | 1 |
| CSJT | Chat-JT (assistente institucional da Justiça do Trabalho) | Meta Llama 3.1 405B | Meta (pesos abertos) | PROVÁVEL | 0.74 | 1 |
| CSJT | Chat-JT (assistente institucional da Justiça do Trabalho) | Meta Llama 3.3 70B | Meta (pesos abertos) | PROVÁVEL | 0.74 | 1 |
| TJRS | GAIA Explica aí, tchê! | Google Gemini (família) | Google | PROVÁVEL | 0.72 | 1 |
| TJRS | GAIA Minuta | Anthropic Claude | Anthropic | PROVÁVEL | 0.71 | 1 |
| TJRS | GAIA Minuta | Google Gemini (família) | Google | PROVÁVEL | 0.71 | 1 |
| TJRS | GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) | Anthropic Claude | Anthropic | PROVÁVEL | 0.68 | 1 |
| TJRS | GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) | OpenAI GPT-4o | OpenAI | PROVÁVEL | 0.68 | 1 |
| TJRS | GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) | Google Gemini (família) | Google | PROVÁVEL | 0.68 | 1 |
| TJRS | GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) | Amazon Nova | Amazon | PROVÁVEL | 0.68 | 1 |
| STJ | Logos (STJ) | OpenAI GPT-4o | OpenAI | PROVÁVEL | 0.61 | 1 |
| TJRS | GAIA Petição Inicial | Microsoft 365 Copilot (motores GPT) 〔suíte, não LLM isolado〕 | Microsoft | INDÍCIO | 0.60 | 1 |
| TJRS | GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) | Microsoft 365 Copilot (motores GPT) 〔suíte, não LLM isolado〕 | Microsoft | INDÍCIO | 0.48 | 1 |
| TJRS | GAIA Copilot (Microsoft 365) | Microsoft 365 Copilot (motores GPT) 〔suíte, não LLM isolado〕 | Microsoft | INDÍCIO | 0.48 | 1 |
| TJRS | GAIA Audiências Inteligentes | Google Gemini (família) | Google | INDÍCIO | 0.42 | 3 |
| TRF4 | GRALHA (agente de linguagem simples) | Google Gemini (família) | Google | INDÍCIO | 0.42 | 1 |
| CSJT | Concilia-JT | Google Gemini (família) | Google | INDÍCIO | 0.42 | 3 |

## 3. Evidência por veredito

### CSJT · Chat-JT (assistente institucional da Justiça do Trabalho) → Google Gemini (família)

- Nível: **CONFIRMADO** (score 0.96) · fontes independentes: 2
- Camada de nuvem/infra: Plataforma centralizada do CSJT · nuvem via Contrato Estruturante SERPRO
- Nota: Data de pelo menos uma fonte não foi confirmada na coleta — recência tratada como neutra.
  - TRT-11 — Cartilha de Letramento Digital em Inteligência Artificial (2025-08-27) — [fonte](https://portal.trt11.jus.br/images/Comunicacao/Noticias/2025/Cartilha_de_Letramento_Digital_em_Intelig%C3%AAncia_Artificial.pdf)
    > É o modelo base da ferramenta institucional do TRT11. Acesso ao modelo de ponta (Gemini 2.5 Pro) [...]. Flexibilidade de Modelos: Embora utilize primariamente os modelos da família [Gemini] [...] Os Tribunais Regionais do Trabalho estão proibidos de desenvolver ou implementar soluções de IA sem autorização. Isso inclui LLMs e sistemas de IA generativa.
  - TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor) (data não confirmada) — [fonte](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4)
    > O sistema acessa a inteligência artificial pelo Contrato Estruturante de Nuvem firmado pelo CSJT com o Serpro, operador da camada de nuvem, que provê o acesso à plataforma Google Cloud Vertex AI, onde os modelos são hospedados. Esse contrato disponibiliza apenas a família de modelos Gemini, do Google.

### TRT-7 · Google Workspace / Gemini / NotebookLM (TRT-7) → Google Gemini (família)

- Nível: **CONFIRMADO** (score 0.90) · fontes independentes: 1
- Camada de nuvem/infra: Google Workspace
- Nota: Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.
  - TRT-7 — Transparência e Governança em TIC (2026-03-06) — [fonte](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas)
    > Google Workspace / Gemini / NotebookLM — Soluções de IA generativa integradas ao ecossistema de produtividade institucional e escritório Google Workspace, adotado no TRT7. Os Tribunais têm acesso à versão básica do Gemini, que também se integra ao e-mail institucional Gmail [...] Contrato Nº 10/2025.

### TRT-7 · Google Workspace / Gemini / NotebookLM (TRT-7) → NotebookLM 〔suíte, não LLM isolado〕

- Nível: **CONFIRMADO** (score 0.90) · fontes independentes: 1
- Camada de nuvem/infra: Google Workspace
- Nota: Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.
  - TRT-7 — Transparência e Governança em TIC (2026-03-06) — [fonte](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas)
    > Google Workspace / Gemini / NotebookLM — Soluções de IA generativa integradas ao ecossistema de produtividade institucional e escritório Google Workspace, adotado no TRT7. Os Tribunais têm acesso à versão básica do Gemini, que também se integra ao e-mail institucional Gmail [...] Contrato Nº 10/2025.

### TRT-4 · Galileu → Gemini Flash (2.0 Flash / Gemini Flash)

- Nível: **CONFIRMADO** (score 0.85) · fontes independentes: 1
- Camada de nuvem/infra: Google Cloud Vertex AI · Contrato Estruturante de Nuvem do CSJT com o SERPRO
- Nota: Data de pelo menos uma fonte não foi confirmada na coleta — recência tratada como neutra.
  - TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor) (data não confirmada) — [fonte](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4)
    > A matriz não inclui a dependência de provedor único do modelo de IA, embora o sistema opere apenas utilizando o Gemini Flash, da Google. O mapeamento de riscos feito pelo TRT-4 é coerente com o que a auditoria testou, com essa ressalva.

### TRT-4 · Galileu → Google Gemini (família)

- Nível: **CONFIRMADO** (score 0.85) · fontes independentes: 1
- Camada de nuvem/infra: Google Cloud Vertex AI · Contrato Estruturante de Nuvem do CSJT com o SERPRO
- Nota: Data de pelo menos uma fonte não foi confirmada na coleta — recência tratada como neutra.
  - TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor) (data não confirmada) — [fonte](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4)
    > O sistema acessa a inteligência artificial pelo Contrato Estruturante de Nuvem firmado pelo CSJT com o Serpro, operador da camada de nuvem, que provê o acesso à plataforma Google Cloud Vertex AI, onde os modelos são hospedados. Esse contrato disponibiliza apenas a família de modelos Gemini, do Google.
  - TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor) (data não confirmada) — [fonte](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4)
    > O TRF4/TRT-4 dispõe de um único provedor de modelos, a família Gemini do Contrato Estruturante do CSJT, e um teste apoiado nesse mesmo modelo para avaliar as saídas poderia recair sobre os vieses do próprio modelo. [...] Remanesce a dependência de um único provedor de modelos. A tolerância a falhas limita-se à troca dentro da família Gemini, sem alternativa de fornecedor.

### TRF3 · SIGMA 2.0 → Gemini 1.5 Pro / Gemini Pro

- Nível: **CONFIRMADO** (score 0.84) · fontes independentes: 1
- Camada de nuvem/infra: Vertex AI · Compute Engine (GPU/TPU) · Cloud Storage
  - TRF3 — Estudo Técnico Preliminar (Lei 14.133/2021) (2025-08-01) — [fonte](https://web.trf3.jus.br/contas/ContratacoesDiretas/Download/3180?idArquivo=31836)
    > A solução consiste na aquisição de créditos (tokens) para uso na plataforma Google Cloud. O principal serviço a ser utilizado será a Vertex AI [...] o projeto SIGMA 2.0 terá acesso via API aos modelos de fundação do Google, com destaque para a família de modelos Gemini (ex: Gemini 1.5 Pro).

### TRT-11 · Assistente institucional do TRT-11 → Google Gemini (família)

- Nível: **CONFIRMADO** (score 0.82) · fontes independentes: 1
  - TRT-11 — Cartilha de Letramento Digital em Inteligência Artificial (2025-08-27) — [fonte](https://portal.trt11.jus.br/images/Comunicacao/Noticias/2025/Cartilha_de_Letramento_Digital_em_Intelig%C3%AAncia_Artificial.pdf)
    > É o modelo base da ferramenta institucional do TRT11. Acesso ao modelo de ponta (Gemini 2.5 Pro) [...]. Flexibilidade de Modelos: Embora utilize primariamente os modelos da família [Gemini] [...] Os Tribunais Regionais do Trabalho estão proibidos de desenvolver ou implementar soluções de IA sem autorização. Isso inclui LLMs e sistemas de IA generativa.

### TRT-11 · Assistente institucional do TRT-11 → Gemini 1.5 Pro / Gemini Pro

- Nível: **CONFIRMADO** (score 0.82) · fontes independentes: 1
  - TRT-11 — Cartilha de Letramento Digital em Inteligência Artificial (2025-08-27) — [fonte](https://portal.trt11.jus.br/images/Comunicacao/Noticias/2025/Cartilha_de_Letramento_Digital_em_Intelig%C3%AAncia_Artificial.pdf)
    > É o modelo base da ferramenta institucional do TRT11. Acesso ao modelo de ponta (Gemini 2.5 Pro) [...]. Flexibilidade de Modelos: Embora utilize primariamente os modelos da família [Gemini] [...] Os Tribunais Regionais do Trabalho estão proibidos de desenvolver ou implementar soluções de IA sem autorização. Isso inclui LLMs e sistemas de IA generativa.

### TRF4 · Gemini e NotebookLM contratados pela JF4R → Google Gemini (família)

- Nível: **CONFIRMADO** (score 0.82) · fontes independentes: 1
- Camada de nuvem/infra: Google Workspace / Gemini · NotebookLM
- Nota: Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.
  - TRF4 — trilha formativa "A IA chegou. E agora?" (2025-03-31) — [fonte](https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=5290)
    > Apresentar casos de uso práticos da IA generativa na área previdenciária, demonstrando como as ferramentas Gemini e Notebook LM, contratadas pela JF4R, podem auxiliar na análise e no processamento dos processos judiciais. [...] Treinamento Google — Equipe técnica do Google — Treinar o uso das ferramentas Gemini e Notebook LM.

### TRF4 · Gemini e NotebookLM contratados pela JF4R → NotebookLM 〔suíte, não LLM isolado〕

- Nível: **CONFIRMADO** (score 0.82) · fontes independentes: 1
- Camada de nuvem/infra: Google Workspace / Gemini · NotebookLM
- Nota: Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.
  - TRF4 — trilha formativa "A IA chegou. E agora?" (2025-03-31) — [fonte](https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=5290)
    > Apresentar casos de uso práticos da IA generativa na área previdenciária, demonstrando como as ferramentas Gemini e Notebook LM, contratadas pela JF4R, podem auxiliar na análise e no processamento dos processos judiciais. [...] Treinamento Google — Equipe técnica do Google — Treinar o uso das ferramentas Gemini e Notebook LM.

### TRT-7 · Atlassian Rovo (TRT-7) → Atlassian Rovo 〔suíte, não LLM isolado〕

- Nível: **INDÍCIO** (score 0.78) · fontes independentes: 1
- Camada de nuvem/infra: Jira/Confluence
- Nota: Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.
- Nota: Nenhuma fonte nomeia o modelo: a associação vem do fornecedor/produto citado (ex.: "a IA da Microsoft"). Por isso o nível fica em "indício".
  - TRT-7 — Transparência e Governança em TIC (2026-03-06) — [fonte](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas)
    > Atlassian Rovo — As funcionalidades de IA são acessórias e não constituem o objeto principal da contratação. Contrato Nº 41/2025. Aprimoramento da base de conhecimento tecnológica e maior agilidade no suporte técnico aos usuários do Tribunal.

### CSJT · Chat-JT (assistente institucional da Justiça do Trabalho) → Gemini Flash (2.0 Flash / Gemini Flash)

- Nível: **PROVÁVEL** (score 0.74) · fontes independentes: 1
- Camada de nuvem/infra: Plataforma centralizada do CSJT · nuvem via Contrato Estruturante SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - ConJur (2025-05-06) — [fonte](https://www.conjur.com.br/2025-mai-06/nova-versao-da-ia-da-justica-do-trabalho-tem-integracao-com-o-pje/)
    > Além da nova funcionalidade, a atualização conta com a incorporação de modelos de linguagem natural, incluindo o Gemini 2.0 Flash, o Llama 3.1 405B e o Llama 3.3 70B. Os modelos, conhecidos como LLMs [...]. O número 405B, por exemplo, refere-se aos 405 bilhões de parâmetros utilizados no treinamento do modelo Llama.

### CSJT · Chat-JT (assistente institucional da Justiça do Trabalho) → Meta Llama 3.1 405B

- Nível: **PROVÁVEL** (score 0.74) · fontes independentes: 1
- Camada de nuvem/infra: Plataforma centralizada do CSJT · nuvem via Contrato Estruturante SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - ConJur (2025-05-06) — [fonte](https://www.conjur.com.br/2025-mai-06/nova-versao-da-ia-da-justica-do-trabalho-tem-integracao-com-o-pje/)
    > Além da nova funcionalidade, a atualização conta com a incorporação de modelos de linguagem natural, incluindo o Gemini 2.0 Flash, o Llama 3.1 405B e o Llama 3.3 70B. Os modelos, conhecidos como LLMs [...]. O número 405B, por exemplo, refere-se aos 405 bilhões de parâmetros utilizados no treinamento do modelo Llama.

### CSJT · Chat-JT (assistente institucional da Justiça do Trabalho) → Meta Llama 3.3 70B

- Nível: **PROVÁVEL** (score 0.74) · fontes independentes: 1
- Camada de nuvem/infra: Plataforma centralizada do CSJT · nuvem via Contrato Estruturante SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - ConJur (2025-05-06) — [fonte](https://www.conjur.com.br/2025-mai-06/nova-versao-da-ia-da-justica-do-trabalho-tem-integracao-com-o-pje/)
    > Além da nova funcionalidade, a atualização conta com a incorporação de modelos de linguagem natural, incluindo o Gemini 2.0 Flash, o Llama 3.1 405B e o Llama 3.3 70B. Os modelos, conhecidos como LLMs [...]. O número 405B, por exemplo, refere-se aos 405 bilhões de parâmetros utilizados no treinamento do modelo Llama.

### TJRS · GAIA Explica aí, tchê! → Google Gemini (família)

- Nível: **PROVÁVEL** (score 0.72) · fontes independentes: 1
- Camada de nuvem/infra: IA generativa da Google
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - Baguete (IT for Business) (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > A última ferramenta lançada neste ano é voltada ao público externo e utiliza a IA generativa da Google em parceria com a Xertica.ai. Batizado de Gaia Explica aí, Tchê!, o assistente traduz sentenças, decisões e despachos para uma linguagem simples.

### TJRS · GAIA Minuta → Anthropic Claude

- Nível: **PROVÁVEL** (score 0.71) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Bedrock (AWS) · plug-in dentro do eproc
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - GZH / Zero Hora (2025-07-15) — [fonte](https://gauchazh.clicrbs.com.br/geral/noticia/2025/07/producao-de-decisoes-e-analises-de-processos-como-a-inteligencia-artificial-e-utilizada-na-justica-do-rs-cmd3lidjt003e014m9yg13arg.html)
    > O Gaia Minuta opera sob dois motores de IA mundialmente conhecidos: o Claude, desenvolvido pela Anthropic e oferecido pela Amazon, e o Gemini, do Google.

### TJRS · GAIA Minuta → Google Gemini (família)

- Nível: **PROVÁVEL** (score 0.71) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Bedrock (AWS) · plug-in dentro do eproc
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - GZH / Zero Hora (2025-07-15) — [fonte](https://gauchazh.clicrbs.com.br/geral/noticia/2025/07/producao-de-decisoes-e-analises-de-processos-como-a-inteligencia-artificial-e-utilizada-na-justica-do-rs-cmd3lidjt003e014m9yg13arg.html)
    > O Gaia Minuta opera sob dois motores de IA mundialmente conhecidos: o Claude, desenvolvido pela Anthropic e oferecido pela Amazon, e o Gemini, do Google.

### TJRS · GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) → Anthropic Claude

- Nível: **PROVÁVEL** (score 0.68) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Web Services (Amazon Bedrock) · Microsoft Azure · Google Cloud · contrato multicloud com o SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
- Nota: Atribuição vinda de fonte que descreve o CONJUNTO de soluções (plataforma), não esta ferramenta em particular: o tribunal pode rotear modelos diferentes por agente. Nível rebaixado.
  - Baguete (IT for Business) — entrevista com Gabriel Belinazo, assessor de governança da DITIC/TJ-RS (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > Essas três soluções foram desenvolvidas no Amazon Bedrock, um serviço gerenciado da Amazon Web Services (AWS) que oferece acesso a LLMs e outros modelos de base por meio de uma única API. O Tribunal usa modelos como Claude, GPT-4o, Gemini e Nova AI, avaliando cada um deles com o objetivo de desenvolver as ferramentas de forma agnóstica.

### TJRS · GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) → OpenAI GPT-4o

- Nível: **PROVÁVEL** (score 0.68) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Web Services (Amazon Bedrock) · Microsoft Azure · Google Cloud · contrato multicloud com o SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
- Nota: Atribuição vinda de fonte que descreve o CONJUNTO de soluções (plataforma), não esta ferramenta em particular: o tribunal pode rotear modelos diferentes por agente. Nível rebaixado.
  - Baguete (IT for Business) — entrevista com Gabriel Belinazo, assessor de governança da DITIC/TJ-RS (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > Essas três soluções foram desenvolvidas no Amazon Bedrock, um serviço gerenciado da Amazon Web Services (AWS) que oferece acesso a LLMs e outros modelos de base por meio de uma única API. O Tribunal usa modelos como Claude, GPT-4o, Gemini e Nova AI, avaliando cada um deles com o objetivo de desenvolver as ferramentas de forma agnóstica.

### TJRS · GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) → Google Gemini (família)

- Nível: **PROVÁVEL** (score 0.68) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Web Services (Amazon Bedrock) · Microsoft Azure · Google Cloud · contrato multicloud com o SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
- Nota: Atribuição vinda de fonte que descreve o CONJUNTO de soluções (plataforma), não esta ferramenta em particular: o tribunal pode rotear modelos diferentes por agente. Nível rebaixado.
  - Baguete (IT for Business) — entrevista com Gabriel Belinazo, assessor de governança da DITIC/TJ-RS (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > Essas três soluções foram desenvolvidas no Amazon Bedrock, um serviço gerenciado da Amazon Web Services (AWS) que oferece acesso a LLMs e outros modelos de base por meio de uma única API. O Tribunal usa modelos como Claude, GPT-4o, Gemini e Nova AI, avaliando cada um deles com o objetivo de desenvolver as ferramentas de forma agnóstica.

### TJRS · GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) → Amazon Nova

- Nível: **PROVÁVEL** (score 0.68) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Web Services (Amazon Bedrock) · Microsoft Azure · Google Cloud · contrato multicloud com o SERPRO
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
- Nota: Atribuição vinda de fonte que descreve o CONJUNTO de soluções (plataforma), não esta ferramenta em particular: o tribunal pode rotear modelos diferentes por agente. Nível rebaixado.
  - Baguete (IT for Business) — entrevista com Gabriel Belinazo, assessor de governança da DITIC/TJ-RS (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > Essas três soluções foram desenvolvidas no Amazon Bedrock, um serviço gerenciado da Amazon Web Services (AWS) que oferece acesso a LLMs e outros modelos de base por meio de uma única API. O Tribunal usa modelos como Claude, GPT-4o, Gemini e Nova AI, avaliando cada um deles com o objetivo de desenvolver as ferramentas de forma agnóstica.

### STJ · Logos (STJ) → OpenAI GPT-4o

- Nível: **PROVÁVEL** (score 0.61) · fontes independentes: 1
- Nota: Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.
  - Gran Cursos (blog) citando análise do Judiciário (2026-01-09) — [fonte](https://blog.grancursosonline.com.br/inteligencia-artificial-no-poder-judiciario-respeito-aos-direitos-fundamentais/)
    > Desde fevereiro de 2025, o STJ implementou o projeto Logos, que utiliza o GPT-4o para auxiliar assessores na análise de recursos especiais, HCs etc. A ferramenta oferece um "Painel de Controle" que acessa automaticamente os autos e os organiza em suas principais peças.

### TJRS · GAIA Petição Inicial → Microsoft 365 Copilot (motores GPT) 〔suíte, não LLM isolado〕

- Nível: **INDÍCIO** (score 0.60) · fontes independentes: 1
- Camada de nuvem/infra: Microsoft Azure
- Nota: Nenhuma fonte nomeia o modelo: a associação vem do fornecedor/produto citado (ex.: "a IA da Microsoft"). Por isso o nível fica em "indício".
  - Baguete (IT for Business) (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > GAIA Petição Inicial, por exemplo, foi desenvolvida com a tecnologia da Microsoft com a Spassu e implementada pela iBrowse. [...] o TJ-RS também desenvolveu o Gaia Salus, contando com as empresas Spassu e Cast.

### TJRS · GAIA — Gestão Avançada de Inteligência Artificial (plataforma mestra) → Microsoft 365 Copilot (motores GPT) 〔suíte, não LLM isolado〕

- Nível: **INDÍCIO** (score 0.48) · fontes independentes: 1
- Camada de nuvem/infra: Amazon Web Services (Amazon Bedrock) · Microsoft Azure · Google Cloud · contrato multicloud com o SERPRO
- Nota: Nenhuma fonte nomeia o modelo: a associação vem do fornecedor/produto citado (ex.: "a IA da Microsoft"). Por isso o nível fica em "indício".
  - Nossa Rádio (compilando divulgação do TJRS) (2025-07-16) — [fonte](https://nossaradio.net.br/98/gaia-plataforma-de-ia-do-tjrs-ja-foi-usada-mais-de-149-mil-vezes/)
    > Outra inovação é a integração do Copilot da Microsoft, com foco em produtividade: Word, Excel, PowerPoint, Outlook e Teams com IA integrada; 2.600 licenças adquiridas pelo TJRS.

### TJRS · GAIA Copilot (Microsoft 365) → Microsoft 365 Copilot (motores GPT) 〔suíte, não LLM isolado〕

- Nível: **INDÍCIO** (score 0.48) · fontes independentes: 1
- Camada de nuvem/infra: Microsoft 365 / Azure
- Nota: Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.
- Nota: Nenhuma fonte nomeia o modelo: a associação vem do fornecedor/produto citado (ex.: "a IA da Microsoft"). Por isso o nível fica em "indício".
  - Nossa Rádio (compilando divulgação do TJRS) (2025-07-16) — [fonte](https://nossaradio.net.br/98/gaia-plataforma-de-ia-do-tjrs-ja-foi-usada-mais-de-149-mil-vezes/)
    > Outra inovação é a integração do Copilot da Microsoft, com foco em produtividade: Word, Excel, PowerPoint, Outlook e Teams com IA integrada; 2.600 licenças adquiridas pelo TJRS.

### TJRS · GAIA Audiências Inteligentes → Google Gemini (família)

- Nível: **INDÍCIO** (score 0.42) · fontes independentes: 3
- Nota: INFERÊNCIA CONTEXTUAL (hipótese, não fato): nenhuma fonte declara o modelo desta solução. O indício vem de GAIA, GAIA Minuta, GAIA Explica aí, tchê! — mesma infraestrutura/contrato institucional do órgão. Pergunte ao tribunal.
  - Baguete (IT for Business) — entrevista com Gabriel Belinazo, assessor de governança da DITIC/TJ-RS (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > Essas três soluções foram desenvolvidas no Amazon Bedrock, um serviço gerenciado da Amazon Web Services (AWS) que oferece acesso a LLMs e outros modelos de base por meio de uma única API. O Tribunal usa modelos como Claude, GPT-4o, Gemini e Nova AI, avaliando cada um deles com o objetivo de desenvolver as ferramentas de forma agnóstica.
  - GZH / Zero Hora (2025-07-15) — [fonte](https://gauchazh.clicrbs.com.br/geral/noticia/2025/07/producao-de-decisoes-e-analises-de-processos-como-a-inteligencia-artificial-e-utilizada-na-justica-do-rs-cmd3lidjt003e014m9yg13arg.html)
    > O Gaia Minuta opera sob dois motores de IA mundialmente conhecidos: o Claude, desenvolvido pela Anthropic e oferecido pela Amazon, e o Gemini, do Google.
  - Baguete (IT for Business) (2025-11-17) — [fonte](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa)
    > A última ferramenta lançada neste ano é voltada ao público externo e utiliza a IA generativa da Google em parceria com a Xertica.ai. Batizado de Gaia Explica aí, Tchê!, o assistente traduz sentenças, decisões e despachos para uma linguagem simples.

### TRF4 · GRALHA (agente de linguagem simples) → Google Gemini (família)

- Nível: **INDÍCIO** (score 0.42) · fontes independentes: 1
- Camada de nuvem/infra: Google Workspace / Gemini
- Nota: INFERÊNCIA CONTEXTUAL (hipótese, não fato): nenhuma fonte declara o modelo desta solução. O indício vem de Gemini e NotebookLM contratados pela JF4R — mesma infraestrutura/contrato institucional do órgão. Pergunte ao tribunal.
  - TRF4 — trilha formativa "A IA chegou. E agora?" (2025-03-31) — [fonte](https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=5290)
    > Apresentar casos de uso práticos da IA generativa na área previdenciária, demonstrando como as ferramentas Gemini e Notebook LM, contratadas pela JF4R, podem auxiliar na análise e no processamento dos processos judiciais. [...] Treinamento Google — Equipe técnica do Google — Treinar o uso das ferramentas Gemini e Notebook LM.

### CSJT · Concilia-JT → Google Gemini (família)

- Nível: **INDÍCIO** (score 0.42) · fontes independentes: 3
- Nota: INFERÊNCIA CONTEXTUAL (hipótese, não fato): nenhuma fonte declara o modelo desta solução. O indício vem de Chat-JT (assistente institucional da Justiça do Trabalho) — mesma infraestrutura/contrato institucional do órgão. Pergunte ao tribunal.
  - ConJur (2025-05-06) — [fonte](https://www.conjur.com.br/2025-mai-06/nova-versao-da-ia-da-justica-do-trabalho-tem-integracao-com-o-pje/)
    > Além da nova funcionalidade, a atualização conta com a incorporação de modelos de linguagem natural, incluindo o Gemini 2.0 Flash, o Llama 3.1 405B e o Llama 3.3 70B. Os modelos, conhecidos como LLMs [...]. O número 405B, por exemplo, refere-se aos 405 bilhões de parâmetros utilizados no treinamento do modelo Llama.
  - TRT-11 — Cartilha de Letramento Digital em Inteligência Artificial (2025-08-27) — [fonte](https://portal.trt11.jus.br/images/Comunicacao/Noticias/2025/Cartilha_de_Letramento_Digital_em_Intelig%C3%AAncia_Artificial.pdf)
    > É o modelo base da ferramenta institucional do TRT11. Acesso ao modelo de ponta (Gemini 2.5 Pro) [...]. Flexibilidade de Modelos: Embora utilize primariamente os modelos da família [Gemini] [...] Os Tribunais Regionais do Trabalho estão proibidos de desenvolver ou implementar soluções de IA sem autorização. Isso inclui LLMs e sistemas de IA generativa.
  - TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor) (data não confirmada) — [fonte](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4)
    > O sistema acessa a inteligência artificial pelo Contrato Estruturante de Nuvem firmado pelo CSJT com o Serpro, operador da camada de nuvem, que provê o acesso à plataforma Google Cloud Vertex AI, onde os modelos são hospedados. Esse contrato disponibiliza apenas a família de modelos Gemini, do Google.

## 4. Cobertura de divulgação

| Tribunal | Soluções mapeadas | Com modelo identificado | Confirmadas | Cobertura |
| --- | --- | --- | --- | --- |
| TJRS | 9 | 4 | 0 | 44% |
| TRF4 | 3 | 2 | 1 | 67% |
| TRT-4 | 2 | 1 | 1 | 50% |
| CSJT | 3 | 1 | 1 | 33% |
| STJ | 1 | 1 | 0 | 100% |
| TRF3 | 1 | 1 | 1 | 100% |
| TRT-7 | 2 | 1 | 1 | 50% |
| TRT-11 | 1 | 1 | 1 | 100% |

## 5. Lacunas e perguntas a fazer ao tribunal

- **TJRS · GAIA Assistente**
  - Modelo que responde ao Assistente (a fonte declara a plataforma Bedrock, não o modelo)
- **TJRS · GAIA Salus**
  - Se há LLM na validação documental ou apenas OCR + regras
- **TJRS · GAIA SEI**
  - Qual modelo serve ao módulo de IA cedido pela Anatel
- **TRT-4 · Módulo "GEMINI" do PJe (agrupamento por similitude)**
  - Que técnica há por trás do módulo (embedding? LLM?) — a sigla não implica uso do Gemini da Google
- **TRF4 · Tramitação Ágil (Inspiralab / eproc)**
  - Componente generativo vs. apenas automação de fluxo — a fonte de 2023 fala em "IA" sem detalhar modelo
- **CSJT · Gemini do PJe (módulo de agrupamento de processos)**
  - Nome idêntico ao LLM da Google, mas função e data de origem são outras: verificar se usa LLM ou apenas embeddings

## 6. Desambiguação obrigatória

- **GAIA** — Quatro coisas diferentes respondem por "GAIA" no ecossistema de IA brasileiro.
  - Plataforma GAIA do TJRS (Gestão Avançada de Inteligência Artificial) — o que normalmente se quer dizer.
  - GAIA, modelo aberto anunciado pela Google em jun/2025 (CEIA-UFG + Amadeus AI + Nama), derivado do Gemma 3 e publicado no Hugging Face e no Vertex AI Model Garden — nada tem a ver com o tribunal.
  - Benchmark GAIA (General AI Assistants), usado para avaliar agentes.
  - GAIA, agente de e-mails de terceiros (heygaia.io), que suporta OpenAI e Gemini — aparece em buscas como "GAIA LLM".
- **GEMINI** — O "Gemini" do PJe não é o Gemini da Google.
  - Família de LLMs Gemini (Google), servida via Vertex AI ou Workspace.
  - Módulo "GEMINI" do PJe, em produção desde 06/03/2021 com o PJe 2.6 — anterior ao lançamento da família Gemini, dedicado a agrupar processos por similaridade.
  - Expressões como "Gemini do PJe" em páginas de transparência de TRTs: verifique sempre a data e a descrição da função.
- **Minuta / MinutaIA** — Nome de produto comercial e nome de ferramenta institucional se confundem.
  - GAIA Minuta: versão institucional do produto MinutaIA, da startup jAI, contratada pelo TJRS.
  - Outros tribunais contratam o MinutaIA diretamente, sem o guarda-chuva GAIA.

## 7. Como verificar (checklist do agente)

- Catálogo Sinapses / Catálogo Público de IA do CNJ — Busque a solução pelo nome (GAIA Minuta, Galileu, Chat-JT) e leia a ficha de classificação de risco, a versão do modelo e o código de registro.
- Portal de transparência de TIC do tribunal (PDTIC, ETPs e termos de referência) — ETP/TR descrevem a solução contratada e costumam nomear família de modelos e provedor de nuvem. Procure por "Estudo Técnico Preliminar", "Termo de Referência", "PDTIC".
- Contratos e atas de registro de preços (PNCP / Compras.gov.br) — Cruzem o fornecedor (jAI, SERPRO, Google, AWS) com o objeto e o valor; é onde se confirma se o tribunal contrata produto, nuvem ou inference por token.
- Páginas de transparência de TI de TRTs no padrão da Res. 615/2025 — Vários regionais publicam a lista de soluções, custo e contrato (o TRT-7 é o modelo mais completo; use como template de pergunta ao TRT-4).
- TCU — Pesquisa Integrada (acórdãos de auditoria) — Quando houver auditoria, o TCU nomeia o modelo e a forma de acesso com precisão maior que a assessoria de imprensa do tribunal.
- A interface do próprio sistema — A Res. 615/2025 manda exibir "modelos em uso, versão e código de registro" na tela principal do sistema de processamento — é a fonte mais direta e mais ignorada.

## 8. Ressalvas metodológicas

- Nenhuma das asserções abaixo é "dado aberto" do tribunal: vêm de portais de transparência, auditoria do TCU e imprensa especializada. Reabra a fonte antes de citar em peça, notícia ou decisão.
- Versões de modelos mudam mais rápido do que a documentação. Um "Gemini Flash" declarado em 2025 pode ter sido atualizado silenciosamente.
- Tribunal que contrata suíte (Copilot, NotebookLM, Rovo) compra produto, não o LLM: a versão do modelo costuma ficar sob sigilo do fornecedor.
- A resposta "a plataforma usa IA generativa" é comum e não identifica LLM algum — é tratada pelo agente como lacuna, não como evidência.

## 9. Fontes consultadas

- [CNJ — Resolução nº 615, de 11/03/2025 — 2025-03-11](https://atos.cnj.jus.br/files/original1555302025031467d4517244566.pdf) · tipo: normativo · confiabilidade 1.00
- [TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor)](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4) · tipo: auditoria · confiabilidade 0.95
- [TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor)](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4) · tipo: auditoria · confiabilidade 0.95
- [TRT-7 — Transparência e Governança em TIC — 2026-03-06](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas) · tipo: oficial · confiabilidade 0.95
- [TRT-7 — Transparência e Governança em TIC — 2026-03-06](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas) · tipo: oficial · confiabilidade 0.95
- [TRT-7 — Transparência e Governança em TIC — 2026-03-06](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas) · tipo: oficial · confiabilidade 0.95
- [TRT-7 — Transparência e Governança em TIC — 2026-03-06](https://www.trt7.jus.br/index.php/transparencia-secretaria-de-tic/inteligencia-artificial-solucoes-adotadas) · tipo: oficial · confiabilidade 0.93
- [TCU — relatório de auditoria (Pesquisa Integrada, inteiro teor)](https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/galileu%20trt4) · tipo: auditoria · confiabilidade 0.92
- [TRT-4 — PDTIC 2024-2026, Anexo V (portfólio de projetos) — 2024-12-01](https://www.trt4.jus.br/portais/media/503292042/Relat%C3%B3rio%20portf%C3%B3lio%202024-2026%20-%20PROPOSTAS%20PDTIC%202024_2026_DEZEMBRO.2024.pdf) · tipo: oficial · confiabilidade 0.90
- [CSJT — Justiça do Trabalho incorpora inteligência artificial — 2025-02-07](https://www.csjt.jus.br/web/csjt/-/justi%C3%A7a-do-trabalho-incorpora-intelig%C3%AAncia-artificial-com-foco-na-seguran%C3%A7a-e-na-%C3%A9tica) · tipo: oficial · confiabilidade 0.90
- [TRF4 — trilha formativa "A IA chegou. E agora?" — 2025-03-31](https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=5290) · tipo: oficial · confiabilidade 0.90
- [TRF4 — trilha formativa "A IA chegou. E agora?" — 2025-03-31](https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=5290) · tipo: oficial · confiabilidade 0.90
- [TRF3 — Estudo Técnico Preliminar (Lei 14.133/2021) — 2025-08-01](https://web.trf3.jus.br/contas/ContratacoesDiretas/Download/3180?idArquivo=31836) · tipo: oficial · confiabilidade 0.90
- [TRF4 — notícias institucionais — 2023-02-15](https://www.trf4.jus.br/trf4/controlador.php?acao=noticia_visualizar&id_noticia=26704) · tipo: oficial · confiabilidade 0.85
- [TRT-11 — Cartilha de Letramento Digital em Inteligência Artificial — 2025-08-27](https://portal.trt11.jus.br/images/Comunicacao/Noticias/2025/Cartilha_de_Letramento_Digital_em_Intelig%C3%AAncia_Artificial.pdf) · tipo: oficial · confiabilidade 0.85
- [ConJur — 2025-05-06](https://www.conjur.com.br/2025-mai-06/nova-versao-da-ia-da-justica-do-trabalho-tem-integracao-com-o-pje/) · tipo: imprensa · confiabilidade 0.82
- [TRT-15 — Portaria GP nº 070/2025 — 2025-07-16](https://trt15.jus.br/legislacao/normas-institucionais/portarias/portaria-gp-no-0702025) · tipo: oficial · confiabilidade 0.80
- [Baguete (IT for Business) — entrevista com Gabriel Belinazo, assessor de governança da DITIC/TJ-RS — 2025-11-17](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa) · tipo: imprensa · confiabilidade 0.78
- [GZH / Zero Hora — 2025-07-15](https://gauchazh.clicrbs.com.br/geral/noticia/2025/07/producao-de-decisoes-e-analises-de-processos-como-a-inteligencia-artificial-e-utilizada-na-justica-do-rs-cmd3lidjt003e014m9yg13arg.html) · tipo: imprensa · confiabilidade 0.72
- [Correio do Povo — desembargador Antonio Vinicius Amaro da Silveira (Conselho de Inovação e Tecnologia) — 2025-07-18](https://www.correiodopovo.com.br/not%C3%ADcias/cidades/um-m%C3%AAs-ap%C3%B3s-lan%C3%A7amento-oficial-tjrs-avalia-como-positivo-uso-de-ferramentas-de-ia-para-agilizar-processos-1.1629795) · tipo: imprensa · confiabilidade 0.70
- [Baguete (IT for Business) — 2025-11-17](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa) · tipo: imprensa · confiabilidade 0.70
- [Baguete (IT for Business) — 2025-11-17](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa) · tipo: imprensa · confiabilidade 0.70
- [Baguete (IT for Business) — 2025-11-17](https://www.baguete.com.br/noticias/tj-rs-acelera-processos-com-ia-generativa) · tipo: imprensa · confiabilidade 0.70
- [Correio do Povo — 2025-06-12](https://www.correiodopovo.com.br/not%C3%ADcias/cidades/tjrs-lan%C3%A7a-ferramentas-de-ia-para-facilitar-e-acelerar-processos-judiciais-1.1618305) · tipo: imprensa · confiabilidade 0.68
- [Correio do Povo — 2025-11-03](https://www.correiodopovo.com.br/not%C3%ADcias/cidades/tjrs-inaugura-estacao-gaia-hub-de-tecnologia-para-reforcar-a-inovacao-digital-1.1664456) · tipo: imprensa · confiabilidade 0.68
- [GZH / Zero Hora — 2025-11-05](https://gauchazh.clicrbs.com.br/passo-fundo/geral/noticia/2025/11/como-a-ia-ajuda-a-justica-a-acelerar-decisoes-mais-de-740-mil-documentos-foram-gerados-em-quatro-meses-cmhkr5gci00n6013bagydkakw.html) · tipo: imprensa · confiabilidade 0.65
- [g1 RS — 2025-07-15](https://g1.globo.com/rs/rio-grande-do-sul/noticia/2025-07-15/ia-ja-foi-utilizada-mais-de-149-mil-vezes-para-ajudar-a-redigir-decisoes-na-justica-do-rs.ghtml) · tipo: imprensa · confiabilidade 0.60
- [IARGS — A Inteligência Artificial no Judiciário Gaúcho — 2025-10-31](https://iargs.com.br/a-inteligencia-artificial-no-judiciario-gaucho/) · tipo: academico · confiabilidade 0.60
- [Valor Econômico (conteúdo patrocinado/Dino) — nota da assessoria da jAI — 2025-07-01](https://valor.globo.com/patrocinado/dino/noticia/2025-07-01/tjrs-adota-solucao-de-ia-para-criacao-de-minutas-juridicas-1.ghtml) · tipo: fornecedor · confiabilidade 0.50
- [Nossa Rádio (compilando divulgação do TJRS) — 2025-07-16](https://nossaradio.net.br/98/gaia-plataforma-de-ia-do-tjrs-ja-foi-usada-mais-de-149-mil-vezes/) · tipo: imprensa · confiabilidade 0.45
- [Gran Cursos (blog) citando análise do Judiciário — 2026-01-09](https://blog.grancursosonline.com.br/inteligencia-artificial-no-poder-judiciario-respeito-aos-direitos-fundamentais/) · tipo: academico · confiabilidade 0.40

---

_Documento gerado por agente. Toda afirmação acima depende das fontes listadas; nenhuma delas é base legal para decisão._