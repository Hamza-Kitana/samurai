import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageLayout, pageGutter } from "@/components/layout/PageLayout";
import { ProductImage } from "@/components/store/ProductImage";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLang } from "@/lib/i18n";
import { useAuth, useCart, money } from "@/lib/store";
import { checkout } from "@/lib/checkout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t, lang } = useLang();
  const { items, remove, clear, total } = useCart();
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!user) {
      toast.error(t("login_required"));
      openLogin({ next: "/checkout" });
      return;
    }
    if (items.length === 0) return;

    setPaying(true);
    try {
      await checkout(items, user.id);
      clear();
      void queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["downloads", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(t("order_success"));
      void navigate({ to: "/profile", search: { tab: "downloads" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageLayout>
        <div className={cn("mx-auto max-w-lg py-24 text-center", pageGutter)}>
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="font-display text-2xl font-semibold">{t("cart_empty")}</h1>
          <Button asChild className="mt-6">
            <Link to="/store">{t("hero_cta")}</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <div className={cn("animate-rise py-8 sm:py-12", pageGutter)}>
        <Button variant="ghost" size="sm" asChild className="mb-8 gap-1">
          <Link to="/store">
            <ArrowLeft className="h-4 w-4" />
            {t("continue_shopping")}
          </Link>
        </Button>

        <div className="mb-8">
          <p className="text-[11px] tracking-[0.3em] text-primary uppercase">{t("checkout")}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-wide sm:text-4xl">
            {t("checkout_title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("checkout_sub")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
          <section className="border border-white/10 bg-[#12100e]">
            <div className="border-b border-white/8 px-5 py-4 sm:px-6">
              <h2 className="font-display text-lg font-semibold">{t("checkout_items")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {items.length} {t("cart_items")}
              </p>
            </div>

            <ul className="divide-y divide-white/8">
              {items.map((item) => {
                const title = lang === "ar" ? item.title_ar : item.title_en;
                return (
                  <li key={item.id} className="flex gap-4 p-4 sm:p-5">
                    <div className="h-20 w-28 shrink-0 overflow-hidden border border-white/8">
                      <ProductImage title={title} imageUrl={item.image_url} category="maps" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <Link
                          to="/product/$slug"
                          params={{ slug: item.slug }}
                          className="line-clamp-2 font-medium leading-snug hover:text-primary"
                        >
                          {title}
                        </Link>
                        <p className="mt-2 font-display text-xl font-semibold text-gold-gradient">
                          {money(item.price)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="shrink-0 self-start p-2 text-muted-foreground transition hover:text-destructive"
                      aria-label={t("remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-white/10 bg-[#12100e] p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold">{t("checkout_summary")}</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("checkout_subtotal")}</span>
                  <span>{money(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("checkout_fees")}</span>
                  <span className="text-primary">{t("checkout_free")}</span>
                </div>
              </div>

              <Separator className="my-5 bg-white/8" />

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("total")}</span>
                <span className="font-display text-2xl font-semibold text-gold-gradient">
                  {money(total)}
                </span>
              </div>

              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("secure_note")}
              </p>

              {!user && (
                <p className="mt-3 rounded border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">
                  {t("login_required")}
                </p>
              )}

              <Button
                size="lg"
                className="mt-5 w-full gap-2 font-semibold tracking-wide"
                onClick={() => void handlePay()}
                disabled={paying}
              >
                {paying ? t("loading") : t("place_order")}
              </Button>

              <Button variant="outline" className="mt-3 w-full border-white/15" asChild>
                <Link to="/store">{t("continue_shopping")}</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
