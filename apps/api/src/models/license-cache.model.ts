import { Schema, model, Document } from "mongoose";

export interface LicenseCache {
  licenseKey: string;
  valid: boolean;
  status: string;
  clientName: string;
  productSlug: string | null;
  planName: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
  lastCheckedAt: string;
}

export interface LicenseCacheDoc extends LicenseCache, Document {}

const LicenseCacheSchema = new Schema<LicenseCacheDoc>(
  {
    licenseKey:    { type: String, required: true, unique: true },
    valid:         { type: Boolean, required: true },
    status:        { type: String, required: true },
    clientName:    { type: String, default: "" },
    productSlug:   { type: String, default: null },
    planName:      { type: String, default: null },
    daysRemaining: { type: Number, default: null },
    expiresAt:     { type: String, default: null },
    lastCheckedAt: { type: String, required: true },
  },
  { timestamps: false }
);

export const LicenseCacheModel = model<LicenseCacheDoc>("LicenseCache", LicenseCacheSchema);
