import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProductImage } from "@/components/store/ProductImage";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLang } from "@/lib/i18n";
import { useCart, money } from "@/lib/store";

export function CartDrawer() {
  const { t, lang, dir } = useLang();
  const { items, remove, total, open, setOpen, closeCart } = useCart();
  const navigate = useNavigate();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const goToCheckout = () => {
    closeCart();
    void navigate({ to: "/checkout" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={dir === "rtl" ? "left" : "right"}
        className="flex w-full flex-col gap-0 border-primary/20 bg-[#110e0b] p-0 sm:max-w-md"
      >
        <SheetHeader className="relative border-b border-white/8 px-6 py-6 text-start">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-primary to-transparent" />
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase">KATARO</p>
          <SheetTitle className="mt-1 font-display text-2xl font-semibold tracking-wide">
            {t("cart_title")}
          </SheetTitle>
          <SheetDescription className="text-xs tracking-wide text-muted-foreground">
            {items.length} {t("cart_items")}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center border border-white/10 bg-white/5">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("cart_empty")}</p>
            <Button asChild className="mt-6 gap-2" onClick={() => closeCart()}>
              <Link to="/store">
                {t("hero_cta")}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-3">
                {items.map((item) => {
                  const title = lang === "ar" ? item.title_ar : item.title_en;
                  return (
                    <li
                      key={item.id}
                      className="flex gap-3 border border-white/8 bg-[#14120e] p-3"
                    >
                      <div className="h-16 w-20 shrink-0 overflow-hidden">
                        <ProductImage title={title} imageUrl={item.image_url} category="maps" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <Link
                            to="/product/$slug"
                            params={{ slug: item.slug }}
                            onClick={() => closeCart()}
                            className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
                          >
                            {title}
                          </Link>
                          <p className="mt-1 font-display text-base font-semibold text-gold-gradient">
                            {money(item.price)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="shrink-0 self-start p-1.5 text-muted-foreground transition hover:text-destructive"
                        aria-label={t("remove")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-white/8 bg-[#0c0a08] px-6 py-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("total")}</span>
                  <span className="font-display text-2xl font-semibold text-gold-gradient">
                    {money(total)}
                  </span>
                </div>

                <Separator className="bg-white/8" />

                <Button
                  size="lg"
                  className="w-full gap-2 font-semibold tracking-wide"
                  onClick={goToCheckout}
                >
                  {t("checkout")}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-white/15"
                  onClick={() => closeCart()}
                  asChild
                >
                  <Link to="/store">{t("continue_shopping")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
