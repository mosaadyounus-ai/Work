import { describe, expect, it } from "vitest";
import { evaluateMode } from "../packages/control-kernel/src/controlKernel.js";

describe("Control Kernel", () => {
  it("stays in normal mode for healthy snapshots", () => {
    const result = evaluateMode({ queueDepth: 42, contaminationRate: 0.05, confidenceDrift: 0.06 });
    expect(result.mode).toBe("normal");
    expect(result.policy).toBe("balanced");
  });

  it("switches to degraded mode under elevated load", () => {
    const result = evaluateMode({ queueDepth: 180, contaminationRate: 0.1, confidenceDrift: 0.12 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("priority_first");
  });

  it("enters containment when contamination spikes", () => {
    const result = evaluateMode({ queueDepth: 30, contaminationRate: 0.33, confidenceDrift: 0.12 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });
});

describe("evaluateMode - mode transitions", () => {
  it("returns containment when confidenceDrift exceeds 0.4", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.1, confidenceDrift: 0.41 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });

  it("does not trigger containment at exactly contaminationRate=0.3 (boundary is strict >)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.3, confidenceDrift: 0.1 });
    expect(result.mode).not.toBe("containment");
  });

  it("does not trigger containment at exactly confidenceDrift=0.4 (boundary is strict >)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.1, confidenceDrift: 0.4 });
    expect(result.mode).not.toBe("containment");
  });

  it("enters degraded mode when contaminationRate exceeds 0.15", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.16, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
  });

  it("enters degraded mode when confidenceDrift exceeds 0.2", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.21 });
    expect(result.mode).toBe("degraded");
  });

  it("enters degraded mode when queueDepth exceeds 120", () => {
    const result = evaluateMode({ queueDepth: 121, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
  });

  it("does not trigger degraded at exactly queueDepth=120 (boundary is strict >)", () => {
    const result = evaluateMode({ queueDepth: 120, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.mode).toBe("normal");
  });

  it("does not trigger degraded at exactly contaminationRate=0.15 (boundary is strict >)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.15, confidenceDrift: 0.05 });
    expect(result.mode).toBe("normal");
  });

  it("does not trigger degraded at exactly confidenceDrift=0.2 (boundary is strict >)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.2 });
    expect(result.mode).toBe("normal");
  });

  it("containment takes priority over degraded conditions when both thresholds are exceeded", () => {
    // contaminationRate > 0.3 triggers containment, but queueDepth > 120 also triggers degraded
    const result = evaluateMode({ queueDepth: 200, contaminationRate: 0.35, confidenceDrift: 0.05 });
    expect(result.mode).toBe("containment");
  });
});

describe("evaluateMode - policy selection", () => {
  it("selects balanced policy in normal mode with low queue depth", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.policy).toBe("balanced");
  });

  it("selects priority_first policy in normal mode when queueDepth exceeds 100", () => {
    // queueDepth > 100 but below degraded threshold 120
    // This is a tricky case: queueDepth=110 means normal mode (not > 120)
    // but selectPolicy checks queueDepth > 100 for priority_first
    const result = evaluateMode({ queueDepth: 110, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.mode).toBe("normal");
    expect(result.policy).toBe("priority_first");
  });

  it("selects risk_limited policy regardless of queue depth in containment mode", () => {
    const result = evaluateMode({ queueDepth: 500, contaminationRate: 0.35, confidenceDrift: 0.05 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });

  it("selects priority_first in degraded mode with high queue depth", () => {
    const result = evaluateMode({ queueDepth: 150, contaminationRate: 0.1, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("priority_first");
  });

  it("selects balanced in degraded mode with low queue depth", () => {
    // degraded via contaminationRate, but queueDepth <= 100
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.2, confidenceDrift: 0.05 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("balanced");
  });
});

describe("evaluateMode - reasons array", () => {
  it("includes 'nominal operating envelope' reason in normal mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.reasons).toContain("nominal operating envelope");
    expect(result.reasons).toHaveLength(1);
  });

  it("includes 'safety threshold exceeded' reason in containment mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.35, confidenceDrift: 0.05 });
    expect(result.reasons).toContain("safety threshold exceeded");
    expect(result.reasons).toHaveLength(1);
  });

  it("includes 'load or evidence quality degraded' reason in degraded mode", () => {
    const result = evaluateMode({ queueDepth: 150, contaminationRate: 0.1, confidenceDrift: 0.1 });
    expect(result.reasons).toContain("load or evidence quality degraded");
    expect(result.reasons).toHaveLength(1);
  });

  it("returns result with mode, policy, and reasons fields always present", () => {
    const result = evaluateMode({ queueDepth: 0, contaminationRate: 0, confidenceDrift: 0 });
    expect(result).toHaveProperty("mode");
    expect(result).toHaveProperty("policy");
    expect(result).toHaveProperty("reasons");
    expect(Array.isArray(result.reasons)).toBe(true);
  });
});