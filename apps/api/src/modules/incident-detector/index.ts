import { randomUUID } from "crypto";
import type { WatchdogEvent } from "@commerce-watchdog/shared";
import { evaluateEvent, type RuleMatch } from "../rule-engine/index.js";
import { IncidentModel } from "../../models/incident.model.js";

export async function detectAndCreateIncidents(event: WatchdogEvent): Promise<void> {
  const matches = await evaluateEvent(event);

  for (const match of matches) {
    await createIncidentIfNew(match);
  }
}

async function createIncidentIfNew(match: RuleMatch): Promise<void> {
  // Deduplicate: one open incident per rule + session
  const existing = await IncidentModel.findOne({
    ruleCode: match.ruleCode,
    sessionId: match.sessionId,
    status: { $in: ["open", "investigating"] },
  });

  if (existing) return;

  await IncidentModel.create({
    incidentId: randomUUID(),
    storeId: match.storeId,
    sessionId: match.sessionId,
    ruleCode: match.ruleCode,
    severity: match.severity,
    status: "open",
    affectedStage: match.affectedStage,
    orderId: match.orderId,
    cartId: match.cartId,
    paymentAttemptId: match.paymentAttemptId,
    rootCauseGuess: match.rootCauseGuess,
    recommendedAction: match.recommendedAction,
    autoRetryPossible: match.autoRetryPossible,
    revenueAtRisk: match.revenueAtRisk,
    timeline: [
      {
        at: new Date().toISOString(),
        message: `Incident auto-detected by rule "${match.ruleCode}" (${match.severity})`,
        actor: "system",
      },
    ],
    createdAt: new Date().toISOString(),
  });
}
