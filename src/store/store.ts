"use client";

// ============================================================================
// VaultEdge — Root Redux Store Configuration
// ============================================================================

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/store/baseApi";
import { authReducer } from "@/features/auth/authSlice";
import { adminReducer } from "@/features/admin/adminSlice";
import { staffReducer } from "@/features/staff/staffSlice";
import { customerReducer } from "@/features/customer/customerSlice";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  admin: adminReducer,
  staff: staffReducer,
  customer: customerReducer,
});

export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

// Create the module-level store instance outside the React render cycle
// and always replaceReducer with the latest rootReducer on HMR updates.
export const appStore = makeStore();
appStore.replaceReducer(rootReducer);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
