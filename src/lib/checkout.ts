import {
  approveOrder as localApproveOrder,
  createOrder,
  getAllOrders,
  getInterest,
  getUserDownloads,
  getUserOrders,
} from "@/lib/data";
import type { CartItem } from "@/lib/store";

export async function checkout(items: CartItem[], userId: string) {
  await delay();
  return createOrder(
    userId,
    items.map((i) => ({
      id: i.id,
      title_ar: i.title_ar,
      title_en: i.title_en,
      price: i.price,
    })),
  );
}

export async function approveOrder(orderId: string) {
  await delay();
  return localApproveOrder(orderId);
}

export async function fetchUserOrders(userId: string) {
  await delay();
  return getUserOrders(userId);
}

export async function fetchOrderDownloads(userId: string) {
  await delay();
  return getUserDownloads(userId);
}

export async function fetchAdminOrders() {
  await delay();
  return getAllOrders();
}

export async function fetchAdminInterest() {
  await delay();
  return getInterest();
}

function delay(ms = 80) {
  return new Promise((r) => setTimeout(r, ms));
}
