import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ensureSeed,
  getCurrentUser,
  signIn as localSignIn,
  signInWithGoogle as localSignInWithGoogle,
  signOut as localSignOut,
  signUp as localSignUp,
  type LocalUser,
  type Product as DataProduct,
} from "@/lib/data";
import {
  parseGoogleCredential,
  stashLoginNext,
  takePendingGoogleCredential,
  takeStashedLoginNext,
  type GoogleProfile,
} from "@/lib/google-auth";

export type Product = DataProduct;

export type CartItem = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  price: number;
  image_url: string | null;
};

const CART_KEY = "samurai-cart";

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode — keep cart in memory only */
    }
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      open,
      setOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add: (item) => {
        if (items.some((i) => i.id === item.id)) return;
        persist([...items, item]);
      },
      remove: (id) => persist(items.filter((i) => i.id !== id)),
      clear: () => persist([]),
      total: items.reduce((sum, i) => sum + Number(i.price), 0),
    }),
    [items, open, persist],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
};

type AuthCtx = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  loginOpen: boolean;
  loginStaff: boolean;
  googleReturnPending: boolean;
  openLogin: (opts?: { staff?: boolean; next?: string }) => void;
  closeLogin: () => void;
  consumeLoginNext: () => string | null;
  clearGoogleReturn: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (profile: GoogleProfile) => Promise<void>;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
  loginOpen: false,
  loginStaff: false,
  googleReturnPending: false,
  openLogin: () => {},
  closeLogin: () => {},
  consumeLoginNext: () => null,
  clearGoogleReturn: () => {},
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  refresh: () => {},
});

function toAuthUser(u: LocalUser): AuthUser {
  const user: AuthUser = {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
  };
  if (u.avatar) user.avatar = u.avatar;
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginStaff, setLoginStaff] = useState(false);
  const [googleReturnPending, setGoogleReturnPending] = useState(false);
  const loginNextRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    try {
      ensureSeed();
      const current = getCurrentUser();
      if (current) {
        setUser(toAuthUser(current));
        setIsAdmin(current.role === "admin");
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.warn("auth refresh failed", err);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Complete Google redirect sign-in after returning from Google / callback bridge.
  useEffect(() => {
    const credential = takePendingGoogleCredential();
    if (!credential) return;
    try {
      const profile = parseGoogleCredential(credential);
      const u = localSignInWithGoogle(profile);
      setUser(toAuthUser(u));
      setIsAdmin(u.role === "admin");
      setLoginOpen(false);
      setLoginStaff(false);
      const stashed = takeStashedLoginNext();
      if (stashed) loginNextRef.current = stashed;
      setGoogleReturnPending(true);
    } catch (err) {
      console.warn("Google redirect sign-in failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAdmin,
      loading,
      loginOpen,
      loginStaff,
      googleReturnPending,
      openLogin: (opts) => {
        loginNextRef.current = opts?.next ?? null;
        stashLoginNext(opts?.next);
        setLoginStaff(Boolean(opts?.staff));
        setLoginOpen(true);
      },
      closeLogin: () => {
        setLoginOpen(false);
        setLoginStaff(false);
      },
      consumeLoginNext: () => {
        const next = loginNextRef.current ?? takeStashedLoginNext();
        loginNextRef.current = null;
        return next;
      },
      clearGoogleReturn: () => setGoogleReturnPending(false),
      login: async (email, password) => {
        const u = localSignIn(email, password);
        setUser(toAuthUser(u));
        setIsAdmin(u.role === "admin");
        setLoginOpen(false);
        setLoginStaff(false);
      },
      register: async (email, password, name) => {
        const u = localSignUp(email, password, name);
        setUser(toAuthUser(u));
        setIsAdmin(u.role === "admin");
        setLoginOpen(false);
      },
      loginWithGoogle: async (profile) => {
        const u = localSignInWithGoogle(profile);
        setUser(toAuthUser(u));
        setIsAdmin(u.role === "admin");
        setLoginOpen(false);
        setLoginStaff(false);
      },
      logout: () => {
        localSignOut();
        setUser(null);
        setIsAdmin(false);
      },
      refresh,
    }),
    [user, isAdmin, loading, loginOpen, loginStaff, googleReturnPending, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function money(value: number | string) {
  return `$${Number(value).toFixed(2)}`;
}
