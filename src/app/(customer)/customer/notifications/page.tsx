import { requireServerRole } from "@/server/auth/session";
import { listCustomerNotifications } from "@/server/services/customer-portal.service";
import { CustomerNotificationsView } from "@/features/customer/CustomerNotificationsView";

export default async function CustomerNotificationsPage() {
  const user = await requireServerRole(["CUSTOMER"]);
  const { notifications, unreadCount, meta } = await listCustomerNotifications(
    user.id,
    { page: 1, limit: 12 }
  );

  return (
    <CustomerNotificationsView
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
      initialTotalCount={meta.total}
    />
  );
}
