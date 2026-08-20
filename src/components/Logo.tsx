import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

type LogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  linked?: boolean;
};

const sizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-16 w-16", xl: "h-20 w-20" };

export function Logo({ className, showText = true, size = "md", linked = true }: LogoProps) {
  const { t, lang } = useLang();

  const inner = (
    <>
      <span className={cn("relative flex shrink-0 items-center justify-center", sizes[size])}>
        <img
          src="/logo.svg"
          alt={t("brand")}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </span>
      {showText && (
        <div className="leading-none">
          <span className="font-display text-[15px] font-semibold tracking-[0.18em] text-gold-gradient uppercase sm:text-base">
            {lang === "ar" ? t("brand") : "SAMURAI"}
          </span>
          <span className="mt-1 block text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            FiveM
          </span>
        </div>
      )}
    </>
  );

  if (!linked) {
    return <span className={cn("group flex items-center gap-3", className)}>{inner}</span>;
  }

  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)}>
      {inner}
    </Link>
  );
}
