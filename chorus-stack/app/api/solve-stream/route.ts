import { canAssign, edgeCost } from "../../../packages/assignment-engine/src/domain/cost.js";
import type { Item, Node } from "../../../packages/assignment-engine/src/domain/types.js";

export const runtime = "edge";

const encoder = new TextEncoder();
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

interface ParsedPayload {
  items: Item[];
  nodes: Node[];
}

function sseFrame(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function defaultPayload(): ParsedPayload {
  return {
    items: [
      { id: "w-1", risk: 0.9, latencySensitivity: 0.8, region: "us-east-1" },
      { id: "w-2", risk: 0.6, latencySensitivity: 0.4, region: "us-east-1" },
      { id: "w-3", risk: 0.3, latencySensitivity: 0.2, region: "us-west-2" }
    ],
    nodes: [
      { id: "n-a", capacity: 2, used: 0, tags: ["gpu"], region: "us-east-1" },
      { id: "n-b", capacity: 2, used: 0, tags: ["cpu"], region: "us-west-2" }
    ]
  };
}

function parsePayload(url: URL): ParsedPayload {
  const itemsParam = url.searchParams.get("items");
  const nodesParam = url.searchParams.get("nodes");

  if (!itemsParam || !nodesParam) {
    return defaultPayload();
  }

  let parsedItems: unknown;
  let parsedNodes: unknown;

  try {
    parsedItems = JSON.parse(itemsParam);
    parsedNodes = JSON.parse(nodesParam);
  } catch {
    throw new Error("Invalid JSON in query params: `items` and `nodes` must be JSON arrays.");
  }

  if (!Array.isArray(parsedItems) || !Array.isArray(parsedNodes)) {
    throw new Error("Invalid payload: `items` and `nodes` must both be arrays.");
  }

  return {
    items: parsedItems as Item[],
    nodes: parsedNodes as Node[]
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  let payload: ParsedPayload;

  try {
    payload = parsePayload(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid query payload.";
    return Response.json({ error: message }, { status: 400 });
  }

  const { items, nodes } = payload;
  const nodeState = nodes.map((node) => ({ ...node }));
  const startedAt = Date.now();
  const commit = env.VERCEL_GIT_COMMIT_SHA ?? "local-dev";
  const signal = request.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        sseFrame("start", {
          commit,
          startedAt,
          itemCount: items.length,
          nodeCount: nodes.length
        })
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 500);

      try {
        for (const [index, item] of items.entries()) {
          if (signal.aborted) {
            controller.enqueue(
              sseFrame("cancelled", {
                step: index,
                total: items.length,
                elapsedMs: Date.now() - startedAt
              })
            );
            controller.close();
            return;
          }

          const candidates = nodeState
            .filter((node) => canAssign(item, node))
            .map((node) => ({ node, cost: edgeCost(item, node) }))
            .filter((entry) => Number.isFinite(entry.cost))
            .sort((a, b) => a.cost - b.cost);

          const picked = candidates[0];

          if (picked) {
            picked.node.used += 1;
          }

          controller.enqueue(
            sseFrame("progress", {
              step: index + 1,
              total: items.length,
              itemId: item.id,
              nodeId: picked?.node.id ?? null,
              cost: picked?.cost ?? null,
              status: picked ? "assigned" : "unassigned"
            })
          );

          await wait(30);
        }

        controller.enqueue(
          sseFrame("done", {
            elapsedMs: Date.now() - startedAt,
            assignments: nodeState.map((node) => ({ id: node.id, used: node.used }))
          })
        );

        controller.close();
      } finally {
        clearInterval(heartbeat);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
