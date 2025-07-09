import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from '@/components/guards';
import Page from "../pages/index";

export const Route = createFileRoute("/")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
