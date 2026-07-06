import type { EcommerceAdapter } from "@commerce-watchdog/shared";
import type { EventTracker } from "../tracker.js";

/**
 * Adapter for custom React + Node.js e-commerce sites (e.g. Jenix Commerce).
 * Reads store context from window.__CW_STORE_CONTEXT if available,
 * or falls back to DOM/URL inspection.
 */
declare global {
  interface Window {
    __CW_STORE_CONTEXT?: {
      productId?: string;
      cartId?: string;
      orderId?: string;
      userId?: string;
    };
  }
}

export class CustomReactNodeAdapter implements EcommerceAdapter {
  constructor(private tracker: EventTracker) {}

  detectProductPage(): boolean {
    return /\/products\/[^/]+/.test(location.pathname);
  }

  getProductId(): string | null {
    return window.__CW_STORE_CONTEXT?.productId ?? this.extractFromMeta("product-id");
  }

  getCartId(): string | null {
    return window.__CW_STORE_CONTEXT?.cartId ?? null;
  }

  getOrderId(): string | null {
    return window.__CW_STORE_CONTEXT?.orderId ?? this.extractFromUrl("orderId");
  }

  getUserId(): string | null {
    return window.__CW_STORE_CONTEXT?.userId ?? null;
  }

  trackAddToCart(productId: string): void {
    this.tracker.track("ADD_TO_CART_CLICKED", { productId });
  }

  trackCheckout(cartId: string): void {
    this.tracker.track("CHECKOUT_STARTED", { cartId });
  }

  trackPayment(orderId: string, gatewayName: string): void {
    this.tracker.track("PAYMENT_INITIATED", { orderId, metadata: { gateway: gatewayName } });
  }

  trackInvoice(orderId: string): void {
    this.tracker.track("INVOICE_GENERATED", { orderId });
  }

  private extractFromMeta(name: string): string | null {
    return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? null;
  }

  private extractFromUrl(param: string): string | null {
    return new URLSearchParams(location.search).get(param);
  }
}
