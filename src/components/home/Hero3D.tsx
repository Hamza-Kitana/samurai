import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function Hero3D() {
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt=""
          className="hero-kenburns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,6,0.72)_0%,rgba(5,4,6,0.45)_40%,rgba(5,4,6,0.82)_78%,rgba(5,4,6,0.98)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(225,29,46,0.22)_0%,transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.14] mix-blend-overlay grain" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="animate-petal absolute block h-2 w-2 rounded-[40%_60%_60%_40%] bg-[#e11d2e]/45"
            style={{
              left: `${6 + i * 9}%`,
              animationDuration: `${14 + (i % 5) * 3}s`,
              animationDelay: `${i * 1.1}s`,
              transform: `scale(${0.6 + (i % 3) * 0.25})`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <span className="animate-scroll-hint h-8 w-px bg-gradient-to-b from-primary/0 via-primary/70 to-primary/0" />
      </div>
    </section>
  );
}
