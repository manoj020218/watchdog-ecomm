import type { EcommerceAdapter } from "@commerce-watchdog/shared";

/** PrestaShop adapter stub */
export const PrestaShopAdapter: EcommerceAdapter = {
  name: "prestashop",
  getCartValue: () => {
    const el = document.querySelector<HTMLElement>(".cart-summary-totals .value");
    return el ? parseFloat(el.textContent?.replace(/[^\d.]/g, "") || "0") : undefined;
  },
  getCartId: () => {
    const ps = (window as unknown as { prestashop?: { cart?: { id_cart?: string } } }).prestashop;
    return ps?.cart?.id_cart?.toString();
  },
  getUserId: () => {
    const ps = (window as unknown as { prestashop?: { customer?: { id?: string } } }).prestashop;
    return ps?.customer?.id?.toString();
  },
  getOrderId: () => {
    const el = document.querySelector<HTMLElement>("[data-id-order]");
    return el?.dataset.idOrder;
  },
  getProductId: () => {
    const ps = (window as unknown as { prestashop?: { page?: { page_name?: string }; product?: { id_product?: string } } }).prestashop;
    return ps?.product?.id_product?.toString();
  },
};
