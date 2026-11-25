import { requireServerRole } from "@/server/auth/session";
import { getCustomerProfile } from "@/server/services/customer-portal.service";
import { CustomerProfileSecurityView } from "@/features/customer/CustomerProfileSecurityView";

export default async function CustomerProfileSecurityPage() {
  const user = await requireServerRole(["CUSTOMER"]);
  const { profile } = await getCustomerProfile(user.id);

  return <CustomerProfileSecurityView initialProfile={profile} />;
}
