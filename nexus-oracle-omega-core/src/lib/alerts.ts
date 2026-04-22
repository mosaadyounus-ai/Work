import { ProcessedSignal } from "./types";

export function generateAlerts(processed: ProcessedSignal[]): string[] {
  const alerts: string[] = [];
  processed.forEach((d) => {
    if (d.decision === "DEFEND") {
      const reason = d.score < -40 ? "Low Meta-Score" : "High Risk Exposure";
      alerts.push(`[WARN] ${d.name}: Defensive posture recommended. Impact: ${d.risk.toFixed(1)}%. [Reason: ${reason} / Confidence: ${(d.confidence * 100).toFixed(0)}%]`);
    }
    if (d.decision === "EXPLOIT") {
      alerts.push(`[BOOST] ${d.name}: Opportunity detected. Aggressive posture recommended. [Score: ${d.score.toFixed(1)} / Confidence: ${(d.confidence * 100).toFixed(0)}%]`);
    }
  });
  return alerts;
}
