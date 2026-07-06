import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** Magento 2 adapter stub — implement using Magento's RequireJS/window.checkoutConfig */
export const MagentoAdapter: EcommerceAdapter = {
  name: "magento",
  getCartValue: () => {
    const cfg = (window as unknown as { checkoutConfig?: { totalsData?: { grand_total?: number } } }).checkoutConfig;
    return cfg?.totalsData?.grand_total;
  },
  getCartId: () => {
    const cfg = (window as unknown as { checkoutConfig?: { quoteData?: { entity_id?: string } } }).checkoutConfig;
    return cfg?.quoteData?.entity_id;
  },
  getUserId: () => {
    const cfg = (window as unknown as { checkoutConfig?: { customerData?: { id?: string } } }).checkoutConfig;
    return cfg?.customerData?.id;
  },
  getOrderId: () => {
    const match = window.location.href.match(/order[_-]?id[=/](\d+)/i);
    return match?.[1];
  },
  getProductId: () => {
    const form = document.querySelector<HTMLFormElement>("form[data-product-sku]");
    return form?.dataset.productId;
  },
};
