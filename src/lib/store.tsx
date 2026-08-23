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
import type { GoogleProfile } from "@/lib/google-auth";
import {
  apiGetMe,
  apiGoogleLogin,
  apiLogin,
  apiLogout,
  apiRegister,
} from "@/lib/api";
import type { LocalUser, Product as DataProduct } from "@/lib/data";

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
  openLogin: (opts?: { staff?: boolean; next?: string }) => void;
  closeLogin: () => void;
  consumeLoginNext: () => string | null;
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
  openLogin: () => {},
  closeLogin: () => {},
  consumeLoginNext: () => null,
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
  const loginNextRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    void apiGetMe()
      .then((current) => {
        if (current) {
          setUser(toAuthUser(current));
          setIsAdmin(current.role === "admin");
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      })
      .catch((err) => {
        console.warn("auth refresh failed", err);
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAdmin,
      loading,
      loginOpen,
      loginStaff,
      openLogin: (opts) => {
        loginNextRef.current = opts?.next ?? null;
        setLoginStaff(Boolean(opts?.staff));
        setLoginOpen(true);
      },
      closeLogin: () => {
        setLoginOpen(false);
        setLoginStaff(false);
      },
      consumeLoginNext: () => {
        const next = loginNextRef.current;
        loginNextRef.current = null;
        return next;
      },
      login: async (email, password) => {
        const u = await apiLogin(email, password);
        setUser(toAuthUser(u));
        setIsAdmin(u.role === "admin");
        setLoginOpen(false);
        setLoginStaff(false);
      },
      register: async (email, password, name) => {
        const u = await apiRegister(email, password, name);
        setUser(toAuthUser(u));
        setIsAdmin(u.role === "admin");
        setLoginOpen(false);
      },
      loginWithGoogle: async (profile) => {
        const u = await apiGoogleLogin(profile);
        setUser(toAuthUser(u));
        setIsAdmin(u.role === "admin");
        setLoginOpen(false);
        setLoginStaff(false);
      },
      logout: () => {
        void apiLogout();
        setUser(null);
        setIsAdmin(false);
      },
      refresh,
    }),
    [user, isAdmin, loading, loginOpen, loginStaff, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function money(value: number | string) {
  return `$${Number(value).toFixed(2)}`;
}
