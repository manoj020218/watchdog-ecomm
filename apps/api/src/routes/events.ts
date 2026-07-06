import { Router } from "express";
import { EventModel } from "../models/event.model.js";
import { detectAndCreateIncidents } from "../modules/incident-detector/index.js";
import type { WatchdogEvent, EventBatch } from "@commerce-watchdog/shared";

const router = Router();

/** POST /v1/events — ingest a batch of pipeline events from the Web SDK */
router.post("/", async (req, res) => {
  const body = req.body as EventBatch;

  if (!body.storeId || !Array.isArray(body.events) || body.events.length === 0) {
    return res.status(400).json({ error: "storeId and non-empty events array are required." });
  }

  if (body.events.length > 100) {
    return res.status(400).json({ error: "Maximum 100 events per batch." });
  }

  const saved: string[] = [];
  const skipped: string[] = [];

  for (const evt of body.events) {
    const event: WatchdogEvent = { ...evt, storeId: body.storeId };

    try {
      await EventModel.create(event);
      saved.push(event.eventId);

      // Run rules async — don't fail the ingest if rule evaluation errors
      detectAndCreateIncidents(event).catch((err) => {
        console.error(`[incident-detector] error for event ${event.eventId}:`, err);
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        skipped.push(event.eventId); // duplicate eventId — idempotent
      } else {
        console.error(`[events] failed to save event ${event.eventId}:`, err);
      }
    }
  }

  return res.status(202).json({ saved: saved.length, skipped: skipped.length });
});

/** GET /v1/sessions/:sessionId/timeline — full session event trace */
router.get("/sessions/:sessionId/timeline", async (req, res) => {
  const events = await EventModel
    .find({ sessionId: req.params.sessionId })
    .sort({ timestamp: 1 })
    .lean();

  return res.json({ sessionId: req.params.sessionId, events });
});

/** GET /v1/orders/:orderId/timeline — all events for an order */
router.get("/orders/:orderId/timeline", async (req, res) => {
  const events = await EventModel
    .find({ orderId: req.params.orderId })
    .sort({ timestamp: 1 })
    .lean();

  return res.json({ orderId: req.params.orderId, events });
});

export default router;
