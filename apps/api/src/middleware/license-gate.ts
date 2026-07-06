import type { Request, Response, NextFunction } from "express";
import { getActiveLicense } from "../services/license.service.js";

export async function licenseGate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const license = await getActiveLicense();

    if (!license || !license.valid) {
      res.status(402).json({
        error: "No active license. Activate Commerce Watchdog at your dashboard → Settings → License.",
        code: "LICENSE_REQUIRED",
      });
      return;
    }

    // Warn in headers when expiring soon (within 7 days)
    if (license.daysRemaining !== null && license.daysRemaining <= 7) {
      res.setHeader("X-License-Expires-In", `${license.daysRemaining}d`);
    }

    next();
  } catch (err) {
    console.error("[license-gate] error:", err);
    next(); // On internal error, allow through (don't block buyers due to our bug)
  }
}
