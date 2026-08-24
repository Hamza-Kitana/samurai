export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
};

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback?: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    login_uri?: string;
    use_fedcm_for_button?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
      locale?: string;
    },
  ) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

export const GOOGLE_CREDENTIAL_KEY = "kataro_google_credential";
export const LOGIN_NEXT_KEY = "kataro_login_next";

export function getGoogleClientId() {
  return import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined;
}

export function getGoogleLoginUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/auth/google/callback`;
}

export function parseGoogleCredential(credential: string): GoogleProfile {
  const payload = credential.split(".")[1];
  if (!payload) throw new Error("Invalid Google credential");
  const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };
  if (!json.sub || !json.email) throw new Error("Incomplete Google profile");
  const profile: GoogleProfile = {
    googleId: json.sub,
    email: json.email,
    name: json.name || json.email.split("@")[0] || "user",
  };
  if (json.picture) profile.avatar = json.picture;
  return profile;
}

export function takePendingGoogleCredential(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const credential = sessionStorage.getItem(GOOGLE_CREDENTIAL_KEY);
    if (credential) sessionStorage.removeItem(GOOGLE_CREDENTIAL_KEY);
    return credential;
  } catch {
    return null;
  }
}

export function stashLoginNext(next: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (next) sessionStorage.setItem(LOGIN_NEXT_KEY, next);
    else sessionStorage.removeItem(LOGIN_NEXT_KEY);
  } catch {
    /* ignore */
  }
}

export function takeStashedLoginNext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const next = sessionStorage.getItem(LOGIN_NEXT_KEY);
    if (next) sessionStorage.removeItem(LOGIN_NEXT_KEY);
    return next;
  } catch {
    return null;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-gsi]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset["googleGsi"] = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}
