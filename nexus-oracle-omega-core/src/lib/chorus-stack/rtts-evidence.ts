import {
  ArbiterProfile,
  ContaminationSummary,
  RTTSEvidence,
  SignalState,
} from "./shared-types";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function summarizeContamination(
  reliabilityCorrelation: number,
  fallbackCorrelation: number,
): ContaminationSummary {
  const contaminated =
    Math.abs(reliabilityCorrelation) > 0.7 || Math.abs(fallbackCorrelation) > 0.85;
  const severity =
    Math.abs(reliabilityCorrelation) > 0.85 || Math.abs(fallbackCorrelation) > 0.92
      ? "critical"
      : contaminated
        ? "warning"
        : "nominal";

  return {
    contaminated,
    severity,
    reliabilityCorrelation,
    fallbackCorrelation,
    recommendations: contaminated
      ? [
          "freeze demotions",
          "disable ranking if contamination is critical",
          "require manual audit before recovery",
        ]
      : ["continue nominal evidence collection"],
  };
}

export function buildRTTSEvidence(
  arbiter: ArbiterProfile,
  signalState: SignalState,
): RTTSEvidence {
  const loadFactor = Math.max(1, arbiter.currentLoad / 10);
  const loadNormalizedServiceScore = clamp(arbiter.serviceScore / loadFactor, 0, 1);
  const combined = arbiter.qualityScore * 0.7 + loadNormalizedServiceScore * 0.3;

  return {
    arbiterId: arbiter.arbiterId,
    qualityScore: clamp(arbiter.qualityScore, 0, 1),
    serviceScore: clamp(arbiter.serviceScore, 0, 1),
    loadNormalizedServiceScore,
    currentLoad: arbiter.currentLoad,
    concentrationRisk: clamp(arbiter.concentrationRisk, 0, 1),
    signalState,
    band:
      signalState === "contaminated"
        ? "FROZEN"
        : combined >= 0.82
          ? "A"
          : combined >= 0.62
            ? "B"
            : "C",
  };
}
