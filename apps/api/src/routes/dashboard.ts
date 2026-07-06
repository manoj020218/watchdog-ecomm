import { Router } from "express";
import { EventModel } from "../models/event.model.js";
import { IncidentModel } from "../models/incident.model.js";
import { getFunnelStats, PIPELINE_ORDER } from "../modules/state-machine/index.js";
import type { PipelineStage } from "@commerce-watchdog/shared";

const router = Router();

/** GET /v1/dashboard/health?storeId=&hours=24 */
router.get("/health", async (req, res) => {
  const { storeId, hours = "24" } = req.query as Record<string, string>;
  if (!storeId) return res.status(400).json({ error: "storeId is required." });

  const fromDate = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

  const [funnelRaw, openIncidents, recentErrors] = await Promise.all([
    getFunnelStats(storeId, fromDate),
    IncidentModel.countDocuments({ storeId, status: { $in: ["open", "investigating"] } }),
    EventModel.countDocuments({ storeId, apiStatus: { $gte: 500 }, timestamp: { $gte: fromDate.toISOString() } }),
  ]);

  // Build ordered funnel with drop-off %
  const funnel = PIPELINE_ORDER.map((stage, i) => {
    const count = funnelRaw[stage] || 0;
    const prevStage: PipelineStage | null = i > 0 ? PIPELINE_ORDER[i - 1] : null;
    const prevCount = prevStage ? (funnelRaw[prevStage] || 0) : count;
    const dropOffPct = prevCount > 0 && i > 0 ? Math.round((1 - count / prevCount) * 100) : 0;
    return { stage, count, dropOffPct };
  });

  // Overall health score: 100 minus penalties
  let healthScore = 100;
  if (openIncidents > 0) healthScore -= Math.min(openIncidents * 5, 40);
  if (recentErrors > 10) healthScore -= 30;
  else if (recentErrors > 5) healthScore -= 15;
  if (funnelRaw["PAYMENT_SUCCESS"] && funnelRaw["ORDER_CREATED"]) {
    const orphanedPayments = funnelRaw["PAYMENT_SUCCESS"] - funnelRaw["ORDER_CREATED"];
    if (orphanedPayments > 0) healthScore -= Math.min(orphanedPayments * 10, 30);
  }
  healthScore = Math.max(0, healthScore);

  return res.json({
    storeId,
    period: { hours: Number(hours), from: fromDate.toISOString() },
    healthScore,
    openIncidents,
    recentApiErrors: recentErrors,
    funnel,
  });
});

/** GET /v1/dashboard/incidents-summary?storeId= */
router.get("/incidents-summary", async (req, res) => {
  const { storeId } = req.query as Record<string, string>;
  if (!storeId) return res.status(400).json({ error: "storeId is required." });

  const [bySeverity, byRule] = await Promise.all([
    IncidentModel.aggregate([
      { $match: { storeId, status: { $in: ["open", "investigating"] } } },
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]),
    IncidentModel.aggregate([
      { $match: { storeId, status: { $in: ["open", "investigating"] } } },
      { $group: { _id: "$ruleCode", count: { $sum: 1 }, severity: { $first: "$severity" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return res.json({ storeId, bySeverity, topRules: byRule });
});

export default router;
