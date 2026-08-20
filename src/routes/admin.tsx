import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Eye,
  Plus,
  Trash2,
  Pencil,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLang } from "@/lib/i18n";
import { useAuth, money, type Product } from "@/lib/store";
import { fetchAdminOrders, fetchAdminInterest } from "@/lib/checkout";
import { getProductFileMeta, getUserById, type Order } from "@/lib/data";
import {
  invalidateProducts,
  removeCategory,
  removeProduct,
  upsertCategory,
  upsertProduct,
  useAdminProducts,
  useCategories,
  type Category,
} from "@/lib/products";
import { cn } from "@/lib/utils";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { ProductFileUploader } from "@/components/admin/ProductFileUploader";
import { ProductImage } from "@/components/store/ProductImage";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#e8c56a", "#c9962e", "#8f6a1a", "#f3e2a8", "#b8892d", "#d4af37", "#a67c2a"];

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminTab = "overview" | "orders" | "products" | "categories" | "interest";

const emptyProduct = {
  slug: "",
  title_ar: "",
  title_en: "",
  short_ar: "",
  short_en: "",
  description_ar: "",
  description_en: "",
  category: "maps",
  price: 0,
  images: [] as string[],
  file_name: "",
  pending_file: null as File | null,
  clear_file: false,
  features_ar: "",
  features_en: "",
  install_ar: "",
  install_en: "",
  is_featured: false,
  is_active: true,
};

const emptyCategory = {
  slug: "",
  name_ar: "",
  name_en: "",
};

function AdminPage() {
  const { t, lang } = useLang();
  const { user, isAdmin, loading, openLogin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      openLogin({ staff: true, next: "/admin" });
      void navigate({ to: "/" });
    }
    if (!loading && user && !isAdmin) void navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate, openLogin]);

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchAdminOrders,
    enabled: isAdmin,
  });

  const { data: products } = useAdminProducts();
  const { data: categories } = useCategories();

  const { data: interest } = useQuery({
    queryKey: ["admin-interest"],
    queryFn: fetchAdminInterest,
    enabled: isAdmin,
  });

  const categoryName = (slug: string) => {
    const cat = (categories ?? []).find((c) => c.slug === slug);
    if (!cat) return slug;
    return lang === "ar" ? cat.name_ar : cat.name_en;
  };

  const groupedProducts = useMemo(() => {
    const list = products ?? [];
    const filtered =
      filterCategory === "all" ? list : list.filter((p) => p.category === filterCategory);
    const groups: { slug: string; label: string; items: Product[] }[] = [];
    const order = (categories ?? []).map((c) => c.slug);

    for (const slug of order) {
      const items = filtered.filter((p) => p.category === slug);
      if (items.length) {
        groups.push({ slug, label: categoryName(slug), items });
      }
    }

    const known = new Set(order);
    const orphan = filtered.filter((p) => !known.has(p.category));
    if (orphan.length) {
      groups.push({ slug: "_other", label: "—", items: orphan });
    }
    return groups;
  }, [products, categories, filterCategory, lang]);

  const categorySales = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders ?? []) {
      for (const item of order.order_items ?? []) {
        const cat = item.products?.category ?? "other";
        map.set(cat, (map.get(cat) ?? 0) + Number(item.price));
      }
    }
    // Fallback: product catalog counts if no sales yet
    if (map.size === 0) {
      for (const p of products ?? []) {
        map.set(p.category, (map.get(p.category) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([slug, value]) => ({
        slug,
        name: categoryName(slug),
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value)
      .map((row, index) => ({
        ...row,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [orders, products, categories, lang]);

  const revenueTrend = useMemo(() => {
    const days = 14;
    const points: { day: string; label: string; revenue: number; orders: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      points.push({
        day: key,
        label: d.toLocaleDateString(lang === "ar" ? "ar" : "en", {
          month: "short",
          day: "numeric",
        }),
        revenue: 0,
        orders: 0,
      });
    }
    const byDay = new Map(points.map((p) => [p.day, p]));
    for (const order of orders ?? []) {
      const key = new Date(order.created_at).toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
    }
    return points.map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100,
    }));
  }, [orders, lang]);

  const pieConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    for (const row of categorySales) {
      config[row.slug] = { label: row.name, color: row.fill ?? "#e8c56a" };
    }
    return config;
  }, [categorySales]);

  const trendConfig = useMemo<ChartConfig>(
    () => ({
      revenue: { label: t("revenue"), color: "#e8c56a" },
      orders: { label: t("orders_count"), color: "#c9962e" },
    }),
    [t],
  );

  const saveProduct = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      const images = payload.images.filter(Boolean);
      const image_url = images[0] ?? null;
      const data: Parameters<typeof upsertProduct>[0] = {
        slug: payload.slug,
        title_ar: payload.title_ar,
        title_en: payload.title_en,
        short_ar: payload.short_ar || null,
        short_en: payload.short_en || null,
        description_ar: payload.description_ar || null,
        description_en: payload.description_en || null,
        category: payload.category,
        price: payload.price,
        image_url,
        images,
        features_ar: payload.features_ar.split("\n").filter(Boolean),
        features_en: payload.features_en.split("\n").filter(Boolean),
        install_ar: payload.install_ar.split("\n").filter(Boolean),
        install_en: payload.install_en.split("\n").filter(Boolean),
        is_featured: payload.is_featured,
        is_active: payload.is_active,
      };
      if (payload.id) data.id = payload.id;

      let packageFile: { fileName: string; blob: Blob } | null | undefined;
      if (payload.pending_file) {
        packageFile = {
          fileName: payload.pending_file.name,
          blob: payload.pending_file,
        };
      } else if (payload.clear_file) {
        packageFile = null;
      } else {
        packageFile = undefined;
      }

      await upsertProduct(data, packageFile);
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyProduct);
      toast.success(t("save"));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await removeProduct(id);
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
      toast.success(t("delete"));
    },
  });

  const saveCategoryMut = useMutation({
    mutationFn: async (payload: typeof categoryForm & { id?: string }) => {
      const data: Parameters<typeof upsertCategory>[0] = {
        slug: payload.slug,
        name_ar: payload.name_ar,
        name_en: payload.name_en || payload.name_ar,
      };
      if (payload.id) data.id = payload.id;
      return upsertCategory(data);
    },
    onSuccess: (saved) => {
      invalidateProducts(queryClient);
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategory);
      // If product dialog is open, select the new/edited category
      if (dialogOpen) {
        setForm((prev) => ({ ...prev, category: saved.slug }));
      }
      toast.success(t("save"));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: async (id: string) => {
      await removeCategory(id);
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
      toast.success(t("delete"));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("category_in_use")),
  });

  const openEdit = (product: Product) => {
    setEditing(product);
    const meta = getProductFileMeta(product.id);
    const hasRealFile = Boolean(meta?.file_url.startsWith("idb:"));
    setForm({
      slug: product.slug,
      title_ar: product.title_ar,
      title_en: product.title_en,
      short_ar: product.short_ar ?? "",
      short_en: product.short_en ?? "",
      description_ar: product.description_ar ?? "",
      description_en: product.description_en ?? "",
      category: product.category,
      price: product.price,
      images: product.images?.length
        ? product.images
        : product.image_url
          ? [product.image_url]
          : [],
      file_name: hasRealFile ? (meta?.file_name ?? "") : "",
      pending_file: null,
      clear_file: false,
      features_ar: product.features_ar.join("\n"),
      features_en: product.features_en.join("\n"),
      install_ar: (product.install_ar ?? []).join("\n"),
      install_en: (product.install_en ?? []).join("\n"),
      is_featured: product.is_featured,
      is_active: product.is_active,
    });
    setDialogOpen(true);
  };

  const openAddProduct = () => {
    setEditing(null);
    setForm({
      ...emptyProduct,
      category: categories?.[0]?.slug ?? "maps",
    });
    setDialogOpen(true);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      slug: cat.slug,
      name_ar: cat.name_ar,
      name_en: cat.name_en,
    });
    setCategoryDialogOpen(true);
  };

  if (loading || !isAdmin) return <LoadingScreen />;

  const totalRevenue = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);
  const uniqueCustomers = new Set((orders ?? []).map((o) => o.user_id)).size;
  const viewCount = (interest ?? []).filter((i) => i.kind === "view").length;
  const cartCount = (interest ?? []).filter((i) => i.kind === "cart").length;

  const navItems: { id: AdminTab; icon: typeof LayoutDashboard; label: string }[] = [
    { id: "overview", icon: LayoutDashboard, label: t("admin_overview") },
    { id: "orders", icon: ShoppingBag, label: t("admin_orders") },
    { id: "products", icon: Package, label: t("admin_products") },
    { id: "categories", icon: Tags, label: t("admin_categories") },
    { id: "interest", icon: Eye, label: t("admin_interest") },
  ];

  return (
    <PageLayout fullWidth>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-56 shrink-0 border-e border-border bg-sidebar p-4 md:block">
          <h2 className="mb-6 font-display text-lg font-bold text-gold-gradient">{t("nav_admin")}</h2>
          <nav className="space-y-1">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  tab === id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex w-full flex-col">
          <div className="flex gap-1 overflow-x-auto border-b border-border p-2 md:hidden">
            {navItems.map(({ id, label }) => (
              <Button
                key={id}
                size="sm"
                variant={tab === id ? "default" : "ghost"}
                onClick={() => setTab(id)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex-1 p-4 sm:p-6">
            {tab === "overview" && (
              <div className="space-y-6">
                <h1 className="font-display text-2xl font-bold">{t("admin_overview")}</h1>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="surface-panel border-white/10 bg-[#12100e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">{t("revenue")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-2xl font-bold text-gold-gradient">
                        {money(totalRevenue)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="surface-panel border-white/10 bg-[#12100e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">{t("orders_count")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-2xl font-bold">{(orders ?? []).length}</p>
                    </CardContent>
                  </Card>
                  <Card className="surface-panel border-white/10 bg-[#12100e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">{t("customers")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-2xl font-bold">{uniqueCustomers}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <Card className="surface-panel border-white/10 bg-[#12100e]">
                    <CardHeader className="pb-2">
                      <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
                        {t("chart_category_kicker")}
                      </p>
                      <CardTitle className="font-display text-lg tracking-wide">
                        {t("chart_category_title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {categorySales.length === 0 ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">
                          {t("chart_empty")}
                        </p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-[1fr_9rem] sm:items-center">
                          <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[16rem] w-full">
                            <PieChart>
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) =>
                                      (orders ?? []).some((o) => (o.order_items ?? []).length > 0)
                                        ? money(Number(value))
                                        : String(value)
                                    }
                                  />
                                }
                              />
                              <Pie
                                data={categorySales}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={88}
                                paddingAngle={3}
                                stroke="transparent"
                              >
                                {categorySales.map((entry) => (
                                  <Cell key={entry.slug} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                          <ul className="space-y-2">
                            {categorySales.slice(0, 6).map((row) => (
                              <li key={row.slug} className="flex items-center gap-2 text-xs">
                                <span
                                  className="h-2.5 w-2.5 shrink-0"
                                  style={{ backgroundColor: row.fill }}
                                />
                                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                  {row.name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="surface-panel border-white/10 bg-[#12100e]">
                    <CardHeader className="pb-2">
                      <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
                        {t("chart_trend_kicker")}
                      </p>
                      <CardTitle className="font-display text-lg tracking-wide">
                        {t("chart_trend_title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={trendConfig} className="aspect-[16/9] w-full max-h-[16rem]">
                        <AreaChart data={revenueTrend} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e8c56a" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#e8c56a" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={18}
                            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={36}
                            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value, name) =>
                                  name === "revenue" ? money(Number(value)) : String(value)
                                }
                              />
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#e8c56a"
                            strokeWidth={2.2}
                            fill="url(#revenueFill)"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {tab === "orders" && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">{t("admin_orders")}</h1>
                <div className="surface-panel overflow-hidden rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("order")}</TableHead>
                        <TableHead>{t("customer")}</TableHead>
                        <TableHead>{t("items")}</TableHead>
                        <TableHead>{t("total")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orders ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            {t("no_orders")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        (orders ?? []).map((order) => {
                          const customer = getUserById(order.user_id);
                          return (
                            <TableRow
                              key={order.id}
                              className="cursor-pointer transition hover:bg-primary/5"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <TableCell className="font-mono text-xs">
                                #{order.id.slice(0, 8)}
                              </TableCell>
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {customer?.displayName || customer?.email || order.user_id.slice(0, 8)}
                                  </p>
                                  {customer?.email && (
                                    <p className="truncate text-xs text-muted-foreground">
                                      {customer.email}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{(order.order_items ?? []).length}</TableCell>
                              <TableCell className="font-bold">{money(order.total)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString(
                                  lang === "ar" ? "ar" : "en",
                                  { year: "numeric", month: "short", day: "numeric" },
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  {t("order_view")}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Dialog
              open={Boolean(selectedOrder)}
              onOpenChange={(open) => {
                if (!open) setSelectedOrder(null);
              }}
            >
              <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#12100e] sm:max-w-lg sm:rounded-none">
                {selectedOrder && (
                  <>
                    <DialogHeader className="space-y-2 text-start sm:text-start">
                      <DialogTitle className="font-display text-xl tracking-wide">
                        {t("order_details")} #{selectedOrder.id.slice(0, 8)}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        {new Date(selectedOrder.created_at).toLocaleString(
                          lang === "ar" ? "ar" : "en",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </DialogDescription>
                    </DialogHeader>

                    {(() => {
                      const customer = getUserById(selectedOrder.user_id);
                      return (
                        <div className="space-y-5">
                          <div className="grid gap-3 border border-white/10 bg-[#0e0c0a] p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                {t("customer")}
                              </p>
                              <p className="mt-1 font-medium">
                                {customer?.displayName || "—"}
                              </p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {customer?.email || selectedOrder.user_id}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                {t("status_paid")}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge>{selectedOrder.status}</Badge>
                                <span className="font-display text-lg font-semibold text-gold-gradient">
                                  {money(selectedOrder.total)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 text-[11px] tracking-[0.18em] text-primary uppercase">
                              {t("checkout_items")}
                            </p>
                            <ul className="divide-y divide-white/8 border border-white/10">
                              {(selectedOrder.order_items ?? []).map((item) => {
                                const title =
                                  lang === "ar"
                                    ? item.title
                                    : (item.title_en ??
                                      item.products?.title_en ??
                                      item.title);
                                return (
                                  <li key={item.id} className="flex gap-3 p-3">
                                    <div className="h-16 w-20 shrink-0 overflow-hidden border border-white/8">
                                      <ProductImage
                                        title={title}
                                        imageUrl={item.products?.image_url ?? null}
                                        category={item.products?.category ?? "maps"}
                                      />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                      <p className="truncate text-sm font-medium">{title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.products?.slug ?? item.product_id.slice(0, 8)}
                                      </p>
                                    </div>
                                    <p className="shrink-0 self-center font-display font-semibold text-gold-gradient">
                                      {money(item.price)}
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="font-medium">{t("total")}</span>
                            <span className="font-display text-2xl font-semibold text-gold-gradient">
                              {money(selectedOrder.total)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                        {t("cancel")}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {tab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="font-display text-2xl font-bold">{t("admin_products")}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={t("category")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all")}</SelectItem>
                        {(categories ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.slug}>
                            {lang === "ar" ? c.name_ar : c.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-1" onClick={openAddCategory}>
                      <Tags className="h-4 w-4" />
                      {t("add_category")}
                    </Button>
                    <Button className="gap-1" onClick={openAddProduct}>
                      <Plus className="h-4 w-4" />
                      {t("add_product")}
                    </Button>
                  </div>
                </div>

                {groupedProducts.map((group) => (
                  <div key={group.slug} className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <h2 className="font-display text-lg font-semibold text-primary">{group.label}</h2>
                      <Badge variant="outline">
                        {group.items.length} {t("products_in_category")}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((product) => {
                        const title = lang === "ar" ? product.title_ar : product.title_en;
                        return (
                          <Card key={product.id} className="surface-panel">
                            <CardContent className="flex items-center justify-between gap-4 p-4">
                              <div>
                                <p className="font-medium">{title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {money(product.price)} · {categoryName(product.category)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {product.is_featured && <Badge>★</Badge>}
                                {!product.is_active && <Badge variant="outline">off</Badge>}
                                <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => void deleteProduct.mutate(product.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "categories" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-2xl font-bold">{t("admin_categories")}</h1>
                  <Button className="gap-1" onClick={openAddCategory}>
                    <Plus className="h-4 w-4" />
                    {t("add_category")}
                  </Button>
                </div>

                <div className="space-y-2">
                  {(categories ?? []).map((cat) => {
                    const count = (products ?? []).filter((p) => p.category === cat.slug).length;
                    return (
                      <Card key={cat.id} className="surface-panel">
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                          <div>
                            <p className="font-medium">
                              {lang === "ar" ? cat.name_ar : cat.name_en}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cat.slug} · {count} {t("products_in_category")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEditCategory(cat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => void deleteCategoryMut.mutate(cat.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "interest" && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">{t("admin_interest")}</h1>
                <div className="mb-4 flex gap-4">
                  <Badge variant="outline">
                    {t("interest_views")}: {viewCount}
                  </Badge>
                  <Badge variant="outline">
                    {t("interest_carts")}: {cartCount}
                  </Badge>
                </div>
                <div className="surface-panel overflow-hidden rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("product")}</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead>{t("date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(interest ?? []).map((row) => {
                        const title =
                          lang === "ar" ? row.products?.title_ar : row.products?.title_en;
                        return (
                          <TableRow key={row.id}>
                            <TableCell>{title ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{row.kind}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(row.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[92vh] w-[min(96vw,52rem)] flex-col gap-0 overflow-hidden border border-white/10 bg-[#12100e] p-0 sm:max-w-[52rem] sm:rounded-none [&>button]:end-3 [&>button]:top-3">
          <DialogHeader className="shrink-0 border-b border-white/8 px-6 py-5 text-start sm:text-start">
            <DialogTitle className="font-display text-xl tracking-wide">
              {editing ? t("edit") : t("add_product")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editing ? editing.slug : t("admin_products")}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-5">
            <section className="space-y-3">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
                  {t("images_section")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("images_drop_hint")}</p>
              </div>
              <ProductImageUploader
                images={form.images}
                onChange={(images) => setForm({ ...form, images })}
              />
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
                  {t("product_file_section")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("product_file_hint")}</p>
              </div>
              <ProductFileUploader
                fileName={form.file_name}
                hasPendingFile={Boolean(form.pending_file)}
                onFile={(file) => {
                  if (file) {
                    setForm({
                      ...form,
                      pending_file: file,
                      file_name: file.name,
                      clear_file: false,
                    });
                  } else {
                    setForm({
                      ...form,
                      pending_file: null,
                      file_name: "",
                      clear_file: true,
                    });
                  }
                }}
              />
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="border-white/12 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>{t("category")}</Label>
                  <button
                    type="button"
                    onClick={openAddCategory}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    + {t("new_category")}
                  </button>
                </div>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="border-white/12 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {lang === "ar" ? c.name_ar : c.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title AR</Label>
                <Input
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  className="border-white/12 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>Title EN</Label>
                <Input
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  className="border-white/12 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("price")}</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="border-white/12 bg-transparent"
                />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("features_hint")} (AR)</Label>
                <Textarea
                  value={form.features_ar}
                  onChange={(e) => setForm({ ...form, features_ar: e.target.value })}
                  rows={4}
                  className="border-white/12 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("features_hint")} (EN)</Label>
                <Textarea
                  value={form.features_en}
                  onChange={(e) => setForm({ ...form, features_en: e.target.value })}
                  rows={4}
                  className="border-white/12 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("install_hint")} (AR)</Label>
                <Textarea
                  value={form.install_ar}
                  onChange={(e) => setForm({ ...form, install_ar: e.target.value })}
                  rows={4}
                  className="border-white/12 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("install_hint")} (EN)</Label>
                <Textarea
                  value={form.install_en}
                  onChange={(e) => setForm({ ...form, install_en: e.target.value })}
                  rows={4}
                  className="border-white/12 bg-transparent"
                />
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-white/8 px-6 py-4 sm:justify-between">
            <Button variant="outline" className="border-white/15" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              className="font-semibold"
              onClick={() =>
                void saveProduct.mutate({ ...form, ...(editing ? { id: editing.id } : {}) })
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t("edit") : t("add_category")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>{t("category_name_ar")}</Label>
              <Input
                value={categoryForm.name_ar}
                onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                placeholder="أسلحة"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("category_name_en")}</Label>
              <Input
                value={categoryForm.name_en}
                onChange={(e) => {
                  const name_en = e.target.value;
                  setCategoryForm((prev) => ({
                    ...prev,
                    name_en,
                    slug: editingCategory
                      ? prev.slug
                      : name_en
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .trim()
                          .replace(/\s+/g, "-"),
                  }));
                }}
                placeholder="Weapons"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("category_slug")}</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="weapons"
              />
              <p className="text-[11px] text-muted-foreground">{t("category_slug_hint")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() =>
                void saveCategoryMut.mutate({
                  ...categoryForm,
                  ...(editingCategory ? { id: editingCategory.id } : {}),
                })
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
