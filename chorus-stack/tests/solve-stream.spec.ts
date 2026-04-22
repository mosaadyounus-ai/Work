import { describe, expect, it } from "vitest";
import { GET } from "../app/api/solve-stream/route.js";

async function readStream(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) return "";

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }

  output += decoder.decode();
  return output;
}

describe("GET /api/solve-stream", () => {
  it("returns 400 for invalid query payload", async () => {
    const request = new Request("https://example.com/api/solve-stream?items=not-json&nodes=[]");
    const response = await GET(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON in query params: `items` and `nodes` must be JSON arrays."
    });
  });

  it("streams start/progress/done events with edge SSE headers", async () => {
    const items = encodeURIComponent(JSON.stringify([{ id: "i-1", risk: 0.4, region: "us-east-1" }]));
    const nodes = encodeURIComponent(JSON.stringify([{ id: "n-1", capacity: 1, used: 0, region: "us-east-1" }]));
    const request = new Request(`https://example.com/api/solve-stream?items=${items}&nodes=${nodes}`);

    const response = await GET(request);
    const payload = await readStream(response.body);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(response.headers.get("connection")).toBe("keep-alive");

    expect(payload).toContain("event: start");
    expect(payload).toContain("event: progress");
    expect(payload).toContain('"itemId":"i-1"');
    expect(payload).toContain("event: done");
  });
});
