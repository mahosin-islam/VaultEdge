// ============================================================================
// VaultEdge — RTK Query Base API Configuration
// Uses HttpOnly cookies (`credentials: "include"`); never stores tokens in localStorage.
// ============================================================================

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "vaultedgeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1",
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "AuthUser",
    "Account",
    "Transaction",
    "Loan",
    "DepositRequest",
    "WithdrawalRequest",
    "Customer",
    "Analytics",
    "Notification",
    "Settings",
  ],
  endpoints: () => ({}),
});
