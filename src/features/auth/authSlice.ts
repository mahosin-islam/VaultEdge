// ============================================================================
// VaultEdge — Authentication Redux Slice
// Stores safe user session summary and UI status; never stores raw tokens.
// ============================================================================

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SafeUserDTO } from "@/types/auth.types";

export interface AuthState {
  user: SafeUserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  errorMessage: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<SafeUserDTO>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.errorMessage = null;
    },
    clearAuthSession(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.errorMessage = null;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setAuthUser,
  clearAuthSession,
  setAuthLoading,
  setAuthError,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
