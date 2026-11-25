// ============================================================================
// VaultEdge — Admin RTK Query API Endpoints
// Connects Admin Overview & Modules UI to real database endpoints under /api/v1/admin/*
// ============================================================================

import { baseApi } from "@/store/baseApi";
import type { ApiSuccessEnvelope } from "@/types/api.types";
import type {
  AdminAccountsQueryArgs,
  AdminAnalyticsReportDTO,
  AdminBankAccountDetailResponseDTO,
  AdminBankAccountListItemDTO,
  AdminBankAccountListResponseDTO,
  AdminCustomerDetailResponseDTO,
  AdminCustomerListResponseDTO,
  AdminCustomersQueryArgs,
  AdminCustomerTransactionsResponseDTO,
  AdminDepositDetailResponseDTO,
  AdminDepositListResponseDTO,
  AdminDepositsQueryArgs,
  AdminLoanDetailResponseDTO,
  AdminLoanListResponseDTO,
  AdminLoansQueryArgs,
  AdminOverviewDashboardDTO,
  AdminReviewTransactionPayload,
  AdminSystemSettingsDTO,
  AdminTransactionDetailResponseDTO,
  AdminTransactionListResponseDTO,
  AdminTransactionsQueryArgs,
  AdminUpdateSettingsPayload,
  AdminWithdrawalDetailResponseDTO,
  AdminWithdrawalListResponseDTO,
  AdminWithdrawalsQueryArgs,
} from "@/types/admin.types";
import type { SafeUserDTO } from "@/types/auth.types";

export interface AdminOverviewQueryArgs {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<
      ApiSuccessEnvelope<AdminOverviewDashboardDTO>,
      AdminOverviewQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.months) {
          searchParams.set("months", String(params.months));
        }
        if (params?.startDate) {
          searchParams.set("startDate", params.startDate);
        }
        if (params?.endDate) {
          searchParams.set("endDate", params.endDate);
        }
        const qs = searchParams.toString();
        return {
          url: `/admin/overview${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [
        "Analytics",
        "Account",
        "Transaction",
        "Loan",
        "DepositRequest",
        "WithdrawalRequest",
        "Customer",
      ],
    }),

    decideAdminDeposit: builder.mutation<
      ApiSuccessEnvelope<unknown>,
      { depositId: string; decision: "APPROVE" | "REJECT"; reviewNote?: string }
    >({
      query: ({ depositId, ...body }) => ({
        url: `/admin/deposits/${depositId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        "Analytics",
        "DepositRequest",
        "Account",
        "Transaction",
      ],
    }),

    decideAdminWithdrawal: builder.mutation<
      ApiSuccessEnvelope<unknown>,
      {
        withdrawalId: string;
        decision: "APPROVE" | "REJECT";
        reviewNote?: string;
      }
    >({
      query: ({ withdrawalId, ...body }) => ({
        url: `/admin/withdrawals/${withdrawalId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        "Analytics",
        "WithdrawalRequest",
        "Account",
        "Transaction",
      ],
    }),

    decideAdminLoan: builder.mutation<
      ApiSuccessEnvelope<unknown>,
      {
        loanId: string;
        decision: "APPROVE" | "REJECT";
        approvedAmount?: number;
        interestRate?: number;
        note?: string;
        rejectionReason?: string;
      }
    >({
      query: ({ loanId, ...body }) => ({
        url: `/admin/loans/${loanId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Analytics", "Loan", "Account", "Transaction"],
    }),

    freezeAdminAccount: builder.mutation<
      ApiSuccessEnvelope<unknown>,
      { accountId: string; status: "FROZEN" | "ACTIVE"; reason: string }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/admin/accounts/${accountId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Analytics", "Account", "Transaction"],
    }),

    // ------------------------------------------------------------------------
    // Admin Customer Management Endpoints
    // ------------------------------------------------------------------------
    getAdminCustomers: builder.query<
      ApiSuccessEnvelope<AdminCustomerListResponseDTO>,
      AdminCustomersQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.kycStatus) searchParams.set("kycStatus", params.kycStatus);
        const qs = searchParams.toString();
        return {
          url: `/admin/customers${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Customer", "Account"],
    }),

    getAdminCustomerDetail: builder.query<
      ApiSuccessEnvelope<AdminCustomerDetailResponseDTO>,
      string
    >({
      query: (customerId) => ({
        url: `/admin/customers/${customerId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, customerId) => [
        { type: "Customer", id: customerId },
        "Customer",
        "Account",
      ],
    }),

    getAdminCustomerTransactions: builder.query<
      ApiSuccessEnvelope<AdminCustomerTransactionsResponseDTO>,
      { customerId: string; page?: number; limit?: number }
    >({
      query: ({ customerId, page = 1, limit = 15 }) => ({
        url: `/admin/customers/${customerId}/transactions?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: (_result, _err, arg) => [
        { type: "Customer", id: arg.customerId },
        "Transaction",
      ],
    }),

    updateAdminCustomerStatus: builder.mutation<
      ApiSuccessEnvelope<{ customer: SafeUserDTO }>,
      {
        customerId: string;
        status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
        reason?: string;
        kycStatus?: "PENDING" | "VERIFIED" | "REJECTED";
      }
    >({
      query: ({ customerId, ...body }) => ({
        url: `/admin/customers/${customerId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Customer", id: arg.customerId },
        "Customer",
        "Account",
        "Analytics",
      ],
    }),

    createAdminBankAccount: builder.mutation<
      ApiSuccessEnvelope<unknown>,
      {
        userId: string;
        accountType: "SAVINGS" | "CURRENT" | "BUSINESS";
        accountTitle?: string;
        initialDeposit?: number;
      }
    >({
      query: (body) => ({
        url: "/admin/accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer", "Account", "Analytics", "Transaction"],
    }),

    // ------------------------------------------------------------------------
    // Admin Bank Account Management Endpoints
    // ------------------------------------------------------------------------
    getAdminAccounts: builder.query<
      ApiSuccessEnvelope<AdminBankAccountListResponseDTO>,
      AdminAccountsQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.accountType)
          searchParams.set("accountType", params.accountType);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.userId) searchParams.set("userId", params.userId);
        const qs = searchParams.toString();
        return {
          url: `/admin/accounts${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Account", "Customer"],
    }),

    getAdminAccountDetail: builder.query<
      ApiSuccessEnvelope<AdminBankAccountDetailResponseDTO>,
      string
    >({
      query: (accountId) => ({
        url: `/admin/accounts/${accountId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, accountId) => [
        { type: "Account", id: accountId },
        "Account",
        "Transaction",
      ],
    }),

    updateAdminAccountInfo: builder.mutation<
      ApiSuccessEnvelope<{ account: AdminBankAccountListItemDTO }>,
      {
        accountId: string;
        accountTitle?: string;
        accountType?: "SAVINGS" | "CURRENT" | "BUSINESS";
      }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/admin/accounts/${accountId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Account", id: arg.accountId },
        "Account",
        "Customer",
      ],
    }),

    updateAdminAccountStatus: builder.mutation<
      ApiSuccessEnvelope<{ account: AdminBankAccountListItemDTO }>,
      {
        accountId: string;
        status: "ACTIVE" | "FROZEN" | "INACTIVE" | "BLOCKED";
        reason?: string;
      }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/admin/accounts/${accountId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Account", id: arg.accountId },
        "Account",
        "Customer",
        "Analytics",
      ],
    }),

    updateAdminAccountLimits: builder.mutation<
      ApiSuccessEnvelope<{ account: AdminBankAccountListItemDTO }>,
      {
        accountId: string;
        dailyTransferLimit?: number | null;
        maxSingleTransactionLimit?: number | null;
        minBalanceRequired?: number | null;
      }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/admin/accounts/${accountId}/limits`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Account", id: arg.accountId },
        "Account",
      ],
    }),

    // ── Admin Transaction Management ──────────────────────────────────────
    getAdminTransactions: builder.query<
      ApiSuccessEnvelope<AdminTransactionListResponseDTO>,
      AdminTransactionsQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.referenceId) searchParams.set("referenceId", params.referenceId);
        if (params?.type) searchParams.set("type", params.type);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.isFlagged) searchParams.set("isFlagged", params.isFlagged);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        if (params?.customerId) searchParams.set("customerId", params.customerId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/admin/transactions?${qs}` : "/admin/transactions",
          method: "GET",
        };
      },
      providesTags: ["Transaction", "Analytics"],
    }),

    getAdminTransactionDetail: builder.query<
      ApiSuccessEnvelope<AdminTransactionDetailResponseDTO>,
      string
    >({
      query: (transactionId) => ({
        url: `/admin/transactions/${transactionId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, transactionId) => [
        { type: "Transaction", id: transactionId },
        "Transaction",
      ],
    }),

    reviewAdminTransaction: builder.mutation<
      ApiSuccessEnvelope<Record<string, unknown>>,
      AdminReviewTransactionPayload
    >({
      query: ({ transactionId, ...body }) => ({
        url: `/admin/transactions/${transactionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Transaction", id: arg.transactionId },
        "Transaction",
        "Account",
        "Analytics",
      ],
    }),

    // ── Admin Deposit Request Management ──────────────────────────────────
    getAdminDeposits: builder.query<
      ApiSuccessEnvelope<AdminDepositListResponseDTO>,
      AdminDepositsQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        if (params?.customerId) searchParams.set("customerId", params.customerId);
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/admin/deposits?${qs}` : "/admin/deposits",
          method: "GET",
        };
      },
      providesTags: ["DepositRequest", "Analytics"],
    }),

    getAdminDepositDetail: builder.query<
      ApiSuccessEnvelope<AdminDepositDetailResponseDTO>,
      string
    >({
      query: (depositId) => ({
        url: `/admin/deposits/${depositId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, depositId) => [
        { type: "DepositRequest", id: depositId },
        "DepositRequest",
      ],
    }),

    // ── Admin Withdrawal Request Management ───────────────────────────────
    getAdminWithdrawals: builder.query<
      ApiSuccessEnvelope<AdminWithdrawalListResponseDTO>,
      AdminWithdrawalsQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        if (params?.customerId) searchParams.set("customerId", params.customerId);
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/admin/withdrawals?${qs}` : "/admin/withdrawals",
          method: "GET",
        };
      },
      providesTags: ["WithdrawalRequest", "Analytics"],
    }),

    getAdminWithdrawalDetail: builder.query<
      ApiSuccessEnvelope<AdminWithdrawalDetailResponseDTO>,
      string
    >({
      query: (withdrawalId) => ({
        url: `/admin/withdrawals/${withdrawalId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, withdrawalId) => [
        { type: "WithdrawalRequest", id: withdrawalId },
        "WithdrawalRequest",
      ],
    }),

    // ── Admin Loan Management ─────────────────────────────────────────────
    getAdminLoans: builder.query<
      ApiSuccessEnvelope<AdminLoanListResponseDTO>,
      AdminLoansQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.loanType) searchParams.set("loanType", params.loanType);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        if (params?.customerId) searchParams.set("customerId", params.customerId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/admin/loans?${qs}` : "/admin/loans",
          method: "GET",
        };
      },
      providesTags: ["Loan", "Analytics"],
    }),

    getAdminLoanDetail: builder.query<
      ApiSuccessEnvelope<AdminLoanDetailResponseDTO>,
      string
    >({
      query: (loanId) => ({
        url: `/admin/loans/${loanId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, loanId) => [
        { type: "Loan", id: loanId },
        "Loan",
      ],
    }),

    // ── Admin Full Analytics ──────────────────────────────────────────────
    getAdminAnalytics: builder.query<
      ApiSuccessEnvelope<AdminAnalyticsReportDTO>,
      AdminOverviewQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.months) searchParams.set("months", String(params.months));
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        const qs = searchParams.toString();
        return {
          url: qs ? `/admin/analytics?${qs}` : "/admin/analytics",
          method: "GET",
        };
      },
      providesTags: ["Analytics"],
    }),

    // ── Admin Bank-Wide Settings ──────────────────────────────────────────
    getAdminSettings: builder.query<
      ApiSuccessEnvelope<{ settings: AdminSystemSettingsDTO }>,
      void
    >({
      query: () => ({
        url: "/admin/settings",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),

    updateAdminSettings: builder.mutation<
      ApiSuccessEnvelope<{ settings: AdminSystemSettingsDTO }>,
      AdminUpdateSettingsPayload
    >({
      query: (body) => ({
        url: "/admin/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Settings", "Account", "Analytics"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminOverviewQuery,
  useDecideAdminDepositMutation,
  useDecideAdminWithdrawalMutation,
  useDecideAdminLoanMutation,
  useFreezeAdminAccountMutation,
  useGetAdminCustomersQuery,
  useGetAdminCustomerDetailQuery,
  useLazyGetAdminCustomerTransactionsQuery,
  useUpdateAdminCustomerStatusMutation,
  useCreateAdminBankAccountMutation,
  useGetAdminAccountsQuery,
  useGetAdminAccountDetailQuery,
  useUpdateAdminAccountInfoMutation,
  useUpdateAdminAccountStatusMutation,
  useUpdateAdminAccountLimitsMutation,
  useGetAdminTransactionsQuery,
  useGetAdminTransactionDetailQuery,
  useReviewAdminTransactionMutation,
  useGetAdminDepositsQuery,
  useGetAdminDepositDetailQuery,
  useGetAdminWithdrawalsQuery,
  useGetAdminWithdrawalDetailQuery,
  useGetAdminLoansQuery,
  useGetAdminLoanDetailQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} = adminApi;
