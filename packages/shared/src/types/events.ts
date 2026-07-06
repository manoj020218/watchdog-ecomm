export type PipelineStage =
  | "PRODUCT_VIEWED"
  | "ADD_TO_CART_CLICKED"
  | "ADD_TO_CART_SUCCESS"
  | "ADD_TO_CART_FAILED"
  | "CART_VIEWED"
  | "CHECKOUT_STARTED"
  | "ADDRESS_SUBMITTED"
  | "COUPON_APPLIED"
  | "SHIPPING_CALCULATED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_REDIRECTED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ORDER_CREATED"
  | "ORDER_CONFIRMED"
  | "INVOICE_GENERATED"
  | "INVOICE_FAILED"
  | "ORDER_HISTORY_VISIBLE"
  | "COMPLETED"
  | "FRONTEND_ERROR"
  | "API_ERROR"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_INVALID";

export interface WatchdogEvent {
  eventId: string;
  storeId: string;
  stage: PipelineStage;
  sessionId: string;
  visitorId: string;
  userId?: string;
  cartId?: string;
  productId?: string;
  orderId?: string;
  paymentAttemptId?: string;
  timestamp: string;           // ISO
  url: string;
  browser?: string;
  device?: string;
  apiStatus?: number;
  apiLatencyMs?: number;
  errorMessage?: string;
  errorStack?: string;
  metadata?: Record<string, unknown>;
}

export interface EventBatch {
  events: WatchdogEvent[];
}
