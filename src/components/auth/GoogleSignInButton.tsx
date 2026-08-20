import { useEffect, useRef, useState } from "react";
import {
  getGoogleClientId,
  loadGoogleScript,
  parseGoogleCredential,
} from "@/lib/google-auth";
import { useAuth } from "@/lib/store";
import { useLang } from "@/lib/i18n";

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();
  const { lang, t } = useLang();
  const [missingId, setMissingId] = useState(false);

  useEffect(() => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      setMissingId(true);
      return;
    }

    let cancelled = false;

    void loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            try {
              const profile = parseGoogleCredential(response.credential);
              void loginWithGoogle(profile).then(() => onSuccess?.());
            } catch (err) {
              onError?.(err instanceof Error ? err.message : "Google sign-in failed");
            }
          },
          cancel_on_tap_outside: true,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 480,
          locale: lang === "ar" ? "ar" : "en",
        });
      })
      .catch(() => {
        onError?.(t("google_load_error"));
      });

    return () => {
      cancelled = true;
    };
  }, [lang, loginWithGoogle, onError, onSuccess, t]);

  if (missingId) {
    return (
      <p className="border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-muted-foreground">
        {t("google_setup_hint")}
      </p>
    );
  }

  return (
    <div className="relative h-14 w-full overflow-hidden border border-primary/30 bg-gradient-to-b from-[#1c1812] to-[#14110d] shadow-[inset_0_1px_0_rgba(232,197,106,0.12)] transition hover:border-primary/55 hover:from-[#221c14] hover:to-[#18140f]">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-3">
        <GoogleMark />
        <span className="text-[15px] font-medium tracking-wide text-white/95">
          {t("google_login")}
        </span>
      </div>
      <div
        ref={buttonRef}
        className="absolute inset-0 z-10 opacity-0 [&_iframe]:h-full [&_iframe]:min-h-full [&_iframe]:w-full"
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.5 0 19.6-8.1 19.6-19.5 0-1.3-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l.1.1 6.2 5.2C36.9 41.5 44 36 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
