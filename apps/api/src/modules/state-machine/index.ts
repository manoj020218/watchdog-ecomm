import type { PipelineStage, WatchdogEvent } from "@commerce-watchdog/shared";
import { EventModel } from "../../models/event.model.js";

/** Ordered pipeline stages for funnel analysis */
export const PIPELINE_ORDER: PipelineStage[] = [
  "PRODUCT_VIEWED",
  "ADD_TO_CART_CLICKED",
  "ADD_TO_CART_SUCCESS",
  "CART_VIEWED",
  "CHECKOUT_STARTED",
  "ADDRESS_SUBMITTED",
  "SHIPPING_CALCULATED",
  "PAYMENT_INITIATED",
  "PAYMENT_SUCCESS",
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "INVOICE_GENERATED",
  "ORDER_HISTORY_VISIBLE",
  "COMPLETED",
];

export interface SessionTimeline {
  sessionId: string;
  events: WatchdogEvent[];
  lastStage: PipelineStage | null;
  stuckAt: PipelineStage | null;
  isCompleted: boolean;
  durationMs: number | null;
}

export async function getSessionTimeline(sessionId: string): Promise<SessionTimeline> {
  const events = await EventModel
    .find({ sessionId })
    .sort({ timestamp: 1 })
    .lean();

  const lastStage = events.length > 0 ? (events[events.length - 1].stage as PipelineStage) : null;
  const isCompleted = lastStage === "COMPLETED";

  // Detect stuck: last forward-progress stage is more than 10 min ago with no completion
  const lastTs = events.length > 0 ? new Date(events[events.length - 1].timestamp).getTime() : null;
  const stuckAt = !isCompleted && lastTs && Date.now() - lastTs > 10 * 60 * 1000 ? lastStage : null;

  const firstTs = events.length > 0 ? new Date(events[0].timestamp).getTime() : null;
  const durationMs = firstTs && lastTs ? lastTs - firstTs : null;

  return { sessionId, events: events as unknown as WatchdogEvent[], lastStage, stuckAt, isCompleted, durationMs };
}

export async function getFunnelStats(storeId: string, fromDate: Date): Promise<Record<PipelineStage, number>> {
  const counts = await EventModel.aggregate([
    { $match: { storeId, timestamp: { $gte: fromDate.toISOString() } } },
    { $group: { _id: "$stage", count: { $sum: 1 } } },
  ]);

  const result: Partial<Record<PipelineStage, number>> = {};
  for (const { _id, count } of counts) result[_id as PipelineStage] = count;
  return result as Record<PipelineStage, number>;
}
