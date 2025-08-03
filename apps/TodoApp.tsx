
import React, { useState, useCallback, useEffect } from 'react';
import { updateTodoList } from '../services/geminiService';
import type { TodoItem } from '../types';

const TodoApp: React.FC = () => {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdate = useCallback(async () => {
        if (!command) return;
        setIsLoading(true);
        setError(null);
        try {
            const updatedList = await updateTodoList(command, todos);
            setTodos(updatedList);
            setCommand('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [command, todos]);

    useEffect(() => {
        // Load initial data or could be empty
        setTodos([
            { id: 1, task: "Buy milk and bread", completed: false },
            { id: 2, task: "Plan weekend trip", completed: true },
        ]);
    }, []);

    return (
        <div className="p-4 h-full flex flex-col text-black bg-white">
            <h1 className="text-2xl font-bold mb-2">To-Do List</h1>
            <p className="mb-4 text-sm">Examples: "Add 'Water the plants'", "Complete task 1", "Remove 'Plan weekend trip'"</p>
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter a command..."
                    className="flex-grow p-2 border-2 bg-white border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100 focus:outline-none"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                />
                <button
                    onClick={handleUpdate}
                    disabled={isLoading || !command}
                    className="px-4 py-2 bg-stone-300 border-2 border-t-stone-100 border-l-stone-100 border-r-stone-900 border-b-stone-900 active:border-t-stone-900 active:border-l-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Updating...' : 'Update'}
                </button>
            </div>
            
            {error && <div className="text-red-600 font-bold p-2 my-2 bg-red-100 border border-red-600">{error}</div>}

            <div className="flex-grow overflow-y-auto border-2 p-2 border-l-stone-900 border-t-stone-900 border-b-stone-100 border-r-stone-100">
                {todos.length === 0 ? (
                    <p className="text-gray-500">Your to-do list is empty.</p>
                ) : (
                    <ul className="space-y-2">
                        {todos.map(todo => (
                            <li key={todo.id} className={`flex items-center ${todo.completed ? 'text-gray-400 line-through' : ''}`}>
                                <span className="mr-2 text-sm">{todo.id}.</span>
                                <span className="flex-grow">{todo.task}</span>
                                <span className="text-xs ml-2 p-1 bg-stone-200 border border-stone-400">{todo.completed ? 'DONE' : 'PENDING'}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TodoApp;
