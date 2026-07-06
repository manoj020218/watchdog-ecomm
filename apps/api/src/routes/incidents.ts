import { Router } from "express";
import { IncidentModel } from "../models/incident.model.js";

const router = Router();

/** GET /v1/incidents — list incidents with optional filters */
router.get("/", async (req, res) => {
  const { storeId, status, severity, ruleCode, limit = "50", offset = "0" } = req.query;

  const query: Record<string, unknown> = {};
  if (storeId) query.storeId = storeId;
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (ruleCode) query.ruleCode = ruleCode;

  const [total, incidents] = await Promise.all([
    IncidentModel.countDocuments(query),
    IncidentModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 200))
      .lean(),
  ]);

  return res.json({ total, incidents });
});

/** GET /v1/incidents/:incidentId */
router.get("/:incidentId", async (req, res) => {
  const incident = await IncidentModel.findOne({ incidentId: req.params.incidentId }).lean();
  if (!incident) return res.status(404).json({ error: "Incident not found." });
  return res.json(incident);
});

/** PATCH /v1/incidents/:incidentId — update status, assignment, or add timeline entry */
router.patch("/:incidentId", async (req, res) => {
  const { status, assignedTo, note, actor } = req.body as {
    status?: string;
    assignedTo?: string;
    note?: string;
    actor?: string;
  };

  const incident = await IncidentModel.findOne({ incidentId: req.params.incidentId });
  if (!incident) return res.status(404).json({ error: "Incident not found." });

  const timelineEntries: Array<{ at: string; message: string; actor?: string }> = [];

  if (status && status !== incident.status) {
    incident.status = status as "open" | "investigating" | "resolved" | "ignored";
    if (status === "resolved") incident.resolvedAt = new Date().toISOString();
    timelineEntries.push({ at: new Date().toISOString(), message: `Status changed to ${status}`, actor: actor || "user" });
  }

  if (assignedTo !== undefined) {
    incident.assignedTo = assignedTo;
    timelineEntries.push({ at: new Date().toISOString(), message: `Assigned to ${assignedTo}`, actor: actor || "user" });
  }

  if (note) {
    timelineEntries.push({ at: new Date().toISOString(), message: note, actor: actor || "user" });
  }

  incident.timeline.push(...timelineEntries);
  await incident.save();

  return res.json(incident.toObject());
});

/** POST /v1/incidents/:incidentId/resolve — quick resolve shortcut */
router.post("/:incidentId/resolve", async (req, res) => {
  const incident = await IncidentModel.findOne({ incidentId: req.params.incidentId });
  if (!incident) return res.status(404).json({ error: "Incident not found." });

  incident.status = "resolved";
  incident.resolvedAt = new Date().toISOString();
  incident.timeline.push({
    at: incident.resolvedAt,
    message: `Resolved by ${req.body.actor || "user"}`,
    actor: req.body.actor || "user",
  });
  await incident.save();

  return res.json({ success: true });
});

export default router;
