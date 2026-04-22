// Re-export central types from lib/types
import { PlateId, CodexStep as LibCodexStep, TraceAnnotation as LibTraceAnnotation, GuardrailEvent as LibGuardrailEvent } from "../lib/types";

export type { PlateId };
export type CodexStep = LibCodexStep;
export type TraceAnnotation = LibTraceAnnotation;
export type GuardrailEvent = LibGuardrailEvent;

export type RateLimitState = "NORMAL" | "LOCKED_CACHE" | "OMEGA_FALLBACK";

export interface SignalSnapshot {
  id: string;
  name: string;
  price?: number;
  momentum: number;
  volatility: number;
  source: string;
  timestamp: string;
}

export interface PlateAlignment {
  plateId: PlateId;
  reason: string;
}

// Redundant types removed - imported from lib/types

export interface ResilienceState {
  rateLimitState: RateLimitState;
  last429At?: string;
  lastFallbackAt?: string;
  cacheState: "HOT" | "LOCKED" | "COLD";
}

// --- STRATEGIC ANNOTATIONS ---
export type AnnotationSeverity = "INFO" | "WARN" | "CRITICAL";

// Redundant types removed

// --- SCENARIO PLAYBACK ---
export interface PlaybackState {
  active: boolean;
  index: number;
  speedMs: number;
}

// --- GUARDRAIL EXPERIMENTS ---
export type GuardrailScope = "PLATE" | "OPERATOR" | "TRANSITION";

export interface Guardrail {
  id: string;
  label: string;
  scope: GuardrailScope;
  condition: string;
  enabled: boolean;
}

// Redundant types removed
