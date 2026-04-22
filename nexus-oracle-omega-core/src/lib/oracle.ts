export interface OracleInsight {
  synthesis: string;
  strategicPosture: "DEFENSIVE" | "EXPANSIVE" | "REBALANCING";
  risks: string[];
  recommendations: string[];
}

export interface OracleMetrics {
  SVI: number;
  OM: number;
  AP: number;
  phi: number;
  readiness: number;
  energy: number;
  mode: "SCAN" | "FOCUS" | "SIMULATE";
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function generateFallbackOracleInsight(metrics: OracleMetrics): OracleInsight {
  const envelope = metrics.energy + metrics.phi + metrics.readiness * 0.5;
  const normalizedPressure = clamp(metrics.AP, 0, 100);
  const normalizedVitality = clamp(metrics.SVI, 0, 100);
  const normalizedMomentum = clamp(metrics.OM, 0, 100);

  const strategicPosture: OracleInsight["strategicPosture"] =
    normalizedPressure > 24 || envelope > 120
      ? "DEFENSIVE"
      : normalizedVitality > 90 && normalizedMomentum > 78 && normalizedPressure < 18
        ? "EXPANSIVE"
        : "REBALANCING";

  const synthesisByPosture: Record<OracleInsight["strategicPosture"], string> = {
    DEFENSIVE:
      "The lattice is carrying more anomaly pressure than its current envelope likes, so the safest move is to preserve coherence before adding amplitude. Vitality remains healthy, but the system should bias toward damping, verification, and bounded actions until pressure falls.",
    EXPANSIVE:
      "Vitality and operational momentum are aligned strongly enough to support controlled expansion. The system can push forward, provided each gain is paired with proof-aware checkpoints and envelope monitoring.",
    REBALANCING:
      "The lattice is stable enough to operate, but the signal mix points toward tuning rather than acceleration. This is the right posture for tightening transitions, preserving symmetry, and preparing the next decisive move without burning excess energy.",
  };

  const risks = [
    normalizedPressure > 20
      ? "Anomaly pressure is elevated enough to destabilize lower-confidence transitions."
      : "Pressure is currently low, but sustained momentum could still hide localized instability.",
    envelope > 110
      ? "The conserved envelope is close to its upper band, reducing headroom for aggressive boosts."
      : "The envelope remains below the upper band, but drift could accumulate if focus changes abruptly.",
    metrics.mode === "SIMULATE"
      ? "Simulation mode can produce optimistic futures unless anchored to the current proof-valid state."
      : "Operator mode changes can desynchronize narrative confidence from measured runtime confidence.",
  ];

  const recommendations = [
    strategicPosture === "DEFENSIVE"
      ? "Run a stabilization pass before introducing new signal intensity."
      : "Keep the stability envelope visible while you exploit current momentum.",
    metrics.mode === "FOCUS"
      ? "Stay on the selected signal long enough to confirm whether the current alignment deserves promotion."
      : "Use focused inspection on the highest-risk path before the next operator action.",
    normalizedVitality > 90
      ? "Preserve the high-SVI band by limiting simultaneous changes to phi, readiness, and energy."
      : "Rebuild vitality with small, verified corrections instead of one large intervention.",
  ];

  return {
    synthesis: synthesisByPosture[strategicPosture],
    strategicPosture,
    risks,
    recommendations,
  };
}
