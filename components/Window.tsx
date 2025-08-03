
import React, { useState, useRef, useEffect } from 'react';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  zIndex: number;
  isMaximized: boolean;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
  onDrag: (id: string, pos: { x: number, y: number }) => void;
  onToggleMaximize: () => void;
}

const Window: React.FC<WindowProps> = ({ id, title, children, position, zIndex, isMaximized, isActive, onClose, onFocus, onDrag, onToggleMaximize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.window-control')) return;
    onFocus();
    setIsDragging(true);
    const windowRect = windowRef.current?.getBoundingClientRect();
    if(windowRect){
        dragOffset.current = {
            x: e.clientX - windowRect.left,
            y: e.clientY - windowRect.top,
        };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        onDrag(id, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrag, id, isMaximized]);

  const windowClasses = isMaximized 
    ? "left-0 top-0 w-full h-[calc(100%-40px)]"
    : "w-[640px] h-[480px] shadow-lg";

  const wrapperStyle: React.CSSProperties = isMaximized ? { zIndex } : {
    transform: `translate(${position.x}px, ${position.y}px)`,
    zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`absolute ${windowClasses} flex flex-col bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900`}
      style={wrapperStyle}
      onMouseDown={onFocus}
    >
      <div
        className={`flex items-center justify-between h-8 px-1 select-none ${isActive ? 'bg-blue-800' : 'bg-gray-500'} text-white`}
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold text-sm truncate">{title}</span>
        <div className="flex space-x-1">
          <button onClick={onToggleMaximize} className="window-control w-6 h-6 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 active:border-r-stone-100 active:border-b-stone-100 flex justify-center items-center">
            <div className="w-3 h-3 border-2 border-black"></div>
          </button>
          <button onClick={onClose} className="window-control w-6 h-6 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 active:border-r-stone-100 active:border-b-stone-100 flex justify-center items-center font-bold text-black">
            X
          </button>
        </div>
      </div>
      <div className="flex-grow p-1 overflow-y-auto bg-white border-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
        {children}
      </div>
    </div>
  );
};

export default Window;
