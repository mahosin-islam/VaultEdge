// Bank Staff RTK Query Endpoints (All 7 Staff Modules)
import { baseApi } from "@/store/baseApi";
import type {
  AdminAccountsQueryArgs,
  AdminBankAccountDetailResponseDTO,
  AdminBankAccountListItemDTO,
  AdminBankAccountListResponseDTO,
  AdminCustomerDetailResponseDTO,
  AdminCustomerListResponseDTO,
  AdminCustomersQueryArgs,
  AdminLoanDetailResponseDTO,
  AdminLoanListResponseDTO,
  AdminLoansQueryArgs,
  AdminTransactionDetailResponseDTO,
  AdminTransactionListResponseDTO,
  AdminTransactionsQueryArgs,
} from "@/types/admin.types";
import type { ApiSuccessEnvelope } from "@/types/api.types";
import type { SafeUserDTO } from "@/types/auth.types";
import type {
  StaffCreateAccountPayload,
  StaffFlagTransactionPayload,
  StaffOverviewDashboardDTO,
  StaffRegisterCustomerPayload,
  StaffReviewLoanPayload,
  StaffSuspiciousListResponseDTO,
  StaffSuspiciousQueryArgs,
  StaffVerifyCustomerPayload,
} from "@/types/staff.types";

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffOverview: builder.query<
      ApiSuccessEnvelope<StaffOverviewDashboardDTO>,
      void
    >({
      query: () => ({
        url: "/staff/overview",
        method: "GET",
      }),
      providesTags: ["Customer", "Account", "Transaction", "Loan"],
    }),

    // ── Staff Customer Registration & Management ──────────────────────────
    getStaffCustomers: builder.query<
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
          url: qs ? `/staff/customers?${qs}` : "/staff/customers",
          method: "GET",
        };
      },
      providesTags: ["Customer"],
    }),

    getStaffCustomerDetail: builder.query<
      ApiSuccessEnvelope<AdminCustomerDetailResponseDTO>,
      string
    >({
      query: (customerId) => ({
        url: `/staff/customers/${customerId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, customerId) => [
        { type: "Customer", id: customerId },
        "Customer",
      ],
    }),

    registerStaffCustomer: builder.mutation<
      ApiSuccessEnvelope<{ customer: SafeUserDTO }>,
      StaffRegisterCustomerPayload
    >({
      query: (body) => ({
        url: "/staff/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer", "Analytics"],
    }),

    // ── Staff Bank Account Management ─────────────────────────────────────
    getStaffAccounts: builder.query<
      ApiSuccessEnvelope<AdminBankAccountListResponseDTO>,
      AdminAccountsQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.accountType) searchParams.set("accountType", params.accountType);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.userId) searchParams.set("userId", params.userId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/staff/accounts?${qs}` : "/staff/accounts",
          method: "GET",
        };
      },
      providesTags: ["Account"],
    }),

    getStaffAccountDetail: builder.query<
      ApiSuccessEnvelope<AdminBankAccountDetailResponseDTO>,
      string
    >({
      query: (accountId) => ({
        url: `/staff/accounts/${accountId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, accountId) => [
        { type: "Account", id: accountId },
        "Account",
      ],
    }),

    createStaffAccount: builder.mutation<
      ApiSuccessEnvelope<{ account: AdminBankAccountListItemDTO }>,
      StaffCreateAccountPayload
    >({
      query: (body) => ({
        url: "/staff/accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Account", "Customer", "Transaction", "Analytics"],
    }),

    // ── Staff Customer KYC Verification ───────────────────────────────────
    verifyStaffCustomerKyc: builder.mutation<
      ApiSuccessEnvelope<{ customer: SafeUserDTO }>,
      StaffVerifyCustomerPayload
    >({
      query: ({ customerId, ...body }) => ({
        url: `/staff/customers/${customerId}/verify`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Customer", id: arg.customerId },
        "Customer",
        "Analytics",
      ],
    }),

    // ── Staff Transaction Review & Flagging ───────────────────────────────
    getStaffTransactions: builder.query<
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
        const qs = searchParams.toString();
        return {
          url: qs ? `/staff/transactions?${qs}` : "/staff/transactions",
          method: "GET",
        };
      },
      providesTags: ["Transaction"],
    }),

    getStaffTransactionDetail: builder.query<
      ApiSuccessEnvelope<AdminTransactionDetailResponseDTO>,
      string
    >({
      query: (transactionId) => ({
        url: `/staff/transactions/${transactionId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, transactionId) => [
        { type: "Transaction", id: transactionId },
        "Transaction",
      ],
    }),

    flagStaffTransaction: builder.mutation<
      ApiSuccessEnvelope<{ flag: Record<string, unknown> }>,
      StaffFlagTransactionPayload
    >({
      query: ({ transactionId, ...body }) => ({
        url: `/staff/transactions/${transactionId}/flag`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Transaction", id: arg.transactionId },
        "Transaction",
        "Analytics",
      ],
    }),

    getStaffSuspiciousTransactions: builder.query<
      ApiSuccessEnvelope<StaffSuspiciousListResponseDTO>,
      StaffSuspiciousQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.search) searchParams.set("search", params.search);
        const qs = searchParams.toString();
        return {
          url: qs
            ? `/staff/suspicious-transactions?${qs}`
            : "/staff/suspicious-transactions",
          method: "GET",
        };
      },
      providesTags: ["Transaction"],
    }),

    // ── Staff Loan Application Review & Forwarding ────────────────────────
    getStaffLoans: builder.query<
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
        const qs = searchParams.toString();
        return {
          url: qs ? `/staff/loans?${qs}` : "/staff/loans",
          method: "GET",
        };
      },
      providesTags: ["Loan"],
    }),

    getStaffLoanDetail: builder.query<
      ApiSuccessEnvelope<AdminLoanDetailResponseDTO>,
      string
    >({
      query: (loanId) => ({
        url: `/staff/loans/${loanId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, loanId) => [
        { type: "Loan", id: loanId },
        "Loan",
      ],
    }),

    reviewStaffLoan: builder.mutation<
      ApiSuccessEnvelope<Record<string, unknown>>,
      StaffReviewLoanPayload
    >({
      query: ({ loanId, ...body }) => ({
        url: `/staff/loans/${loanId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "Loan", id: arg.loanId },
        "Loan",
        "Analytics",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStaffOverviewQuery,
  useGetStaffCustomersQuery,
  useGetStaffCustomerDetailQuery,
  useRegisterStaffCustomerMutation,
  useGetStaffAccountsQuery,
  useGetStaffAccountDetailQuery,
  useCreateStaffAccountMutation,
  useVerifyStaffCustomerKycMutation,
  useGetStaffTransactionsQuery,
  useGetStaffTransactionDetailQuery,
  useFlagStaffTransactionMutation,
  useGetStaffSuspiciousTransactionsQuery,
  useGetStaffLoansQuery,
  useGetStaffLoanDetailQuery,
  useReviewStaffLoanMutation,
} = staffApi;
