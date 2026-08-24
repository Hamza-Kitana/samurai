import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  PageLayout,
  pageGutter,
  navPull,
  navOffset,
  navStickyTop,
} from "@/components/layout/PageLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/i18n";
import { useCategories, useProducts } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  validateSearch: (search: Record<string, unknown>): { featured?: boolean } => {
    const raw = search["featured"];
    const featured = raw === true || raw === "true";
    return featured ? { featured: true } : {};
  },
  component: StorePage,
});

function FilterChip({
  active,
  onClick,
  children,
  tone = "primary",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "primary" | "soft";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-xs font-medium tracking-[0.12em] uppercase transition-colors",
        active
          ? tone === "soft"
            ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_20px_-10px_rgba(225,29,46,0.7)]"
            : "border-primary bg-primary text-primary-foreground shadow-[0_0_24px_-8px_rgba(225,29,46,0.7)]"
          : "border-white/12 text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function StorePage() {
  const { t, lang } = useLang();
  const { featured } = Route.useSearch();
  const [category, setCategory] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const { data: products, isLoading, error } = useProducts(category);
  const { data: categories } = useCategories();

  const activeCat = (categories ?? []).find((c) => c.slug === category);
  const subcats = activeCat?.subcategories ?? [];

  const displayed = useMemo(() => {
    let list = featured ? (products ?? []).filter((p) => p.is_featured) : (products ?? []);
    if (category !== "all" && subcategory !== "all") {
      list = list.filter((p) => p.subcategory === subcategory);
    }
    return list;
  }, [products, featured, category, subcategory]);

  const activeCategoryName =
    category === "all"
      ? t("all")
      : activeCat
        ? lang === "ar"
          ? activeCat.name_ar
          : activeCat.name_en
        : category;

  const activeSubName =
    subcategory === "all"
      ? null
      : (subcats.find((s) => s.slug === subcategory)?.[lang === "ar" ? "name_ar" : "name_en"] ??
        subcategory);

  const pickCategory = (slug: string) => {
    setCategory(slug);
    setSubcategory("all");
  };

  return (
    <PageLayout fullWidth>
      <div className="animate-rise">
        <section
          className={cn(
            "relative w-full overflow-hidden border-b border-white/8",
            navPull,
            navOffset,
          )}
        >
          <div className="absolute inset-0">
            <img
              src="/images/hero-bg.png"
              alt=""
              className="h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/80 to-background" />
            <div className="absolute inset-y-0 start-0 w-1/3 bg-gradient-to-e from-primary/10 to-transparent" />
            <div className="absolute inset-y-0 end-0 w-1/3 bg-gradient-to-s from-primary/5 to-transparent" />
          </div>

          <div
            className={cn(
              "relative flex min-h-[18rem] flex-col justify-end py-12 sm:min-h-[20rem] sm:py-14",
              pageGutter,
            )}
          >
            <p className="mb-3 font-display text-[11px] tracking-[0.45em] text-primary uppercase">
              KATARO
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-wide sm:text-5xl lg:text-6xl">
              {t("store_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("store_sub")}
            </p>
          </div>
        </section>

        <section
          className={cn(
            "sticky z-40 border-b border-white/8 bg-background/92 backdrop-blur-xl",
            navStickyTop,
          )}
        >
          <div className={cn("relative space-y-3 py-4", pageGutter)}>
            <div className="flex items-center justify-center">
              <div className="flex justify-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FilterChip active={category === "all"} onClick={() => pickCategory("all")}>
                  {t("all")}
                </FilterChip>
                {(categories ?? []).map((cat) => (
                  <FilterChip
                    key={cat.id}
                    active={category === cat.slug}
                    onClick={() => pickCategory(cat.slug)}
                  >
                    {lang === "ar" ? cat.name_ar : cat.name_en}
                  </FilterChip>
                ))}
              </div>
            </div>

            {subcats.length > 0 && (
              <div className="flex justify-center">
                <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-white/8 bg-white/[0.03] px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <FilterChip
                    tone="soft"
                    active={subcategory === "all"}
                    onClick={() => setSubcategory("all")}
                  >
                    {t("all_in_section")}
                  </FilterChip>
                  {subcats.map((sub) => (
                    <FilterChip
                      key={sub.slug}
                      tone="soft"
                      active={subcategory === sub.slug}
                      onClick={() => setSubcategory(sub.slug)}
                    >
                      {lang === "ar" ? sub.name_ar : sub.name_en}
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && (
              <span className="absolute end-4 top-4 hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase sm:end-8 sm:inline-block lg:end-12 xl:end-16 2xl:end-20">
                {displayed.length} {t("products_count")}
              </span>
            )}
          </div>
        </section>

        <section className={cn("py-10 sm:py-12", pageGutter)}>
          {error && (
            <p className="mb-6 text-center text-destructive">
              {error instanceof Error ? error.message : "Error loading products"}
            </p>
          )}

          <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/8 pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-primary uppercase">
                {featured
                  ? t("hero_cta2")
                  : activeSubName
                    ? `${activeCategoryName} · ${activeSubName}`
                    : activeCategoryName}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide">
                {t("store_catalog")}
              </h2>
            </div>
            {!isLoading && (
              <span className="text-sm text-muted-foreground sm:hidden">
                {displayed.length} {t("products_count")}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-[1.75rem]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {displayed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!isLoading && displayed.length === 0 && (
            <p className="py-20 text-center text-muted-foreground">{t("no_products")}</p>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
