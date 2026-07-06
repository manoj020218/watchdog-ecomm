export type { EcommerceAdapter, AdapterName } from "@commerce-watchdog/shared";

// Custom React+Node adapter (fully implemented in web-sdk)
export { CustomReactNodeAdapter } from "./custom-react-node.js";

// Platform stubs — implement by following the EcommerceAdapter interface
export { ShopifyAdapter } from "./shopify.js";
export { WooCommerceAdapter } from "./woocommerce.js";
export { MagentoAdapter } from "./magento.js";
export { OpenCartAdapter } from "./opencart.js";
export { PrestaShopAdapter } from "./prestashop.js";
