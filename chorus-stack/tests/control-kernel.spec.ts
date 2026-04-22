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
  it("enters containment when confidenceDrift exceeds 0.4 alone", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.1, confidenceDrift: 0.41 });
    expect(result.mode).toBe("containment");
    expect(result.policy).toBe("risk_limited");
  });

  it("does NOT enter containment when contaminationRate is exactly 0.3 (boundary)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.3, confidenceDrift: 0.1 });
    expect(result.mode).not.toBe("containment");
  });

  it("does NOT enter containment when confidenceDrift is exactly 0.4 (boundary)", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.1, confidenceDrift: 0.4 });
    expect(result.mode).not.toBe("containment");
  });

  it("enters containment when contaminationRate is just above 0.3", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.301, confidenceDrift: 0.1 });
    expect(result.mode).toBe("containment");
  });

  it("includes safety threshold reason when in containment", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.35, confidenceDrift: 0.1 });
    expect(result.reasons).toContain("safety threshold exceeded");
  });
});

describe("evaluateMode - degraded thresholds", () => {
  it("enters degraded when contaminationRate exceeds 0.15", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
  });

  it("enters degraded when confidenceDrift exceeds 0.2", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.21 });
    expect(result.mode).toBe("degraded");
  });

  it("enters degraded when queueDepth exceeds 120", () => {
    const result = evaluateMode({ queueDepth: 121, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
  });

  it("does NOT enter degraded when queueDepth is exactly 120 (boundary)", () => {
    const result = evaluateMode({ queueDepth: 120, contaminationRate: 0.05, confidenceDrift: 0.1 });
    expect(result.mode).toBe("normal");
  });

  it("uses priority_first policy when in degraded mode with queueDepth > 100", () => {
    const result = evaluateMode({ queueDepth: 101, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("priority_first");
  });

  it("uses balanced policy when in degraded mode with queueDepth <= 100", () => {
    const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.mode).toBe("degraded");
    expect(result.policy).toBe("balanced");
  });

  it("includes degraded reason when in degraded mode", () => {
    const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(result.reasons).toContain("load or evidence quality degraded");
  });
});

describe("evaluateMode - normal mode", () => {
  it("uses balanced policy in normal mode regardless of queueDepth", () => {
    const result = evaluateMode({ queueDepth: 5, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.mode).toBe("normal");
    expect(result.policy).toBe("balanced");
  });

  it("includes nominal reason in normal mode", () => {
    const result = evaluateMode({ queueDepth: 5, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(result.reasons).toContain("nominal operating envelope");
  });

  it("returns exactly one reason in each mode", () => {
    const normal = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.05 });
    expect(normal.reasons).toHaveLength(1);

    const degraded = evaluateMode({ queueDepth: 10, contaminationRate: 0.16, confidenceDrift: 0.1 });
    expect(degraded.reasons).toHaveLength(1);

    const containment = evaluateMode({ queueDepth: 10, contaminationRate: 0.35, confidenceDrift: 0.1 });
    expect(containment.reasons).toHaveLength(1);
  });
});