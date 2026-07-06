import { Schema, model, Document } from "mongoose";
import type { Incident } from "@commerce-watchdog/shared";

export interface IncidentDoc extends Incident, Document {}

const TimelineEntrySchema = new Schema(
  { at: String, message: String, actor: String },
  { _id: false }
);

const IncidentSchema = new Schema<IncidentDoc>(
  {
    incidentId:        { type: String, required: true, unique: true, index: true },
    storeId:           { type: String, required: true, index: true },
    sessionId:         { type: String, required: true },
    ruleCode:          { type: String, required: true },
    severity:          { type: String, required: true },
    status:            { type: String, default: "open" },
    affectedStage:     String,
    buyerContact:      String,
    orderId:           { type: String, index: true },
    cartId:            String,
    paymentAttemptId:  String,
    rootCauseGuess:    String,
    recommendedAction: String,
    autoRetryPossible: Boolean,
    timeline:          [TimelineEntrySchema],
    assignedTo:        String,
    revenueAtRisk:     Number,
    createdAt:         { type: String, required: true },
    resolvedAt:        String,
  },
  { timestamps: false }
);

export const IncidentModel = model<IncidentDoc>("Incident", IncidentSchema);
