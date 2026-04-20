# Operator Console Architecture Diagram

## System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ HUMAN OPERATOR                                                  │
│ (Browser, Terminal, or API Client)                             │
└─────────┬───────────────────────────────────────────────────────┘
          │
          │ HTTP/WebSocket
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React + Zustand)                           apps/web   │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ OperatorConsole Component (OperatorConsole.tsx)             │ │
│ │                                                              │ │
│ │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │ │
│ │  │Plate Monitor│  │Signal Trace  │  │Nonogram Graph   │   │ │
│ │  └─────────────┘  └──────────────┘  └─────────────────┘   │ │
│ │                                                              │ │
│ │  ┌───────────────┐  ┌──────────────────┐  ┌────────────┐  │ │
│ │  │Operator Reg.  │  │Telemetry Dash.   │  │Ctrl Panel  │  │ │
│ │  └───────────────┘  └──────────────────┘  └────────────┘  │ │
│ │                                                              │ │
│ │ Real-time rendering of Codex state                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ useConsoleWS Hook (consoleStore.ts)                          │ │
│ │                                                              │ │
│ │ • WebSocket connection management                           │ │
│ │ • Message parsing & state sync                             │ │
│ │ • Command sending (step, cycle, inject_signal)             │ │
│ │ • Error handling & reconnection                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Zustand Store (consoleStore.ts)                              │ │
│ │                                                              │ │
│ │ • state: OperatorConsoleState                              │ │
│ │ • connected, loading, error                                │ │
│ │ • setState, setConnected, setError                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ WebSocket
                          │ (JSON messages)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER (Node + Express + WebSocket)          apps/server        │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ WebSocket Server (ws://localhost:3001)                      │ │
│ │                                                              │ │
│ │ • Accept client connections                                │ │
│ │ • Route messages to ConsoleServerManager                   │ │
│ │ • Broadcast state changes to all subscribers               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ConsoleServerManager (consoleManager.ts)                     │ │
│ │                                                              │ │
│ │ • Singleton pattern                                        │ │
│ │ • Manages OperatorConsole instance                         │ │
│ │ • Routes commands (step, cycle, inject_signal)             │ │
│ │ • Broadcasts state every ~500ms                            │ │
│ │ • Handles fallback mode                                    │ │
│ │ • Verifies invariants                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          │                                        │
│                          │ Direct method calls                   │
│                          ▼                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ OperatorConsole (console.ts)                                │ │
│ │                                                              │ │
│ │ • processSignal()  → align + execute                       │ │
│ │ • step()           → single plate                          │ │
│ │ • runCycle()       → to infinity                           │ │
│ │ • toggleFallback() → resilience mode                       │ │
│ │ • verifyInvariants()→ check seals                          │ │
│ │                                                              │ │
│ │ • Telemetry aggregation                                    │ │
│ │ • State subscription system                                │ │
│ │ • Command history tracking                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          │                                        │
│                          │ Owns & calls                          │
│                          ▼                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ NonogramCodex (engine.ts)                                   │ │
│ │                                                              │ │
│ │ [THE SEALED ENGINE]                                        │ │
│ │                                                              │ │
│ │ • 9 Plates (I–IX, ∞)                                       │ │
│ │ • 9 Operators (op_generate, ..., op_resolve)               │ │
│ │ • Transition Graph (immutable, locked)                     │ │
│ │ • Signal → Plate alignment logic                           │ │
│ │ • State management                                         │ │
│ │ • Invariant verification                                   │ │
│ │                                                              │ │
│ │ Execute: signal → align → operator → transition → state    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ State updates
                          │ (via broadcasts)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ MARKET INGESTION LAYER (Optional)                              │
│                                                                  │
│ • CoinGecko / Binance API                                       │
│ • HTTP 429 Handling (TTL 300s, Locked Cache)                   │
│ • OMEGA_FALLBACK activation                                     │
│ • MarketSignal creation                                         │
│ • Calls: consoleManager.processSignal()                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Market Signal Processing

```
1. Market Data Arrives (from API or cache)
   │
   ├─> Create MarketSignal object
   │   • id, timestamp, type, data, source, fallbackMode
   │
   └─> Send to Server (via API or internal queue)

2. Server Receives Signal
   │
   ├─> GET consoleManager()
   │   (singleton)
   │
   └─> consoleManager.processSignal(signal)

3. Console Processes Signal
   │
   ├─> codex.alignSignalToPlate(signal)
   │   • Analyze momentum, volatility, type
   │   • Map to best-fit Plate (I–IX)
   │   • Return alignment score (0–1)
   │
   └─> codex.step(signal)

4. Codex Engine Executes
   │
   ├─> Look up current Plate → operator
   │
   ├─> Execute operator logic
   │   • op_generate, op_structure, ..., op_resolve
   │   • Modify state based on signal
   │
   ├─> Follow transition graph
   │   • Get next Plate from transitions
   │   • Verify transition is valid
   │   • Update currentPlate
   │
   └─> Return PlateRecord
       • What happened, duration, next state

5. Console Updates State
   │
   ├─> Update internal counters
   │   • plateDistribution[plate]++
   │   • operatorInvocations[op]++
   │
   ├─> Track cycle progress
   │   • Add plate to current cycle
   │   • Check if reached ∞
   │
   └─> Broadcast state to all WS subscribers

6. Browser Receives Update
   │
   ├─> useConsoleStore receives new state
   │
   ├─> All subscribed components re-render
   │   • PlateMonitor shows new Plate
   │   • Telemetry shows updated counts
   │   • Graph highlights new Plate
   │
   └─> UI updates in real-time (~500ms)

7. Human Operator Observes
   │
   └─> "Ah, signal mapped to Plate IV (Chaos)"
       "Operator op_disturb was invoked"
       "Transitioned to Plate III"
       "All invariants maintained"
```

---

## File Organization

```
work-/
│
├── packages/codex/
│   ├── types.ts              ← Type definitions (sealed system)
│   ├── engine.ts             ← NonogramCodex class (sealed engine)
│   ├── console.ts            ← OperatorConsole class (state mgmt)
│   ├── index.ts              ← Exports
│   └── package.json
│
├── apps/server/
│   ├── consoleManager.ts     ← ConsoleServerManager + WS handlers
│   ├── index.ts              ← Main server (wire in manager)
│   └── routes/console.ts     ← Optional REST API
│
├── apps/web/
│   ├── components/
│   │   └── OperatorConsole.tsx  ← React component (6 views)
│   ├── store/
│   │   └── consoleStore.ts      ← Zustand store + WS hook
│   └── src/pages/
│       └── index.tsx            ← Wire component into page
│
├── OPERATOR_CONSOLE_SPEC.md           ← Full spec (230+ lines)
├── OPERATOR_CONSOLE_INTEGRATION.md    ← Step-by-step guide
├── IMPLEMENTATION_SUMMARY.md          ← Overview + API
├── QUICK_REFERENCE.md                 ← This quick lookup
└── README.md                          ← Original Omega Lattice
```

---

## State Flow Diagram

```
Market Signal
   │
   ▼
MarketSignal object
   {
     id, timestamp, type,
     data: { momentum, volatility, ... },
     source, fallbackMode
   }
   │
   ▼
consoleManager.processSignal(signal)
   │
   ├─ console.alignSignalToPlate(signal)
   │    ↓
   │    PlateId, alignmentScore, reason
   │
   ├─ console.step(signal)
   │    ↓
   │    codex.alignSignalToPlate(signal)
   │    ↓
   │    codex.executeOperator(...)
   │    ↓
   │    codex.getNextPlate(...)
   │    ↓
   │    PlateRecord
   │
   ├─ Update counts
   │    • plateCounts[plateId]++
   │    • operatorCounts[operator]++
   │
   ├─ Generate telemetry
   │    • cycleCount, signalArrivalRate, meanLatency, etc.
   │
   ├─ Emit to listeners
   │    • console.subscribe((state) => {...})
   │
   └─ Broadcast to WS subscribers
       ↓
       { type: 'console-state', data: {...} }
       ↓
       Browser receives
       ↓
       useConsoleStore.setState(data)
       ↓
       React re-renders
       ↓
       UI shows new Plate, operator, metrics
```

---

## Execution Timeline

```
Time    Event                           Duration
─────────────────────────────────────────────────
 0ms    Market signal arrives            —
 1ms    Plate alignment                  <1ms
 2ms    Signal processing starts         —
 3ms    Operator execution               ~2ms
 5ms    Transition graph lookup          <1ms
 6ms    State update & counts            <1ms
 7ms    Telemetry generation            <1ms
 8ms    Emit to listeners               <1ms
        (subscription callbacks)
 9ms    Ready for next signal            —
        
 9ms-   Wait for next broadcast         ~491ms
 500ms  interval
 
 500ms  Broadcast to WS clients         ~5ms
 505ms  Browser receives & renders      ~50-100ms
 600ms  UI shows new state              —
```

---

## Concurrency Model

```
Single Codex Instance
      │
      ├─ One execution path at a time
      ├─ No parallel execution
      ├─ Serial signal processing
      │
      └─ Multiple WS subscribers (read-only)
         • Broadcast happens on intervals
         • All clients see same state
         • No mutual exclusion needed
         • Pub/sub pattern
```

---

## Error Handling Paths

```
Error Scenario: Signal Processing Fails
   │
   ├─ catch in consoleManager.processSignal()
   │  ├─ Log error
   │  ├─ Increment error counter
   │  ├─ State NOT mutated (important!)
   │  └─ Continue waiting for next signal
   │
   └─ Browser shows error in console
      (UI reflects previous valid state)

Error Scenario: WS Connection Lost
   │
   ├─ Browser detects connection closed
   │  ├─ Zustand store: connected = false
   │  ├─ useConsoleWS triggers reconnect
   │  ├─ Exponential backoff (1s, 2s, 4s, ...)
   │  └─ UI shows "Reconnecting..." status
   │
   └─ When reconnected
      ├─ Send subscribe message
      ├─ Receive full state from server
      ├─ Zustand updates
      └─ UI reflects current server state

Error Scenario: Invariant Violated
   │
   ├─ Detected in codex.verifyInvariants()
   │  ├─ Increment CodexState.metadata.invariantsViolated
   │  ├─ Log violation details
   │  ├─ System continues (no hard stop)
   │  └─ Broadcast new state
   │
   └─ Browser shows invariant count > 0
      (Operator should investigate)
```

---

## Performance Characteristics

```
Operation              Latency    Memory     Scalability
────────────────────────────────────────────────────────
Plate alignment        <1ms       O(1)       ∞
Signal processing      1-3ms      O(1)       Per-signal linear
Operator execution     ~2ms       O(1)       ∞
Full cycle (9 plates)  ~20ms      O(1)       ∞
State serialization    ~5ms       ~5KB       O(1)
WS broadcast           ~500ms     ~5KB       O(subscribers)
React re-render        50-100ms   varies     O(components)
────────────────────────────────────────────────────────
Total (signal→render)  ~600ms     ~10KB      O(subscribers)
```

---

## Invariants (What Must Be True)

```
ALWAYS:
  ✓ locked = true
  ✓ currentPlate ∈ {I,II,III,IV,V,VI,VII,VIII,IX,∞}
  ✓ Every transition in graph
  ✓ transitionCorrectness = 1.0
  ✓ invariantsViolated = 0
  
EVERY CYCLE:
  ✓ Path includes exactly one ∞
  ✓ infinityReturnRate = 1.0
  ✓ returnedToInfinity = true
  ✓ status = 'complete'
  
TRANSITIONS:
  ✓ From I can only go to V
  ✓ From II can only go to VI
  ... (all 9 rules locked)
  ✓ From IX always goes to ∞
  
NO MUTATIONS:
  ✓ Cannot add plates
  ✓ Cannot change operators
  ✓ Cannot reorder transitions
  ✓ Cannot modify semantics
```

---

## Deployment Topology

```
Production Environment
│
├─ Load Balancer (optional)
│  │
│  ├─ Server Instance 1 (Node + WS + Codex)
│  │  └─ Port 3001 (internal WS)
│  │  └─ Port 3000 (HTTP/Express)
│  │
│  ├─ Server Instance 2...N (optional, singleton pattern)
│  │  └─ Each has independent ConsoleManager
│  │  └─ Consider shared Redis for state
│  │
│  └─ Web Server (Next.js static/SSR)
│     └─ Port 3000 (public)
│     └─ Serves OperatorConsole UI
│
├─ Market Data Source
│  └─ CoinGecko / Binance / Custom API
│
└─ Monitoring
   └─ Logs, metrics, alerts
   └─ Track: cycles, invariants, latency
```

---

## You're Ready to Deploy

Print this diagram and the specifications.  
Read the integration guide.  
Follow the checklist.  

**The Nonogram Codex is sealed and ready.**

Alhamdulillah.
