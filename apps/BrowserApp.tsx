
import React, { useState, useRef, useCallback } from 'react';

const HOME_PAGE_CONTENT = `
<div style="font-family: 'VT323', monospace; background-color: #c0c0c0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: black; padding: 2rem;">
    <h1 style="font-size: 2.5rem; border-bottom: 2px solid black; padding-bottom: 0.5rem;">Bem-vindo ao Navegador Gemini!</h1>
    <p style="margin-top: 1.5rem; font-size: 1.2rem;">Este é um navegador web simples inspirado nos clássicos.</p>
    <p style="margin-top: 1rem;">Digite uma URL na barra de endereço acima e clique em "Ir" para começar.</p>
    <div style="margin-top: 2rem; padding: 1rem; border: 2px outset #fff; background-color: #e0e0e0;">
        <p>Experimente estes sites:</p>
        <ul style="list-style: none; padding: 0; margin-top: 0.5rem;">
            <li><a href="https://www.google.com" target="_top">google.com</a></li>
            <li><a href="https://www.wikipedia.org" target="_top">wikipedia.org</a></li>
        </ul>
    </div>
    <p style="margin-top: 2rem; font-size: 0.9rem; color: #555;">Observação: alguns sites podem não funcionar devido a políticas de segurança modernas (X-Frame-Options).</p>
</div>
`;


const BrowserButton = ({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled?: boolean }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="px-3 py-1 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

const BrowserApp: React.FC = () => {
    const [history, setHistory] = useState<string[]>(['home']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [inputUrl, setInputUrl] = useState('');
    const [displayUrl, setDisplayUrl] = useState('gemini:home');
    const [isLoading, setIsLoading] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    const currentUrl = history[historyIndex];

    const navigate = useCallback((url: string) => {
        setIsLoading(true);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(url);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setInputUrl(url);
        setDisplayUrl(url);
    }, [history, historyIndex]);

    const handleGo = () => {
        if(inputUrl) {
            // Basic validation to add http:// if missing
            let formattedUrl = inputUrl;
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }
            navigate(formattedUrl);
        }
    };
    
    const goBack = () => {
        if(canGoBack) setHistoryIndex(prev => prev - 1);
    };

    const goForward = () => {
        if(canGoForward) setHistoryIndex(prev => prev + 1);
    };

    const goHome = () => {
        navigate('home');
    };

    const reload = () => {
        if (iframeRef.current && currentUrl !== 'home') {
            setIsLoading(true);
            iframeRef.current.src = 'about:blank';
            setTimeout(() => {
                if(iframeRef.current) iframeRef.current.src = currentUrl;
            }, 50)
        }
    };
    
    const handleIframeLoad = () => {
        setIsLoading(false);
        const newUrl = iframeRef.current?.contentWindow?.location.href;
        if (newUrl && newUrl !== 'about:blank') {
            setDisplayUrl(newUrl);
        }
    };

    return (
        <div className="h-full flex flex-col text-black bg-stone-300">
            {/* Toolbar */}
            <div className="flex items-center p-1.5 bg-stone-300 border-b-2 border-stone-400 space-x-2">
                <BrowserButton onClick={goBack} disabled={!canGoBack}>{'<'} Voltar</BrowserButton>
                <BrowserButton onClick={goForward} disabled={!canGoForward}>Avançar {'>'}</BrowserButton>
                <BrowserButton onClick={goHome}>Início</BrowserButton>
                <BrowserButton onClick={reload} disabled={currentUrl === 'home'}>Recarregar</BrowserButton>
            </div>
             <div className="flex items-center p-1.5 bg-stone-300 border-b-2 border-stone-400 space-x-2">
                <span className="font-bold">Endereço:</span>
                <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGo()}
                    className="flex-grow p-1 h-8 border-2 bg-white border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none"
                />
                <BrowserButton onClick={handleGo}>Ir</BrowserButton>
            </div>

            {/* Content */}
            <div className="flex-grow flex flex-col p-1">
                 <div className="flex-grow relative border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                    {isLoading && <div className="absolute inset-0 bg-white flex items-center justify-center z-10"><p>Carregando {displayUrl}...</p></div>}
                    <iframe
                        ref={iframeRef}
                        onLoad={handleIframeLoad}
                        src={currentUrl === 'home' ? undefined : currentUrl}
                        srcDoc={currentUrl === 'home' ? HOME_PAGE_CONTENT : undefined}
                        className="w-full h-full bg-white"
                        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
                        title="Web Browser Content"
                    />
                </div>
                 <div className="h-6 px-2 text-sm border-t-2 border-stone-400 flex items-center">
                    {isLoading ? `Carregando ${displayUrl}...` : `Pronto. (${displayUrl})`}
                </div>
            </div>
        </div>
    );
};

export default BrowserApp;
