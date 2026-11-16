import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { runAgent, toMarkdown, toCsv, buildMatrix, LEVELS, LEVEL_LABEL, LEVEL_LEGEND, modelDisplay } from '../agents/llmIntelAgent';
import { COURTS, CORPUS_VERSION, MODEL_BY_ID, SOLUTIONS, MODELS } from '../data/judiciaryLlmCorpus';
import { isAiAvailable, runGroundedResearch } from '../services/llmIntelService';
import type { AgentReport, AgentStep, ConfidenceLevel, Evidence, Judgement } from '../agents/types';

/* ------------------------------------------------------------------ peças de UI (padrão OS/2) */

type BoxProps = { children: React.ReactNode; className?: string };
type ButtonProps = { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean; title?: string };

const Panel: React.FC<BoxProps> = ({ children, className = '' }) => (
  <div className={`bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 ${className}`}>
    {children}
  </div>
);

const Sunken: React.FC<BoxProps> = ({ children, className = '' }) => (
  <div className={`bg-white border-2 border-t-stone-900 border-l-stone-900 border-b-stone-100 border-r-stone-100 ${className}`}>{children}</div>
);

const WarpButton: React.FC<ButtonProps> = ({ children, onClick, disabled, active, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`px-2.5 py-1 text-xs font-bold bg-stone-300 border-2 ${
      active
        ? 'border-t-stone-900 border-l-stone-900 border-b-stone-100 border-r-stone-100'
        : 'border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900'
    } active:border-t-stone-900 active:border-l-stone-900 disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const LEVEL_STYLE: Record<ConfidenceLevel, string> = {
  confirmado: 'bg-emerald-700 text-white',
  provavel: 'bg-amber-500 text-black',
  indicio: 'bg-stone-500 text-white',
  'nao-declarado': 'bg-rose-800 text-white',
};

const LevelBadge: React.FC<{ level: ConfidenceLevel }> = ({ level }) => (
  <span className={`px-1.5 py-0.5 text-[10px] font-bold tracking-tight ${LEVEL_STYLE[level]}`}>{LEVEL_LABEL[level]}</span>
);

const Bar: React.FC<{ ratio: number }> = ({ ratio }) => (
  <div className="h-3 w-full bg-stone-200 border border-stone-500">
    <div className="h-full bg-blue-800" style={{ width: `${Math.round(Math.min(1, ratio) * 100)}%` }} />
  </div>
);

/* ------------------------------------------------------------------ aplicação */

type TabId = 'traco' | 'vereditos' | 'matriz' | 'lacunas' | 'fontes' | 'relatorio';

const TABS: { id: TabId; label: string }[] = [
  { id: 'traco', label: 'Traço do agente' },
  { id: 'vereditos', label: 'Vereditos' },
  { id: 'matriz', label: 'Matriz tribunal × modelo' },
  { id: 'lacunas', label: 'Lacunas' },
  { id: 'fontes', label: 'Fontes' },
  { id: 'relatorio', label: 'Relatório' },
];

const SUGGESTIONS = [
  'Quais LLMs o TJRS usa na plataforma GAIA?',
  'Qual modelo alimenta a GAIA Minuta?',
  'TRF4 e JF4R: quais ferramentas de IA generativa foram contratadas?',
  'TRT (Justiça do Trabalho): Chat-JT e Galileu — quais modelos?',
  'Gemini',
];

const JudicialAiAgentApp: React.FC = () => {
  const [query, setQuery] = useState(SUGGESTIONS[0]);
  const [tab, setTab] = useState<TabId>('traco');
  const [status, setStatus] = useState<'ocioso' | 'rodando' | 'pronto' | 'erro'>('ocioso');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [report, setReport] = useState<AgentReport | null>(null);
  const [liveEvidence, setLiveEvidence] = useState<Evidence[]>([]);
  const [liveNotes, setLiveNotes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [courtFilter, setCourtFilter] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<ConfidenceLevel[]>([]);
  const [notice, setNotice] = useState('');
  const traceRef = useRef<HTMLDivElement>(null);

  const aiReady = useMemo(() => isAiAvailable(), []);

  useEffect(() => {
    if (traceRef.current) traceRef.current.scrollTop = traceRef.current.scrollHeight;
  }, [steps]);

  const toggle = <T,>(list: T[], value: T, setter: (v: T[]) => void) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const pushStep = useCallback((step: AgentStep, kind: 'start' | 'end') => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id);
      if (kind === 'start') {
        if (idx >= 0) return prev.map((s) => (s.id === step.id ? { ...step } : s));
        return [...prev, { ...step }];
      }
      if (idx < 0) return [...prev, { ...step }];
      return prev.map((s) => (s.id === step.id ? { ...step } : s));
    });
  }, []);

  const execute = useCallback(
    async (withLive: boolean) => {
      setStatus('rodando');
      setError('');
      setNotice('');
      setSteps([]);
      setSelected(null);
      setTab('traco');

      let extra: Evidence[] = [];
      try {
        if (withLive) {
          const live = await runGroundedResearch(query, {
            onNotice: (message) => setNotice(message),
          });
          extra = live.evidence;
          setLiveEvidence(extra);
          setLiveNotes([
            live.summary ? `Resumo do modelo: ${live.summary}` : '',
            ...live.ambiguities.map((a) => `Ambiguidade apontada: ${a}`),
            ...live.gaps.map((g) => `Lacuna apontada na coleta ao vivo: ${g}`),
          ].filter(Boolean));
          setNotice(`Coleta ao vivo concluída: ${extra.length} evidências anexadas ao corpus.`);
        } else {
          setLiveEvidence([]);
          setLiveNotes([]);
        }

        const produced = await runAgent({
          query,
          courtIds: courtFilter,
          modelIds: modelFilter,
          levelFilter,
          extraEvidence: extra,
          pause: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
          onEvent: (event) => pushStep(event.step, event.type === 'step-start' ? 'start' : 'end'),
        });
        setReport(produced);
        setStatus('pronto');
        setTab('vereditos');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus('erro');
      }
    },
    [query, courtFilter, modelFilter, levelFilter, pushStep],
  );

  const filteredJudgements = useMemo(() => {
    if (!report) return [] as Judgement[];
    return report.judgements.filter(
      (j) =>
        (!courtFilter.length || courtFilter.includes(j.courtId)) &&
        (!modelFilter.length || modelFilter.includes(j.modelId)) &&
        (!levelFilter.length || levelFilter.includes(j.level)),
    );
  }, [report, courtFilter, modelFilter, levelFilter]);

  const matrix = useMemo(() => buildMatrix(filteredJudgements), [filteredJudgements]);
  const selectedJudgement = useMemo(
    () => filteredJudgements.find((j) => `${j.solutionId}:${j.modelId}` === selected) ?? null,
    [filteredJudgements, selected],
  );

  const evidenceOf = useCallback(
    (ids: string[]): Evidence[] => {
      const pool = [...(report?.sourcesUsed ?? []), ...liveEvidence];
      return ids.map((id) => pool.find((e) => e.id === id)).filter((e): e is Evidence => Boolean(e));
    },
    [report, liveEvidence],
  );

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusLabel =
    status === 'rodando' ? 'investigando…' : status === 'erro' ? 'falhou' : status === 'pronto' ? `pronto — ${report?.judgements.length ?? 0} vereditos` : 'ocioso';

  return (
    <div className="h-full flex flex-col text-black bg-stone-300 font-mono text-[13px]">
      {/* Barra de comandos */}
      <div className="p-1.5 border-b-2 border-stone-400 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Sunken className="flex-grow flex items-center px-1.5 h-8 bg-white">
            <span className="text-[10px] font-bold mr-2 text-stone-700">CONSULTA</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && execute(false)}
              placeholder='ex.: "qual LLM o TJRS usa na GAIA Minuta?"'
              className="flex-grow h-full bg-transparent focus:outline-none"
            />
          </Sunken>
          <WarpButton onClick={() => execute(false)} disabled={status === 'rodando'} title="Usa apenas o corpus curado (auditável, sem rede)">
            ▶ Rodar agente
          </WarpButton>
          <WarpButton
            onClick={() => execute(true)}
            disabled={status === 'rodando' || !aiReady}
            title={aiReady ? 'Gemini + Busca Google coletam fontes novas, que entram no mesmo scoring' : 'Defina GEMINI_API_KEY em .env.local para habilitar'}
          >
            ◈ Pesquisar ao vivo
          </WarpButton>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="text-[11px] px-1.5 py-0.5 bg-stone-200 border border-stone-500 hover:bg-stone-100"
            >
              {s.length > 42 ? `${s.slice(0, 42)}…` : s}
            </button>
          ))}
          <div className="flex-grow" />
          <WarpButton onClick={() => report && download('relatorio-llm-judiciario.md', toMarkdown(report), 'text/markdown')} disabled={!report}>
            ⤓ Markdown
          </WarpButton>
          <WarpButton onClick={() => report && download('vereditos-llm-judiciario.csv', toCsv(report), 'text/csv')} disabled={!report}>
            ⤓ CSV
          </WarpButton>
          <WarpButton
            onClick={() => report && navigator.clipboard?.writeText(toMarkdown(report)).then(() => setNotice('Relatório copiado para a área de transferência.'))}
            disabled={!report}
          >
            ⧉ Copiar
          </WarpButton>
        </div>
      </div>

      <div className="flex-grow flex min-h-0">
        {/* Filtros */}
        <div className="w-52 shrink-0 border-r-2 border-stone-400 p-1.5 space-y-2 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold mb-1">TRIBUNAIS</p>
            <div className="space-y-0.5">
              {COURTS.map((court) => (
                <label key={court.id} className="flex items-start gap-1 cursor-pointer" title={court.name}>
                  <input
                    type="checkbox"
                    checked={courtFilter.includes(court.id)}
                    onChange={() => toggle(courtFilter, court.id, setCourtFilter)}
                    className="mt-0.5"
                  />
                  <span className="text-[11px] leading-tight">{court.acronym}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold mb-1">MODELOS</p>
            <div className="flex flex-wrap gap-1">
              {MODELS.filter((m) => m.id !== 'undisclosed').map((model) => (
                <button
                  key={model.id}
                  onClick={() => toggle(modelFilter, model.id, setModelFilter)}
                  title={`${model.provider} — ${model.delivery}`}
                  className={`text-[10px] px-1 py-0.5 border ${
                    modelFilter.includes(model.id) ? 'bg-blue-800 text-white border-blue-900' : 'bg-stone-200 border-stone-500'
                  }`}
                >
                  {model.label.replace(' (família)', '').replace('Meta ', '').replace('OpenAI ', '').replace('Google ', '')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold mb-1">NÍVEL DE ASSERÇÃO</p>
            <div className="space-y-0.5">
              {LEVELS.map((level) => (
                <label key={level} className="flex items-start gap-1 cursor-pointer">
                  <input type="checkbox" checked={levelFilter.includes(level)} onChange={() => toggle(levelFilter, level, setLevelFilter)} className="mt-0.5" />
                  <span className="text-[10px] leading-tight" title={LEVEL_LEGEND[level]}>
                    {LEVEL_LABEL[level]}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Panel className="p-1.5">
            <p className="text-[10px] font-bold mb-1">COBERTURA POR TRIBUNAL</p>
            {report?.coverage.length ? (
              <div className="space-y-1.5">
                {report.coverage.map((c) => (
                  <div key={c.courtId}>
                    <div className="flex justify-between text-[10px]">
                      <span>{c.courtAcronym}</span>
                      <span>{c.ratio}%</span>
                    </div>
                    <Bar ratio={c.ratio / 100} />
                    <p className="text-[9px] text-stone-700">
                      {c.withModelEvidence}/{c.solutions} com modelo · {c.confirmed} confirmado(s)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-stone-600">Rode o agente para medir o quanto cada tribunal declara o modelo que usa.</p>
            )}
          </Panel>
          <Panel className="p-1.5">
            <p className="text-[10px] font-bold mb-1">REGUA DO AGENTE</p>
            <ul className="space-y-1">
              {LEVELS.map((level) => (
                <li key={level} className="text-[9px] leading-tight">
                  <span className="font-bold">{LEVEL_LABEL[level]}</span> — {LEVEL_LEGEND[level]}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Conteúdo */}
        <div className="flex-grow flex flex-col min-w-0">
          <div className="flex gap-0.5 p-1 bg-stone-300 border-b-2 border-stone-400">
            {TABS.map((t) => (
              <WarpButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
                {t.id === 'lacunas' && report?.gaps.length ? ` (${report.gaps.length})` : ''}
              </WarpButton>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-2 min-h-0" ref={tab === 'traco' ? traceRef : undefined}>
            {tab === 'traco' && (
              <div className="space-y-1">
                {steps.length === 0 && (
                  <p className="text-[11px] text-stone-700 leading-snug">
                    Nenhum passo ainda. O agente executa o ciclo interpretar&nbsp;→&nbsp;planejar&nbsp;→&nbsp;varrer catálogo&nbsp;→&nbsp;reunir evidência&nbsp;→&nbsp;classificar
                    fontes&nbsp;→&nbsp;atribuir vereditos&nbsp;→&nbsp;inferir contexto&nbsp;→&nbsp;medir lacunas&nbsp;→&nbsp;sintetizar relatório sobre o corpus v{CORPUS_VERSION},
                    e só afirma aquilo que uma fonte citável sustenta.
                  </p>
                )}
                {steps.map((step, i) => (
                  <Panel key={`${step.id}-${i}`} className="p-1.5 flex items-start gap-2">
                    <span className="text-[10px] font-bold w-5 text-right text-stone-600">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px]">{step.label}</span>
                        <span
                          className={`text-[9px] px-1 ${
                            step.status === 'concluido'
                              ? 'bg-emerald-700 text-white'
                              : step.status === 'aviso'
                                ? 'bg-amber-500 text-black'
                                : step.status === 'executando'
                                  ? 'bg-blue-800 text-white animate-pulse'
                                  : 'bg-stone-500 text-white'
                          }`}
                        >
                          {step.status === 'executando' ? 'EXECUTANDO' : step.status.toUpperCase()}
                        </span>
                        {typeof step.count === 'number' && step.status !== 'executando' && (
                          <span className="text-[9px] text-stone-600">{step.count} item(ns)</span>
                        )}
                        {step.finishedAt && <span className="text-[9px] text-stone-500 ml-auto">{step.finishedAt - step.startedAt} ms</span>}
                      </div>
                      <p className="text-[10px] leading-tight text-stone-800 whitespace-pre-wrap">{step.detail}</p>
                    </div>
                  </Panel>
                ))}
                {liveNotes.map((note, i) => (
                  <Panel key={`live-${i}`} className="p-1.5 bg-amber-100">
                    <p className="text-[10px] leading-tight whitespace-pre-wrap">{note}</p>
                  </Panel>
                ))}
                {error && (
                  <Panel className="p-1.5 bg-rose-100">
                    <p className="text-[10px] font-bold">ERRO</p>
                    <p className="text-[10px] whitespace-pre-wrap">{error}</p>
                  </Panel>
                )}
              </div>
            )}

            {tab === 'vereditos' && (
              <div className="space-y-2">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-stone-400 text-left">
                      <th className="p-1 border border-stone-500">Tribunal</th>
                      <th className="p-1 border border-stone-500">Solução</th>
                      <th className="p-1 border border-stone-500">LLM</th>
                      <th className="p-1 border border-stone-500">Provedor</th>
                      <th className="p-1 border border-stone-500">Nível</th>
                      <th className="p-1 border border-stone-500 w-24">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJudgements.map((j) => {
                      const key = `${j.solutionId}:${j.modelId}`;
                      return (
                        <tr
                          key={key}
                          onClick={() => setSelected(key === selected ? null : key)}
                          className={`${selected === key ? 'bg-blue-200' : 'bg-white'} hover:bg-stone-100 cursor-pointer`}
                        >
                          <td className="p-1 border border-stone-500 align-top font-bold">{j.courtAcronym}</td>
                          <td className="p-1 border border-stone-500 align-top">
                            {j.solutionName}
                            {j.conflicting && <span className="ml-1 text-[9px] px-1 bg-amber-400" title="Fontes citam mais de um provedor para a mesma solução">multi-modelo</span>}
                          </td>
                          <td className="p-1 border border-stone-500 align-top">
                            {modelDisplay(j.modelId)}
                            {MODEL_BY_ID[j.modelId]?.kind === 'suite-produtividade' && (
                              <span className="ml-1 text-[9px] px-1 bg-stone-400" title="Produto contratado que embute um LLM; a versão do modelo costuma ficar sob sigilo do fornecedor">
                                suíte
                              </span>
                            )}
                          </td>
                          <td className="p-1 border border-stone-500 align-top">{j.provider}</td>
                          <td className="p-1 border border-stone-500 align-top">
                            <LevelBadge level={j.level} />
                          </td>
                          <td className="p-1 border border-stone-500 align-top">
                            <div className="flex items-center gap-1">
                              <Bar ratio={j.score} />
                              <span className="text-[9px]">{j.score.toFixed(2)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredJudgements.length && (
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-[11px] text-stone-600 bg-white border border-stone-500">
                          {report ? 'Nenhum veredito com os filtros atuais — veja a aba Lacunas.' : 'Rode o agente para preencher a tabela.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {selectedJudgement && (
                  <Panel className="p-2 bg-stone-200 space-y-1.5">
                    <p className="font-bold text-[11px]">
                      {selectedJudgement.courtAcronym} · {selectedJudgement.solutionName} → {selectedJudgement.modelLabel}
                    </p>
                    <p className="text-[10px]">
                      Camada de nuvem/infra: {selectedJudgement.deployment.length ? selectedJudgement.deployment.join(' · ') : 'não declarada'} · modelo entregue por{' '}
                      {MODEL_BY_ID[selectedJudgement.modelId]?.delivery ?? '—'}
                    </p>
                    {selectedJudgement.notes.map((n, i) => (
                      <p key={i} className="text-[10px] leading-tight bg-amber-100 p-1 border-l-4 border-amber-600">
                        {n}
                      </p>
                    ))}
                    <div className="space-y-1">
                      {evidenceOf(selectedJudgement.evidenceIds).map((e) => (
                        <div key={e.id} className="bg-white border border-stone-500 p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-stone-700">
                            <span className="font-bold uppercase">{e.type}</span>
                            <span>· {e.source}</span>
                            <span>· {e.publishedOn || 'data não confirmada'}</span>
                            <span className="ml-auto">confiabilidade {e.reliability.toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] font-bold mt-0.5">{e.claim}</p>
                          <blockquote className="text-[10px] italic leading-tight mt-0.5 pl-1 border-l-2 border-stone-400">“{e.quote}”</blockquote>
                          <a href={e.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-800 underline break-all">
                            {e.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>
            )}

            {tab === 'matriz' && (
              <div className="space-y-2">
                <p className="text-[10px] text-stone-700">
                  Grade tribunal × modelo. Cor do balão = nível de asserção; célula vazia = sem evidência. Clique num balão para abrir os vereditos.
                </p>
                {matrix.courts.length ? (
                  <div className="overflow-x-auto">
                    <table className="text-[10px] border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 bg-stone-400 border border-stone-500">Tribunal</th>
                          {matrix.models.map((m) => (
                            <th key={m.id} className="p-1 bg-stone-400 border border-stone-500 max-w-28 align-bottom">
                              <span className="block leading-tight">{m.label}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.courts.map((court) => (
                          <tr key={court}>
                            <td className="p-1 bg-stone-200 border border-stone-500 font-bold">{court}</td>
                            {matrix.models.map((model) => {
                              const cell = matrix.cell(court, model.id);
                              return (
                                <td key={model.id} className="p-1 border border-stone-500 text-center bg-white">
                                  {cell ? (
                                    <button
                                      onClick={() => setSelected(`${cell.solutionId}:${cell.modelId}`)}
                                      title={`${cell.solutionName} — score ${cell.score.toFixed(2)}`}
                                      className={`w-full px-1 py-0.5 ${LEVEL_STYLE[cell.level]}`}
                                    >
                                      {cell.score.toFixed(2)}
                                    </button>
                                  ) : (
                                    <span className="text-stone-400">·</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-600">Sem dados — rode o agente.</p>
                )}
              </div>
            )}

            {tab === 'lacunas' && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-stone-700">
                  Soluções mapeadas que <b>não</b> têm evidência suficiente de LLM. É aqui que o agente é mais útil: cada pergunta abaixo pode virar pedido de acesso à
                  informação ou cobrança de cumprimento da Res. CNJ 615/2025.
                </p>
                {(report?.gaps ?? []).map((gap) => (
                  <Panel key={gap.solutionId} className="p-1.5">
                    <p className="font-bold text-[11px]">
                      {gap.courtAcronym} · {gap.solutionName}
                    </p>
                    {gap.questions.length ? (
                      <ul className="mt-1 space-y-0.5">
                        {gap.questions.map((q, i) => (
                          <li key={i} className="text-[10px] leading-tight flex gap-1">
                            <span className="text-rose-800">?</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[10px] text-stone-600 mt-1">Pedir a ficha da solução no Sinapses e o ETP/contrato correspondente.</p>
                    )}
                  </Panel>
                ))}
                {!report?.gaps.length && <p className="text-[11px] text-stone-600">{report ? 'Nenhuma lacuna no escopo consultado.' : 'Rode o agente para listar lacunas.'}</p>}
                <Panel className="p-1.5 bg-stone-200">
                  <p className="text-[10px] font-bold mb-1">CATÁLOGO COMPLETO ({SOLUTIONS.length} soluções monitoradas)</p>
                  <div className="grid grid-cols-2 gap-x-2">
                    {SOLUTIONS.map((s) => (
                      <p key={s.id} className="text-[9px] leading-tight truncate">
                        <span className="font-bold">{s.courtId.toUpperCase()}</span> {s.name.split('—')[0]}
                      </p>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {tab === 'fontes' && (
              <div className="space-y-1.5">
                <Panel className="p-1.5 bg-amber-100 space-y-1">
                  <p className="text-[10px] font-bold">⚠ DESAMBIGUAÇÃO OBRIGATÓRIA ANTES DE CITAR</p>
                  {(report?.homonyms ?? []).map((h) => (
                    <div key={h.term} className="text-[10px] leading-tight">
                      <p>
                        <b>{h.term}</b> — {h.risk}
                      </p>
                      <ul className="pl-3 list-disc">
                        {h.distractors.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Panel>
                {(report?.sourcesUsed ?? []).map((e) => (
                  <Panel key={e.id} className="p-1.5">
                    <div className="flex items-center gap-1 text-[9px] text-stone-700">
                      <span className="font-bold uppercase">{e.type}</span>
                      <span>· {e.source}</span>
                      <span>· {e.publishedOn || 'data não confirmada'}</span>
                      <span className="ml-auto">{e.explicitModel ? 'nomeia modelo' : 'não nomeia modelo'}</span>
                    </div>
                    <p className="text-[10px] font-bold mt-0.5">{e.claim}</p>
                    <blockquote className="text-[10px] italic leading-tight mt-0.5 pl-1 border-l-2 border-stone-400">“{e.quote}”</blockquote>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a href={e.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-800 underline break-all">
                        {e.url}
                      </a>
                      <span className="text-[9px] text-stone-500 ml-auto">peso {e.reliability.toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-stone-600 mt-0.5">
                      sustenta: {e.solutionIds.join(', ') || '—'} · modelos: {e.modelIds.join(', ') || '—'}
                    </p>
                  </Panel>
                ))}
                {!report?.sourcesUsed.length && <p className="text-[11px] text-stone-600">Rode o agente para carregar as fontes usadas.</p>}
              </div>
            )}

            {tab === 'relatorio' && (
              <Sunken className="p-2 h-full bg-white">
                {report ? (
                  <pre className="text-[10px] leading-tight whitespace-pre-wrap font-mono">{toMarkdown(report)}</pre>
                ) : (
                  <p className="text-[11px] text-stone-600">O relatório em Markdown aparece aqui depois da primeira execução.</p>
                )}
              </Sunken>
            )}
          </div>
        </div>
      </div>

      {/* Barra de estado */}
      <div className="border-t-2 border-stone-400 px-1.5 py-1 flex items-center gap-2 text-[10px] bg-stone-300">
        <Sunken className="px-1.5 py-0.5 bg-stone-200">{statusLabel}</Sunken>
        <Sunken className="px-1.5 py-0.5 bg-stone-200">
          corpus v{CORPUS_VERSION} · {report?.stats.evidenceScanned ?? 0} evidências
          {liveEvidence.length ? ` (+${liveEvidence.length} ao vivo)` : ''}
        </Sunken>
        <Sunken className="px-1.5 py-0.5 bg-stone-200">{aiReady ? 'Gemini: pronto para coleta ao vivo' : 'Gemini: sem API key — modo offline'}</Sunken>
        <span className="truncate text-stone-700">{notice}</span>
      </div>
    </div>
  );
};

export default JudicialAiAgentApp;
