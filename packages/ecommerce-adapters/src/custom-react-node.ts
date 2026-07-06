import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** Adapter for custom React + Node.js storefronts (like Jenix) */
export const CustomReactNodeAdapter: EcommerceAdapter = {
  name: "custom-react-node",
  getCartValue: () => {
    const el = document.querySelector<HTMLElement>("[data-cart-total]");
    return el ? parseFloat(el.dataset.cartTotal || "0") : undefined;
  },
  getCartId: () => {
    const raw = localStorage.getItem("cw_cart_id") ||
      document.querySelector<HTMLElement>("[data-cart-id]")?.dataset.cartId;
    return raw || undefined;
  },
  getUserId: () => {
    const raw = localStorage.getItem("cw_user_id") ||
      document.querySelector<HTMLElement>("[data-user-id]")?.dataset.userId;
    return raw || undefined;
  },
  getOrderId: () => {
    const raw = document.querySelector<HTMLElement>("[data-order-id]")?.dataset.orderId ||
      new URLSearchParams(window.location.search).get("orderId");
    return raw || undefined;
  },
  getProductId: () => {
    return document.querySelector<HTMLElement>("[data-product-id]")?.dataset.productId || undefined;
  },
};
