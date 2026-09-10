
import React, { useState, useCallback } from 'react';
import { generateTrafficCampaign, refineTrafficCampaign } from '../services/geminiService';
import type { TrafficCampaignPlan, TrafficCampaignRequest } from '../types';

/* ---- Configuração das áreas de atuação do escritório ---- */

const PRACTICE_AREAS = [
    { value: 'Direito Médico — Defesa do Médico', hint: 'Defesa ética, cível e administrativa de médicos: processos no CRM, sindicâncias, alegações de erro médico, relação com planos de saúde e hospitais.' },
    { value: 'Direito do Consumidor — Serviços Aéreos', hint: 'Passageiros lesados por voo atrasado ou cancelado, overbooking, extravio de bagagem, cobranças indevidas e problemas com companhias aéreas.' },
    { value: 'Direito Digital', hint: 'LGPD, golpes virtuais, crimes digitais, direito ao esquecimento, contratos eletrônicos e responsabilidade de plataformas e redes sociais.' },
    { value: 'Direito para Tecnologia da Informação', hint: 'Contratos de desenvolvimento de software, licenciamento, SaaS, SLA, startups, produtos e serviços de TI, propriedade intelectual de código.' },
    { value: 'Direito Público', hint: 'Licitações e contratos administrativos, defesa de servidores públicos, processos administrativos disciplinares e atuação perante órgãos públicos.' },
];

const PLATFORMS = [
    'Google Ads — Rede de Pesquisa',
    'Meta Ads — Facebook e Instagram',
    'LinkedIn Ads',
    'YouTube Ads',
    'Estratégia integrada (multicanal)',
];

const OBJECTIVES = [
    'Geração de leads qualificados',
    'Agendamento de consultas',
    'Conversão via WhatsApp',
    'Reconhecimento de marca (branding)',
    'Tráfego para site e conteúdo educativo',
];

/* ---- Componentes visuais auxiliares (estilo retrô OS/2) ---- */

const RaisedPanel: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 ${className}`}>
        <div className="bg-blue-800 text-white text-sm font-bold px-2 py-0.5">{title}</div>
        <div className="p-2">{children}</div>
    </div>
);

const Chip: React.FC<{ children: React.ReactNode; tone?: 'blue' | 'red' }> = ({ children, tone = 'blue' }) => (
    <span className={`inline-block px-2 py-0.5 m-0.5 text-sm border ${
        tone === 'blue' ? 'bg-blue-100 border-blue-800 text-blue-900' : 'bg-red-100 border-red-800 text-red-900'
    }`}>
        {children}
    </span>
);

const inputClass = "w-full p-1 border-2 bg-white border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none text-black";
const labelClass = "block text-sm font-bold mb-0.5 text-black";

const TrafficAgentApp: React.FC = () => {
    const [officeName, setOfficeName] = useState('');
    const [practiceAreaIndex, setPracticeAreaIndex] = useState(0);
    const [platform, setPlatform] = useState(PLATFORMS[0]);
    const [objective, setObjective] = useState(OBJECTIVES[0]);
    const [budget, setBudget] = useState('3000');

    const [plan, setPlan] = useState<TrafficCampaignPlan | null>(null);
    const [lastRequest, setLastRequest] = useState<TrafficCampaignRequest | null>(null);
    const [refinement, setRefinement] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildRequest = useCallback((): TrafficCampaignRequest => ({
        officeName: officeName.trim(),
        practiceArea: PRACTICE_AREAS[practiceAreaIndex].value,
        practiceAreaHint: PRACTICE_AREAS[practiceAreaIndex].hint,
        platform,
        objective,
        monthlyBudget: Math.max(0, Number(budget) || 0),
    }), [officeName, practiceAreaIndex, platform, objective, budget]);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const request = buildRequest();
        try {
            const result = await generateTrafficCampaign(request);
            setPlan(result);
            setLastRequest(request);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }, [buildRequest]);

    const handleRefine = useCallback(async () => {
        if (!refinement.trim() || !plan || !lastRequest) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await refineTrafficCampaign(refinement, plan, lastRequest);
            setPlan(result);
            setRefinement('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }, [refinement, plan, lastRequest]);

    const budgetValue = Math.max(0, Number(budget) || 0);

    return (
        <div className="h-full flex flex-col text-black bg-stone-300">
            {/* Cabeçalho */}
            <div className="px-2 py-1 bg-stone-300 border-b-2 border-stone-500">
                <h1 className="text-lg font-bold leading-tight">Agente de Tráfego Pago — Advocacia</h1>
                <p className="text-sm leading-tight">
                    Campanhas de mídia paga com compliance da OAB (Prov. 205/2021) • Direito Médico • Consumidor Aéreo • Digital • TI • Público
                </p>
            </div>

            {/* Formulário de briefing */}
            <div className="p-2 bg-stone-300 border-b-2 border-stone-500">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClass}>Escritório</label>
                        <input
                            type="text"
                            value={officeName}
                            onChange={(e) => setOfficeName(e.target.value)}
                            placeholder="Ex.: Silva & Advogados Associados"
                            className={inputClass}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Área de atuação</label>
                        <select
                            value={practiceAreaIndex}
                            onChange={(e) => setPracticeAreaIndex(Number(e.target.value))}
                            className={inputClass}
                            disabled={isLoading}
                        >
                            {PRACTICE_AREAS.map((area, i) => (
                                <option key={area.value} value={i}>{area.value}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Plataforma</label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className={inputClass}
                            disabled={isLoading}
                        >
                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Objetivo</label>
                        <select
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            className={inputClass}
                            disabled={isLoading}
                        >
                            {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Orçamento mensal (R$)</label>
                        <input
                            type="number"
                            min="0"
                            step="100"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            className={inputClass}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full px-4 py-1 font-bold bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 active:border-r-stone-100 active:border-b-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processando...' : '⚙ GERAR CAMPANHA'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Área de resultado */}
            <div className="flex-grow overflow-y-auto p-2 space-y-2 bg-stone-200">
                {error && (
                    <div className="text-red-800 font-bold p-2 bg-red-100 border-2 border-red-800">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="p-6 text-center bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                        <p className="text-lg font-bold animate-pulse">O agente está montando sua campanha...</p>
                        <p className="text-sm">Analisando área de atuação, público, canais e regras da OAB.</p>
                    </div>
                )}

                {!isLoading && !plan && !error && (
                    <div className="p-3 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                        <h2 className="font-bold text-lg border-b border-stone-400 mb-1">Como funciona</h2>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                            <li>Preencha o briefing: escritório, área, plataforma, objetivo e orçamento.</li>
                            <li>Clique em <b>Gerar Campanha</b> — o agente cria estratégia, anúncios, palavras-chave, públicos e divisão do orçamento.</li>
                            <li>Use o campo <b>Refinar</b> para iterar: peça mais anúncios, ajuste o tom ou mude o foco do funil.</li>
                        </ol>
                        <h2 className="font-bold text-lg border-b border-stone-400 mt-3 mb-1">Áreas cobertas</h2>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {PRACTICE_AREAS.map(area => <li key={area.value}>{area.value}</li>)}
                        </ul>
                    </div>
                )}

                {!isLoading && plan && (
                    <>
                        <RaisedPanel title={`Campanha: ${plan.campaignName}`}>
                            <p className="text-sm font-bold mb-1">Estratégia</p>
                            <p className="text-sm mb-2">{plan.strategy}</p>
                            <p className="text-sm font-bold mb-1">Cliente ideal (ICP)</p>
                            <p className="text-sm">{plan.targetSummary}</p>
                        </RaisedPanel>

                        <RaisedPanel title="Anúncios (copy pronta)">
                            <div className="space-y-2">
                                {plan.adCopies.map((ad, i) => (
                                    <div key={i} className="p-2 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                                        <p className="font-bold text-blue-900 leading-tight">{ad.headline}</p>
                                        <p className="text-sm">{ad.description}</p>
                                        <p className="text-sm font-bold mt-1">
                                            CTA: <span className="text-green-800">{ad.cta}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </RaisedPanel>

                        <div className="grid grid-cols-2 gap-2">
                            <RaisedPanel title="Palavras-chave">
                                <div className="bg-white p-1 border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                                    {plan.keywords.map((kw, i) => <Chip key={i}>{kw}</Chip>)}
                                </div>
                            </RaisedPanel>
                            <RaisedPanel title="Palavras-chave negativas">
                                <div className="bg-white p-1 border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                                    {plan.negativeKeywords.map((kw, i) => <Chip key={i} tone="red">{kw}</Chip>)}
                                </div>
                            </RaisedPanel>
                        </div>

                        <RaisedPanel title="Segmentação de público">
                            <ul className="list-disc list-inside text-sm space-y-1 bg-white p-2 border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                                {plan.audiences.map((aud, i) => <li key={i}>{aud}</li>)}
                            </ul>
                        </RaisedPanel>

                        <RaisedPanel title={`Distribuição do orçamento mensal — R$ ${budgetValue.toLocaleString('pt-BR')}`}>
                            <table className="w-full text-sm border-collapse bg-white">
                                <thead>
                                    <tr>
                                        <th className="text-left p-1 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 bg-stone-300">Canal / Etapa</th>
                                        <th className="text-right p-1 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 bg-stone-300">%</th>
                                        <th className="text-right p-1 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 bg-stone-300">R$/mês</th>
                                        <th className="text-left p-1 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 bg-stone-300">Justificativa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.budgetAllocation.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-1 border border-stone-400 font-bold">{item.channel}</td>
                                            <td className="p-1 border border-stone-400 text-right">{item.percentage}%</td>
                                            <td className="p-1 border border-stone-400 text-right">
                                                {budgetValue > 0
                                                    ? `R$ ${Math.round(budgetValue * item.percentage / 100).toLocaleString('pt-BR')}`
                                                    : '—'}
                                            </td>
                                            <td className="p-1 border border-stone-400">{item.rationale}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </RaisedPanel>

                        <RaisedPanel title="KPIs para acompanhar">
                            <ul className="list-disc list-inside text-sm space-y-1 bg-white p-2 border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                                {plan.kpis.map((kpi, i) => <li key={i}>{kpi}</li>)}
                            </ul>
                        </RaisedPanel>

                        <RaisedPanel title="⚖ Conformidade — OAB / Provimento 205/2021">
                            <ul className="list-disc list-inside text-sm space-y-1 bg-yellow-50 p-2 border-2 border-yellow-600">
                                {plan.complianceNotes.map((note, i) => <li key={i}>{note}</li>)}
                            </ul>
                        </RaisedPanel>
                    </>
                )}
            </div>

            {/* Barra de refinamento */}
            <div className="p-1 bg-stone-300 border-t-2 border-stone-500 flex space-x-1">
                <input
                    type="text"
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }}
                    placeholder={plan ? 'Refinar: ex. "foco em médicos de SP" ou "mais 2 anúncios"...' : 'Gere uma campanha primeiro para poder refinar...'}
                    className={inputClass}
                    disabled={isLoading || !plan}
                />
                <button
                    onClick={handleRefine}
                    disabled={isLoading || !plan || !refinement.trim()}
                    className="px-4 py-1 font-bold whitespace-nowrap bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 active:border-r-stone-100 active:border-b-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    REFINAR
                </button>
            </div>
        </div>
    );
};

export default TrafficAgentApp;
