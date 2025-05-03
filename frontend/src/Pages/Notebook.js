import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Play, Trash2, ChevronUp, ChevronDown, Plus, StopCircle, Save, FileText, Trash, X, FolderOpen, Type } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import Alert from "../Components/Alert";
import DeleteConfirmationDialog from '../Components/DeleteConfirmationDialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUPPORTED_LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'cpp', name: 'C++' },
    { id: 'java', name: 'Java' }
];

const CELL_TYPES = [
    { id: 'code', name: 'Code' },
    { id: 'text', name: 'Text' }
];

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};

const CustomDialog = ({ isOpen, onClose, title, children }) => {
    const [animateOut, setAnimateOut] = useState(false);

    const handleClose = () => {
        setAnimateOut(true);
        setTimeout(() => {
            setAnimateOut(false);
            onClose();
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-sm transition-opacity flex items-center justify-center">
            <div className="min-h-screen items-center justify-center p-4 flex" onClick={handleClose}>
                <div
                    className={`relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 transform transition-all duration-300 ${animateOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

const NotebookSidebar = ({ notebooks, onLoad, onDelete, visible, loadMore, hasMore }) => {
    const [isLoading, setIsLoading] = useState(false);
    const observer = useRef();

    const lastNotebookRef = (node) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setIsLoading(true);
                loadMore().finally(() => setIsLoading(false));
            }
        });
        if (node) observer.current.observe(node);
    };

    return (
        <div
            className={`fixed inset-y-0 left-0 z-30 w-64 glass-card border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out ${visible ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">Saved Notebooks</h2>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {notebooks.length} notebooks
                </span>
            </div>
            <div className="overflow-y-auto h-full pb-16">
                {notebooks.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="text-gray-400 flex justify-center mb-2">
                            <FolderOpen className="h-10 w-10" />
                        </div>
                        <p className="text-sm text-gray-500">No notebooks saved yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notebooks.map((notebook, index) => (
                            <div
                                key={notebook._id}
                                ref={index === notebooks.length - 1 ? lastNotebookRef : null}
                                className="flex items-center justify-between p-3 hover:bg-indigo-50 transition-colors duration-150"
                            >
                                <button
                                    onClick={() => onLoad(notebook._id)}
                                    className="flex items-center flex-1 text-left"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="truncate text-gray-700 font-medium">{notebook.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(notebook.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(notebook._id);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors ml-2 text-gray-400"
                                    aria-label={`Delete ${notebook.name}`}
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TextCell = ({
    cell,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    onChange,
    onNameChange
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(cell.content || '');

    const handleSave = () => {
        onChange(cell.id, content);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 flex-wrap gap-2">
                    <input
                        type="text"
                        value={cell.name}
                        onChange={(e) => onNameChange(cell.id, e.target.value)}
                        placeholder="Cell name (optional)"
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48"
                    />
                    <span className="text-sm text-gray-500">Text Cell {cell.index + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {!isFirst && (
                        <button
                            onClick={() => onMoveUp(cell.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                    )}
                    {!isLast && (
                        <button
                            onClick={() => onMoveDown(cell.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(cell.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your markdown text here..."
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="prose max-w-none p-4 bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => setIsEditing(true)}
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {cell.content || '*Click to edit*'}
                    </ReactMarkdown>
                </div>
            )}
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
    defaultLanguage,
    isDefaultLanguageEnabled,
    sendWebSocketMessage,
    isRunning,
    onChangeType
}) => {
    const [inputValue, setInputValue] = useState('');
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

    return (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 flex-wrap gap-2">
                    <input
                        type="text"
                        value={cell.name}
                        onChange={(e) => onNameChange(cell.id, e.target.value)}
                        placeholder="Cell name (optional)"
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48"
                    />
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                    >
                        <Play className="h-4 w-4 mr-1" />
                        Run
                    </button>
                    {isRunning && (
                        <button
                            onClick={handleStop}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <StopCircle className="h-4 w-4 mr-1" />
                            Stop
                        </button>
                    )}
                    <select
                        value={cell.type}
                        onChange={(e) => onChangeType(cell.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {CELL_TYPES.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={cell.language}
                        onChange={(e) => onLanguageChange(cell.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={cell.type !== 'code'}
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
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                    )}
                    {!isLast && (
                        <button
                            onClick={() => onMoveDown(cell.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(cell.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {cell.type === 'code' ? (
                <>
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
                            fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
                            padding: { top: 16 },
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                            cursorSmoothCaretAnimation: true,
                        }}
                        className="rounded-lg"
                    />

                    <div className="mt-2 bg-gray-900 rounded-lg p-3">
                        <div
                            ref={terminalRef}
                            className="h-32 font-mono text-sm text-white overflow-auto"
                        >
                            <pre className="whitespace-pre-wrap">{cell.output}</pre>
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
                </>
            ) : (
                <div className="prose max-w-none p-4 bg-gray-50 rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {cell.content || '*This is a text cell*'}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

const NotebookApp = ({ showSidebar }) => {
    const [cells, setCells] = useState([
        {
            id: generateUUID(),
            type: 'code',
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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [notebookName, setNotebookName] = useState('Untitled Notebook');
    const [savedNotebooks, setSavedNotebooks] = useState([]);
    const [currentNotebookId, setCurrentNotebookId] = useState(null);
    const { user } = useAuth();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [notebookFileName, setNotebookFileName] = useState('');
    const [isFileNameExists, setIsFileNameExists] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showNewNotebookDialog, setShowNewNotebookDialog] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [programToDelete, setProgramToDelete] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const wsRef = useRef(null);
    const clientId = useRef(generateUUID());
    const [runningCells, setRunningCells] = useState({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);

    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket(`ws://localhost:5000/ws?clientId=${clientId.current}`);

            ws.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
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
    };

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

    const fetchNotebooks = async (pageNum = 1) => {
        if (!user) return;

        setIsLoadingNotebooks(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/notebook/list?page=${pageNum}&limit=10`, {
                withCredentials: true
            });

            if (pageNum === 1) {
                setSavedNotebooks(response.data.notebooks);
            } else {
                setSavedNotebooks(prev => [...prev, ...response.data.notebooks]);
            }

            setHasMore(response.data.notebooks.length > 0);
            setPage(pageNum);
        } catch (error) {
            showAlert('Failed to fetch notebooks', 'error');
        } finally {
            setIsLoadingNotebooks(false);
        }
    };

    const loadMoreNotebooks = async () => {
        await fetchNotebooks(page + 1);
    };

    useEffect(() => {
        fetchNotebooks();
    }, [user]);

    useEffect(() => {
        if (user && location.state?.showSaveDialog) {
            setShowSaveDialog(true);
            navigate(location.state.from || '/', { replace: true });
        }
    }, [user, location.state, navigate]);

    const checkFileNameExists = async (name) => {
        try {
            if (!user) return false;

            const fileExists = savedNotebooks.some(notebook =>
                notebook.name.toLowerCase() === name.toLowerCase()
            );

            if (fileExists) {
                return true;
            }

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

            const notebookData = {
                name: notebookFileName,
                cells: cells
            };

            const response = await axios.post('http://localhost:5000/api/notebook/save',
                notebookData,
                { withCredentials: true }
            );

            setHasUnsavedChanges(false);
            setShowSaveDialog(false);
            setNotebookFileName('');
            setCurrentNotebookId(response.data._id);
            setNotebookName(notebookFileName);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
            showAlert('Notebook saved successfully', 'success');
            await fetchNotebooks();
        } catch (error) {
            showAlert('Failed to save notebook', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNotebook = async () => {
        if (!user) {
            showAlert('Please login to save your notebook', 'info');
            setTimeout(() => {
                navigate('/login', {
                    state: {
                        from: location.pathname,
                        showSaveDialog: true
                    }
                });
            }, 1500);
            return;
        }

        if (!currentNotebookId) {
            setShowSaveDialog(true);
            return;
        }

        setIsSaving(true);
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
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
            showAlert('Notebook updated successfully', 'success');
            await fetchNotebooks();
        } catch (error) {
            showAlert('Failed to save notebook', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const loadNotebook = async (notebookId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/notebook/${notebookId}`, {
                withCredentials: true
            });
            const notebook = response.data;

            setCells(notebook.cells.map((cell, index) => ({
                ...cell,
                id: cell.id || generateUUID(),
                index
            })));
            setNotebookName(notebook.name);
            setCurrentNotebookId(notebookId);
            setHasUnsavedChanges(false);
            showAlert('Notebook loaded successfully', 'success');
        } catch (error) {
            showAlert('Failed to load notebook', 'error');
        }
    };

    const deleteNotebook = async (notebookId) => {
        const notebook = savedNotebooks.find(n => n._id === notebookId);
        if (notebook) {
            setProgramToDelete(notebook);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (programToDelete) {
            setIsDeleting(true);
            try {
                await axios.delete(`http://localhost:5000/api/notebook/${programToDelete._id}`, {
                    withCredentials: true
                });

                if (programToDelete._id === currentNotebookId) {
                    resetNotebook();
                }

                setSavedNotebooks(notebooks =>
                    notebooks.filter(n => n._id !== programToDelete._id)
                );
                setDeleteDialogOpen(false);
                setProgramToDelete(null);
                showAlert('Notebook deleted successfully', 'success');
            } catch (error) {
                showAlert('Failed to delete notebook', 'error');
            } finally {
                setIsDeleting(false);
            }
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
            id: generateUUID(),
            type: 'code',
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

    const handleSaveAndNew = async () => {
        if (!user) {
            showAlert('Please login to save your notebook', 'info');
            navigate('/login', {
                state: {
                    from: location.pathname,
                    showSaveDialog: true
                }
            });
            return;
        }

        if (currentNotebookId) {
            await handleSaveNotebook();
        } else {
            setShowSaveDialog(true);
        }
        resetNotebook();
    };

    const handleDontSaveAndNew = () => {
        setShowNewNotebookDialog(false);
        resetNotebook();
    };

    const showAlert = (message, type = 'info') => {
        const id = generateUUID();
        setAlerts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 3000);
    };

    const addCell = (type = 'code') => {
        const newCell = {
            id: generateUUID(),
            type,
            code: type === 'code' ? '' : undefined,
            content: type === 'text' ? '' : undefined,
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

    const updateCellContent = (id, newContent) => {
        setCells(prev =>
            prev.map(cell =>
                cell.id === id ? { ...cell, content: newContent } : cell
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

    const updateCellType = (id, newType) => {
        setCells(prev =>
            prev.map(cell =>
                cell.id === id ? {
                    ...cell,
                    type: newType,
                    code: newType === 'code' ? (cell.code || '') : undefined,
                    content: newType === 'text' ? (cell.content || '') : undefined
                } : cell
            )
        );
    };

    const handleDefaultLanguageChange = (newLanguage) => {
        setDefaultLanguage(newLanguage);
        if (isDefaultLanguageEnabled) {
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
    };

    const renderCell = (cell, index) => {
        if (cell.type === 'text') {
            return (
                <TextCell
                    key={cell.id}
                    cell={cell}
                    onDelete={deleteCell}
                    onMoveUp={() => moveCell(cell.id, 'up')}
                    onMoveDown={() => moveCell(cell.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === cells.length - 1}
                    onChange={updateCellContent}
                    onNameChange={updateCellName}
                />
            );
        } else {
            return (
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
                    onChangeType={updateCellType}
                />
            );
        }
    };

    return (
        <div className="flex min-h-screen">
            <NotebookSidebar
                notebooks={savedNotebooks}
                onLoad={loadNotebook}
                onDelete={deleteNotebook}
                visible={showSidebar}
                loadMore={loadMoreNotebooks}
                hasMore={hasMore}
            />

            <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col space-y-4">
                        <div className="glass-card rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center flex-wrap gap-2">
                                    <button
                                        onClick={createNewNotebook}
                                        className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <FileText className="h-4 w-4 mr-1.5" />
                                        New Notebook
                                    </button>
                                    <button
                                        onClick={handleSaveNotebook}
                                        disabled={!hasUnsavedChanges}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors relative"
                                    >
                                        {isSaving ? (
                                            <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : (
                                            <Save className={`h-4 w-4 mr-1.5 ${showSaveSuccess ? 'animate-pulse text-green-500' : ''}`} />
                                        )}
                                        {currentNotebookId ? 'Update' : 'Save'}
                                        {showSaveSuccess && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center">
                                    <div className="file-badge group relative">
                                        <span className="text-sm font-medium text-gray-700 flex items-center">
                                            {notebookName}
                                            {hasUnsavedChanges && <span className="file-status file-status-unsaved"></span>}
                                        </span>
                                        {hasUnsavedChanges && (
                                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Unsaved changes
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isDefaultLanguageEnabled}
                                            onChange={() => toggleDefaultLanguage()}
                                            className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-600">Use Default</span>
                                    </label>
                                    {isDefaultLanguageEnabled && (
                                        <select
                                            value={defaultLanguage}
                                            onChange={(e) => handleDefaultLanguageChange(e.target.value)}
                                            className="select block rounded-lg border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <option key={lang.id} value={lang.id}>
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {cells.map((cell, index) => renderCell(cell, index))}

                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => addCell('code')}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Code Cell
                            </button>
                            <button
                                onClick={() => addCell('text')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Type className="h-4 w-4 mr-1.5" />
                                Add Text Cell
                            </button>
                        </div>
                    </div>

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
                                <div className="relative">
                                    <input
                                        id="notebookFileName"
                                        type="text"
                                        className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isFileNameExists ? 'border-red-500 pr-10' : 'border-gray-300'}`}
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
                                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNotebookWithFileName}
                                    disabled={isFileNameExists || !notebookFileName.trim() || isSaving}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors relative"
                                >
                                    {isSaving ? (
                                        <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

                    <CustomDialog
                        isOpen={showNewNotebookDialog}
                        onClose={() => setShowNewNotebookDialog(false)}
                        title="Create New Notebook"
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 text-indigo-800 rounded-lg">
                                <p className="text-sm">
                                    You have unsaved changes. Would you like to save them before creating a new notebook?
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    onClick={handleDontSaveAndNew}
                                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Don't Save
                                </button>
                                <button
                                    onClick={handleSaveAndNew}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Save className="h-4 w-4 mr-1.5" />
                                    Save & Create New
                                </button>
                            </div>
                        </div>
                    </CustomDialog>

                    <DeleteConfirmationDialog
                        isOpen={deleteDialogOpen}
                        confirmDelete={confirmDelete}
                        isDeleting={isDeleting}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setProgramToDelete(null);
                        }}
                        fileName={programToDelete?.name || ''}
                    />

                    <div className="fixed top-4 right-4 z-50 space-y-2">
                        {alerts.map(alert => (
                            <Alert key={alert.id} type={alert.type} message={alert.message} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotebookApp;