import express from 'express';

import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { connectDB } from './DB/connectDB.js';
import { ConfigureSession } from './utils/ConfigureSession.js';
import { performCleanup } from './utils/ClearExpired.js';
import AuthRouter from './Routers/Auth.Router.js';


dotenv.config();

const app = express();


// Middleware
app.use(morgan("dev"));
app.use(cors({

    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'client-ID'], // Added client-ID
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database & Session Setup
//connectDB();
//ConfigureSession(app);





const httpServer = createServer(app);
const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws'  // Specify WebSocket path
});

// Initialize Maps for tracking
const runningProcesses = new Map();
const wsClients = new Map();  // Store WebSocket clients

// Configuration
const EXECUTION_TIMEOUT = 30000;
const ALLOWED_LANGUAGES = ['python', 'javascript', 'cpp', 'java'];

app.use(morgan("dev"));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Client-ID'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const clientId = new URL(req.url, 'http://localhost').searchParams.get('clientId');

    if (!clientId) {
        ws.close();
        return;
    }

    // Store the WebSocket connection
    wsClients.set(clientId, ws);
    console.log(`Client connected with ID: ${clientId}`);

    // Send initial connection message
    ws.send(JSON.stringify({
        type: 'system',
        data: 'Connected to server\n'
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'input') {
                const process = runningProcesses.get(clientId);
                if (process && process.stdin) {
                    process.stdin.write(data.input + '\n');
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        const process = runningProcesses.get(clientId);
        if (process) {
            process.kill();
            runningProcesses.delete(clientId);
        }
        wsClients.delete(clientId);
    });
});

const executeCode = async (req, res) => {
    const { code, language } = req.body;
    const clientId = req.headers['client-id'];

    // Get WebSocket connection for this client
    const ws = wsClients.get(clientId);
    if (!ws) {
        return res.status(400).json({
            error: 'No WebSocket connection found. Please refresh the page.'
        });
    }

    if (!ALLOWED_LANGUAGES.includes(language)) {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    const tempDir = path.join(process.cwd(), 'temp', clientId);
    await fs.mkdir(tempDir, { recursive: true });
    const fileName = `temp_${Date.now()}`;
    let processInstance;

    try {
        switch (language) {
            case 'python':
                await fs.writeFile(`${tempDir}/${fileName}.py`, code);
                processInstance = spawn('python3', [`${tempDir}/${fileName}.py`], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;

            case 'javascript':
                processInstance = spawn('node', ['-e', code], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;

            case 'cpp':
                await fs.writeFile(`${tempDir}/${fileName}.cpp`, code);
                await new Promise((resolve, reject) => {
                    const compile = spawn('g++', [`${tempDir}/${fileName}.cpp`, '-o', `${tempDir}/${fileName}`]);
                    compile.on('close', (code) => code === 0 ? resolve() : reject());
                });
                processInstance = spawn(`${tempDir}/${fileName}`, {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;

            case 'java':
                // Extract the public class name from the code
                const classMatch = code.match(/class\s+(\w+)/);
                if (!classMatch) {
                    throw new Error('No public class found in Java code');
                }

                const className = classMatch[1];

                // Write the Java file with the correct name
                await fs.writeFile(`${tempDir}/${className}.java`, code);

                // Compile the Java file
                const compileProcess = spawn('javac', [`${className}.java`], {
                    cwd: tempDir
                });

                await new Promise((resolve, reject) => {
                    compileProcess.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error('Compilation failed'));
                        }
                    });

                    compileProcess.stderr.on('data', (data) => {
                        ws.send(JSON.stringify({
                            type: 'error',
                            data: data.toString()
                        }));
                    });
                });

                // Run the compiled Java class
                processInstance = spawn('java', [className], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;
        }

        runningProcesses.set(clientId, processInstance);

        processInstance.stdout.on('data', (data) => {
            ws.send(JSON.stringify({
                type: 'output',
                data: data.toString()
            }));
        });

        processInstance.stderr.on('data', (data) => {
            ws.send(JSON.stringify({
                type: 'error',
                data: data.toString()
            }));
        });

        processInstance.on('close', async (code) => {
            runningProcesses.delete(clientId);

            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch (err) {
                console.error('Error cleaning up:', err);
            }

            ws.send(JSON.stringify({
                type: 'system',
                data: `\nProcess exited with code ${code}\n`
            }));
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Execution error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            data: error.message
        }));
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (err) {
            console.error('Error cleaning up:', err);
        }
        res.status(500).json({ error: 'Error during code execution' });
    }
};

app.post('/api/code/execute', executeCode);

// Add this route handler
app.post('/api/code/stop', (req, res) => {
    const clientId = req.headers['client-id'];

    // Get the process for this client
    const process = runningProcesses.get(clientId);
    const ws = wsClients.get(clientId);

    if (!process) {
        return res.status(404).json({ error: 'No running process found' });
    }

    try {
        // Kill the process
        process.kill();
        runningProcesses.delete(clientId);

        // Send termination message through WebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'system',
                data: '\nProcess terminated by user\n'
            }));
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error stopping process:', error);
        res.status(500).json({ error: 'Failed to stop process' });
    }
});





// Routes
app.get("/", (req, res) => {
    res.end("welcome");
});

app.use('/api/auth', AuthRouter);


const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Update the graceful shutdown handler to include the new WebSocket messaging
const gracefulShutdown = async () => {
    console.log('Received shutdown signal. Starting cleanup...');
    try {
        await performCleanup();
        // Clean up running processes and notify clients
        for (const [clientId, process] of runningProcesses.entries()) {
            process.kill();
            const ws = wsClients.get(clientId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'system',
                    data: '\nServer shutting down. Process terminated.\n'
                }));
            }
        }
        runningProcesses.clear();

        // Close all WebSocket connections
        for (const ws of wsClients.values()) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
        wsClients.clear();

        httpServer.close(() => {
            console.log('Server shut down successfully');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

