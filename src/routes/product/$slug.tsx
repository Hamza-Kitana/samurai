import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, ShoppingCart, Check, Wrench } from "lucide-react";
import { toast } from "sonner";
import { PageLayout, pageGutter } from "@/components/layout/PageLayout";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/i18n";
import { useProduct, useProducts, logInterest, useCategories } from "@/lib/products";
import { useAuth, useCart, money } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useLang();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts } = useProducts();
  const { data: categories } = useCategories();
  const { add, items, openCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (product) void logInterest(product.id, "view", user?.id);
  }, [product, user?.id]);

  if (isLoading) {
    return (
      <PageLayout fullWidth>
        <div className={cn("py-8", pageGutter)}>
          <Skeleton className="h-[60vh] w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout fullWidth>
        <div className={cn("py-24 text-center", pageGutter)}>
          <p className="text-muted-foreground">Product not found</p>
          <Button asChild className="mt-4">
            <Link to="/store">{t("back_store")}</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const title = lang === "ar" ? product.title_ar : product.title_en;
  const description = lang === "ar" ? product.description_ar : product.description_en;
  const features = lang === "ar" ? product.features_ar : product.features_en;
  const install = (lang === "ar" ? product.install_ar : product.install_en) ?? [];
  const inCart = items.some((i) => i.id === product.id);
  const related = (allProducts ?? [])
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAdd = () => {
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

  const cat = (categories ?? []).find((c) => c.slug === product.category);
  const categoryLabel = cat ? (lang === "ar" ? cat.name_ar : cat.name_en) : product.category;
  const subcategoryLabel = cat?.subcategories.find((s) => s.slug === product.subcategory);
  const subLabel = subcategoryLabel
    ? lang === "ar"
      ? subcategoryLabel.name_ar
      : subcategoryLabel.name_en
    : "";

  return (
    <PageLayout fullWidth>
      <div className="animate-rise">
        <div className={cn("border-b border-white/8 py-4", pageGutter)}>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/store">
              <ArrowLeft className="h-4 w-4" />
              {t("back_store")}
            </Link>
          </Button>
        </div>

        <section className="grid border-b border-white/8 lg:grid-cols-2">
          <div className="relative min-h-[16rem] overflow-hidden sm:min-h-[22rem] lg:min-h-[calc(100vh-9rem)]">
            <ProductGallery
              category={product.category}
              title={title}
              images={product.images}
              className="absolute inset-0 h-full w-full"
            />
          </div>

          <div
            className={cn(
              "flex flex-col justify-center space-y-6 py-8 sm:py-10 lg:py-14",
              pageGutter,
            )}
          >
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{categoryLabel}</Badge>
                {subLabel && (
                  <Badge className="border-primary/30 bg-primary/15 text-primary">{subLabel}</Badge>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="mt-4 text-3xl font-bold text-gold-gradient sm:text-4xl">
                {money(product.price)}
              </p>
            </div>

            {description && (
              <p className="max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
            )}

            {features.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold">{t("features")}</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={handleAdd}
              disabled={inCart}
            >
              <ShoppingCart className="h-4 w-4" />
              {inCart ? t("added") : t("add_to_cart")}
            </Button>
          </div>
        </section>

        {install.length > 0 && (
          <section className="w-full border-b border-white/8 bg-[#12100e]">
            <div className={cn("flex items-center gap-3 border-b border-white/8 py-5", pageGutter)}>
              <div className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
                  {t("install_kicker")}
                </p>
                <h2 className="font-display text-xl font-semibold tracking-wide sm:text-2xl">
                  {t("install_title")}
                </h2>
              </div>
            </div>

            <ol className="divide-y divide-white/8">
              {install.map((step, index) => (
                <li key={`${index}-${step}`} className={cn("flex gap-4 py-5 sm:gap-5", pageGutter)}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/35 bg-primary/10 font-display text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="pt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            <p
              className={cn(
                "border-t border-white/8 py-3 text-xs text-muted-foreground",
                pageGutter,
              )}
            >
              {t("install_note")}
            </p>
          </section>
        )}

        {related.length > 0 && (
          <section className={cn("py-12 sm:py-16", pageGutter)}>
            <h2 className="mb-6 font-display text-xl font-semibold sm:text-2xl">{t("related")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
