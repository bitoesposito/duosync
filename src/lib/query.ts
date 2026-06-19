import { QueryClient } from "@tanstack/react-query";

/**
 * Light cross-user sync without push: refetch on focus + a slow poll while the
 * tab is visible. Cheap — nowhere near D1 free limits for a demo.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchInterval: 20_000,
      staleTime: 10_000,
      retry: 1,
    },
  },
});
