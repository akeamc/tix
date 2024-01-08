"use client";

import { QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";

import { PropsWithChildren } from "react";
import { queryClient } from "./queryClient";

export default function QueryClientProvider({
  children,
}: PropsWithChildren<{}>) {
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  );
}
