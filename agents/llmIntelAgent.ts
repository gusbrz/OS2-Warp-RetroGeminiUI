/**
 * Agente de inteligência sobre LLMs do Poder Judiciário.
 *
 * Pipeline determinístico em passos (auditável, roda offline, sem chave de API):
 *
 *   interpretar-consulta → planejar-investigacao → varrer-catalogo → reunir-evidencia
 *   → classificar-fontes → atribuir-vereditos → inferencia-contextual
 *   → cobertura-e-lacunas → sintetizar-relatorio
 *
 * Cada passo emite eventos para a UI (trace do agente) e só produz um veredito
 * quando existe evidência citável. A régua epistêmica é deliberadamente dura:
 *
 *   confirmado  → fonte institucional/de controle (portal do tribunal, TCU, normativo)
 *                  NOMEIA o modelo.
 *   provavel    → imprensa especializada ou fonte oficial nomeia o modelo, mas sem
 *                  documento institucional que o confirme, ou só corroborado 1x.
 *   indicio     → fonte secundária/fraca nomeia o modelo, ou inferência contextual
 *                  a partir do contrato institucional do órgão.
 *   nao-declarado → a organização afirma "IA generativa" sem dizer qual LLM.
 */

import type {
  AgentReport,
  AgentStep,
  AiSolution,
  ConfidenceLevel,
  Court,
  Evidence,
  Homonym,
  Judgement,
  LlmModel,
  SourceType,
} from './types.ts';

import {
  CAVEATS,
  CORPUS_RETRIEVED_ON,
  CORPUS_VERSION,
  COURT_BY_ID,
  COURTS,
  EVIDENCE,
  HOMONYMS,
  MODEL_BY_ID,
  SOLUTIONS,
  VERIFICATION_SOURCES,
} from '../data/judiciaryLlmCorpus.ts';

/** Fontes que carregam peso institucional (podem "confirmar" um modelo). */
const CANONICAL_TYPES: SourceType[] = ['oficial', 'auditoria', 'normativo'];
export { CANONICAL_TYPES as CANONICAL_SOURCE_TYPES };

/** Peso da composição do score. */
const WEIGHTS = {
  reliability: 0.42,
  corroboration: 0.18,
  recency: 0.18,
  explicitness: 0.22,
  canonicalBonus: 0.05,
} as const;

export const LEVELS: ConfidenceLevel[] = ['confirmado', 'provavel', 'indicio', 'nao-declarado'];

export interface AgentEvent {
  type: 'step-start' | 'step-end' | 'notice';
  step: AgentStep;
  message?: string;
}

export interface AgentInput {
  /** Pergunta livre do usuário, ex.: "qual LLM o TJRS usa na GAIA Minuta?". */
  query?: string;
  /** Filtros explícitos vindos da interface. */
  courtIds?: string[];
  modelIds?: string[];
  levelFilter?: ConfidenceLevel[];
  /** Evidências extras (modo ao vivo com Gemini) entram no mesmo scoring. */
  extraEvidence?: Evidence[];
  onEvent?: (event: AgentEvent) => void;
  /** Permite "pensar em voz alta" na UI; no CLI vira no-op. */
  pause?: (ms: number) => Promise<void>;
}

export interface ParsedQuery {
  raw: string;
  courts: string[];
  models: string[];
  solutions: string[];
  homonyms: string[];
  terms: string[];
}

const MODEL_ALIASES: Record<string, string[]> = {
  gemini: ['gemini'],
  'gemini-flash': ['gemini flash', 'gemini 2.0', '2.0 flash', 'flash'],
  'gemini-pro': ['gemini pro', '1.5 pro', '2.5 pro', 'gemini advanced'],
  notebooklm: ['notebooklm', 'notebook lm'],
  claude: ['claude', 'anthropic', 'sonnet', 'opus'],
  'gpt-4o': ['gpt-4o', 'gpt4o', 'gpt 4o', 'chatgpt', 'openai', 'gpt-4', 'gpt'],
  'amazon-nova': ['nova', 'amazon nova', 'bedrock'],
  'llama-3-1-405b': ['llama 3.1', '405b', 'llama'],
  'llama-3-3-70b': ['llama 3.3', '70b'],
  'ms-copilot': ['copilot', 'microsoft 365', 'office'],
  'atlassian-rovo': ['rovo', 'atlassian'],
  'gemma-3': ['gemma'],
  undisclosed: ['nao declarado', 'modelo desconhecido'],
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.,:;/()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string): string[] => normalize(value).split(' ').filter((t) => t.length > 2);

/** Resolve a consulta em entidades do domínio (tribunais, modelos, soluções, homônimos). */
export function parseQuery(query: string, courts: Court[] = COURTS, solutions: AiSolution[] = SOLUTIONS): ParsedQuery {
  const text = normalize(query);
  const words = tokenize(query);
  // "TJ/RS" e "TRF/4" viram tjrs / trf4 — o usuário grafou com barra, o catálogo não.
  const merged = words.map((w) => w.replace(/[^a-z0-9]/g, ''));
  const courts_ = new Set<string>();
  const models = new Set<string>();
  const solutionIds = new Set<string>();
  const homonyms = new Set<string>();

  const mentions = (alias: string): boolean => {
    const key = normalize(alias);
    if (!key) return false;
    if (key.length > 4) return text.includes(key);
    return words.includes(key) || merged.includes(key);
  };

  const bareTrt = text === 'trt' || text === 'trts' || words.includes('trt') || text.includes('trabalho');
  const bareTrf = text === 'trf' || text === 'trfs' || words.includes('trf');

  for (const court of courts) {
    if ([court.acronym, court.name, ...court.aliases].some(mentions)) courts_.add(court.id);
    // "TRT" sem número: o usuário costuma falar do regional local + esteira nacional.
    if (bareTrt && (court.branch === 'trabalho' || court.id === 'csjt')) courts_.add(court.id);
    if (bareTrf && court.branch === 'federal') courts_.add(court.id);
  }

  for (const [modelId, aliases] of Object.entries(MODEL_ALIASES)) {
    if (aliases.some((alias) => (alias.includes(' ') ? text.includes(alias) : words.includes(alias)))) {
      models.add(modelId);
    }
  }

  for (const solution of solutions) {
    const name = normalize(solution.name);
    const shortName = name.split('—')[0].trim();
    if (shortName && text.includes(shortName)) solutionIds.add(solution.id);
    else if (words.some((w) => w.length > 4 && shortName.includes(w))) solutionIds.add(solution.id);
  }

  for (const homonym of HOMONYMS) {
    if (text.includes(normalize(homonym.term))) homonyms.add(homonym.term);
  }

  return {
    raw: query,
    courts: [...courts_],
    models: [...models],
    solutions: [...solutionIds],
    homonyms: [...homonyms],
    terms: words,
  };
}

const monthsSince = (isoDate: string, now = CORPUS_RETRIEVED_ON): number | null => {
  if (!isoDate) return null;
  const then = Date.parse(isoDate);
  if (Number.isNaN(then)) return null;
  return Math.max(0, (Date.parse(now) - then) / (1000 * 60 * 60 * 24 * 30.44));
};

const recencyOf = (evidence: Evidence[]): number => {
  const ages = evidence.map((item) => monthsSince(item.publishedOn)).filter((v): v is number => v !== null);
  if (ages.length === 0) return 0.5; // data não confirmada na coleta → neutro
  const freshest = Math.min(...ages);
  return Math.min(1, Math.max(0.2, 1 - freshest / 36));
};

const corroborationOf = (evidence: Evidence[]): number => {
  const docs = new Set(evidence.map((item) => item.url)).size;
  const sources = new Set(evidence.map((item) => item.source)).size;
  return Math.min(1, Math.min(1, docs / 2) * 0.5 + Math.min(1, sources / 2) * 0.5);
};

interface ScoreInput {
  solution: AiSolution;
  model: LlmModel;
  evidence: Evidence[];
}

function gradePair({ solution, model, evidence }: ScoreInput): Omit<Judgement, 'courtAcronym'> & { rawScore: number } {
  const bestReliability = Math.max(...evidence.map((e) => e.reliability), 0);
  const canonical = evidence.filter((e) => CANONICAL_TYPES.includes(e.type));
  const canonicalExplicit = canonical.some((e) => e.explicitModel);
  const named = evidence.some((e) => e.explicitModel);
  const explicitness = named ? 1 : 0.45;
  const recency = recencyOf(evidence);
  const corroboration = corroborationOf(evidence);
  const bonus = canonical.length > 0 ? WEIGHTS.canonicalBonus : 0;
  // Evidência "de plataforma" (cobre várias soluções de uma vez) não pode sustentar
  // o mesmo veredito forte que uma fonte específica da solução sustentaria.
  const platformScoped = evidence.every((e) => e.solutionIds.length > 2);

  const rawScore =
    WEIGHTS.reliability * bestReliability +
    WEIGHTS.corroboration * corroboration +
    WEIGHTS.recency * recency +
    WEIGHTS.explicitness * explicitness +
    bonus -
    (platformScoped ? 0.08 : 0);
  const score = Number(Math.min(0.99, Math.max(0, rawScore)).toFixed(3));

  let level: ConfidenceLevel = 'nao-declarado';
  if (score >= 0.72 && canonicalExplicit && named) level = 'confirmado';
  else if (score >= 0.55 && named) level = 'provavel';
  else if (score >= 0.38) level = 'indicio';
  if (level === 'confirmado' && platformScoped) level = 'provavel';
  // Fonte coletiva (descreve o conjunto) nunca "confirma" nem "torna provável" uma
  // ferramenta específica: no máximo um indício a ser checado.
  if (platformScoped && solution.category !== 'plataforma' && level === 'provavel') {
    level = 'indicio';
  }

  const providers = new Set(evidence.filter((e) => e.explicitModel).map((e) => e.modelIds.length ? MODEL_BY_ID[e.modelIds[0]]?.provider ?? e.modelIds[0] : '—'));
  const notes: string[] = [];
  if (!evidence.every((e) => e.publishedOn)) {
    notes.push('Data de pelo menos uma fonte não foi confirmada na coleta — recência tratada como neutra.');
  }
  if (providers.size >= 3) {
    notes.push(
      'Multi-modelo declarado: o tribunal cita vários provedores (abordagem agnóstica/avaliação comparativa). A versão atendida em cada chamada não é pública.',
    );
  }
  if (solution.category === 'suite') {
    notes.push('Contratação de suíte de produtividade: o LLM é embutido no produto e a versão raramente é divulgada pelo fornecedor.');
  }
  if (solution.category === 'modulo') {
    notes.push('Módulo de sistema processual: verificar se há LLM de verdade aqui ou apenas técnicas de similaridade/embedding.');
  }
  if (level !== 'confirmado' && named) {
    notes.push('Modelo nomeado apenas por fonte sem peso institucional — confirmar no portal do tribunal ou no registro Sinapses.');
  }
  if (!named) {
    notes.push('Nenhuma fonte nomeia o modelo: a associação vem do fornecedor/produto citado (ex.: "a IA da Microsoft"). Por isso o nível fica em "indício".');
  }
  if (platformScoped) {
    notes.push(
      'Atribuição vinda de fonte que descreve o CONJUNTO de soluções (plataforma), não esta ferramenta em particular: o tribunal pode rotear modelos diferentes por agente. Nível rebaixado.',
    );
  }

  return {
    solutionId: solution.id,
    solutionName: solution.name,
    courtId: solution.courtId,
    modelId: model.id,
    modelLabel: model.label,
    provider: model.provider,
    level,
    score,
    rawScore,
    evidenceIds: evidence.map((e) => e.id),
    independentSources: new Set(evidence.map((e) => e.source)).size,
    conflicting: providers.size >= 2,
    deployment: solution.infrastructure,
    notes,
  };
}

/** Modelos que uma fonte anexa nominalmente a esta solução (respeitando `modelLinks`). */
const linkedModels = (evidence: Evidence, solutionId: string): string[] => {
  if (evidence.modelLinks) {
    return evidence.modelLinks.find((link) => link.solutionId === solutionId)?.modelIds ?? [];
  }
  return evidence.solutionIds.includes(solutionId) ? evidence.modelIds : [];
};

const attributedModels = (solution: AiSolution, evidence: Evidence[]): Set<string> =>
  new Set(evidence.flatMap((e) => linkedModels(e, solution.id)));

function matchesSolution(solution: AiSolution, parsed: ParsedQuery, pool: Evidence[] = EVIDENCE): boolean {
  const hasFilter = parsed.courts.length > 0 || parsed.solutions.length > 0 || parsed.models.length > 0;
  if (!hasFilter) return true;
  const courtOk = parsed.courts.length === 0 || parsed.courts.includes(solution.courtId);
  const solutionOk = parsed.solutions.length === 0 || parsed.solutions.includes(solution.id);
  const linked = attributedModels(solution, evidenceFor(solution, pool));
  const modelOk =
    parsed.models.length === 0 ||
    parsed.models.some((m) => solution.declaredModelIds.includes(m)) ||
    parsed.models.some((m) => linked.has(m));
  if (parsed.courts.length > 0 && parsed.solutions.length > 0) return courtOk && solutionOk;
  if (parsed.courts.length > 0 && parsed.models.length > 0) return courtOk && modelOk;
  return (courtOk && solutionOk) || (parsed.models.length > 0 && courtOk && modelOk);
}

function evidenceFor(solution: AiSolution, pool: Evidence[]): Evidence[] {
  const byId = new Map(pool.map((e) => [e.id, e]));
  const linked = solution.evidenceIds.map((id) => byId.get(id)).filter((e): e is Evidence => Boolean(e));
  const reverse = pool.filter((e) => e.solutionIds.includes(solution.id) && !solution.evidenceIds.includes(e.id));
  return [...linked, ...reverse];
}

const makeStep = (id: string, label: string): AgentStep => ({
  id,
  label,
  detail: '',
  status: 'pendente',
  startedAt: Date.now(),
});

/** Executa o agente. Os passos são síncronos, mas emitidos assincronamente para a UI acompanhar. */
export async function runAgent(input: AgentInput = {}): Promise<AgentReport> {
  const { query = '', courtIds = [], modelIds = [], levelFilter = [], extraEvidence = [], onEvent, pause } = input;
  const nap = pause ?? (async () => {});
  const steps: AgentStep[] = [];

  const emit = async (step: AgentStep, detail: string, status: AgentStep['status'], count?: number) => {
    step.detail = detail;
    step.status = status;
    step.count = count;
    step.finishedAt = Date.now();
    onEvent?.({ type: 'step-end', step, message: detail });
  };

  const start = async (id: string, label: string, detail: string) => {
    const step = makeStep(id, label);
    step.status = 'executando';
    step.detail = detail;
    steps.push(step);
    onEvent?.({ type: 'step-start', step, message: detail });
    await nap(260);
    return step;
  };

  const evidencePool = [...EVIDENCE, ...extraEvidence];

  // 1 — interpretar a consulta
  const s1 = await start('interpretar-consulta', 'Interpretar consulta', `Normalizando "${query || 'busca ampla'}" e resolvendo entidades do domínio.`);
  const parsed = parseQuery(query);
  if (courtIds.length) parsed.courts = [...new Set([...parsed.courts, ...courtIds])];
  if (modelIds.length) parsed.models = [...new Set([...parsed.models, ...modelIds])];
  const homonymHits = HOMONYMS.filter((h) => parsed.terms.includes(normalize(h.term)) || parsed.homonyms.includes(h.term));
  await emit(
    s1,
    `Tribunais: ${parsed.courts.map((c) => COURT_BY_ID[c].acronym).join(', ') || 'todos'} · Modelos: ${
      parsed.models.length ? parsed.models.join(', ') : 'sem restrição'
    } · Soluções: ${parsed.solutions.length || 0}`,
    'concluido',
    parsed.courts.length + parsed.models.length + parsed.solutions.length,
  );
  if (homonymHits.length) {
    const warn = makeStep('homonimos', 'Desambiguar nomes homônimos');
    warn.status = 'aviso';
    warn.detail = `${homonymHits.map((h) => h.term).join(', ')}: ${homonymHits[0].risk}`;
    steps.push(warn);
    onEvent?.({ type: 'notice', step: warn, message: warn.detail });
    await nap(200);
  }

  // 2 — planejar a investigação
  const s2 = await start('planejar-investigacao', 'Planejar fontes a consultar', 'Definindo onde procurar antes de afirmar qualquer coisa.');
  await emit(s2, `${VERIFICATION_SOURCES.length} classes de fonte priorizadas (canônicas antes de imprensa).`, 'concluido', VERIFICATION_SOURCES.length);

  // 3 — varrer o catálogo de soluções
  const s3 = await start('varrer-catalogo', 'Varrer catálogo de soluções', 'Filtrando soluções de IA por tribunal, nome e modelo.');
  const scoped = SOLUTIONS.filter((solution) => !solution.informational && matchesSolution(solution, parsed, evidencePool));
  await emit(
    s3,
    `${scoped.length} de ${SOLUTIONS.length} soluções no escopo${parsed.courts.length ? ` (${parsed.courts.map((c) => COURT_BY_ID[c].acronym).join(', ')})` : ''}.`,
    scoped.length ? 'concluido' : 'vazio',
    scoped.length,
  );

  // 4 — reunir evidências
  const s4 = await start('reunir-evidencia', 'Reunir evidências citáveis', 'Agregando fontes por solução e contando documentos independentes.');
  const evidenceBySolution = new Map<string, Evidence[]>();
  let evidenceCount = 0;
  for (const solution of scoped) {
    const list = evidenceFor(solution, evidencePool);
    evidenceBySolution.set(solution.id, list);
    evidenceCount += list.length;
  }
  await emit(
    s4,
    evidenceCount ? `${evidenceCount} evidências anexadas; ${scoped.filter((s) => (evidenceBySolution.get(s.id) ?? []).length === 0).length} solução(ões) sem fonte.` : 'Nenhuma evidência no escopo.',
    evidenceCount ? 'concluido' : 'vazio',
    evidenceCount,
  );

  // 5 — classificar fontes
  const s5 = await start('classificar-fontes', 'Classificar e pesar as fontes', 'Separando portal oficial, auditoria, normativo, imprensa e release de fornecedor.');
  const usedEvidence = new Map<string, Evidence>();
  for (const list of evidenceBySolution.values()) for (const e of list) usedEvidence.set(e.id, e);
  const byType = new Map<SourceType, number>();
  for (const e of usedEvidence.values()) byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
  await emit(
    s5,
    [...byType.entries()].map(([type, n]) => `${type}: ${n}`).join(' · ') || 'sem fontes',
    byType.size ? 'concluido' : 'vazio',
    usedEvidence.size,
  );
  const undated = [...usedEvidence.values()].filter((e) => !e.publishedOn);
  if (undated.length) {
    const warn = makeStep('datas', 'Fontes sem data confirmada');
    warn.status = 'aviso';
    warn.detail = `${undated.length} fonte(s) sem data de publicação confirmada: recência tratada como neutra no score.`;
    steps.push(warn);
    onEvent?.({ type: 'notice', step: warn });
  }

  // 6 — atribuir vereditos
  const s6 = await start('atribuir-vereditos', 'Atribuir vereditos por par solução × modelo', 'Calculando score de evidência e nível de asserção.');
  const judgements: Judgement[] = [];
  for (const solution of scoped) {
    const evidence = evidenceBySolution.get(solution.id) ?? [];
    if (!evidence.length) continue;
    const modelIdsForSolution = new Set<string>([...solution.declaredModelIds, ...attributedModels(solution, evidence)].filter((id) => id !== 'undisclosed'));
    if (parsed.models.length) {
      for (const id of [...modelIdsForSolution]) if (!parsed.models.includes(id) && !parsed.models.some((p) => MODEL_BY_ID[p]?.provider === MODEL_BY_ID[id]?.provider)) modelIdsForSolution.delete(id);
    }
    for (const modelId of modelIdsForSolution) {
      const model = MODEL_BY_ID[modelId];
      if (!model) continue;
      // Só há veredito quando alguma fonte ANEXA este modelo a esta solução.
      const direct = evidence.filter((e) => linkedModels(e, solution.id).includes(modelId));
      const declared = solution.declaredModelIds.includes(modelId);
      if (!direct.length && !declared) continue;
      const graded = gradePair({ solution, model, evidence: direct.length ? direct : evidence });
      if (graded.level === 'nao-declarado' && declared) graded.level = 'indicio';
      if (!direct.length && declared) {
        graded.notes.push('Modelo listado na ficha institucional da solução, sem fonte anexando-o nominalmente a esta evidência.');
        graded.score = Math.min(graded.score, 0.54);
      }
      judgements.push({ ...graded, courtAcronym: COURT_BY_ID[solution.courtId].acronym });
    }
  }
  let finalJudgements = judgements.filter((j) => j.level !== 'nao-declarado');
  if (levelFilter.length) finalJudgements = finalJudgements.filter((j) => levelFilter.includes(j.level));
  finalJudgements.sort((a, b) => b.score - a.score || a.solutionName.localeCompare(b.solutionName));
  await emit(
    s6,
    finalJudgements.length
      ? `${finalJudgements.filter((j) => j.level === 'confirmado').length} confirmado(s), ${finalJudgements.filter((j) => j.level === 'provavel').length} provável(is), ${finalJudgements.filter((j) => j.level === 'indicio').length} indício(s).`
      : 'Nenhum par solução × modelo passou no corte mínimo de evidência.',
    finalJudgements.length ? 'concluido' : 'vazio',
    finalJudgements.length,
  );

  // 7 — inferência contextual (para soluções sem declaração de modelo)
  const s7 = await start('inferencia-contextual', 'Inferir a partir do contrato institucional', 'Sem declaração específica, o agente olha o que o órgão contratou para a mesma infraestrutura.');
  let inferred = 0;
  const homonymSolutions = new Set(
    EVIDENCE.filter((e) => e.topics?.includes('homonimo')).flatMap((e) => e.solutionIds),
  );
  // Só se infere a partir de LLMs de verdade: suítes (Copilot, NotebookLM, Rovo) não são
  // "o modelo" de outro agente — são produtos que embutem um modelo.
  const isInferrableModel = (modelId: string) => {
    const kind = MODEL_BY_ID[modelId]?.kind;
    return kind === 'llm' || kind === 'modelo-aberto';
  };
  const inferenceBlocks: string[] = [];
  for (const solution of scoped) {
    if (solution.informational) continue;
    if (finalJudgements.some((j) => j.solutionId === solution.id)) continue;
    const court = COURT_BY_ID[solution.courtId];
    // Sócios de inferência: mesmo tribunal e, na Justiça do Trabalho, a esteira nacional do CSJT.
    const siblings = SOLUTIONS.filter(
      (s) => s.id !== solution.id && !s.informational && (s.courtId === solution.courtId || (court?.branch === 'trabalho' && s.courtId === 'csjt')),
    );
    if (homonymSolutions.has(solution.id)) {
      inferenceBlocks.push(`${solution.name}: homônimo de nome ("Gemini"/"GAIA") — inferir o modelo a partir do nome seria exatamente o erro que o agente existe para evitar.`);
      continue;
    }
    const candidateEvidence = siblings.flatMap((s) => {
      const list = (evidenceBySolution.get(s.id) ?? EVIDENCE.filter((e) => e.solutionIds.includes(s.id))).filter(
        (e) => e.explicitModel && linkedModels(e, s.id).some(isInferrableModel),
      );
      const sharesInfra =
        solution.infrastructure.length === 0 ||
        court?.branch === 'trabalho' ||
        solution.infrastructure.some((infra) => s.infrastructure.some((other) => normalize(infra) === normalize(other)));
      return sharesInfra ? list.map((e) => ({ evidence: e, from: s })) : [];
    });
    if (!candidateEvidence.length) continue;
    const counts = new Map<string, number>();
    for (const { evidence, from } of candidateEvidence) {
      for (const modelId of linkedModels(evidence, from.id)) if (isInferrableModel(modelId)) counts.set(modelId, (counts.get(modelId) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const [topEntry, second] = ranked;
    // Só se infere quando há um modelo dominante: empate = o órgão é multi-modelo e o agente não adivinha.
    if (second && second[1] >= topEntry[1]) {
      inferenceBlocks.push(`${solution.name}: cardápio multi-modelo do órgão (${ranked.map(([id]) => MODEL_BY_ID[id]?.label ?? id).join(', ')}) impede apontar um único modelo.`);
      continue;
    }
    const model = MODEL_BY_ID[topEntry[0]];
    if (!model || model.id === 'undisclosed') continue;
    finalJudgements.push({
      solutionId: solution.id,
      solutionName: solution.name,
      courtId: solution.courtId,
      courtAcronym: court?.acronym ?? solution.courtId,
      modelId: model.id,
      modelLabel: model.label,
      provider: model.provider,
      level: 'indicio',
      score: 0.42,
      evidenceIds: candidateEvidence.slice(0, 3).map(({ evidence }) => evidence.id),
      independentSources: new Set(candidateEvidence.map(({ evidence }) => evidence.source)).size,
      conflicting: false,
      deployment: solution.infrastructure,
      notes: [
        `INFERÊNCIA CONTEXTUAL (hipótese, não fato): nenhuma fonte declara o modelo desta solução. O indício vem de ${[...new Set(candidateEvidence.map(({ from }) => from.name.split('—')[0].trim()))].join(', ')} — mesma infraestrutura/contrato institucional do órgão. Pergunte ao tribunal.`,
      ],
    });
    inferred++;
  }
  if (inferenceBlocks.length) {
    const block = makeStep('inferencia-bloqueada', 'Inferências recusadas pelo agente');
    block.status = 'aviso';
    block.detail = inferenceBlocks.join(' | ');
    steps.push(block);
    onEvent?.({ type: 'notice', step: block, message: block.detail });
  }
  await emit(
    s7,
    inferred ? `${inferred} solução(ões) sem declaração própria recebeu(ram) indício contextual (nível "indício").` : 'Nada a inferir: todas as soluções do escopo têm declaração própria ou nenhuma fonte correlata.',
    inferred ? 'aviso' : 'vazio',
    inferred,
  );

  // 8 — cobertura e lacunas
  const s8 = await start('cobertura-lacunas', 'Medir cobertura e listar lacunas', 'Quantas soluções têm modelo identificado e o que falta provar.');
  const coverage = COURTS.filter((court) => scoped.some((s) => s.courtId === court.id)).map((court) => {
    const list = scoped.filter((s) => s.courtId === court.id);
    const withEvidence = list.filter((s) => (evidenceBySolution.get(s.id) ?? []).some((e) => e.explicitModel));
    const confirmed = list.filter((s) => finalJudgements.some((j) => j.solutionId === s.id && j.level === 'confirmado'));
    return {
      courtId: court.id,
      courtAcronym: court.acronym,
      solutions: list.length,
      withModelEvidence: withEvidence.length,
      confirmed: confirmed.length,
      ratio: list.length ? Number(((withEvidence.length / list.length) * 100).toFixed(0)) : 0,
    };
  });
  const gaps = scoped
    .filter((solution) => !solution.informational && !finalJudgements.some((j) => j.solutionId === solution.id))
    .map((solution) => ({
      solutionId: solution.id,
      solutionName: solution.name,
      courtAcronym: COURT_BY_ID[solution.courtId].acronym,
      questions: solution.openQuestions ?? [],
    }));
  await emit(
    s8,
    `Cobertura média ${coverage.length ? Math.round(coverage.reduce((acc, c) => acc + c.ratio, 0) / coverage.length) : 0}% · ${gaps.length} lacuna(s) com perguntas de verificação prontas.`,
    gaps.length ? 'aviso' : 'concluido',
    gaps.length,
  );

  // 9 — síntese
  const s9 = await start('sintetizar-relatorio', 'Sintetizar relatório', 'Redigindo conclusões, ressalvas e checklist de verificação.');
  const narrative = buildNarrative(parsed, finalJudgements, gaps, coverage);
  await emit(s9, 'Relatório pronto: conclusões, lacunas e checklist de verificação anexados.', 'concluido', finalJudgements.length);

  return {
    query,
    generatedAt: new Date().toISOString(),
    mode: extraEvidence.length ? 'corpus+gemini' : 'corpus',
    steps,
    judgements: finalJudgements,
    coverage,
    gaps,
    homonyms: homonymHits.length ? homonymHits : HOMONYMS,
    sourcesUsed: [...usedEvidence.values()].sort((a, b) => b.reliability - a.reliability),
    narrative,
    verification: VERIFICATION_SOURCES.map((v) => `${v.label} — ${v.how}`),
    stats: {
      solutionsScanned: scoped.length,
      evidenceScanned: usedEvidence.size,
      matches: finalJudgements.length,
    },
  };
}

function buildNarrative(
  parsed: ParsedQuery,
  judgements: Judgement[],
  gaps: { solutionName: string; courtAcronym: string }[],
  coverage: { courtAcronym: string; ratio: number; solutions: number }[],
): string {
  const scope = parsed.courts.length ? parsed.courts.map((c) => COURT_BY_ID[c]?.acronym ?? c).join(', ') : 'todo o Judiciário mapeado';
  const confirmed = judgements.filter((j) => j.level === 'confirmado');
  const probable = judgements.filter((j) => j.level === 'provavel');
  const lines: string[] = [];

  lines.push(`Escopo investigado: ${scope}. Corpus ${CORPUS_VERSION} (coletado em ${CORPUS_RETRIEVED_ON}).`);

  if (confirmed.length) {
    lines.push(
      `Com peso institucional: ${confirmed
        .map((j) => `${j.courtAcronym} usa ${modelDisplay(j.modelId)} no(a) ${j.solutionName.split('—')[0].trim()}`)
        .join('; ')}.`,
    );
  }
  if (probable.length) {
    lines.push(
      `Provável (fonte especializada nomeia o modelo, falta documento oficial): ${probable
        .map((j) => `${j.courtAcronym}/${j.solutionName.split('—')[0].trim()} → ${modelDisplay(j.modelId)}`)
        .join('; ')}.`,
    );
  }
  if (!judgements.length) {
    lines.push('Nenhum veredito com evidência suficiente neste escopo — o agente preferiu reportar lacuna a inventar modelo.');
  }
  lines.push(
    `Padrão dominante: a família Gemini (Google) é o fio condutor — chega aos tribunais sobretudo pelo Contrato Estruturante de Nuvem do CSJT com o SERPRO, que hospeda modelos no Google Cloud Vertex AI; o TRT-4 opera o Galileu exclusivamente com Gemini Flash. O TJRS segue rota distinta (Amazon Bedrock) e mantém postura multi-modelo: Claude, GPT-4o, Gemini e Nova.`,
  );
  if (coverage.length) {
    lines.push(`Cobertura de divulgação: ${coverage.map((c) => `${c.courtAcronym} ${c.ratio}% (${c.solutions} solução(ões))`).join(' · ')}.`);
  }
  if (gaps.length) {
    lines.push(`Lacunas: ${gaps.map((g) => `${g.courtAcronym}/${g.solutionName}`).join('; ')} — sem declaração pública de LLM na coleta.`);
  }
  lines.push('Armadilha de nomeação: "GAIA" e "Gemini" têm homônimos que produzem falso positivo em busca automática; verifique a seção de desambiguação.');
  return lines.join('\n');
}

/** Matriz tribunal × modelo para a visualização em grade. */
export function buildMatrix(judgements: Judgement[]): {
  courts: string[];
  models: { id: string; label: string }[];
  cell: (court: string, model: string) => Judgement | undefined;
} {
  const courts = [...new Set(judgements.map((j) => j.courtAcronym))].sort();
  const modelIds = [...new Set(judgements.map((j) => j.modelId))].sort();
  const map = new Map<string, Judgement>();
  for (const j of judgements) {
    const key = `${j.courtAcronym}::${j.modelId}`;
    const prev = map.get(key);
    if (!prev || prev.score < j.score) map.set(key, j);
  }
  return {
    courts,
    models: modelIds.map((id) => ({ id, label: MODEL_BY_ID[id]?.label ?? id })),
    cell: (court, model) => map.get(`${court}::${model}`),
  };
}

/** Rótulo do modelo com a ressalva de categoria (suíte ≠ LLM). */
export const modelDisplay = (modelId: string): string => {
  const model = MODEL_BY_ID[modelId];
  if (!model) return modelId;
  return model.kind === 'suite-produtividade' ? `${model.label} 〔suíte, não LLM isolado〕` : model.label;
};

export const LEVEL_LABEL: Record<ConfidenceLevel, string> = {
  confirmado: 'CONFIRMADO',
  provavel: 'PROVÁVEL',
  indicio: 'INDÍCIO',
  'nao-declarado': 'NÃO DECLARADO',
};

export const LEVEL_LEGEND: Record<ConfidenceLevel, string> = {
  confirmado: 'Fonte institucional ou de controle (portal do tribunal, TCU, normativo) nomeia o modelo.',
  provavel: 'Imprensa especializada ou fonte oficial nomeia o modelo, sem documento institucional que confirme.',
  indicio: 'Fonte secundária ou inferência contextual a partir do contrato do órgão. Hipótese, não fato.',
  'nao-declarado': 'O órgão afirma "IA generativa" sem dizer qual LLM.',
};

/** Relatório em Markdown pronto para publicar ou anexar a um dossiê. */
export function toMarkdown(report: AgentReport): string {
  const out: string[] = [];
  out.push('# LLMs utilizados pelo Poder Judiciário brasileiro');
  out.push('');
  out.push(`**Consulta:** ${report.query || '(busca ampla)'}  `);
  out.push(`**Gerado em:** ${new Date(report.generatedAt).toLocaleString('pt-BR')} (agente ${report.mode === 'corpus' ? 'offline, corpus curado' : 'corpus + pesquisa ancorada no Gemini'})  `);
  out.push(`**Corpus:** v.${CORPUS_VERSION} · ${report.stats.evidenceScanned} evidências · ${report.stats.solutionsScanned} soluções · ${report.stats.matches} vereditos`);
  out.push('');
  out.push('## 1. Conclusões');
  out.push('');
  for (const line of report.narrative.split('\n')) out.push(`- ${line}`);
  out.push('');
  out.push('## 2. Vereditos');
  out.push('');
  out.push('| Tribunal | Solução | Modelo | Provedor | Nível | Score | Fontes indep. |');
  out.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const j of report.judgements) {
    out.push(
      `| ${j.courtAcronym} | ${j.solutionName.replace(/\|/g, '/')} | ${modelDisplay(j.modelId)} | ${j.provider} | ${LEVEL_LABEL[j.level]} | ${j.score.toFixed(2)} | ${j.independentSources} |`,
    );
  }
  if (!report.judgements.length) out.push('| — | nenhuma solução do escopo tem evidência de modelo | — | — | — | — | — |');
  out.push('');
  out.push('## 3. Evidência por veredito');
  out.push('');
  for (const j of report.judgements) {
    out.push(`### ${j.courtAcronym} · ${j.solutionName} → ${modelDisplay(j.modelId)}`);
    out.push('');
    out.push(`- Nível: **${LEVEL_LABEL[j.level]}** (score ${j.score.toFixed(2)}) · fontes independentes: ${j.independentSources}`);
    if (j.deployment.length) out.push(`- Camada de nuvem/infra: ${j.deployment.join(' · ')}`);
    for (const note of j.notes) out.push(`- Nota: ${note}`);
    for (const id of j.evidenceIds) {
      const e = report.sourcesUsed.find((s) => s.id === id) ?? EVIDENCE.find((s) => s.id === id);
      if (!e) continue;
      out.push(`  - ${e.source}${e.publishedOn ? ` (${e.publishedOn})` : ' (data não confirmada)'} — [fonte](${e.url})`);
      out.push(`    > ${e.quote}`);
    }
    out.push('');
  }
  out.push('## 4. Cobertura de divulgação');
  out.push('');
  out.push('| Tribunal | Soluções mapeadas | Com modelo identificado | Confirmadas | Cobertura |');
  out.push('| --- | --- | --- | --- | --- |');
  for (const c of report.coverage) {
    out.push(`| ${c.courtAcronym} | ${c.solutions} | ${c.withModelEvidence} | ${c.confirmed} | ${c.ratio}% |`);
  }
  out.push('');
  out.push('## 5. Lacunas e perguntas a fazer ao tribunal');
  out.push('');
  for (const gap of report.gaps) {
    out.push(`- **${gap.courtAcronym} · ${gap.solutionName}**`);
    if (gap.questions.length) for (const q of gap.questions) out.push(`  - ${q}`);
    else out.push('  - Solicitar a ficha da solução no Sinapses e o ETP/contrato correspondente.');
  }
  if (!report.gaps.length) out.push('- Nenhuma lacuna no escopo consultado.');
  out.push('');
  out.push('## 6. Desambiguação obrigatória');
  out.push('');
  for (const h of report.homonyms) {
    out.push(`- **${h.term}** — ${h.risk}`);
    for (const d of h.distractors) out.push(`  - ${d}`);
  }
  out.push('');
  out.push('## 7. Como verificar (checklist do agente)');
  out.push('');
  for (const v of report.verification) out.push(`- ${v}`);
  out.push('');
  out.push('## 8. Ressalvas metodológicas');
  out.push('');
  for (const c of CAVEATS) out.push(`- ${c}`);
  out.push('');
  out.push('## 9. Fontes consultadas');
  out.push('');
  for (const e of report.sourcesUsed) {
    out.push(`- [${e.source}${e.publishedOn ? ` — ${e.publishedOn}` : ''}](${e.url}) · tipo: ${e.type} · confiabilidade ${e.reliability.toFixed(2)}`);
  }
  out.push('');
  out.push('---');
  out.push('');
  out.push('_Documento gerado por agente. Toda afirmação acima depende das fontes listadas; nenhuma delas é base legal para decisão._');
  return out.join('\n');
}

/** Exportação tabular para planilha. */
export function toCsv(report: AgentReport): string {
  const header = ['tribunal', 'solucao', 'modelo', 'provedor', 'nivel', 'score', 'fontes_independentes', 'evidencias', 'notas'];
  const rows = report.judgements.map((j) => [
    j.courtAcronym,
    j.solutionName,
    modelDisplay(j.modelId),
    j.provider,
    LEVEL_LABEL[j.level],
    j.score.toFixed(2),
    String(j.independentSources),
    j.evidenceIds.join('|'),
    j.notes.join(' ').replace(/\s+/g, ' '),
  ]);
  return [header, ...rows].map((cells) => cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
}
