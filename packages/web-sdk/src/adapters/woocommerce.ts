import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** Stub — WooCommerce adapter. Implement when targeting WP/WC stores. */
export class WooCommerceAdapter implements EcommerceAdapter {
  detectProductPage(): boolean { return document.body.classList.contains("single-product"); }
  getProductId(): string | null { return document.querySelector<HTMLInputElement>('input[name="add-to-cart"]')?.value ?? null; }
  getCartId(): string | null { return null; }
  getOrderId(): string | null { return document.querySelector(".woocommerce-order-overview__order strong")?.textContent?.trim() ?? null; }
  getUserId(): string | null { return null; }
  trackAddToCart(_productId: string): void { /* TODO */ }
  trackCheckout(_cartId: string): void { /* TODO */ }
  trackPayment(_orderId: string, _gatewayName: string): void { /* TODO */ }
  trackInvoice(_orderId: string): void { /* TODO */ }
}
