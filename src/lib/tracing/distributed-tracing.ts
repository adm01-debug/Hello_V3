export interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  timestamp: number;
  duration?: number;
  tags?: Record<string, string>;
  logs?: Array<{ timestamp: number; fields: Record<string, any> }>;
}

export class DistributedTracing {
  private activeSpans: Map<string, Trace> = [];
  private completedTraces: Trace[] = [];

  startSpan(name: string, parentSpanId?: string): Trace {
    const trace: Trace = {
      traceId: this.generateId(),
      spanId: this.generateId(),
      parentSpanId,
      name,
      timestamp: Date.now(),
      tags: {},
      logs: [],
    };

    this.activeSpans.set(trace.spanId, trace);
    return trace;
  }

  finishSpan(spanId: string) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.duration = Date.now() - span.timestamp;
      this.completedTraces.push(span);
      this.activeSpans.delete(spanId);
    }
  }

  addTag(spanId: string, key: string, value: string) {
    const span = this.activeSpans.get(spanId);
    if (span && span.tags) {
      span.tags[key] = value;
    }
  }

  log(spanId: string, fields: Record<string, any>) {
    const span = this.activeSpans.get(spanId);
    if (span && span.logs) {
      span.logs.push({ timestamp: Date.now(), fields });
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTrace(traceId: string): Trace[] {
    return this.completedTraces.filter(t => t.traceId === traceId);
  }

  exportTraces(): Trace[] {
    return [...this.completedTraces];
  }
}

export const tracing = new DistributedTracing();
