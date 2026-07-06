import { useState, useEffect } from "react";
import { api } from "../api.ts";

interface LicenseStatus {
  activated: boolean;
  valid?: boolean;
  status?: string;
  clientName?: string;
  planName?: string;
  daysRemaining?: number | null;
  expiresAt?: string | null;
  lastCheckedAt?: string;
}

export default function SettingsPage() {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try {
      const data = await api.getLicenseStatus();
      setLicense(data);
    } catch (_e) {
      setLicense({ activated: false });
    }
  }

  async function activate() {
    if (!keyInput.trim()) return;
    setActivating(true);
    setError("");
    setNotice("");
    try {
      const data = await api.activateLicense(keyInput.trim());
      setNotice(`Activated for ${data.clientName}. Valid for ${data.daysRemaining ?? "?"} days.`);
      setKeyInput("");
      await loadStatus();
    } catch (e: unknown) {
      setError((e as Error).message || "Activation failed.");
    } finally {
      setActivating(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      await api.refreshLicense();
      await loadStatus();
      setNotice("License re-verified.");
    } catch (e: unknown) {
      setError((e as Error).message || "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  async function deactivate() {
    if (!window.confirm("Remove license from this instance?")) return;
    await api.deactivateLicense();
    setLicense({ activated: false });
    setNotice("License removed.");
  }

  const daysLeft = license?.daysRemaining ?? null;
  const expiringSoon = daysLeft !== null && daysLeft <= 7;
  const isExpired = license?.activated && !license.valid;

  return (
    <>
      <div className="cw-topbar">
        <h2>Settings & License</h2>
      </div>

      <div className="cw-content" style={{ maxWidth: 640 }}>

        {/* ── LICENSE CARD ─────────────────────────────────────── */}
        <div className="cw-card" style={{ marginBottom: 20 }}>
          <div className="cw-card-header">
            <span className="cw-card-title">License</span>
            {license?.activated && (
              <span className={`cw-status ${license.valid ? (expiringSoon ? "investigating" : "resolved") : "open"}`}>
                {license.valid
                  ? expiringSoon ? `Expiring in ${daysLeft}d` : "Active"
                  : "Expired / Suspended"}
              </span>
            )}
          </div>

          {/* Active & valid */}
          {license?.activated && license.valid && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>✓</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#166534" }}>{license.clientName || "Licensed"}</div>
                  <div style={{ fontSize: 12, color: "#16a34a" }}>
                    {license.planName && `${license.planName} · `}
                    {daysLeft !== null ? `${daysLeft} days remaining` : "Active"}
                    {license.expiresAt && ` · renews ${new Date(license.expiresAt).toLocaleDateString("en-IN")}`}
                  </div>
                </div>
              </div>

              {expiringSoon && (
                <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
                  ⚠ Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}. Renew at{" "}
                  <a href="https://iotsoft.in" target="_blank" rel="noopener noreferrer" style={{ color: "#d97706", fontWeight: 600 }}>iotsoft.in</a>.
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="cw-btn cw-btn-secondary" onClick={refresh} disabled={refreshing} style={{ fontSize: 12 }}>
                  {refreshing ? "Checking…" : "↻ Re-verify"}
                </button>
                <button className="cw-btn cw-btn-danger" onClick={deactivate} style={{ fontSize: 12 }}>
                  Remove
                </button>
              </div>

              {license.lastCheckedAt && (
                <p style={{ fontSize: 11, color: "#9ca3af" }}>
                  Last verified: {new Date(license.lastCheckedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Expired / suspended */}
          {isExpired && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: "#991b1b" }}>License {license?.status || "invalid"}</div>
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
                Renew at{" "}
                <a href="https://iotsoft.in" target="_blank" rel="noopener noreferrer" style={{ color: "#dc2626", fontWeight: 600 }}>iotsoft.in</a>
                , then click Re-verify.
              </div>
              <button className="cw-btn cw-btn-secondary" onClick={refresh} disabled={refreshing} style={{ fontSize: 12, marginTop: 10 }}>
                {refreshing ? "Checking…" : "↻ Re-verify after renewal"}
              </button>
            </div>
          )}

          {/* No license — activation form */}
          {(!license?.activated || !license.valid) && (
            <div style={{ borderTop: license?.activated ? "1px solid #f3f4f6" : "none", paddingTop: license?.activated ? 16 : 0 }}>
              {!license?.activated && (
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
                  No license activated. Enter the key from your{" "}
                  <a href="https://iotsoft.in" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>iotsoft.in</a>
                  {" "}subscription.
                </p>
              )}
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                License Key
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste license key…"
                  style={{ flex: 1, padding: "9px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "monospace" }}
                  onKeyDown={(e) => e.key === "Enter" && activate()}
                />
                <button className="cw-btn cw-btn-primary" onClick={activate} disabled={activating || !keyInput.trim()}>
                  {activating ? "Activating…" : "Activate"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                iotsoft.in → your subscription → License tab → Copy key
              </p>
            </div>
          )}

          {error  && <div style={{ marginTop: 12, color: "#dc2626", fontSize: 13 }}>{error}</div>}
          {notice && <div style={{ marginTop: 12, color: "#16a34a", fontSize: 13 }}>{notice}</div>}
        </div>

        {/* ── API CONFIG ───────────────────────────────────────── */}
        <div className="cw-card">
          <div className="cw-card-title" style={{ marginBottom: 14 }}>API Configuration</div>
          {[
            ["API URL (VITE_API_URL)",     import.meta.env.VITE_API_URL     || "http://localhost:3100"],
            ["Store ID (VITE_STORE_ID)",   import.meta.env.VITE_STORE_ID    || "default-store"],
          ].map(([label, value]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
              <div style={{ padding: "8px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontFamily: "monospace", fontSize: 13 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
