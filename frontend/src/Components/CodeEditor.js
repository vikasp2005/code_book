import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

const CodeExecutor = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const { toast } = useToast();

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('');
        try {
            const response = await fetch('http://localhost:5000/api/code/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    language,
                    input,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.output || 'Error during execution');
            }
            setOutput(data.output);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Execution Failed",
                description: error.message,
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <Editor
                height="300px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
            />
            <textarea
                placeholder="Enter input here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-20 p-2 border border-gray-300 rounded"
            />
            <textarea
                readOnly
                value={output}
                className="w-full h-40 p-2 border border-gray-300 rounded bg-gray-900 text-white"
            />
            <Button onClick={handleRunCode} disabled={isRunning}>
                {isRunning ? 'Running...' : 'Run Code'}
            </Button>
        </div>
    );
};

export default CodeExecutor;
