import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Gem, Shield, Sparkles, Zap } from "lucide-react";
import { PageLayout, pageGutter, navPull, navOffset } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLang();

  const pillars = [
    { icon: Gem, title: t("about_p1_title"), body: t("about_p1_body") },
    { icon: Zap, title: t("about_p2_title"), body: t("about_p2_body") },
    { icon: Shield, title: t("about_p3_title"), body: t("about_p3_body") },
  ];

  return (
    <PageLayout fullWidth>
      <div className="animate-rise pb-16">
        <section className={cn("relative w-full overflow-hidden border-b border-white/8", navPull, navOffset)}>
          <div className="absolute inset-0">
            <img
              src="/images/hero-bg.png"
              alt=""
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
            <div className="absolute inset-y-0 start-0 w-1/3 bg-gradient-to-e from-primary/12 to-transparent" />
          </div>

          <div
            className={cn(
              "relative flex min-h-[16rem] flex-col justify-end py-12 sm:min-h-[18rem] sm:py-14",
              pageGutter,
            )}
          >
            <p className="mb-3 font-display text-[11px] tracking-[0.45em] text-primary uppercase">
              KATARO
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-wide sm:text-5xl lg:text-6xl">
              {t("about_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("about_sub")}
            </p>
          </div>
        </section>

        <section className={cn("border-b border-white/8 py-14 sm:py-16", pageGutter)}>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
                {t("about_story_kicker")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide sm:text-3xl">
                {t("about_story_title")}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {t("about_story_body")}
              </p>
              <Button asChild size="lg" className="mt-8 gap-2 font-semibold tracking-wide">
                <Link to="/store">
                  {t("hero_cta")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative aspect-[16/11] overflow-hidden border border-white/10 bg-[#12100e]">
              <img
                src="/images/profile-banner.png"
                alt=""
                className="h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-5 py-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-display text-sm tracking-wide text-white/90">
                  {t("about_badge")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={cn("py-14 sm:py-16", pageGutter)}>
          <p className="text-center text-[11px] tracking-[0.28em] text-primary uppercase">
            {t("about_pillars_kicker")}
          </p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold tracking-wide sm:text-3xl">
            {t("about_pillars_title")}
          </h2>

          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="bg-[#12100e] px-6 py-8 transition hover:bg-[#16130f]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-wide">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={cn("border-t border-white/8 py-12", pageGutter)}>
          <div className="flex flex-col items-start justify-between gap-6 border border-white/10 bg-gradient-to-br from-primary/12 via-[#14120e] to-[#0f0d0b] px-6 py-8 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
                {t("nav_contact")}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-wide sm:text-2xl">
                {t("about_cta_title")}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("about_cta_sub")}</p>
            </div>
            <Button asChild size="lg" className="w-full gap-2 font-semibold sm:w-auto">
              <Link to="/contact">
                {t("nav_contact")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
