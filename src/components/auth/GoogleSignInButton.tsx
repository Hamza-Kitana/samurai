import { useEffect, useRef, useState } from "react";
import {
  getGoogleClientId,
  getGoogleLoginUri,
  loadGoogleScript,
} from "@/lib/google-auth";
import { useLang } from "@/lib/i18n";

type GoogleSignInButtonProps = {
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
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

        // Full-page redirect avoids browser popup blockers (common in Edge).
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "redirect",
          login_uri: getGoogleLoginUri(),
          cancel_on_tap_outside: true,
          use_fedcm_for_button: false,
        });

        const width = Math.max(
          280,
          Math.floor(wrapRef.current?.clientWidth || buttonRef.current.clientWidth || 320),
        );

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width,
          locale: lang === "ar" ? "ar" : "en",
        });
      })
      .catch(() => {
        onError?.(t("google_load_error"));
      });

    return () => {
      cancelled = true;
    };
  }, [lang, onError, t]);

  if (missingId) {
    return (
      <p className="border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-muted-foreground">
        {t("google_setup_hint")}
      </p>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="flex min-h-14 w-full items-center justify-center overflow-hidden border border-primary/30 bg-[#14110d] [&_iframe]:!max-w-full"
    >
      <div ref={buttonRef} className="flex w-full justify-center" />
    </div>
  );
}
