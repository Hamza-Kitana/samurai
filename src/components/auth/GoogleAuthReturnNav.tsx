import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/store";

/** After Google redirect sign-in, send the user to the page they came from. */
export function GoogleAuthReturnNav() {
  const navigate = useNavigate();
  const { user, googleReturnPending, consumeLoginNext, clearGoogleReturn } = useAuth();

  useEffect(() => {
    if (!googleReturnPending || !user) return;
    clearGoogleReturn();
    const next = consumeLoginNext();
    if (next === "/profile") {
      void navigate({ to: "/profile", search: { tab: "downloads" } });
    } else if (next === "/checkout") {
      void navigate({ to: "/checkout" });
    } else if (next === "/admin") {
      void navigate({ to: "/admin" });
    }
  }, [googleReturnPending, user, consumeLoginNext, clearGoogleReturn, navigate]);

  return null;
}
