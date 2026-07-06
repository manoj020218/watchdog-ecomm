import type { PipelineStage, WatchdogEvent } from "@commerce-watchdog/shared";
import { getVisitorId, getSessionId, getBrowserInfo, getDeviceType } from "./session.js";

interface TrackerConfig {
  storeId: string;
  apiKey: string;
  apiEndpoint: string;
  flushIntervalMs: number;
}

export class EventTracker {
  private queue: WatchdogEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private config: TrackerConfig) {
    this.flushTimer = setInterval(() => this.flush(), config.flushIntervalMs);
    window.addEventListener("beforeunload", () => this.flush());
    this.captureUnhandledErrors();
  }

  track(stage: PipelineStage, extras: Partial<WatchdogEvent> = {}): void {
    const event: WatchdogEvent = {
      eventId: crypto.randomUUID(),
      storeId: this.config.storeId,
      stage,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      timestamp: new Date().toISOString(),
      url: location.href,
      browser: getBrowserInfo(),
      device: getDeviceType(),
      ...extras,
    };
    this.queue.push(event);
    // Flush immediately for critical stages
    if (["PAYMENT_SUCCESS", "PAYMENT_FAILED", "ORDER_CREATED", "FRONTEND_ERROR"].includes(stage)) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      await fetch(`${this.config.apiEndpoint}/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
        },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
    } catch {
      // Re-queue on network failure (max 1 retry)
      this.queue.unshift(...batch.slice(0, 20));
    }
  }

  private captureUnhandledErrors(): void {
    window.addEventListener("error", (e) => {
      this.track("FRONTEND_ERROR", {
        errorMessage: e.message,
        errorStack: e.error?.stack?.slice(0, 500),
        url: e.filename || location.href,
      });
    });
    window.addEventListener("unhandledrejection", (e) => {
      this.track("FRONTEND_ERROR", {
        errorMessage: String(e.reason),
      });
    });
  }

  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
  }
}
