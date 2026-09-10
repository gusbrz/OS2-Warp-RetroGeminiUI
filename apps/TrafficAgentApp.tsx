
import React, { useState, useCallback, useEffect } from 'react';
import { generateTrafficCampaign, refineTrafficCampaign } from '../services/geminiService';
import type {
    TrafficCampaignPlan,
    TrafficCampaignRequest,
    GeoLocation,
    GoogleAdsStatus,
    GeoSearchResult,
    LaunchResponse,
} from '../types';

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

const DEFAULT_LOCATIONS: GeoLocation[] = [
    { id: null, name: 'Pelotas', canonicalName: 'Pelotas, Rio Grande do Sul, Brasil' },
    { id: null, name: 'Porto Alegre', canonicalName: 'Porto Alegre, Rio Grande do Sul, Brasil' },
];

const SESSION_RESUME_KEY = 'traffic-agent-oauth-resume';

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
const buttonClass = "px-4 py-1 font-bold bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 active:border-r-stone-100 active:border-b-stone-100 disabled:opacity-50 disabled:cursor-not-allowed";

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

    /* ---- Segmentação geográfica (RS) ---- */
    const [locations, setLocations] = useState<GeoLocation[]>(DEFAULT_LOCATIONS);
    const [geoQuery, setGeoQuery] = useState('');
    const [geoResults, setGeoResults] = useState<GeoLocation[]>([]);
    const [geoSource, setGeoSource] = useState<'google' | 'offline' | null>(null);
    const [geoSearching, setGeoSearching] = useState(false);

    /* ---- Agente direto Google Ads ---- */
    const [adsStatus, setAdsStatus] = useState<GoogleAdsStatus | null>(null);
    const [landingUrl, setLandingUrl] = useState('');
    const [launchBusy, setLaunchBusy] = useState(false);
    const [validateResult, setValidateResult] = useState<LaunchResponse | null>(null);
    const [createResult, setCreateResult] = useState<LaunchResponse | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/google-ads/status');
            if (res.ok) setAdsStatus(await res.json());
        } catch {
            setAdsStatus(null);
        }
    }, []);

    /* Restaura o estado após o redirecionamento do OAuth e lê o status da conexão. */
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_RESUME_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.plan) setPlan(data.plan);
                if (data.request) setLastRequest(data.request);
                if (Array.isArray(data.locations) && data.locations.length) setLocations(data.locations);
                if (data.landingUrl) setLandingUrl(data.landingUrl);
                if (data.officeName) setOfficeName(data.officeName);
                if (typeof data.practiceAreaIndex === 'number') setPracticeAreaIndex(data.practiceAreaIndex);
                if (data.platform) setPlatform(data.platform);
                if (data.objective) setObjective(data.objective);
                if (data.budget) setBudget(data.budget);
                sessionStorage.removeItem(SESSION_RESUME_KEY);
            }
        } catch { /* sessão inválida: segue o fluxo normal */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const saveSessionForResume = useCallback(() => {
        sessionStorage.setItem(SESSION_RESUME_KEY, JSON.stringify({
            plan, request: lastRequest, locations, landingUrl,
            officeName, practiceAreaIndex, platform, objective, budget,
        }));
    }, [plan, lastRequest, locations, landingUrl, officeName, practiceAreaIndex, platform, objective, budget]);

    const buildRequest = useCallback((): TrafficCampaignRequest => ({
        officeName: officeName.trim(),
        practiceArea: PRACTICE_AREAS[practiceAreaIndex].value,
        practiceAreaHint: PRACTICE_AREAS[practiceAreaIndex].hint,
        platform,
        objective,
        monthlyBudget: Math.max(0, Number(budget) || 0),
        locations: locations.map(l => l.name),
    }), [officeName, practiceAreaIndex, platform, objective, budget, locations]);

    const handleGenerate = useCallback(async () => {
        if (locations.length === 0) {
            setError('Adicione ao menos uma localização (ex.: Pelotas, Porto Alegre).');
            return;
        }
        setIsLoading(true);
        setError(null);
        setValidateResult(null);
        setCreateResult(null);
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
    }, [buildRequest, locations.length]);

    const handleRefine = useCallback(async () => {
        if (!refinement.trim() || !plan || !lastRequest) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await refineTrafficCampaign(refinement, plan, { ...lastRequest, locations: locations.map(l => l.name) });
            setPlan(result);
            setRefinement('');
            setValidateResult(null);
            setCreateResult(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }, [refinement, plan, lastRequest, locations]);

    /* ---- Busca de localidades ---- */

    const handleGeoSearch = useCallback(async () => {
        if (geoQuery.trim().length < 2) return;
        setGeoSearching(true);
        try {
            const res = await fetch(`/api/google-ads/geo-targets/search?q=${encodeURIComponent(geoQuery.trim())}`);
            const data: GeoSearchResult = await res.json();
            setGeoResults(data.results || []);
            setGeoSource(data.source);
        } catch {
            setGeoResults([]);
            setGeoSource(null);
        } finally {
            setGeoSearching(false);
        }
    }, [geoQuery]);

    const addLocation = useCallback((loc: GeoLocation) => {
        setLocations(prev => prev.some(l => l.name.toLowerCase() === loc.name.toLowerCase()) ? prev : [...prev, loc]);
        setGeoResults([]);
        setGeoQuery('');
    }, []);

    const removeLocation = useCallback((name: string) => {
        setLocations(prev => prev.filter(l => l.name !== name));
    }, []);

    /* ---- Agente direto Google Ads ---- */

    const startOAuth = useCallback(async () => {
        try {
            const res = await fetch('/api/google-ads/auth/url');
            const data = await res.json();
            if (!data.ok) {
                setError((data.errors || ['Falha ao iniciar OAuth.']).join(' '));
                return;
            }
            saveSessionForResume(); // sobreviver ao redirecionamento do consentimento
            window.location.href = data.authUrl;
        } catch {
            setError('Falha ao iniciar a conexão com o Google.');
        }
    }, [saveSessionForResume]);

    const callLaunch = useCallback(async (endpoint: 'validate' | 'create'): Promise<LaunchResponse> => {
        const payload = {
            plan,
            request: lastRequest ? { ...lastRequest, locations: locations.map(l => l.name) } : null,
            locations,
            landingUrl: landingUrl.trim(),
        };
        const res = await fetch(`/api/google-ads/campaigns/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return (await res.json()) as LaunchResponse;
    }, [plan, lastRequest, locations, landingUrl]);

    const handleValidate = useCallback(async () => {
        setLaunchBusy(true);
        setValidateResult(null);
        setCreateResult(null);
        try {
            const result = await callLaunch('validate');
            setValidateResult(result);
        } catch (err) {
            setValidateResult({ ok: false, errors: [err instanceof Error ? err.message : 'Falha na validação.'] });
        } finally {
            setLaunchBusy(false);
        }
    }, [callLaunch]);

    const handleCreate = useCallback(async () => {
        setLaunchBusy(true);
        setCreateResult(null);
        try {
            const result = await callLaunch('create');
            setCreateResult(result);
            if (result.ok) fetchStatus();
        } catch (err) {
            setCreateResult({ ok: false, errors: [err instanceof Error ? err.message : 'Falha ao criar a campanha.'] });
        } finally {
            setLaunchBusy(false);
        }
    }, [callLaunch, fetchStatus]);

    const budgetValue = Math.max(0, Number(budget) || 0);
    const readyToLaunch = !!(adsStatus?.connected && plan && !launchBusy);

    return (
        <div className="h-full flex flex-col text-black bg-stone-300">
            {/* Cabeçalho */}
            <div className="px-2 py-1 bg-stone-300 border-b-2 border-stone-500">
                <h1 className="text-lg font-bold leading-tight">Agente de Tráfego Pago — Advocacia RS</h1>
                <p className="text-sm leading-tight">
                    Foco: Pelotas e Porto Alegre (RS) • Google Ads direto • Compliance OAB (Prov. 205/2021)
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
                            className={`w-full ${buttonClass}`}
                        >
                            {isLoading ? 'Processando...' : '⚙ GERAR CAMPANHA'}
                        </button>
                    </div>
                </div>

                {/* Segmentação geográfica */}
                <div className="mt-2">
                    <label className={labelClass}>Segmentação geográfica — Rio Grande do Sul</label>
                    <div className="flex items-start space-x-1">
                        <div className="flex-grow p-1 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 min-h-8">
                            {locations.map(loc => (
                                <span key={loc.name} className="inline-flex items-center px-2 py-0.5 m-0.5 text-sm bg-green-100 border border-green-800 text-green-900">
                                    📍 {loc.name}
                                    <button
                                        onClick={() => removeLocation(loc.name)}
                                        className="ml-1 px-1 font-bold text-red-800 hover:bg-red-200"
                                        title={`Remover ${loc.name}`}
                                        disabled={isLoading}
                                    >×</button>
                                </span>
                            ))}
                            {locations.length === 0 && <span className="text-sm text-stone-500">Nenhuma região selecionada — adicione ao menos uma.</span>}
                        </div>
                        <input
                            type="text"
                            value={geoQuery}
                            onChange={(e) => setGeoQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleGeoSearch(); }}
                            placeholder="Cidade do RS (ex.: Rio Grande)"
                            className={`w-48 ${inputClass}`}
                            disabled={isLoading || geoSearching}
                        />
                        <button onClick={handleGeoSearch} disabled={isLoading || geoSearching || geoQuery.trim().length < 2} className={buttonClass}>
                            {geoSearching ? '...' : 'BUSCAR'}
                        </button>
                    </div>
                    {geoResults.length > 0 && (
                        <div className="mt-1 p-1 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                            {geoResults.map(loc => (
                                <button
                                    key={loc.canonicalName || loc.name}
                                    onClick={() => addLocation(loc)}
                                    className="block w-full text-left px-1 py-0.5 text-sm hover:bg-blue-100"
                                >
                                    + {loc.canonicalName || loc.name}
                                    {loc.verified ? ' ✔ Google' : ' (base offline)'}
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="text-xs mt-0.5 text-stone-700">
                        Google Ads alcançará apenas pessoas <b>localizadas</b> nessas regiões (segmentação por presença).
                        {geoSource === 'offline' && ' Base offline — os IDs oficiais são resolvidos na conexão com o Google Ads.'}
                    </p>
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
                        <p className="text-sm">Analisando área de atuação, região RS, público, canais e regras da OAB.</p>
                    </div>
                )}

                {!isLoading && !plan && !error && (
                    <div className="p-3 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                        <h2 className="font-bold text-lg border-b border-stone-400 mb-1">Como funciona</h2>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                            <li>Preencha o briefing e confirme as regiões de alcance (padrão: <b>Pelotas</b> e <b>Porto Alegre</b>).</li>
                            <li>Clique em <b>Gerar Campanha</b> — o agente cria estratégia, anúncios, palavras-chave regionais, públicos e orçamento.</li>
                            <li>Refine em conversa e, quando aprovar, <b>publique direto no Google Ads</b> (criada sempre pausada).</li>
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

                {/* ============ AGENTE DIRETO GOOGLE ADS ============ */}
                <RaisedPanel title="🚀 Agente direto — Publicar no Google Ads">
                    {!adsStatus && (
                        <p className="text-sm">Verificando configuração do Google Ads...</p>
                    )}

                    {adsStatus && adsStatus.missing.length > 0 && (
                        <div className="text-sm space-y-1">
                            <p className="font-bold">Para atuar direto no Google Ads, configure no arquivo .env.local:</p>
                            <ul className="list-disc list-inside ml-1">
                                {adsStatus.missing.map(m => <li key={m} className="font-bold text-red-800">{m}</li>)}
                            </ul>
                            <p className="text-stone-700">
                                Veja o passo a passo no README (seção "Agente direto no Google Ads"): developer token,
                                Customer ID e cliente OAuth da Google Cloud. Enquanto isso, o agente segue gerando
                                os planos de campanha normalmente.
                            </p>
                        </div>
                    )}

                    {adsStatus && adsStatus.missing.length === 0 && !adsStatus.connected && (
                        <div className="text-sm space-y-2">
                            {adsStatus.accountError ? (
                                <p className="text-red-800 font-bold">Conta não acessível: {adsStatus.accountError}</p>
                            ) : (
                                <p>Credenciais encontradas. Autorize o acesso à sua conta Google Ads para publicar.</p>
                            )}
                            <button onClick={startOAuth} className={buttonClass}>🔗 CONECTAR CONTA GOOGLE ADS</button>
                        </div>
                    )}

                    {adsStatus?.connected && (
                        <div className="text-sm space-y-2">
                            <p>
                                <span className="px-1 bg-green-200 border border-green-800 font-bold">● Conectado</span>{' '}
                                Conta: <b>{adsStatus.account?.descriptiveName}</b> (ID {adsStatus.account?.id}) • API {adsStatus.apiVersion}
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={labelClass}>URL da página de destino</label>
                                    <input
                                        type="url"
                                        value={landingUrl}
                                        onChange={(e) => setLandingUrl(e.target.value)}
                                        placeholder="https://www.seuescritorio.adv.br"
                                        className={inputClass}
                                        disabled={launchBusy}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Alcance geográfico</label>
                                    <div className="p-1 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 text-sm">
                                        {locations.map(l => l.name).join(' • ') || '—'}
                                    </div>
                                </div>
                            </div>

                            {!plan && (
                                <p className="font-bold">Gere um plano de campanha acima para validar e publicar.</p>
                            )}

                            {plan && (
                                <div className="flex items-center space-x-2">
                                    <button onClick={handleValidate} disabled={!readyToLaunch || !landingUrl.trim()} className={buttonClass}>
                                        1. {launchBusy && !validateResult ? '...' : 'VALIDAR NO GOOGLE ADS'}
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!readyToLaunch || !landingUrl.trim() || !validateResult?.ok}
                                        className={buttonClass}
                                        title={!validateResult?.ok ? 'Valide primeiro' : 'Cria a campanha PAUSADA na sua conta'}
                                    >
                                        2. {launchBusy && validateResult?.ok ? '...' : 'CRIAR CAMPANHA (PAUSADA)'}
                                    </button>
                                </div>
                            )}

                            {validateResult && (
                                validateResult.ok && validateResult.summary ? (
                                    <div className="p-2 bg-green-50 border-2 border-green-700">
                                        <p className="font-bold text-green-900">✔ Validação aprovada pelo Google Ads (nada foi criado ainda)</p>
                                        <ul className="list-disc list-inside">
                                            <li>Campanha: <b>{validateResult.summary.campaignName}</b></li>
                                            <li>Orçamento diário calculado: R$ {validateResult.summary.dailyBudgetBrl.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</li>
                                            <li>Regiões: {validateResult.summary.locations.join(' • ')}</li>
                                            <li>{validateResult.summary.keywords.length} palavras-chave (frase) + 1 anúncio responsivo de busca</li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-red-100 border-2 border-red-800">
                                        <p className="font-bold text-red-800">✖ Validação reprovada — ajuste e tente novamente:</p>
                                        <ul className="list-disc list-inside">
                                            {validateResult.errors?.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    </div>
                                )
                            )}

                            {createResult && (
                                createResult.ok && createResult.resources ? (
                                    <div className="p-2 bg-green-50 border-2 border-green-800">
                                        <p className="font-bold text-green-900">✔ Campanha criada no Google Ads — status: PAUSADA</p>
                                        <ul className="list-disc list-inside">
                                            <li>{createResult.resources.campaign}</li>
                                            <li>Regiões: {createResult.resources.locations.join(' • ')}</li>
                                        </ul>
                                        {createResult.campaignUrl && (
                                            <p className="mt-1">
                                                Revise e ative em:{' '}
                                                <a href={createResult.campaignUrl} target="_blank" rel="noreferrer" className="text-blue-800 underline font-bold">
                                                    abrir Google Ads ↗
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-2 bg-red-100 border-2 border-red-800">
                                        <p className="font-bold text-red-800">✖ Falha ao criar a campanha:</p>
                                        <ul className="list-disc list-inside">
                                            {createResult.errors?.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    </div>
                                )
                            )}

                            <p className="text-xs text-stone-700 border-t border-stone-400 pt-1">
                                Segurança: campanhas são criadas sempre <b>PAUSADAS</b> com segmentação por presença
                                (somente RS). O orçamento diário = mensal ÷ 30,4 e cobranças só ocorrem após você
                                ativar a campanha no painel do Google Ads.
                            </p>
                        </div>
                    )}
                </RaisedPanel>
            </div>

            {/* Barra de refinamento */}
            <div className="p-1 bg-stone-300 border-t-2 border-stone-500 flex space-x-1">
                <input
                    type="text"
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }}
                    placeholder={plan ? 'Refinar: ex. "foco em médicos de Pelotas" ou "mais 2 anúncios"...' : 'Gere uma campanha primeiro para poder refinar...'}
                    className={inputClass}
                    disabled={isLoading || !plan}
                />
                <button
                    onClick={handleRefine}
                    disabled={isLoading || !plan || !refinement.trim()}
                    className={`whitespace-nowrap ${buttonClass}`}
                >
                    REFINAR
                </button>
            </div>
        </div>
    );
};

export default TrafficAgentApp;
