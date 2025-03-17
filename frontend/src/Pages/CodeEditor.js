import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import { Play, StopCircle, Square, Save, X, Plus, Trash, FolderOpen } from "lucide-react";
import DeleteConfirmationDialog from '../Components/DeleteConfirmationDialog';
import { useAuth, AuthContext } from '../App';
import axios from 'axios';
import '../Lib/Animations.css';

// Utility function for generating UUIDs
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};

// Custom Dialog Component
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

// Custom Button Component
export const CustomButton = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm";
    const variants = {
        primary: "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 active:from-indigo-800 active:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed",
        secondary: "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 hover:from-gray-200 hover:to-gray-100 active:from-gray-300 active:to-gray-200",
        danger: "bg-gradient-to-r from-red-500 to-red-400 text-white hover:from-red-600 hover:to-red-500 active:from-red-700 active:to-red-600",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className} ${props.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
            {...props}
        >
            {children}
        </button>
    );
};

// Custom Loader Component
export const LoaderIcon = () => (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
);

const CodeEditor = ({ showSidebar }) => {
    const [code, setCode] = useState(() => {
        return localStorage.getItem('unsavedCode') || '';
    });
    const { showAlert, setIsLoading } = useContext(AuthContext);
    const [language, setLanguage] = useState('python');
    const [terminal, setTerminal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [fileName, setFileName] = useState('');
    const [currentFileId, setCurrentFileId] = useState(null);
    const [isFileNameExists, setIsFileNameExists] = useState(false);
    const [showNewFileDialog, setShowNewFileDialog] = useState(false);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);
    const clientId = useRef(generateUUID());
    const [isFileSaved, setIsFileSaved] = useState(false);
    const [ClearEditor, setClearEditor] = useState(false);
    const [savedPrograms, setSavedPrograms] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [displayFileName, setDisplayFileName] = useState('Untitled File');
    const { user } = useAuth();

    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFileDeleted, setIsFileDeleted] = useState(false);
    const [programToDelete, setProgramToDelete] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSavedPrograms();
        }
    }, [user]);

    useEffect(() => {
        if (displayFileName === 'Untitled File') {
            localStorage.setItem('unsavedCode', code);
        }
    }, [code]);

    useEffect(() => {
        if (code !== localStorage.getItem('unsavedCode')) {
            setIsFileSaved(false);
        }
        localStorage.setItem('unsavedCode', code);
    }, [code]);

    // WebSocket connection effect
    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket(`ws://localhost:5000/ws?clientId=${clientId.current}`);

            ws.onopen = () => {
                setIsConnected(true);
                setTerminal('Connected to server...\n');
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
                setIsConnected(false);
                setIsRunning(false);
                setTerminal(prev => prev + 'Disconnected from server. Reconnecting...\n');
                setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = () => {
                setIsRunning(false);
                setTerminal(prev => prev + 'Connection error. Retrying...\n');
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

    useEffect(() => {
        const handleShowSaveDialog = () => {
            setShowSaveDialog(true);
        };

        window.addEventListener('show-save-dialog', handleShowSaveDialog);

        return () => {
            window.removeEventListener('show-save-dialog', handleShowSaveDialog);
        };
    }, []);

    useEffect(() => {
        if (user && location.state?.ClearEditor) {
            setClearEditor(true); // Show save dialog
            navigate(location.state.from || '/', { replace: true }); // Remove redirectAfterLogin from state
        }
    }, [user, location.state, navigate]);

    const checkFileExists = async (fileId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/managecode/${fileId}`, {
                withCredentials: true
            });
            return !!response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false;
            }
            throw error;
        }
    };

    const clearEditor = () => {
        setCode('');
        setCurrentFileId(null);
        setFileName('');
        setDisplayFileName('Untitled File');
        setIsFileSaved(true);
        localStorage.removeItem('unsavedCode');
    };

    const handleLoadProgram = async (id) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/managecode/${id}`,
                { withCredentials: true }
            );
            const { code, language, fileName } = response.data;
            setCode(code);
            setLanguage(language);
            setCurrentFileId(id);
            setDisplayFileName(fileName);
            setIsFileSaved(true);
            setIsFileDeleted(false);
        } catch (error) {
            console.error('Failed to load program:', error);
            showAlert('error', 'Failed to load program');
        }
        finally {
            setIsLoading(false);
        }
    };

    // Handle program delete
    const handleDeleteProgram = async (id) => {
        const program = savedPrograms.find(p => p._id === id);
        if (program) {
            setProgramToDelete(program);
            setDeleteDialogOpen(true);
        }
    };

    const fetchSavedPrograms = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/managecode/list', {
                withCredentials: true,
            });
            setSavedPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            setSavedPrograms([]);
        }
        finally {
            setIsLoading(false);
        }
    };

    // Update handleSaveCode to refresh files after update
    const handleSaveCode = async () => {
        if (!code.trim()) {
            showAlert('error', 'Please enter some code to save');
            return;
        }

        if (!user) {
            localStorage.setItem('unsavedCode', code);
            showAlert('info', 'Please login to save your code');
            setTimeout(() => {
                navigate('/login', { state: { from: location.pathname, showSaveDialog: true } });
            }, 1500);
            return;
        }

        if (!currentFileId) {
            setShowSaveDialog(true);
            return;
        }

        setIsUpdating(true);
        try {
            // Check if file still exists before updating
            const exists = await checkFileExists(currentFileId);
            if (!exists) {
                setIsFileDeleted(true);
                showAlert('error', 'This file has been deleted. Please save as a new file.');
                setShowSaveDialog(true);
                return;
            }

            await axios.put(`http://localhost:5000/api/managecode/update/${currentFileId}`, {
                code,
                language,
            }, { withCredentials: true });

            setIsFileSaved(true);
            showSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
            showAlert('success', 'Code updated successfully');
            await fetchSavedPrograms();
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setIsFileDeleted(true);
                showAlert('error', 'This file has been deleted. Please save as a new file.');
                setShowSaveDialog(true);
            } else {
                showAlert('error', error.message);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveNewFile = async () => {
        if (!user) {
            showAlert('info', 'Please login to save your code');
            setTimeout(() => {
                navigate('/login', { state: { from: location.pathname, showSaveDialog: true } });
            }, 1500);
            return;
        }

        if (!fileName.trim()) {
            showAlert('error', 'Please enter a file name');
            return;
        }

        setIsSaving(true);
        try {
            const exists = await checkFileNameExists(fileName);
            if (exists) {
                setIsFileNameExists(true);
                showAlert('warning', 'File name already exists');
                return;
            }

            const response = await axios.post('http://localhost:5000/api/managecode/save', {
                fileName,
                code,
                language,
            }, { withCredentials: true });

            await fetchSavedPrograms();
            setShowSaveDialog(false);
            setFileName('');
            setIsFileNameExists(false);
            setIsFileSaved(true);
            setIsFileDeleted(false);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
            showAlert('success', 'Code saved successfully');

            // Clear the editor after successful save when coming from new file
            if (ClearEditor) {
                clearEditor();
                setClearEditor(false);
                setShowNewFileDialog(false);
            }

            localStorage.removeItem('unsavedCode');
            await fetchSavedPrograms();
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndNew = async () => {
        if (!user) {
            showAlert('info', 'Please login to save your code');
            navigate('/login', { state: { from: location.pathname, showSaveDialog: true, ClearEditor: true } });
            return;
        }
        setIsUpdating(true);
        try {
            if (currentFileId) {
                // Update existing file
                await axios.put(`http://localhost:5000/api/managecode/update/${currentFileId}`, {
                    code,
                    language,
                }, { withCredentials: true });
                setShowNewFileDialog(false);
                clearEditor();
                showAlert('success', 'Code updated successfully');
            } else {
                setShowNewFileDialog(false);
                setClearEditor(true);
                setShowSaveDialog(true); // Show save dialog for new file
            }
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDelete = async () => {
        if (programToDelete) {
            setIsDeleting(true);
            try {
                await axios.delete(`http://localhost:5000/api/managecode/${programToDelete._id}`,
                    { withCredentials: true }
                );

                // If the deleted file was the current file
                if (programToDelete._id === currentFileId) {
                    setIsFileDeleted(true);
                    clearEditor();
                }

                setSavedPrograms(programs =>
                    programs.filter(p => p._id !== programToDelete._id)
                );
                setDeleteDialogOpen(false);
                setProgramToDelete(null);
                showAlert('success', 'File deleted successfully');
                await fetchSavedPrograms();
            } catch (error) {
                showAlert('error', error.message);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleNewFile = () => {
        if (!user && code.trim()) {
            setShowNewFileDialog(true);
            return;
        }

        if (code.trim() && (!isFileSaved || currentFileId)) {
            setShowNewFileDialog(true); // Show dialog for unsaved changes or updates
            return;
        }

        clearEditor(); // If no unsaved changes, clear the editor
    };

    const handleDontSaveAndNew = () => {
        setShowNewFileDialog(false);
        clearEditor(); // Clear the editor without saving
    };

    const checkFileNameExists = async (name) => {
        try {
            if (!user) return false;

            // First check against locally stored files
            const fileExists = savedPrograms.some(file =>
                file.fileName.toLowerCase() === name.toLowerCase()
            );

            if (fileExists) {
                return true;
            }

            // Then check with server
            const response = await axios.get(
                `http://localhost:5000/api/managecode/checkfilename/${encodeURIComponent(name)}`,
                { withCredentials: true }
            );
            return response.data.exists;
        } catch (error) {
            showAlert('error', 'Error checking file name');
            return false;
        }
    };

    const handleFileNameChange = async (e) => {
        const value = e.target.value;
        setFileName(value);
        if (value.trim()) {
            const exists = await checkFileNameExists(value);
            setIsFileNameExists(exists);
        } else {
            setIsFileNameExists(false);
        }
    };

    const handleRunCode = async () => {
        if (!code.trim()) {
            showAlert('error', 'Please enter some code to execute');
            return;
        }

        setIsRunning(true);
        setTerminal('Running code...\n');

        try {
            const response = await fetch('http://localhost:5000/api/code/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': clientId.current
                },
                body: JSON.stringify({ code, language }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error during execution');
            }
            showAlert('success', 'Code execution started successfully');
        } catch (error) {
            showAlert('error', error.message);
            setIsRunning(false);
            setTerminal(prev => prev + `Error: ${error.message}\n`);
        }
    };

    const handleStopCode = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/code/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': clientId.current
                }
            });

            if (!response.ok) {
                throw new Error('Failed to stop execution');
            }

            setTerminal(prev => prev + '\nProgram stopped by user\n');
            setIsRunning(false);
            showAlert('success', 'Execution stopped successfully');
        } catch (error) {
            showAlert('error', error.message);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 glass-card border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-800">Saved Programs</h2>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {savedPrograms.length} files
                    </span>
                </div>
                <div className="overflow-y-auto h-full pb-16">
                    {user ? (
                        savedPrograms.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="text-gray-400 flex justify-center mb-2">
                                    <FolderOpen className="h-10 w-10" />
                                </div>
                                <p className="text-sm text-gray-500">No files saved yet</p>
                                <CustomButton
                                    variant="primary"
                                    className="mt-4 text-xs py-1.5 px-3"
                                    onClick={() => setShowSaveDialog(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Create New File
                                </CustomButton>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {savedPrograms.map((program) => (
                                    <div
                                        key={program._id}
                                        className={`flex items-center justify-between p-3 hover:bg-indigo-50 transition-colors duration-150 ${currentFileId === program._id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''
                                            }`}
                                    >
                                        <button
                                            onClick={() => handleLoadProgram(program._id)}
                                            className="flex items-center flex-1 text-left"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                                <FolderOpen className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="truncate text-gray-700 font-medium">{program.fileName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(program.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProgram(program._id);
                                            }}
                                            className="p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors ml-2 text-gray-400"
                                            aria-label={`Delete ${program.fileName}`}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="p-6 text-center">
                            <div className="text-gray-400 flex justify-center mb-2">
                                <FolderOpen className="h-10 w-10" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Please login to view saved programs</p>
                            <CustomButton
                                variant="primary"
                                className="text-xs py-1.5 px-3"
                                onClick={() => navigate('/login')}
                            >
                                Login to Save
                            </CustomButton>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col space-y-4">
                        {/* Toolbar */}
                        <div className="glass-card rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center flex-wrap gap-2">
                                    <CustomButton
                                        variant="outline"
                                        onClick={handleNewFile}
                                        className="flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" />
                                        New File
                                    </CustomButton>

                                    <CustomButton
                                        variant="primary"
                                        onClick={handleRunCode}
                                        disabled={isRunning || !isConnected}
                                        className="flex items-center"
                                    >
                                        {isRunning ? (
                                            <Square className="h-4 w-4 mr-1.5" />
                                        ) : (
                                            <Play className="h-4 w-4 mr-1.5" />
                                        )}
                                        {isRunning ? 'Running...' : 'Run Code'}
                                    </CustomButton>

                                    {isRunning && (
                                        <CustomButton
                                            variant="danger"
                                            onClick={handleStopCode}
                                            className="flex items-center"
                                        >
                                            <StopCircle className="h-4 w-4 mr-1.5" />
                                            Stop
                                        </CustomButton>
                                    )}

                                    <CustomButton
                                        variant="primary"
                                        onClick={handleSaveCode}
                                        disabled={isUpdating}
                                        className="flex items-center relative"
                                    >
                                        {isUpdating ? (
                                            <LoaderIcon />
                                        ) : (
                                            <Save className={`h-4 w-4 mr-1.5 ${showSaveSuccess ? 'animate-pulse text-green-500' : ''}`} />
                                        )}
                                        {currentFileId ? 'Update' : 'Save'}
                                        {showSaveSuccess && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                        )}
                                    </CustomButton>
                                </div>

                                <div className="flex items-center">
                                    <div className="file-badge group relative">
                                        <span className="text-sm font-medium text-gray-700 flex items-center">
                                            {displayFileName}
                                            {!isFileSaved && <span className="file-status file-status-unsaved"></span>}
                                        </span>
                                        {!isFileSaved && (
                                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Unsaved changes
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="select block rounded-lg border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="python">Python</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="cpp">C++</option>
                                        <option value="java">Java</option>
                                    </select>
                                    <div className="file-badge">
                                        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`} />
                                        <span className="text-xs font-medium text-gray-600">
                                            {isConnected ? 'Connected' : 'Reconnecting...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="neomorphic bg-white rounded-xl overflow-hidden">
                            <Editor
                                height="450px"
                                language={language}
                                value={code}
                                onChange={(value) => {
                                    setCode(value || '')
                                    setIsFileSaved(false)
                                }}
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
                                className="rounded-xl"
                            />
                        </div>

                        {/* Terminal */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Terminal</label>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {isRunning ? 'Running' : 'Ready'}
                                </span>
                            </div>
                            <div
                                ref={terminalRef}
                                className="terminal h-64 shadow-lg"
                            >
                                <pre className="h-full p-4 text-white font-mono text-sm overflow-auto">
                                    {terminal}
                                    {isRunning && (
                                        <div className="flex items-center">
                                            <span className="terminal-prompt">{'>'}</span>
                                            <input
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && isRunning) {
                                                        e.preventDefault();
                                                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                                            wsRef.current.send(JSON.stringify({
                                                                type: 'input',
                                                                input: inputValue
                                                            }));
                                                            setTerminal(prev => prev + inputValue + '\n');
                                                            setInputValue('');
                                                        }
                                                    }
                                                }}
                                                className="flex-1 ml-2 bg-transparent text-green-400 font-mono text-sm focus:outline-none"
                                                placeholder="Type input and press Enter..."
                                            />
                                        </div>
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Save Dialog */}
                    <CustomDialog
                        isOpen={showSaveDialog}
                        onClose={() => {
                            setShowSaveDialog(false);
                            setFileName('');
                            setIsFileNameExists(false);
                        }}
                        title="Save Your Code"
                    >
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
                                    File Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="fileName"
                                        type="text"
                                        className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isFileNameExists ? 'border-red-500 pr-10' : 'border-gray-300'}`}
                                        placeholder="Enter a name for your file"
                                        value={fileName}
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
                                        This file name already exists
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <CustomButton
                                    variant="outline"
                                    onClick={() => {
                                        setShowSaveDialog(false);
                                        setFileName('');
                                        setIsFileNameExists(false);
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </CustomButton>
                                <CustomButton
                                    variant="primary"
                                    onClick={handleSaveNewFile}
                                    disabled={isFileNameExists || !fileName.trim() || isSaving}
                                    className="relative"
                                >
                                    {isSaving ? (
                                        <LoaderIcon />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-1.5" />
                                            Save File
                                        </>
                                    )}
                                </CustomButton>
                            </div>
                        </div>
                    </CustomDialog>

                    {/* New File Dialog */}
                    <CustomDialog
                        isOpen={showNewFileDialog}
                        onClose={() => setShowNewFileDialog(false)}
                        title="Create New File"
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 text-indigo-800 rounded-lg">
                                <p className="text-sm">
                                    You have unsaved changes. Would you like to save them before creating a new file?
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <CustomButton
                                    variant="outline"
                                    onClick={handleDontSaveAndNew}
                                >
                                    Don't Save
                                </CustomButton>
                                <CustomButton
                                    variant="primary"
                                    onClick={handleSaveAndNew}
                                    disabled={isUpdating || isFileDeleted}
                                >
                                    {isUpdating ? (
                                        <LoaderIcon />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1.5" />
                                    )}
                                    {currentFileId ? 'Update & Create New' : 'Save & Create New'}
                                </CustomButton>
                            </div>
                        </div>
                    </CustomDialog>

                    {/* Delete Confirmation Dialog */}
                    <DeleteConfirmationDialog
                        isOpen={deleteDialogOpen}
                        confirmDelete={confirmDelete}
                        isDeleting={isDeleting}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setProgramToDelete(null);
                        }}
                        fileName={programToDelete?.fileName || ''}
                    />
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
