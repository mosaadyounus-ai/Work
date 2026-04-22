import { Signal, PlateId, ResilienceState as GlobalResilienceState } from "./types";
import { DEFAULT_PLATES, DEFAULT_TRANSITIONS, NonagramCodex } from "./codex/engine";

/**
 * Normalizes signals by de-duplicating (simulated by ID check)
 * and ensuring timestamps are UTC.
 * Aligns signals with the Nonagram Codex based on their situational vectors.
 */
export function normalizeSignals(rawSignals: Signal[]): Signal[] {
  const seen = new Set<string>();
  
  return rawSignals
    .filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    })
    .map(s => {
      // Logic-based Plate mapping for situational awareness
      let plate: PlateId = "I";
      if (s.volatility > 0.6) plate = "IV"; // Chaos/Symmetry
      else if (s.momentum > 0.5) plate = "V"; // Order/Evolution
      else if (s.type === 'market') plate = "II"; // Lattice/Liquidity
      
      return {
        ...s,
        timestamp: new Date(s.timestamp).toISOString(),
        codex_alignment: plate
      };
    });
}

/**
 * Real-time API Connectors
 */
let marketCache: { data: Signal[], timestamp: number } | null = null;
const CACHE_TTL = 300000; 

let lastResilienceState: GlobalResilienceState = {
  rateLimitState: "STABLE",
  circuitBreaker: "CLOSED",
  latency: 12
};

export function getResilienceState(): GlobalResilienceState {
  return lastResilienceState;
}

export async function fetchMarketSignals(): Promise<Signal[]> {
  const now = Date.now();
  if (marketCache && (now - marketCache.timestamp) < CACHE_TTL) {
    return marketCache.data;
  }

  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
    
    if (!response.ok) {
       if (response.status === 429 && marketCache) {
          console.warn("[CONNECTORS_WARN] Rate limit hit (429), serving locked cache.");
          lastResilienceState = {
            ...lastResilienceState,
            rateLimitState: "THROTTLED",
            circuitBreaker: "CLOSED",
            lastError: "Rate limit hit (429)"
          };
          return marketCache.data;
       }
       throw new Error(`Market API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.bitcoin || typeof data.bitcoin.usd === 'undefined') {
       throw new Error("Invalid market data payload from CoinGecko");
    }

    const price = data.bitcoin.usd;
    const changePct = data.bitcoin.usd_24h_change || 0;
    const jitter = () => (Math.random() - 0.5) * 0.02;

    const signals: Signal[] = [
      {
        id: `mkt-btc-${now}`,
        name: "BTC Global Pulse",
        type: "market",
        timestamp: new Date().toISOString(),
        source: "coingecko_api",
        source_reputation: 1.0,
        momentum: Math.max(-1, Math.min(1, (changePct / 5) + jitter())), 
        volatility: 0.3 + Math.abs(changePct * 0.05),
        confidence: 0.95,
        entities: ["BTC", "LIQUIDITY"],
        payload: { 
          price, 
          change_pct: changePct,
          headline: `BTC actively trading at $${price.toLocaleString()}`
        }
      }
    ];

    marketCache = { data: signals, timestamp: now };
    lastResilienceState = {
      ...lastResilienceState,
      rateLimitState: "STABLE",
      circuitBreaker: "CLOSED",
      latency: 12
    };
    return signals;

  } catch (error) {
    const msg = (error as Error).message;
    console.error("[CONNECTORS_ERR] Market API failed, activating OMEGA_FALLBACK:", msg);
    
    if (marketCache) {
       lastResilienceState = {
         ...lastResilienceState,
         rateLimitState: "THROTTLED",
         circuitBreaker: "CLOSED",
         lastError: msg
       };
       return marketCache.data; 
    }

    // OMEGA_FALLBACK: Heuristic model if no cache exists
    lastResilienceState = {
      ...lastResilienceState,
      rateLimitState: "STOP",
      circuitBreaker: "OPEN",
      lastError: msg
    };
    
    const basePrice = 64200;
    const mockChange = (Math.random() - 0.5) * 2;
    return [
      {
        id: `mkt-btc-fallback-${now}`,
        name: "BTC Pulse (HEURISTIC)",
        type: "market",
        timestamp: new Date().toISOString(),
        source: "omega_heuristic",
        source_reputation: 0.7,
        momentum: mockChange / 5,
        volatility: 0.4,
        confidence: 0.5,
        entities: ["BTC", "SIMULATED"],
        payload: { 
          price: basePrice + (mockChange * 10), 
          change_pct: mockChange,
          headline: "Using heuristic market model due to external API latency or rate-limit"
        }
      }
    ];
  }
}

export async function fetchNewsSignals(): Promise<Signal[]> {
  // Using a simulated structured feed for news until a specific news key is provided.
  const jitter = () => (Math.random() - 0.5) * 0.1;

  return [
    {
      id: `news-${Date.now()}-01`,
      name: "Macro Shift",
      type: "news",
      timestamp: new Date().toISOString(),
      source: "omega_sensor",
      source_reputation: 0.9,
      momentum: 0.4 + jitter(),
      volatility: 0.2 + jitter(),
      confidence: 0.8,
      entities: ["Global Economy", "Policy"],
      payload: { headline: "Central liquidity injection detected in Asian markets" }
    }
  ];
}
