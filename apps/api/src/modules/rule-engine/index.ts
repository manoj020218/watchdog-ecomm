import type { WatchdogEvent } from "@commerce-watchdog/shared";
import { BUILT_IN_RULES } from "./rules.config.js";
import { EventModel } from "../../models/event.model.js";

export interface RuleMatch {
  ruleCode: string;
  severity: string;
  sessionId: string;
  storeId: string;
  affectedStage: string;
  rootCauseGuess: string;
  recommendedAction: string;
  autoRetryPossible: boolean;
  revenueAtRisk?: number;
  orderId?: string;
  cartId?: string;
  paymentAttemptId?: string;
}

export async function evaluateEvent(event: WatchdogEvent): Promise<RuleMatch[]> {
  const matches: RuleMatch[] = [];

  for (const rule of BUILT_IN_RULES) {
    if (!rule.triggerStages.includes(event.stage as never)) continue;

    const match = await checkRule(rule.ruleCode, event);
    if (match) matches.push(match);
  }

  return matches;
}

async function checkRule(ruleCode: string, event: WatchdogEvent): Promise<RuleMatch | null> {
  const base: Omit<RuleMatch, "ruleCode" | "severity" | "rootCauseGuess"> = {
    sessionId: event.sessionId,
    storeId: event.storeId,
    affectedStage: event.stage,
    recommendedAction: BUILT_IN_RULES.find((r) => r.ruleCode === ruleCode)!.recommendedAction,
    autoRetryPossible: BUILT_IN_RULES.find((r) => r.ruleCode === ruleCode)!.autoRetryPossible,
    orderId: event.orderId,
    cartId: event.cartId,
    paymentAttemptId: event.paymentAttemptId,
  };
  const rule = BUILT_IN_RULES.find((r) => r.ruleCode === ruleCode)!;

  switch (ruleCode) {
    case "PAYMENT_FAILED_NO_RETRY": {
      if (event.apiStatus && event.apiStatus >= 400) {
        const cutoff = new Date(new Date(event.timestamp).getTime() + 15 * 60 * 1000).toISOString();
        const retry = await EventModel.findOne({
          sessionId: event.sessionId,
          stage: "PAYMENT_INITIATED",
          timestamp: { $gt: event.timestamp, $lt: cutoff },
        });
        if (!retry) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "Payment gateway rejected; no retry attempted" };
      }
      return null;
    }

    case "CHECKOUT_ABANDONED_AFTER_ADDRESS": {
      const cutoff = new Date(new Date(event.timestamp).getTime() + 20 * 60 * 1000).toISOString();
      const paymentEvent = await EventModel.findOne({
        sessionId: event.sessionId,
        stage: "PAYMENT_INITIATED",
        timestamp: { $gt: event.timestamp, $lt: cutoff },
      });
      if (!paymentEvent) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "User stopped after address entry" };
      return null;
    }

    case "CART_ABANDONED_HIGH_VALUE": {
      const cartValue = (event.metadata as Record<string, number>)?.cartValue;
      if (cartValue && cartValue > 5000) {
        const cutoff = new Date(new Date(event.timestamp).getTime() + 30 * 60 * 1000).toISOString();
        const checkoutEvent = await EventModel.findOne({
          sessionId: event.sessionId,
          stage: "CHECKOUT_STARTED",
          timestamp: { $gt: event.timestamp, $lt: cutoff },
        });
        if (!checkoutEvent) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "High-value cart abandoned without checkout", revenueAtRisk: cartValue };
      }
      return null;
    }

    case "ORDER_CREATED_NO_CONFIRMATION": {
      const cutoff = new Date(new Date(event.timestamp).getTime() + 5 * 60 * 1000).toISOString();
      const confirmed = await EventModel.findOne({
        sessionId: event.sessionId,
        stage: "ORDER_CONFIRMED",
        orderId: event.orderId,
        timestamp: { $gt: event.timestamp, $lt: cutoff },
      });
      if (!confirmed) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "Order created but confirmation webhook never fired" };
      return null;
    }

    case "INVOICE_NOT_GENERATED": {
      const cutoff = new Date(new Date(event.timestamp).getTime() + 10 * 60 * 1000).toISOString();
      const invoiced = await EventModel.findOne({
        sessionId: event.sessionId,
        stage: "INVOICE_GENERATED",
        orderId: event.orderId,
        timestamp: { $gt: event.timestamp, $lt: cutoff },
      });
      if (!invoiced) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "Invoice generation service did not respond" };
      return null;
    }

    case "ORDER_HISTORY_MISSING": {
      const cutoff = new Date(new Date(event.timestamp).getTime() + 15 * 60 * 1000).toISOString();
      const visible = await EventModel.findOne({
        sessionId: event.sessionId,
        stage: "ORDER_HISTORY_VISIBLE",
        orderId: event.orderId,
        timestamp: { $gt: event.timestamp, $lt: cutoff },
      });
      if (!visible) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "Order not appearing in buyer's order history" };
      return null;
    }

    case "PAYMENT_SUCCESS_ORDER_NOT_CREATED": {
      const cutoff = new Date(new Date(event.timestamp).getTime() + 5 * 60 * 1000).toISOString();
      const ordered = await EventModel.findOne({
        sessionId: event.sessionId,
        stage: "ORDER_CREATED",
        timestamp: { $gt: event.timestamp, $lt: cutoff },
      });
      if (!ordered) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: "Payment collected but order creation failed — URGENT" };
      return null;
    }

    case "SHIPPING_CALCULATION_FAILED": {
      if ((event.apiStatus && event.apiStatus >= 400) || (event.apiLatencyMs && event.apiLatencyMs > 8000)) {
        return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: `Shipping API issue: status=${event.apiStatus} latency=${event.apiLatencyMs}ms` };
      }
      return null;
    }

    case "REPEAT_PAYMENT_FAILURES": {
      const failures = await EventModel.countDocuments({
        sessionId: event.sessionId,
        stage: "PAYMENT_INITIATED",
        apiStatus: { $gte: 400 },
      });
      if (failures >= 3) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: `${failures} payment failures in session — possible card/UPI issue` };
      return null;
    }

    case "API_ERROR_SPIKE": {
      const windowStart = new Date(new Date(event.timestamp).getTime() - 5 * 60 * 1000).toISOString();
      const errorCount = await EventModel.countDocuments({
        storeId: event.storeId,
        apiStatus: { $gte: 500 },
        timestamp: { $gte: windowStart, $lte: event.timestamp },
      });
      if (errorCount > 10) return { ...base, ruleCode, severity: rule.severity, rootCauseGuess: `${errorCount} API 5xx errors in last 5 minutes` };
      return null;
    }

    default:
      return null;
  }
}
