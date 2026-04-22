import { describe, expect, it } from "vitest";
import { GET } from "../app/api/solve-stream/route.js";

/**
 * Reads all chunks from a ReadableStream<Uint8Array> and decodes them as a UTF-8 string.
 */
async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join("");
}

/**
 * Parses SSE frames from a raw SSE string into an array of {event, data} objects.
 */
function parseSSEFrames(raw: string): Array<{ event: string; data: unknown }> {
  const frames: Array<{ event: string; data: unknown }> = [];
  // Split on double newlines (SSE frame separator)
  const blocks = raw.split("\n\n").filter((b) => b.trim().length > 0);
  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let dataStr = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice("event: ".length);
      } else if (line.startsWith("data: ")) {
        dataStr = line.slice("data: ".length);
      }
    }
    if (event && dataStr) {
      frames.push({ event, data: JSON.parse(dataStr) });
    }
  }
  return frames;
}

describe("GET /api/solve-stream - default payload", () => {
  it("returns a response with SSE content-type header", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("sets Cache-Control to no-cache no-transform", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    expect(res.headers.get("Cache-Control")).toBe("no-cache, no-transform");
  });

  it("sets X-Accel-Buffering to no", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    expect(res.headers.get("X-Accel-Buffering")).toBe("no");
  });

  it("emits a 'start' event as the first SSE frame", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    expect(frames[0].event).toBe("start");
  });

  it("start frame contains itemCount and nodeCount from defaults", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const startFrame = frames[0];
    expect(startFrame.event).toBe("start");
    const data = startFrame.data as Record<string, unknown>;
    // Default payload has 3 items and 2 nodes
    expect(data.itemCount).toBe(3);
    expect(data.nodeCount).toBe(2);
  });

  it("emits a 'done' event as the last SSE frame", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    expect(frames[frames.length - 1].event).toBe("done");
  });

  it("emits exactly one 'progress' event per item (3 with default data)", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const progressFrames = frames.filter((f) => f.event === "progress");
    expect(progressFrames).toHaveLength(3);
  });

  it("progress frames include step, total, itemId, nodeId, cost, and status fields", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const progressFrames = frames.filter((f) => f.event === "progress");
    for (const frame of progressFrames) {
      const data = frame.data as Record<string, unknown>;
      expect(data).toHaveProperty("step");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("itemId");
      expect(data).toHaveProperty("nodeId");
      expect(data).toHaveProperty("cost");
      expect(data).toHaveProperty("status");
    }
  });

  it("progress steps are numbered 1 to total sequentially", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const progressFrames = frames.filter((f) => f.event === "progress");
    progressFrames.forEach((frame, idx) => {
      const data = frame.data as Record<string, unknown>;
      expect(data.step).toBe(idx + 1);
      expect(data.total).toBe(3);
    });
  });

  it("done frame includes elapsedMs and assignments fields", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const doneFrame = frames[frames.length - 1];
    expect(doneFrame.event).toBe("done");
    const data = doneFrame.data as Record<string, unknown>;
    expect(data).toHaveProperty("elapsedMs");
    expect(data).toHaveProperty("assignments");
    expect(Array.isArray(data.assignments)).toBe(true);
  });

  it("done frame assignments array has one entry per node", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const doneFrame = frames[frames.length - 1];
    const data = doneFrame.data as Record<string, unknown>;
    // Default has 2 nodes
    expect((data.assignments as unknown[]).length).toBe(2);
  });
});

describe("GET /api/solve-stream - custom payload via query params", () => {
  it("uses custom items and nodes from query parameters", async () => {
    const items = [{ id: "custom-item", risk: 0.5, latencySensitivity: 0 }];
    const nodes = [{ id: "custom-node", capacity: 1, used: 0 }];
    const url = `http://localhost/api/solve-stream?items=${encodeURIComponent(JSON.stringify(items))}&nodes=${encodeURIComponent(JSON.stringify(nodes))}`;

    const req = new Request(url);
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const startFrame = frames[0];
    const data = startFrame.data as Record<string, unknown>;
    expect(data.itemCount).toBe(1);
    expect(data.nodeCount).toBe(1);
  });

  it("emits progress events matching custom item count", async () => {
    const items = [
      { id: "i1", risk: 0.3 },
      { id: "i2", risk: 0.7 }
    ];
    const nodes = [{ id: "n1", capacity: 2, used: 0 }];
    const url = `http://localhost/api/solve-stream?items=${encodeURIComponent(JSON.stringify(items))}&nodes=${encodeURIComponent(JSON.stringify(nodes))}`;

    const req = new Request(url);
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const progressFrames = frames.filter((f) => f.event === "progress");
    expect(progressFrames).toHaveLength(2);
  });

  it("reports 'unassigned' status when no node can accept an item", async () => {
    // Item has a required tag but the node does not have it
    // canAssign will return false because used >= capacity
    const items = [{ id: "i1", risk: 0.5, requiredTags: ["special"] }];
    const nodes = [{ id: "n1", capacity: 1, used: 0, tags: ["other"] }];
    const url = `http://localhost/api/solve-stream?items=${encodeURIComponent(JSON.stringify(items))}&nodes=${encodeURIComponent(JSON.stringify(nodes))}`;

    const req = new Request(url);
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const progressFrames = frames.filter((f) => f.event === "progress");
    expect(progressFrames).toHaveLength(1);
    const data = progressFrames[0].data as Record<string, unknown>;
    expect(data.status).toBe("unassigned");
    expect(data.nodeId).toBeNull();
    expect(data.cost).toBeNull();
  });

  it("reports 'assigned' status and nodeId when item is successfully placed", async () => {
    const items = [{ id: "item-a", risk: 0.5 }];
    const nodes = [{ id: "node-x", capacity: 1, used: 0 }];
    const url = `http://localhost/api/solve-stream?items=${encodeURIComponent(JSON.stringify(items))}&nodes=${encodeURIComponent(JSON.stringify(nodes))}`;

    const req = new Request(url);
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const progressFrames = frames.filter((f) => f.event === "progress");
    const data = progressFrames[0].data as Record<string, unknown>;
    expect(data.status).toBe("assigned");
    expect(data.nodeId).toBe("node-x");
    expect(typeof data.cost).toBe("number");
  });

  it("falls back to default payload when only items param is provided (missing nodes)", async () => {
    const items = [{ id: "solo", risk: 0.5 }];
    const url = `http://localhost/api/solve-stream?items=${encodeURIComponent(JSON.stringify(items))}`;

    const req = new Request(url);
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const startFrame = frames[0];
    const data = startFrame.data as Record<string, unknown>;
    // Falls back to defaults: 3 items, 2 nodes
    expect(data.itemCount).toBe(3);
    expect(data.nodeCount).toBe(2);
  });

  it("falls back to default payload when only nodes param is provided (missing items)", async () => {
    const nodes = [{ id: "n1", capacity: 1, used: 0 }];
    const url = `http://localhost/api/solve-stream?nodes=${encodeURIComponent(JSON.stringify(nodes))}`;

    const req = new Request(url);
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const startFrame = frames[0];
    const data = startFrame.data as Record<string, unknown>;
    // Falls back to defaults: 3 items, 2 nodes
    expect(data.itemCount).toBe(3);
    expect(data.nodeCount).toBe(2);
  });
});

describe("GET /api/solve-stream - frame order and structure", () => {
  it("frame sequence is: start, progress..., done", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const eventTypes = frames.map((f) => f.event);
    expect(eventTypes[0]).toBe("start");
    expect(eventTypes[eventTypes.length - 1]).toBe("done");
    const middleTypes = eventTypes.slice(1, -1);
    expect(middleTypes.every((t) => t === "progress")).toBe(true);
  });

  it("start frame contains a startedAt timestamp", async () => {
    const before = Date.now();
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const after = Date.now();
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const data = frames[0].data as Record<string, unknown>;
    expect(typeof data.startedAt).toBe("number");
    expect(data.startedAt as number).toBeGreaterThanOrEqual(before);
    expect(data.startedAt as number).toBeLessThanOrEqual(after);
  });

  it("done frame elapsedMs is a non-negative number", async () => {
    const req = new Request("http://localhost/api/solve-stream");
    const res = await GET(req);
    const body = await readStream(res.body!);
    const frames = parseSSEFrames(body);

    const doneData = frames[frames.length - 1].data as Record<string, unknown>;
    expect(typeof doneData.elapsedMs).toBe("number");
    expect(doneData.elapsedMs as number).toBeGreaterThanOrEqual(0);
  });
});