import { useState, useEffect } from "react";
import { api, type HealthData } from "../api.ts";

interface Props { storeId: string }

const STAGE_LABELS: Record<string, string> = {
  PRODUCT_VIEWED: "Product Viewed",
  ADD_TO_CART_CLICKED: "Add to Cart Clicked",
  ADD_TO_CART_SUCCESS: "Added to Cart",
  CART_VIEWED: "Cart Viewed",
  CHECKOUT_STARTED: "Checkout Started",
  ADDRESS_SUBMITTED: "Address Submitted",
  SHIPPING_CALCULATED: "Shipping Calculated",
  PAYMENT_INITIATED: "Payment Initiated",
  PAYMENT_SUCCESS: "Payment Success",
  ORDER_CREATED: "Order Created",
  ORDER_CONFIRMED: "Order Confirmed",
  INVOICE_GENERATED: "Invoice Generated",
  ORDER_HISTORY_VISIBLE: "Order Visible",
  COMPLETED: "Completed",
};

export default function DashboardHome({ storeId }: Props) {
  const [data, setData] = useState<HealthData | null>(null);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getHealth(storeId, hours)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [storeId, hours]);

  const scoreClass = !data ? "" : data.healthScore >= 80 ? "good" : data.healthScore >= 50 ? "warn" : "bad";

  return (
    <>
      <div className="cw-topbar">
        <h2>Pipeline Overview</h2>
        <div className="cw-topbar-right">
          <div className="cw-pill-group">
            {[6, 24, 48, 168].map((h) => (
              <button key={h} className={`cw-pill${hours === h ? " active" : ""}`} onClick={() => setHours(h)}>
                {h < 24 ? `${h}h` : h === 168 ? "7d" : `${h / 24}d`}
              </button>
            ))}
          </div>
          <button className="cw-btn cw-btn-secondary" onClick={() => setHours((p) => p)}>↻ Refresh</button>
        </div>
      </div>

      <div className="cw-content">
        {loading && <div className="cw-loading">Loading pipeline data…</div>}
        {error && <div className="cw-card" style={{ color: "#dc2626", marginBottom: 20 }}>{error}</div>}

        {data && (
          <>
            <div className="cw-stats-row">
              <div className="cw-stat-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className={`cw-health-score ${scoreClass}`}>{data.healthScore}</div>
                <div>
                  <div className="cw-stat-label">Health Score</div>
                  <div className="cw-stat-sub">{data.healthScore >= 80 ? "All good" : data.healthScore >= 50 ? "Needs attention" : "Critical issues"}</div>
                </div>
              </div>

              <div className="cw-stat-card">
                <div className="cw-stat-label">Open Incidents</div>
                <div className="cw-stat-value" style={{ color: data.openIncidents > 0 ? "#dc2626" : "#111827" }}>
                  {data.openIncidents}
                </div>
                <div className="cw-stat-sub">active issues</div>
              </div>

              <div className="cw-stat-card">
                <div className="cw-stat-label">API Errors (5xx)</div>
                <div className="cw-stat-value" style={{ color: data.recentApiErrors > 5 ? "#ea580c" : "#111827" }}>
                  {data.recentApiErrors}
                </div>
                <div className="cw-stat-sub">last {hours}h</div>
              </div>

              <div className="cw-stat-card">
                <div className="cw-stat-label">Checkout Starts</div>
                <div className="cw-stat-value">
                  {data.funnel.find((f) => f.stage === "CHECKOUT_STARTED")?.count ?? 0}
                </div>
                <div className="cw-stat-sub">last {hours}h</div>
              </div>

              <div className="cw-stat-card">
                <div className="cw-stat-label">Orders Completed</div>
                <div className="cw-stat-value" style={{ color: "#16a34a" }}>
                  {data.funnel.find((f) => f.stage === "COMPLETED")?.count ?? 0}
                </div>
                <div className="cw-stat-sub">last {hours}h</div>
              </div>
            </div>

            {/* Funnel */}
            <div className="cw-card">
              <div className="cw-card-header">
                <span className="cw-card-title">Purchase Funnel</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>last {hours}h</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.funnel.map((row) => (
                  <div key={row.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 180, fontSize: 12, color: "#374151", flexShrink: 0 }}>
                      {STAGE_LABELS[row.stage] || row.stage}
                    </div>
                    <div className="cw-funnel-bar-outer">
                      <div
                        className="cw-funnel-bar-inner"
                        style={{
                          width: `${data.funnel[0].count > 0 ? (row.count / data.funnel[0].count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div style={{ width: 48, textAlign: "right", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {row.count}
                    </div>
                    {row.dropOffPct > 20 && (
                      <div style={{ fontSize: 11, color: "#dc2626", width: 50, flexShrink: 0 }}>
                        −{row.dropOffPct}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
