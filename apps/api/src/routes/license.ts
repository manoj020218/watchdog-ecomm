import { Router } from "express";
import { verifyLicense, refreshFromRemote, getActiveLicense } from "../services/license.service.js";
import { LicenseCacheModel } from "../models/license-cache.model.js";

const router = Router();

/** POST /v1/license/activate — buyer enters their license key to activate this instance */
router.post("/activate", async (req, res) => {
  const { licenseKey } = req.body as { licenseKey?: string };

  if (!licenseKey || typeof licenseKey !== "string" || licenseKey.trim().length < 8) {
    return res.status(400).json({ error: "licenseKey is required." });
  }

  const result = await verifyLicense(licenseKey.trim());

  if (!result.valid) {
    return res.status(402).json({
      error: `License is ${result.status}. Please check your subscription at iotsoft.in.`,
      status: result.status,
      reason: result.reason,
    });
  }

  return res.json({
    success: true,
    clientName: result.clientName,
    planName: result.planName,
    status: result.status,
    daysRemaining: result.daysRemaining,
    expiresAt: result.expiresAt,
  });
});

/** GET /v1/license/status — current license state */
router.get("/status", async (req, res) => {
  const license = await getActiveLicense();

  if (!license) {
    return res.json({ activated: false });
  }

  // If cache is stale (>24h), re-check in the background
  const age = Date.now() - new Date(license.lastCheckedAt).getTime();
  if (age > 24 * 60 * 60 * 1000) {
    refreshFromRemote(license.licenseKey).catch(console.error);
  }

  return res.json({
    activated: true,
    valid: license.valid,
    status: license.status,
    clientName: license.clientName,
    planName: license.planName,
    daysRemaining: license.daysRemaining,
    expiresAt: license.expiresAt,
    lastCheckedAt: license.lastCheckedAt,
  });
});

/** POST /v1/license/refresh — force re-check against iotsoft.in */
router.post("/refresh", async (req, res) => {
  const license = await getActiveLicense();
  if (!license) return res.status(404).json({ error: "No license activated." });

  const result = await refreshFromRemote(license.licenseKey);
  return res.json(result);
});

/** DELETE /v1/license — deactivate (remove local cache) */
router.delete("/", async (req, res) => {
  await LicenseCacheModel.deleteMany({});
  return res.json({ success: true });
});

export default router;
