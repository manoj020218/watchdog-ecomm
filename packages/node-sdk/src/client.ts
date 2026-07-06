import { randomUUID } from "crypto";
import type { WatchdogEvent, EventBatch, PipelineStage } from "@commerce-watchdog/shared";

export interface NodeSDKConfig {
  apiUrl: string;
  apiKey: string;
  storeId: string;
  /** Flush interval in ms. Default: 2000 */
  flushIntervalMs?: number;
  /** Maximum events per batch. Default: 50 */
  batchSize?: number;
}

export class CommerceWatchdogNodeClient {
  private queue: WatchdogEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private cfg: Required<NodeSDKConfig>;

  constructor(config: NodeSDKConfig) {
    this.cfg = {
      flushIntervalMs: 2000,
      batchSize: 50,
      ...config,
    };
    this.flushTimer = setInterval(() => this.flush(), this.cfg.flushIntervalMs);
    if (typeof process !== "undefined") {
      process.on("beforeExit", () => this.flush());
      process.on("SIGTERM", () => this.flush());
    }
  }

  track(stage: PipelineStage, fields: Partial<WatchdogEvent> = {}): void {
    const event: WatchdogEvent = {
      eventId: randomUUID(),
      storeId: this.cfg.storeId,
      stage,
      sessionId: fields.sessionId || "server-generated",
      visitorId: fields.visitorId || "server",
      timestamp: new Date().toISOString(),
      ...fields,
    };
    this.queue.push(event);
    if (this.queue.length >= this.cfg.batchSize) this.flush();
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch: WatchdogEvent[] = this.queue.splice(0, this.cfg.batchSize);
    const payload: EventBatch = { storeId: this.cfg.storeId, events: batch };

    try {
      await fetch(`${this.cfg.apiUrl}/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-watchdog-api-key": this.cfg.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[CommerceWatchdog] flush failed:", err);
      // Re-queue events that failed (up to queue limit)
      this.queue.unshift(...batch.slice(0, 100 - this.queue.length));
    }
  }

  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flush();
  }
}
