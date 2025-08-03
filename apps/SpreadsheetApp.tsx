
import React, { useState, useMemo, useCallback } from 'react';

const COLS = 26; // A-Z
const ROWS = 100;

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(''));

const colName = (n: number) => {
    let s = '';
    while (n >= 0) {
        s = String.fromCharCode(n % 26 + 'A'.charCodeAt(0)) + s;
        n = Math.floor(n / 26) - 1;
    }
    return s;
};

const SpreadsheetApp: React.FC = () => {
    const [gridData, setGridData] = useState<string[][]>(createEmptyGrid);
    const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
    const [inputValue, setInputValue] = useState('');

    const handleCellClick = (row: number, col: number) => {
        setActiveCell({ row, col });
        setInputValue(gridData[row][col]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const newData = [...gridData.map(row => [...row])];
        newData[activeCell.row][activeCell.col] = inputValue;
        setGridData(newData);
    };
    
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
           handleInputBlur();
           const nextRow = Math.min(ROWS - 1, activeCell.row + 1);
           handleCellClick(nextRow, activeCell.col);
           (e.target as HTMLInputElement).select();
        }
    }

    const columnHeaders = useMemo(() => Array.from({ length: COLS }, (_, i) => colName(i)), []);

    return (
        <div className="h-full flex flex-col text-black bg-stone-300 select-none">
            {/* Formula Bar */}
            <div className="flex items-center p-1 bg-stone-300 border-b-2 border-stone-400">
                <div className="w-16 text-center font-bold p-1 bg-stone-300 border-2 border-r-stone-900 border-b-stone-900 border-l-stone-100 border-t-stone-100">
                   {colName(activeCell.col)}{activeCell.row + 1}
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="flex-grow p-1 h-8 border-2 bg-white border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none"
                    spellCheck="false"
                />
            </div>
            
            {/* Grid */}
            <div className="flex-grow overflow-auto p-1">
                <table className="table-fixed border-collapse bg-white">
                    <thead>
                        <tr>
                            <th className="w-12 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900"></th>
                            {columnHeaders.map(header => (
                                <th key={header} className="w-24 p-1 text-center bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {gridData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="w-12 p-1 text-center bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900">{rowIndex + 1}</td>
                                {row.map((cell, colIndex) => (
                                    <td 
                                        key={colIndex}
                                        className={`w-24 p-1 border border-stone-400 truncate cursor-cell ${activeCell.row === rowIndex && activeCell.col === colIndex ? 'border-2 border-blue-800' : ''}`}
                                        onClick={() => handleCellClick(rowIndex, colIndex)}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SpreadsheetApp;
