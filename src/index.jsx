import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const container = document.getElementById("root");
const root = createRoot(container);
// Cache defaults for every query that does not override them.
//
// Without these, v5 defaults apply: staleTime 0 (every mount refetches),
// gcTime 5min, and a refetch on every window focus — which meant opening
// and closing a drawer re-hit the API each time.
//
// Mutations still call invalidateQueries, and that refetches active
// queries regardless of staleTime, so saves show up immediately.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // treat data as fresh for 2 minutes
      gcTime: 15 * 60 * 1000, // keep unused data in memory for 15 minutes
      refetchOnWindowFocus: false, // tabbing back should not refetch everything
      retry: 1, // one retry; a 401 already redirects to /login
    },
  },
});
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
