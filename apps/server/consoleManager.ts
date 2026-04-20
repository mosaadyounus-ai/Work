/**
 * Operator Console WebSocket Handlers
 *
 * Server-side handlers for console commands and state broadcasting
 */

import { WebSocket } from 'ws';
import { OperatorConsole, createOperatorConsole } from '@omega-lattice/codex';
import type {
  ConsoleCommand,
  MarketSignal,
  OperatorConsoleState,
} from '@omega-lattice/codex';

/**
 * Console Server Manager
 *
 * Manages a single Operator Console instance and handles WS connections
 */
export class ConsoleServerManager {
  private console: OperatorConsole;
  private subscribers: Set<WebSocket> = new Set();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private broadcastIntervalMs = 500; // broadcast every 500ms

  constructor() {
    this.console = createOperatorConsole();
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
  subscribe(ws: WebSocket): void {
    this.subscribers.add(ws);

    // Send initial state
    const state = this.console.getState();
    ws.send(
      JSON.stringify({
        type: 'console-state',
        data: state,
        timestamp: new Date().toISOString(),
      })
    );

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
  private broadcast(message: any): void {
    const payload = JSON.stringify(message);
    this.subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      } else {
        this.subscribers.delete(ws);
      }
    });
  }

  /**
   * Start periodic broadcast of telemetry
   */
  private startBroadcast(): void {
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
  stopBroadcast(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  /**
   * Process an incoming console command
   */
  async handleCommand(
    commandType: string,
    payload?: any
  ): Promise<any> {
    switch (commandType) {
      case 'step':
        return await this.console.step(payload?.signal);

      case 'cycle':
        const maxSteps = payload?.maxSteps ?? 10;
        return await this.console.runCycle(maxSteps);

      case 'inject_signal':
        return await this.console.injectSignal(payload as MarketSignal);

      case 'toggle_fallback':
        return this.console.toggleFallback(
          payload?.active ?? false,
          payload?.reason
        );

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
  async processSignal(signal: MarketSignal): Promise<void> {
    await this.console.processSignal(signal);
  }

  /**
   * Get current console state
   */
  getState(): OperatorConsoleState {
    return this.console.getState();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopBroadcast();
    this.subscribers.clear();
  }
}

/**
 * Create a global console manager (singleton pattern)
 */
let consoleManager: ConsoleServerManager | null = null;

export function getConsoleManager(): ConsoleServerManager {
  if (!consoleManager) {
    consoleManager = new ConsoleServerManager();
  }
  return consoleManager;
}

/**
 * Handle WebSocket message from console client
 */
export function handleConsoleMessage(
  manager: ConsoleServerManager,
  ws: WebSocket,
  message: any
): void {
  try {
    if (message.type === 'subscribe') {
      if (message.channel === 'console') {
        manager.subscribe(ws);
      }
    } else if (message.type === 'console-command') {
      manager
        .handleCommand(message.commandType, message.payload)
        .then((result) => {
          ws.send(
            JSON.stringify({
              type: 'console-command-result',
              requestId: message.requestId,
              success: true,
              result,
              timestamp: new Date().toISOString(),
            })
          );
        })
        .catch((error) => {
          ws.send(
            JSON.stringify({
              type: 'console-command-result',
              requestId: message.requestId,
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            })
          );
        });
    }
  } catch (error) {
    console.error('Error handling console message:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        error: String(error),
        timestamp: new Date().toISOString(),
      })
    );
  }
}
