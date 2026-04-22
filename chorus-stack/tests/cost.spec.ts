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
  it("returns false when node is at full capacity", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 2 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node.used exceeds capacity", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 5 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when item has no requiredTags and node has space", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when requiredTags is an empty array", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: [] };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns false when node has no tags but item requires tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node is missing some required tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "ssd"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu"] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when all required tags are present on the node", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "ssd"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu", "ssd", "extra"] };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when used is less than capacity, even by 1", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 5, used: 4 };
    expect(canAssign(item, node)).toBe(true);
  });
});

describe("edgeCost", () => {
  it("returns Infinity when node is full (canAssign is false)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity when required tags are not met", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["public"] };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("computes riskPriority as negative rounded risk*1000", () => {
    const item: Item = { id: "i1", risk: 0.9 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    // riskPriority = -round(0.9 * 1000) = -900
    // loadPenalty = round(0/1 * 100) = 0
    // latencyPenalty = 0 (no latencySensitivity)
    // regionPenalty = 0
    expect(edgeCost(item, node)).toBe(-900);
  });

  it("computes load penalty based on current utilization", () => {
    const item: Item = { id: "i1", risk: 0 };
    const node: Node = { id: "n1", capacity: 4, used: 2 };
    // riskPriority = 0
    // loadPenalty = round(2/4 * 100) = 50
    // latencyPenalty = 0
    // regionPenalty = 0
    expect(edgeCost(item, node)).toBe(50);
  });

  it("adds latency penalty scaled by load and latencySensitivity", () => {
    const item: Item = { id: "i1", risk: 0, latencySensitivity: 1.0 };
    const node: Node = { id: "n1", capacity: 2, used: 1 };
    // load = 1/2 = 0.5
    // riskPriority = 0
    // loadPenalty = round(0.5 * 100) = 50
    // latencyPenalty = round(1.0 * 0.5 * 100) = 50
    // regionPenalty = 0
    expect(edgeCost(item, node)).toBe(100);
  });

  it("adds region penalty of 10000 when item and node regions differ", () => {
    const item: Item = { id: "i1", risk: 0, region: "us" };
    const node: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };
    // riskPriority = 0, loadPenalty = 0, latencyPenalty = 0, regionPenalty = 10000
    expect(edgeCost(item, node)).toBe(10000);
  });

  it("does not apply region penalty when only item has a region", () => {
    const item: Item = { id: "i1", risk: 0, region: "us" };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(edgeCost(item, node)).toBe(0);
  });

  it("does not apply region penalty when only node has a region", () => {
    const item: Item = { id: "i1", risk: 0 };
    const node: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };
    expect(edgeCost(item, node)).toBe(0);
  });

  it("does not apply region penalty when regions match", () => {
    const item: Item = { id: "i1", risk: 0, region: "us" };
    const node: Node = { id: "n1", capacity: 1, used: 0, region: "us" };
    expect(edgeCost(item, node)).toBe(0);
  });

  it("combines all cost components correctly", () => {
    const item: Item = { id: "i1", risk: 0.5, latencySensitivity: 0.5, region: "us" };
    const node: Node = { id: "n1", capacity: 4, used: 2, region: "eu" };
    // load = 2/4 = 0.5
    // riskPriority = -round(0.5 * 1000) = -500
    // loadPenalty = round(0.5 * 100) = 50
    // latencyPenalty = round(0.5 * 0.5 * 100) = 25
    // regionPenalty = 10000
    expect(edgeCost(item, node)).toBe(-500 + 50 + 25 + 10000);
  });

  it("gives lower cost to higher risk items (higher risk = more negative riskPriority)", () => {
    const item1: Item = { id: "i1", risk: 0.9 };
    const item2: Item = { id: "i2", risk: 0.1 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(edgeCost(item1, node)).toBeLessThan(edgeCost(item2, node));
  });
});

describe("finiteEdgeCost", () => {
  it("returns null when the assignment is ineligible (capacity full)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns null when required tags are not met", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: [] };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns a finite number for a valid assignment", () => {
    const item: Item = { id: "i1", risk: 0.7 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    const result = finiteEdgeCost(item, node);
    expect(result).not.toBeNull();
    expect(Number.isFinite(result as number)).toBe(true);
  });

  it("returns the same value as edgeCost when eligible", () => {
    const item: Item = { id: "i1", risk: 0.4, latencySensitivity: 0.2, region: "us" };
    const node: Node = { id: "n1", capacity: 2, used: 1, region: "us" };
    expect(finiteEdgeCost(item, node)).toBe(edgeCost(item, node));
  });
});