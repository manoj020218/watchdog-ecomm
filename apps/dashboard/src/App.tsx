import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import DashboardHome from "./pages/DashboardHome.tsx";
import IncidentsPage from "./pages/IncidentsPage.tsx";
import IncidentDetail from "./pages/IncidentDetail.tsx";
import SessionTimeline from "./pages/SessionTimeline.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";

const STORE_ID = import.meta.env.VITE_STORE_ID || "default-store";

export default function App() {
  return (
    <div className="cw-layout">
      <aside className="cw-sidebar">
        <div className="cw-sidebar-logo">
          <h1>Commerce Watchdog</h1>
          <span>{STORE_ID}</span>
        </div>
        <ul className="cw-nav">
          <li><NavLink to="/dashboard" end>
            <span>📊</span> Overview
          </NavLink></li>
          <li><NavLink to="/incidents">
            <span>🚨</span> Incidents
          </NavLink></li>
          <li><NavLink to="/sessions">
            <span>🔍</span> Session Trace
          </NavLink></li>
          <li><NavLink to="/settings">
            <span>⚙️</span> Settings
          </NavLink></li>
        </ul>
      </aside>

      <main className="cw-main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardHome storeId={STORE_ID} />} />
          <Route path="/incidents" element={<IncidentsPage storeId={STORE_ID} />} />
          <Route path="/incidents/:incidentId" element={<IncidentDetail />} />
          <Route path="/sessions" element={<SessionTimeline />} />
          <Route path="/sessions/:sessionId" element={<SessionTimeline />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
