import { ProcessedSignal } from "./types";

export function generateAlerts(processed: ProcessedSignal[]): string[] {
  const alerts: string[] = [];
  processed.forEach((d) => {
    if (d.decision === "DEFEND") {
      const reason = d.score < 40 ? "LATTICE_VARIANCE_HIGH" : "RESILIENCE_EXPOSURE";
      alerts.push(`⚠ ${d.name}: STRATEGIC_GUARDRAIL_ENGAGED. Risk: ${d.risk.toFixed(1)}%. [Vector: ${reason}]`);
    }
    if (d.decision === "EXPLOIT") {
      alerts.push(`⚡ ${d.name}: POSTURE_OPTIMIZATION_DETECTED. [Score: ${d.score.toFixed(1)} / Confidence: ${(d.confidence * 100).toFixed(0)}%]`);
    }
  });
  return alerts;
}
