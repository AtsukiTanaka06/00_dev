import { supabase } from "./supabase";

export interface LicenseRecord {
  id: string;
  license_key: string;
  plan: "free" | "pro";
  status: "active" | "inactive" | "expired";
  user_id: string | null;
  activated_at: string | null;
  expires_at: string | null;
}

export async function findLicense(key: string): Promise<LicenseRecord | null> {
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", key)
    .single();

  if (error || !data) return null;
  return data as LicenseRecord;
}

export async function activateLicense(licenseId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("licenses")
    .update({
      user_id: userId,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", licenseId)
    .is("user_id", null); // 未使用のライセンスのみ活性化

  return !error;
}

export async function getMyLicense(userId: string): Promise<LicenseRecord | null> {
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as LicenseRecord;
}
