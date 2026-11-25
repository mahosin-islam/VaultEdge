"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useLazyGetMeQuery,
  useLoginMutation,
} from "@/features/auth/authApi";
import { getDashboardRouteForRole } from "@/config/routes";
import type { ApiErrorEnvelope } from "@/types/api.types";

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [triggerGetMe, { isFetching: isVerifyingRole }] = useLazyGetMeQuery();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isBusy = isLoggingIn || isVerifyingRole;

  const validateClientSide = (): boolean => {
    const errors: LoginFieldErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid registered email address.";
    }
    if (password.length === 0) {
      errors.password = "Master password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validateClientSide()) {
      return;
    }

    try {
      const loginResponse = await loginMutation({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      // Verify authoritative role from GET /api/v1/auth/me via HttpOnly cookie
      let authoritativeRole = loginResponse.data.user.role;
      try {
        const meResponse = await triggerGetMe().unwrap();
        if (meResponse?.data?.user?.role) {
          authoritativeRole = meResponse.data.user.role;
        }
      } catch {
        // Fallback to login response role if /me already resolved identically
      }

      const targetDashboard = getDashboardRouteForRole(authoritativeRole);

      setSuccessMessage(
        `Authenticated as ${authoritativeRole}. Redirecting to ${targetDashboard}...`
      );

      router.push(targetDashboard);
      router.refresh();
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      if (apiErr?.error) {
        setServerError(apiErr.error.message);
        if (Array.isArray(apiErr.error.details)) {
          const mapped: LoginFieldErrors = {};
          for (const item of apiErr.error.details) {
            if (item.field === "email") mapped.email = item.message;
            if (item.field === "password") mapped.password = item.message;
          }
          setFieldErrors((prev) => ({ ...prev, ...mapped }));
        }
      } else {
        setServerError(
          "Unable to sign in right now. Please verify your connection and try again."
        );
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:p-9 ve-elevated-shadow">
      {/* Subtle Top Gold Accent Highlight Line */}
      <div
        className="pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-accent opacity-60"
        aria-hidden="true"
      />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Sign In to Your Account
          </h2>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Enter your credentials to access your financial dashboard.
          </p>
        </div>

        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" />
          </svg>
        </span>
      </div>

      {/* Feedback Alerts */}
      {serverError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-xs text-status-danger"
        >
          <span className="font-bold">!</span>
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-status-success-border bg-status-success-bg px-4 py-3 text-xs text-status-success"
        >
          <span className="font-bold">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {/* 1. Email or Account ID */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-email"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              <span className="text-accent">🏛️</span>
              <span>EMAIL OR ACCOUNT ID</span>
            </label>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              INSTITUTIONAL ID
            </span>
          </div>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-sm text-text-muted">
              @
            </span>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isBusy}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="name@example.com or Acc #"
              className="h-11 w-full rounded-lg border border-input-border bg-input-bg pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* 2. Master Password */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              <span className="text-accent">🔒</span>
              <span>MASTER PASSWORD</span>
            </label>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              ENCRYPTED
            </span>
          </div>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
            </span>
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isBusy}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="••••••••••••"
              className="h-11 w-full rounded-lg border border-input-border bg-input-bg pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted transition-colors hover:text-accent focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Remember Device & Forgot Password */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-input-bg accent-accent focus:ring-2 focus:ring-accent"
            />
            <span>Remember this device</span>
          </label>

          <Link
            href="/login#forgot-password"
            className="font-semibold text-accent transition-colors hover:text-accent-hover underline-offset-4 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-btn-primary px-6 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isBusy ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-btn-primary-text border-t-transparent"
                aria-hidden="true"
              />
              <span>Verifying Credentials &amp; Role...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        {/* Secondary Transaction PIN / 2FA Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-inner p-3.5 text-xs leading-relaxed text-text-secondary">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-accent-border bg-accent-subtle font-mono text-[10px] font-bold text-accent">
            •••
          </span>
          <p>
            Requires secondary 4-digit Transaction PIN or 2FA for fund execution
            upon entry.
          </p>
        </div>

        {/* Bottom Switch to Register */}
        <div className="rounded-xl border border-border-subtle bg-surface-inner px-4 py-3.5 text-center text-xs text-text-secondary">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="inline-flex items-center gap-1 font-semibold text-accent transition-colors hover:text-accent-hover underline-offset-4 hover:underline"
          >
            <span>Create Account</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
