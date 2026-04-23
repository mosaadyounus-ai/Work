import type { Node } from "./parseNodeMap.js";

export type Edge = {
  from: string;
  to: string;
  weight: number;
};

function idNum(nodeId: string): number {
  const numeric = Number(nodeId.replace(/\D/g, ""));
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
}

export function generateEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  const activeNodes = nodes.filter((node) => !node.dormant);

  for (const node of nodes) {
    if (node.dormant) {
      continue;
    }

    const candidates = activeNodes
      .filter((candidate) => candidate.node_id !== node.node_id)
      .sort((left, right) => {
        const distanceDelta =
          Math.abs(idNum(node.node_id) - idNum(left.node_id)) -
          Math.abs(idNum(node.node_id) - idNum(right.node_id));
        if (distanceDelta !== 0) {
          return distanceDelta;
        }

        const weightDelta = right.weight - left.weight;
        if (weightDelta !== 0) {
          return weightDelta;
        }

        return left.node_id.localeCompare(right.node_id);
      })
      .slice(0, 2);

    for (const candidate of candidates) {
      if (candidate.dormant) {
        continue;
      }

      edges.push({
        from: node.node_id,
        to: candidate.node_id,
        weight: Number(((node.weight + candidate.weight) / 2).toFixed(4))
      });
    }
  }

  return edges.sort((left, right) => {
    const fromDelta = left.from.localeCompare(right.from);
    if (fromDelta !== 0) {
      return fromDelta;
    }

    const toDelta = left.to.localeCompare(right.to);
    if (toDelta !== 0) {
      return toDelta;
    }

    return right.weight - left.weight;
  });
}

export function validateEdges(edges: Edge[], nodes: Node[]): void {
  const nodeIds = new Set(nodes.map((node) => node.node_id));
  const dormantIds = new Set(
    nodes.filter((node) => node.dormant).map((node) => node.node_id)
  );

  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Edge references unknown node: ${edge.from} -> ${edge.to}`);
    }

    if (dormantIds.has(edge.from)) {
      throw new Error(`Dormant node has outgoing edge: ${edge.from}`);
    }

    if (dormantIds.has(edge.to)) {
      throw new Error(`Dormant node is reachable: ${edge.to}`);
    }

    if (edge.from === edge.to) {
      throw new Error(`Self-loop edge not allowed: ${edge.from}`);
    }
  }
}

export function buildAdjacency(edges: Edge[]): Map<string, Edge[]> {
  const adjacency = new Map<string, Edge[]>();
  for (const edge of edges) {
    const existing = adjacency.get(edge.from) ?? [];
    adjacency.set(edge.from, [...existing, edge]);
  }

  for (const [key, candidates] of adjacency.entries()) {
    const sorted = [...candidates].sort((left, right) => {
      if (right.weight !== left.weight) {
        return right.weight - left.weight;
      }
      return left.to.localeCompare(right.to);
    });
    adjacency.set(key, sorted);
  }

  return adjacency;
}
