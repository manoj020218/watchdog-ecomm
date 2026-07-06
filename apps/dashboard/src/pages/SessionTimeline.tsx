import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.ts";

interface EventRow {
  eventId: string;
  stage: string;
  timestamp: string;
  apiStatus?: number;
  apiLatencyMs?: number;
  errorMessage?: string;
  url?: string;
  browser?: string;
  device?: string;
  orderId?: string;
  cartId?: string;
  metadata?: unknown;
}

const STAGE_COLORS: Record<string, string> = {
  PAYMENT_SUCCESS: "#16a34a",
  ORDER_CREATED: "#2563eb",
  COMPLETED: "#16a34a",
  PAYMENT_INITIATED: "#d97706",
};

export default function SessionTimeline() {
  const { sessionId: paramSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(paramSessionId || "");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramSessionId) {
      setInputId(paramSessionId);
      load(paramSessionId);
    }
  }, [paramSessionId]);

  async function load(id: string) {
    if (!id.trim()) return;
    setLoading(true);
    try {
      const result = await api.getSessionTimeline(id.trim());
      setEvents(result.events as EventRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function search() {
    navigate(`/sessions/${inputId.trim()}`);
  }

  return (
    <>
      <div className="cw-topbar">
        <h2>Session Timeline</h2>
      </div>

      <div className="cw-content">
        <div className="cw-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Enter session ID…"
              style={{ flex: 1, padding: "9px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <button className="cw-btn cw-btn-primary" onClick={search}>Load Trace</button>
          </div>
        </div>

        {loading && <div className="cw-loading">Loading session trace…</div>}

        {!loading && events.length > 0 && (
          <div className="cw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="cw-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Stage</th>
                  <th>Time</th>
                  <th>API Status</th>
                  <th>Latency</th>
                  <th>Error</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt, i) => (
                  <tr key={evt.eventId}>
                    <td style={{ color: "#9ca3af", width: 32 }}>{i + 1}</td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: STAGE_COLORS[evt.stage] ? `${STAGE_COLORS[evt.stage]}22` : "#f3f4f6",
                        color: STAGE_COLORS[evt.stage] || "#374151",
                      }}>
                        {evt.stage}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      {evt.apiStatus ? (
                        <span style={{ color: evt.apiStatus >= 400 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                          {evt.apiStatus}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ color: evt.apiLatencyMs && evt.apiLatencyMs > 3000 ? "#ea580c" : "#374151" }}>
                      {evt.apiLatencyMs ? `${evt.apiLatencyMs}ms` : "—"}
                    </td>
                    <td style={{ color: "#dc2626", maxWidth: 200, fontSize: 12 }}>
                      {evt.errorMessage || "—"}
                    </td>
                    <td style={{ fontSize: 11, color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {evt.url || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && events.length === 0 && inputId && (
          <div className="cw-empty">No events found for this session ID.</div>
        )}
      </div>
    </>
  );
}
