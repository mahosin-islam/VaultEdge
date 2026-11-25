// ============================================================================
// VaultEdge — RTK Query Authentication Endpoints
// Integrates with /api/v1/auth/{register,login,logout,refresh,me} using HttpOnly cookies.
// ============================================================================

import { baseApi } from "@/store/baseApi";
import { clearAuthSession, setAuthUser } from "@/features/auth/authSlice";
import type { ApiSuccessEnvelope } from "@/types/api.types";
import type { AuthSessionResponseDTO, SafeUserDTO } from "@/types/auth.types";

export interface RegisterRequestPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      ApiSuccessEnvelope<AuthSessionResponseDTO>,
      RegisterRequestPayload
    >({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AuthUser"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.user) {
            dispatch(setAuthUser(data.data.user));
          }
        } catch {
          // Handled by caller
        }
      },
    }),

    login: builder.mutation<
      ApiSuccessEnvelope<AuthSessionResponseDTO>,
      LoginRequestPayload
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AuthUser"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.user) {
            dispatch(setAuthUser(data.data.user));
          }
        } catch {
          // Handled by caller
        }
      },
    }),

    logout: builder.mutation<
      ApiSuccessEnvelope<{ loggedOut: boolean; tokenRevoked: boolean }>,
      void
    >({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["AuthUser"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearAuthSession());
        }
      },
    }),

    refreshSession: builder.mutation<
      ApiSuccessEnvelope<AuthSessionResponseDTO>,
      void
    >({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["AuthUser"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.user) {
            dispatch(setAuthUser(data.data.user));
          }
        } catch {
          dispatch(clearAuthSession());
        }
      },
    }),

    getMe: builder.query<ApiSuccessEnvelope<{ user: SafeUserDTO }>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["AuthUser"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.user) {
            dispatch(setAuthUser(data.data.user));
          }
        } catch {
          dispatch(clearAuthSession());
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshSessionMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi;
