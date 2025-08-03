
import React, { useState, useCallback } from 'react';
import { generateRecipe } from '../services/geminiService';
import type { Recipe } from '../types';

const RecipeApp: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setRecipe(null);
        try {
            const result = await generateRecipe(prompt);
            setRecipe(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="p-4 h-full flex flex-col text-black bg-white">
            <h1 className="text-2xl font-bold mb-2">Recipe Book</h1>
            <p className="mb-4 text-sm">What do you feel like cooking? (e.g., "a quick vegetarian pasta dish")</p>
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter an idea..."
                    className="flex-grow p-2 border-2 bg-white border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="px-4 py-2 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Find Recipe'}
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {error && <div className="text-red-600 font-bold p-4 bg-red-100 border border-red-600">{error}</div>}
                {recipe && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">{recipe.recipeName}</h2>
                        <p className="italic">{recipe.description}</p>
                        
                        <div>
                            <h3 className="text-xl font-bold mb-2 border-b-2 border-stone-300">Ingredients</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-2 border-b-2 border-stone-300">Instructions</h3>
                            <ol className="list-decimal list-inside space-y-2">
                                {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default RecipeApp;
