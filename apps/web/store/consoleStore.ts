/**
 * Operator Console State Store (Zustand)
 *
 * Client-side state management for the Operator Console
 */

'use client';

import { create } from 'zustand';
import type { OperatorConsoleState } from '@omega-lattice/codex';

interface ConsoleStore {
  state: OperatorConsoleState | null;
  connected: boolean;
  loading: boolean;
  error: string | null;

  setState: (s: OperatorConsoleState) => void;
  setConnected: (c: boolean) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

const initialState: OperatorConsoleState = {
  codexState: {
    currentPlate: 'I',
    cycleId: 'cycle-init',
    cycleStartTime: new Date(),
    totalCycles: 0,
    fallbackMode: false,
    locked: true,
    metadata: {
      invariantsViolated: 0,
      transitionsCorrect: 0,
      transitionsTotal: 0,
      infinityReturns: 0,
    },
  },
  currentCycle: null as any,
  recentCycles: [],
  recentSignals: [],
  telemetry: {
    timestamp: new Date(),
    currentPlate: 'I',
    cycleCount: 0,
    signalArrivalRate: 0,
    plateDistribution: {},
    operatorInvocations: {},
    fallbackActivations: 0,
    fallbackPercentage: 0,
    meanCycleLatency: 0,
    transitionCorrectness: 1.0,
    infinityReturnRate: 0,
  },
  commands: [],
};

export const useConsoleStore = create<ConsoleStore>((set) => ({
  state: initialState,
  connected: false,
  loading: false,
  error: null,

  setState: (s: OperatorConsoleState) => set({ state: s }),
  setConnected: (c: boolean) => set({ connected: c }),
  setLoading: (l: boolean) => set({ loading: l }),
  setError: (e: string | null) => set({ error: e }),
  reset: () =>
    set({
      state: initialState,
      connected: false,
      loading: false,
      error: null,
    }),
}));

/**
 * WebSocket connection management for console
 */
export function useConsoleWS(wsUrl: string) {
  const { setState, setConnected, setError } = useConsoleStore();
  const [ws, setWs] = React.useState<WebSocket | null>(null);

  React.useEffect(() => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
      setError(null);
      socket.send(JSON.stringify({ type: 'subscribe', channel: 'console' }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'console-state') {
          setState(message.data);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };

    socket.onclose = () => {
      setConnected(false);
    };

    setWs(socket);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [wsUrl, setState, setConnected, setError]);

  const sendCommand = (commandType: string, payload?: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'console-command',
          commandType,
          payload,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  return { sendCommand };
}

// Import React for the hook
import React from 'react';
