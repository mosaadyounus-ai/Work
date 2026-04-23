import { context, trace, SpanStatusCode, type Attributes, type Span, type SpanOptions } from "@opentelemetry/api";

const tracer = trace.getTracer("nexus-oracle-omega-core");

export async function withActiveSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T> | T,
  options?: SpanOptions,
): Promise<T> {
  const span = tracer.startSpan(name, options);

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      span.setAttributes(attributes);
      return await fn(span);
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function annotateSpan(span: Span, attributes: Attributes) {
  span.setAttributes(attributes);
}
