export type IncidentSeverity = "info" | "warning" | "major" | "critical" | "revenue_blocking";
export type IncidentStatus = "open" | "investigating" | "recovering" | "resolved" | "false_alarm";

export interface Incident {
  incidentId: string;
  storeId: string;
  sessionId: string;
  ruleCode: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedStage: string;
  buyerContact?: string;        // masked — last 4 digits only
  orderId?: string;
  cartId?: string;
  paymentAttemptId?: string;
  rootCauseGuess: string;
  recommendedAction: string;
  autoRetryPossible: boolean;
  timeline: IncidentTimelineEntry[];
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  revenueAtRisk?: number;
}

export interface IncidentTimelineEntry {
  at: string;
  message: string;
  actor: "system" | "admin" | "auto-recovery";
}
