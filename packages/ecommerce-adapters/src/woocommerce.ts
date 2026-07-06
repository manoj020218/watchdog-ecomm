import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** WooCommerce adapter — reads from wc_cart_fragments and page meta */
export const WooCommerceAdapter: EcommerceAdapter = {
  name: "woocommerce",
  getCartValue: () => {
    const el = document.querySelector<HTMLElement>(".woocommerce-Price-amount");
    if (el) return parseFloat(el.textContent?.replace(/[^\d.]/g, "") || "0");
    return undefined;
  },
  getCartId: () => {
    const match = document.cookie.match(/woocommerce_cart_hash=([^;]+)/);
    return match?.[1];
  },
  getUserId: () => {
    const body = document.body;
    const classes = Array.from(body.classList);
    const logged = classes.find((c) => c.startsWith("logged-in"));
    if (!logged) return undefined;
    // WC stores user id in wc-user-id cookie set by PHP
    const match = document.cookie.match(/wc-user-id=(\d+)/);
    return match?.[1];
  },
  getOrderId: () => {
    const match = window.location.pathname.match(/\/order-received\/(\d+)/);
    return match?.[1];
  },
  getProductId: () => {
    const input = document.querySelector<HTMLInputElement>("input[name='product_id']");
    return input?.value;
  },
};
