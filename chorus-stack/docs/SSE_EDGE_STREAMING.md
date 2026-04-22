# Vercel Edge SSE for solver progress

Use this when deploying on Vercel where traditional WebSocket upgrades are not available in standard Serverless Functions.

## API route

Create `app/api/solve-stream/route.ts` and keep:

- `export const runtime = "edge"`
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`
- input validation for `items` and `nodes` query params so malformed requests return `400`

## Frontend subscription

```ts
const source = new EventSource("/api/solve-stream");

source.addEventListener("start", (event) => {
  const payload = JSON.parse((event as MessageEvent).data);
  console.log("solver started", payload);
});

source.addEventListener("progress", (event) => {
  const payload = JSON.parse((event as MessageEvent).data);
  console.log("solver update", payload);
});

source.addEventListener("cancelled", (event) => {
  const payload = JSON.parse((event as MessageEvent).data);
  console.log("solver cancelled", payload);
  source.close();
});

source.addEventListener("done", (event) => {
  const payload = JSON.parse((event as MessageEvent).data);
  console.log("solver complete", payload);
  source.close();
});

source.onerror = () => {
  source.close();
};
```

## Notes

- Edge Functions use Web Standard APIs (`Request`, `Response`, `ReadableStream`) instead of Fastify handlers.
- This route emits an SSE heartbeat comment every 500ms (`: heartbeat`) and yields between progress events, helping confirm stream liveness in clients.
- If solve time can exceed your plan limits, switch to async orchestration (`POST` create job + SSE from shared state like Redis/KV).
