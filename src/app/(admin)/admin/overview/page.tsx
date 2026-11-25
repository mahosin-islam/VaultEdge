import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { getAdminOverviewDashboard } from "@/server/services/admin-analytics.service";
import { AdminOverviewView } from "@/features/admin/AdminOverviewView";

export const metadata: Metadata = {
  title: "Institutional Banking Overview — VaultEdge Admin Console",
  description:
    "Real-time liquidity, platform settlement operations, and supervised banking activities across retail, enterprise, and algorithmic vaults.",
};

export default async function AdminOverviewPage() {
  await requireServerRole(["ADMIN"]);
  const initialData = await getAdminOverviewDashboard({ months: 6 });

  return <AdminOverviewView initialData={initialData} />;
}
