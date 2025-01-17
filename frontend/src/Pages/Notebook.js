import React, { useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Play, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";
import Alert from "../Components/Alert";

const SUPPORTED_LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'cpp', name: 'C++' },
    { id: 'java', name: 'Java' }
];


// Add UUID generator function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};

const NotebookCell = ({
    cell,
    onRun,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    onChange,
    onLanguageChange
}) => {
    const [terminal, setTerminal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const terminalRef = useRef(null);
    const wsRef = useRef(null);

    const connectWebSocket = () => {
        const ws = new WebSocket(`ws://localhost:5000/ws?clientId=${cell.id}`);

        ws.onopen = () => {
            setTerminal('Connected to cell...\n');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setTerminal(prev => prev + message.data);
            if (message.type === 'system' && message.data.includes('Process exited')) {
                setIsRunning(false);
            }
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        };

        ws.onclose = () => {
            setTerminal(prev => prev + 'Connection closed...\n');
            setIsRunning(false);
        };

        wsRef.current = ws;
        return ws;
    };

    const handleRun = async () => {
        if (!cell.code.trim()) return;

        setIsRunning(true);
        setTerminal('Running code...\n');

        const ws = wsRef.current || connectWebSocket();

        try {
            await onRun(cell.id, cell.code, cell.language);
        } catch (error) {
            setTerminal(prev => prev + `Error: ${error.message}\n`);
            setIsRunning(false);
        }
    };

    const handleInputKeyPress = (e) => {
        if (e.key === 'Enter' && isRunning) {
            e.preventDefault();
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'input',
                    input: inputValue
                }));
                setTerminal(prev => prev + inputValue + '\n');
                setInputValue('');
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        <Play className="h-4 w-4 mr-1" />
                        Run
                    </button>
                    <select
                        value={cell.language}
                        onChange={(e) => onLanguageChange(cell.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                    >
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-500">Cell {cell.index + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {!isFirst && (
                        <button
                            onClick={() => onMoveUp(cell.id)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                    )}
                    {!isLast && (
                        <button
                            onClick={() => onMoveDown(cell.id)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(cell.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <Editor
                height={cell.height}
                language={cell.language}
                value={cell.code}
                onChange={(value) => onChange(cell.id, value || '')}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    automaticLayout: true,
                }}
            />

            <div className="mt-2 bg-gray-900 rounded p-2">
                <div
                    ref={terminalRef}
                    className="h-32 font-mono text-sm text-white overflow-auto"
                >
                    <pre className="whitespace-pre-wrap">{terminal}</pre>
                    {isRunning && (
                        <div className="flex items-center">
                            <span className="text-green-500">{'>'}</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleInputKeyPress}
                                className="flex-1 ml-2 bg-transparent text-white focus:outline-none"
                                placeholder="Type input and press Enter..."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotebookApp = () => {
    const [cells, setCells] = useState([
        { id: generateUUID(), code: '', language: 'python', height: 50, index: 0 }
    ]);
    const [alerts, setAlerts] = useState([]);

    const showAlert = (message, type = 'info') => {
        const id = generateUUID();
        setAlerts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 3000);
    };

    const addCell = () => {
        const newCell = {
            id: generateUUID(),
            code: '',
            height: 50,
            language: 'python',
            index: cells.length
        };
        setCells(prev => [...prev, newCell]);
    };

    const deleteCell = (id) => {
        setCells(prev => {
            const filtered = prev.filter(cell => cell.id !== id);
            return filtered.map((cell, idx) => ({ ...cell, index: idx }));
        });
    };

    const moveCell = (id, direction) => {
        setCells(prev => {
            const index = prev.findIndex(cell => cell.id === id);
            if (
                (direction === 'up' && index === 0) ||
                (direction === 'down' && index === prev.length - 1)
            ) {
                return prev;
            }

            const newCells = [...prev];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            [newCells[index], newCells[swapIndex]] = [newCells[swapIndex], newCells[index]];

            return newCells.map((cell, idx) => ({ ...cell, index: idx }));
        });
    };

    const handleRun = async (id, code, language) => {
        try {
            const response = await fetch('http://localhost:5000/api/code/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': id
                },
                body: JSON.stringify({
                    code,
                    language
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to execute code');
            }

            showAlert(`Running ${language} code`, 'success');
        } catch (error) {
            showAlert(error.message, 'error');
            throw error;
        }
    };

    const updateCellCode = (id, newCode) => {
        const lines = newCode.split('\n').length;
        setCells(prev =>
            prev.map(cell =>
                cell.id === id ? { ...cell, code: newCode, height: lines <= 2 ? 50 : lines * 20 } : cell
            )
        );
    };

    const updateCellLanguage = (id, newLanguage) => {
        setCells(prev =>
            prev.map(cell =>
                cell.id === id ? { ...cell, language: newLanguage } : cell
            )
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {alerts.map(alert => (
                        <Alert type={alert.type} message={alert.message} />
                    ))}
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Code Notebook</h1>
                    <button
                        onClick={addCell}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Cell
                    </button>
                </div>

                {cells.map((cell, index) => (
                    <NotebookCell
                        key={cell.id}
                        cell={cell}
                        onRun={handleRun}
                        onDelete={deleteCell}
                        onMoveUp={() => moveCell(cell.id, 'up')}
                        onMoveDown={() => moveCell(cell.id, 'down')}
                        isFirst={index === 0}
                        isLast={index === cells.length - 1}
                        onChange={updateCellCode}
                        onLanguageChange={updateCellLanguage}
                    />
                ))}
            </div>
        </div>
    );
};

export default NotebookApp;