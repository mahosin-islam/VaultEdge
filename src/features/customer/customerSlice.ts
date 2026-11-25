"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CustomerUiState {
  mobileSidebarOpen: boolean;
  searchQuery: string;
  selectedAccountId: string | null;
}

const initialState: CustomerUiState = {
  mobileSidebarOpen: false,
  searchQuery: "",
  selectedAccountId: null,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setCustomerMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
    toggleCustomerMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setCustomerSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setCustomerSelectedAccountId(state, action: PayloadAction<string | null>) {
      state.selectedAccountId = action.payload;
    },
  },
});

export const {
  setCustomerMobileSidebarOpen,
  toggleCustomerMobileSidebar,
  setCustomerSearchQuery,
  setCustomerSelectedAccountId,
} = customerSlice.actions;

export const customerReducer = customerSlice.reducer;
