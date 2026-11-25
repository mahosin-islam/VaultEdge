import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { getAdminAnalyticsReport } from "@/server/services/admin-analytics.service";
import { AdminAnalyticsView } from "@/features/admin/AdminAnalyticsView";

export const metadata: Metadata = {
  title: "Platform Analytics & Reporting — VaultEdge Admin Console",
  description:
    "Real-time liquidity flow, deposit versus withdrawal velocity, account tier distribution, and credit portfolio performance.",
};

export default async function AdminAnalyticsPage() {
  await requireServerRole(["ADMIN"]);

  const initialAnalytics = await getAdminAnalyticsReport({ months: 6 });

  return <AdminAnalyticsView initialAnalytics={initialAnalytics} />;
}
