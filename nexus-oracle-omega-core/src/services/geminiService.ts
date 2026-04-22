import {
  generateFallbackOracleInsight,
  OracleInsight,
  OracleMetrics,
} from "../lib/oracle";

export type { OracleInsight, OracleMetrics };

export async function generateOracleAnalysis(metrics: OracleMetrics): Promise<OracleInsight> {
  try {
    const response = await fetch("/api/oracle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metrics),
    });

    if (!response.ok) {
      throw new Error(`Oracle endpoint returned ${response.status}`);
    }

    const payload = (await response.json()) as Partial<OracleInsight>;
    if (
      typeof payload.synthesis !== "string" ||
      typeof payload.strategicPosture !== "string" ||
      !Array.isArray(payload.risks) ||
      !Array.isArray(payload.recommendations)
    ) {
      throw new Error("Oracle endpoint returned an invalid payload");
    }

    return {
      synthesis: payload.synthesis,
      strategicPosture: payload.strategicPosture as OracleInsight["strategicPosture"],
      risks: payload.risks.map(String),
      recommendations: payload.recommendations.map(String),
    };
  } catch (error) {
    console.warn("[ORACLE_FALLBACK]", error instanceof Error ? error.message : String(error));
    return generateFallbackOracleInsight(metrics);
  }
}
