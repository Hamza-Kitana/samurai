import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCategory as localDeleteCategory,
  deleteProduct as localDelete,
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  logInterest as localLogInterest,
  saveCategory as localSaveCategory,
  saveProduct as localSave,
  upsertProductFileMeta,
  uid,
  type Category,
  type Subcategory,
} from "@/lib/data";
import { deleteProductBlob, putProductBlob } from "@/lib/product-files-db";
import type { Product } from "@/lib/store";

export async function fetchProducts(category?: string) {
  await delay();
  let products = getProducts();
  if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }
  return products;
}

export async function fetchProductBySlug(slug: string) {
  await delay();
  return getProductBySlug(slug);
}

export async function fetchFeaturedProducts() {
  await delay();
  return getFeaturedProducts();
}

export async function fetchCategories() {
  await delay();
  return getCategories();
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
    queryFn: async () => {
      await delay();
      return getProducts(true);
    },
  });
}

export async function upsertProduct(
  data: Omit<Product, "id" | "created_at"> & { id?: string },
  packageFile?: { fileName: string; blob: Blob } | null,
) {
  const product: Product = {
    id: data.id ?? uid(),
    created_at: new Date().toISOString(),
    ...data,
  };
  localSave(product);

  if (packageFile) {
    await putProductBlob(product.id, packageFile.fileName, packageFile.blob);
    upsertProductFileMeta(product.id, packageFile.fileName, `idb:${product.id}`);
  } else if (packageFile === null) {
    await deleteProductBlob(product.id);
    upsertProductFileMeta(product.id, `${product.slug}.zip`, `#download-${product.slug}`);
  }

  return product;
}

export async function removeProduct(id: string) {
  localDelete(id);
}

export async function upsertCategory(data: Omit<Category, "id"> & { id?: string }) {
  const nameAr = data.name_ar.trim();
  const nameEn = data.name_en.trim();
  const slugSource = data.slug.trim() || nameEn || nameAr;
  const subcategories = (data.subcategories ?? [])
    .map((s) => ({
      slug: s.slug
        .trim()
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF\s-]/g, "")
        .replace(/\s+/g, "-"),
      name_ar: s.name_ar.trim(),
      name_en: s.name_en.trim() || s.name_ar.trim(),
    }))
    .filter((s) => s.slug && s.name_ar);
  const category: Category = {
    id: data.id ?? uid(),
    slug: slugSource
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-"),
    name_ar: nameAr,
    name_en: nameEn || nameAr,
    subcategories,
  };
  if (!category.slug || !category.name_ar) {
    throw new Error("Category name is required");
  }
  localSaveCategory(category);
  return category;
}

export async function removeCategory(id: string) {
  localDeleteCategory(id);
}

export function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["products"] });
  void qc.invalidateQueries({ queryKey: ["admin-products"] });
  void qc.invalidateQueries({ queryKey: ["product"] });
  void qc.invalidateQueries({ queryKey: ["categories"] });
}

export async function logInterest(productId: string, kind: "view" | "cart", userId?: string) {
  localLogInterest(productId, kind, userId);
}

function delay(ms = 80) {
  return new Promise((r) => setTimeout(r, ms));
}

export type { Category, Subcategory };
