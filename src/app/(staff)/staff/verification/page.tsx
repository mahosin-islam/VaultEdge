import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { StaffVerificationView } from "@/features/staff/StaffVerificationView";

export const metadata: Metadata = {
  title: "Customer KYC Verification — VaultEdge Staff Console",
  description:
    "Review customer identity profiles, verify residency and employment information, and approve or reject KYC eligibility.",
};

export default async function StaffVerificationPage() {
  await requireServerRole(["STAFF"]);

  const { customers, summaryCounts, meta } = await listCustomersForAdmin({
    page: 1,
    limit: 8,
    kycStatus: "PENDING",
  });

  return (
    <StaffVerificationView
      initialCustomers={customers}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
