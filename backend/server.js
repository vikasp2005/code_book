import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { connectDB } from './DB/connectDB.js';
import { ConfigureSession } from './Middleware/ConfigureSession.js';
import { performCleanup, initializeCleanupTasks } from './Middleware/ClearExpired.js';
import AuthRouter from './Routers/Auth.Router.js';
import CodeRoute from './Routers/Code.Router.js';
import NoteBookRouter from './Routers/NoteBook.Router.js';
import ManageCodeRoute from './Routers/ManageCode.Router.js';
import WebSocketConnection from './utils/WebSocketConnection.js';
import { initializeEmailConfig } from './Middleware/EmailConfiguration.js';
import { runningProcesses, wsClients } from './utils/ExecuteCode.js'
import { ALL } from 'dns';

dotenv.config({ path: '../.env' });

const app = express();




// Middleware
app.use(morgan("dev"));
const corsOptions = {
    origin: ALL, // Replace with your frontend's URL
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());






// Database & Session Setup
connectDB();
ConfigureSession(app);
initializeCleanupTasks();
initializeEmailConfig();

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

WebSocketConnection(wss);





app.get("/", (req, res) => {
    res.end("welcome");
});

app.use('/api/auth', AuthRouter);

app.use('/api/code', CodeRoute);

app.use('/api/managecode', ManageCodeRoute);

app.use('/api/notebook', NoteBookRouter);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const gracefulShutdown = async () => {
    console.log('Received shutdown signal. Starting cleanup...');
    try {
        await performCleanup();

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