import { wsClients } from "./ExecuteCode.js";
import { runningProcesses } from "./ExecuteCode.js";

const WebSocketConnection = (wss) => {

    // WebSocket connection handler
    wss.on('connection', (ws, req) => {
        const clientId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('clientId');

        if (!clientId) {
            ws.close();
            return;
        }

        wsClients.set(clientId, ws);
        console.log(`Client connected with ID: ${clientId}`);

        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

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
    });

    // Set up periodic pings to remove dead connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                console.log('Terminating inactive connection');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000); // Run every 30 seconds

}

export default WebSocketConnection;