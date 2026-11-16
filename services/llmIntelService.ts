/**
 * Modo "ao vivo" do Agente de Inteligência sobre LLMs do Judiciário.
 *
 * O corpus curado (data/judiciaryLlmCorpus.ts) é a base auditável. Este módulo é
 * um ACRESCENTADOR: usa o Gemini com grounding na Busca Google para buscar fontes
 * novas, que são convertidas no MESMO formato de evidência do corpus e entram no
 * mesmo scoring — o modelo nunca "decreta" um veredito, ele só traz material bruto
 * para o agente classificar.
 *
 * Diferente de services/geminiService.ts, este arquivo NÃO lança no import quando
 * falta a GEMINI_API_KEY: a UI precisa poder renderizar o agente offline.
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { Evidence, SourceType } from '../agents/types.ts';
import { SOLUTIONS, HOMONYMS } from '../data/judiciaryLlmCorpus.ts';

const MODEL_NAME = 'gemini-2.5-flash';

export const isAiAvailable = (): boolean => Boolean(process.env.API_KEY);

let client: GoogleGenAI | null = null;
const getClient = (): GoogleGenAI => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY ausente: o agente roda no modo corpus (offline). Para pesquisar na web, crie .env.local com a chave.',
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey: key });
  return client;
};

/** Instruções que fazem a diferença na qualidade da coleta. */
const SYSTEM_RULES = `
Você é o módulo de coleta de um agente de inteligência que responde "qual LLM (modelo de
linguagem) cada órgão do Poder Judiciário brasileiro usa". Responda em português.

Regras invioláveis:
1. Toda afirmação precisa de URL e de um trecho LITERAL (até ~320 caracteres) que a sustente.
   Se não achar o trecho, não afirme.
2. Priorize, nesta ordem: (a) catálogo Sinapses / Portal Digital do CNJ; (b) portal de transparência
   e páginas de TI dos tribunais; (c) ETP, termo de referência, edital e contratos (PNCP);
   (d) acórdãos e relatórios do TCU; (e) imprensa especializada em TI/Direito.
   Release de fornecedor e blog de cursinho valem pouco — marque sourceType como "fornecedor"
   ou "academico".
3. Distinga SEMPRE: produto/suíte (Copilot, NotebookLM, Rovo), plataforma de nuvem (Bedrock,
   Vertex AI, SERPRO), provedor de modelo (Google, OpenAI, Anthropic, Meta, Amazon) e MODELO
   concreto (Gemini 2.0 Flash, Claude, GPT-4o, Llama 3.3 70B). "Usa IA generativa" NÃO é resposta.
4. Armadilhas de homônimo já conhecidas:
${HOMONYMS.map((h) => `   - ${h.term}: ${h.risk} (${h.distractors.join(' | ')})`).join('\n')}
5. Não confunda GAIA (plataforma do TJRS) com o modelo aberto GAIA (Gemma 3, UFG/Google), com o
   benchmark GAIA ou com produtos comerciais de terceiros chamados GAIA.
6. "Gemini" em contexto de PJe pode ser o módulo de agrupamento de processos (anterior à família
   Gemini da Google). Verifique a data e a função descrita antes de atribuir o modelo.
7. Nunca invente data, número de contrato, valor ou versão de modelo. Campo desconhecido = string vazia.
8. Procure soluções de: ${SOLUTIONS.map((s) => `${s.name} (${s.courtId})`).join('; ').slice(0, 900)}.
   E cite qualquer solução nova que encontrar nesses mesmos tribunais.
`;

const findingSchema = {
  type: Type.OBJECT,
  properties: {
    court: { type: Type.STRING, description: 'Sigla do órgão, ex.: TJRS, TRF4, TRT-4, CSJT, CNJ.' },
    solution: { type: Type.STRING, description: 'Nome da solução/ferramenta, ex.: GAIA Minuta, Galileu, Chat-JT.' },
    model: { type: Type.STRING, description: 'LLM nomeado pela fonte (ex.: Gemini Flash, Claude, GPT-4o). Vazio se a fonte não nomeia.' },
    provider: { type: Type.STRING, description: 'Provedor do modelo (Google, OpenAI, Anthropic, Meta, Amazon).' },
    deployment: { type: Type.STRING, description: 'Como o modelo chega ao tribunal: Vertex AI, Bedrock, Workspace, SERPRO, on-premise.' },
    quote: { type: Type.STRING, description: 'Trecho LITERAL da fonte que sustenta a afirmação (máx. ~320 caracteres).' },
    url: { type: Type.STRING, description: 'URL da fonte.' },
    source: { type: Type.STRING, description: 'Nome do veículo/órgão que publicou.' },
    publishedOn: { type: Type.STRING, description: 'Data de publicação AAAA-MM-DD; vazio se desconhecida.' },
    sourceType: { type: Type.STRING, enum: ['oficial', 'auditoria', 'normativo', 'imprensa', 'fornecedor', 'academico'] },
    reliability: { type: Type.NUMBER, description: '0..1 — confiança bruta da fonte, conforme a regra 2.' },
    explicitModel: { type: Type.BOOLEAN, description: 'true apenas se a fonte NOMEA um modelo/LLM concreto.' },
    why: { type: Type.STRING, description: 'Uma frase: por que esta evidência importa para a pergunta.' },
  },
  required: ['court', 'solution', 'quote', 'url', 'source', 'sourceType', 'reliability', 'explicitModel'],
};

const liveSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'Três a cinco frases respondendo à consulta com base apenas nas evidências coletadas.' },
    findings: { type: Type.ARRAY, items: findingSchema, description: 'Máximo 8 achados, ordenados pelo peso da fonte.' },
    gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'O que continua sem resposta pública — perguntas prontas para LAI/ouvidoria.' },
    ambiguities: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Homônimos e ambiguidades encontrados na coleta.' },
  },
  required: ['summary', 'findings', 'gaps'],
};

export interface LiveResearch {
  evidence: Evidence[];
  summary: string;
  gaps: string[];
  ambiguities: string[];
}

const SOLUTION_KEYWORDS: { id: string; needles: string[] }[] = [
  { id: 'gaia-plataforma', needles: ['gaia', 'gestao avancada de inteligencia artificial'] },
  { id: 'gaia-minuta', needles: ['gaia minuta', 'minutaias', 'minuta ia', 'jai'] },
  { id: 'gaia-assistente', needles: ['gaia assistente'] },
  { id: 'gaia-explica-ai-tche', needles: ['explica ai'] },
  { id: 'gaia-copilot', needles: ['gaia copilot', 'copilot'] },
  { id: 'gaia-peticao-inicial', needles: ['peticao inicial'] },
  { id: 'gaia-salus', needles: ['salus'] },
  { id: 'gaia-sei', needles: ['gaia sei'] },
  { id: 'gaia-audiencias', needles: ['audiencia'] },
  { id: 'galileu-trt4', needles: ['galileu'] },
  { id: 'gemini-pje-trt4', needles: ['gemini'] },
  { id: 'jf4r-gemini-notebooklm', needles: ['notebooklm', 'notebook lm', 'gemini'] },
  { id: 'gralha-trf4', needles: ['gralha'] },
  { id: 'tramitacao-agil', needles: ['tramitacao agil'] },
  { id: 'chat-jt', needles: ['chat-jt', 'chatjt', 'chat jt'] },
  { id: 'gemini-pje-nacional', needles: ['gemini do pje'] },
  { id: 'concilia-jt', needles: ['concilia-jt', 'concilia'] },
  { id: 'sinapses', needles: ['sinapses'] },
  { id: 'stj-logos', needles: ['logos'] },
  { id: 'trf3-sigma', needles: ['sigma'] },
  { id: 'trt7-google-workspace', needles: ['workspace'] },
  { id: 'trt7-rovo', needles: ['rovo'] },
  { id: 'trt11-assistente', needles: ['trt11', 'trt-11'] },
];

const MODEL_KEYWORDS: { id: string; needles: string[] }[] = [
  { id: 'gemini-flash', needles: ['gemini flash', 'gemini 2.0 flash', '2.0 flash', 'gemini 2.5 flash'] },
  { id: 'gemini-pro', needles: ['gemini pro', '1.5 pro', '2.5 pro'] },
  { id: 'gemini', needles: ['gemini'] },
  { id: 'notebooklm', needles: ['notebooklm', 'notebook lm'] },
  { id: 'claude', needles: ['claude', 'anthropic', 'sonnet'] },
  { id: 'gpt-4o', needles: ['gpt-4o', 'gpt4o', 'gpt 4o', 'gpt-4', 'openai', 'chatgpt'] },
  { id: 'amazon-nova', needles: ['nova', 'amazon nova'] },
  { id: 'llama-3-1-405b', needles: ['llama 3.1', '405b'] },
  { id: 'llama-3-3-70b', needles: ['llama 3.3', '70b'] },
  { id: 'llama-3-1-405b', needles: ['llama'] },
  { id: 'ms-copilot', needles: ['copilot'] },
  { id: 'atlassian-rovo', needles: ['rovo'] },
  { id: 'gemma-3', needles: ['gemma'] },
];

const norm = (value: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const firstMatch = <T extends { id: string; needles: string[] }>(haystack: string, table: T[]): T | undefined =>
  table.find((entry) => entry.needles.some((needle) => haystack.includes(needle)));

/** Converte um achado do modelo em evidência do formato do corpus. */
const toEvidence = (finding: Record<string, unknown>, index: number): Evidence => {
  const haystack = norm(`${finding.solution ?? ''} ${finding.model ?? ''} ${finding.quote ?? ''} ${finding.deployment ?? ''}`);
  const solutionHit = firstMatch(haystack, SOLUTION_KEYWORDS);
  const modelHit = firstMatch(haystack, MODEL_KEYWORDS);
  const type = (['oficial', 'auditoria', 'normativo', 'imprensa', 'fornecedor', 'academico'] as SourceType[]).includes(
    finding.sourceType as SourceType,
  )
    ? (finding.sourceType as SourceType)
    : 'imprensa';
  const reliability = Math.min(0.95, Math.max(0.2, Number(finding.reliability) || 0.5));
  return {
    id: `live-${Date.now()}-${index}`,
    claim: String(finding.why ?? `${finding.court ?? '?'} · ${finding.solution ?? '?'} · ${finding.model || 'modelo não nomeado'}`),
    quote: String(finding.quote ?? '').slice(0, 600),
    url: String(finding.url ?? ''),
    source: String(finding.source ?? 'pesquisa ao vivo (Gemini + Busca Google)'),
    publishedOn: /^\d{4}-\d{2}-\d{2}$/.test(String(finding.publishedOn ?? '')) ? String(finding.publishedOn) : '',
    type,
    reliability,
    explicitModel: Boolean(finding.explicitModel) && Boolean(finding.model),
    solutionIds: solutionHit ? [solutionHit.id] : [],
    modelIds: modelHit && Boolean(finding.model) ? [modelHit.id] : [],
    topics: ['ao-vivo'],
  };
};

const safeNumber = (n: number) => Math.max(0, Math.min(1000, n));

export interface ResearchOptions {
  /** Quantas buscas o modelo pode encadear (custo/latência). */
  maxFindings?: number;
  onNotice?: (message: string) => void;
}

/** Executa a coleta ancorada na web e devolve evidências no formato do corpus. */
export async function runGroundedResearch(query: string, options: ResearchOptions = {}): Promise<LiveResearch> {
  const ai = getClient();
  const maxFindings = safeNumber(options.maxFindings ?? 6);
  options.onNotice?.(`Consultando a web com grounding (Busca Google) sobre: "${query || 'tudo'}"`);

  const prompt = `Consulta a investigar: "${query || 'Panorama geral: quais LLMs alimentam as soluções de IA generativa de TJRS (GAIA), TRF4/JF4R e da Justiça do Trabalho (TRT/CSJT)'}".

Faça buscas na web, leia as fontes e devolva até ${maxFindings} achados no formato pedido.
Cada achado deve ser UMA afirmação sustentada por UMA URL com citação literal. Prefira documentos
que NOMEEIAM o modelo (ex.: "o sistema opera apenas utilizando o Gemini Flash"). Se um tribunal só
diz "IA generativa", registre isso como lacuna, não como achado.`;

  let text = '';
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_RULES,
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: liveSchema,
        temperature: 0.15,
      },
    });
    text = (response.text ?? '').trim();
  } catch (error) {
    // Alguns planos rejeitam schema + busca juntos: tenta de novo sem resposta estruturada.
    options.onNotice?.('Saída estruturada recusada; repetindo a coleta em texto simples.');
    const fallback = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `${prompt}\n\nResponda APENAS com JSON válido no formato {"summary":string,"findings":[...],"gaps":[string],"ambiguities":[string]}.`,
      config: { systemInstruction: SYSTEM_RULES, tools: [{ googleSearch: {} }], temperature: 0.15 },
    });
    text = (fallback.text ?? '').trim();
  }

  const payload = parseJsonish(text);
  const findings = Array.isArray(payload.findings) ? payload.findings.slice(0, maxFindings) : [];
  const evidence = findings
    .map((f: Record<string, unknown>, i: number) => toEvidence(f, i))
    .filter((e: Evidence) => e.quote.length > 20 && e.url.startsWith('http'));

  return {
    evidence,
    summary: String(payload.summary ?? '').trim(),
    gaps: Array.isArray(payload.gaps) ? payload.gaps.map(String) : [],
    ambiguities: Array.isArray(payload.ambiguities) ? payload.ambiguities.map(String) : [],
  };
}

/** Aceita JSON puro, JSON em cerca de código ou JSON com vírgula pendente. */
function parseJsonish(raw: string): Record<string, unknown> {
  if (!raw) return {};
  const candidates = [raw, raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()];
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) candidates.push(raw.slice(start, end + 1), raw.slice(start, end + 1).replace(/,(\s*[}\]])/g, '$1'));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      /* tenta o próximo */
    }
  }
  return {};
}

/** Resumo das fontes que o grounding usou (para citar na UI). */
export const corpusStats = () => ({ version: 'live', model: MODEL_NAME });
