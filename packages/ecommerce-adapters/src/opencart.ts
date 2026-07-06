import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** OpenCart adapter stub */
export const OpenCartAdapter: EcommerceAdapter = {
  name: "opencart",
  getCartValue: () => {
    const el = document.querySelector<HTMLElement>("#cart-total");
    return el ? parseFloat(el.textContent?.replace(/[^\d.]/g, "") || "0") : undefined;
  },
  getCartId: () => document.cookie.match(/PHPSESSID=([^;]+)/)?.[1],
  getUserId: () => undefined,
  getOrderId: () => {
    const match = window.location.href.match(/order_id=(\d+)/);
    return match?.[1];
  },
  getProductId: () => {
    const match = window.location.href.match(/product_id=(\d+)/);
    return match?.[1];
  },
};
