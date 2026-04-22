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

describe("constrainedBatchAssign - balanced policy", () => {
  it("assigns items in order of priority + confidence - risk (highest first)", () => {
    const items: WorkItem[] = [
      { id: "low-score", risk: 5, priority: 1, confidence: 0.1 },
      { id: "high-score", risk: 0.5, priority: 4, confidence: 0.9 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 10 },
      { nodeId: "n2", capacity: 1, maxRisk: 10 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "balanced");

    expect(assignments).toHaveLength(2);
    // high-score item assigned first, gets n1 (lowest used at time of assignment)
    expect(assignments[0].itemId).toBe("high-score");
    expect(assignments[1].itemId).toBe("low-score");
  });

  it("skips item when no eligible node has sufficient maxRisk", () => {
    const items: WorkItem[] = [
      { id: "risky", risk: 9, priority: 3, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 2, maxRisk: 5 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(0);
  });
});

describe("constrainedBatchAssign - priority_first policy", () => {
  it("assigns higher-priority item before lower-priority item", () => {
    const items: WorkItem[] = [
      { id: "low-priority", risk: 1, priority: 1, confidence: 0.5 },
      { id: "high-priority", risk: 1, priority: 5, confidence: 0.5 }
    ];

    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 10 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "priority_first");

    // Only one node slot — high-priority should win
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("high-priority");
  });

  it("uses priority*2 - risk as score, so high risk reduces priority advantage", () => {
    const items: WorkItem[] = [
      { id: "high-pri-high-risk", risk: 8, priority: 5, confidence: 0.5 },
      { id: "low-pri-low-risk", risk: 1, priority: 3, confidence: 0.5 }
    ];
    // score("high-pri-high-risk", "priority_first") = 5*2 - 8 = 2
    // score("low-pri-low-risk", "priority_first") = 3*2 - 1 = 5
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 1, maxRisk: 10 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "priority_first");
    expect(assignments).toHaveLength(1);
    expect(assignments[0].itemId).toBe("low-pri-low-risk");
  });
});

describe("constrainedBatchAssign - edge cases", () => {
  it("returns empty array when items list is empty", () => {
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 10 }];
    expect(constrainedBatchAssign([], nodes, "balanced")).toEqual([]);
  });

  it("returns empty array when nodes list is empty", () => {
    const items: WorkItem[] = [{ id: "i1", risk: 0.5, priority: 1, confidence: 0.5 }];
    expect(constrainedBatchAssign(items, [], "balanced")).toEqual([]);
  });

  it("does not assign more items than node capacity", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i3", risk: 1, priority: 1, confidence: 0.5 }
    ];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 2, maxRisk: 5 }];

    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    expect(assignments).toHaveLength(2);
    expect(assignments.every((a) => a.nodeId === "n1")).toBe(true);
  });

  it("node state starts at used=0 regardless of input (idempotent initialization)", () => {
    // Run twice with the same inputs — should produce identical results
    const items: WorkItem[] = [{ id: "i1", risk: 1, priority: 2, confidence: 0.8 }];
    const nodes: NodeCapacity[] = [{ nodeId: "n1", capacity: 1, maxRisk: 5 }];

    const first = constrainedBatchAssign(items, nodes, "balanced");
    const second = constrainedBatchAssign(items, nodes, "balanced");
    expect(first).toEqual(second);
  });

  it("prefers the node with lowest utilization when multiple eligible nodes exist", () => {
    const items: WorkItem[] = [
      { id: "i1", risk: 1, priority: 1, confidence: 0.5 },
      { id: "i2", risk: 1, priority: 1, confidence: 0.5 }
    ];
    // node-a has capacity 4 (low utilization after 1 item), node-b has capacity 1
    const nodes: NodeCapacity[] = [
      { nodeId: "node-b", capacity: 1, maxRisk: 10 },
      { nodeId: "node-a", capacity: 4, maxRisk: 10 }
    ];

    const assignments = constrainedBatchAssign(items, nodes, "balanced");
    // Both start at 0 utilization; tie broken by nodeId alphabetical order
    expect(assignments).toHaveLength(2);
    // After first assignment (to node-a, which is alphabetically first if equal utilization),
    // node-a utilization = 1/4 = 0.25, node-b = 0/1 = 0 — node-b should get second item
    const nodeIds = assignments.map((a) => a.nodeId);
    expect(nodeIds).toContain("node-a");
    expect(nodeIds).toContain("node-b");
  });

  it("item exceeding maxRisk of all nodes produces no assignment", () => {
    const items: WorkItem[] = [{ id: "too-risky", risk: 10, priority: 5, confidence: 0.9 }];
    const nodes: NodeCapacity[] = [
      { nodeId: "n1", capacity: 5, maxRisk: 5 },
      { nodeId: "n2", capacity: 5, maxRisk: 7 }
    ];
    expect(constrainedBatchAssign(items, nodes, "risk_limited")).toHaveLength(0);
  });
});