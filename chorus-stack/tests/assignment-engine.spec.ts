import { describe, expect, it } from "vitest";
import { constrainedBatchAssign } from "../packages/assignment-engine/src/index.js";
import type { NodeCapacity, WorkItem } from "../packages/shared-types/src/index.js";

describe("assignment engine", () => {
  it("prioritizes constrained high-risk items in risk_limited mode", () => {
    const items: WorkItem[] = [
      { id: "low-1", risk: 2, priority: 1, confidence: 0.9 },
      { id: "high-1", risk: 8, priority: 1, confidence: 0.2 },
      { id: "high-2", risk: 8, priority: 1, confidence: 0.1 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "restricted-a", capacity: 1, maxRisk: 8 },
      { nodeId: "restricted-b", capacity: 1, maxRisk: 8 },
      { nodeId: "permissive", capacity: 1, maxRisk: 10 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");

    expect(assignments).toHaveLength(3);
    expect(assignments).toEqual([
      { itemId: "high-1", nodeId: "restricted-a" },
      { itemId: "high-2", nodeId: "restricted-b" },
      { itemId: "low-1", nodeId: "permissive" }
    ]);
  });

  it("produces identical output regardless of item and node order", () => {
    const inputA = {
      items: [
        { id: "i2", risk: 7, priority: 3, confidence: 0.2 },
        { id: "i1", risk: 7, priority: 3, confidence: 0.2 },
        { id: "i3", risk: 0.5, priority: 1, confidence: 0.5 }
      ] satisfies WorkItem[],
      nodes: [
        { nodeId: "n2", capacity: 1, maxRisk: 7 },
        { nodeId: "n3", capacity: 1, maxRisk: 9 },
        { nodeId: "n1", capacity: 1, maxRisk: 7 }
      ] satisfies NodeCapacity[]
    };

    const inputB = {
      items: [
        { id: "i3", risk: 0.5, priority: 1, confidence: 0.5 },
        { id: "i1", risk: 7, priority: 3, confidence: 0.2 },
        { id: "i2", risk: 7, priority: 3, confidence: 0.2 }
      ] satisfies WorkItem[],
      nodes: [
        { nodeId: "n1", capacity: 1, maxRisk: 7 },
        { nodeId: "n2", capacity: 1, maxRisk: 7 },
        { nodeId: "n3", capacity: 1, maxRisk: 9 }
      ] satisfies NodeCapacity[]
    };

    const a = constrainedBatchAssign(inputA.items, inputA.nodes, "risk_limited");
    const b = constrainedBatchAssign(inputB.items, inputB.nodes, "risk_limited");

    expect(a).toEqual(b);
  });

  it("is deterministic when scored values tie", () => {
    const items: WorkItem[] = [
      { id: "b-item", risk: 3, priority: 2, confidence: 0.6 },
      { id: "a-item", risk: 3, priority: 2, confidence: 0.6 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "node-b", capacity: 1, maxRisk: 9 },
      { nodeId: "node-a", capacity: 1, maxRisk: 9 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "balanced");

    expect(assignments).toEqual([
      { itemId: "a-item", nodeId: "node-a" },
      { itemId: "b-item", nodeId: "node-b" }
    ]);
  });

  // Empty inputs
  describe("empty inputs", () => {
    it("returns empty array when items list is empty", () => {
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 10 }];
      expect(constrainedBatchAssign([], nodes, "balanced")).toEqual([]);
    });

    it("returns empty array when nodes list is empty", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 1, confidence: 0.5 }];
      expect(constrainedBatchAssign(items, [], "balanced")).toEqual([]);
    });

    it("returns empty array when both items and nodes are empty", () => {
      expect(constrainedBatchAssign([], [], "balanced")).toEqual([]);
    });
  });

  // Risk eligibility enforcement
  describe("risk eligibility enforcement", () => {
    it("does not assign item when its risk exceeds all node maxRisk values", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 9, priority: 3, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [
        { nodeId: "n1", capacity: 2, maxRisk: 5 },
        { nodeId: "n2", capacity: 2, maxRisk: 7 }
      ];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments).toEqual([]);
    });

    it("assigns item only to nodes where item.risk <= node.maxRisk", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 5, priority: 2, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [
        { nodeId: "restricted", capacity: 2, maxRisk: 4 },
        { nodeId: "permissive", capacity: 2, maxRisk: 6 }
      ];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments).toHaveLength(1);
      expect(assignments[0].nodeId).toBe("permissive");
    });

    it("assigns at exactly maxRisk boundary (risk === maxRisk is allowed)", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 5, priority: 2, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments).toHaveLength(1);
      expect(assignments[0].itemId).toBe("i1");
    });
  });

  // Capacity exhaustion
  describe("capacity exhaustion", () => {
    it("does not assign more items than node capacity allows", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 1, priority: 2, confidence: 0.5 },
        { id: "i2", risk: 1, priority: 2, confidence: 0.5 },
        { id: "i3", risk: 1, priority: 2, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments).toHaveLength(2);
    });

    it("skips items when all nodes are at full capacity", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
        { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments).toHaveLength(1);
    });

    it("spreads items across multiple nodes respecting individual capacities", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 1, priority: 2, confidence: 0.5 },
        { id: "i2", risk: 1, priority: 2, confidence: 0.5 },
        { id: "i3", risk: 1, priority: 2, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [
        { nodeId: "n1", capacity: 1, maxRisk: 10 },
        { nodeId: "n2", capacity: 2, maxRisk: 10 }
      ];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments).toHaveLength(3);
    });
  });

  // priority_first policy
  describe("priority_first policy", () => {
    it("assigns higher-priority items first", () => {
      const items: WorkItem[] = [
        { id: "low-priority", risk: 1, priority: 1, confidence: 0.5 },
        { id: "high-priority", risk: 1, priority: 5, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
      const assignments = constrainedBatchAssign(items, nodes, "priority_first");
      expect(assignments).toHaveLength(1);
      expect(assignments[0].itemId).toBe("high-priority");
    });

    it("uses score = priority*2 - risk, so high priority beats high risk for ranking", () => {
      // i1: score = 5*2 - 4 = 6; i2: score = 3*2 - 0.5 = 5.5
      const items: WorkItem[] = [
        { id: "i2", risk: 0.5, priority: 3, confidence: 0.5 },
        { id: "i1", risk: 4, priority: 5, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
      const assignments = constrainedBatchAssign(items, nodes, "priority_first");
      expect(assignments[0].itemId).toBe("i1");
    });
  });

  // balanced policy
  describe("balanced policy", () => {
    it("uses score = priority + confidence - risk", () => {
      // i1: 2 + 0.8 - 1 = 1.8; i2: 3 + 0.1 - 5 = -1.9 → i1 wins
      const items: WorkItem[] = [
        { id: "i2", risk: 5, priority: 3, confidence: 0.1 },
        { id: "i1", risk: 1, priority: 2, confidence: 0.8 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
      const assignments = constrainedBatchAssign(items, nodes, "balanced");
      expect(assignments[0].itemId).toBe("i1");
    });
  });

  // Node selection in risk_limited mode
  describe("node selection in risk_limited mode", () => {
    it("prefers node with lower maxRisk when utilization is equal", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 3, priority: 2, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [
        { nodeId: "high-limit", capacity: 5, maxRisk: 9 },
        { nodeId: "low-limit", capacity: 5, maxRisk: 4 }
      ];
      const assignments = constrainedBatchAssign(items, nodes, "risk_limited");
      expect(assignments[0].nodeId).toBe("low-limit");
    });
  });

  // Does not mutate input
  describe("input immutability", () => {
    it("does not mutate the items array", () => {
      const items: WorkItem[] = [
        { id: "i1", risk: 1, priority: 2, confidence: 0.5 },
        { id: "i2", risk: 1, priority: 2, confidence: 0.5 }
      ];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
      const originalOrder = items.map((i) => i.id);
      constrainedBatchAssign(items, nodes, "balanced");
      expect(items.map((i) => i.id)).toEqual(originalOrder);
    });

    it("does not mutate the nodes array", () => {
      const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 2, confidence: 0.5 }];
      const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
      constrainedBatchAssign(items, nodes, "balanced");
      expect(nodes[0].capacity).toBe(2);
    });
  });
});