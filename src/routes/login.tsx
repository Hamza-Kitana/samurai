import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { staff?: boolean } => {
    const raw = search["staff"];
    return raw === true || raw === "1" || raw === "true" ? { staff: true } : {};
  },
  component: LoginPage,
});

function LoginPage() {
  const { staff } = Route.useSearch();
  const { openLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    openLogin({ staff: Boolean(staff) });
    void navigate({ to: "/", replace: true });
  }, [openLogin, staff, navigate]);

  return null;
}
