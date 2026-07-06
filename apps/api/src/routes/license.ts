import { Router } from "express";
import { verifyLicense, refreshFromRemote, getActiveLicense } from "../services/license.service.js";
import { LicenseCacheModel } from "../models/license-cache.model.js";

const router = Router();

/** POST /v1/license/activate */
router.post("/activate", async (req, res) => {
  try {
    const { licenseKey } = req.body as { licenseKey?: string };
    if (!licenseKey || typeof licenseKey !== "string" || licenseKey.trim().length < 8) {
      return res.status(400).json({ error: "licenseKey is required." });
    }
    const result = await verifyLicense(licenseKey.trim());
    if (!result.valid) {
      return res.status(402).json({
        error: `License is ${result.status}. Check your subscription at iotsoft.in.`,
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
  } catch (err) {
    console.error("[license/activate] error:", err);
    return res.status(500).json({ error: "Internal error checking license." });
  }
});

/** GET /v1/license/status */
router.get("/status", async (req, res) => {
  try {
    const license = await getActiveLicense();
    if (!license) return res.json({ activated: false });
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
  } catch (err) {
    console.error("[license/status] error:", err);
    return res.status(500).json({ error: "Internal error." });
  }
});

/** POST /v1/license/refresh */
router.post("/refresh", async (req, res) => {
  try {
    const license = await getActiveLicense();
    if (!license) return res.status(404).json({ error: "No license activated." });
    const result = await refreshFromRemote(license.licenseKey);
    return res.json(result);
  } catch (err) {
    console.error("[license/refresh] error:", err);
    return res.status(500).json({ error: "Internal error." });
  }
});

/** DELETE /v1/license */
router.delete("/", async (req, res) => {
  try {
    await LicenseCacheModel.deleteMany({});
    return res.json({ success: true });
  } catch (err) {
    console.error("[license/delete] error:", err);
    return res.status(500).json({ error: "Internal error." });
  }
});

export default router;
