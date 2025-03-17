import { wsClients } from "./ExecuteCode.js";
import { runningProcesses } from "./ExecuteCode.js";

const WebSocketConnection = (wss) => {
    wss.on('connection', (ws, req) => {
        const clientId = new URL(req.url, 'http://localhost').searchParams.get('clientId');

        if (!clientId) {
            console.error('Client ID is missing');
            ws.close(4001, 'Client ID is required');
            return;
        }

        console.log(`Client connected with ID: ${clientId}`);
        wsClients.set(clientId, ws);

        ws.send(JSON.stringify({
            type: 'system',
            data: 'Connected to server\n'
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'input') {
                    const cellId = data.clientId || clientId;
                    const process = runningProcesses.get(cellId);
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

        ws.on('error', (error) => {
            console.error(`WebSocket error for client ${clientId}:`, error);
        });
    });
};

export default WebSocketConnection;