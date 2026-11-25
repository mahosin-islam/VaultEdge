"use client";

import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/features/auth/authApi";

export function LogoutButton() {
  const router = useRouter();
  const [logoutMutation, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-btn-secondary-border bg-btn-secondary px-4 text-xs font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
    >
      <span>{isLoading ? "Signing Out..." : "Sign Out"}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}
