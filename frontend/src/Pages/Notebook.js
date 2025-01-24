import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Play, Trash2, ChevronUp, ChevronDown, Plus, StopCircle, Save, FileText, Trash } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import Alert from "../Components/Alert";

const SUPPORTED_LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'cpp', name: 'C++' },
    { id: 'java', name: 'Java' }
];

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};

const CustomDialog = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <span className="sr-only">Close</span>
                            ×
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

const NotebookSidebar = ({ notebooks, onLoad, onDelete, visible }) => {
    return (
        <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Saved Notebooks</h2>
            </div>
            <div className="overflow-y-auto h-full pb-16">
                {notebooks.map(notebook => (
                    <div key={notebook._id} className="flex items-center justify-between p-4 hover:bg-gray-100 border-b">
                        <button
                            onClick={() => onLoad(notebook._id)}
                            className="flex items-center flex-1"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            <span className="truncate">{notebook.name}</span>
                        </button>
                        <button
                            onClick={() => onDelete(notebook._id)}
                            className="p-1 hover:text-red-600 ml-2"
                        >
                            <Trash className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


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
    onOutputChange,
    defaultLanguage,
    isDefaultLanguageEnabled
}) => {
    const [terminal, setTerminal] = useState(cell.output);
    const [isRunning, setIsRunning] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const terminalRef = useRef(null);
    const wsRef = useRef(null);



    const connectWebSocket = () => {
        const ws = new WebSocket(`ws://localhost:5000/ws?clientId=${cell.id}`);

        ws.onopen = () => {
            setTerminal(prev => {
                const newTerminal = 'Connected to cell...\n';
                onOutputChange(cell.id, newTerminal);
                return newTerminal;
            });
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setTerminal(prev => {
                const newTerminal = prev + message.data;
                onOutputChange(cell.id, newTerminal);
                return newTerminal;
            });
            if (message.type === 'system' && message.data.includes('Process exited')) {
                setIsRunning(false);
            }
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        };

        ws.onclose = () => {
            setTerminal(prev => {
                const newTerminal = prev + 'Connection closed...\n';
                onOutputChange(cell.id, newTerminal);
                return newTerminal;
            });
            setIsRunning(false);
        };

        wsRef.current = ws;
        return ws;
    };

    const handleRun = async () => {
        if (!cell.code.trim()) return;

        setIsRunning(true);
        setTerminal(prev => {
            const newTerminal = 'Running code...\n';
            onOutputChange(cell.id, newTerminal);
            return newTerminal;
        });

        const ws = wsRef.current || connectWebSocket();

        try {
            await onRun(cell.id, cell.code, cell.language);
        } catch (error) {
            setTerminal(prev => {
                const newTerminal = prev + `Error: ${error.message}\n`;
                onOutputChange(cell.id, newTerminal);
                return newTerminal;
            });
            setIsRunning(false);
        }
    };

    const handleStop = async () => {
        try {
            await onStop(cell.id);
            setIsRunning(false);
            setTerminal(prev => {
                const newTerminal = prev + 'Execution stopped by user\n';
                onOutputChange(cell.id, newTerminal);
                return newTerminal;
            });
        } catch (error) {
            setTerminal(prev => {
                const newTerminal = prev + `Error stopping execution: ${error.message}\n`;
                onOutputChange(cell.id, newTerminal);
                return newTerminal;
            });
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
                setTerminal(prev => {
                    const newTerminal = prev + inputValue + '\n';
                    onOutputChange(cell.id, newTerminal);
                    return newTerminal;
                });
                setInputValue('');
            }
        }
    };


    return (

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                        <input
                            type="text"
                            value={cell.name}
                            onChange={(e) => onNameChange(cell.id, e.target.value)}
                            placeholder="Cell name (optional)"
                            className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 w-48"
                        />
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            <Play className="h-4 w-4 mr-1" />
                            Run
                        </button>
                        {isRunning && (
                            <button
                                onClick={handleStop}
                                className="inline-flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                <StopCircle className="h-4 w-4 mr-1" />
                                Stop
                            </button>
                        )}
                        <select
                            value={cell.language}
                            onChange={(e) => onLanguageChange(cell.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
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
                    language={cell.language === defaultLanguage ? defaultLanguage : cell.language}
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
                        < pre className="whitespace-pre-wrap">{terminal} </pre>
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
        </div>
    );
};

const NotebookApp = ({ showSidebar }) => {
    const [cells, setCells] = useState([
        {
            id: generateUUID(),
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

    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [cells]);

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


    // Add these methods to the NotebookApp component
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
                id: cell.id || generateUUID()
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

    const updateCellOutput = (cellId, output) => {
        setCells(prev =>
            prev.map(cell =>
                cell.id === cellId
                    ? { ...cell, output: output || cell.output || '' }
                    : cell
            )
        );
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
            id: generateUUID(),
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
                    language: language === defaultLanguage ? defaultLanguage : language
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

    const handleStop = async (id) => {
        try {
            const response = await fetch('http://localhost:5000/api/code/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': id
                }
            });

            if (!response.ok) {
                throw new Error('Failed to stop execution');
            }

            showAlert('Execution stopped', 'success');
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

        <div className="min-h-screen bg-gray-50 py-8 relative">
            <NotebookSidebar
                notebooks={savedNotebooks}
                onLoad={loadNotebook}
                onDelete={deleteNotebook}
                visible={showSidebar}
            />

            <div className="max-w-5xl mx-auto px-4">
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {alerts.map(alert => (
                        <Alert key={alert.id} type={alert.type} message={alert.message} />
                    ))}
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={notebookName}
                            onChange={(e) => {
                                setNotebookName(e.target.value);
                                setHasUnsavedChanges(true);
                            }}
                            className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        />
                        {hasUnsavedChanges && (
                            <span className="text-sm text-gray-500">(Unsaved changes)</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDefaultLanguageEnabled}
                                    onChange={() => toggleDefaultLanguage()}
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Use Default Language</span>
                            </label>
                        </div>
                        {isDefaultLanguageEnabled && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Default:</span>
                                <select
                                    value={defaultLanguage}
                                    onChange={(e) => handleDefaultLanguageChange(e.target.value)}
                                    className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
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

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={createNewNotebook}
                            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded border hover:bg-gray-50"
                        >
                            <FileText className="h-4 w-4 mr-1" />
                            New Notebook
                        </button>
                        <button
                            onClick={handleSaveNotebook}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Save className="h-4 w-4 mr-1" />
                            Save Notebook
                        </button>
                    </div>
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
                        onOutputChange={updateCellOutput}
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
                    />
                ))}

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
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Don't Save
                            </button>
                            <button
                                onClick={handleSaveNotebook}
                                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
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
                    title="Save Notebook"
                >
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="notebookFileName" className="block text-sm font-medium text-gray-700 mb-1">
                                Notebook Name
                            </label>
                            <input
                                id="notebookFileName"
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isFileNameExists ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Enter notebook name"
                                value={notebookFileName}
                                onChange={handleFileNameChange}
                                disabled={isSaving}
                            />
                            {isFileNameExists && (
                                <p className="mt-1 text-sm text-red-600">
                                    This notebook name already exists. Please choose a different name.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowSaveDialog(false);
                                    setNotebookFileName('');
                                    setIsFileNameExists(false);
                                }}
                                disabled={isSaving}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNotebookWithFileName}
                                disabled={isFileNameExists || !notebookFileName.trim() || isSaving}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {isSaving ? (
                                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                ) : (
                                    <Save className="h-4 w-4 mr-1" />
                                )}
                                Save
                            </button>
                        </div>
                    </div>
                </CustomDialog>

            </div>
        </div>
    );
};

export default NotebookApp;