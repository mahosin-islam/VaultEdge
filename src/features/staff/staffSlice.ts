"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface StaffUiState {
  mobileSidebarOpen: boolean;
  searchQuery: string;
}

const initialState: StaffUiState = {
  mobileSidebarOpen: false,
  searchQuery: "",
};

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    setStaffMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
    toggleStaffMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setStaffSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setStaffMobileSidebarOpen,
  toggleStaffMobileSidebar,
  setStaffSearchQuery,
} = staffSlice.actions;

export const staffReducer = staffSlice.reducer;
