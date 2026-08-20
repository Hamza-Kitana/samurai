import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Globe,
  ShoppingCart,
  User,
  LayoutDashboard,
  LogOut,
  UserRound,
  Package,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { navHeight, pageGutter } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLang } from "@/lib/i18n";
import { useAuth, useCart } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, toggle } = useLang();
  const { user, isAdmin, logout, openLogin } = useAuth();
  const { items, openCart } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isHeroPage =
    pathname === "/store" ||
    pathname === "/profile" ||
    pathname === "/about" ||
    pathname === "/contact";
  const [heroScrolled, setHeroScrolled] = useState(false);

  useEffect(() => {
    if (!isHeroPage) {
      setHeroScrolled(false);
      return;
    }

    const onScroll = () => setHeroScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHeroPage]);

  const isOverlay = isHome || (isHeroPage && !heroScrolled);

  const links = [
    { to: "/" as const, label: t("nav_home") },
    { to: "/store" as const, label: t("nav_store") },
    { to: "/about" as const, label: t("nav_about") },
    { to: "/contact" as const, label: t("nav_contact") },
    ...(isAdmin ? [{ to: "/admin" as const, label: t("nav_admin") }] : []),
  ];

  const cartButtonClass = cn(
    "relative h-10 w-10 shrink-0 border transition-colors",
    isOverlay
      ? "border-white/15 text-white/85 hover:border-primary/40 hover:bg-white/8 hover:text-white"
      : "border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5",
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
        isOverlay
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border/40 bg-background/90 backdrop-blur-xl",
      )}
    >
      <div className={cn("flex items-center justify-between gap-4", navHeight, pageGutter)}>
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "relative px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors",
                pathname === link.to
                  ? "text-primary"
                  : isOverlay
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={openCart}
            aria-label={t("nav_cart")}
            className={cartButtonClass}
          >
            <ShoppingCart className="h-4 w-4" />
            {items.length > 0 && (
              <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center border border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {items.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle language"
            className={cn(isOverlay && "text-white/80 hover:bg-white/10 hover:text-white")}
          >
            <Globe className="h-4 w-4" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("nav_profile")}
                  className={cn(
                    "relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 p-0 shadow-[0_0_16px_-6px_rgba(232,197,106,0.55)]",
                    isOverlay
                      ? "border-primary/55 text-white/85 hover:border-primary hover:bg-white/8"
                      : "border-primary/45 text-foreground hover:border-primary hover:bg-primary/5",
                  )}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-[#1a1610]">
                      <UserRound className="h-4 w-4 text-primary" />
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-56 border-white/10 bg-[#12100e]/95 p-1.5 text-foreground shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
              >
                <DropdownMenuLabel className="px-3 py-2.5 font-normal">
                  <p className="truncate font-display text-sm font-semibold tracking-wide">
                    {user.displayName || t("nav_profile")}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-normal text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem asChild className="cursor-pointer gap-2.5 px-3 py-2.5">
                  <Link to="/profile" search={{ tab: "account" }}>
                    <UserRound className="h-4 w-4 text-primary" />
                    {t("nav_profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2.5 px-3 py-2.5">
                  <Link to="/profile" search={{ tab: "downloads" }}>
                    <Package className="h-4 w-4 text-primary" />
                    {t("nav_my_products")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav_logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className={cn(
                "inline-flex items-center gap-2 border px-3.5 py-2 text-[13px] font-medium transition",
                isOverlay
                  ? "border-white/25 text-white/90 hover:border-primary/60 hover:bg-white/5"
                  : "border-border text-foreground hover:border-primary/50",
              )}
            >
              <User className="h-3.5 w-3.5" />
              {t("nav_login")}
            </button>
          )}

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className={cn("md:hidden", isOverlay && "text-white/80 hover:bg-white/10")}
            >
              <Link to="/admin">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
