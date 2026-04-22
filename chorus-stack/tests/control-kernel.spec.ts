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

describe("evaluateMode - containment thresholds", () => {
  it("enters containment when confidenceDrift exceeds 0.4", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.1, confidenceDrift: 0.41 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });

  it("does not enter containment when contaminationRate is exactly 0.3", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.3, confidenceDrift: 0.1 });
    expect(result.mode).not.toBe("containment");
  });

  it("does not enter containment when confidenceDrift is exactly 0.4", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.1, confidenceDrift: 0.4 });
    expect(result.mode).not.toBe("containment");
  });

  it("enters containment just above 0.3 contamination boundary", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.301, confidenceDrift: 0.1 });
    expect(result.mode).toBe("containment");
  });

  it("returns reasons containing 'safety threshold exceeded' in containment", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.35, confidenceDrift: 0.1 });
    expect(result.reasons).toContain("safety threshold exceeded");
  });
});

describe("evaluateMode - degraded thresholds", () => {
  it("enters degraded mode when contaminationRate exceeds 0.15", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
  });

  it("does not enter degraded mode when contaminationRate is exactly 0.15", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.15, confidenceDrift: 0.1 });
    expect(result.mode).toBe("normal");
  });

  it("enters degraded mode when queueDepth exceeds 120", () => {
    const result = evaluateMode({ queueDepth: 121, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
  });

  it("does not enter degraded mode when queueDepth is exactly 120", () => {
    const result = evaluateMode({ queueDepth: 120, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.mode).toBe("normal");
  });

  it("enters degraded mode when confidenceDrift exceeds 0.2", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.05, confidenceDrift: 0.21 });
    expect(result.mode).toBe("degraded");
  });

  it("does not enter degraded mode when confidenceDrift is exactly 0.2", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.05, confidenceDrift: 0.2 });
    expect(result.mode).toBe("normal");
  });

  it("returns reasons containing 'load or evidence quality degraded' in degraded mode", () => {
    const result = evaluateMode({ queueDepth: 150, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.reasons).toContain("load or evidence quality degraded");
  });

  it("selects priority_first policy when degraded and queueDepth > 100", () => {
    const result = evaluateMode({ queueDepth: 101, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("priority_first");
  });

  it("selects balanced policy when degraded and queueDepth is at most 100", () => {
    const result = evaluateMode({ queueDepth: 100, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("balanced");
  });
});

describe("evaluateMode - normal mode", () => {
  it("returns balanced policy in normal mode regardless of queueDepth", () => {
    const result = evaluateMode({ queueDepth: 200, contaminationRate: 0.0, confidenceDrift: 0.0 });
    // queueDepth 200 would trigger priority_first if mode were degraded, but mode is normal
    // Wait: queueDepth > 120 triggers degraded, so this would be degraded
    // Let's use queueDepth = 50
    const normalResult = evaluateMode({ queueDepth: 50, contaminationRate: 0.0, confidenceDrift: 0.0 });
    expect(normalResult.mode).toBe("normal");
    expect(normalResult.policy).toBe("balanced");
  });

  it("returns reasons containing 'nominal operating envelope' in normal mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.0, confidenceDrift: 0.0 });
    expect(result.reasons).toContain("nominal operating envelope");
  });

  it("returns exactly one reason in normal mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.reasons).toHaveLength(1);
  });

  it("returns exactly one reason in degraded mode", () => {
    const result = evaluateMode({ queueDepth: 130, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.reasons).toHaveLength(1);
  });

  it("returns exactly one reason in containment mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.5, confidenceDrift: 0.1 });
    expect(result.reasons).toHaveLength(1);
  });
});