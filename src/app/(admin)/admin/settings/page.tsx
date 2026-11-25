import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { getSystemSettings } from "@/server/services/admin-settings.service";
import { AdminSettingsView } from "@/features/admin/AdminSettingsView";

export const metadata: Metadata = {
  title: "Bank-Wide Financial Settings — VaultEdge Admin Console",
  description:
    "Configure global transaction velocity limits, minimum vault balance rules, flat transfer fees, loan interest defaults, and AML thresholds.",
};

export default async function AdminSettingsPage() {
  await requireServerRole(["ADMIN"]);

  const initialSettings = await getSystemSettings();

  return <AdminSettingsView initialSettings={initialSettings} />;
}
