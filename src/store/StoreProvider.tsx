"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { appStore } from "@/store/store";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={appStore}>{children}</Provider>;
}
