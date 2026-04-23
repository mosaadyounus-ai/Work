import { validateGraph } from "./validateGraph.js";
import { buildAdjacency, generateEdges, type Edge, validateEdges } from "./edges.js";
import type { Node } from "./parseNodeMap.js";
import { simulate, type SimulationResult } from "./simulate.js";

export type Basin = {
  attractorKey: string;
  members: string[];
  size: number;
};

export type SimulationRecord = {
  start: string;
  result: SimulationResult;
};

export type Analysis = {
  nodes: Node[];
  edges: Edge[];
  simulations: SimulationRecord[];
  basins: Basin[];
};

function mapBasins(simulations: SimulationRecord[]): Basin[] {
  const buckets = new Map<string, string[]>();

  for (const simulation of simulations) {
    if (simulation.result.type !== "ATTRACTOR" || !simulation.result.attractor_id) {
      continue;
    }

    const key = simulation.result.attractor_id;
    const members = buckets.get(key) ?? [];
    buckets.set(key, [...members, simulation.start]);
  }

  return [...buckets.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([attractorKey, members]) => ({
      attractorKey,
      members: [...members].sort((a, b) => a.localeCompare(b)),
      size: members.length
    }));
}

export function runFullAnalysis(nodes: Node[]): Analysis {
  validateGraph(nodes);
  const edges = generateEdges(nodes);
  validateEdges(edges, nodes);
  const adjacency = buildAdjacency(edges);
  const nodeMap = new Map(nodes.map((node) => [node.node_id, node]));

  const simulations = nodes
    .map((node) => ({
      start: node.node_id,
      result: simulate(node.node_id, adjacency, nodeMap)
    }))
    .sort((left, right) => left.start.localeCompare(right.start));

  const basins = mapBasins(simulations);

  return {
    nodes,
    edges,
    simulations,
    basins
  };
}
