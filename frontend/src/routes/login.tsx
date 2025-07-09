import { createFileRoute } from "@tanstack/react-router";
import { AuthRoute } from "@/components/guards";
import { LoginPage } from "@/pages/auth/login";

export const Route = createFileRoute("/login")({
  component: () => (
    <AuthRoute>
      <LoginPage />
    </AuthRoute>
  ),
});
