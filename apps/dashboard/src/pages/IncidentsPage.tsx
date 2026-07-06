import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Incident } from "../api.ts";

interface Props { storeId: string }

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

export default function IncidentsPage({ storeId }: Props) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [severityFilter, setSeverityFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { storeId, limit: "100" };
    if (statusFilter !== "all") params.status = statusFilter;
    if (severityFilter) params.severity = severityFilter;

    api.listIncidents(params)
      .then((r) => { setIncidents(r.incidents); setTotal(r.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storeId, statusFilter, severityFilter]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...incidents].sort((a, b) => {
    const si = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (si !== 0) return si;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  async function quickResolve(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await api.resolveIncident(id, "dashboard-user");
    load();
  }

  return (
    <>
      <div className="cw-topbar">
        <h2>Incidents ({total})</h2>
        <div className="cw-topbar-right">
          <button className="cw-btn cw-btn-secondary" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="cw-content">
        {/* Filters */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>STATUS</div>
            <div className="cw-pill-group">
              {["open", "investigating", "resolved", "all"].map((s) => (
                <button key={s} className={`cw-pill${statusFilter === s ? " active" : ""}`} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>SEVERITY</div>
            <div className="cw-pill-group">
              <button className={`cw-pill${!severityFilter ? " active" : ""}`} onClick={() => setSeverityFilter("")}>All</button>
              {SEVERITY_ORDER.map((s) => (
                <button key={s} className={`cw-pill${severityFilter === s ? " active" : ""}`} onClick={() => setSeverityFilter(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cw-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading && <div className="cw-loading">Loading incidents…</div>}
          {!loading && sorted.length === 0 && (
            <div className="cw-empty">No incidents found — the pipeline is clean 🎉</div>
          )}
          {!loading && sorted.length > 0 && (
            <table className="cw-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Rule</th>
                  <th>Stage</th>
                  <th>Root Cause</th>
                  <th>Revenue at Risk</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((inc) => (
                  <tr key={inc.incidentId} style={{ cursor: "pointer" }} onClick={() => navigate(`/incidents/${inc.incidentId}`)}>
                    <td><span className={`cw-severity ${inc.severity}`}>{inc.severity}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{inc.ruleCode}</td>
                    <td style={{ fontSize: 12 }}>{inc.affectedStage}</td>
                    <td style={{ maxWidth: 240 }}>{inc.rootCauseGuess}</td>
                    <td>{inc.revenueAtRisk ? `₹${inc.revenueAtRisk.toLocaleString()}` : "—"}</td>
                    <td><span className={`cw-status ${inc.status}`}>{inc.status}</span></td>
                    <td style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {inc.status !== "resolved" && (
                        <button className="cw-btn cw-btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={(e) => quickResolve(e, inc.incidentId)}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
