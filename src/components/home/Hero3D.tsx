import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HeroVideoBackground } from "@/components/home/HeroVideoBackground";
import { useLang } from "@/lib/i18n";

export function Hero3D() {
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <HeroVideoBackground />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 pb-24 text-center">
        <div className="animate-hero-in flex max-w-5xl flex-col items-center">
          <img
            src="/logo.png"
            alt={t("brand")}
            className="mb-8 h-28 w-auto object-contain drop-shadow-[0_0_48px_rgba(225,29,46,0.5)] sm:h-40"
          />

          <div className="gold-line animate-line-grow mb-6 h-px w-24 sm:w-32" />

          <p className="max-w-md font-display text-lg font-medium leading-snug text-white/90 sm:text-2xl">
            {t("hero_title")} <span className="text-gold-gradient">{t("hero_title2")}</span>
          </p>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-[15px]">
            {t("hero_sub")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/store"
              className="group inline-flex items-center gap-2.5 bg-primary px-7 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_0_32px_-8px_rgba(225,29,46,0.75)] transition duration-300 hover:bg-[#ff2a3d]"
            >
              {t("hero_cta")}
              <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
            <Link
              to="/store"
              search={{ featured: true }}
              className="inline-flex items-center border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-medium tracking-wide text-white/90 backdrop-blur-sm transition duration-300 hover:border-primary/50 hover:bg-white/10"
            >
              {t("hero_cta2")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
