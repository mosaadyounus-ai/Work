import { MAX_STEPS } from "./attractor.js";
import type { Edge } from "./edges.js";
import type { Node } from "./parseNodeMap.js";
import type { RuntimeState } from "./runtimeState.js";
import { assertRuntimeInvariant } from "./runtimeInvariant.js";

export type SimulationResult = {
  type: "ATTRACTOR" | "TRANSIENT" | "DORMANT";
  attractor_id?: string;
  state: RuntimeState;
  steps: number;
  stability: number;
};

export function simulate(
  start: string,
  adj: Map<string, Edge[]>,
  nodeMap: Map<string, Node>
): SimulationResult {
  const startNode = nodeMap.get(start);
  if (!startNode) {
    throw new Error(`Unknown start node: ${start}`);
  }

  let current = start;
  const history = [start];

  for (let steps = 0; steps < MAX_STEPS; steps += 1) {
    const currentNode = nodeMap.get(current);
    if (!currentNode) {
      throw new Error(`Unknown current node: ${current}`);
    }

    if (currentNode.dormant) {
      return {
        type: "DORMANT",
        steps,
        stability: 0,
        state: { current, steps, history: [...history] }
      };
    }

    const edges = adj.get(current) ?? [];
    if (edges.length === 0) {
      return {
        type: "ATTRACTOR",
        attractor_id: current,
        steps,
        stability: currentNode.weight,
        state: { current, steps, history: [...history] }
      };
    }

    const next = edges[0].to;
    const nextNode = nodeMap.get(next);
    if (!nextNode) {
      throw new Error(`Unknown next node: ${next}`);
    }

    assertRuntimeInvariant(currentNode, nextNode);

    if (history.includes(next)) {
      const attractorStability = nodeMap.get(next)?.weight ?? currentNode.weight;
      return {
        type: "ATTRACTOR",
        attractor_id: next,
        steps: steps + 1,
        stability: attractorStability,
        state: {
          current: next,
          steps: steps + 1,
          history: [...history, next]
        }
      };
    }

    history.push(next);
    current = next;
  }

  return {
    type: "TRANSIENT",
    steps: MAX_STEPS,
    stability: 0,
    state: {
      current,
      steps: MAX_STEPS,
      history
    }
  };
}
