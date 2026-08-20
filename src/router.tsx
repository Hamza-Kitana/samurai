import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => <LoadingScreen />,
    defaultPendingMs: 200,
    defaultPendingMinMs: 400,
  });

  return router;
};
