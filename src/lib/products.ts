import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDeleteCategory,
  apiDeleteProduct,
  apiDeleteProductFile,
  apiGetCategories,
  apiGetProductBySlug,
  apiGetProducts,
  apiLogInterest,
  apiUploadProductFile,
  apiUpsertCategory,
  apiUpsertProduct,
} from "@/lib/api";
import type { Product } from "@/lib/store";

export async function fetchProducts(category?: string) {
  const opts: { category?: string } = {};
  if (category && category !== "all") opts.category = category;
  return apiGetProducts(opts);
}

export async function fetchProductBySlug(slug: string) {
  return apiGetProductBySlug(slug);
}

export async function fetchFeaturedProducts() {
  return apiGetProducts({ featured: true });
}

export async function fetchCategories() {
  return apiGetCategories();
}

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category ?? "all"],
    queryFn: () => fetchProducts(category),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiGetProducts({ includeInactive: true }),
  });
}

export async function upsertProduct(
  data: Omit<Product, "id" | "created_at"> & { id?: string },
  packageFile?: { fileName: string; blob: Blob } | null,
) {
  const payload = {
    slug: data.slug,
    title_ar: data.title_ar,
    title_en: data.title_en,
    short_ar: data.short_ar,
    short_en: data.short_en,
    description_ar: data.description_ar,
    description_en: data.description_en,
    category: data.category,
    price: data.price,
    image_url: data.image_url,
    images: data.images,
    features_ar: data.features_ar,
    features_en: data.features_en,
    install_ar: data.install_ar,
    install_en: data.install_en,
    is_featured: data.is_featured,
    is_active: data.is_active,
  };

  const product = await apiUpsertProduct(payload, data.id);

  if (packageFile) {
    const file = new File([packageFile.blob], packageFile.fileName, {
      type: packageFile.blob.type || "application/octet-stream",
    });
    await apiUploadProductFile(product.id, file);
  } else if (packageFile === null && data.id) {
    await apiDeleteProductFile(data.id);
  }

  return product;
}

export async function removeProduct(id: string) {
  await apiDeleteProduct(id);
}

export async function upsertCategory(data: {
  id?: string;
  slug: string;
  name_ar: string;
  name_en: string;
}) {
  const nameAr = data.name_ar.trim();
  const nameEn = data.name_en.trim();
  const slugSource = data.slug.trim() || nameEn || nameAr;
  const slug = slugSource
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  if (!slug || !nameAr) throw new Error("Category name is required");
  return apiUpsertCategory({ ...data, slug, name_ar: nameAr, name_en: nameEn || nameAr });
}

export async function removeCategory(id: string) {
  await apiDeleteCategory(id);
}

export function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["products"] });
  void qc.invalidateQueries({ queryKey: ["admin-products"] });
  void qc.invalidateQueries({ queryKey: ["product"] });
  void qc.invalidateQueries({ queryKey: ["categories"] });
}

export async function logInterest(productId: string, kind: "view" | "cart", _userId?: string) {
  await apiLogInterest(productId, kind);
}

export type { Category } from "@/lib/data";
