const BASE = import.meta.env.VITE_API_URL || "http://localhost:3100";
const KEY  = import.meta.env.VITE_API_KEY || "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-watchdog-api-key": KEY,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface HealthData {
  storeId: string;
  period: { hours: number; from: string };
  healthScore: number;
  openIncidents: number;
  recentApiErrors: number;
  funnel: Array<{ stage: string; count: number; dropOffPct: number }>;
}

export interface Incident {
  incidentId: string;
  storeId: string;
  sessionId: string;
  ruleCode: string;
  severity: string;
  status: string;
  affectedStage: string;
  rootCauseGuess: string;
  recommendedAction: string;
  autoRetryPossible: boolean;
  revenueAtRisk?: number;
  orderId?: string;
  timeline: Array<{ at: string; message: string; actor?: string }>;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

export interface IncidentListResponse { total: number; incidents: Incident[] }

export const api = {
  getHealth: (storeId: string, hours = 24) =>
    apiFetch<HealthData>(`/v1/dashboard/health?storeId=${storeId}&hours=${hours}`),

  listIncidents: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<IncidentListResponse>(`/v1/incidents${qs ? "?" + qs : ""}`);
  },

  getIncident: (id: string) => apiFetch<Incident>(`/v1/incidents/${id}`),

  resolveIncident: (id: string, actor: string) =>
    apiFetch<{ success: boolean }>(`/v1/incidents/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ actor }),
    }),

  updateIncident: (id: string, body: Partial<{ status: string; assignedTo: string; note: string; actor: string }>) =>
    apiFetch<Incident>(`/v1/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getSessionTimeline: (sessionId: string) =>
    apiFetch<{ sessionId: string; events: unknown[] }>(`/v1/events/sessions/${sessionId}/timeline`),

  getOrderTimeline: (orderId: string) =>
    apiFetch<{ orderId: string; events: unknown[] }>(`/v1/events/orders/${orderId}/timeline`),

  // License
  getLicenseStatus: () =>
    apiFetch<{
      activated: boolean; valid?: boolean; status?: string;
      clientName?: string; planName?: string;
      daysRemaining?: number | null; expiresAt?: string | null; lastCheckedAt?: string;
    }>(`/v1/license/status`),

  activateLicense: (licenseKey: string) =>
    apiFetch<{ success: boolean; clientName: string; planName: string | null; status: string; daysRemaining: number | null; expiresAt: string | null }>(
      `/v1/license/activate`, { method: "POST", body: JSON.stringify({ licenseKey }) }
    ),

  refreshLicense: () =>
    apiFetch<{ valid: boolean; status: string }>(`/v1/license/refresh`, { method: "POST" }),

  deactivateLicense: () =>
    apiFetch<{ success: boolean }>(`/v1/license`, { method: "DELETE" }),
};
