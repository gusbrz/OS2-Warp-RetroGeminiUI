
import React from 'react';
import type { WindowInstance } from '../types';

interface TaskbarProps {
  openWindows: WindowInstance[];
  onFocusWindow: (id: string) => void;
  activeWindowId: string | null;
}

const Taskbar: React.FC<TaskbarProps> = ({ openWindows, onFocusWindow, activeWindowId }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-stone-300 border-t-2 border-stone-100 flex items-center px-1 z-50">
      <div className="border-2 border-r-stone-900 border-b-stone-900 border-l-stone-100 border-t-stone-100 px-2 py-0.5 mr-2 active:border-l-stone-900 active:border-t-stone-900 active:border-r-stone-100 active:border-b-stone-100">
        <span className="font-bold text-black">Start</span>
      </div>
      <div className="h-full w-px bg-stone-500 border-r border-stone-100"></div>
      <div className="flex items-center space-x-1 ml-1">
        {openWindows.map(win => (
          <button
            key={win.id}
            onClick={() => onFocusWindow(win.id)}
            className={`h-7 px-2 text-sm truncate max-w-36 ${
              activeWindowId === win.id
                ? 'bg-stone-400 border-2 border-t-stone-900 border-l-stone-900 border-b-stone-100 border-r-stone-100'
                : 'bg-stone-300 border-2 border-b-stone-900 border-r-stone-900 border-t-stone-100 border-l-stone-100'
            }`}
          >
            {win.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Taskbar;
