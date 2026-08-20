import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Shield, Sparkles, X } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/store";

export function LoginDialog() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { loginOpen, loginStaff, closeLogin, login, consumeLoginNext } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const taps = useRef(0);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    if (loginOpen) setStaffOpen(loginStaff);
  }, [loginOpen, loginStaff]);

  const afterLogin = () => {
    const next = consumeLoginNext();
    closeLogin();
    setEmail("");
    setPassword("");
    setError("");
    setStaffOpen(false);
    if (next === "/profile") {
      void navigate({ to: "/profile", search: { tab: "downloads" } });
    } else if (next === "/checkout") {
      void navigate({ to: "/checkout" });
    } else if (next === "/admin") {
      void navigate({ to: "/admin" });
    }
  };

  const handleLogoTap = () => {
    taps.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 900);

    if (taps.current >= 3) {
      taps.current = 0;
      setStaffOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      afterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const showStaff = staffOpen || loginStaff;

  return (
    <Dialog
      open={loginOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeLogin();
          setError("");
          setStaffOpen(false);
        }
      }}
    >
      <DialogContent className="w-[min(94vw,42rem)] gap-0 overflow-hidden border border-primary/25 bg-[#0c0a08] p-0 shadow-[0_40px_100px_-28px_rgba(0,0,0,0.9),0_0_0_1px_rgba(232,197,106,0.18)] sm:rounded-2xl [&>button:last-child]:hidden">
        <DialogClose className="absolute end-4 top-4 z-20 flex h-9 w-9 items-center justify-center border border-white/10 bg-black/35 text-white/55 backdrop-blur-sm transition hover:border-primary/40 hover:text-white">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="grid sm:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[26rem] overflow-hidden border-e border-white/8 sm:block">
            <img
              src="/images/hero-bg.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#0c0a08]/55 to-[#0c0a08]" />
            <div className="absolute inset-0 bg-gradient-to-e from-[#0c0a08]/40 via-transparent to-[#0c0a08]/80" />
            <div className="absolute inset-x-0 bottom-0 p-7">
              <p className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] text-primary uppercase">
                <Sparkles className="h-3 w-3" />
                SAMURAI REALM
              </p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-wide text-white">
                {t("tagline")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{t("hero_sub")}</p>
            </div>
          </div>

          <div className="relative flex flex-col justify-center px-7 py-10 sm:px-9 sm:py-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/80 to-transparent" />

            <button
              type="button"
              onClick={handleLogoTap}
              className="mx-auto mb-6 block bg-transparent outline-none transition hover:opacity-90"
              aria-label={t("brand")}
            >
              <Logo showText={false} size="xl" linked={false} />
            </button>

            <DialogTitle className="text-center font-display text-3xl font-semibold tracking-[0.14em]">
              {t("login")}
            </DialogTitle>
            <DialogDescription className="mt-3 text-center text-sm text-white/50">
              {t("google_login")}
            </DialogDescription>

            <div className="mt-9">
              {loginOpen && (
                <GoogleSignInButton
                  onSuccess={afterLogin}
                  onError={(message) => setError(message)}
                />
              )}
            </div>

            {error && !showStaff && (
              <p className="mt-5 text-center text-sm text-destructive">{error}</p>
            )}

            {showStaff && (
              <div className="mt-8 animate-rise space-y-5 border-t border-white/10 pt-6">
                <div className="flex items-center justify-center gap-2 text-[11px] tracking-[0.22em] text-primary uppercase">
                  <Shield className="h-3.5 w-3.5" />
                  {t("staff_login")}
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">{t("username_or_email")}</Label>
                    <Input
                      id="staff-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                      className="h-11 border-white/12 bg-white/[0.03]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">{t("password")}</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={3}
                      className="h-11 border-white/12 bg-white/[0.03]"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
                    {loading ? t("loading") : t("login")}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
