import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minut – nie odświeżaj jeśli dane świeże
      gcTime: 1000 * 60 * 30,   // 30 minut w cache
      retry: 2,
      refetchOnWindowFocus: false, // Oszczędność DB Reads
    },
    mutations: {
      retry: 1,
    },
  },
})
