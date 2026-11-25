"use client";

import { useState, type FormEvent } from "react";
import { useRegisterStaffCustomerMutation } from "@/features/staff/staffApi";
import type { ApiErrorEnvelope } from "@/types/api.types";
import type { StaffRegisterCustomerPayload } from "@/types/staff.types";

interface StaffRegisterCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
}

export function StaffRegisterCustomerModal({
  open,
  onClose,
  onSuccess,
}: StaffRegisterCustomerModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<
    NonNullable<StaffRegisterCustomerPayload["employmentStatus"]>
  >("EMPLOYED");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [registerCustomer, { isLoading }] = useRegisterStaffCustomerMutation();

  if (!open) return null;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setNationalIdNumber("");
    setDateOfBirth("");
    setEmploymentStatus("EMPLOYED");
    setMonthlyIncome("");
    setAddressLine1("");
    setCity("");
    setStateVal("");
    setPostalCode("");
    setCountry("");
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setErrorMsg("First name and last name must be at least 2 characters.");
      return;
    }
    if (!email.trim().includes("@")) {
      setErrorMsg("Please enter a valid customer email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Temporary password must be at least 8 characters.");
      return;
    }
    if (phone.trim().length < 7) {
      setErrorMsg("Phone number must be at least 7 characters.");
      return;
    }

    const parsedIncome = monthlyIncome.trim() ? Number(monthlyIncome) : undefined;
    if (
      parsedIncome !== undefined &&
      (!Number.isFinite(parsedIncome) || parsedIncome < 0)
    ) {
      setErrorMsg("Monthly income must be a non-negative number.");
      return;
    }

    try {
      const res = await registerCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(nationalIdNumber.trim()
          ? { nationalIdNumber: nationalIdNumber.trim() }
          : {}),
        employmentStatus,
        ...(parsedIncome !== undefined ? { monthlyIncome: parsedIncome } : {}),
        ...(addressLine1.trim() ? { addressLine1: addressLine1.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(stateVal.trim() ? { state: stateVal.trim() } : {}),
        ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
        ...(country.trim() ? { country: country.trim() } : {}),
      }).unwrap();

      const createdId = res.data.customer.id;
      resetForm();
      onSuccess?.(createdId);
      onClose();
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setErrorMsg(
        apiErr?.data?.error?.message ?? "Failed to register customer."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              STAFF ONBOARDING
            </span>
            <h2 className="mt-1.5 font-serif text-lg font-semibold text-text-primary">
              Register New Customer
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border bg-surface-inner px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover"
          >
            Close
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5 text-xs">
          {errorMsg ? (
            <div className="rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs text-status-danger">
              {errorMsg}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium text-text-secondary">
                First Name *
              </span>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Amina"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Last Name *
              </span>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Rahman"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Email Address *
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Phone Number *
              </span>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15551234567"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Temporary Password *
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                National ID / Passport
              </span>
              <input
                type="text"
                value={nationalIdNumber}
                onChange={(e) => setNationalIdNumber(e.target.value)}
                placeholder="Optional ID number"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Date of Birth
              </span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Employment Status
              </span>
              <select
                value={employmentStatus}
                onChange={(e) =>
                  setEmploymentStatus(
                    e.target.value as NonNullable<
                      StaffRegisterCustomerPayload["employmentStatus"]
                    >
                  )
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="EMPLOYED" className="bg-surface text-text-primary">
                  Employed
                </option>
                <option
                  value="SELF_EMPLOYED"
                  className="bg-surface text-text-primary"
                >
                  Self-Employed
                </option>
                <option
                  value="BUSINESS_OWNER"
                  className="bg-surface text-text-primary"
                >
                  Business Owner
                </option>
                <option value="STUDENT" className="bg-surface text-text-primary">
                  Student
                </option>
                <option value="RETIRED" className="bg-surface text-text-primary">
                  Retired
                </option>
                <option
                  value="UNEMPLOYED"
                  className="bg-surface text-text-primary"
                >
                  Unemployed
                </option>
              </select>
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Monthly Income (USD)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">Country</span>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Bangladesh"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="font-medium text-text-secondary">
                Street Address
              </span>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Street address"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">City</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium text-text-secondary">
                State / Division
              </span>
              <input
                type="text"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                placeholder="State or division"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Postal Code
              </span>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-lg border border-border bg-surface-inner px-4 py-2 font-medium text-text-primary hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-btn-primary px-4 py-2 font-semibold text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Create Customer Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
