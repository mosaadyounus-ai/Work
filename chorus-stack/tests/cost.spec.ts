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

  it("prefers same-region nodes but allows penalized fallback when needed", () => {
    const item: Item = { id: "i1", risk: 0.5, region: "us" };
    const sameRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "us" };
    const otherRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "eu" };

    expect(edgeCost(item, sameRegionNode)).toBeLessThan(edgeCost(item, otherRegionNode));

    const sameRegionNodeUnavailable: Node = { ...sameRegionNode, used: 1 };
    expect(canAssign(item, sameRegionNodeUnavailable)).toBe(false);
    expect(canAssign(item, otherRegionNode)).toBe(true);
    expect(Number.isFinite(edgeCost(item, otherRegionNode))).toBe(true);
  });

  // canAssign edge cases
  describe("canAssign", () => {
    it("returns false when node is at capacity (used === capacity)", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 2, used: 2 };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns false when node is over capacity (used > capacity)", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 3 };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns true when node has available capacity and item has no requiredTags", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 5, used: 2 };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns true when item has empty requiredTags array", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: [] };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns true when all requiredTags are present on node", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "secure"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu", "secure", "extra"] };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns false when node is missing one required tag", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu", "secure"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["gpu"] };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns false when node has no tags but item requires tags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(canAssign(item, node)).toBe(false);
    });

    it("returns false when node has empty tags array and item requires tags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["gpu"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: [] };
      expect(canAssign(item, node)).toBe(false);
    });

    it("ignores region in eligibility: mismatched region still assignable", () => {
      const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
      const node: Node = { id: "n1", capacity: 1, used: 0, region: "eu-west-1" };
      expect(canAssign(item, node)).toBe(true);
    });

    it("returns true when item has no region and node has a region", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 0, region: "us-east-1" };
      expect(canAssign(item, node)).toBe(true);
    });
  });

  // edgeCost calculations
  describe("edgeCost", () => {
    it("returns Infinity for a node at capacity", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 1 };
      expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
    });

    it("returns Infinity for a node missing required tags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["public"] };
      expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
    });

    it("includes riskPriority as negative component (higher risk = lower cost)", () => {
      const highRiskItem: Item = { id: "i1", risk: 0.9 };
      const lowRiskItem: Item = { id: "i2", risk: 0.1 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(edgeCost(highRiskItem, node)).toBeLessThan(edgeCost(lowRiskItem, node));
    });

    it("computes cost correctly for idle zero-load node", () => {
      // risk=0.5, load=0, no latency, no region penalty
      // riskPriority = -round(0.5 * 1000) = -500
      // loadPenalty = round(0 * 100) = 0
      // latencyPenalty = round(0 * 0 * 100) = 0
      // total = -500
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      expect(edgeCost(item, node)).toBe(-500);
    });

    it("computes load penalty for partially used node", () => {
      // load = 1/2 = 0.5; riskPriority = -round(0.5*1000) = -500
      // loadPenalty = round(0.5 * 100) = 50
      // total = -450
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 2, used: 1 };
      expect(edgeCost(item, node)).toBe(-450);
    });

    it("adds latency penalty proportional to load and latencySensitivity", () => {
      // load = 1/2 = 0.5; risk=0.5; latencySensitivity=0.4
      // riskPriority = -500; loadPenalty = 50; latencyPenalty = round(0.4 * 0.5 * 100) = 20
      // total = -430
      const item: Item = { id: "i1", risk: 0.5, latencySensitivity: 0.4 };
      const node: Node = { id: "n1", capacity: 2, used: 1 };
      expect(edgeCost(item, node)).toBe(-430);
    });

    it("adds 10000 region penalty when both item and node have mismatched regions", () => {
      const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
      const sameRegionNode: Node = { id: "n1", capacity: 1, used: 0, region: "us-east-1" };
      const diffRegionNode: Node = { id: "n2", capacity: 1, used: 0, region: "eu-west-1" };
      const costDiff = edgeCost(item, diffRegionNode) - edgeCost(item, sameRegionNode);
      expect(costDiff).toBe(10000);
    });

    it("does not add region penalty when item has no region", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const nodeWithRegion: Node = { id: "n1", capacity: 1, used: 0, region: "eu-west-1" };
      const nodeWithoutRegion: Node = { id: "n2", capacity: 1, used: 0 };
      expect(edgeCost(item, nodeWithRegion)).toBe(edgeCost(item, nodeWithoutRegion));
    });

    it("does not add region penalty when node has no region", () => {
      const item: Item = { id: "i1", risk: 0.5, region: "us-east-1" };
      const nodeWithoutRegion: Node = { id: "n1", capacity: 1, used: 0 };
      // -500 base, no region penalty
      expect(edgeCost(item, nodeWithoutRegion)).toBe(-500);
    });

    it("handles zero-capacity node by treating load as 1", () => {
      // capacity=0 → load=1; riskPriority=-500; loadPenalty=100
      // zero-capacity node can't be assigned to (used=0 >= capacity=0)
      // So edgeCost returns Infinity
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 0, used: 0 };
      expect(edgeCost(item, node)).toBe(Number.POSITIVE_INFINITY);
    });
  });

  // finiteEdgeCost
  describe("finiteEdgeCost", () => {
    it("returns the cost as a number when assignment is feasible", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 0 };
      const cost = finiteEdgeCost(item, node);
      expect(cost).not.toBeNull();
      expect(typeof cost).toBe("number");
      expect(Number.isFinite(cost!)).toBe(true);
    });

    it("returns null when node is at capacity", () => {
      const item: Item = { id: "i1", risk: 0.5 };
      const node: Node = { id: "n1", capacity: 1, used: 1 };
      expect(finiteEdgeCost(item, node)).toBeNull();
    });

    it("returns null when node is missing required tags", () => {
      const item: Item = { id: "i1", risk: 0.5, requiredTags: ["secure"] };
      const node: Node = { id: "n1", capacity: 1, used: 0, tags: ["public"] };
      expect(finiteEdgeCost(item, node)).toBeNull();
    });

    it("returns the same value as edgeCost when finite", () => {
      const item: Item = { id: "i1", risk: 0.8, latencySensitivity: 0.3 };
      const node: Node = { id: "n1", capacity: 4, used: 1 };
      expect(finiteEdgeCost(item, node)).toBe(edgeCost(item, node));
    });
  });
});