import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function Hero3D() {
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Full-bleed cinematic plane */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt=""
          className="hero-kenburns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,5,0.55)_0%,rgba(8,7,5,0.35)_40%,rgba(8,7,5,0.75)_78%,rgba(8,7,5,0.95)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,transparent_0%,rgba(8,7,5,0.55)_100%)]" />
        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay grain" />
      </div>

      {/* Soft drifting petals */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="animate-petal absolute block h-2 w-2 rounded-[40%_60%_60%_40%] bg-[#e8c56a]/40"
            style={{
              left: `${6 + i * 9}%`,
              animationDuration: `${14 + (i % 5) * 3}s`,
              animationDelay: `${i * 1.1}s`,
              transform: `scale(${0.6 + (i % 3) * 0.25})`,
            }}
          />
        ))}
      </div>

      {/* Content — one composition */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="animate-hero-in flex max-w-5xl flex-col items-center">
          <p className="mb-5 font-display text-[11px] font-medium tracking-[0.55em] text-[#e8c56a] uppercase sm:text-xs">
            SAMURAI
          </p>

          <h1 className="font-display text-[clamp(2.75rem,9vw,7.5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
            <span className="block text-white/95">{t("brand")}</span>
          </h1>

          <div className="gold-line animate-line-grow my-6 h-px w-24 sm:w-32" />

          <p className="max-w-md font-display text-lg font-medium leading-snug text-white/90 sm:text-2xl">
            {t("hero_title")}{" "}
            <span className="text-gold-gradient">{t("hero_title2")}</span>
          </p>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-[15px]">
            {t("hero_sub")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/store"
              className="group inline-flex items-center gap-2.5 bg-[#e8c56a] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#14120e] transition duration-300 hover:bg-[#f0d78a]"
            >
              {t("hero_cta")}
              <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
            <Link
              to="/store"
              search={{ featured: true }}
              className="inline-flex items-center border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-medium tracking-wide text-white/90 backdrop-blur-sm transition duration-300 hover:border-[#e8c56a]/50 hover:bg-white/10"
            >
              {t("hero_cta2")}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom edge accent */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <span className="animate-scroll-hint h-8 w-px bg-gradient-to-b from-[#e8c56a]/0 via-[#e8c56a]/70 to-[#e8c56a]/0" />
      </div>
    </section>
  );
}
