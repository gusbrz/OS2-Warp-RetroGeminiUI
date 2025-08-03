
import React, { useState, useCallback } from 'react';
import Window from './components/Window';
import DesktopIcon from './components/DesktopIcon';
import Taskbar from './components/Taskbar';
import { RecipeIcon, TodoIcon, ImageIcon, TextEditorIcon, SpreadsheetIcon, BrowserIcon } from './components/icons';
import RecipeApp from './apps/RecipeApp';
import TodoApp from './apps/TodoApp';
import ImageApp from './apps/ImageApp';
import TextEditorApp from './apps/TextEditorApp';
import SpreadsheetApp from './apps/SpreadsheetApp';
import BrowserApp from './apps/BrowserApp';
import type { WindowInstance, AppDefinition } from './types';

const APPS: AppDefinition[] = [
  { id: 'recipes', name: 'Recipe Book', icon: <RecipeIcon />, component: RecipeApp },
  { id: 'todos', name: 'To-Do List', icon: <TodoIcon />, component: TodoApp },
  { id: 'images', name: 'Image Studio', icon: <ImageIcon />, component: ImageApp },
  { id: 'editor', name: 'Text Editor', icon: <TextEditorIcon />, component: TextEditorApp },
  { id: 'spreadsheet', name: 'Planilhas', icon: <SpreadsheetIcon />, component: SpreadsheetApp },
  { id: 'browser', name: 'Navegador Web', icon: <BrowserIcon />, component: BrowserApp },
];

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);

  const openApp = useCallback((appId: string) => {
    // Allow multiple instances for some apps
    const canHaveMultipleInstances = ['editor', 'spreadsheet', 'browser'].includes(appId);
    if (!canHaveMultipleInstances) {
        const existingWindow = windows.find(w => w.appId === appId);
        if (existingWindow) {
          focusWindow(existingWindow.id);
          return;
        }
    }
    
    const appDef = APPS.find(app => app.id === appId);
    if (!appDef) return;

    const newWindow: WindowInstance = {
      id: `win-${Date.now()}`,
      appId: appDef.id,
      title: appDef.name,
      position: { x: 50 + (windows.length % 10) * 20, y: 50 + (windows.length % 10) * 20 },
      zIndex: nextZIndex,
      isMaximized: false,
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setNextZIndex(prev => prev + 1);
  }, [windows, nextZIndex]);

  const closeApp = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
        const remainingWindows = windows.filter(w => w.id !== id);
        if (remainingWindows.length > 0) {
            const topWindow = remainingWindows.sort((a,b) => b.zIndex - a.zIndex)[0];
            setActiveWindowId(topWindow.id);
        } else {
            setActiveWindowId(null);
        }
    }
  }, [windows, activeWindowId]);

  const focusWindow = useCallback((id: string) => {
    if (activeWindowId === id) return;
    
    setActiveWindowId(id);
    setNextZIndex(prevZ => {
        setWindows(currentWindows => 
            currentWindows.map(w => w.id === id ? { ...w, zIndex: prevZ } : w)
        );
        return prevZ + 1;
    });
  }, [activeWindowId]);

  const handleDrag = useCallback((id: string, newPosition: {x: number, y: number}) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, position: newPosition } : w))
    );
  }, []);
  
  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)
    );
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#008080] font-mono select-none">
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col flex-wrap h-full content-start space-y-4">
        {APPS.map(app => (
          <DesktopIcon
            key={app.id}
            icon={app.icon}
            label={app.name}
            onDoubleClick={() => openApp(app.id)}
          />
        ))}
      </div>

      {/* Windows */}
      {windows.map(win => {
        const AppToRender = APPS.find(app => app.id === win.appId)?.component;
        return AppToRender ? (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            position={win.position}
            zIndex={win.zIndex}
            isMaximized={win.isMaximized}
            isActive={activeWindowId === win.id}
            onClose={() => closeApp(win.id)}
            onFocus={() => focusWindow(win.id)}
            onDrag={handleDrag}
            onToggleMaximize={() => toggleMaximize(win.id)}
          >
            <AppToRender />
          </Window>
        ) : null;
      })}

      {/* Taskbar */}
      <Taskbar openWindows={windows} onFocusWindow={focusWindow} activeWindowId={activeWindowId}/>
    </div>
  );
};

export default App;
