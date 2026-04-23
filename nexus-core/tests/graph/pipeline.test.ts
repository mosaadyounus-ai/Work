import { describe, expect, test } from "vitest";
import { buildAdjacency, generateEdges, validateEdges } from "../../src/core/graph/edges.js";
import { parseNodeMap } from "../../src/core/graph/parseNodeMap.js";
import { runFullAnalysis } from "../../src/core/graph/pipeline.js";
import { simulate } from "../../src/core/graph/simulate.js";
import { validateGraph } from "../../src/core/graph/validateGraph.js";

describe("graph pipeline", () => {
  const nodes = parseNodeMap("./data/node_map.csv");

  test("graph validity", () => {
    expect(() => validateGraph(nodes)).not.toThrow();
  });

  test("edge integrity", () => {
    const edges = generateEdges(nodes);
    expect(() => validateEdges(edges, nodes)).not.toThrow();
    expect(edges.length).toBeGreaterThan(0);

    const dormant = new Set(nodes.filter((node) => node.dormant).map((node) => node.node_id));
    for (const edge of edges) {
      expect(dormant.has(edge.from)).toBe(false);
      expect(dormant.has(edge.to)).toBe(false);
    }
  });

  test("deterministic generation uses stable ordering", () => {
    expect(generateEdges(nodes)).toEqual(generateEdges(nodes));
  });

  test("simulation correctness", () => {
    const edges = generateEdges(nodes);
    const adjacency = buildAdjacency(edges);
    const nodeMap = new Map(nodes.map((node) => [node.node_id, node]));

    const start = nodes.find((node) => !node.dormant)?.node_id;
    expect(start).toBeDefined();

    const result = simulate(start as string, adjacency, nodeMap);
    expect(["ATTRACTOR", "TRANSIENT", "DORMANT"]).toContain(result.type);
    expect(result.steps).toBeGreaterThanOrEqual(0);
    expect(result.stability).toBeGreaterThanOrEqual(0);
    expect(result.stability).toBeLessThanOrEqual(1);
  });

  test("basin coverage", () => {
    const analysis = runFullAnalysis(nodes);
    expect(analysis.simulations).toHaveLength(nodes.length);

    const covered = new Set(analysis.basins.flatMap((basin) => basin.members));
    for (const simulation of analysis.simulations) {
      if (simulation.result.type === "ATTRACTOR") {
        expect(covered.has(simulation.start)).toBe(true);
      }
    }
  });
});
