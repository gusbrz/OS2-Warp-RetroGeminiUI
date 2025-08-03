
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Recipe, TodoItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        const response: GenerateContentResponse = await ai.models.generateContent({
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

        const response: GenerateContentResponse = await ai.models.generateContent({
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
        const response = await ai.models.generateImages({
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
