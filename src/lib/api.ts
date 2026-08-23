import { apiFetch, setToken } from "@/lib/api-client";
import type { GoogleProfile } from "@/lib/google-auth";
import type {
  Category,
  Interest,
  LocalUser,
  Order,
  Product,
  ProductFile,
} from "@/lib/data";

type AuthUserResponse = {
  id: string;
  email: string;
  display_name: string;
  avatar?: string;
  is_admin: boolean;
};

type AuthResponse = {
  token: string;
  user: AuthUserResponse;
};

function mapAuthUser(u: AuthUserResponse): LocalUser {
  const user: LocalUser = {
    id: u.id,
    email: u.email,
    password: "",
    displayName: u.display_name,
    role: u.is_admin ? "admin" : "user",
  };
  if (u.avatar) user.avatar = u.avatar;
  return user;
}

export async function apiRegister(email: string, password: string, displayName: string) {
  const res = await apiFetch<AuthResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    },
    false,
  );
  setToken(res.token);
  return mapAuthUser(res.user);
}

export async function apiLogin(email: string, password: string) {
  const res = await apiFetch<AuthResponse>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  setToken(res.token);
  return mapAuthUser(res.user);
}

export async function apiGoogleLogin(profile: GoogleProfile) {
  const res = await apiFetch<AuthResponse>(
    "/api/auth/google",
    {
      method: "POST",
      body: JSON.stringify({
        google_id: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
      }),
    },
    false,
  );
  setToken(res.token);
  return mapAuthUser(res.user);
}

export async function apiLogout() {
  setToken(null);
}

export async function apiGetMe(): Promise<LocalUser | null> {
  try {
    const u = await apiFetch<AuthUserResponse>("/api/auth/me");
    return mapAuthUser(u);
  } catch {
    setToken(null);
    return null;
  }
}

export async function apiGetProducts(opts?: {
  category?: string;
  featured?: boolean;
  includeInactive?: boolean;
}) {
  const params = new URLSearchParams();
  if (opts?.category) params.set("category", opts.category);
  if (opts?.featured) params.set("featured", "true");
  if (opts?.includeInactive) params.set("include_inactive", "true");
  const q = params.toString();
  return apiFetch<Product[]>(`/api/products${q ? `?${q}` : ""}`, {}, false);
}

export async function apiGetProductBySlug(slug: string) {
  return apiFetch<Product>(`/api/products/${slug}`, {}, false);
}

export async function apiGetCategories() {
  return apiFetch<Category[]>("/api/categories", {}, false);
}

export async function apiCheckout(
  items: { id: string; title_ar: string; title_en: string; price: number }[],
) {
  return apiFetch<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function apiGetUserOrders() {
  return apiFetch<Order[]>("/api/orders/me");
}

export async function apiGetAllOrders() {
  return apiFetch<Order[]>("/api/orders");
}

export async function apiGetUserDownloads() {
  return apiFetch<ProductFile[]>("/api/downloads/me");
}

export async function apiLogInterest(productId: string, kind: "view" | "cart") {
  await apiFetch("/api/interest", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, kind }),
  }, false);
}

export async function apiGetInterest() {
  return apiFetch<Interest[]>("/api/interest");
}

export async function apiUpsertProduct(data: Record<string, unknown>, id?: string) {
  if (id) {
    return apiFetch<Product>(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  return apiFetch<Product>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteProduct(id: string) {
  await apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
}

export async function apiUploadProductFile(productId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ProductFile>(`/api/admin/products/${productId}/file`, {
    method: "POST",
    body: form,
  });
}

export async function apiDeleteProductFile(productId: string) {
  return apiFetch<ProductFile>(`/api/admin/products/${productId}/file`, {
    method: "DELETE",
  });
}

export async function apiUpsertCategory(data: {
  id?: string;
  slug: string;
  name_ar: string;
  name_en: string;
}) {
  if (data.id) {
    return apiFetch<Category>(`/api/admin/categories/${data.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  return apiFetch<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCategory(id: string) {
  await apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export async function apiGetProductFileMeta(productId: string) {
  try {
    return await apiFetch<ProductFile>(`/api/admin/products/${productId}/file`);
  } catch {
    return null;
  }
}

export async function apiGetUserById(id: string) {
  return apiFetch<{ id: string; email: string; display_name: string; avatar?: string }>(
    `/api/admin/users/${id}`,
  );
}
