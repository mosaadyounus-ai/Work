import { describe, expect, it } from "vitest";
import { canAssign, edgeCost, finiteEdgeCost } from "../packages/assignment-engine/src/domain/cost.js";
import type { Item, Node } from "../packages/assignment-engine/src/domain/types.js";

describe("assignment domain cost", () => {
  it("keeps region mismatch out of canAssign so mismatch remains a penalized fallback", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "us" };
    const otherRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };

    expect(canAssign(item, sameRegionNode)).toBe(true);
    expect(canAssign(item, otherRegionNode)).toBe(true);

    expect(edgeCost(item, sameRegionNode)).toBeLessThan(edgeCost(item, otherRegionNode));
  });

  it("still allows cross-region assignment when same-region capacity is unavailable", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNodeUnavailable: Node = {
      id: "n2",
      capacity: 1,
      used: 1,
      region: "us"
    };
    const otherRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };

    expect(canAssign(item, sameRegionNodeUnavailable)).toBe(false);
    expect(canAssign(item, otherRegionNode)).toBe(true);
    expect(Number.isFinite(edgeCost(item, otherRegionNode))).toBe(true);
  });
});

describe("canAssign", () => {
  it("returns false when node is at full capacity (used === capacity)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 2 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node has used more than capacity", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 3 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when item has no requiredTags", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when item has empty requiredTags array", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: [] };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns false when node is missing a required tag", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 2, used: 0, tags: ["cpu"] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node has no tags but item requires tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when node has all required tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "fast"] };
    const node: Node = { id: "n1", capacity: 2, used: 0, tags: ["fast", "gpu", "extra"] };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns false when node has only some required tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "fast"] };
    const node: Node = { id: "n1", capacity: 2, used: 0, tags: ["gpu"] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("allows cross-region assignment (region is not a hard constraint)", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
    const node: Node = { id: "n1", capacity: 1, used: 0, region: "us-west-2" };
    expect(canAssign(item, node)).toBe(true);
  });
});

describe("edgeCost", () => {
  it("returns Infinity when node is at capacity", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity when item is missing a required tag", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 2, used: 0, tags: ["public"] };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("higher risk items get lower (better) cost via riskPriority", () => {
    const highRiskItem: Item = { id: "i1", risk: 0.9 };
    const lowRiskItem: Item = { id: "i2", risk: 0.1 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(edgeCost(highRiskItem, node)).toBeLessThan(edgeCost(lowRiskItem, node));
  });

  it("higher load increases the cost (loadPenalty)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const lowLoadNode: Node = { id: "n1", capacity: 4, used: 1 };
    const highLoadNode: Node = { id: "n2", capacity: 4, used: 3 };
    expect(edgeCost(item, highLoadNode)).toBeGreaterThan(edgeCost(item, lowLoadNode));
  });

  it("latencySensitivity increases cost proportionally to load", () => {
    const sensitiveItem: Item = { id: "i1", risk: 0.5, latencySensitivity: 1.0 };
    const insensitiveItem: Item = { id: "i2", risk: 0.5, latencySensitivity: 0 };
    const node: Node = { id: "n1", capacity: 4, used: 2 };
    expect(edgeCost(sensitiveItem, node)).toBeGreaterThan(edgeCost(insensitiveItem, node));
  });

  it("cross-region assignment adds regionPenalty of 10000", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNode: Node = { id: "n1", capacity: 2, used: 0, region: "us" };
    const diffRegionNode: Node = { id: "n2", capacity: 2, used: 0, region: "eu" };
    const costDiff = edgeCost(item, diffRegionNode) - edgeCost(item, sameRegionNode);
    expect(costDiff).toBe(10_000);
  });

  it("no regionPenalty when item has no region set", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 0, region: "eu" };
    const nodeNoRegion: Node = { id: "n2", capacity: 2, used: 0 };
    expect(edgeCost(item, node)).toBe(edgeCost(item, nodeNoRegion));
  });

  it("no regionPenalty when node has no region set", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    const nodeWithRegion: Node = { id: "n2", capacity: 2, used: 0, region: "us" };
    expect(edgeCost(item, node)).toBe(edgeCost(item, nodeWithRegion));
  });

  it("computes correct cost for empty node with risk=1 and no latency", () => {
    const item: Item = { id: "i1", risk: 1.0 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    // riskPriority = -Math.round(1.0 * 1000) = -1000
    // loadPenalty = Math.round(0 * 100) = 0
    // latencyPenalty = 0
    // regionPenalty = 0
    expect(edgeCost(item, node)).toBe(-1000);
  });
});

describe("finiteEdgeCost", () => {
  it("returns null for an ineligible node (capacity full)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns null when tag constraint is not satisfied", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 2, used: 0, tags: [] };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns a finite number for an eligible node", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    const cost = finiteEdgeCost(item, node);
    expect(cost).not.toBeNull();
    expect(typeof cost).toBe("number");
    expect(Number.isFinite(cost as number)).toBe(true);
  });

  it("returns the same value as edgeCost when eligible", () => {
    const item: Item = { id: "i1", risk: 0.7, latencySensitivity: 0.3 };
    const node: Node = { id: "n1", capacity: 4, used: 2 };
    expect(finiteEdgeCost(item, node)).toBe(edgeCost(item, node));
  });
});