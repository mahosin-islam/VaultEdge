"use client";

import { useState } from "react";
import {
  useGetCustomerNotificationsQuery,
  useMarkAllCustomerNotificationsReadMutation,
  useMarkCustomerNotificationReadMutation,
} from "@/features/customer/customerApi";
import type { CustomerNotificationDTO } from "@/types/customer.types";

interface CustomerNotificationsViewProps {
  initialNotifications: CustomerNotificationDTO[];
  initialUnreadCount: number;
  initialTotalCount: number;
}

function formatDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerNotificationsView({
  initialNotifications,
  initialUnreadCount,
  initialTotalCount,
}: CustomerNotificationsViewProps) {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const {
    data: notifRes,
    isFetching,
    isError,
    refetch,
  } = useGetCustomerNotificationsQuery({
    page,
    limit: 12,
    unreadOnly,
  });

  const [markOneRead, { isLoading: isMarkingOne }] =
    useMarkCustomerNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] =
    useMarkAllCustomerNotificationsReadMutation();

  const hasFilters = unreadOnly || page > 1;
  const notifications =
    notifRes?.data?.notifications ?? (!hasFilters ? initialNotifications : []);
  const unreadCount = notifRes?.data?.unreadCount ?? initialUnreadCount;

  const meta = notifRes?.meta as
    | { page?: number; totalPages?: number; total?: number }
    | undefined;
  const currentPage = meta?.page ?? page;
  const totalPages =
    meta?.totalPages ?? Math.max(1, Math.ceil(initialTotalCount / 12));
  const totalCount = meta?.total ?? initialTotalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Notifications
            </h1>
            <span className="rounded-full border border-accent-border bg-accent-subtle px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
              {unreadCount} unread
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Real-time alerts for transfers, deposit &amp; withdrawal approvals,
            loan updates, and account security events.
          </p>
        </div>

        <button
          type="button"
          disabled={unreadCount === 0 || isMarkingAll}
          onClick={() => markAllRead()}
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-45"
        >
          {isMarkingAll ? "Marking All Read..." : "Mark All as Read"}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              !unreadOnly
                ? "border border-accent-border bg-accent-subtle text-accent"
                : "border border-border bg-surface-inner text-text-secondary hover:text-text-primary"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              unreadOnly
                ? "border border-accent-border bg-accent-subtle text-accent"
                : "border border-border bg-surface-inner text-text-secondary hover:text-text-primary"
            }`}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        {isFetching ? (
          <span className="font-mono text-[10px] text-accent">
            Syncing notifications...
          </span>
        ) : null}
      </div>

      {/* Notifications List */}
      <section
        aria-label="Notification feed"
        className="rounded-xl border border-border bg-surface p-5"
      >
        {isError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger"
          >
            <span>Unable to load notifications.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded border border-status-danger-border bg-surface px-2.5 py-1 font-semibold text-text-primary"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-surface-inner p-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              {unreadOnly
                ? "You have no unread notifications"
                : "No notifications yet"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Account activity alerts and approval updates will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
                    item.isRead
                      ? "border-border-subtle bg-surface-inner"
                      : "border-accent-border bg-accent-subtle"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.isRead ? (
                        <span className="h-2 w-2 rounded-full bg-accent" />
                      ) : null}
                      <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                        {item.type.replaceAll("_", " ")}
                      </span>
                      {item.referenceId ? (
                        <span className="font-mono text-[10px] text-text-muted">
                          Ref: {item.referenceId}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      {item.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-text-secondary">
                      {item.message}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted">
                      {formatDateTime(item.createdAt)}
                      {item.readAt ? ` • Read ${formatDateTime(item.readAt)}` : ""}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {item.isRead ? (
                      <span className="inline-block rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
                        Read
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isMarkingOne}
                        onClick={() => markOneRead(item.id)}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
                <span className="font-mono text-[11px] text-text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary hover:border-accent disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary hover:border-accent disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
