import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LoadingScreenProps = {
  compact?: boolean;
  className?: string;
  progress?: number;
  label?: string;
};

export function LoadingScreen({ compact = false, className, progress, label }: LoadingScreenProps) {
  const { t } = useLang();
  const [autoProgress, setAutoProgress] = useState(12);

  useEffect(() => {
    if (progress !== undefined) return;
    const id = window.setInterval(() => {
      setAutoProgress((p) => {
        if (p >= 92) return p;
        const step = p < 40 ? 7 : p < 70 ? 4 : 1.5;
        return Math.min(92, p + step);
      });
    }, 180);
    return () => window.clearInterval(id);
  }, [progress]);

  const value = progress ?? autoProgress;
  const brand = t("brand");
  const message = label ?? t("loading_splash");

  if (compact) {
    return (
      <div
        className={cn(
          "flex min-h-[40vh] flex-col items-center justify-center gap-6 px-6",
          className,
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <BrandMark size="md" />
        <ProgressRail value={value} />
        <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">{message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050406]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt=""
          className="h-full w-full object-cover opacity-25 hero-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050406]/80 via-[#050406]/90 to-[#050406]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(225,29,46,0.22),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(225,29,46,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(225,29,46,0.45)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-8 text-center">
        <div className="animate-hero-in">
          <BrandMark size="lg" />
        </div>

        <div className="mt-8 animate-hero-in [animation-delay:120ms]">
          <p className="font-display text-[11px] tracking-[0.5em] text-primary uppercase">FiveM</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[0.28em] text-steel-gradient uppercase sm:text-4xl">
            {brand}
          </h1>
          <div className="mx-auto mt-4 h-px w-24 origin-center bg-gradient-to-r from-transparent via-primary to-transparent animate-line-grow" />
          <p className="mt-4 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        <div className="mt-10 w-full max-w-xs animate-hero-in [animation-delay:240ms]">
          <ProgressRail value={value} />
          <div className="mt-4 flex items-center justify-between text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            <span>{message}</span>
            <span className="tabular-nums text-primary/90">{Math.round(value)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ size }: { size: "md" | "lg" }) {
  const dim = size === "lg" ? "h-28 w-40 sm:h-32 sm:w-48" : "h-16 w-24";
  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          "absolute rounded-full border border-primary/25",
          size === "lg" ? "h-40 w-40 sm:h-44 sm:w-44" : "h-24 w-24",
        )}
      />
      <div
        className={cn(
          "absolute rounded-full border border-transparent border-t-primary/80 border-r-primary/25",
          size === "lg" ? "h-40 w-40 sm:h-44 sm:w-44" : "h-24 w-24",
        )}
        style={{ animation: "spin-ring 1.4s linear infinite" }}
      />
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          "bg-black/40 ring-1 ring-primary/35 shadow-[0_0_48px_-10px_rgba(225,29,46,0.65)]",
          dim,
        )}
      >
        <img src="/logo.png?v=cut3" alt="" className="h-[90%] w-[90%] object-contain" />
      </div>
    </div>
  );
}

function ProgressRail({ value }: { value: number }) {
  return (
    <div className="h-[2px] w-full overflow-hidden bg-white/10">
      <div
        className="h-full gold-line transition-[width] duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function AppSplash({ minMs = 1600 }: { minMs?: number }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / minMs);
      setProgress(8 + ratio * 92);
    }, 50);

    const leaveAt = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => setVisible(false), 520);
    }, minMs);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(leaveAt);
    };
  }, [minMs]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "transition-opacity duration-500",
        leaving ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <LoadingScreen progress={progress} />
    </div>
  );
}
