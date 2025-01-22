
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import { Play, StopCircle, Square, Save, X, Plus, Trash, FolderOpen } from "lucide-react";
import DeleteConfirmationDialog from '../Components/DeleteConfirmationDialog';
import Alert from '../Components/Alert';
import { useAuth } from '../App';
import axios from 'axios';

// Utility function for generating UUIDs remains the same
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};


export const Loader = () => (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
);


// Custom Dialog Component remains the same
const CustomDialog = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Custom Button Component remains the same
export const CustomButton = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "inline-flex items-center px-4 py-2 text-sm font-medium rounded transition-colors";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        danger: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const CodeEditor = ({ showSidebar }) => {
    const [code, setCode] = useState(() => {
        return localStorage.getItem('unsavedCode') || '';
    });
    const [language, setLanguage] = useState('python');
    const [terminal, setTerminal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [alerts, setAlerts] = useState([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [fileName, setFileName] = useState('');
    const [currentFileId, setCurrentFileId] = useState(null);
    const [isFileNameExists, setIsFileNameExists] = useState(false);
    const [showNewFileDialog, setShowNewFileDialog] = useState(false);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);
    const clientId = useRef(generateUUID());
    const [isFileSaved, setIsFileSaved] = useState(false);
    const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);
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



    useEffect(() => {
        localStorage.setItem('unsavedCode', code);
    }, [code]);




    useEffect(() => {
        if (code !== localStorage.getItem('unsavedCode')) {
            setIsFileSaved(false);
        }
        localStorage.setItem('unsavedCode', code);
    }, [code]);


    useEffect(() => {
        if (user) {
            fetchSavedPrograms();
        }
    }, [user]);





    // WebSocket connection effect remains the same
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
        if (user && location.state?.redirectAfterLogin) {
            setShowSaveDialog(true); // Show save dialog
            navigate(location.state.from || '/', { replace: true }); // Remove redirectAfterLogin from state
        }
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
            showAlert('Failed to load program', 'error');
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
        try {
            const response = await axios.get('http://localhost:5000/api/managecode/list', {
                withCredentials: true,
            });
            setSavedPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            setSavedPrograms([]);
        }
    };




    // Update handleSaveCode to refresh files after update
    const handleSaveCode = async () => {
        if (!code.trim()) {
            showAlert('Please enter some code to save', 'error');
            return;
        }

        if (!user) {
            localStorage.setItem('unsavedCode', code);
            showAlert('Please login to save your code', 'info');
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
                showAlert('This file has been deleted. Please save as a new file.', 'error');
                setShowSaveDialog(true);
                return;
            }

            await axios.put(`http://localhost:5000/api/managecode/update/${currentFileId}`, {
                code,
                language,
            }, { withCredentials: true });

            setIsFileSaved(true);
            showAlert('Code updated successfully', 'success');
            await fetchSavedPrograms();
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setIsFileDeleted(true);
                showAlert('This file has been deleted. Please save as a new file.', 'error');
                setShowSaveDialog(true);
            } else {
                showAlert(error.message, 'error');
            }
        } finally {
            setIsUpdating(false);
        }
    };


    const handleSaveNewFile = async () => {
        if (!user) {
            showAlert('Please login to save your code', 'info');
            setTimeout(() => {
                navigate('/login', { state: { from: location.pathname, showSaveDialog: true } });
            }, 1500);
            return;
        }

        if (!fileName.trim()) {
            showAlert('Please enter a file name', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const exists = await checkFileNameExists(fileName);
            if (exists) {
                setIsFileNameExists(true);
                showAlert('File name already exists', 'warning');
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
            showAlert('Code saved successfully', 'success');

            // Clear the editor after successful save when coming from new file
            if (ClearEditor) {
                clearEditor();
                setClearEditor(false);
                setShowNewFileDialog(false);
            }

            localStorage.removeItem('unsavedCode');
            await fetchSavedPrograms();
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };


    const handleSaveAndNew = async () => {


        if (!user) {
            showAlert('Please login to save your code', 'info');
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
                showAlert('Code updated successfully', 'success');
            } else {
                setShowNewFileDialog(false);
                setClearEditor(true);
                setShowSaveDialog(true); // Show save dialog for new file
            }
        } catch (error) {
            showAlert(error.message, 'error');
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
                showAlert('File deleted successfully', 'success');
                await fetchSavedPrograms();
            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };


    const handleNewFile = () => {
        if (!user && code.trim()) {
            setShowNewFileDialog(true);
            setRedirectAfterLogin(true); // Handle login redirection
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
            showAlert('Error checking file name', 'error');
            return false;
        }
    };

    const showAlert = (message, type = 'info') => {
        const id = generateUUID();
        setAlerts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 3000);
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
            showAlert('Please enter some code to execute', 'error');
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
            showAlert('Code execution started successfully', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
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
            showAlert('Execution stopped successfully', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Saved Programs</h2>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                    >

                    </button>
                </div>
                <div className="overflow-y-auto h-full pb-16">
                    {user ? (
                        savedPrograms.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">
                                No files saved yet
                            </div>
                        ) : (
                            savedPrograms.map((program) => (
                                <div
                                    key={program._id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-100 border-b"
                                >
                                    <button
                                        onClick={() => handleLoadProgram(program._id)}
                                        className="flex items-center flex-1"
                                    >
                                        <FolderOpen className="h-4 w-4 mr-2" />
                                        <span className="truncate">{program.fileName}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProgram(program._id)}
                                        className="p-1 hover:text-red-600 ml-2"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )
                    ) : (
                        <div className="p-4 text-sm text-gray-500">
                            Please login to view saved programs
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="fixed top-4 right-4 z-50 space-y-2">
                        {alerts.map(alert => (
                            <Alert
                                key={alert.id}
                                message={alert.message}
                                type={alert.type}
                                onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">

                                <CustomButton
                                    variant="outline"
                                    onClick={handleNewFile}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    New File
                                </CustomButton>

                                <CustomButton
                                    variant="primary"
                                    onClick={handleRunCode}
                                    disabled={isRunning || !isConnected}
                                >
                                    {isRunning ? (
                                        <Square className="h-4 w-4 mr-1" />
                                    ) : (
                                        <Play className="h-4 w-4 mr-1" />
                                    )}
                                    {isRunning ? 'Running' : 'Run'}
                                </CustomButton>

                                {isRunning && (
                                    <CustomButton
                                        variant="danger"
                                        onClick={handleStopCode}
                                    >
                                        <StopCircle className="h-4 w-4 mr-1" />
                                        Stop
                                    </CustomButton>
                                )}

                                <CustomButton
                                    variant="primary"
                                    onClick={handleSaveCode}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <Loader />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1" />
                                    )}
                                    {currentFileId ? 'Update' : 'Save'}
                                </CustomButton>
                            </div>
                            <div className="flex items-center space-x-4">
                                {/* Add file name display */}
                                <span className="text-sm font-medium text-gray-600">
                                    {displayFileName}
                                    {!isFileSaved && ' •'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="block w-40 rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="cpp">C++</option>
                                    <option value="java">Java</option>
                                </select>
                                <div className="flex items-center space-x-2">
                                    <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-sm text-gray-600">
                                        {isConnected ? 'Connected' : 'Reconnecting...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Editor
                            height="400px"
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
                            }}
                        />

                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Terminal</label>
                            <div
                                ref={terminalRef}
                                className="relative h-64 bg-gray-900 rounded border border-gray-700"
                            >
                                <pre className="h-full p-4 text-white font-mono text-sm overflow-auto">
                                    {terminal}
                                    {isRunning && (
                                        <div className="flex items-center">
                                            <span className="text-green-500">{'>'}</span>
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
                                                className="flex-1 ml-2 bg-transparent text-white font-mono text-sm focus:outline-none"
                                                placeholder="Type input and press Enter..."
                                            />
                                        </div>
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <CustomDialog
                        isOpen={showSaveDialog}
                        onClose={() => {
                            setShowSaveDialog(false);
                            setFileName('');
                            setIsFileNameExists(false);
                        }}
                        title="Save Program"
                    >
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
                                    File Name
                                </label>
                                <input
                                    id="fileName"
                                    type="text"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isFileNameExists ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter file name"
                                    value={fileName}
                                    onChange={handleFileNameChange}
                                    disabled={isSaving}
                                />
                                {isFileNameExists && (
                                    <p className="mt-1 text-sm text-red-600">
                                        This file name already exists. Please choose a different name.
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-2">
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
                                >
                                    {isSaving ? <Loader /> : 'Save'}
                                </CustomButton>
                            </div>
                        </div>
                    </CustomDialog>
                    <CustomDialog
                        isOpen={showNewFileDialog}
                        onClose={() => setShowNewFileDialog(false)}
                        title="Create New File"
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                You have unsaved changes. Would you like to save them before creating a new file?
                            </p>
                            <div className="flex justify-end space-x-2">
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
                                        <Loader />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1" />
                                    )}
                                    {currentFileId ? 'Update & Create New' : 'Save & Create New'}
                                </CustomButton>
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

                        fileName={programToDelete?.fileName || ''}
                    />

                </div>
            </div>
        </div>
    );
};

export default CodeEditor;