import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Square, Play, StopCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

const CodeExecutor = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [terminal, setTerminal] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const { toast } = useToast();
    const wsRef = useRef(null);
    const terminalRef = useRef(null);
    const clientId = useRef(crypto.randomUUID());

    useEffect(() => {
        const connectWebSocket = () => {
            const ws = new WebSocket(`ws://localhost:5000/ws?clientId=${clientId.current}`);

            ws.onopen = () => {
                setIsConnected(true);
                console.log('WebSocket Connected with ID:', clientId.current);
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
                console.error('WebSocket error:', error);
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

    const handleRunCode = async () => {
        if (!code.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter some code to execute",
            });
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
                setIsRunning(false);
                throw new Error(data.error || 'Error during execution');
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Execution Failed",
                description: error.message,
            });
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
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Stop Failed",
                description: error.message,
            });
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
        <div className="flex flex-col space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={handleRunCode}
                        disabled={isRunning || !isConnected}
                        variant="default"
                        size="sm"
                        className="w-20"
                    >
                        {isRunning ? (
                            <Square className="h-4 w-4 mr-1" />
                        ) : (
                            <Play className="h-4 w-4 mr-1" />
                        )}
                        {isRunning ? 'Running' : 'Run'}
                    </Button>
                    {isRunning && (
                        <Button
                            onClick={handleStopCode}
                            variant="destructive"
                            size="sm"
                            className="w-20"
                        >
                            <StopCircle className="h-4 w-4 mr-1" />
                            Stop
                        </Button>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800">
                            <SelectItem value="python" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Python</SelectItem>
                            <SelectItem value="javascript" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">JavaScript</SelectItem>
                            <SelectItem value="cpp" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">C++</SelectItem>
                            <SelectItem value="java" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Java</SelectItem>
                        </SelectContent>
                    </Select>
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
                <label className="text-sm font-medium">Terminal</label>
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
    );
};

export default CodeExecutor;