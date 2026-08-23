import {
  apiCheckout,
  apiGetAllOrders,
  apiGetInterest,
  apiGetUserDownloads,
  apiGetUserOrders,
} from "@/lib/api";
import type { CartItem } from "@/lib/store";

export async function checkout(items: CartItem[], _userId: string) {
  return apiCheckout(
    items.map((i) => ({
      id: i.id,
      title_ar: i.title_ar,
      title_en: i.title_en,
      price: i.price,
    })),
  );
}

export async function fetchUserOrders(_userId: string) {
  return apiGetUserOrders();
}

export async function fetchOrderDownloads(_userId: string) {
  return apiGetUserDownloads();
}

export async function fetchAdminOrders() {
  return apiGetAllOrders();
}

export async function fetchAdminInterest() {
  return apiGetInterest();
}
