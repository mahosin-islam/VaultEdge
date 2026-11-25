import { requireServerRole } from "@/server/auth/session";
import { getCustomerOverviewDashboard } from "@/server/services/customer-banking.service";
import { listCustomerNotifications } from "@/server/services/customer-portal.service";
import { CustomerOverviewView } from "@/features/customer/CustomerOverviewView";

export default async function CustomerOverviewPage() {
  const user = await requireServerRole(["CUSTOMER"]);

  const [initialOverview, initialNotifs] = await Promise.all([
    getCustomerOverviewDashboard(user.id, { months: 6 }),
    listCustomerNotifications(user.id, { page: 1, limit: 4 }),
  ]);

  return (
    <CustomerOverviewView
      user={user}
      initialOverview={initialOverview}
      initialNotifications={initialNotifs.notifications}
      initialUnreadCount={initialNotifs.unreadCount}
    />
  );
}
