// ============================================================================
// VaultEdge — Admin Feature Redux Slice
// Manages Admin Overview timeframe filter, search query, and sidebar state.
// ============================================================================

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AdminTimeframeMonths = 1 | 3 | 6 | 12;

export interface AdminUiState {
  overviewMonths: AdminTimeframeMonths;
  searchQuery: string;
  mobileSidebarOpen: boolean;
}

const initialState: AdminUiState = {
  overviewMonths: 6,
  searchQuery: "",
  mobileSidebarOpen: false,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdminOverviewMonths(state, action: PayloadAction<AdminTimeframeMonths>) {
      state.overviewMonths = action.payload;
    },
    setAdminSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setAdminMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
    toggleAdminMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
  },
});

export const {
  setAdminOverviewMonths,
  setAdminSearchQuery,
  setAdminMobileSidebarOpen,
  toggleAdminMobileSidebar,
} = adminSlice.actions;

export const adminReducer = adminSlice.reducer;
