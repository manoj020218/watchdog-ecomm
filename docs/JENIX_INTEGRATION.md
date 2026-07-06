# Integrating Commerce Watchdog into Jenix (jenixindia.com)

This guide covers adding Commerce Watchdog to the existing Jenix React storefront.

## Step 1 — Add SDK to the front app

In `VPS/apps/front/`:

```bash
# From the jenix VPS/ directory:
pnpm add @commerce-watchdog/web-sdk --filter front
```

Or directly in `VPS/apps/front/package.json`:

```json
"dependencies": {
  "@commerce-watchdog/web-sdk": "^1.0.0"
}
```

## Step 2 — Initialise in the storefront root

In `VPS/apps/front/src/main.jsx` (or `App.jsx`), add:

```jsx
import { CommerceWatchdogSDK } from '@commerce-watchdog/web-sdk';

const watchdog = new CommerceWatchdogSDK({
  apiUrl: import.meta.env.VITE_WATCHDOG_API_URL,
  apiKey: import.meta.env.VITE_WATCHDOG_API_KEY,
  storeId: 'jenixindia',
  adapter: 'custom-react-node',
});

watchdog.init();
window.__watchdog = watchdog; // expose for page-level tracking calls
```

Add to `VPS/apps/front/.env`:

```env
VITE_WATCHDOG_API_URL=https://watchdog-api.jenixindia.com
VITE_WATCHDOG_API_KEY=key_jenix_store_key_here
```

## Step 3 — Track pipeline stages

### Product page (`product-page.jsx`)

```jsx
useEffect(() => {
  if (product?.id) window.__watchdog?.trackProductView(product.id);
}, [product?.id]);
```

### Add to cart (`product-page.jsx` — onAddToCart)

```jsx
window.__watchdog?.trackAddToCartClick(product.id);
// ... after API success:
window.__watchdog?.trackAddToCartSuccess(cartId, product.id);
```

### Cart page (`cart-page.jsx`)

```jsx
useEffect(() => {
  window.__watchdog?.trackCartView(cartId, cartTotal);
}, []);
```

### Checkout page (`checkout-page.jsx`)

```jsx
// On mount:
window.__watchdog?.trackCheckoutStarted(cartId);

// After address submit:
window.__watchdog?.trackAddressSubmitted(cartId);

// After shipping rates loaded:
window.__watchdog?.trackShippingCalculated(cartId, 200, responseTimeMs);

// Before Razorpay/Cashfree opens:
window.__watchdog?.trackPaymentInitiated(cartId, paymentAttemptId);

// In Razorpay success handler:
window.__watchdog?.trackPaymentSuccess(cartId, orderId, paymentAttemptId);
```

### Order success page (`order-success-page.jsx`)

```jsx
useEffect(() => {
  if (order?.id) {
    window.__watchdog?.trackOrderCreated(order.id, order.cartId);
    window.__watchdog?.trackOrderConfirmed(order.id);
    window.__watchdog?.trackCompleted(order.id);
  }
}, [order?.id]);
```

## Step 4 — Backend events (Node SDK)

In `VPS/backend/src/modules/cart-checkout/cart-checkout.controller.js`:

```javascript
import { CommerceWatchdogNodeClient } from '@commerce-watchdog/node-sdk';

const watchdog = new CommerceWatchdogNodeClient({
  apiUrl: process.env.WATCHDOG_API_URL,
  apiKey: process.env.WATCHDOG_API_KEY,
  storeId: 'jenixindia',
});

// In createOrder:
watchdog.track('ORDER_CREATED', { sessionId: req.session.id, orderId: order.id });

// In confirmOrder webhook:
watchdog.track('ORDER_CONFIRMED', { orderId: order.id });
```

## Step 5 — Deploy Watchdog API on VPS

```bash
# On the VPS alongside jenix-backend:
cd /root/projects/commerce-watchdog/apps/api
cp .env.example .env
# Edit .env with your MongoDB URI and API keys
pm2 start dist/index.js --name commerce-watchdog-api
pm2 save
```

Nginx config for `watchdog-api.jenixindia.com`:

```nginx
server {
    server_name watchdog-api.jenixindia.com;
    location / {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Data flow summary

```
Buyer browser
  → Web SDK batches events → POST /v1/events
      → Rule Engine evaluates each event
          → Incident created if rule fires
              → Dashboard shows alert
```
