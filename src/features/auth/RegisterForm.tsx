"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/features/auth/authApi";
import { getDashboardRouteForRole } from "@/config/routes";
import type { ApiErrorEnvelope } from "@/types/api.types";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live password rule indicators matching the Stitch design
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasSymbolAndNum =
    /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasSymbolAndNum ? 1 : 0);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const validateClientSide = (): boolean => {
    const errors: FieldErrors = {};

    if (fullName.trim().length < 2) {
      errors.fullName = "Full legal name must be at least 2 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid institutional or personal email.";
    }
    if (!hasMinLength || !hasUppercase || !hasSymbolAndNum) {
      errors.password =
        "Password must be 8+ characters with uppercase, lowercase, number, and symbol.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (!termsAccepted) {
      errors.termsAccepted =
        "Please accept the VaultEdge Terms & Conditions and Privacy Policy.";
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
      const response = await registerMutation({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      }).unwrap();

      const registeredRole = response.data.user.role;
      const targetRoute = getDashboardRouteForRole(registeredRole);

      setSuccessMessage(
        `Account created as ${registeredRole}! Redirecting to your dashboard...`
      );

      router.push(targetRoute);
      router.refresh();
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      if (apiErr?.error) {
        setServerError(apiErr.error.message);
        if (Array.isArray(apiErr.error.details)) {
          const mapped: FieldErrors = {};
          for (const item of apiErr.error.details) {
            if (item.field === "fullName") mapped.fullName = item.message;
            if (item.field === "email") mapped.email = item.message;
            if (item.field === "password") mapped.password = item.message;
            if (item.field === "confirmPassword")
              mapped.confirmPassword = item.message;
          }
          setFieldErrors((prev) => ({ ...prev, ...mapped }));
        }
      } else {
        setServerError(
          "Unable to complete registration. Please check your connection and try again."
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
            Create Your Account
          </h2>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Join VaultEdge and take control of your financial activities.
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-accent-border bg-accent-subtle px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
          CUSTOMER
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {/* 1. Full Legal Name */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-fullName"
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              FULL LEGAL NAME
            </label>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              KYC REQUIRED
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="register-fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              disabled={isLoading}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              placeholder="e.g. Alexander Vance"
              className="h-11 w-full rounded-lg border border-input-border bg-input-bg pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
          </div>
          {fieldErrors.fullName && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        {/* 2. Email Address */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-email"
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              EMAIL ADDRESS
            </label>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              INSTITUTIONAL ID
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
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="name@example.com"
              className="h-11 w-full rounded-lg border border-input-border bg-input-bg pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* 3. Master Password */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-password"
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              MASTER PASSWORD
            </label>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${
                strengthScore === 3
                  ? "text-status-success"
                  : strengthScore > 0
                    ? "text-accent"
                    : "text-text-muted"
              }`}
            >
              {password.length === 0
                ? "AWAITING INPUT"
                : strengthScore === 3
                  ? "STRONG KEY"
                  : "COMPLEXITY REQUIRED"}
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
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="Enter strong password"
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

          {/* 3-Segment Password Strength Bar & Criteria */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div
              className={`h-1 rounded-full transition-colors ${
                hasMinLength ? "bg-accent" : "bg-border"
              }`}
            />
            <div
              className={`h-1 rounded-full transition-colors ${
                hasUppercase ? "bg-accent" : "bg-border"
              }`}
            />
            <div
              className={`h-1 rounded-full transition-colors ${
                hasSymbolAndNum ? "bg-status-success" : "bg-border"
              }`}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span
              className={`inline-flex items-center gap-1 ${
                hasMinLength ? "text-status-success" : "text-text-muted"
              }`}
            >
              <span>✓</span>
              <span>8+ chars</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 ${
                hasUppercase ? "text-status-success" : "text-text-muted"
              }`}
            >
              <span>✓</span>
              <span>Uppercase</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 ${
                hasSymbolAndNum ? "text-status-success" : "text-text-muted"
              }`}
            >
              <span>✓</span>
              <span>Symbol &amp; num</span>
            </span>
          </div>

          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* 4. Confirm Password */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-confirmPassword"
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              CONFIRM PASSWORD
            </label>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${
                passwordsMatch ? "text-status-success" : "text-text-muted"
              }`}
            >
              {passwordsMatch ? "MATCHED" : "UNMATCHED"}
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <input
              id="register-confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              placeholder="Confirm your password"
              className="h-11 w-full rounded-lg border border-input-border bg-input-bg pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
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
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Customer Role Notice Box (Matches Stitch Screenshot) */}
        <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-inner p-3.5 text-xs leading-relaxed text-text-secondary">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent-border bg-accent-subtle text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <p>
            Public registration creates a secure{" "}
            <strong className="font-semibold text-text-primary">
              Customer
            </strong>{" "}
            account. Staff &amp; Admin accounts are provisioned exclusively via
            administrative dispatch.
          </p>
        </div>

        {/* Terms & Conditions Checkbox */}
        <div>
          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (fieldErrors.termsAccepted) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    termsAccepted: undefined,
                  }));
                }
              }}
              className="h-4 w-4 rounded border-border bg-input-bg accent-accent focus:ring-2 focus:ring-accent"
            />
            <span>
              I agree to the VaultEdge{" "}
              <Link
                href="/#security"
                className="font-semibold text-accent underline-offset-4 hover:underline"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/#security"
                className="font-semibold text-accent underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.termsAccepted && (
            <p className="mt-1.5 text-xs text-status-danger">
              {fieldErrors.termsAccepted}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-btn-primary px-6 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isLoading ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-btn-primary-text border-t-transparent"
                aria-hidden="true"
              />
              <span>Provisioning Customer Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        {/* Bottom Switch to Login */}
        <p className="pt-1 text-center text-xs text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent transition-colors hover:text-accent-hover underline-offset-4 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
