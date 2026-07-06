import type { Request, Response, NextFunction } from "express";
import type { PipelineStage } from "@commerce-watchdog/shared";
import { CommerceWatchdogNodeClient } from "./client.js";

export interface WatchdogMiddlewareOptions {
  client: CommerceWatchdogNodeClient;
  /** Map request paths to pipeline stages. e.g. { "POST /orders": "ORDER_CREATED" } */
  routeMap: Record<string, PipelineStage>;
  /** Extract sessionId from request. Defaults to header x-session-id or cookie session_id */
  getSessionId?: (req: Request) => string;
}

export function watchdogMiddleware(opts: WatchdogMiddlewareOptions) {
  return function cwMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const routeKey = `${req.method} ${req.path}`;
    const stage = opts.routeMap[routeKey];

    if (!stage) return next();

    const sessionId = opts.getSessionId
      ? opts.getSessionId(req)
      : (req.headers["x-session-id"] as string) || (req.cookies?.session_id as string) || "unknown";

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      const latencyMs = Date.now() - start;
      opts.client.track(stage, {
        sessionId,
        apiStatus: res.statusCode,
        apiLatencyMs: latencyMs,
        url: req.originalUrl,
        orderId: (body as Record<string, string>)?.orderId,
        cartId: (body as Record<string, string>)?.cartId,
        errorMessage: res.statusCode >= 400 ? JSON.stringify(body) : undefined,
      });
      return originalJson(body);
    };

    next();
  };
}
