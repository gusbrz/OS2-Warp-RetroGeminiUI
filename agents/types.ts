/**
 * Tipos compartilhados do Agente de Inteligência sobre LLMs do Poder Judiciário.
 *
 * O agente trabalha exclusivamente com EVIDÊNCIA citável: cada afirmação sobre
 * qual modelo alimenta qual solução precisa apontar uma fonte (portal oficial,
 * acórdão de auditoria, notícia, normativo). Nada entra no catálogo "no chute".
 */

/** Ramo do Judiciário ao qual o órgão pertence. */
export type CourtBranch = 'estadual' | 'federal' | 'trabalho' | 'conselho' | 'superior';

/** Natureza da fonte que sustenta a evidência. */
export type SourceType = 'oficial' | 'auditoria' | 'normativo' | 'imprensa' | 'fornecedor' | 'academico';

/** Estágio de vida da solução dentro do tribunal. */
export type SolutionStatus = 'producao' | 'piloto' | 'planejada' | 'descontinuada';

/** Papel da tecnologia na arquitetura — importante para não confundir LLM com produto. */
export type ModelKind = 'llm' | 'suite-produtividade' | 'orquestrador' | 'modelo-aberto' | 'inferencia-desconhecida';

/** Nível de asserção que o agente se permite fazer a partir das evidências. */
export type ConfidenceLevel = 'confirmado' | 'provavel' | 'indicio' | 'nao-declarado';

export interface Court {
  id: string;
  acronym: string;
  name: string;
  branch: CourtBranch;
  /** Apelidos e grafias usadas em buscas e na fala do usuário. */
  aliases: string[];
}

export interface LlmModel {
  id: string;
  label: string;
  provider: string;
  kind: ModelKind;
  /** Como o modelo chega ao tribunal: nuvem, contrato estruturante, fornecedor intermediário. */
  delivery: string;
  notes?: string;
}

export interface Evidence {
  id: string;
  /** Afirmação pontual que esta fonte sustenta. */
  claim: string;
  /** Trecho literal, preservando a redação da fonte. */
  quote: string;
  url: string;
  source: string;
  publishedOn: string;
  type: SourceType;
  /** Confiabilidade base da fonte (0..1), calibrada pelo tipo. */
  reliability: number;
  /** A fonte nomeia um modelo concreto (vs. apenas "IA generativa")? */
  explicitModel: boolean;
  solutionIds: string[];
  /** Modelos citados por esta fonte (produto cartesiano com solutionIds quando `modelLinks` ausente). */
  modelIds: string[];
  /**
   * Atribuição precisa modelo→solução. Quando presente, substitui o produto cartesiano
   * solutionIds × modelIds — evita que "o tribunal usa Claude, GPT-4o, Gemini e Nova"
   * vire veredito para cada uma das oito ferramentas da plataforma.
   */
  modelLinks?: { solutionId: string; modelIds: string[]; note?: string }[];
  /** Tags livres usadas pelo plano do agente (custo, risco, soberania, soaker). */
  topics?: string[];
}

export interface AiSolution {
  id: string;
  courtId: string;
  name: string;
  /** Plataforma-mestre, agente, módulo de sistema processual ou suíte de produtividade. */
  category: 'plataforma' | 'agente' | 'modulo' | 'suite';
  purpose: string;
  vendors: string[];
  /** Nuvem / infraestrutura declarada. */
  infrastructure: string[];
  status: SolutionStatus;
  launchedOn?: string;
  metrics?: string[];
  evidenceIds: string[];
  /** Modelos que o tribunal já declarou publicamente para esta solução. */
  declaredModelIds: string[];
  /** O que ainda falta provar — vira "lacuna" no relatório. */
  openQuestions?: string[];
  /** true para catálogos/normas que servem de referência, não são consumidores de LLM. */
  informational?: boolean;
}

export interface Homonym {
  term: string;
  risk: string;
  distractors: string[];
}

export interface Judgement {
  solutionId: string;
  solutionName: string;
  courtId: string;
  courtAcronym: string;
  modelId: string;
  modelLabel: string;
  provider: string;
  level: ConfidenceLevel;
  /** 0..1 — composição de confiabilidade, corroboracao, recência e especificidade. */
  score: number;
  evidenceIds: string[];
  independentSources: number;
  /** Fontes divergem sobre o mesmo par solução/modelo? */
  conflicting: boolean;
  deployment: string[];
  notes: string[];
}

export interface CoverageScore {
  courtId: string;
  courtAcronym: string;
  solutions: number;
  withModelEvidence: number;
  confirmed: number;
  ratio: number;
}

export interface AgentStep {
  id: string;
  label: string;
  detail: string;
  status: 'pendente' | 'executando' | 'concluido' | 'vazio' | 'aviso';
  /** Itens produzidos pelo passo (contagem). */
  count?: number;
  startedAt: number;
  finishedAt?: number;
}

export interface AgentReport {
  query: string;
  generatedAt: string;
  mode: 'corpus' | 'corpus+gemini';
  steps: AgentStep[];
  judgements: Judgement[];
  coverage: CoverageScore[];
  /** Soluções varridas que não têm nenhuma evidência de modelo. */
  gaps: { solutionId: string; solutionName: string; courtAcronym: string; questions: string[] }[];
  homonyms: Homonym[];
  sourcesUsed: Evidence[];
  narrative: string;
  /** Instruções de verificação que o agente entrega junto com o resultado. */
  verification: string[];
  stats: {
    solutionsScanned: number;
    evidenceScanned: number;
    matches: number;
  };
}
