import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listSuspiciousTransactionsForStaff } from "@/server/services/staff.service";
import { StaffSuspiciousView } from "@/features/staff/StaffSuspiciousView";

export const metadata: Metadata = {
  title: "Suspicious Transactions Queue — VaultEdge Staff Console",
  description:
    "Inspect rule-flagged and staff-escalated transactions, review double-entry ledger trails, and track Admin compliance resolutions.",
};

export default async function StaffSuspiciousTransactionsPage() {
  await requireServerRole(["STAFF"]);

  const { suspiciousFlags, meta } = await listSuspiciousTransactionsForStaff({
    page: 1,
    limit: 10,
  });

  return <StaffSuspiciousView initialFlags={suspiciousFlags} initialMeta={meta} />;
}
