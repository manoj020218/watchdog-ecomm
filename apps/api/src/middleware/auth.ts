import type { Request, Response, NextFunction } from "express";

const API_KEY_HEADER = "x-watchdog-api-key";
const VALID_KEYS = new Set(
  (process.env.WATCHDOG_API_KEYS || "").split(",").map((k) => k.trim()).filter(Boolean)
);

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers[API_KEY_HEADER] as string | undefined;

  if (!key || !VALID_KEYS.has(key)) {
    res.status(401).json({ error: "Unauthorized — provide a valid API key in x-watchdog-api-key header." });
    return;
  }

  next();
}

export function optionalApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers[API_KEY_HEADER] as string | undefined;
  (req as Request & { apiKeyValid: boolean }).apiKeyValid = Boolean(key && VALID_KEYS.has(key));
  next();
}
