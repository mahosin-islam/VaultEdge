import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { AdminCustomersView } from "@/features/admin/AdminCustomersView";

export const metadata: Metadata = {
  title: "Customer Directory & KYC Management — VaultEdge Admin Console",
  description:
    "Manage verified personal, business, and enterprise account holders, review KYC statuses, inspect linked bank accounts, and audit account privileges.",
};

export default async function AdminCustomersPage() {
  await requireServerRole(["ADMIN"]);

  const { customers, summaryCounts, meta } = await listCustomersForAdmin({
    page: 1,
    limit: 8,
  });

  return (
    <AdminCustomersView
      initialCustomers={customers}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
