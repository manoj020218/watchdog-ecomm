# Commerce Watchdog — Web SDK Usage

## Tracking Methods

After `watchdog.init()`, call these at each pipeline stage:

```typescript
// Product page
watchdog.trackProductView(productId);

// Add to cart button click
watchdog.trackAddToCartClick(productId);

// After successful add-to-cart API response
watchdog.trackAddToCartSuccess(cartId, productId);

// Cart page open
watchdog.trackCartView(cartId, cartValue);

// Checkout started
watchdog.trackCheckoutStarted(cartId);

// Address form submitted
watchdog.trackAddressSubmitted(cartId);

// Shipping rates loaded
watchdog.trackShippingCalculated(cartId, apiStatus, latencyMs);

// Payment button clicked / gateway opened
watchdog.trackPaymentInitiated(cartId, paymentAttemptId);

// Payment success callback
watchdog.trackPaymentSuccess(cartId, orderId, paymentAttemptId);

// Order created in backend
watchdog.trackOrderCreated(orderId, cartId);

// Order confirmed (webhook / polling)
watchdog.trackOrderConfirmed(orderId);

// Invoice generated
watchdog.trackInvoiceGenerated(orderId);

// Order visible in buyer's account
watchdog.trackOrderHistoryVisible(orderId);

// All done
watchdog.trackCompleted(orderId);

// Capture arbitrary errors
watchdog.trackError('Payment gateway timeout', new Error('Network error'), { orderId });
```

## Automatic tracking

The SDK automatically captures:
- Unhandled JS errors (`window.onerror`)
- Unhandled promise rejections
- Browser, device, and OS info
- Session duration

## Flush behaviour

Events are batched and sent every 3 seconds, or immediately for critical events (PAYMENT_INITIATED, PAYMENT_SUCCESS, ORDER_CREATED). On page unload, the SDK uses `navigator.sendBeacon` or `fetch({ keepalive: true })` to ensure events aren't lost.
