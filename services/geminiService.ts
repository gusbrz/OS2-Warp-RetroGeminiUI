
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Recipe, TodoItem, TrafficCampaignPlan, TrafficCampaignRequest } from '../types';

let ai: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
    if (!process.env.API_KEY) {
        throw new Error("Chave de API não configurada. Defina GEMINI_API_KEY no arquivo .env.local.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING, description: "Name of the recipe" },
        description: { type: Type.STRING, description: "A brief, enticing description of the dish." },
        ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of ingredients with quantities."
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Step-by-step cooking instructions."
        },
    },
    required: ["recipeName", "description", "ingredients", "instructions"]
};

export const generateRecipe = async (prompt: string): Promise<Recipe> => {
    try {
        const response: GenerateContentResponse = await getClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a recipe based on the following request: ${prompt}. Be creative and clear.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            }
        });
        const text = response.text.trim();
        return JSON.parse(text) as Recipe;
    } catch (error) {
        console.error("Error generating recipe:", error);
        throw new Error("Failed to generate a recipe from the prompt.");
    }
};

const todoListSchema = {
    type: Type.ARRAY,
    description: "The updated list of to-do items.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.INTEGER, description: "Unique identifier for the task" },
            task: { type: Type.STRING, description: "The description of the task." },
            completed: { type: Type.BOOLEAN, description: "Whether the task is completed." },
        },
        required: ["id", "task", "completed"],
    }
};

export const updateTodoList = async (command: string, currentTodos: TodoItem[]): Promise<TodoItem[]> => {
    try {
        const prompt = `
            You are a to-do list management assistant.
            The user's command is: "${command}".
            The current to-do list is:
            ${JSON.stringify(currentTodos, null, 2)}

            Based on the command, return the new, complete JSON array of to-do items.
            - If adding a task, add it to the list with a new unique ID (use the next available integer) and 'completed: false'.
            - If removing or completing a task, find the relevant task and modify or delete it.
            - If clearing the list, return an empty array.
            - Do not add commentary, just the JSON array.
        `;

        const response: GenerateContentResponse = await getClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: todoListSchema,
            }
        });
        
        const text = response.text.trim();
        return JSON.parse(text) as TodoItem[];
    } catch (error) {
        console.error("Error updating to-do list:", error);
        throw new Error("Failed to update the to-do list.");
    }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
     try {
        const response = await getClient().models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `Retro pixel art style. ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate an image from the prompt.");
    }
};

/* ------------------------------------------------------------------
 * AGENTE DE TRÁFEGO PAGO PARA ADVOCACIA
 * ------------------------------------------------------------------ */

const TRAFFIC_AGENT_SYSTEM_PROMPT = `
Você é o "Agente de Tráfego Pago", um gestor sênior de mídia paga ESPECIALIZADO em marketing jurídico para escritórios de advocacia no Brasil.

Você domina:
- Google Ads (Pesquisa, Display, Performance Max), Meta Ads (Facebook/Instagram), LinkedIn Ads e YouTube Ads.
- Funil de conversão jurídica: descoberta -> consideração -> contato (lead) -> consulta agendada -> contrato.
- Copywriting sóbrio e persuasivo para serviços advocatícios de alto valor.

OBRIGATÓRIO — COMPLIANCE NA PUBLICIDADE ADVOCATÍCIA (Provimento 205/2021 do CFOAB, Estatuto da Advocacia/Lei 8.906 e Código de Ética da OAB):
- NUNCA prometer resultados ("ganhamos seu caso", "êxito garantido", "alta taxa de vitórias") nem divulgar valores de honorários, gratuidade ou forma de pagamento como chamariz.
- NUNCA usar linguagem mercantilista ("promoção", "oferta", "desconto", "o mais barato", "imperdível").
- NUNCA fazer autopromoção pretensiosa ou comparativa ("o melhor escritório", "referência absoluta").
- NUNCA captar clientela de forma direta e invasiva (mensagem individual insistente, telemarketing ativo).
- PODE: divulgar áreas de atuação, produzir conteúdo informativo/educativo, usar tom sóbrio e institucional, e convidar para conhecer o trabalho do escritório.
- Em "complianceNotes", aponte os cuidados éticos específicos da campanha gerada.

Responda SEMPRE em português brasileiro, com copy profissional e adequada à área de atuação informada.
`;

const trafficCampaignSchema = {
    type: Type.OBJECT,
    properties: {
        campaignName: { type: Type.STRING, description: "Nome criativo e institucional da campanha" },
        strategy: { type: Type.STRING, description: "Resumo executivo da estratégia (3-5 frases)" },
        targetSummary: { type: Type.STRING, description: "Descrição do cliente ideal (ICP) da campanha" },
        adCopies: {
            type: Type.ARRAY,
            description: "Exatamente 3 variações de anúncio prontas para publicar",
            items: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING, description: "Título do anúncio (máx. 60 caracteres)" },
                    description: { type: Type.STRING, description: "Texto do anúncio (2-3 frases, sóbrio e persuasivo)" },
                    cta: { type: Type.STRING, description: "Chamada para ação ética (ex.: 'Agende uma consulta')" },
                },
                required: ["headline", "description", "cta"],
            }
        },
        keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "10 a 15 palavras-chave de intenção comercial para busca paga"
        },
        negativeKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Palavras-chave negativas para evitar cliques irrelevantes (ex.: 'grátis', 'modelo', 'curso')"
        },
        audiences: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4 a 6 segmentações de público (demografia, interesses, lookalike, remarketing)"
        },
        budgetAllocation: {
            type: Type.ARRAY,
            description: "Distribuição do orçamento mensal entre canais/etapas do funil (percentuais somando 100)",
            items: {
                type: Type.OBJECT,
                properties: {
                    channel: { type: Type.STRING, description: "Canal ou etapa do funil" },
                    percentage: { type: Type.NUMBER, description: "Percentual do orçamento (0-100)" },
                    rationale: { type: Type.STRING, description: "Justificativa da alocação" },
                },
                required: ["channel", "percentage", "rationale"],
            }
        },
        kpis: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5 a 7 KPIs para acompanhar (CPL, CTR, taxa de agendamento, custo por consulta, etc.)"
        },
        complianceNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Cuidados éticos da OAB/Provimento 205/2021 específicos desta campanha"
        },
    },
    required: ["campaignName", "strategy", "targetSummary", "adCopies", "keywords", "negativeKeywords", "audiences", "budgetAllocation", "kpis", "complianceNotes"]
};

const buildTrafficBrief = (request: TrafficCampaignRequest): string => `
BRIEFING DA CAMPANHA:
- Escritório: ${request.officeName || 'Escritório de Advocacia (nome a definir)'}
- Área de atuação em foco: ${request.practiceArea}
- Contexto da área: ${request.practiceAreaHint}
- Plataforma principal: ${request.platform}
- Objetivo da campanha: ${request.objective}
- Orçamento mensal disponível: R$ ${request.monthlyBudget.toLocaleString('pt-BR')}

Monte um plano de campanha completo, prático e imediatamente executável, respeitando todas as regras de compliance da advocacia.
`;

export const generateTrafficCampaign = async (request: TrafficCampaignRequest): Promise<TrafficCampaignPlan> => {
    try {
        const response: GenerateContentResponse = await getClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: buildTrafficBrief(request),
            config: {
                systemInstruction: TRAFFIC_AGENT_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: trafficCampaignSchema,
            }
        });
        const text = response.text.trim();
        return JSON.parse(text) as TrafficCampaignPlan;
    } catch (error) {
        console.error("Erro ao gerar campanha de tráfego:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao gerar o plano de campanha.");
    }
};

export const refineTrafficCampaign = async (
    feedback: string,
    currentPlan: TrafficCampaignPlan,
    request: TrafficCampaignRequest
): Promise<TrafficCampaignPlan> => {
    try {
        const prompt = `
${buildTrafficBrief(request)}

PLANO DE CAMPANHA ATUAL:
${JSON.stringify(currentPlan, null, 2)}

SOLICITAÇÃO DE AJUSTE DO CLIENTE:
"${feedback}"

Refine o plano atendendo ao ajuste solicitado, mantendo o que estiver bom e TODAS as regras de compliance. Retorne o plano completo atualizado no mesmo formato JSON.
`;
        const response: GenerateContentResponse = await getClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: TRAFFIC_AGENT_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: trafficCampaignSchema,
            }
        });
        const text = response.text.trim();
        return JSON.parse(text) as TrafficCampaignPlan;
    } catch (error) {
        console.error("Erro ao refinar campanha de tráfego:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao refinar o plano de campanha.");
    }
};
