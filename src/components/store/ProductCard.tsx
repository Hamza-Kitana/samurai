import { useRef, type CSSProperties, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/store/ProductImage";
import { useLang } from "@/lib/i18n";
import { useAuth, useCart, money, type Product } from "@/lib/store";
import { logInterest, useCategories } from "@/lib/products";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { lang, t } = useLang();
  const { add, openCart } = useCart();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const cardRef = useRef<HTMLElement>(null);
  const title = lang === "ar" ? product.title_ar : product.title_en;
  const short = lang === "ar" ? product.short_ar : product.short_en;
  const cat = (categories ?? []).find((c) => c.slug === product.category);
  const sub = cat?.subcategories.find((s) => s.slug === product.subcategory);
  const categoryLabel = sub
    ? lang === "ar"
      ? sub.name_ar
      : sub.name_en
    : cat
      ? lang === "ar"
        ? cat.name_ar
        : cat.name_en
      : product.category;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      id: product.id,
      slug: product.slug,
      title_ar: product.title_ar,
      title_en: product.title_en,
      price: product.price,
      image_url: product.image_url,
    });
    void logInterest(product.id, "cart", user?.id);
    toast.success(t("added"));
    openCart();
  };

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (0.5 - y) * 12;
    const rotY = (x - 0.5) * 14;
    el.style.setProperty("--rx", `${rotX}deg`);
    el.style.setProperty("--ry", `${rotY}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "40%");
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={
        {
          "--rx": "0deg",
          "--ry": "0deg",
          "--mx": "50%",
          "--my": "40%",
        } as CSSProperties
      }
      className={cn(
        "product-card-3d group relative isolate rounded-[1.75rem]",
        "transition-[transform,box-shadow] duration-300 ease-out will-change-transform",
        "[transform:perspective(1100px)_rotateX(var(--rx))_rotateY(var(--ry))_translateZ(0)]",
        "hover:-translate-y-2 hover:z-10",
      )}
    >
      {/* Soft glow under card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.25rem] bg-[radial-gradient(circle_at_50%_85%,rgba(225,29,46,0.32),transparent_62%)] opacity-40 blur-2xl transition duration-500 group-hover:opacity-100"
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border border-white/12",
          "bg-gradient-to-b from-[#1f1a17] via-[#14110f] to-[#090807]",
          "shadow-[0_22px_50px_-22px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "transition duration-500",
          "group-hover:border-primary/50",
          "group-hover:shadow-[0_32px_70px_-18px_rgba(0,0,0,0.95),0_0_0_1px_rgba(225,29,46,0.28),0_0_56px_-14px_rgba(225,29,46,0.6)]",
        )}
      >
        {/* Specular shine that follows cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[1.75rem] opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(520px circle at var(--mx) var(--my), rgba(255,255,255,0.14), transparent 42%)",
          }}
        />

        {/* Top rim highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />

        <Link to="/product/$slug" params={{ slug: product.slug }} className="relative z-10 block">
          <div className="relative aspect-[16/11] overflow-hidden rounded-t-[1.75rem]">
            <ProductImage
              category={product.category}
              title={title}
              imageUrl={product.image_url}
              className="transition duration-700 ease-out group-hover:scale-[1.08]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/35 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,46,0.18),transparent_55%)] opacity-0 transition duration-500 group-hover:opacity-100" />

            <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-medium tracking-[0.14em] text-white/90 uppercase backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary" />
              {categoryLabel}
            </span>

            {product.is_featured && (
              <span className="absolute end-3 top-3 rounded-full border border-primary/40 bg-primary/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-[0_0_20px_-6px_rgba(225,29,46,0.8)]">
                HOT
              </span>
            )}
          </div>

          <div className="relative space-y-4 p-5">
            <div>
              <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-wide text-foreground transition-colors duration-300 group-hover:text-primary">
                {title}
              </h3>
              {short && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                  {short}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 pe-2.5 ps-3.5 backdrop-blur-sm">
              <span className="font-display text-xl font-semibold tracking-wide text-gold-gradient">
                {money(product.price)}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5",
                  "text-xs font-semibold tracking-wide text-primary-foreground",
                  "shadow-[0_8px_24px_-10px_rgba(225,29,46,0.85)]",
                  "transition duration-300",
                  "hover:bg-[#ff2a3d] hover:shadow-[0_12px_28px_-8px_rgba(225,29,46,0.95)]",
                  "active:scale-[0.97]",
                )}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("add_to_cart")}
              </button>
            </div>
          </div>
        </Link>
      </div>
    </article>
  );
}
