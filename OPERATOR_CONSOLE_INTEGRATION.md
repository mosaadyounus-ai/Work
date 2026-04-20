# Operator Console Integration Guide

**Status:** Complete Implementation Scaffold  
**Version:** 1.0  
**Authority:** Nonogram Codex (sealed architecture)

---

## Overview

This guide integrates the Operator Console into the Omega Lattice monorepo. The console is the real-time, human-facing interface to the sealed Nonogram Codex engine.

All implementation files are in place. This document shows the wiring and deployment steps.

---

## Architecture

```
Market Ingestion Layer
        ↓
  Situational Plate Alignment
        ↓
  Operator Console (Server)
        ↓
  Nonogram Codex Engine
        ↓
  ∞ (Infinity Core)
        ↓
  WebSocket Broadcast
        ↓
  React UI (Client)
```

---

## Files Created

### Backend

| File | Purpose |
|------|---------|
| `packages/codex/types.ts` | Type definitions for Codex and Console |
| `packages/codex/engine.ts` | Sealed Nonogram Codex execution engine |
| `packages/codex/console.ts` | Console state management and command routing |
| `packages/codex/index.ts` | Package exports |
| `packages/codex/package.json` | Package metadata |
| `apps/server/consoleManager.ts` | Server-side console manager + WS handlers |

### Frontend

| File | Purpose |
|------|---------|
| `apps/web/components/OperatorConsole.tsx` | React component (all views) |
| `apps/web/store/consoleStore.ts` | Zustand store + WS hook |

### Documentation

| File | Purpose |
|------|---------|
| `OPERATOR_CONSOLE_SPEC.md` | Full specification |
| `OPERATOR_CONSOLE_INTEGRATION.md` | This file |

---

## Step 1: Update Root Dependencies

### Option A: Using pnpm (Recommended)

The `@omega-lattice/codex` package is a local workspace package. No additional install needed.

### Option B: Manual Setup

If not using workspace mode:

```bash
cd packages/codex
npm link

cd apps/server
npm link @omega-lattice/codex

cd apps/web
npm link @omega-lattice/codex
```

---

## Step 2: Integrate Console Manager into Server

Edit `apps/server/index.ts` (or your main server file):

```typescript
import { WebSocketServer } from 'ws';
import { getConsoleManager, handleConsoleMessage } from './consoleManager';

const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({ port: PORT });
const consoleManager = getConsoleManager();

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Route to console if console channel
      if (message.type === 'subscribe' && message.channel === 'console') {
        handleConsoleMessage(consoleManager, ws, message);
      }
      // Route to console if console command
      else if (message.type === 'console-command') {
        handleConsoleMessage(consoleManager, ws, message);
      }
      // ... existing lattice handlers ...
      else {
        // existing logic
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', error: String(error) }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);

// Cleanup on process exit
process.on('SIGINT', () => {
  consoleManager.destroy();
  console.log('Console manager destroyed');
  process.exit(0);
});
```

---

## Step 3: Add Console Route to Server (Optional REST API)

Create `apps/server/routes/console.ts`:

```typescript
import { Express, Request, Response } from 'express';
import { getConsoleManager } from '../consoleManager';

export function setupConsoleRoutes(app: Express): void {
  const manager = getConsoleManager();

  // Get current state
  app.get('/api/console/state', (req: Request, res: Response) => {
    try {
      const state = manager.getState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Execute command (POST)
  app.post('/api/console/command/:commandType', (req: Request, res: Response) => {
    try {
      const { commandType } = req.params;
      const payload = req.body;

      manager
        .handleCommand(commandType, payload)
        .then((result) => {
          res.json({ success: true, result });
        })
        .catch((error) => {
          res.status(400).json({ success: false, error: error.message });
        });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Verify invariants
  app.get('/api/console/verify', (req: Request, res: Response) => {
    try {
      const state = manager.getState();
      const invariants = {
        sealed: state.codexState.locked,
        transitionCorrectness: state.telemetry.transitionCorrectness,
        infinityReturnRate: state.telemetry.infinityReturnRate,
      };
      res.json(invariants);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
```

Then in your main server file:

```typescript
import { setupConsoleRoutes } from './routes/console';

const app = express();
app.use(express.json());

setupConsoleRoutes(app);

// ... rest of server setup
```

---

## Step 4: Integrate Console Component in Web App

Edit `apps/web/src/pages/index.tsx`:

```typescript
'use client';

import React, { useEffect } from 'react';
import { OperatorConsoleComponent } from '@/components/OperatorConsole';
import { useConsoleStore, useConsoleWS } from '@/store/consoleStore';

export default function Home() {
  const { state, connected, error } = useConsoleStore();
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  const { sendCommand } = useConsoleWS(wsUrl);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Omega Lattice Dashboard</h1>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!connected && <div style={{ color: 'orange' }}>Connecting...</div>}
      {connected && <div style={{ color: 'green' }}>✓ Connected</div>}

      {state && (
        <OperatorConsoleComponent
          state={state}
          onCommand={(cmd, payload) => {
            sendCommand(cmd, payload);
          }}
        />
      )}
    </div>
  );
}
```

---

## Step 5: Integrate with Market Ingestion Layer

When market signals come in, route them to the console:

```typescript
import { getConsoleManager } from './consoleManager';
import type { MarketSignal } from '@omega-lattice/codex';

async function processMarketData(data: any): Promise<void> {
  const consoleManager = getConsoleManager();

  const signal: MarketSignal = {
    id: `signal-${Date.now()}`,
    timestamp: new Date(),
    type: 'market',
    data: {
      momentum: calculateMomentum(data),
      volatility: calculateVolatility(data),
      price: data.price,
      volume: data.volume,
    },
    source: 'live',
    fallbackMode: false,
  };

  // Process through console (which routes to Codex)
  await consoleManager.processSignal(signal);
}
```

---

## Step 6: Lattice Sync (Optional)

To sync the Codex Plate to the 3D lattice visualization:

Edit `apps/web/components/Lattice3D.tsx`:

```typescript
import { useConsoleStore } from '@/store/consoleStore';

export function Lattice3D() {
  const { state } = useConsoleStore();
  const currentPlate = state?.codexState?.currentPlate;

  // Map Plate to node index
  const plateToNodeIndex: Record<string, number> = {
    'I': 0,
    'II': 1,
    'III': 2,
    'IV': 3,
    'V': 4,
    'VI': 5,
    'VII': 6,
    'VIII': 7,
    'IX': 8,
  };

  const highlightedNodeId = plateToNodeIndex[currentPlate || 'I'];

  return (
    <canvas
      ref={canvasRef}
      // ... render 3D lattice ...
      // Highlight node at index highlightedNodeId with special color
    />
  );
}
```

---

## Step 7: Testing the Integration

### Test 1: Manual Plate Stepping

```bash
# Terminal 1: Start server
cd apps/server
npm run dev

# Terminal 2: Start web
cd apps/web
npm run dev

# Browser: Open http://localhost:3000
# Click "Step" button - should see Plate change
```

### Test 2: Inject Signal

```bash
# In browser console or via API:
curl -X POST http://localhost:3000/api/console/command/inject_signal \
  -H "Content-Type: application/json" \
  -d '{
    "signal": {
      "id": "test-1",
      "timestamp": "'$(date -u +'%Y-%m-%dT%H:%M:%SZ')'",
      "type": "market",
      "data": { "momentum": 0.15, "volatility": 3.2 },
      "source": "live",
      "fallbackMode": false
    }
  }'
```

### Test 3: Run Full Cycle

```bash
# Click "Run Cycle" button in console
# Should show path: I → V → IX → ∞
```

### Test 4: Verify Invariants

```bash
curl http://localhost:3000/api/console/verify

# Expected response:
# {
#   "sealed": true,
#   "transitionCorrectness": 1.0,
#   "infinityReturnRate": 1.0
# }
```

---

## Environment Variables

### Client (apps/web)

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Server (apps/server)

```env
PORT=3001
NODE_ENV=development
```

---

## Deployment Checklist

- [ ] All package.json dependencies installed
- [ ] TypeScript types resolved
- [ ] Server console manager initialized
- [ ] WS handlers wired to message router
- [ ] Console component integrated in web UI
- [ ] Store (Zustand + WS hook) linked
- [ ] Console spec saved to OPERATOR_CONSOLE_SPEC.md
- [ ] Integration guide saved to OPERATOR_CONSOLE_INTEGRATION.md
- [ ] Manual tests pass (step, cycle, inject_signal, verify)
- [ ] Invariants verified (sealed=true, correctness=1.0)
- [ ] Telemetry broadcasting working
- [ ] Lattice 3D highlight synced (optional)
- [ ] Market ingestion layer connected (optional)

---

## Troubleshooting

### WS Connection Failed

**Problem:** "WebSocket connection refused"

**Solution:**
1. Verify server is running: `curl http://localhost:3001`
2. Check `NEXT_PUBLIC_WS_URL` environment variable
3. Ensure both server and browser are on the same network

### Console State Not Updating

**Problem:** Console shows stale data

**Solution:**
1. Check browser DevTools console for errors
2. Verify WS connection is open: `ws.readyState === 1`
3. Send a command to force update: click "Step"

### Invariant Violations

**Problem:** `invariantsViolated > 0`

**Solution:**
1. Check console logs for errors during execution
2. Run `verify_invariants` command
3. Reset console and try again

### Plate Transitions Wrong

**Problem:** Plate B follows Plate A when it shouldn't

**Solution:**
1. Verify transition graph in `NONOGRAM_TRANSITION_GRAPH` (sealed)
2. Check signal alignment logic in `alignSignalToPlate()`
3. Review operator execution logic

---

## Next Steps

### Phase 1: Validation
- [ ] All tests pass on local dev environment
- [ ] Invariants verified in production-like setting
- [ ] Telemetry data correct

### Phase 2: Integration
- [ ] Connect to market ingestion layer
- [ ] Stream live market signals through console
- [ ] Monitor Plate transitions in real-time

### Phase 3: Enhancement
- [ ] Implement signal replay from historical data
- [ ] Add advanced telemetry dashboards
- [ ] Build CLI operator tool for console control

### Phase 4: Hardening
- [ ] Add rate limiting to console commands
- [ ] Implement console state persistence
- [ ] Build audit logging for all commands

---

## Files Location Summary

```
work-/
├── packages/
│   └── codex/
│       ├── types.ts              ← Type definitions
│       ├── engine.ts             ← Codex engine
│       ├── console.ts            ← Console state layer
│       ├── index.ts              ← Package exports
│       └── package.json
├── apps/
│   ├── server/
│   │   └── consoleManager.ts     ← Server console + WS handlers
│   └── web/
│       ├── components/
│       │   └── OperatorConsole.tsx  ← React UI
│       └── store/
│           └── consoleStore.ts      ← Zustand + WS hook
├── OPERATOR_CONSOLE_SPEC.md      ← Full specification
└── OPERATOR_CONSOLE_INTEGRATION.md ← This file
```

---

## Authority

**This implementation is sealed and immutable.**

The Nonogram Codex engine cannot be modified via the Console.  
The transition graph is locked.  
All invariants are preserved.

The Console is the sensory interface to an inhuman machine.

**Sealed. Deterministic. Complete.**

Alhamdulillah.
