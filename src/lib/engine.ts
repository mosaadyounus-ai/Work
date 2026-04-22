import { simulate } from "./simulator";
import { config } from "./config";
import { Signal, ProcessedSignal } from "./types";
import { findSimilarPatterns, extractFeaturesFromSignal } from "./memoryEngine";
import { decide, defaultInvariants, Vessel, DecisionOption } from "./mfcs/kernel";
import { monitor } from "./mfcs/monitor";

/**
 * Scoring Formula:
 * score = 100 * momentum * confidence * source_reputation - 50 * volatility
 */
export function calculateScore(s: Signal): number {
  return (100 * s.momentum * s.confidence * s.source_reputation) - (50 * s.volatility);
}

export function processSignals(signals: Signal[], previousProcessed?: ProcessedSignal[]): ProcessedSignal[] {
  return signals.map((s) => {
    const scenarios = simulate(s);
    const worst = scenarios.reduce((a, b) =>
      a.impact < b.impact ? a : b
    );
    
    const riskScore = Math.abs(worst.impact);
    const score = calculateScore(s);
    
    // Pattern Matching Integration
    const features = extractFeaturesFromSignal({ ...s, risk: riskScore });
    const patterns = findSimilarPatterns(features);
    
    // Adaptive Weight Adjustment (Self-Tuning Logic)
    let adaptiveScore = score;
    const bestMatch = patterns[0];
    if (bestMatch && bestMatch.probability > 0.8) {
       const historicalImpactBias = bestMatch.outcome.marketMove * 10; 
       adaptiveScore = (score * 0.8) + (historicalImpactBias * 0.2);
    }

    // --- MFCS CORE INTEGRATION ---
    // Context: current state metrics
    const context = { score: adaptiveScore, risk: riskScore, config };
    
    // Options: Potential Postures
    const options: DecisionOption[] = [
      { id: "DEFEND", payload: { triggered: adaptiveScore < -40 || riskScore > (50 * config.alertSensitivity) } },
      { id: "EXPLOIT", payload: { triggered: adaptiveScore > 40 && config.riskTolerance > 0.5 } },
      { id: "HOLD", payload: { triggered: true } }
    ];

    // Initialize Vessel (ephemeral for one-shot decision)
    // In a real multi-step system, we'd persist history in the signal's tracking doc
    const prevProcessed = previousProcessed?.find(p => p.id === s.id);
    const vessel: Vessel = {
      state: "IDLE",
      context,
      history: [], // fresh history for one-shot decision
      invariants: defaultInvariants
    };

    // Filter options based on payload triggers (Evaluator Move)
    const validOptions = options.filter(o => o.payload.triggered);
    
    // The decide() kernel call
    const result = decide(vessel, context, validOptions);
    
    // Monitor hook
    monitor.log(result);
    
    const finalPostion = (result.chosen?.id as "DEFEND" | "EXPLOIT" | "HOLD") || "HOLD";

    // Maintain History
    const prev = previousProcessed?.find(p => p.id === s.id || p.name === s.name);
    let history = prev ? [...prev.history] : [];
    
    // Append new point
    history.push({
      timestamp: s.timestamp,
      score: Number(adaptiveScore.toFixed(1)),
      risk: Number(riskScore.toFixed(1))
    });

    if (history.length > 30) {
      history = history.slice(-30);
    }
    
    return {
      ...s,
      scenarios,
      decision: finalPostion,
      risk: riskScore,
      score: adaptiveScore,
      history,
      patterns,
      trace: result.trace,
      vesselState: result.vessel.state,
      invariantStatus: result.status,
      contextSnapshot: context
    };
  });
}
