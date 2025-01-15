import express from 'express';
import { executeCode } from '../utils/ExecuteCode.js';
import { runningProcesses, wsClients } from '../utils/ExecuteCode.js';

const Router = express.Router();


Router.post('/execute', executeCode);

Router.post('/stop', (req, res) => {
    const clientId = req.headers['client-id'];
    const process = runningProcesses.get(clientId);
    const ws = wsClients.get(clientId);

    if (!process) {
        return res.status(404).json({ error: 'No running process found' });
    }

    try {
        process.kill();
        runningProcesses.delete(clientId);

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

export default Router;