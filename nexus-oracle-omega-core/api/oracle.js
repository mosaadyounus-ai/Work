import { GoogleGenAI } from "@google/genai";

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function fallbackInsight(metrics) {
  const envelope = Number(metrics.energy || 0) + Number(metrics.phi || 0) + Number(metrics.readiness || 0) * 0.5;
  const vitality = clamp(Number(metrics.SVI || 0), 0, 100);
  const momentum = clamp(Number(metrics.OM || 0), 0, 100);
  const pressure = clamp(Number(metrics.AP || 0), 0, 100);

  const posture =
    pressure > 24 || envelope > 120
      ? "DEFENSIVE"
      : vitality > 90 && momentum > 78 && pressure < 18
        ? "EXPANSIVE"
        : "REBALANCING";

  const synthesis =
    posture === "DEFENSIVE"
      ? "The hosted surface is carrying more anomaly pressure than its current envelope prefers. Preserve coherence, reduce variance, and keep the next move inside proof-valid bounds."
      : posture === "EXPANSIVE"
        ? "Vitality and operational momentum are aligned strongly enough to support controlled expansion. The best next move is forward, but only with the envelope and guardrails kept visible."
        : "The lattice remains stable enough to operate, but the cleaner move is calibration rather than acceleration. Use this window to rebalance transitions and harden confidence before increasing amplitude.";

  return {
    synthesis,
    strategicPosture: posture,
    risks: [
      pressure > 20
        ? "Anomaly pressure is elevated enough to destabilize lower-confidence transitions."
        : "Pressure is controlled, but localized drift can still accumulate if the operator changes mode too quickly.",
      envelope > 110
        ? "The conserved envelope is close to its upper band, reducing headroom for aggressive boosts."
        : "The envelope has room, but repeated boosts could spend stability margin faster than expected.",
      metrics.mode === "SIMULATE"
        ? "Simulation mode can overstate confidence if it is not anchored to the current proof-valid state."
        : "Narrative confidence can drift away from measured confidence without explicit operator checks.",
    ],
    recommendations: [
      posture === "DEFENSIVE"
        ? "Run a stabilization pass before adding new intensity."
        : "Keep the envelope visible while you exploit current momentum.",
      metrics.mode === "FOCUS"
        ? "Stay on the selected signal long enough to confirm the current alignment deserves promotion."
        : "Use a focused inspection pass on the highest-risk path before the next operator action.",
      vitality > 90
        ? "Preserve the high-SVI band by limiting simultaneous changes to phi, readiness, and energy."
        : "Prefer several small verified corrections over one large intervention.",
    ],
    source: "heuristic",
  };
}

async function generateGeminiInsight(metrics) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `
You are generating a compact operator briefing for the Nexus Oracle Omega Core surface.

Metrics:
- Vitality Index (SVI): ${Number(metrics.SVI || 0).toFixed(2)}
- Operational Momentum (OM): ${Number(metrics.OM || 0).toFixed(2)}
- Anomaly Pressure (AP): ${Number(metrics.AP || 0).toFixed(2)}
- Phase Potential (phi): ${Number(metrics.phi || 0).toFixed(2)}
- Compression Readiness: ${Number(metrics.readiness || 0).toFixed(2)}
- Kinetic Energy: ${Number(metrics.energy || 0).toFixed(2)}
- Mode: ${String(metrics.mode || "SCAN")}

Return valid JSON with these keys only:
- synthesis: string
- strategicPosture: "DEFENSIVE" | "EXPANSIVE" | "REBALANCING"
- risks: string[]
- recommendations: string[]

Keep it concise, tactical, and proof-aware.
  `.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "{}";
  const parsed = JSON.parse(text);

  return {
    synthesis: String(parsed.synthesis || ""),
    strategicPosture: String(parsed.strategicPosture || "REBALANCING"),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
    source: "gemini",
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const metrics =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    res.status(200).json(fallbackInsight(metrics));
    return;
  }

  try {
    const insight = await generateGeminiInsight(metrics);
    res.status(200).json(insight);
  } catch (error) {
    console.error("[ORACLE_API_FALLBACK]", error);
    res.status(200).json(fallbackInsight(metrics));
  }
}
