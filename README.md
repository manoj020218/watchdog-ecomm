# Commerce Watchdog

**Real-time e-commerce pipeline monitoring, incident detection, and revenue recovery.**

Monitors every step of the buyer journey — product view → add to cart → checkout → payment → order — and automatically creates incidents when something breaks or stalls.

---

## What it does

- **Pipeline tracking** — 14-stage funnel from product view to order completion
- **Rule engine** — 10 built-in rules detect payment failures, abandoned checkouts, orphaned payments, missing invoices, and more
- **Incident management** — auto-created incidents with root cause guess, recommended action, and severity
- **Live dashboard** — funnel visualisation, health score, incident list, session timeline debugger
- **Multi-platform** — adapters for custom React/Node, Shopify, WooCommerce, Magento, OpenCart, PrestaShop

## Architecture

```
packages/
  shared/          — TypeScript types (events, incidents, rules, adapters)
  web-sdk/         — Browser SDK (embed on any storefront, <1kb gzipped core)
  node-sdk/        — Server-side SDK + Express middleware
  ecommerce-adapters/ — Platform adapters

apps/
  api/             — Node.js/Express API + MongoDB (event ingestion, rule engine)
  dashboard/       — React dashboard (funnel, incidents, session trace)

docs/
  INSTALL.md
  SDK_USAGE.md
  JENIX_INTEGRATION.md
```

## Quick start

See [docs/INSTALL.md](docs/INSTALL.md).

## Sell as a plugin

Commerce Watchdog is designed to be sold as a standalone SaaS plugin:

1. Deploy `apps/api` as a hosted service (one instance serves multiple stores via `storeId`)
2. Each customer gets a unique `apiKey` scoped to their `storeId`
3. Customers embed the Web SDK snippet in their storefront
4. Access the dashboard at your hosted URL or embed it into their admin panel via iframe

**Pricing model suggestion:** Per-store monthly subscription. Free tier: 10,000 events/month. Pro: unlimited events + email/SMS alerts.

## Built-in rules

| Code | Severity | Trigger |
|------|----------|---------|
| PAYMENT_FAILED_NO_RETRY | critical | Payment failure with no retry in 15 min |
| PAYMENT_SUCCESS_ORDER_NOT_CREATED | critical | Payment taken but no order created |
| ORDER_CREATED_NO_CONFIRMATION | critical | Order created but not confirmed in 5 min |
| API_ERROR_SPIKE | critical | 10+ 5xx errors in 5-minute window |
| CHECKOUT_ABANDONED_AFTER_ADDRESS | high | Abandoned after address entry |
| CART_ABANDONED_HIGH_VALUE | high | Cart > ₹5000 abandoned |
| ORDER_HISTORY_MISSING | high | Order not visible to buyer |
| REPEAT_PAYMENT_FAILURES | high | 3+ failures in session |
| INVOICE_NOT_GENERATED | medium | Invoice missing after 10 min |
| SHIPPING_CALCULATION_FAILED | medium | Shipping API slow or errored |

## License

MIT — sell freely, modify freely, attribution appreciated.
