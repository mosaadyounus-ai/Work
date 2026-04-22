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

  it("returns false when node is over capacity (used > capacity)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 2 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns true when node has available capacity and item has no required tags", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 1 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when item has empty requiredTags array", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: [] };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns true when node has all required tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "fast"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu", "fast", "extra"] };
    expect(canAssign(item, node)).toBe(true);
  });

  it("returns false when node is missing one required tag", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "fast"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu"] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node has no tags but item requires tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(false);
  });

  it("returns false when node tags array is empty but item requires tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: [] };
    expect(canAssign(item, node)).toBe(false);
  });

  it("allows assignment when item has requiredTags and node has exactly those tags", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["secure"] };
    expect(canAssign(item, node)).toBe(true);
  });

  it("does not block assignment based on region mismatch (region is a soft preference)", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
    const node: Node = { id: "n1", capacity: 1, used: 0, region: "eu-west-1" };
    expect(canAssign(item, node)).toBe(true);
  });

  it("allows assignment when node has capacity=1 and used=0", () => {
    const item: Item = { id: "i1", risk: 0.9 };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    expect(canAssign(item, node)).toBe(true);
  });
});

describe("edgeCost", () => {
  it("returns POSITIVE_INFINITY for ineligible item-node pair (full capacity)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns POSITIVE_INFINITY when required tags are not met", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["public"] };
    expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
  });

  it("gives lower cost to higher-risk items (higher risk = higher priority = lower cost)", () => {
    const highRiskItem: Item = { id: "i1", risk: 0.9 };
    const lowRiskItem: Item = { id: "i2", risk: 0.1 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(edgeCost(highRiskItem, node)).toBeLessThan(edgeCost(lowRiskItem, node));
  });

  it("gives lower cost to lightly loaded nodes (load penalty proportional to utilization)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const lightNode: Node = { id: "n1", capacity: 4, used: 1 };  // 25% load
    const heavyNode: Node = { id: "n2", capacity: 4, used: 3 };  // 75% load
    expect(edgeCost(item, lightNode)).toBeLessThan(edgeCost(item, heavyNode));
  });

  it("adds 10000 region penalty when item and node are in different regions", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
    const sameRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "us-east-1" };
    const diffRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "eu-west-1" };
    const diff = edgeCost(item, diffRegionNode) - edgeCost(item, sameRegionNode);
    expect(diff).toBe(10_000);
  });

  it("does not apply region penalty when item has no region set", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 0, region: "us-east-1" };
    const cost = edgeCost(item, node);
    expect(cost).toBeLessThan(10_000);
  });

  it("does not apply region penalty when node has no region set", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
    const node: Node = { id: "n1", capacity: 1, used: 0 };
    const cost = edgeCost(item, node);
    expect(cost).toBeLessThan(10_000);
  });

  it("increases cost for higher latencySensitivity on a loaded node", () => {
    const lowLatItem: Item = { id: "i1", risk: 0.5, latencySensitivity: 0.1 };
    const highLatItem: Item = { id: "i2", risk: 0.5, latencySensitivity: 0.9 };
    const loadedNode: Node = { id: "n1", capacity: 2, used: 1 };  // 50% load
    expect(edgeCost(highLatItem, loadedNode)).toBeGreaterThan(edgeCost(lowLatItem, loadedNode));
  });

  it("returns 0 latency penalty when latencySensitivity is 0 on loaded node", () => {
    const item: Item = { id: "i1", risk: 0.5, latencySensitivity: 0 };
    const loadedNode: Node = { id: "n1", capacity: 2, used: 1 };
    const noLatItem: Item = { id: "i2", risk: 0.5 };
    // Both should have same cost since latencySensitivity defaults to 0
    expect(edgeCost(item, loadedNode)).toBe(edgeCost(noLatItem, loadedNode));
  });

  it("treats zero-capacity node as fully loaded (initialLoad=1)", () => {
    // A zero-capacity node should not be assignable (used=0 >= capacity=0 is false... wait)
    // canAssign: node.used >= node.capacity => 0 >= 0 is true => returns false
    // So edgeCost for zero capacity node returns Infinity
    const item: Item = { id: "i1", risk: 0.5 };
    const zeroCapNode: Node = { id: "n1", capacity: 0, used: 0 };
    expect(edgeCost(item, zeroCapNode)).toBe(Number.POSITIVE_INFINITY);
  });

  it("computes cost correctly for a zero-load node with risk=1", () => {
    // risk=1: riskPriority = -Math.round(1 * 1000) = -1000
    // load=0: loadPenalty = 0
    // latency=0: latencyPenalty = 0
    // no region penalty
    // expected = -1000
    const item: Item = { id: "i1", risk: 1 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    expect(edgeCost(item, node)).toBe(-1000);
  });
});

describe("finiteEdgeCost", () => {
  it("returns null for ineligible pair (full node)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 1, used: 1 };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns null when required tags are not met", () => {
    const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
    const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["cpu"] };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });

  it("returns a finite number for an eligible pair", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 2, used: 0 };
    const cost = finiteEdgeCost(item, node);
    expect(cost).not.toBeNull();
    expect(typeof cost).toBe("number");
    expect(Number.isFinite(cost!)).toBe(true);
  });

  it("returns the same value as edgeCost for an eligible pair", () => {
    const item: Item = { id: "i1", risk: 0.7, latencySensitivity: 0.3 };
    const node: Node = { id: "n1", capacity: 4, used: 2, region: "us-east-1" };
    expect(finiteEdgeCost(item, node)).toBe(edgeCost(item, node));
  });

  it("returns null for zero-capacity node (always ineligible)", () => {
    const item: Item = { id: "i1", risk: 0.5 };
    const node: Node = { id: "n1", capacity: 0, used: 0 };
    expect(finiteEdgeCost(item, node)).toBeNull();
  });
});