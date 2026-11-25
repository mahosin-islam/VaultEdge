"use client";

import { useState } from "react";
import {
  useConfigureCustomerPinMutation,
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from "@/features/customer/customerApi";
import type { SafeUserDTO } from "@/types/auth.types";
import type { CustomerEmploymentStatus } from "@/types/customer.types";

interface CustomerProfileSecurityViewProps {
  initialProfile: SafeUserDTO;
}

function getKycBadgeClasses(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "border-status-success-border bg-status-success-bg text-status-success";
    case "PENDING":
      return "border-status-warning-border bg-status-warning-bg text-status-warning";
    case "REJECTED":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
    default:
      return "border-status-info-border bg-status-info-bg text-status-info";
  }
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (
      error as { data?: { error?: { message?: string }; message?: string } }
    ).data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  return fallback;
}

export function CustomerProfileSecurityView({
  initialProfile,
}: CustomerProfileSecurityViewProps) {
  const { data: profileRes } = useGetCustomerProfileQuery();
  const profile = profileRes?.data?.profile ?? initialProfile;
  const cp = profile.customerProfile;

  // Profile form state
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(cp?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    cp?.dateOfBirth ? cp.dateOfBirth.slice(0, 10) : ""
  );
  const [addressLine1, setAddressLine1] = useState(cp?.addressLine1 ?? "");
  const [city, setCity] = useState(cp?.city ?? "");
  const [stateVal, setStateVal] = useState(cp?.state ?? "");
  const [postalCode, setPostalCode] = useState(cp?.postalCode ?? "");
  const [country, setCountry] = useState(cp?.country ?? "");
  const [employmentStatus, setEmploymentStatus] =
    useState<CustomerEmploymentStatus>(
      (cp?.employmentStatus as CustomerEmploymentStatus) ?? "EMPLOYED"
    );
  const [monthlyIncome, setMonthlyIncome] = useState(cp?.monthlyIncome ?? "0");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // PIN form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [pinConfiguredOverride, setPinConfiguredOverride] = useState<
    boolean | null
  >(null);

  const hasPin = pinConfiguredOverride ?? profile.hasTransactionPin;

  const [updateProfile, { isLoading: isSavingProfile }] =
    useUpdateCustomerProfileMutation();
  const [configurePin, { isLoading: isSavingPin }] =
    useConfigureCustomerPinMutation();

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(addressLine1.trim() ? { addressLine1: addressLine1.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(stateVal.trim() ? { state: stateVal.trim() } : {}),
        ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
        ...(country.trim() ? { country: country.trim() } : {}),
        employmentStatus,
        ...(monthlyIncome !== ""
          ? { monthlyIncome: Number(Number(monthlyIncome).toFixed(2)) }
          : {}),
      }).unwrap();

      setProfileSuccess("Your customer profile has been updated.");
    } catch (err) {
      setProfileError(
        getApiErrorMessage(err, "Unable to update customer profile.")
      );
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError("New Transaction PIN must be 4 to 6 numeric digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("New PIN and confirmation PIN do not match.");
      return;
    }
    if (!hasPin && !currentPassword) {
      setPinError("Account password is required to set your initial PIN.");
      return;
    }
    if (hasPin && !/^\d{4,6}$/.test(currentPin)) {
      setPinError("Current Transaction PIN must be 4 to 6 numeric digits.");
      return;
    }

    try {
      await configurePin({
        isUpdate: hasPin,
        ...(hasPin ? { currentPin } : { currentPassword }),
        newPin,
        confirmPin,
      }).unwrap();

      setPinConfiguredOverride(true);
      setPinSuccess(
        hasPin
          ? "Transaction PIN changed successfully."
          : "Initial Transaction PIN configured successfully."
      );
      setCurrentPassword("");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      setPinError(
        getApiErrorMessage(err, "Unable to configure Transaction PIN.")
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Profile &amp; Security
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Manage your personal contact information, employment profile, KYC
            verification standing, and Transaction PIN authorization.
          </p>
        </div>
      </div>

      {/* Identity & KYC Banner */}
      <section
        aria-label="Account identity summary"
        className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <p className="font-mono text-[10px] uppercase text-text-muted">
            CUSTOMER CODE
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-text-primary">
            {cp?.customerCode ?? "—"}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase text-text-muted">
            PRIMARY EMAIL
          </p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {profile.email}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase text-text-muted">
            KYC STATUS
          </p>
          <span
            className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getKycBadgeClasses(
              cp?.kycStatus ?? "PENDING"
            )}`}
          >
            {cp?.kycStatus ?? "PENDING"}
          </span>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase text-text-muted">
            TRANSACTION PIN
          </p>
          <span
            className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
              hasPin
                ? "border-status-success-border bg-status-success-bg text-status-success"
                : "border-status-warning-border bg-status-warning-bg text-status-warning"
            }`}
          >
            {hasPin ? "CONFIGURED" : "NOT SET"}
          </span>
        </div>
      </section>

      {/* Main Split */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left 7 Columns: Personal & Employment Profile */}
        <section
          aria-label="Update customer profile"
          className="rounded-xl border border-border bg-surface p-6 xl:col-span-7"
        >
          <h2 className="text-base font-semibold text-text-primary">
            Personal &amp; Contact Information
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Email and KYC verification status are managed by Bank Staff/Admin
            for compliance.
          </p>

          {profileError ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs text-status-danger"
            >
              {profileError}
            </div>
          ) : null}
          {profileSuccess ? (
            <div
              role="status"
              className="mt-4 rounded-lg border border-status-success-border bg-status-success-bg px-3.5 py-2.5 text-xs text-status-success"
            >
              {profileSuccess}
            </div>
          ) : null}

          <form
            onSubmit={handleProfileSubmit}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor="profFirstName"
                className="block text-xs font-semibold text-text-primary"
              >
                First Name
              </label>
              <input
                id="profFirstName"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profLastName"
                className="block text-xs font-semibold text-text-primary"
              >
                Last Name
              </label>
              <input
                id="profLastName"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profPhone"
                className="block text-xs font-semibold text-text-primary"
              >
                Phone Number
              </label>
              <input
                id="profPhone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profDob"
                className="block text-xs font-semibold text-text-primary"
              >
                Date of Birth
              </label>
              <input
                id="profDob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="profAddress"
                className="block text-xs font-semibold text-text-primary"
              >
                Address Line
              </label>
              <input
                id="profAddress"
                type="text"
                maxLength={200}
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profCity"
                className="block text-xs font-semibold text-text-primary"
              >
                City
              </label>
              <input
                id="profCity"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profState"
                className="block text-xs font-semibold text-text-primary"
              >
                State / Province
              </label>
              <input
                id="profState"
                type="text"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profPostal"
                className="block text-xs font-semibold text-text-primary"
              >
                Postal Code
              </label>
              <input
                id="profPostal"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profCountry"
                className="block text-xs font-semibold text-text-primary"
              >
                Country
              </label>
              <input
                id="profCountry"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profEmployment"
                className="block text-xs font-semibold text-text-primary"
              >
                Employment Status
              </label>
              <select
                id="profEmployment"
                value={employmentStatus}
                onChange={(e) =>
                  setEmploymentStatus(
                    e.target.value as CustomerEmploymentStatus
                  )
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="EMPLOYED">Employed</option>
                <option value="SELF_EMPLOYED">Self Employed</option>
                <option value="BUSINESS_OWNER">Business Owner</option>
                <option value="STUDENT">Student</option>
                <option value="RETIRED">Retired</option>
                <option value="UNEMPLOYED">Unemployed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="profIncome"
                className="block text-xs font-semibold text-text-primary"
              >
                Monthly Income (USD)
              </label>
              <input
                id="profIncome"
                type="number"
                step="0.01"
                min="0"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-lg bg-btn-primary px-5 py-2.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
              >
                {isSavingProfile ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </section>

        {/* Right 5 Columns: Transaction PIN Security */}
        <section
          aria-label="Transaction PIN security"
          className="rounded-xl border border-border bg-surface p-6 xl:col-span-5"
        >
          <h2 className="text-base font-semibold text-text-primary">
            {hasPin
              ? "Change Transaction PIN"
              : "Set Initial Transaction PIN"}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {hasPin
              ? "Your 4–6 digit Transaction PIN authorizes fund transfers and loan repayments."
              : "Verify your account password to create a 4–6 digit Transaction PIN for transfers and repayments."}
          </p>

          {pinError ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs text-status-danger"
            >
              {pinError}
            </div>
          ) : null}
          {pinSuccess ? (
            <div
              role="status"
              className="mt-4 rounded-lg border border-status-success-border bg-status-success-bg px-3.5 py-2.5 text-xs text-status-success"
            >
              {pinSuccess}
            </div>
          ) : null}

          <form onSubmit={handlePinSubmit} className="mt-5 space-y-4">
            {hasPin ? (
              <div>
                <label
                  htmlFor="currentPin"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Current Transaction PIN
                </label>
                <input
                  id="currentPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="••••"
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Account Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your login password"
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="newPin"
                className="block text-xs font-semibold text-text-primary"
              >
                New Transaction PIN (4–6 digits)
              </label>
              <input
                id="newPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPin"
                className="block text-xs font-semibold text-text-primary"
              >
                Confirm New Transaction PIN
              </label>
              <input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder="••••"
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPin}
              className="w-full rounded-lg bg-btn-primary py-2.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
            >
              {isSavingPin
                ? "Updating PIN..."
                : hasPin
                  ? "Update Transaction PIN"
                  : "Set Transaction PIN"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
