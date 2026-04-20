"use strict";
/**
 * Operator Console WebSocket Handlers
 *
 * Server-side handlers for console commands and state broadcasting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleServerManager = void 0;
exports.getConsoleManager = getConsoleManager;
exports.handleConsoleMessage = handleConsoleMessage;
const ws_1 = require("ws");
const codex_1 = require("@omega-lattice/codex");
/**
 * Console Server Manager
 *
 * Manages a single Operator Console instance and handles WS connections
 */
class ConsoleServerManager {
    constructor() {
        this.subscribers = new Set();
        this.broadcastInterval = null;
        this.broadcastIntervalMs = 500; // broadcast every 500ms
        this.console = (0, codex_1.createOperatorConsole)();
        this.startBroadcast();
        // Subscribe to console state changes
        this.console.subscribe((state) => {
            this.broadcast({
                type: 'console-state',
                data: state,
                timestamp: new Date().toISOString(),
            });
        });
    }
    /**
     * Add a subscriber (WS client)
     */
    subscribe(ws) {
        this.subscribers.add(ws);
        // Send initial state
        const state = this.console.getState();
        ws.send(JSON.stringify({
            type: 'console-state',
            data: state,
            timestamp: new Date().toISOString(),
        }));
        ws.on('close', () => {
            this.subscribers.delete(ws);
        });
        ws.on('error', (error) => {
            console.error('WS error in console subscriber:', error);
            this.subscribers.delete(ws);
        });
    }
    /**
     * Broadcast state to all subscribers
     */
    broadcast(message) {
        const payload = JSON.stringify(message);
        this.subscribers.forEach((ws) => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(payload);
            }
            else {
                this.subscribers.delete(ws);
            }
        });
    }
    /**
     * Start periodic broadcast of telemetry
     */
    startBroadcast() {
        this.broadcastInterval = setInterval(() => {
            const state = this.console.getState();
            this.broadcast({
                type: 'console-telemetry',
                data: state.telemetry,
                timestamp: new Date().toISOString(),
            });
        }, this.broadcastIntervalMs);
    }
    /**
     * Stop periodic broadcast
     */
    stopBroadcast() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
        }
    }
    /**
     * Process an incoming console command
     */
    async handleCommand(commandType, payload) {
        switch (commandType) {
            case 'step':
                return await this.console.step(payload?.signal);
            case 'cycle':
                const maxSteps = payload?.maxSteps ?? 10;
                return await this.console.runCycle(maxSteps);
            case 'inject_signal':
                return await this.console.injectSignal(payload);
            case 'toggle_fallback':
                return this.console.toggleFallback(payload?.active ?? false, payload?.reason);
            case 'reset':
                this.console.reset();
                return { success: true, message: 'Console reset' };
            case 'get_state':
                return this.console.getState();
            case 'verify_invariants':
                return this.console.verifyInvariants();
            default:
                throw new Error(`Unknown command: ${commandType}`);
        }
    }
    /**
     * Process a market signal
     */
    async processSignal(signal) {
        await this.console.processSignal(signal);
    }
    /**
     * Get current console state
     */
    getState() {
        return this.console.getState();
    }
    /**
     * Cleanup
     */
    destroy() {
        this.stopBroadcast();
        this.subscribers.clear();
    }
}
exports.ConsoleServerManager = ConsoleServerManager;
/**
 * Create a global console manager (singleton pattern)
 */
let consoleManager = null;
function getConsoleManager() {
    if (!consoleManager) {
        consoleManager = new ConsoleServerManager();
    }
    return consoleManager;
}
/**
 * Handle WebSocket message from console client
 */
function handleConsoleMessage(manager, ws, message) {
    try {
        if (message.type === 'subscribe') {
            if (message.channel === 'console') {
                manager.subscribe(ws);
            }
        }
        else if (message.type === 'console-command') {
            manager
                .handleCommand(message.commandType, message.payload)
                .then((result) => {
                ws.send(JSON.stringify({
                    type: 'console-command-result',
                    requestId: message.requestId,
                    success: true,
                    result,
                    timestamp: new Date().toISOString(),
                }));
            })
                .catch((error) => {
                ws.send(JSON.stringify({
                    type: 'console-command-result',
                    requestId: message.requestId,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                }));
            });
        }
    }
    catch (error) {
        console.error('Error handling console message:', error);
        ws.send(JSON.stringify({
            type: 'error',
            error: String(error),
            timestamp: new Date().toISOString(),
        }));
    }
}
