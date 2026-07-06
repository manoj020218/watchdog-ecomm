/**
 * Simulates the most critical scenario: payment succeeds but order creation fails.
 * This should trigger PAYMENT_SUCCESS_ORDER_NOT_CREATED (critical severity).
 */
import { randomUUID } from "crypto";

const API_URL = process.env.WATCHDOG_API_URL || "http://localhost:3100";
const API_KEY = process.env.WATCHDOG_API_KEY || "key_test";
const STORE_ID = "jenixindia-test";

const sessionId = randomUUID();
const visitorId = randomUUID();
const cartId = `cart_${Date.now()}`;
const orderId = `order_${Date.now()}`;

interface EventFields {
  eventId: string;
  storeId: string;
  stage: string;
  sessionId: string;
  visitorId: string;
  timestamp: string;
  cartId?: string;
  orderId?: string;
  apiStatus?: number;
  metadata?: Record<string, unknown>;
}

function event(stage: string, extra: Partial<EventFields> = {}): EventFields {
  return {
    eventId: randomUUID(),
    storeId: STORE_ID,
    stage,
    sessionId,
    visitorId,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

async function sendBatch(events: EventFields[]) {
  const res = await fetch(`${API_URL}/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-watchdog-api-key": API_KEY },
    body: JSON.stringify({ storeId: STORE_ID, events }),
  });
  const data = await res.json();
  console.log(`[simulate] ${JSON.stringify(data)}`);
}

async function run() {
  console.log(`[simulate] ORPHANED PAYMENT scenario. Session: ${sessionId}`);

  await sendBatch([
    event("PRODUCT_VIEWED"),
    event("ADD_TO_CART_SUCCESS", { cartId, metadata: { cartValue: 12500 } }),
    event("CHECKOUT_STARTED", { cartId }),
    event("ADDRESS_SUBMITTED", { cartId }),
    event("SHIPPING_CALCULATED", { cartId, apiStatus: 200 }),
    event("PAYMENT_INITIATED", { cartId }),
    // Payment succeeded but order creation DB write fails — no ORDER_CREATED ever sent
    event("PAYMENT_SUCCESS", { cartId, orderId, apiStatus: 200 }),
  ]);

  console.log(`[simulate] No ORDER_CREATED event sent — rule PAYMENT_SUCCESS_ORDER_NOT_CREATED should fire in ~5 min`);
  console.log(`[simulate] Session: http://localhost:5173/sessions/${sessionId}`);
}

run().catch(console.error);
