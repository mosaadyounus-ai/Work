import { Signal } from "./types";

export const signals: Signal[] = [
  {
    id: "sig-20260417-001",
    name: "Financial Markets",
    type: "market",
    timestamp: "2026-04-17T09:00:00Z",
    source: "internal_baseline",
    source_reputation: 0.8,
    momentum: 0.45,
    volatility: 0.3,
    confidence: 0.9,
    entities: ["SPX", "NDX"],
    payload: { change_pct: 0.2 }
  },
  {
    id: "sig-20260417-002",
    name: "Supply Chain",
    type: "sensor",
    timestamp: "2026-04-17T09:05:00Z",
    source: "internal_baseline",
    source_reputation: 0.7,
    momentum: -0.1,
    volatility: 0.6,
    confidence: 0.75,
    entities: ["Global Logistics"],
    payload: {}
  },
  {
    id: "sig-20260417-003",
    name: "Technology / AI",
    type: "news",
    timestamp: "2026-04-17T09:10:00Z",
    source: "internal_baseline",
    source_reputation: 0.9,
    momentum: 0.85,
    volatility: 0.2,
    confidence: 0.95,
    entities: ["AI", "LLM"],
    payload: { headline: "Breakthrough in reasoning architectures" }
  }
];
