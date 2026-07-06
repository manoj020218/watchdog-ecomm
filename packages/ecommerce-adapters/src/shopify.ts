import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** Shopify adapter — reads from Shopify's global window.Shopify and cart API */
export const ShopifyAdapter: EcommerceAdapter = {
  name: "shopify",
  getCartValue: () => {
    const shopify = (window as unknown as { Shopify?: { checkout?: { total_price?: number } } }).Shopify;
    return shopify?.checkout?.total_price ? shopify.checkout.total_price / 100 : undefined;
  },
  getCartId: () => {
    const shopify = (window as unknown as { Shopify?: { checkout?: { token?: string } } }).Shopify;
    return shopify?.checkout?.token;
  },
  getUserId: () => {
    const shopify = (window as unknown as { Shopify?: { customer?: { id?: string } } }).Shopify;
    return shopify?.customer?.id?.toString();
  },
  getOrderId: () => {
    const shopify = (window as unknown as { Shopify?: { checkout?: { order_id?: string } } }).Shopify;
    return shopify?.checkout?.order_id?.toString();
  },
  getProductId: () => {
    const shopify = (window as unknown as { ShopifyAnalytics?: { meta?: { product?: { id?: string } } } }).ShopifyAnalytics;
    return shopify?.meta?.product?.id?.toString();
  },
};
