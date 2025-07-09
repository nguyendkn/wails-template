import { createFileRoute } from "@tanstack/react-router";
import { AuthRoute } from "@/components/guards";
import { RegisterPage } from "@/pages/auth/register";

export const Route = createFileRoute("/register")({
  component: () => (
    <AuthRoute>
      <RegisterPage />
    </AuthRoute>
  ),
});
