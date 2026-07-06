/**
 * Simulates a payment failure scenario:
 * User views product → adds to cart → reaches payment → payment fails 3 times → abandons
 */
import { randomUUID } from "crypto";

const API_URL = process.env.WATCHDOG_API_URL || "http://localhost:3100";
const API_KEY = process.env.WATCHDOG_API_KEY || "key_test";
const STORE_ID = "jenixindia-test";

const sessionId = randomUUID();
const visitorId = randomUUID();
const cartId = `cart_${Date.now()}`;
const paymentAttemptId = `pay_${Date.now()}`;

interface EventFields {
  eventId: string;
  storeId: string;
  stage: string;
  sessionId: string;
  visitorId: string;
  timestamp: string;
  cartId?: string;
  apiStatus?: number;
  apiLatencyMs?: number;
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
  console.log(`[simulate] batch sent: ${JSON.stringify(data)}`);
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log(`[simulate] Starting payment-failure scenario. Session: ${sessionId}`);

  // Normal funnel up to payment
  await sendBatch([
    event("PRODUCT_VIEWED", { metadata: { productId: "prod_001", title: "Digital Multimeter" } }),
    event("ADD_TO_CART_CLICKED"),
    event("ADD_TO_CART_SUCCESS", { cartId, metadata: { cartValue: 2499 } }),
    event("CART_VIEWED", { cartId, metadata: { cartValue: 2499 } }),
    event("CHECKOUT_STARTED", { cartId }),
    event("ADDRESS_SUBMITTED", { cartId }),
    event("SHIPPING_CALCULATED", { cartId, apiStatus: 200, apiLatencyMs: 340 }),
  ]);

  await delay(500);

  // 3 payment failures
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[simulate] Payment attempt ${attempt} — FAILED`);
    await sendBatch([
      event("PAYMENT_INITIATED", {
        cartId,
        paymentAttemptId: `${paymentAttemptId}_${attempt}`,
        apiStatus: 402,
        errorMessage: `Payment declined: insufficient funds (attempt ${attempt})`,
      }),
    ]);
    await delay(300);
  }

  // Session ends — no more events
  console.log(`[simulate] Done. Expect incidents: PAYMENT_FAILED_NO_RETRY, REPEAT_PAYMENT_FAILURES`);
  console.log(`[simulate] Dashboard: http://localhost:5173/sessions/${sessionId}`);
}

run().catch(console.error);
