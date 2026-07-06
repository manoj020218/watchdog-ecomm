import { Schema, model, Document } from "mongoose";
import type { WatchdogEvent } from "@commerce-watchdog/shared";

export interface EventDoc extends WatchdogEvent, Document {}

const EventSchema = new Schema<EventDoc>(
  {
    eventId:          { type: String, required: true, unique: true, index: true },
    storeId:          { type: String, required: true, index: true },
    stage:            { type: String, required: true },
    sessionId:        { type: String, required: true, index: true },
    visitorId:        { type: String, required: true },
    userId:           String,
    cartId:           String,
    productId:        String,
    orderId:          { type: String, index: true },
    paymentAttemptId: String,
    timestamp:        { type: String, required: true },
    url:              String,
    browser:          String,
    device:           String,
    apiStatus:        Number,
    apiLatencyMs:     Number,
    errorMessage:     String,
    errorStack:       String,
    metadata:         Schema.Types.Mixed,
  },
  { timestamps: false }
);

// Immutable — no updates allowed after insert
EventSchema.pre("save", function (next) {
  if (!this.isNew) return next(new Error("Events are immutable."));
  next();
});

export const EventModel = model<EventDoc>("Event", EventSchema);
