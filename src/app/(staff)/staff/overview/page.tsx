import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { getStaffOverviewDashboard } from "@/server/services/staff.service";
import { StaffOverviewView } from "@/features/staff/StaffOverviewView";

export const metadata: Metadata = {
  title: "Operational Desk Overview — VaultEdge Staff Console",
  description:
    "Bank Staff operational overview for customer onboarding, KYC verification, transaction monitoring, suspicious flagging, and loan review.",
};

export default async function StaffOverviewPage() {
  await requireServerRole(["STAFF"]);

  const initialOverview = await getStaffOverviewDashboard();

  return <StaffOverviewView initialOverview={initialOverview} />;
}
