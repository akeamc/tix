// import { persistQueryClient } from "@tanstack/react-query-persist-client";
// import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  // defaultOptions: {
  //   queries: {
  //     gcTime: 1000 * 60 * 60 * 24, // 24 hours
  //   },
  // },
});

// persistQueryClient({
//   queryClient,
//   persister: createSyncStoragePersister({
//     storage: typeof window === "undefined" ? undefined : window.localStorage,
//   }),
// });
