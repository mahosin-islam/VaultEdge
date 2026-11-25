import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { StaffCustomersView } from "@/features/staff/StaffCustomersView";

export const metadata: Metadata = {
  title: "Customer Registration & Management — VaultEdge Staff Console",
  description:
    "Register new banking customers, search registered profiles, and inspect linked accounts and KYC status.",
};

export default async function StaffCustomersPage() {
  await requireServerRole(["STAFF"]);

  const { customers, summaryCounts, meta } = await listCustomersForAdmin({
    page: 1,
    limit: 8,
  });

  return (
    <StaffCustomersView
      initialCustomers={customers}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
