export default function SettingsPage() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3100";
  const storeId = import.meta.env.VITE_STORE_ID || "default-store";

  return (
    <>
      <div className="cw-topbar">
        <h2>Settings</h2>
      </div>

      <div className="cw-content">
        <div className="cw-card" style={{ maxWidth: 600 }}>
          <div className="cw-card-title" style={{ marginBottom: 16 }}>Configuration</div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                API URL (VITE_API_URL)
              </label>
              <div style={{ padding: "9px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontFamily: "monospace", fontSize: 13 }}>
                {apiUrl}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Store ID (VITE_STORE_ID)
              </label>
              <div style={{ padding: "9px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontFamily: "monospace", fontSize: 13 }}>
                {storeId}
              </div>
            </div>

            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0369a1", marginBottom: 8 }}>
                To configure, update your .env file:
              </div>
              <pre style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
{`VITE_API_URL=https://your-api-domain.com
VITE_API_KEY=your_api_key_here
VITE_STORE_ID=your-store-id`}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Built-in Rules</div>
              {[
                ["PAYMENT_FAILED_NO_RETRY", "critical", "Payment failed with no retry in 15 min"],
                ["CHECKOUT_ABANDONED_AFTER_ADDRESS", "high", "User stopped after address entry"],
                ["CART_ABANDONED_HIGH_VALUE", "high", "Cart > ₹5000 abandoned without checkout"],
                ["ORDER_CREATED_NO_CONFIRMATION", "critical", "Order created but not confirmed in 5 min"],
                ["INVOICE_NOT_GENERATED", "medium", "Confirmed order missing invoice in 10 min"],
                ["ORDER_HISTORY_MISSING", "high", "Order not visible to buyer in 15 min"],
                ["PAYMENT_SUCCESS_ORDER_NOT_CREATED", "critical", "Payment collected but no order created"],
                ["SHIPPING_CALCULATION_FAILED", "medium", "Shipping API slow or errored"],
                ["REPEAT_PAYMENT_FAILURES", "high", "3+ payment failures in same session"],
                ["API_ERROR_SPIKE", "critical", "10+ 5xx errors in 5-minute window"],
              ].map(([code, sev, desc]) => (
                <div key={code} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span className={`cw-severity ${sev}`}>{sev}</span>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{code}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
