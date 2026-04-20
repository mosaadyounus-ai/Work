/**
 * Codex Context
 *
 * React context for managing OMEGA Lattice state and real-time communication
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  OperatorConsoleState,
  MarketSignal,
  CodexState,
  CycleRecord,
  SignalAlignment,
  TelemetrySnapshot,
} from '../../../../packages/codex/types';

const defaultCodexState: CodexState = {
  currentPlate: 'I',
  cycleId: '',
  cycleStartTime: new Date(0),
  totalCycles: 0,
  fallbackMode: false,
  locked: false,
  metadata: {
    invariantsViolated: 0,
    transitionsCorrect: 0,
    transitionsTotal: 0,
    infinityReturns: 0,
  },
};

const defaultConsoleState: OperatorConsoleState = {
  codexState: defaultCodexState,
  currentCycle: {
    cycleId: '',
    startTime: new Date(0),
    endTime: new Date(0),
    durationMs: 0,
    startingPlate: 'I',
    path: ['I'],
    plates: [],
    returnedToInfinity: false,
    fallbackActivated: false,
    totalSteps: 0,
    status: 'interrupted',
  },
  recentCycles: [],
  recentSignals: [],
  telemetry: {
    timestamp: new Date(0),
    currentPlate: 'I',
    cycleCount: 0,
    signalArrivalRate: 0,
    plateDistribution: {
      I: 0,
      II: 0,
      III: 0,
      IV: 0,
      V: 0,
      VI: 0,
      VII: 0,
      VIII: 0,
      IX: 0,
      '∞': 0,
    },
    operatorInvocations: {
      op_generate: 0,
      op_structure: 0,
      op_scale: 0,
      op_disturb: 0,
      op_order: 0,
      op_merge: 0,
      op_invoke: 0,
      op_cycle: 0,
      op_resolve: 0,
    },
    fallbackActivations: 0,
    fallbackPercentage: 0,
    meanCycleLatency: 0,
    transitionCorrectness: 0,
    infinityReturnRate: 0,
  },
  commands: [],
};

interface CodexContextType {
  state: OperatorConsoleState;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendCommand: (commandType: string, payload?: any) => Promise<any>;
  injectSignal: (signal: MarketSignal) => Promise<any>;
}

const CodexContext = createContext<CodexContextType | null>(null);

export const useCodex = () => {
  const context = useContext(CodexContext);
  if (!context) {
    throw new Error('useCodex must be used within a CodexProvider');
  }
  return context;
};

interface CodexProviderProps {
  children: React.ReactNode;
}

export const CodexProvider: React.FC<CodexProviderProps> = ({ children }) => {
  const [state, setState] = useState<OperatorConsoleState>(defaultConsoleState);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch initial lab data
  const fetchInitialData = useCallback(async () => {
    try {
      const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalDevelopment ? `${window.location.protocol}//localhost:3001` : '';

      const [annotationsRes, eventsRes] = await Promise.all([
        fetch(`${baseUrl}/api/codex/annotations`),
        fetch(`${baseUrl}/api/codex/guardrails/events`)
      ]);

      if (!annotationsRes.ok) {
        throw new Error(`[CODEX_FETCH_ERR] Failed to fetch annotations: ${annotationsRes.status}`);
      }
      if (!eventsRes.ok) {
        throw new Error(`[CODEX_FETCH_ERR] Failed to fetch events: ${eventsRes.status}`);
      }

      const annotations = await annotationsRes.json();
      const events = await eventsRes.json();

      // Initialize state with fetched data
      setState((prev) => ({
        ...prev,
        recentSignals: annotations.annotations || [],
        commands: events.events || [],
      }));

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch initial data');
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws) return;

    const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocalDevelopment
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:3001`
      : window.location.href.replace(/^http/, 'ws');

    console.log(`[CODEX_WS_CONNECTING] ${wsUrl}`);

    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      console.log('[CODEX_WS_CONNECTED]');
      setIsConnected(true);
      setError(null);

      // Subscribe to console updates
      newWs.send(JSON.stringify({
        type: 'subscribe',
        channel: 'console'
      }));
    };

    newWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'console-state' || message.type === 'console-telemetry') {
          // Map server state to client state
          setState(message.data);
        }
      } catch (err) {
        console.error('[CODEX_WS_MESSAGE_ERR] Failed to parse message:', err);
        setError('Failed to parse WebSocket message');
      }
    };

    newWs.onclose = () => {
      console.log('[CODEX_WS_DISCONNECTED]');
      setIsConnected(false);
      setWs(null);
    };

    newWs.onerror = (err) => {
      console.error('[CODEX_WS_ERROR]', err);
      setError('WebSocket connection error');
    };

    setWs(newWs);
  }, [ws]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  const sendCommand = useCallback(async (commandType: string, payload?: any) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const requestId = Math.random().toString(36).substr(2, 9);

    ws.send(JSON.stringify({
      type: 'console-command',
      commandType,
      payload,
      requestId
    }));

    // Wait for response (simplified - in real app, use promises with requestId)
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'console-command-result' && message.requestId === requestId) {
            ws.removeEventListener('message', handler);
            if (message.success) {
              resolve(message.result);
            } else {
              reject(new Error(message.error || 'Command failed'));
            }
          }
        } catch (err) {
          reject(err);
        }
      };

      ws.addEventListener('message', handler);

      // Timeout after 10 seconds
      setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error('Command timeout'));
      }, 10000);
    });
  }, [ws]);

  const injectSignal = useCallback(async (signal: MarketSignal) => {
    return sendCommand('inject_signal', signal);
  }, [sendCommand]);

  // Initialize on mount
  useEffect(() => {
    fetchInitialData();
    connect();

    return () => {
      disconnect();
    };
  }, [fetchInitialData, connect, disconnect]);

  const value: CodexContextType = {
    state,
    isConnected,
    error,
    connect,
    disconnect,
    sendCommand,
    injectSignal
  };

  return (
    <CodexContext.Provider value={value}>
      {children}
    </CodexContext.Provider>
  );
};