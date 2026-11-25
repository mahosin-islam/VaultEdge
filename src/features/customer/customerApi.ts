// Customer Portal RTK Query Endpoints (All 10 Pages & 11 Modules)
import { baseApi } from "@/store/baseApi";
import type { ApiSuccessEnvelope } from "@/types/api.types";
import type { SafeUserDTO } from "@/types/auth.types";
import type {
  CustomerAccountDetailResponseDTO,
  CustomerAccountsListResponseDTO,
  CustomerAccountTransactionsQueryArgs,
  CustomerAccountTransactionsResponseDTO,
  CustomerApplyLoanPayload,
  CustomerConfigurePinPayload,
  CustomerDepositRequestDetailResponseDTO,
  CustomerDepositRequestPayload,
  CustomerDepositRequestsListResponseDTO,
  CustomerLoanDetailResponseDTO,
  CustomerLoansListResponseDTO,
  CustomerLoansQueryArgs,
  CustomerNotificationsResponseDTO,
  CustomerOverviewDashboardDTO,
  CustomerOverviewQueryArgs,
  CustomerRepayLoanPayload,
  CustomerRequestListQueryArgs,
  CustomerStatementQueryArgs,
  CustomerStatementResponseDTO,
  CustomerTransactionDetailResponseDTO,
  CustomerTransactionsListQueryArgs,
  CustomerTransactionsListResponseDTO,
  CustomerTransferPayload,
  CustomerTransferResponseDTO,
  CustomerUpdateProfilePayload,
  CustomerWithdrawalRequestDetailResponseDTO,
  CustomerWithdrawalRequestPayload,
  CustomerWithdrawalRequestsListResponseDTO,
} from "@/types/customer.types";

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerOverview: builder.query<
      ApiSuccessEnvelope<CustomerOverviewDashboardDTO>,
      CustomerOverviewQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        if (params?.months) searchParams.set("months", String(params.months));
        const qs = searchParams.toString();
        return {
          url: qs ? `/customer/overview?${qs}` : "/customer/overview",
          method: "GET",
        };
      },
      providesTags: ["Account", "Transaction", "Loan"],
    }),

    getCustomerNotifications: builder.query<
      ApiSuccessEnvelope<CustomerNotificationsResponseDTO>,
      { limit?: number; page?: number; unreadOnly?: boolean } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.unreadOnly !== undefined) {
          searchParams.set("unreadOnly", String(params.unreadOnly));
        }
        const qs = searchParams.toString();
        return {
          url: qs ? `/notifications?${qs}` : "/notifications",
          method: "GET",
        };
      },
      providesTags: ["Notification"],
    }),

    markCustomerNotificationRead: builder.mutation<
      ApiSuccessEnvelope<Record<string, unknown>>,
      string
    >({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllCustomerNotificationsRead: builder.mutation<
      ApiSuccessEnvelope<Record<string, unknown>>,
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    getCustomerAccounts: builder.query<
      ApiSuccessEnvelope<CustomerAccountsListResponseDTO>,
      void
    >({
      query: () => ({
        url: "/accounts",
        method: "GET",
      }),
      providesTags: ["Account"],
    }),

    getCustomerAccountDetail: builder.query<
      ApiSuccessEnvelope<CustomerAccountDetailResponseDTO>,
      string
    >({
      query: (accountId) => ({
        url: `/accounts/${accountId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, accountId) => [
        { type: "Account", id: accountId },
        "Account",
      ],
    }),

    getCustomerAccountTransactions: builder.query<
      ApiSuccessEnvelope<CustomerAccountTransactionsResponseDTO>,
      CustomerAccountTransactionsQueryArgs
    >({
      query: ({ accountId, page, limit, type, status, startDate, endDate }) => {
        const searchParams = new URLSearchParams();
        if (page) searchParams.set("page", String(page));
        if (limit) searchParams.set("limit", String(limit));
        if (type) searchParams.set("type", type);
        if (status) searchParams.set("status", status);
        if (startDate) searchParams.set("startDate", startDate);
        if (endDate) searchParams.set("endDate", endDate);
        const qs = searchParams.toString();
        return {
          url: qs
            ? `/accounts/${accountId}/transactions?${qs}`
            : `/accounts/${accountId}/transactions`,
          method: "GET",
        };
      },
      providesTags: (_result, _err, arg) => [
        { type: "Transaction", id: arg.accountId },
        "Transaction",
      ],
    }),

    executeCustomerTransfer: builder.mutation<
      ApiSuccessEnvelope<CustomerTransferResponseDTO>,
      CustomerTransferPayload
    >({
      query: (body) => ({
        url: "/transfers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Account", "Transaction", "Notification"],
    }),

    getCustomerDepositRequests: builder.query<
      ApiSuccessEnvelope<CustomerDepositRequestsListResponseDTO>,
      CustomerRequestListQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/deposits?${qs}` : "/deposits",
          method: "GET",
        };
      },
      providesTags: ["DepositRequest"],
    }),

    getCustomerDepositRequestDetail: builder.query<
      ApiSuccessEnvelope<CustomerDepositRequestDetailResponseDTO>,
      string
    >({
      query: (depositId) => ({
        url: `/deposits/${depositId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, depositId) => [
        { type: "DepositRequest", id: depositId },
        "DepositRequest",
      ],
    }),

    createCustomerDepositRequest: builder.mutation<
      ApiSuccessEnvelope<CustomerDepositRequestDetailResponseDTO>,
      CustomerDepositRequestPayload
    >({
      query: (body) => ({
        url: "/deposits",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DepositRequest", "Notification"],
    }),

    getCustomerWithdrawalRequests: builder.query<
      ApiSuccessEnvelope<CustomerWithdrawalRequestsListResponseDTO>,
      CustomerRequestListQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        const qs = searchParams.toString();
        return {
          url: qs ? `/withdrawals?${qs}` : "/withdrawals",
          method: "GET",
        };
      },
      providesTags: ["WithdrawalRequest"],
    }),

    getCustomerWithdrawalRequestDetail: builder.query<
      ApiSuccessEnvelope<CustomerWithdrawalRequestDetailResponseDTO>,
      string
    >({
      query: (withdrawalId) => ({
        url: `/withdrawals/${withdrawalId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, withdrawalId) => [
        { type: "WithdrawalRequest", id: withdrawalId },
        "WithdrawalRequest",
      ],
    }),

    createCustomerWithdrawalRequest: builder.mutation<
      ApiSuccessEnvelope<CustomerWithdrawalRequestDetailResponseDTO>,
      CustomerWithdrawalRequestPayload
    >({
      query: (body) => ({
        url: "/withdrawals",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WithdrawalRequest", "Notification"],
    }),

    getCustomerTransactions: builder.query<
      ApiSuccessEnvelope<CustomerTransactionsListResponseDTO>,
      CustomerTransactionsListQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.accountId) searchParams.set("accountId", params.accountId);
        if (params?.type) searchParams.set("type", params.type);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.search) searchParams.set("search", params.search);
        if (params?.referenceId) searchParams.set("referenceId", params.referenceId);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        const qs = searchParams.toString();
        return {
          url: qs ? `/transactions?${qs}` : "/transactions",
          method: "GET",
        };
      },
      providesTags: ["Transaction"],
    }),

    getCustomerTransactionDetail: builder.query<
      ApiSuccessEnvelope<CustomerTransactionDetailResponseDTO>,
      string
    >({
      query: (transactionId) => ({
        url: `/transactions/${transactionId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, transactionId) => [
        { type: "Transaction", id: transactionId },
        "Transaction",
      ],
    }),

    getCustomerLoans: builder.query<
      ApiSuccessEnvelope<CustomerLoansListResponseDTO>,
      CustomerLoansQueryArgs | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.loanType) searchParams.set("loanType", params.loanType);
        const qs = searchParams.toString();
        return {
          url: qs ? `/loans?${qs}` : "/loans",
          method: "GET",
        };
      },
      providesTags: ["Loan"],
    }),

    getCustomerLoanDetail: builder.query<
      ApiSuccessEnvelope<CustomerLoanDetailResponseDTO>,
      string
    >({
      query: (loanId) => ({
        url: `/loans/${loanId}`,
        method: "GET",
      }),
      providesTags: (_result, _err, loanId) => [
        { type: "Loan", id: loanId },
        "Loan",
      ],
    }),

    applyCustomerLoan: builder.mutation<
      ApiSuccessEnvelope<{ loan: Record<string, unknown> }>,
      CustomerApplyLoanPayload
    >({
      query: (body) => ({
        url: "/loans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Notification"],
    }),

    repayCustomerLoan: builder.mutation<
      ApiSuccessEnvelope<Record<string, unknown>>,
      CustomerRepayLoanPayload
    >({
      query: ({ loanId, ...body }) => ({
        url: `/loans/${loanId}/repay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Account", "Transaction", "Notification"],
    }),

    getCustomerStatement: builder.query<
      ApiSuccessEnvelope<CustomerStatementResponseDTO>,
      CustomerStatementQueryArgs
    >({
      query: ({ accountId, startDate, endDate }) => {
        const searchParams = new URLSearchParams();
        searchParams.set("accountId", accountId);
        searchParams.set("format", "json");
        if (startDate) searchParams.set("startDate", startDate);
        if (endDate) searchParams.set("endDate", endDate);
        return {
          url: `/statements?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (_result, _err, arg) => [
        { type: "Transaction", id: arg.accountId },
        "Account",
      ],
    }),

    getCustomerProfile: builder.query<
      ApiSuccessEnvelope<{ profile: SafeUserDTO }>,
      void
    >({
      query: () => ({
        url: "/customer/profile",
        method: "GET",
      }),
      providesTags: ["AuthUser"],
    }),

    updateCustomerProfile: builder.mutation<
      ApiSuccessEnvelope<{ profile: SafeUserDTO }>,
      CustomerUpdateProfilePayload
    >({
      query: (body) => ({
        url: "/customer/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AuthUser"],
    }),

    configureCustomerPin: builder.mutation<
      ApiSuccessEnvelope<{ hasTransactionPin: boolean }>,
      CustomerConfigurePinPayload
    >({
      query: ({ isUpdate, ...body }) => ({
        url: "/customer/security/pin",
        method: isUpdate ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["AuthUser"],
    }),
  }),
});

export const {
  useGetCustomerOverviewQuery,
  useGetCustomerNotificationsQuery,
  useMarkCustomerNotificationReadMutation,
  useMarkAllCustomerNotificationsReadMutation,
  useGetCustomerAccountsQuery,
  useGetCustomerAccountDetailQuery,
  useGetCustomerAccountTransactionsQuery,
  useExecuteCustomerTransferMutation,
  useGetCustomerDepositRequestsQuery,
  useGetCustomerDepositRequestDetailQuery,
  useCreateCustomerDepositRequestMutation,
  useGetCustomerWithdrawalRequestsQuery,
  useGetCustomerWithdrawalRequestDetailQuery,
  useCreateCustomerWithdrawalRequestMutation,
  useGetCustomerTransactionsQuery,
  useGetCustomerTransactionDetailQuery,
  useGetCustomerLoansQuery,
  useGetCustomerLoanDetailQuery,
  useApplyCustomerLoanMutation,
  useRepayCustomerLoanMutation,
  useGetCustomerStatementQuery,
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useConfigureCustomerPinMutation,
} = customerApi;
