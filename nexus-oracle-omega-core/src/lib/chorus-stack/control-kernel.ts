import { KernelEvaluationInput, ModeState } from "./shared-types";

export function evaluateControlKernel(input: KernelEvaluationInput): ModeState {
  const reasons: string[] = [];
  const reliabilityCorrelation = Math.abs(input.reliabilityCorrelation);
  const fallbackCorrelation = Math.abs(input.fallbackCorrelation);
  const overloaded = input.queueDepth >= input.queueThreshold;

  if (reliabilityCorrelation > 0.7 || fallbackCorrelation > 0.85) {
    reasons.push("contaminated signal detected");
    return {
      mode: "INVERTED",
      demotionsFrozen: true,
      rankingEnabled: false,
      manualAuditRequired: true,
      rationale: reasons,
    };
  }

  if (
    input.previousMode &&
    ["THROTTLED", "STRESS", "INVERTED"].includes(input.previousMode) &&
    input.queueDepth < input.queueThreshold * 0.72 &&
    !input.stressSignal
  ) {
    reasons.push("load normalized after protected mode");
    return {
      mode: "RECOVERY",
      demotionsFrozen: false,
      rankingEnabled: true,
      manualAuditRequired: false,
      rationale: reasons,
    };
  }

  if (overloaded && input.stressSignal) {
    reasons.push("queue threshold crossed under stress");
    return {
      mode: "STRESS",
      demotionsFrozen: true,
      rankingEnabled: true,
      manualAuditRequired: false,
      rationale: reasons,
    };
  }

  if (overloaded) {
    reasons.push("queue threshold crossed");
    return {
      mode: "THROTTLED",
      demotionsFrozen: true,
      rankingEnabled: true,
      manualAuditRequired: false,
      rationale: reasons,
    };
  }

  reasons.push("within nominal operating band");
  return {
    mode: "NORMAL",
    demotionsFrozen: false,
    rankingEnabled: true,
    manualAuditRequired: false,
    rationale: reasons,
  };
}
