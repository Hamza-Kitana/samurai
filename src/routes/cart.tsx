import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCart } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, openCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length > 0) {
      void navigate({ to: "/checkout", replace: true });
    } else {
      openCart();
      void navigate({ to: "/store", replace: true });
    }
  }, [items.length, openCart, navigate]);

  return null;
}
