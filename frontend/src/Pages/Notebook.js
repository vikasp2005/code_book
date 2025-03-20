
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Play, Trash2, ChevronUp, ChevronDown, Plus, StopCircle, Save, FileText, Trash, X, Terminal, Code, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { GenerateUUID } from '../Components/GenerateUUID';
import Alert from "../Components/Alert";

const SUPPORTED_LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'cpp', name: 'C++' },
    { id: 'java', name: 'Java' }
];

// Enhanced Dialog Component with Animation
const CustomDialog = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-sm transition-opacity animate-fade-in">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0" onClick={onClose} />
                <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 glass-effect animate-scale-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Enhanced Sidebar Component
const NotebookSidebar = ({ notebooks, onLoad, onDelete, visible }) => {
    return (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/80 backdrop-blur-md shadow-xl transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0 animate-slide-right' : '-translate-x-full'} border-r border-gray-200/50`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">Saved Notebooks</h2>
                <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="overflow-y-auto h-full pb-16">
                {notebooks.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="text-gray-400 flex justify-center mb-2">
                            <FileText className="h-10 w-10" />
                        </div>
                        <p className="text-sm text-gray-500">No notebooks saved yet</p>
                    </div>
                ) : (
                    notebooks.map((notebook) => (
                        <div
                            key={notebook._id}
                            className="flex items-center justify-between p-3 hover:bg-blue-50 border-b border-gray-100 transition-colors duration-150"
                        >
                            <button
                                onClick={() => onLoad(notebook._id)}
                                className="flex items-center flex-1 text-left"
                            >
                                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="truncate text-gray-700 hover:text-blue-600 transition-colors">{notebook.name}</span>
                            </button>
                            <button
                                onClick={() => onDelete(notebook._id)}
                                className="p-1.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors ml-2 text-gray-400"
                                aria-label="Delete notebook"
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Enhanced Cell Component
const NotebookCell = ({
    cell,
    onRun,
    onStop,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    onChange,
    onLanguageChange,
    onNameChange,
    defaultLanguage,
    isDefaultLanguageEnabled,
    sendWebSocketMessage,
    isRunning,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const terminalRef = useRef(null);

    const handleRun = async () => {
        if (!cell.code.trim()) return;
        try {
            await onRun(cell.id, cell.code, cell.language);
        } catch (error) {
            console.error('Error running code:', error);
        }
    };

    const handleStop = async () => {
        try {
            await onStop(cell.id);
        } catch (error) {
            console.error('Error stopping code:', error);
        }
    };

    const handleInputKeyPress = (e) => {
        if (e.key === 'Enter' && isRunning) {
            e.preventDefault();
            sendWebSocketMessage(cell.id, inputValue);
            setInputValue('');
        }
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [cell.output]);

    return (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100 transition-all duration-300 transform hover:shadow-lg animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                    <input
                        type="text"
                        value={cell.name}
                        onChange={(e) => onNameChange(cell.id, e.target.value)}
                        placeholder="Cell name (optional)"
                        className="text-sm border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 transition-all"
                    />
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${isRunning
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                        >
                            <Play className="h-3.5 w-3.5 mr-1.5" />
                            {isRunning ? 'Running...' : 'Run'}
                        </button>
                        {isRunning && (
                            <button
                                onClick={handleStop}
                                className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm transition-colors"
                            >
                                <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                                Stop
                            </button>
                        )}
                    </div>
                    <select
                        value={cell.language}
                        onChange={(e) => onLanguageChange(cell.id, e.target.value)}
                        className="text-sm border-gray-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                    >
                        {isDefaultLanguageEnabled && (
                            <option value={defaultLanguage}>Use Default ({defaultLanguage})</option>
                        )}
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Cell {cell.index + 1}
                    </span>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label={isExpanded ? "Collapse cell" : "Expand cell"}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {!isFirst && (
                        <button
                            onClick={() => onMoveUp(cell.id)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Move cell up"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                    )}
                    {!isLast && (
                        <button
                            onClick={() => onMoveDown(cell.id)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Move cell down"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(cell.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Delete cell"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="relative mb-3">
                        <div className="absolute left-0 top-0 h-full w-1 bg-blue-100 rounded-l-md"></div>
                        <Editor
                            height={cell.height}
                            language={cell.language === defaultLanguage ? defaultLanguage : cell.language}
                            value={cell.code}
                            onChange={(value) => onChange(cell.id, value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                fontFamily: 'JetBrains Mono, monospace',
                                padding: { top: 10 },
                            }}
                            className="rounded-md overflow-hidden"
                        />
                    </div>

                    <div className="relative">
                        <div className="flex items-center mb-2">
                            <Terminal className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-xs font-medium text-gray-600">Output</span>
                        </div>
                        <div
                            ref={terminalRef}
                            className="h-32 bg-gray-900 rounded-md p-3 overflow-auto font-mono text-sm scrollbar-thin text-white"
                        >
                            <pre className="whitespace-pre-wrap">{cell.output}</pre>
                            {isRunning && (
                                <div className="flex items-center mt-1 border-t border-gray-700 pt-1">
                                    <span className="text-green-500 mr-1">❯</span>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleInputKeyPress}
                                        className="flex-1 bg-transparent text-white focus:outline-none"
                                        placeholder="Type input and press Enter..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Main Notebook App Component
const NotebookApp = ({ showSidebar }) => {
    const [cells, setCells] = useState([
        {
            id: GenerateUUID(),
            code: '',
            language: 'python',
            height: 50,
            index: 0,
            name: '',
            output: ''
        }
    ]);
    const [alerts, setAlerts] = useState([]);
    const [defaultLanguage, setDefaultLanguage] = useState('python');
    const [isDefaultLanguageEnabled, setIsDefaultLanguageEnabled] = useState(true);
    const [showNewNotebookDialog, setShowNewNotebookDialog] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [notebookName, setNotebookName] = useState('Untitled Notebook');
    const [savedNotebooks, setSavedNotebooks] = useState([]);
    const [currentNotebookId, setCurrentNotebookId] = useState(null);
    const { user } = useAuth();
    const [isResetNotebook, setIsResetNotebook] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [notebookFileName, setNotebookFileName] = useState('');
    const [isFileNameExists, setIsFileNameExists] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const wsRef = useRef(null);
    const clientId = useRef(GenerateUUID());
    const [runningCells, setRunningCells] = useState({});

    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket(`ws://localhost:5000/ws?clientId=${clientId.current}`);

            ws.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message)
                const cellId = message.clientId;
                const data = message.data;
                const type = message.type;
                setCells(prevCells =>
                    prevCells.map(cell =>
                        cell.id === cellId
                            ? { ...cell, output: cell.output + data }
                            : cell
                    )
                );

                if (type === 'system' && data.includes('Process exited')) {
                    setRunningCells(prev => ({ ...prev, [cellId]: false }));
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected. Reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                ws.close();
            };

            wsRef.current = ws;
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const sendWebSocketMessage = (cellId, inputValue) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'input',
                input: inputValue,
                clientId: cellId
            }));
            setCells(prevCells =>
                prevCells.map(cell =>
                    cell.id === cellId
                        ? { ...cell, output: cell.output + inputValue + '\n' }
                        : cell
                )
            );
        }

    }




    const handleRun = async (cellId, code, language) => {
        try {
            setCells(prevCells =>
                prevCells.map(cell =>
                    cell.id === cellId
                        ? { ...cell, output: 'Running code...\n' }
                        : cell
                )
            );
            setRunningCells(prev => ({ ...prev, [cellId]: true }));

            const response = await fetch('http://localhost:5000/api/code/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': clientId.current,
                    'Cell-Id': cellId
                },
                body: JSON.stringify({
                    code,
                    language: language === defaultLanguage ? defaultLanguage : language
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to execute code');
            }

            showAlert(`Running ${language} code`, 'success');
        } catch (error) {
            setRunningCells(prev => ({ ...prev, [cellId]: false }));
            showAlert(error.message, 'error');
            throw error;
        }
    };

    const handleStop = async (cellId) => {
        try {
            const response = await fetch('http://localhost:5000/api/code/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': clientId.current,
                    'Cell-Id': cellId
                }
            });

            if (!response.ok) {
                throw new Error('Failed to stop execution');
            }
            setRunningCells(prev => ({ ...prev, [cellId]: false }));

            showAlert('Execution stopped', 'success');
        } catch (error) {
            setRunningCells(prev => ({ ...prev, [cellId]: false }));

            showAlert(error.message, 'error');
            throw error;
        }
    };

    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [cells]);

    useEffect(() => {
        if (user) {
            fetchNotebooks();
        }
    }, [user]);

    useEffect(() => {
        if (user && location.state?.showSaveDialog) {
            // Restore notebook state from localStorage
            const savedNotebookState = localStorage.getItem('unsavedNotebookState');
            if (savedNotebookState) {
                const parsedState = JSON.parse(savedNotebookState);
                setCells(parsedState.cells);
                setNotebookName(parsedState.notebookName);
                setHasUnsavedChanges(true);
                localStorage.removeItem('unsavedNotebookState'); // Clear after restoring
            }

            setShowSaveDialog(true);
            navigate(location.state.from || '/', { replace: true });
        }
        if (user && location.state?.ClearEditor) {
            setIsResetNotebook(true);
        }
    }, [user, location.state, navigate]);

    const checkFileNameExists = async (name) => {
        try {
            if (!user) return false;

            // First check against locally stored notebooks
            const fileExists = savedNotebooks.some(notebook =>
                notebook.name.toLowerCase() === name.toLowerCase()
            );

            if (fileExists) {
                return true;
            }

            // Then check with server
            const response = await axios.get(
                `http://localhost:5000/api/notebook/checkfilename/${encodeURIComponent(name)}`,
                { withCredentials: true }
            );
            return response.data.exists;
        } catch (error) {
            showAlert('Error checking file name', 'error');
            return false;
        }
    };

    const handleFileNameChange = async (e) => {
        const value = e.target.value;
        setNotebookFileName(value);
        if (value.trim()) {
            const exists = await checkFileNameExists(value);
            setIsFileNameExists(exists);
        } else {
            setIsFileNameExists(false);
        }
    };

    const handleSaveNotebookWithFileName = async () => {
        if (!user) {
            showAlert('Please login to save your notebook', 'info');
            setTimeout(() => {
                navigate('/login', {
                    replace: true,
                    state: {
                        from: location.pathname,
                        showSaveDialog: true
                    }
                });
            }, 1500);
            return;
        }

        if (!notebookFileName.trim()) {
            showAlert('Please enter a file name', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const exists = await checkFileNameExists(notebookFileName);
            if (exists) {
                setIsFileNameExists(true);
                showAlert('Notebook name already exists', 'warning');
                return;
            }

            // Modify your existing save logic to use the new file name
            const notebookData = {
                name: notebookFileName, // Use the new file name
                cells: cells
            };

            await axios.post('http://localhost:5000/api/notebook/save',
                notebookData,
                { withCredentials: true }
            );

            setHasUnsavedChanges(false);
            setShowSaveDialog(false);
            setNotebookFileName('');
            showAlert('Notebook saved successfully', 'success');
            await fetchNotebooks();
            if (isResetNotebook) {
                resetNotebook();
                setIsResetNotebook(false);
            }
        } catch (error) {
            showAlert('Failed to save notebook', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const fetchNotebooks = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/notebook/list', {
                withCredentials: true
            });
            setSavedNotebooks(response.data);
        } catch (error) {
            showAlert('Failed to fetch notebooks', 'error');
        }
    };

    const handleSaveNotebook = async () => {
        setIsResetNotebook(true);
        if (!user) {
            // Store current notebook state in localStorage before redirecting
            localStorage.setItem('unsavedNotebookState', JSON.stringify({
                cells,
                notebookName
            }));

            showAlert('Please login to save your notebook', 'info');
            setTimeout(() => {
                navigate('/login', {
                    state: {
                        from: location.pathname,
                        showSaveDialog: true,
                        ClearEditor: true
                    }
                });
            }, 1500);
            return;
        }

        if (!currentNotebookId) {
            // If no current notebook, show save dialog to get filename
            setShowNewNotebookDialog(false);
            setShowSaveDialog(true);
            return;
        }
        if (isResetNotebook) {
            resetNotebook();
            setIsResetNotebook(false);
        }

        // Existing save logic for updating an existing notebook
        try {
            const notebookData = {
                name: notebookName,
                cells: cells
            };

            await axios.put(`http://localhost:5000/api/notebook/update/${currentNotebookId}`,
                notebookData,
                { withCredentials: true }
            );

            setHasUnsavedChanges(false);
            setShowNewNotebookDialog(false);
            showAlert('Notebook updated successfully', 'success');
            await fetchNotebooks();
        } catch (error) {
            showAlert('Failed to save notebook', 'error');
        }
    };

    const loadNotebook = async (notebookId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/notebook/${notebookId}`, {
                withCredentials: true
            });
            setCells(response.data.cells.map(cell => ({
                ...cell,
                id: cell.id || GenerateUUID()
            })));

            setNotebookName(response.data.name);
            setCurrentNotebookId(notebookId);
            setHasUnsavedChanges(false);
        } catch (error) {
            showAlert('Failed to load notebook', 'error');
        }
    };

    const deleteNotebook = async (notebookId) => {
        try {
            await axios.delete(`http://localhost:5000/api/notebook/${notebookId}`, {
                withCredentials: true
            });

            showAlert('Notebook deleted successfully', 'success');
            await fetchNotebooks();

            if (currentNotebookId === notebookId) {
                resetNotebook();
            }
        } catch (error) {
            showAlert('Failed to delete notebook', 'error');
        }
    };

    const createNewNotebook = () => {
        if (hasUnsavedChanges) {
            setShowNewNotebookDialog(true);
        } else {
            resetNotebook();
        }
    };

    const resetNotebook = () => {
        setCells([{
            id: GenerateUUID(),
            code: '',
            language: defaultLanguage,
            height: 50,
            index: 0,
            name: '',
            output: ''
        }]);
        setCurrentNotebookId(null);
        setNotebookName('Untitled Notebook');
        setHasUnsavedChanges(false);
        setShowNewNotebookDialog(false);
        showAlert('Created new notebook', 'success');
    };

    const showAlert = (message, type = 'info') => {
        const id = GenerateUUID();
        setAlerts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 3000);
    };

    const addCell = () => {
        const newCell = {
            id: GenerateUUID(),
            code: '',
            height: 50,
            language: defaultLanguage,
            index: cells.length,
            name: '',
            output: '',
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

    const updateCellName = (id, newName) => {
        setCells(prev =>
            prev.map(cell =>
                cell.id === id ? { ...cell, name: newName } : cell
            )
        );
    };

    const handleDefaultLanguageChange = (newLanguage) => {
        setDefaultLanguage(newLanguage);
        if (isDefaultLanguageEnabled) {
            // Only update cells that were using the old default language
            setCells(prev =>
                prev.map(cell => ({
                    ...cell,
                    language: cell.language === defaultLanguage ? newLanguage : cell.language
                }))
            );
        }
    };

    const toggleDefaultLanguage = () => {
        setIsDefaultLanguageEnabled(prev => !prev);
        if (!isDefaultLanguageEnabled) {
            // When enabling, update all cells to use their own language
            setCells(prev =>
                prev.map(cell => ({
                    ...cell,
                    language: cell.language
                }))
            );
        }
    };

    return (
        <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
            <div className="min-h-screen bg-gray-50 py-6 relative">
                <NotebookSidebar
                    notebooks={savedNotebooks}
                    onLoad={loadNotebook}
                    onDelete={deleteNotebook}
                    visible={showSidebar}
                />

                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="fixed top-4 right-4 z-50 space-y-2">
                        {alerts.map(alert => (
                            <Alert key={alert.id} type={alert.type} message={alert.message} />
                        ))}
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex items-center">
                                <p
                                    className="text-xl sm:text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent  focus:border-blue-500 focus:outline-none transition-all w-full sm:w-auto"
                                >{notebookName}</p>
                                {hasUnsavedChanges && (
                                    <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full animate-pulse">
                                        Unsaved changes
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isDefaultLanguageEnabled}
                                        onChange={toggleDefaultLanguage}
                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">Use Default Language</span>
                                </label>
                                {isDefaultLanguageEnabled && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">Default:</span>
                                        <select
                                            value={defaultLanguage}
                                            onChange={(e) => handleDefaultLanguageChange(e.target.value)}
                                            className="text-sm border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <option key={lang.id} value={lang.id}>
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-between items-center">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={createNewNotebook}
                                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 shadow-sm transition-all"
                                >
                                    <FileText className="h-4 w-4 mr-1.5" />
                                    New Notebook
                                </button>
                                <button
                                    onClick={handleSaveNotebook}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-all"
                                >
                                    <Save className="h-4 w-4 mr-1.5" />
                                    Save Notebook
                                </button>
                            </div>
                            <button
                                onClick={addCell}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-all"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Cell
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {cells.map((cell, index) => (
                            <NotebookCell
                                key={cell.id}
                                cell={cell}
                                onRun={handleRun}
                                onStop={handleStop}
                                onDelete={deleteCell}
                                onMoveUp={() => moveCell(cell.id, 'up')}
                                onMoveDown={() => moveCell(cell.id, 'down')}
                                isFirst={index === 0}
                                isLast={index === cells.length - 1}
                                onChange={updateCellCode}
                                onLanguageChange={updateCellLanguage}
                                onNameChange={updateCellName}
                                defaultLanguage={defaultLanguage}
                                isDefaultLanguageEnabled={isDefaultLanguageEnabled}
                                sendWebSocketMessage={sendWebSocketMessage}
                                isRunning={runningCells[cell.id]}
                            />
                        ))}
                    </div>

                    <CustomDialog
                        isOpen={showNewNotebookDialog}
                        onClose={() => setShowNewNotebookDialog(false)}
                        title="Create New Notebook"
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                You have unsaved changes in your current notebook. Would you like to save them before creating a new notebook?
                            </p>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={resetNotebook}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Don't Save
                                </button>
                                <button
                                    onClick={handleSaveNotebook}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Save & Create New
                                </button>
                            </div>
                        </div>
                    </CustomDialog>

                    <CustomDialog
                        isOpen={showSaveDialog}
                        onClose={() => {
                            setShowSaveDialog(false);
                            setNotebookFileName('');
                            setIsFileNameExists(false);
                        }}
                        title="Save Your Notebook"
                    >
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="notebookFileName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Notebook Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="notebookFileName"
                                        type="text"
                                        className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isFileNameExists ? 'border-red-500 pr-10' : 'border-gray-300'}`}
                                        placeholder="Enter a name for your notebook"
                                        value={notebookFileName}
                                        onChange={handleFileNameChange}
                                        disabled={isSaving}
                                    />
                                    {isFileNameExists && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <X className="h-5 w-5 text-red-500" />
                                        </div>
                                    )}
                                </div>
                                {isFileNameExists && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <X className="h-4 w-4 mr-1" />
                                        This notebook name already exists
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowSaveDialog(false);
                                        setNotebookFileName('');
                                        setIsFileNameExists(false);
                                    }}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNotebookWithFileName}
                                    disabled={isFileNameExists || !notebookFileName.trim() || isSaving}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    {isSaving ? (
                                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    ) : (
                                        <Save className="h-4 w-4 mr-1.5" />
                                    )}
                                    Save Notebook
                                </button>
                            </div>
                        </div>
                    </CustomDialog>
                </div>
            </div>
        </div>
    );
};

export default NotebookApp