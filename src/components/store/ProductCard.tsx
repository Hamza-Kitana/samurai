import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/store/ProductImage";
import { useLang } from "@/lib/i18n";
import { useAuth, useCart, money, type Product } from "@/lib/store";
import { logInterest, useCategories } from "@/lib/products";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { lang, t } = useLang();
  const { add, openCart } = useCart();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const title = lang === "ar" ? product.title_ar : product.title_en;
  const short = lang === "ar" ? product.short_ar : product.short_en;
  const cat = (categories ?? []).find((c) => c.slug === product.category);
  const categoryLabel = cat
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

  return (
    <article className="group relative overflow-hidden border border-white/8 bg-[#12100e] transition duration-500 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[var(--shadow-gold)]">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <ProductImage
            category={product.category}
            title={title}
            imageUrl={product.image_url}
            className="transition duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-[#12100e]/25 to-transparent" />
          <span className="absolute start-3 top-3 border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] text-white/85 uppercase backdrop-blur-md">
            {categoryLabel}
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-wide text-foreground transition-colors group-hover:text-primary">
              {title}
            </h3>
            {short && (
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {short}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
            <span className="font-display text-xl font-semibold tracking-wide text-gold-gradient">
              {money(product.price)}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 bg-primary px-3.5 py-2 text-xs font-semibold tracking-wide text-primary-foreground transition hover:bg-[#f0d78a]"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {t("add_to_cart")}
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
