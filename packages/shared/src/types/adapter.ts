export interface EcommerceAdapter {
  detectProductPage(): boolean;
  getProductId(): string | null;
  getCartId(): string | null;
  getOrderId(): string | null;
  getUserId(): string | null;
  trackAddToCart(productId: string): void;
  trackCheckout(cartId: string): void;
  trackPayment(orderId: string, gatewayName: string): void;
  trackInvoice(orderId: string): void;
}

export type AdapterName =
  | "custom-react-node"
  | "woocommerce"
  | "shopify"
  | "magento"
  | "opencart"
  | "prestashop";
