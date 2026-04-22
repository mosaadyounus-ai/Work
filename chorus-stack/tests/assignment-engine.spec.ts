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


  it("remains deterministic across repeated identical runs", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 0.5, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 7, priority: 3, confidence: 0.2 },
      { id: "i3", risk: 7, priority: 3, confidence: 0.2 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 7 },
      { nodeId: "n2", capacity: 1, maxRisk: 7 },
      { nodeId: "n3", capacity: 1, maxRisk: 9 }
    ];

    const baseline = constrainedBatchAssign(items, nodes, "risk_limited");

    for (let i = 0; i < 5; i += 1) {
      expect(constrainedBatchAssign(items, nodes, "risk_limited")).toEqual(baseline);
    }
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
});

describe("constrainedBatchAssign - empty and trivial cases", () => {
  it("returns empty array when items list is empty", () => {
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
    expect(constrainedBatchAssign([], nodes, "balanced")).toEqual([]);
  });

  it("returns empty array when nodes list is empty", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 1, confidence: 0.5 }];
    expect(constrainedBatchAssign(items, [], "balanced")).toEqual([]);
  });

  it("returns empty array when both items and nodes are empty", () => {
    expect(constrainedBatchAssign([], [], "balanced")).toEqual([]);
  });

  it("assigns a single item to the only available node", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toEqual({ itemId: "i1", nodeId: "n1" });
  });
});

describe("constrainedBatchAssign - capacity enforcement", () => {
  it("does not assign items when all nodes are at zero capacity", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 2, priority: 2, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 0, maxRisk: 10 }];
    expect(constrainedBatchAssign(items, nodes, "balanced")).toEqual([]);
  });

  it("skips assignment when item risk exceeds all node maxRisk values", () => {
    const items: WorkItem[] = [{ id: "risky", risk: 9, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 2, maxRisk: 5 },
      { nodeId: "n2", capacity: 2, maxRisk: 7 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(0);
  });

  it("respects capacity limits and stops assigning when nodes are full", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i3", risk: 1, priority: 1, confidence: 0.5 }
    ];
    // Only capacity for 2 total
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 5 },
      { nodeId: "n2", capacity: 1, maxRisk: 5 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
  });

  it("assigns items up to node capacity across multiple nodes", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i3", risk: 1, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 2, maxRisk: 5 },
      { nodeId: "n2", capacity: 2, maxRisk: 5 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(3);
    const assignedNodeIds = assignments.map((a) => a.nodeId);
    // All assigned to known nodes
    expect(assignedNodeIds.every((id) => ["n1", "n2"].includes(id))).toBe(true);
  });
});

describe("constrainedBatchAssign - priority_first policy", () => {
  it("assigns higher-priority items first in priority_first mode", () => {
    const items: WorkItem[] = [
      { id: "low-priority", risk: 1, priority: 1, confidence: 0.5 },
      { id: "high-priority", risk: 1, priority: 10, confidence: 0.5 }
    ];
    // Only one slot available
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("high-priority");
  });

  it("uses score = priority*2 - risk so high priority dominates over risk", () => {
    const items: WorkItem[] = [
      { id: "low-risk-low-pri", risk: 0, priority: 1, confidence: 0.5 },
      { id: "high-risk-high-pri", risk: 3, priority: 5, confidence: 0.5 }
    ];
    // score for priority_first: priority*2 - risk
    // low-risk-low-pri: 1*2 - 0 = 2
    // high-risk-high-pri: 5*2 - 3 = 7 (higher wins)
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments[0].itemId).toBe("high-risk-high-pri");
  });

  it("is deterministic with priority_first policy on identical inputs", () => {
    const items: WorkItem[] = [
      { id: "b", risk: 1, priority: 5, confidence: 0.5 },
      { id: "a", risk: 1, priority: 5, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
    const first = constrainedBatchAssign(items, nodes, "priority_first");
    const second = constrainedBatchAssign(items, nodes, "priority_first");
    expect(first).toEqual(second);
  });
});

describe("constrainedBatchAssign - balanced policy", () => {
  it("uses score = priority + confidence - risk in balanced mode", () => {
    // high-conf item should beat low-conf item when priority and risk are equal
    const items: WorkItem[] = [
      { id: "low-conf", risk: 1, priority: 3, confidence: 0.1 },
      { id: "high-conf", risk: 1, priority: 3, confidence: 0.9 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments[0].itemId).toBe("high-conf");
  });

  it("assigns all items when capacity is sufficient", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 2, priority: 2, confidence: 0.7 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
    const itemIds = assignments.map((a) => a.itemId).sort();
    expect(itemIds).toEqual(["i1", "i2"]);
  });
});

describe("constrainedBatchAssign - risk_limited policy", () => {
  it("skips items whose risk exceeds node maxRisk", () => {
    const items: WorkItem[] = [
      { id: "safe", risk: 3, priority: 1, confidence: 0.5 },
      { id: "risky", risk: 9, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("safe");
  });

  it("assigns item to node with lowest maxRisk that still accepts it in risk_limited mode", () => {
    const item: WorkItem = { id: "i1", risk: 3, priority: 1, confidence: 0.5 };
    const nodes: NodeCapacity[] = [
      { nodeId: "tight", capacity: 1, maxRisk: 3 },
      { nodeId: "permissive", capacity: 1, maxRisk: 10 }
    ];
    // risk_limited prefers tightest node that accepts the item
    const assignments = constrainedBatchAssign([item], nodes, "risk_limited");
    expect(assignments[0].nodeId).toBe("tight");
  });

  it("falls back to permissive node when tight node is full", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 3, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 3, priority: 1, confidence: 0.4 }
    ];
    const nodes: NodeCapacity[] = [
      { nodeId: "tight", capacity: 1, maxRisk: 3 },
      { nodeId: "permissive", capacity: 1, maxRisk: 10 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(assignments).toHaveLength(2);
    const nodeIds = assignments.map((a) => a.nodeId).sort();
    expect(nodeIds).toEqual(["permissive", "tight"]);
  });
});

describe("constrainedBatchAssign - node selection utilization preference", () => {
  it("prefers less utilized node when multiple nodes are available", () => {
    // In balanced mode: sort by utilization (ascending) when other criteria tie
    // Make a node artificially more utilized by pre-filling it
    const items: WorkItem[] = [
      // First item fills n1
      { id: "filler", risk: 1, priority: 5, confidence: 0.9 },
      // Second item should go to n2 (n1 is now full), then n3 which is empty
      { id: "target", risk: 1, priority: 1, confidence: 0.1 }
    ];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 10 },
      { nodeId: "n2", capacity: 2, maxRisk: 10 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    // filler goes to n1 (highest score gets first pick)
    // target goes to n2 (n1 is full)
    const fillerAssignment = assignments.find((a) => a.itemId === "filler");
    const targetAssignment = assignments.find((a) => a.itemId === "target");
    expect(fillerAssignment?.nodeId).toBe("n1");
    expect(targetAssignment?.nodeId).toBe("n2");
  });
});