
import React, { useState, useCallback, useRef } from 'react';

const TextEditorApp: React.FC = () => {
    const [content, setContent] = useState('Bem-vindo ao Editor de Texto!\n\nDigite algo aqui.');
    const [status, setStatus] = useState({ lines: 2, cols: 18, chars: 41 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const updateStatus = useCallback((target: HTMLTextAreaElement) => {
        const lines = target.value.substring(0, target.selectionStart).split('\n');
        const lineCount = target.value.split('\n').length;
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;
        
        setStatus({
            lines: lineCount,
            cols: currentCol,
            chars: target.value.length,
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        updateStatus(e.target);
    };

    const handleKeyUpOrClick = (e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement>) => {
        updateStatus(e.currentTarget);
    };

    return (
        <div className="p-1 h-full flex flex-col text-black bg-stone-300">
            {/* Menu Bar */}
            <div className="flex items-center h-8 px-1">
                <div className="px-2 py-0.5 mr-1 hover:bg-stone-400"><u>F</u>ile</div>
                <div className="px-2 py-0.5 mr-1 hover:bg-stone-400"><u>E</u>dit</div>
                <div className="px-2 py-0.5 mr-1 hover:bg-stone-400"><u>S</u>earch</div>
                <div className="px-2 py-0.5 mr-1 hover:bg-stone-400"><u>H</u>elp</div>
            </div>
            
            {/* Text Area */}
            <div className="flex-grow p-0.5">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onKeyUp={handleKeyUpOrClick}
                    onClick={handleKeyUpOrClick}
                    className="w-full h-full p-2 bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none resize-none"
                    spellCheck="false"
                />
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center h-6 px-2 text-sm border-t-2 border-stone-400">
                <div className="flex">
                    <div className="px-2 border-r border-stone-400">Ln {status.lines}, Col {status.cols}</div>
                    <div className="px-2">{status.chars} caracteres</div>
                </div>
                <div className="font-bold">INS</div>
            </div>
        </div>
    );
};

export default TextEditorApp;
