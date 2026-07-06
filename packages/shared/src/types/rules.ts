import type { IncidentSeverity } from "./incident.js";

export interface WatchdogRule {
  ruleCode: string;
  description: string;
  severity: IncidentSeverity;
  // window in seconds to detect the anomaly
  windowSeconds: number;
  // human-readable condition
  condition: string;
  rootCauseGuess: string;
  recommendedAction: string;
  autoRetryPossible: boolean;
  enabled: boolean;
}
