"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OrderDetails {
  id: string;
  email: string;
}

interface OrderStore {
  details: OrderDetails | null;
  setDetails: (order: OrderDetails | null) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      details: null,
      setDetails: (details) => set({ details }),
    }),
    {
      name: "order",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
