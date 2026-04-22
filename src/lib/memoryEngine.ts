import { MemoryEvent, PatternMatch } from "./types";

// Static Mock Memory for initial Pattern Match capability
// In a real scenario, this would be loaded from a DB or JSON file
export const memoryStore: MemoryEvent[] = [
  {
    id: "mem_2024_001",
    timestamp: "2024-03-15T10:00:00Z",
    features: {
      marketImpact: 85,
      supplyDisruption: 20,
      securityRisk: 10,
      aiShift: 5,
      sentiment: -2,
      velocity: 9
    },
    score: 82,
    decision: "EXPLOIT",
    outcome: {
      marketMove: 4.2,
      volatilitySpike: false,
      disruptionOccurred: false
    },
    label: "Tech Surge Parallel"
  },
  {
    id: "mem_2023_042",
    timestamp: "2023-11-20T14:30:00Z",
    features: {
      marketImpact: 30,
      supplyDisruption: 90,
      securityRisk: 60,
      aiShift: 10,
      sentiment: -8,
      velocity: 7
    },
    score: 75,
    decision: "DEFEND",
    outcome: {
      marketMove: -3.1,
      volatilitySpike: true,
      disruptionOccurred: true
    },
    label: "Supply Chain Shock"
  },
  {
    id: "mem_2025_012",
    timestamp: "2025-01-10T09:00:00Z",
    features: {
      marketImpact: 50,
      supplyDisruption: 40,
      securityRisk: 80,
      aiShift: 30,
      sentiment: -5,
      velocity: 6
    },
    score: 68,
    decision: "HOLD",
    outcome: {
      marketMove: -0.5,
      volatilitySpike: true,
      disruptionOccurred: false
    },
    label: "Geopolitical Tensions"
  }
];

export function toVector(e: MemoryEvent['features']): number[] {
  return [
    e.marketImpact,
    e.supplyDisruption,
    e.securityRisk,
    e.aiShift,
    e.sentiment,
    e.velocity
  ];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function findSimilarPatterns(features: MemoryEvent['features']): PatternMatch[] {
  const currentVec = toVector(features);
  
  return memoryStore
    .map(past => ({
      probability: cosineSimilarity(currentVec, toVector(past.features)),
      outcome: past.outcome,
      label: past.label
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}

/**
 * Maps a Signal's properties to a feature vector for similarity search.
 */
export function extractFeaturesFromSignal(signal: any): MemoryEvent['features'] {
  // Normalize signal metrics (0-100 scale usually better for similarity)
  return {
    marketImpact: (signal.momentum + 1) * 50, // Map -1..1 to 0..100
    supplyDisruption: signal.volatility * 100,
    securityRisk: signal.risk || (Math.random() * 100), // Default logic for now
    aiShift: signal.entities?.includes('AI') ? 90 : 20,
    sentiment: signal.momentum * 10, // -10 to 10 scale
    velocity: 5 + (Math.random() * 5)
  };
}
