import { LicenseCacheModel, type LicenseCache } from "../models/license-cache.model.js";

const IOTSOFT_API = process.env.IOTSOFT_LICENSE_API_URL || "http://localhost:3001";
const RECHECK_MS = 24 * 60 * 60 * 1000; // re-verify against iotsoft.in every 24h

export interface LicenseVerifyResult {
  valid: boolean;
  status: string;
  clientName: string;
  planName: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
  reason?: string;
}

export async function verifyLicense(licenseKey: string): Promise<LicenseVerifyResult> {
  // Check local cache first
  const cached = await LicenseCacheModel.findOne({ licenseKey }).lean();
  const now = Date.now();

  if (cached) {
    const age = now - new Date(cached.lastCheckedAt).getTime();
    if (age < RECHECK_MS) {
      return {
        valid: cached.valid,
        status: cached.status,
        clientName: cached.clientName,
        planName: cached.planName,
        daysRemaining: cached.daysRemaining,
        expiresAt: cached.expiresAt,
      };
    }
  }

  // Re-check against iotsoft.in
  return refreshFromRemote(licenseKey);
}

export async function refreshFromRemote(licenseKey: string): Promise<LicenseVerifyResult> {
  let result: LicenseVerifyResult;

  try {
    const res = await fetch(`${IOTSOFT_API}/license/check?key=${encodeURIComponent(licenseKey)}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json() as {
      valid: boolean;
      status: string;
      reason?: string;
      clientName?: string;
      planName?: string;
      daysRemaining?: number;
      trialEndDate?: string;
      nextBillingDate?: string;
    };

    const expiresAt = data.trialEndDate || data.nextBillingDate || null;

    result = {
      valid: Boolean(data.valid),
      status: data.status || "unknown",
      clientName: data.clientName || "",
      planName: data.planName || null,
      daysRemaining: data.daysRemaining ?? null,
      expiresAt,
      reason: data.reason,
    };
  } catch (err) {
    // If iotsoft.in is unreachable, use the last known cache value (grace period)
    const cached = await LicenseCacheModel.findOne({ licenseKey }).lean();
    if (cached) {
      console.warn("[license] iotsoft.in unreachable — using stale cache for grace period");
      return {
        valid: cached.valid,
        status: cached.status,
        clientName: cached.clientName,
        planName: cached.planName,
        daysRemaining: cached.daysRemaining,
        expiresAt: cached.expiresAt,
      };
    }
    return { valid: false, status: "unreachable", clientName: "", planName: null, daysRemaining: null, expiresAt: null };
  }

  // Upsert cache
  await LicenseCacheModel.findOneAndUpdate(
    { licenseKey },
    {
      licenseKey,
      valid: result.valid,
      status: result.status,
      clientName: result.clientName,
      productSlug: "commerce-watchdog",
      planName: result.planName,
      daysRemaining: result.daysRemaining,
      expiresAt: result.expiresAt,
      lastCheckedAt: new Date().toISOString(),
    },
    { upsert: true }
  );

  return result;
}

export async function getActiveLicense(): Promise<(LicenseCache & { licenseKey: string }) | null> {
  return LicenseCacheModel.findOne({ valid: true }).lean() as Promise<(LicenseCache & { licenseKey: string }) | null>;
}
