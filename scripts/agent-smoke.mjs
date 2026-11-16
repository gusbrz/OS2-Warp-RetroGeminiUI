#!/usr/bin/env node
/**
 * Testes de sanidade epistêmica do Agente LLM-Judiciário.
 *
 *   npm test
 *
 * Não testam rendering: testam as REGRAS que fazem o agente ser confiável.
 * Se alguém afrouxar o scoring e o agente voltar a "confirmar" modelo com base em
 * release de fornecedor, ou a inferir Gemini só porque o módulo do PJe se chama
 * Gemini, este arquivo falha.
 */

import assert from 'node:assert/strict';
import { runAgent, parseQuery, toMarkdown, toCsv, CANONICAL_SOURCE_TYPES } from '../agents/llmIntelAgent.ts';
import { EVIDENCE, SOLUTIONS, MODEL_BY_ID } from '../data/judiciaryLlmCorpus.ts';

const LEVELS_OK = new Set(['confirmado', 'provavel', 'indicio', 'nao-declarado']);
const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push(['ok', name]);
  } catch (error) {
    results.push(['FALHA', `${name}\n      ${error.message}`]);
  }
};

const report = await runAgent({});

await test('toda evidência tem fonte, URL http e citação literal', () => {
  for (const e of EVIDENCE) {
    assert.ok(e.url.startsWith('http'), `${e.id}: url inválida`);
    assert.ok(e.quote.length > 25, `${e.id}: citação curta demais`);
    assert.ok(e.source.length > 3, `${e.id}: fonte não identificada`);
    assert.ok(e.publishedOn === '' || /^\d{4}-\d{2}-\d{2}$/.test(e.publishedOn), `${e.id}: data fora do formato ISO`);
    assert.ok(e.reliability > 0 && e.reliability <= 1, `${e.id}: confiabilidade fora de 0..1`);
  }
});

await test('toda evidência aponta para soluções existentes', () => {
  const known = new Set(SOLUTIONS.map((s) => s.id));
  for (const e of EVIDENCE) {
    for (const id of e.solutionIds) assert.ok(known.has(id), `${e.id} referencia solução inexistente: ${id}`);
    for (const link of e.modelLinks ?? []) assert.ok(known.has(link.solutionId), `${e.id} referencia solução inexistente: ${link.solutionId}`);
  }
});

await test('nenhum modelo é atribuído a solução que não tem a fonte correspondente', () => {
  for (const j of report.judgements) {
    const solution = SOLUTIONS.find((s) => s.id === j.solutionId);
    const hasLink = j.evidenceIds.some((id) => {
      const e = EVIDENCE.find((item) => item.id === id);
      if (!e) return false;
      if (e.modelLinks) return Boolean(e.modelLinks.find((l) => l.solutionId === j.solutionId)?.modelIds.includes(j.modelId));
      return e.solutionIds.includes(solution.id) && e.modelIds.includes(j.modelId);
    });
    const declared = solution.declaredModelIds.includes(j.modelId);
    const inferred = j.notes.some((n) => n.startsWith('INFERÊNCIA CONTEXTUAL'));
    assert.ok(hasLink || declared || inferred, `${solution.name} → ${j.modelLabel} sem âncora de evidência`);
  }
});

await test('"confirmado" exige fonte institucional/de controle nomeando o modelo', () => {
  const confirmed = report.judgements.filter((j) => j.level === 'confirmado');
  assert.ok(confirmed.length > 0, 'nenhum veredito confirmado — o corpus regrediu');
  for (const j of confirmed) {
    const sources = j.evidenceIds.map((id) => EVIDENCE.find((e) => e.id === id)).filter(Boolean);
    const canonicalExplicit = sources.some((e) => CANONICAL_SOURCE_TYPES.includes(e.type) && e.explicitModel);
    assert.ok(canonicalExplicit, `${j.courtAcronym}/${j.solutionName} → ${j.modelLabel} confirmado sem fonte canônica explícita`);
  }
});

await test('imprensa sozinha nunca "confirma" (caso TJRS/GAIA Minuta)', () => {
  const tjrs = report.judgements.filter((j) => j.courtId === 'tjrs');
  assert.ok(tjrs.length > 0, 'TJRS deveria ter vereditos');
  for (const j of tjrs) {
    const sources = j.evidenceIds.map((id) => EVIDENCE.find((e) => e.id === id)).filter(Boolean);
    const hasCanonical = sources.some((e) => CANONICAL_SOURCE_TYPES.includes(e.type));
    assert.ok(!(j.level === 'confirmado' && !hasCanonical), `${j.solutionName} confirmado apenas por imprensa`);
  }
});

await test('soluções homônimas nunca recebem modelo por inferência de nome', () => {
  for (const id of ['gemini-pje-trt4', 'gemini-pje-nacional']) {
    const judge = report.judgements.find((j) => j.solutionId === id && j.notes.some((n) => n.startsWith('INFERÊNCIA CONTEXTUAL')));
    assert.ok(!judge, `${id} recebeu inferência de modelo a partir do nome — inaceitável`);
  }
});

await test('vereditos respeitam o teto de score definido pelo agente', () => {
  for (const j of report.judgements) {
    assert.ok(j.score >= 0 && j.score <= 0.99, `${j.solutionName}: score ${j.score} fora do intervalo`);
    assert.ok(LEVELS_OK.has(j.level), `${j.solutionName}: nível inválido ${j.level}`);
  }
});

await test('consulta em linguagem natural resolve tribunal, ferramenta e homônimo', () => {
  const parsed = parseQuery('Quais LLMs o TJ/RS usa na GAIA Minuta?');
  assert.ok(parsed.courts.includes('tjrs'), 'não reconheceu TJ/RS');
  assert.ok(parsed.solutions.includes('gaia-minuta'), 'não reconheceu GAIA Minuta');
  assert.ok(parsed.homonyms.includes('GAIA'), 'não sinalizou o homônimo GAIA');
});

await test('filtro por tribunal reduz o escopo sem esvaziar', async () => {
  const onlyTrt4 = await runAgent({ query: 'TRT-4' });
  assert.ok(onlyTrt4.judgements.length > 0, 'nenhum veredito para TRT-4');
  assert.ok(
    onlyTrt4.judgements.every((j) => ['trt4', 'csjt', 'trt7', 'trt11', 'trt15'].includes(j.courtId)),
    'TRT-4 arrastou vereditos de ramos distintos',
  );
  const galileu = onlyTrt4.judgements.find((j) => j.solutionId === 'galileu-trt4' && j.modelId === 'gemini-flash');
  assert.equal(galileu.level, 'confirmado', 'Galileu → Gemini Flash deveria estar confirmado pelo TCU');
});

await test('relatório e CSV são gerados e citam as fontes', () => {
  const md = toMarkdown(report);
  assert.ok(md.includes('## 2. Vereditos'), 'markdown sem seção de vereditos');
  assert.ok(md.includes('## 9. Fontes consultadas'), 'markdown sem fontes');
  assert.ok(md.includes('https://'), 'markdown sem links de fonte');
  const csv = toCsv(report);
  assert.equal(csv.split('\n').length, report.judgements.length + 1, 'CSV com número de linhas inesperado');
});

await test('modo ao vivo só é citado como evidência, nunca como veredito direto', async () => {
  const fake = [
    {
      id: 'live-test-1',
      claim: 'Teste: fonte nomeia Claude para a GAIA Minuta.',
      quote: 'Trecho literal fictício usado apenas para verificar o pipeline de evidência externa.',
      url: 'https://example.org/fonte-de-teste',
      source: 'Teste automatizado',
      publishedOn: '2026-11-01',
      type: 'imprensa',
      reliability: 0.7,
      explicitModel: true,
      solutionIds: ['gaia-minuta'],
      modelIds: ['claude'],
    },
  ];
  const withLive = await runAgent({ query: 'GAIA Minuta', extraEvidence: fake });
  const claude = withLive.judgements.find((j) => j.solutionId === 'gaia-minuta' && j.modelId === 'claude');
  assert.ok(claude, 'evidência externa não entrou no scoring');
  assert.ok(claude.level !== 'confirmado', 'evidência externa não pode confirmar sozinha');
  assert.equal(withLive.mode, 'corpus+gemini');
});

console.log(`\nSanidade do Agente LLM-Judiciário — corpus ${report.query === '' ? 'completo' : 'filtrado'}\n`);
for (const [status, name] of results) console.log(` ${status === 'ok' ? '✓' : '✗'} ${name}`);
const failures = results.filter(([s]) => s !== 'ok');
console.log(`\n${results.length - failures.length}/${results.length} verificações passaram · ${report.judgements.length} vereditos · ${report.gaps.length} lacunas · ${MODEL_BY_ID.gemini ? 'catálogo de modelos ok' : 'catálogo quebrado'}\n`);
process.exit(failures.length ? 1 : 0);
