import type { AdapterName, EcommerceAdapter, PipelineStage } from "@commerce-watchdog/shared";
import { EventTracker } from "./tracker.js";
import { CustomReactNodeAdapter } from "./adapters/custom-react-node.js";
import { WooCommerceAdapter } from "./adapters/woocommerce.js";

export interface WatchdogInitConfig {
  projectId: string;
  apiKey: string;
  environment?: "production" | "staging" | "development";
  apiEndpoint?: string;
  adapter?: AdapterName;
  flushIntervalMs?: number;
  debug?: boolean;
}

export class CommerceWatchdogSDK {
  private tracker: EventTracker;
  private adapter: EcommerceAdapter;
  private config: Required<WatchdogInitConfig>;

  constructor(rawConfig: WatchdogInitConfig) {
    this.config = {
      projectId: rawConfig.projectId,
      apiKey: rawConfig.apiKey,
      environment: rawConfig.environment ?? "production",
      apiEndpoint: rawConfig.apiEndpoint ?? "https://api.commercewatchdog.io",
      adapter: rawConfig.adapter ?? "custom-react-node",
      flushIntervalMs: rawConfig.flushIntervalMs ?? 5000,
      debug: rawConfig.debug ?? false,
    };

    this.tracker = new EventTracker({
      storeId: this.config.projectId,
      apiKey: this.config.apiKey,
      apiEndpoint: this.config.apiEndpoint,
      flushIntervalMs: this.config.flushIntervalMs,
    });

    this.adapter = this.resolveAdapter();
    this.autoTrackPageView();
  }

  /** Manually track any pipeline stage */
  track(stage: PipelineStage, extras?: Record<string, unknown>): void {
    this.tracker.track(stage, extras as never);
    if (this.config.debug) console.log("[CommerceWatchdog]", stage, extras);
  }

  /** Call after a successful add-to-cart API response */
  addToCartSuccess(productId: string): void {
    this.tracker.track("ADD_TO_CART_SUCCESS", { productId });
  }

  /** Call after a failed add-to-cart API response */
  addToCartFailed(productId: string, errorMessage: string, apiStatus?: number): void {
    this.tracker.track("ADD_TO_CART_FAILED", { productId, errorMessage, apiStatus });
  }

  /** Call when checkout page is reached */
  checkoutStarted(cartId: string): void {
    this.adapter.trackCheckout(cartId);
  }

  /** Call just before redirecting to payment gateway */
  paymentInitiated(orderId: string, gateway: string): void {
    this.adapter.trackPayment(orderId, gateway);
  }

  /** Call when payment gateway redirects back with success */
  paymentSuccess(orderId: string, paymentAttemptId: string): void {
    this.tracker.track("PAYMENT_SUCCESS", { orderId, paymentAttemptId });
  }

  /** Call when payment gateway redirects back with failure */
  paymentFailed(orderId: string, paymentAttemptId: string, errorMessage: string): void {
    this.tracker.track("PAYMENT_FAILED", { orderId, paymentAttemptId, errorMessage });
  }

  /** Call when order is created and visible to the buyer */
  orderCreated(orderId: string): void {
    this.tracker.track("ORDER_CREATED", { orderId });
  }

  /** Call when invoice download link is available */
  invoiceGenerated(orderId: string): void {
    this.adapter.trackInvoice(orderId);
  }

  /** Expose the underlying tracker for advanced use */
  getTracker(): EventTracker {
    return this.tracker;
  }

  private autoTrackPageView(): void {
    if (this.adapter.detectProductPage()) {
      this.tracker.track("PRODUCT_VIEWED", {
        productId: this.adapter.getProductId() ?? undefined,
        userId: this.adapter.getUserId() ?? undefined,
      });
    }
  }

  private resolveAdapter(): EcommerceAdapter {
    switch (this.config.adapter) {
      case "woocommerce": return new WooCommerceAdapter();
      default: return new CustomReactNodeAdapter(this.tracker);
    }
  }
}

// Browser global — script tag usage
// @ts-expect-error window global
if (typeof window !== "undefined") window.CommerceWatchdog = CommerceWatchdogSDK;
