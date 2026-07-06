import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Incident } from "../api.ts";

export default function IncidentDetail() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    api.getIncident(incidentId)
      .then(setIncident)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  async function addNote() {
    if (!note.trim() || !incidentId) return;
    setSaving(true);
    const updated = await api.updateIncident(incidentId, { note, actor: "dashboard-user" });
    setIncident(updated);
    setNote("");
    setSaving(false);
  }

  async function changeStatus(status: string) {
    if (!incidentId) return;
    const updated = await api.updateIncident(incidentId, { status, actor: "dashboard-user" });
    setIncident(updated);
  }

  if (loading) return <div className="cw-loading" style={{ marginTop: 80 }}>Loading incident…</div>;
  if (!incident) return <div className="cw-empty" style={{ marginTop: 80 }}>Incident not found.</div>;

  return (
    <>
      <div className="cw-topbar">
        <h2>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", marginRight: 8, fontSize: 16 }}>←</button>
          Incident: {incident.ruleCode}
        </h2>
        <div className="cw-topbar-right">
          {incident.status !== "resolved" && (
            <>
              <button className="cw-btn cw-btn-secondary" onClick={() => changeStatus("investigating")}>Investigating</button>
              <button className="cw-btn cw-btn-secondary" onClick={() => changeStatus("ignored")}>Ignore</button>
              <button className="cw-btn cw-btn-primary" onClick={() => changeStatus("resolved")}>✓ Resolve</button>
            </>
          )}
        </div>
      </div>

      <div className="cw-content" style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
        {/* Main panel */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="cw-card">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
              <span className={`cw-severity ${incident.severity}`}>{incident.severity}</span>
              <span className={`cw-status ${incident.status}`}>{incident.status}</span>
            </div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>{incident.ruleCode.replace(/_/g, " ")}</h3>
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 16 }}>{incident.rootCauseGuess}</p>

            <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>
                Recommended Action
              </div>
              <div style={{ fontSize: 13, color: "#78350f" }}>{incident.recommendedAction}</div>
            </div>

            {incident.autoRetryPossible && (
              <div style={{ background: "#dbeafe", borderRadius: 8, padding: 10, fontSize: 12, color: "#1e40af" }}>
                ✓ Auto-retry is possible for this failure type
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="cw-card">
            <div className="cw-card-header">
              <span className="cw-card-title">Activity Timeline</span>
            </div>
            <ul className="cw-timeline">
              {[...incident.timeline].reverse().map((entry, i) => (
                <li key={i} className={entry.actor === "system" ? "system" : ""}>
                  <div className="cw-timeline-ts">{new Date(entry.at).toLocaleString()}</div>
                  <div className="cw-timeline-msg">{entry.message}</div>
                  {entry.actor && <div className="cw-timeline-actor">by {entry.actor}</div>}
                </li>
              ))}
            </ul>

            {/* Add note */}
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note…"
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
              />
              <button className="cw-btn cw-btn-primary" onClick={addNote} disabled={saving}>
                {saving ? "…" : "Add"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="cw-card">
            <div className="cw-card-title" style={{ marginBottom: 12 }}>Details</div>
            {[
              ["Incident ID", incident.incidentId],
              ["Store", incident.storeId],
              ["Session ID", incident.sessionId],
              ["Order ID", incident.orderId || "—"],
              ["Affected Stage", incident.affectedStage],
              ["Revenue at Risk", incident.revenueAtRisk ? `₹${incident.revenueAtRisk.toLocaleString()}` : "—"],
              ["Assigned To", incident.assignedTo || "Unassigned"],
              ["Created", new Date(incident.createdAt).toLocaleString()],
              ["Resolved", incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : "—"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span style={{ color: "#111827", fontWeight: 500, maxWidth: 180, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
              </div>
            ))}
          </div>

          <button
            className="cw-btn cw-btn-secondary"
            style={{ width: "100%" }}
            onClick={() => navigate(`/sessions/${incident.sessionId}`)}
          >
            View Full Session Trace →
          </button>
        </div>
      </div>
    </>
  );
}
