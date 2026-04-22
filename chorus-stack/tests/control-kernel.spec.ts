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

  // Normal mode boundary conditions
  describe("normal mode", () => {
    it("returns normal mode at all-zero input", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0, confidenceDrift: 0 });
      expect(result.mode).toBe("normal");
      expect(result.policy).toBe("balanced");
      expect(result.reasons).toContain("nominal operating envelope");
    });

    it("stays normal at exact contamination boundary (0.15 is degraded threshold, 0.14 is safe)", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0.14, confidenceDrift: 0 });
      expect(result.mode).toBe("normal");
    });

    it("stays normal at exact queueDepth boundary (120 triggers degraded, 120 stays normal as condition is >120)", () => {
      const result = evaluateMode({ queueDepth: 120, contaminationRate: 0, confidenceDrift: 0 });
      expect(result.mode).toBe("normal");
    });

    it("stays normal at exact confidenceDrift boundary (0.2 triggers degraded, 0.19 stays normal)", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0, confidenceDrift: 0.19 });
      expect(result.mode).toBe("normal");
    });

    it("uses balanced policy when normal and queueDepth <= 100", () => {
      const result = evaluateMode({ queueDepth: 50, contaminationRate: 0, confidenceDrift: 0 });
      expect(result.policy).toBe("balanced");
    });

    it("uses priority_first policy when normal but queueDepth > 100", () => {
      // queueDepth=101 is NOT enough to trigger degraded (needs >120), but selectPolicy checks >100
      const result = evaluateMode({ queueDepth: 101, contaminationRate: 0, confidenceDrift: 0 });
      expect(result.mode).toBe("normal");
      expect(result.policy).toBe("priority_first");
    });
  });

  // Degraded mode boundary conditions
  describe("degraded mode", () => {
    it("enters degraded when contaminationRate just exceeds 0.15", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0.16, confidenceDrift: 0 });
      expect(result.mode).toBe("degraded");
      expect(result.reasons).toContain("load or evidence quality degraded");
    });

    it("enters degraded when queueDepth just exceeds 120", () => {
      const result = evaluateMode({ queueDepth: 121, contaminationRate: 0, confidenceDrift: 0 });
      expect(result.mode).toBe("degraded");
    });

    it("enters degraded when confidenceDrift just exceeds 0.2", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0, confidenceDrift: 0.21 });
      expect(result.mode).toBe("degraded");
    });

    it("uses priority_first policy in degraded mode when queueDepth > 100", () => {
      const result = evaluateMode({ queueDepth: 121, contaminationRate: 0, confidenceDrift: 0 });
      expect(result.mode).toBe("degraded");
      expect(result.policy).toBe("priority_first");
    });

    it("uses balanced policy in degraded mode when queueDepth <= 100", () => {
      // degraded via contamination, queueDepth below 100
      const result = evaluateMode({ queueDepth: 50, contaminationRate: 0.2, confidenceDrift: 0 });
      expect(result.mode).toBe("degraded");
      expect(result.policy).toBe("balanced");
    });
  });

  // Containment mode
  describe("containment mode", () => {
    it("enters containment when contaminationRate just exceeds 0.3", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0.31, confidenceDrift: 0 });
      expect(result.mode).toBe("containment");
      expect(result.policy).toBe("risk_limited");
      expect(result.reasons).toContain("safety threshold exceeded");
    });

    it("enters containment when confidenceDrift just exceeds 0.4", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0, confidenceDrift: 0.41 });
      expect(result.mode).toBe("containment");
      expect(result.policy).toBe("risk_limited");
    });

    it("always uses risk_limited policy in containment regardless of queueDepth", () => {
      // Even if queueDepth would normally trigger priority_first, containment overrides
      const result = evaluateMode({ queueDepth: 500, contaminationRate: 0.5, confidenceDrift: 0 });
      expect(result.mode).toBe("containment");
      expect(result.policy).toBe("risk_limited");
    });

    it("contamination at exactly 0.3 does NOT trigger containment (condition is >0.3)", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0.3, confidenceDrift: 0 });
      expect(result.mode).not.toBe("containment");
    });

    it("confidenceDrift at exactly 0.4 does NOT trigger containment (condition is >0.4)", () => {
      const result = evaluateMode({ queueDepth: 0, contaminationRate: 0, confidenceDrift: 0.4 });
      expect(result.mode).not.toBe("containment");
    });
  });

  // Result structure
  describe("result structure", () => {
    it("always returns mode, policy, and reasons array", () => {
      const result = evaluateMode({ queueDepth: 10, contaminationRate: 0.05, confidenceDrift: 0.05 });
      expect(result).toHaveProperty("mode");
      expect(result).toHaveProperty("policy");
      expect(result).toHaveProperty("reasons");
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it("reasons array is non-empty for every mode", () => {
      const modes = [
        { queueDepth: 0, contaminationRate: 0, confidenceDrift: 0 },         // normal
        { queueDepth: 0, contaminationRate: 0.2, confidenceDrift: 0 },        // degraded
        { queueDepth: 0, contaminationRate: 0.35, confidenceDrift: 0 },       // containment
      ];
      for (const input of modes) {
        const result = evaluateMode(input);
        expect(result.reasons.length).toBeGreaterThan(0);
      }
    });
  });
});