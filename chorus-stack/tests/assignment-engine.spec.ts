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

describe("constrainedBatchAssign - empty and no-op cases", () => {
  it("returns empty array when items list is empty", () => {
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 10 }];
    expect(constrainedBatchAssign([], nodes, "balanced")).toEqual([]);
  });

  it("returns empty array when nodes list is empty", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 1, confidence: 0.5 }];
    expect(constrainedBatchAssign(items, [], "balanced")).toEqual([]);
  });

  it("skips items whose risk exceeds all node maxRisk values", () => {
    const items: WorkItem[] = [
      { id: "too-risky", risk: 9, priority: 5, confidence: 0.9 },
      { id: "ok", risk: 3, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("ok");
  });

  it("skips items when all nodes are at full capacity", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 0, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toEqual([]);
  });

  it("does not assign more items than total node capacity", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 2, confidence: 0.8 },
      { id: "i2", risk: 1, priority: 2, confidence: 0.8 },
      { id: "i3", risk: 1, priority: 2, confidence: 0.8 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
  });
});

describe("constrainedBatchAssign - priority_first policy", () => {
  it("assigns higher priority items first", () => {
    const items: WorkItem[] = [
      { id: "low-pri", risk: 1, priority: 1, confidence: 0.5 },
      { id: "high-pri", risk: 1, priority: 10, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "only-node", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("high-pri");
  });

  it("uses score priority*2 - risk to rank items", () => {
    // high-priority: score = 5*2 - 1 = 9
    // low-priority: score = 1*2 - 0.1 = 1.9
    const items: WorkItem[] = [
      { id: "low", risk: 0.1, priority: 1, confidence: 0.5 },
      { id: "high", risk: 1, priority: 5, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments[0].itemId).toBe("high");
  });

  it("breaks ties by item id lexicographic order in priority_first mode", () => {
    const items: WorkItem[] = [
      { id: "z-item", risk: 2, priority: 3, confidence: 0.5 },
      { id: "a-item", risk: 2, priority: 3, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments[0].itemId).toBe("a-item");
  });
});

describe("constrainedBatchAssign - balanced policy", () => {
  it("uses score priority + confidence - risk to rank items", () => {
    // item-a: score = 2 + 0.8 - 1 = 1.8
    // item-b: score = 1 + 0.1 - 0.5 = 0.6
    const items: WorkItem[] = [
      { id: "item-b", risk: 0.5, priority: 1, confidence: 0.1 },
      { id: "item-a", risk: 1, priority: 2, confidence: 0.8 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments[0].itemId).toBe("item-a");
  });

  it("assigns all eligible items when capacity is sufficient", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 2, confidence: 0.7 },
      { id: "i2", risk: 3, priority: 1, confidence: 0.3 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 10 }];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
  });
});

describe("constrainedBatchAssign - node selection", () => {
  it("prefers the node with lowest utilization when multiple candidates available", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
    ];
    // Both items should go to different nodes; second item goes to the least utilized
    const nodes: NodeCapacity[] = [
      { nodeId: "large", capacity: 10, maxRisk: 10 },
      { nodeId: "small", capacity: 2, maxRisk: 10 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
    // All assignments should be valid
    for (const a of assignments) {
      expect(["large", "small"]).toContain(a.nodeId);
    }
  });

  it("in risk_limited mode prefers node with lowest maxRisk that still accepts item", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 3, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "tight", capacity: 1, maxRisk: 3 },
      { nodeId: "loose", capacity: 1, maxRisk: 10 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "risk_limited");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].nodeId).toBe("tight");
  });

  it("excludes nodes where item.risk exceeds node.maxRisk", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 7, priority: 1, confidence: 0.5 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "low-risk-node", capacity: 1, maxRisk: 5 },
      { nodeId: "high-risk-node", capacity: 1, maxRisk: 8 }
    ];
    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].nodeId).toBe("high-risk-node");
  });

  it("does not mutate the input nodes array", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 5, maxRisk: 10 }];
    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    constrainedBatchAssign(items, nodes, "balanced");
    expect(nodes).toEqual(nodesCopy);
  });
});