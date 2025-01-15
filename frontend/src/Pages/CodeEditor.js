import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Play, StopCircle, Square, Save } from "lucide-react";
import Alert from '../Components/Alert';
import axios from 'axios';


// Add UUID generator function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};

const CodeExecutor = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [terminal, setTerminal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [alerts, setAlerts] = useState([]);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);
    const clientId = useRef(generateUUID());

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

            ws.onerror = (error) => {
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


    const handleSaveCode = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/managecode/save', {
                code,
                language,
                fileName: "p1",
            }, { withCredentials: true });
            showAlert('Code saved successfully', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
            setIsRunning(false);
            setTerminal(prev => prev + `Error: ${error.message}\n`);
        }

    };

    const showAlert = (message, type) => {
        const id = crypto.randomUUID();
        setAlerts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 3000);
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
                body: JSON.stringify({
                    code,
                    language
                }),
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
        <div className="min-h-screen bg-gray-50">


            <div className="fixed top-4 right-4 z-50 space-y-2">
                {alerts.map(alert => (
                    <Alert
                        key={alert.id}
                        message={alert.message}
                        type={alert.type}
                        onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        className="w-72"
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleRunCode}
                                disabled={isRunning || !isConnected}
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded ${isRunning || !isConnected
                                    ? 'bg-gray-300 text-gray-500'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isRunning ? (
                                    <Square className="h-4 w-4 mr-1" />
                                ) : (
                                    <Play className="h-4 w-4 mr-1" />
                                )}
                                {isRunning ? 'Running' : 'Run'}
                            </button>
                            {isRunning && (
                                <button
                                    onClick={handleStopCode}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                                >
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    Stop
                                </button>
                            )}
                            <button
                                onClick={handleSaveCode}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                            >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                            </button>
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
            </div>
        </div>
    );
};

export default CodeExecutor;