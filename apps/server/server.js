"use strict";
/**
 * OMEGA Lattice Server
 *
 * HTTP API server for the Nexus Oracle OMEGA
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const ws_1 = require("ws");
const consoleManager_1 = require("./consoleManager");
const PORT = parseInt(process.env.PORT || '8080', 10);
const app = (0, express_1.default)();
const server = http.createServer(app);
const manager = new consoleManager_1.ConsoleServerManager();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        service: 'codex',
        ts: Date.now(),
        version: '1.0.0'
    });
});
app.get('/api/codex/annotations', (req, res) => {
    const state = manager.getState();
    res.json({ annotations: state.recentSignals, timestamp: new Date().toISOString() });
});
app.get('/api/codex/guardrails/events', (req, res) => {
    const state = manager.getState();
    res.json({ events: state.commands, timestamp: new Date().toISOString() });
});
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
const wss = new ws_1.WebSocketServer({ noServer: true });
wss.on('connection', (ws) => {
    console.log('[WS_CONNECTION] New client connected');
    ws.send(JSON.stringify({
        type: 'connected',
        ts: Date.now()
    }));
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('[WS_MESSAGE]', message);
            if (message.type === 'subscribe' && message.channel === 'console') {
                manager.subscribe(ws);
            }
            else if (message.type === 'console-command') {
                const result = await manager.handleCommand(message.commandType, message.payload);
                ws.send(JSON.stringify({
                    type: 'console-command-result',
                    requestId: message.requestId,
                    success: true,
                    result
                }));
            }
        }
        catch (error) {
            console.error('[WS_ERROR]', error);
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    });
    ws.on('close', () => {
        console.log('[WS_DISCONNECT] Client disconnected');
    });
    ws.on('error', (error) => {
        console.error('[WS_ERROR]', error);
    });
});
server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/' && req.url !== '/ws') {
        socket.destroy();
        return;
    }
    console.log('[WS_UPGRADE] incoming upgrade', req.url, 'httpVersion=', req.httpVersion);
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
    });
});
server.listen(PORT, () => {
    console.log('OMEGA Server running on port', PORT);
});
