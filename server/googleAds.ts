
import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Middleware do "Agente Direto Google Ads".
 *
 * Roda dentro do dev server (Vite) para manter as credenciais do Google Ads
 * SOMENTE no lado do servidor — o bundle do navegador nunca vê tokens.
 *
 * Endpoints:
 *   GET  /api/google-ads/status                 -> estado da configuração/conexão
 *   GET  /api/google-ads/auth/url               -> URL de consentimento OAuth2
 *   GET  /api/google-ads/auth/callback          -> troca o "code" por tokens
 *   GET  /api/google-ads/geo-targets/search?q=  -> cidades (Google ao vivo ou base offline RS)
 *   POST /api/google-ads/campaigns/validate     -> mutate com validate_only (não cria nada)
 *   POST /api/google-ads/campaigns/create       -> cria a campanha SEMPRE PAUSADA
 */

interface GoogleAdsConfig {
    developerToken: string;
    customerId: string;
    loginCustomerId: string;
    clientId: string;
    clientSecret: string;
    apiVersion: string;
    refreshToken: string;
}

interface RuntimeState {
    refreshToken: string;
    accessToken: string;
    accessTokenExpiresAt: number;
    accountCache: { id: string; descriptiveName: string; fetchedAt: number } | null;
    geoCache: Record<string, { id: string; name: string; canonicalName: string; targetType: string }>;
}

const state: RuntimeState = {
    refreshToken: '',
    accessToken: '',
    accessTokenExpiresAt: 0,
    accountCache: null,
    geoCache: {},
};

let storedEnv: Record<string, string> = {};

/** Cidades relevantes do RS (usadas quando ainda não há credenciais Google). Sem IDs: os IDs
 *  oficiais são resolvidos ao vivo pela API geoTargetConstants:suggest após a conexão. */
const OFFLINE_RS_LOCATIONS = [
    'Porto Alegre', 'Pelotas', 'Canoas', 'Caxias do Sul', 'Santa Maria', 'Gravataí',
    'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Cachoeirinha',
    'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul', 'Passo Fundo', 'Bagé',
    'Bento Gonçalves', 'Erechim', 'Guaíba', 'Esteio', 'Farroupilha', 'Rio Grande do Sul (Estado)',
];

const normalizeText = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function readEnv(key: string): string {
    return (storedEnv[key] || process.env[key] || '').trim();
}

function getConfig(): GoogleAdsConfig {
    return {
        developerToken: readEnv('GOOGLE_ADS_DEVELOPER_TOKEN'),
        customerId: readEnv('GOOGLE_ADS_CUSTOMER_ID').replace(/[^\d]/g, ''),
        loginCustomerId: readEnv('GOOGLE_ADS_LOGIN_CUSTOMER_ID').replace(/[^\d]/g, ''),
        clientId: readEnv('GOOGLE_CLIENT_ID'),
        clientSecret: readEnv('GOOGLE_CLIENT_SECRET'),
        apiVersion: readEnv('GOOGLE_ADS_API_VERSION') || 'v24',
        refreshToken: readEnv('GOOGLE_ADS_REFRESH_TOKEN') || state.refreshToken,
    };
}

function missingConfig(cfg: GoogleAdsConfig): string[] {
    const missing: string[] = [];
    if (!cfg.developerToken) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
    if (!cfg.customerId) missing.push('GOOGLE_ADS_CUSTOMER_ID');
    if (!cfg.clientId) missing.push('GOOGLE_CLIENT_ID');
    if (!cfg.clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!cfg.refreshToken) missing.push('conexão OAuth (botão "Conectar conta Google")');
    return missing;
}

const isFullyConfigured = (cfg: GoogleAdsConfig) => missingConfig(cfg).length === 0;

/* ---------- utilidades HTTP ---------- */

function json(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        req.on('error', reject);
    });
}

/** Mensagens de erro legíveis a partir de um GoogleAdsFailure. */
function parseGoogleFailure(data: any): string[] {
    const errors: string[] = [];
    const details = data?.error?.details;
    if (Array.isArray(details)) {
        for (const detail of details) {
            for (const e of detail?.errors ?? []) {
                const code = e?.errorCode ? Object.values(e.errorCode)[0] : 'ERRO';
                const field = e?.location?.fieldPathElements?.map((f: any) => f.fieldName).join('.');
                errors.push(field ? `[${code}] ${e.message} (campo: ${field})` : `[${code}] ${e.message}`);
            }
        }
    }
    if (errors.length === 0 && data?.error?.message) errors.push(String(data.error.message));
    return errors;
}

/* ---------- Google APIs ---------- */

async function googleFetch(url: string, cfg: GoogleAdsConfig, init: RequestInit = {}) {
    const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(30_000),
    });
    const data: any = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
}

async function ensureAccessToken(cfg: GoogleAdsConfig): Promise<string> {
    if (state.accessToken && Date.now() < state.accessTokenExpiresAt - 60_000) {
        return state.accessToken;
    }
    const { ok, data } = await googleFetch('https://oauth2.googleapis.com/token', cfg, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: cfg.clientId,
            client_secret: cfg.clientSecret,
            refresh_token: cfg.refreshToken,
            grant_type: 'refresh_token',
        }).toString(),
    });
    if (!ok || !data.access_token) {
        throw new Error(`Falha ao renovar o token de acesso: ${data?.error_description || data?.error || 'erro desconhecido'}. Refaça a conexão OAuth.`);
    }
    state.accessToken = data.access_token;
    state.accessTokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
    return state.accessToken;
}

function adsHeaders(cfg: GoogleAdsConfig, accessToken: string): Record<string, string> {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': cfg.developerToken,
        'Content-Type': 'application/json',
    };
    if (cfg.loginCustomerId) headers['login-customer-id'] = cfg.loginCustomerId;
    return headers;
}

async function fetchAccountInfo(cfg: GoogleAdsConfig): Promise<{ id: string; descriptiveName: string }> {
    if (state.accountCache && Date.now() - state.accountCache.fetchedAt < 60_000) {
        return { id: state.accountCache.id, descriptiveName: state.accountCache.descriptiveName };
    }
    const accessToken = await ensureAccessToken(cfg);
    const { ok, data } = await googleFetch(
        `https://googleads.googleapis.com/${cfg.apiVersion}/customers/${cfg.customerId}/googleAds:search`,
        cfg,
        {
            method: 'POST',
            headers: adsHeaders(cfg, accessToken),
            body: JSON.stringify({ query: 'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1' }),
        },
    );
    const row = data?.results?.[0]?.customer;
    if (!ok || !row) {
        const errors = parseGoogleFailure(data);
        throw new Error(errors[0] || 'Não foi possível ler a conta Google Ads. Verifique o Customer ID e o login-customer-id.');
    }
    state.accountCache = { id: String(row.id), descriptiveName: row.descriptiveName || 'Conta Google Ads', fetchedAt: Date.now() };
    return { id: state.accountCache.id, descriptiveName: state.accountCache.descriptiveName };
}

/** Resolve nomes de locais (ex.: "Pelotas") em geo target constants oficiais do Google. */
async function suggestGeoTargets(cfg: GoogleAdsConfig, names: string[]) {
    const accessToken = await ensureAccessToken(cfg);
    const resolved: Record<string, { id: string; name: string; canonicalName: string; targetType: string }> = {};
    const notFound: string[] = [];

    for (const name of names) {
        const key = normalizeText(name);
        if (state.geoCache[key]) { resolved[key] = state.geoCache[key]; continue; }
        const { ok, data } = await googleFetch(
            `https://googleads.googleapis.com/${cfg.apiVersion}/customers/${cfg.customerId}/geoTargetConstants:suggest`,
            cfg,
            {
                method: 'POST',
                headers: adsHeaders(cfg, accessToken),
                body: JSON.stringify({
                    locationNames: { names: [name] },
                    countryCode: 'BR',
                }),
            },
        );
        const suggestion = data?.geoTargetConstantSuggestions?.[0]?.geoTargetConstant;
        if (ok && suggestion) {
            const entry = {
                id: String(suggestion.id),
                name: suggestion.name,
                canonicalName: suggestion.canonicalName,
                targetType: suggestion.targetType,
            };
            state.geoCache[key] = entry;
            resolved[key] = entry;
        } else {
            notFound.push(name);
        }
    }
    return { resolved, notFound };
}

/* ---------- construção da campanha ---------- */

const MAX_HEADLINE = 30;
const MAX_DESCRIPTION = 90;
const PORTUGUESE_LANGUAGE_CONSTANT = 'languageConstants/1014';

interface LaunchPayload {
    plan: {
        campaignName: string;
        adCopies: { headline: string; description: string; cta: string }[];
        keywords: string[];
    };
    request: { practiceArea: string; monthlyBudget: number; objective: string };
    locations: { name: string; id?: string | null }[];
    landingUrl: string;
}

function validatePayload(payload: LaunchPayload, cfg: GoogleAdsConfig): string[] {
    const errors: string[] = [];
    if (!payload?.plan?.campaignName) errors.push('Gere um plano de campanha antes de publicar.');
    if (!Array.isArray(payload?.plan?.adCopies) || payload.plan.adCopies.length < 3) errors.push('O plano precisa de pelo menos 3 anúncios.');
    if (!Array.isArray(payload?.plan?.keywords) || payload.plan.keywords.length === 0) errors.push('O plano precisa de palavras-chave.');
    if (!Array.isArray(payload?.locations) || payload.locations.length === 0) errors.push('Informe ao menos uma localização (ex.: Pelotas, Porto Alegre).');
    if (!/^https?:\/\/.+\..+/.test(payload?.landingUrl || '')) errors.push('Informe uma URL de destino válida (https://...).');
    if (!payload?.request?.monthlyBudget || payload.request.monthlyBudget < 300) errors.push('Orçamento mensal mínimo de R$ 300 para publicar.');
    return errors;
}

function truncate(text: string, max: number): string {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + '…';
}

function buildMutateOperations(payload: LaunchPayload, cfg: GoogleAdsConfig, resolvedGeo: { id: string; name: string }[]) {
    const cid = cfg.customerId;
    const budgetTemp = `customers/${cid}/campaignBudgets/-1`;
    const campaignTemp = `customers/${cid}/campaigns/-2`;
    const adGroupTemp = `customers/${cid}/adGroups/-3`;

    const stamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const campaignName = `${payload.plan.campaignName} [${stamp}]`;
    const dailyMicros = String(Math.max(Math.round((payload.request.monthlyBudget / 30.44) * 1_000_000), 10_000_000));

    const operations: Record<string, unknown>[] = [
        {
            campaignBudgetOperation: {
                create: {
                    resourceName: budgetTemp,
                    name: `Orçamento — ${campaignName}`,
                    amountMicros: dailyMicros,
                    deliveryMethod: 'STANDARD',
                    explicitlyShared: false,
                },
            },
        },
        {
            campaignOperation: {
                create: {
                    resourceName: campaignTemp,
                    name: campaignName,
                    advertisingChannelType: 'SEARCH',
                    status: 'PAUSED', // segurança: NUNCA ativar automaticamente
                    campaignBudget: budgetTemp,
                    containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
                    networkSettings: {
                        targetGoogleSearch: true,
                        targetSearchNetwork: true,
                        targetContentNetwork: false,
                    },
                    geoTargetTypeSetting: {
                        positiveGeoTargetType: 'PRESENCE', // somente pessoas LOCALIZADAS nas cidades
                        negativeGeoTargetType: 'PRESENCE',
                    },
                    manualCpc: { enhancedCpcEnabled: false },
                },
            },
        },
    ];

    for (const geo of resolvedGeo) {
        operations.push({
            campaignCriterionOperation: {
                create: {
                    campaign: campaignTemp,
                    location: { geoTargetConstant: `geoTargetConstants/${geo.id}` },
                    status: 'ENABLED',
                },
            },
        });
    }

    operations.push({
        campaignCriterionOperation: {
            create: {
                campaign: campaignTemp,
                language: { languageConstant: PORTUGUESE_LANGUAGE_CONSTANT },
                status: 'ENABLED',
            },
        },
    });

    operations.push({
        adGroupOperation: {
            create: {
                resourceName: adGroupTemp,
                campaign: campaignTemp,
                name: `Grupo — ${truncate(payload.request.practiceArea, 60)}`,
                type: 'SEARCH_STANDARD',
                status: 'ENABLED',
                cpcBidMicros: '3000000', // lance inicial de R$ 3,00 — ajuste fino depois
            },
        },
    });

    const uniqueKeywords = [...new Set(payload.plan.keywords.map(k => k.trim()).filter(Boolean))].slice(0, 10);
    for (const keyword of uniqueKeywords) {
        operations.push({
            adGroupCriterionOperation: {
                create: {
                    adGroup: adGroupTemp,
                    keyword: { text: keyword, matchType: 'PHRASE' },
                    status: 'ENABLED',
                },
            },
        });
    }

    const headlines = payload.plan.adCopies.slice(0, 3).map(ad => ({ text: truncate(ad.headline, MAX_HEADLINE) }));
    const descriptions = payload.plan.adCopies.slice(0, 2).map(ad => ({ text: truncate(ad.description, MAX_DESCRIPTION) }));

    operations.push({
        adGroupAdOperation: {
            create: {
                adGroup: adGroupTemp,
                ad: {
                    finalUrls: [payload.landingUrl],
                    responsiveSearchAd: { headlines, descriptions },
                },
                status: 'ENABLED',
            },
        },
    });

    return { operations, campaignName, uniqueKeywords, dailyMicros };
}

async function runMutate(payload: LaunchPayload, validateOnly: boolean) {
    const cfg = getConfig();
    const missing = missingConfig(cfg);
    if (missing.length) return { ok: false, errors: [`Configuração incompleta: ${missing.join(', ')}`] };

    const payloadErrors = validatePayload(payload, cfg);
    if (payloadErrors.length) return { ok: false, errors: payloadErrors };

    // Resolve os IDs geográficos oficiais sempre pela API do Google (fonte da verdade).
    const names = payload.locations.map(l => l.name);
    const { resolved, notFound } = await suggestGeoTargets(cfg, names);
    if (notFound.length) {
        return { ok: false, errors: [`Localização não encontrada no Google Ads: ${notFound.join(', ')}. Tente o nome oficial da cidade (ex.: "Pelotas", "Porto Alegre").`] };
    }
    const geoList = names.map(n => resolved[normalizeText(n)]).filter(Boolean);

    const { operations, campaignName, uniqueKeywords, dailyMicros } = buildMutateOperations(payload, cfg, geoList);
    const accessToken = await ensureAccessToken(cfg);

    const { ok, data } = await googleFetch(
        `https://googleads.googleapis.com/${cfg.apiVersion}/customers/${cfg.customerId}/googleAds:mutate`,
        cfg,
        {
            method: 'POST',
            headers: adsHeaders(cfg, accessToken),
            body: JSON.stringify({ mutateOperations: operations, partialFailure: false, validateOnly }),
        },
    );

    if (!ok) {
        const errors = parseGoogleFailure(data);
        return { ok: false, errors: errors.length ? errors : ['O Google Ads rejeitou a operação. Verifique as credenciais e tente novamente.'] };
    }

    if (validateOnly) {
        return {
            ok: true,
            summary: {
                campaignName,
                operationsPreview: operations.length,
                keywords: uniqueKeywords,
                locations: geoList.map(g => `${g.name} (ID ${g.id})`),
                dailyBudgetMicros: dailyMicros,
                dailyBudgetBrl: Number(dailyMicros) / 1_000_000,
            },
        };
    }

    const responses: any[] = data?.mutateOperationResponses ?? [];
    const findResult = (key: string) => responses.map(r => r?.[key]?.resourceName).find(Boolean) || '';

    return {
        ok: true,
        resources: {
            campaign: findResult('campaignResult'),
            budget: findResult('campaignBudgetResult'),
            adGroup: findResult('adGroupResult'),
            keywords: uniqueKeywords.length,
            locations: geoList.map(g => `${g.name} (ID ${g.id})`),
            campaignName,
        },
        campaignUrl: `https://ads.google.com/aw/campaigns?ocid=${cfg.customerId}`,
    };
}

/* ---------- OAuth2 ---------- */

function getOrigin(req: IncomingMessage): string {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host || 'localhost:5173';
    return `${proto}://${host}`;
}

function persistRefreshToken(refreshToken: string) {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
        const line = `GOOGLE_ADS_REFRESH_TOKEN=${refreshToken}`;
        if (/^GOOGLE_ADS_REFRESH_TOKEN=.*/m.test(content)) {
            content = content.replace(/^GOOGLE_ADS_REFRESH_TOKEN=.*/m, line);
        } else {
            content = `${content.replace(/\n*$/, '')}\n${line}\n`;
        }
        fs.writeFileSync(envPath, content, 'utf-8');
    } catch (err) {
        console.warn('[google-ads] Não foi possível persistir o refresh token em .env.local:', err);
    }
}

/* ---------- roteador ---------- */

async function route(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const cfg = getConfig();

    try {
        if (req.method === 'GET' && pathname === '/api/google-ads/status') {
            const missing = missingConfig(cfg);
            let account: { id: string; descriptiveName: string } | null = null;
            let accountError: string | null = null;
            if (missing.length === 0) {
                try { account = await fetchAccountInfo(cfg); } catch (err) { accountError = err instanceof Error ? err.message : String(err); }
            }
            return json(res, 200, {
                connected: missing.length === 0 && !!account,
                apiVersion: cfg.apiVersion,
                customerId: cfg.customerId || null,
                missing,
                account,
                accountError,
            });
        }

        if (req.method === 'GET' && pathname === '/api/google-ads/auth/url') {
            if (!cfg.clientId || !cfg.clientSecret) {
                return json(res, 400, { ok: false, errors: ['Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.local para usar OAuth.'] });
            }
            const redirectUri = `${getOrigin(req)}/api/google-ads/auth/callback`;
            const params = new URLSearchParams({
                client_id: cfg.clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/adwords',
                access_type: 'offline',
                prompt: 'consent',
            });
            return json(res, 200, { ok: true, authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, redirectUri });
        }

        if (req.method === 'GET' && pathname === '/api/google-ads/auth/callback') {
            const code = url.searchParams.get('code');
            const oauthError = url.searchParams.get('error');
            const html = (title: string, body: string) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${body.includes('OK') ? '<meta http-equiv="refresh" content="2;url=/">' : ''}</head><body style="font-family:monospace;padding:2rem">${body}</body></html>`);
            };
            if (oauthError || !code) return html('Erro', `<h2>Falha na autorização</h2><p>${oauthError || 'Código ausente.'}</p>`);

            const redirectUri = `${getOrigin(req)}/api/google-ads/auth/callback`;
            const { ok, data } = await googleFetch('https://oauth2.googleapis.com/token', cfg, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: cfg.clientId,
                    client_secret: cfg.clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }).toString(),
            });
            if (!ok || !data.refresh_token) {
                return html('Erro', `<h2>Falha ao trocar o código por tokens</h2><p>${data?.error_description || data?.error || 'Tente novamente.'}</p>`);
            }
            state.refreshToken = data.refresh_token;
            state.accessToken = data.access_token || '';
            state.accessTokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
            state.accountCache = null;
            persistRefreshToken(data.refresh_token);
            return html('Conectado', '<h2>OK — Google Ads conectado!</h2><p>Voltando para o Agente de Tráfego...</p>');
        }

        if (req.method === 'GET' && pathname === '/api/google-ads/geo-targets/search') {
            const query = (url.searchParams.get('q') || '').trim();
            if (query.length < 2) return json(res, 200, { source: 'offline', results: [] });

            if (isFullyConfigured(cfg)) {
                const { resolved, notFound } = await suggestGeoTargets(cfg, [query]);
                const entry = resolved[normalizeText(query)];
                if (entry) {
                    return json(res, 200, {
                        source: 'google',
                        results: [{ id: entry.id, name: entry.name, canonicalName: entry.canonicalName, type: entry.targetType, verified: true }],
                    });
                }
                return json(res, 200, { source: 'google', results: [], message: notFound.join(', ') });
            }

            const nq = normalizeText(query);
            const results = OFFLINE_RS_LOCATIONS
                .filter(name => normalizeText(name).includes(nq))
                .slice(0, 8)
                .map(name => ({ id: null, name, canonicalName: `${name}, Rio Grande do Sul, Brasil`, type: 'OFFLINE', verified: false }));
            return json(res, 200, { source: 'offline', results });
        }

        if (req.method === 'POST' && (pathname === '/api/google-ads/campaigns/validate' || pathname === '/api/google-ads/campaigns/create')) {
            const raw = await readBody(req);
            let payload: LaunchPayload;
            try { payload = JSON.parse(raw); } catch { return json(res, 400, { ok: false, errors: ['Corpo da requisição inválido.'] }); }
            const result = await runMutate(payload, pathname.endsWith('/validate'));
            return json(res, result.ok ? 200 : 400, result);
        }

        return json(res, 404, { ok: false, errors: ['Endpoint não encontrado.'] });
    } catch (err) {
        console.error('[google-ads]', err);
        return json(res, 500, { ok: false, errors: [err instanceof Error ? err.message : String(err)] });
    }
}

export function googleAdsAgentPlugin(env: Record<string, string>): Plugin {
    storedEnv = env;
    return {
        name: 'google-ads-agent',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (!req.url?.startsWith('/api/google-ads')) return next();
                void route(req, res);
            });
        },
    };
}
