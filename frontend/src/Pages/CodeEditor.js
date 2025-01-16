import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Play, StopCircle, Square, Save, Menu, X, FolderOpen } from "lucide-react";
import Alert from '../Components/Alert';
import axios from 'axios';

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

// Custom Button Component
const CustomButton = ({ children, variant = 'primary', className = '', ...props }) => {
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

const CodeEditor = ({ isAuthenticated }) => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [terminal, setTerminal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [alerts, setAlerts] = useState([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [fileName, setFileName] = useState('');
    const [currentFileId, setCurrentFileId] = useState(null);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);
    const clientId = useRef(generateUUID());

    useEffect(() => {
        const handleProgramLoad = (event) => {
            const { code, language } = event.detail;
            setCode(code);
            setLanguage(language);
            setCurrentFileId(event.detail._id);
        };

        window.addEventListener('load-program', handleProgramLoad);
        return () => window.removeEventListener('load-program', handleProgramLoad);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

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
    }, [isAuthenticated]);

    const showAlert = (message, type) => {
        const id = crypto.randomUUID();
        setAlerts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 3000);
    };

    const handleSaveCode = async () => {
        if (!isAuthenticated) {
            showAlert('Please log in to save your code', 'error');
            return;
        }

        if (!currentFileId) {
            setShowSaveDialog(true);
            return;
        }

        try {
            await axios.put(`http://localhost:5000/api/managecode/update/${currentFileId}`, {
                code,
                language,
            }, { withCredentials: true });
            showAlert('Code updated successfully', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    const handleSaveNewFile = async () => {
        if (!fileName.trim()) {
            showAlert('Please enter a file name', 'error');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/managecode/save', {
                fileName,
                code,
                language,
            }, { withCredentials: true });

            setCurrentFileId(response.data.id);
            setShowSaveDialog(false);
            setFileName('');
            showAlert('Code saved successfully', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
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

    const handleKeyPress = (e) => {
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
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {alerts.map(alert => (
                    <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                        {alert.message}
                    </Alert>
                ))}
            </div>

            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
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
                        >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </CustomButton>
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
                    onChange={(value) => setCode(value || '')}
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
                                        onKeyPress={handleKeyPress}
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
                onClose={() => setShowSaveDialog(false)}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter file name"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <CustomButton
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                        >
                            Cancel
                        </CustomButton>
                        <CustomButton
                            variant="primary"
                            onClick={handleSaveNewFile}
                        >
                            Save
                        </CustomButton>
                    </div>
                </div>
            </CustomDialog>
        </div>
    );
};

export default CodeEditor;