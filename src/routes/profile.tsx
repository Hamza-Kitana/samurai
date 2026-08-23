import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Download,
  Package,
  UserRound,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { PageLayout, pageGutter, navPull } from "@/components/layout/PageLayout";
import { ProductImage } from "@/components/store/ProductImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useLang } from "@/lib/i18n";
import { useAuth, money } from "@/lib/store";
import { downloadUrl, getToken } from "@/lib/api-client";
import { fetchUserOrders, fetchOrderDownloads } from "@/lib/checkout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): { tab?: "downloads" | "account" } => {
    const tab = search["tab"];
    if (tab === "downloads" || tab === "account") return { tab };
    return {};
  },
  component: ProfilePage,
});

type TabId = "downloads" | "account";

function ProfilePage() {
  const { t, lang } = useLang();
  const { user, loading, isAdmin, openLogin } = useAuth();
  const { tab: tabSearch } = Route.useSearch();
  const navigate = useNavigate();
  const tab: TabId = tabSearch ?? "downloads";

  const setTab = (next: TabId) => {
    void navigate({ to: "/profile", search: { tab: next }, replace: true });
  };

  useEffect(() => {
    if (!loading && !user) {
      openLogin({ next: "/profile" });
      void navigate({ to: "/" });
    }
  }, [user, loading, navigate, openLogin]);

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => fetchUserOrders(user!.id),
    enabled: Boolean(user),
  });

  const { data: downloads, isLoading: downloadsLoading } = useQuery({
    queryKey: ["downloads", user?.id],
    queryFn: () => fetchOrderDownloads(user!.id),
    enabled: Boolean(user),
  });

  if (loading || !user) {
    return <LoadingScreen />;
  }

  const downloadCount = downloads?.length ?? 0;
  const totalSpent = (orders ?? []).reduce((sum, order) => sum + Number(order.total), 0);
  const displayName =
    user.displayName?.trim() || user.email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const memberSince = (orders ?? []).length
    ? new Date(
        [...(orders ?? [])].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )[0]!.created_at,
      ).toLocaleDateString(lang === "ar" ? "ar" : "en", {
        year: "numeric",
        month: "short",
      })
    : new Date().toLocaleDateString(lang === "ar" ? "ar" : "en", {
        year: "numeric",
        month: "short",
      });

  const tabs: { id: TabId; label: string; icon: typeof Download; count?: number }[] = [
    { id: "downloads", label: t("downloads"), icon: Download, count: downloadCount },
    { id: "account", label: t("profile_title"), icon: UserRound },
  ];

  return (
    <PageLayout fullWidth>
      <div className="animate-rise pb-16">
        {/* Hero banner — extends under transparent navbar */}
        <section className={cn("relative w-full overflow-hidden", navPull)}>
          <div className="relative h-[min(36vh,18rem)] w-full sm:h-[min(40vh,20rem)]">
            <img
              src="/images/profile-banner.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover hero-kenburns"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-background/40 to-background" />
            <div className="absolute inset-0 bg-gradient-to-e from-background/70 via-transparent to-background/40" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

            <div
              className={cn(
                "absolute inset-x-0 bottom-0 flex flex-col justify-end pb-5 pt-16 sm:pb-6",
                pageGutter,
              )}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary via-[#e8c56a] to-[#8b6914] opacity-90 blur-[2px]" />
                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#14110c] p-[3px] shadow-[0_20px_60px_-20px_rgba(232,197,106,0.65)] sm:h-28 sm:w-28">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#1a1610]">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={displayName}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="font-display text-4xl font-semibold text-gold-gradient sm:text-5xl">
                            {initial}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-[#12100e] text-primary shadow-lg">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="min-w-0 pb-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
                        <Sparkles className="h-3 w-3" />
                        {isAdmin ? t("nav_admin") : t("profile_member")}
                      </span>
                      <span className="text-[11px] tracking-wide text-white/55">
                        {t("profile_since")} {memberSince}
                      </span>
                    </div>
                    <p className="text-[11px] tracking-[0.35em] text-primary uppercase">
                      {t("profile_welcome")}
                    </p>
                    <h1 className="mt-1 font-display text-3xl font-semibold tracking-wide text-white sm:text-5xl">
                      {displayName}
                    </h1>
                    <p className="mt-2 truncate text-sm text-white/65">{user.email}</p>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full gap-2 font-semibold tracking-wide sm:w-auto"
                >
                  <Link to="/store">
                    {t("hero_cta")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className={cn("-mt-2 relative z-10", pageGutter)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: t("downloads"), value: String(downloadCount) },
              { label: t("total_spent"), value: money(totalSpent) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden border border-white/10 bg-[#12100e]/90 px-5 py-5 backdrop-blur-md transition hover:border-primary/35"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <p className="relative text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className="relative mt-2 font-display text-3xl font-semibold text-gold-gradient">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Body */}
        <section className={cn("mt-10 sm:mt-12", pageGutter)}>
          <div className="mb-8 flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
                {t("profile_library")}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide sm:text-3xl">
                {tabs.find((x) => x.id === tab)?.label}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "inline-flex items-center gap-2 border px-4 py-2.5 text-xs font-medium tracking-[0.12em] uppercase transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/12 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                    {typeof item.count === "number" && (
                      <span
                        className={cn(
                          "ms-1 min-w-5 px-1 text-[10px]",
                          active ? "bg-black/20 text-primary-foreground" : "bg-white/8 text-foreground",
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "downloads" && (
            <div>
              {downloadsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[16/11] w-full" />
                  ))}
                </div>
              ) : (downloads ?? []).length === 0 ? (
                <EmptyState
                  title={t("profile_empty_title")}
                  sub={t("profile_empty_sub")}
                  cta={t("hero_cta")}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {(downloads ?? []).map((file) => {
                    const title =
                      lang === "ar"
                        ? (file.products?.title_ar ?? file.file_name)
                        : (file.products?.title_en ?? file.file_name);
                    return (
                      <article
                        key={file.id}
                        className="group overflow-hidden border border-white/10 bg-[#12100e] transition duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-gold)]"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <ProductImage
                            category={file.products?.category ?? "scripts"}
                            title={title}
                            imageUrl={file.products?.image_url ?? null}
                            className="h-full transition duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-[#12100e]/30 to-transparent" />
                          <span className="absolute start-3 top-3 border border-white/15 bg-black/45 px-2 py-1 text-[10px] tracking-[0.14em] text-white/85 uppercase backdrop-blur-md">
                            {t("profile_ready")}
                          </span>
                        </div>
                        <div className="space-y-4 p-4">
                          <div>
                            <h3 className="font-display text-lg font-semibold tracking-wide">
                              {title}
                            </h3>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {file.file_name}
                            </p>
                          </div>
                          <Button
                            className="w-full gap-2"
                            onClick={() => {
                              void (async () => {
                                if (
                                  file.file_url.startsWith("http") &&
                                  !file.file_url.includes("/api/downloads/")
                                ) {
                                  const a = document.createElement("a");
                                  a.href = file.file_url;
                                  a.download = file.file_name;
                                  a.rel = "noopener";
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  toast.success(`${file.file_name} ✓`);
                                  return;
                                }

                                const token = getToken();
                                const res = await fetch(downloadUrl(file.product_id), {
                                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                                });
                                if (!res.ok) {
                                  toast.error(t("product_file_missing"));
                                  return;
                                }
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = file.file_name;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(url);
                                toast.success(`${file.file_name} ✓`);
                              })();
                            }}
                          >
                            <Download className="h-4 w-4" />
                            {t("download")}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "account" && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden border border-white/10 bg-[#12100e]">
                <img
                  src="/images/profile-banner.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#12100e] via-[#12100e]/92 to-[#12100e]/80" />
                <div className="relative space-y-6 p-6 sm:p-8">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/40">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 font-display text-2xl text-primary">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <dl className="space-y-4 text-sm">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <dt className="text-muted-foreground">{t("name")}</dt>
                      <dd>{user.displayName || "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <dt className="text-muted-foreground">{t("email")}</dt>
                      <dd className="truncate ps-4">{user.email}</dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <dt className="text-muted-foreground">{t("profile_since")}</dt>
                      <dd>{memberSince}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">{t("downloads")}</dt>
                      <dd>{downloadCount}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex flex-col justify-between border border-white/10 bg-gradient-to-br from-primary/15 via-[#14120e] to-[#0f0d0b] p-6 sm:p-8">
                <div>
                  <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
                    Samurai Realm
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-wide">
                    {t("profile_member")}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {t("profile_empty_sub")}
                  </p>
                </div>
                <Button asChild className="mt-8 w-full gap-2 sm:w-auto">
                  <Link to="/store">
                    {t("hero_cta")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

function EmptyState({
  title,
  sub,
  cta,
}: {
  title: string;
  sub: string;
  cta: string;
}) {
  return (
    <div className="relative overflow-hidden border border-white/10 bg-[#12100e] px-6 py-20 text-center">
      <img
        src="/images/profile-banner.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-[#12100e]/80" />
      <div className="relative">
        <Package className="mx-auto mb-4 h-12 w-12 text-primary/70" />
        <h3 className="font-display text-2xl font-semibold">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{sub}</p>
        <Button asChild className="mt-6">
          <Link to="/store">{cta}</Link>
        </Button>
      </div>
    </div>
  );
}
