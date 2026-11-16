#!/usr/bin/env node
/**
 * Agente LLM-Judiciário — execução headless.
 *
 *   node scripts/jud-llm-agent.mjs [consulta...] [--court tjrs,trf4] [--out arquivo.md]
 *                                  [--csv arquivo.csv] [--json] [--levels confirmado,provavel] [--list]
 *
 *   npm run agente -- "qual LLM o TJRS usa na GAIA Minuta" --out docs/relatorio.md
 *
 * Roda 100% offline sobre o corpus curado (data/judiciaryLlmCorpus.ts): o mesmo
 * pipeline que a janela "Agente LLM-Judiciário" executa na área de trabalho.
 * Requer Node >= 22.18 (import de .ts por type-stripping).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { runAgent, toMarkdown, toCsv, LEVEL_LABEL } from '../agents/llmIntelAgent.ts';
import { SOLUTIONS, COURTS, CORPUS_VERSION } from '../data/judiciaryLlmCorpus.ts';

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    if (['out', 'csv', 'levels', 'court', 'model'].includes(key)) flags.set(key, args[++i]);
    else flags.set(key, true);
  } else {
    positional.push(arg);
  }
}

const query = positional.join(' ').trim();

if (flags.get('list')) {
  console.log(`\nCorpus v${CORPUS_VERSION} — ${SOLUTIONS.length} soluções mapeadas\n`);
  for (const court of COURTS) {
    const owned = SOLUTIONS.filter((s) => s.courtId === court.id);
    if (!owned.length) continue;
    console.log(`${court.acronym.padEnd(7)} ${court.name}`);
    for (const s of owned) console.log(`   · ${s.name} [${s.status}] — modelos declarados: ${s.declaredModelIds.join(', ') || 'nenhum'}`);
  }
  console.log('');
  process.exit(0);
}

const splitFlag = (key) => (flags.get(key) ? String(flags.get(key)).split(',').map((v) => v.trim()).filter(Boolean) : []);
const VALID_LEVELS = ['confirmado', 'provavel', 'indicio', 'nao-declarado'];

const report = await runAgent({
  query,
  courtIds: splitFlag('court'),
  modelIds: splitFlag('model'),
  levelFilter: splitFlag('levels').filter((l) => VALID_LEVELS.includes(l)),
  onEvent: (event) => {
    if (event.type === 'step-start') console.log(`… ${event.step.label}`);
    if (event.type === 'step-end' || event.type === 'notice') {
      const mark = event.step.status === 'aviso' ? '!' : event.step.status === 'vazio' ? '·' : '✓';
      console.log(`  ${mark} ${event.step.label}: ${event.step.detail}`);
    }
  },
});

if (flags.get('json')) {
  const target = typeof flags.get('json') === 'string' ? flags.get('json') : null;
  const payload = JSON.stringify(report, null, 2);
  if (target) {
    await writeFile(resolve(process.cwd(), target), payload, 'utf8');
    console.log(`JSON gravado em ${target}`);
  } else {
    console.log(payload);
  }
}

const markdown = toMarkdown(report);

console.log(`\n=== VEREDITOS (${report.judgements.length}) ===`);
for (const j of report.judgements) {
  console.log(`${LEVEL_LABEL[j.level].padEnd(13)} ${j.courtAcronym.padEnd(7)} ${j.solutionName.split('—')[0].trim().padEnd(38)} ${j.modelLabel} (score ${j.score.toFixed(2)}, ${j.independentSources} fonte(s))`);
}
if (!report.judgements.length) console.log('(nenhum veredito com evidência suficiente neste escopo)');

console.log(`\n=== LACUNAS (${report.gaps.length}) ===`);
for (const gap of report.gaps) {
  console.log(`${gap.courtAcronym} · ${gap.solutionName}`);
  for (const q of gap.questions) console.log(`   ? ${q}`);
  if (!gap.questions.length) console.log('   ? falta a ficha da solução no Sinapses e o contrato/ETP');
}

if (!flags.get('json')) {
  const out = typeof flags.get('out') === 'string' ? flags.get('out') : 'docs/RELATORIO-LLM-JUDICIARIO.md';
  const csv = typeof flags.get('csv') === 'string' ? flags.get('csv') : null;
  const outPath = resolve(process.cwd(), out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, markdown, 'utf8');
  console.log(`\nRelatório: ${out} (${markdown.split('\n').length} linhas)`);
  if (csv) {
    const csvPath = resolve(process.cwd(), csv);
    await mkdir(dirname(csvPath), { recursive: true });
    await writeFile(csvPath, toCsv(report), 'utf8');
    console.log(`CSV:       ${csv}`);
  }
}

process.exit(0);
