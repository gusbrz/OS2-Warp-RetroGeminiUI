
import React, { useState, useCallback } from 'react';
import { generateImageFromPrompt } from '../services/geminiService';

const ImageApp: React.FC = () => {
    const [prompt, setPrompt] = useState('A blue cat playing a piano on the moon');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const resultUrl = await generateImageFromPrompt(prompt);
            setImageUrl(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="p-4 h-full flex flex-col text-black bg-white">
            <h1 className="text-2xl font-bold mb-2">Image Studio</h1>
            <p className="mb-4 text-sm">Describe the image you want to create. The AI will generate it in a retro pixel art style.</p>
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A robot riding a skateboard"
                    className="flex-grow p-2 border-2 bg-white border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="px-4 py-2 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Creating...' : 'Create'}
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center border-2 p-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 bg-black">
                {isLoading && <p className="text-white text-2xl">Generating Image...</p>}
                {error && <div className="text-red-500 font-bold p-4 bg-white">{error}</div>}
                {imageUrl && <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain" />}
                {!isLoading && !imageUrl && !error && <p className="text-gray-500">Your generated image will appear here.</p>}
            </div>
        </div>
    );
};

export default ImageApp;
