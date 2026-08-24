import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Eye,
  Plus,
  Trash2,
  Pencil,
  Tags,
  Search,
  Star,
  Users,
  Wallet,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { approveOrder, fetchAdminOrders, fetchAdminInterest } from "@/lib/checkout";
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
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

const CHART_COLORS = ["#e11d2e", "#ff4d5a", "#8b000f", "#c0c0c0", "#ff6b6b", "#a31621", "#6b7280"];

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
  subcategory: "",
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
  subcategories: [] as { slug: string; name_ar: string; name_en: string }[],
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
  const [productSearch, setProductSearch] = useState("");
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

  const categoryName = useCallback(
    (slug: string) => {
      const cat = (categories ?? []).find((c) => c.slug === slug);
      if (!cat) return slug;
      return lang === "ar" ? cat.name_ar : cat.name_en;
    },
    [categories, lang],
  );

  const groupedProducts = useMemo(() => {
    const list = products ?? [];
    const q = productSearch.trim().toLowerCase();
    const filtered = list.filter((p) => {
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (!q) return true;
      return (
        p.title_ar.toLowerCase().includes(q) ||
        p.title_en.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
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
  }, [products, categories, filterCategory, productSearch, categoryName]);

  const filteredProductCount = useMemo(
    () => groupedProducts.reduce((n, g) => n + g.items.length, 0),
    [groupedProducts],
  );

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
  }, [orders, products, categoryName]);

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
      config[row.slug] = { label: row.name, color: row.fill ?? "#e11d2e" };
    }
    return config;
  }, [categorySales]);

  const trendConfig = useMemo<ChartConfig>(
    () => ({
      revenue: { label: t("revenue"), color: "#e11d2e" },
      orders: { label: t("orders_count"), color: "#ff4d5a" },
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
        subcategory: payload.subcategory,
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
        subcategories: payload.subcategories ?? [],
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
    onError: (err) => toast.error(err instanceof Error ? err.message : t("category_in_use")),
  });

  const approveOrderMut = useMutation({
    mutationFn: async (orderId: string) => approveOrder(orderId),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", order.user_id] });
      void queryClient.invalidateQueries({ queryKey: ["downloads", order.user_id] });
      setSelectedOrder((prev) => (prev?.id === order.id ? order : prev));
      toast.success(t("approve_success"));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const orderStatusLabel = (status: string) => {
    if (status === "pending") return t("status_pending");
    if (status === "approved") return t("status_approved");
    if (status === "paid") return t("status_paid");
    return status;
  };

  const isOrderUnlocked = (status: string) => status === "approved" || status === "paid";

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
      subcategory: product.subcategory ?? "",
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
      subcategory: categories?.[0]?.subcategories[0]?.slug ?? "",
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
      subcategories: cat.subcategories?.length
        ? cat.subcategories.map((s) => ({ ...s }))
        : [],
    });
    setCategoryDialogOpen(true);
  };

  if (loading || !isAdmin) return <LoadingScreen />;

  const totalRevenue = (orders ?? [])
    .filter((o) => o.status === "approved" || o.status === "paid")
    .reduce((s, o) => s + Number(o.total), 0);
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
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#0a0908]">
        <aside className="hidden w-64 shrink-0 border-e border-white/8 bg-[#0e0c0a] md:flex md:flex-col">
          <div className="border-b border-white/8 px-5 py-6">
            <p className="text-[10px] tracking-[0.28em] text-primary uppercase">
              {t("admin_panel")}
            </p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-wide text-gold-gradient">
              {t("nav_admin")}
            </h2>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-sm transition",
                  tab === id
                    ? "border border-primary/35 bg-primary/10 text-primary"
                    : "border border-transparent text-white/60 hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-white/8 px-5 py-4 text-xs text-white/35">
            {(products ?? []).length} {t("products_total")} · {(orders ?? []).length}{" "}
            {t("orders_count")}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-1 overflow-x-auto border-b border-white/8 bg-[#0e0c0a] p-2 md:hidden">
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

          <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            {tab === "overview" && (
              <div className="mx-auto max-w-6xl space-y-8">
                <header>
                  <p className="text-[11px] tracking-[0.24em] text-primary uppercase">
                    {t("admin_panel")}
                  </p>
                  <h1 className="mt-2 font-display text-3xl font-bold tracking-wide">
                    {t("admin_overview")}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{t("admin_overview_sub")}</p>
                </header>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="border border-white/10 bg-[#12100e] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                          {t("revenue")}
                        </p>
                        <p className="mt-3 font-display text-3xl font-bold tracking-wide text-gold-gradient">
                          {money(totalRevenue)}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center border border-primary/25 bg-primary/10">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="border border-white/10 bg-[#12100e] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                          {t("orders_count")}
                        </p>
                        <p className="mt-3 font-display text-3xl font-bold tracking-wide">
                          {(orders ?? []).length}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center border border-primary/25 bg-primary/10">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="border border-white/10 bg-[#12100e] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                          {t("customers")}
                        </p>
                        <p className="mt-3 font-display text-3xl font-bold tracking-wide">
                          {uniqueCustomers}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center border border-primary/25 bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="border border-white/10 bg-[#12100e] p-5">
                    <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
                      {t("chart_category_kicker")}
                    </p>
                    <h2 className="mt-1 font-display text-lg tracking-wide">
                      {t("chart_category_title")}
                    </h2>
                    {categorySales.length === 0 ? (
                      <p className="py-16 text-center text-sm text-muted-foreground">
                        {t("chart_empty")}
                      </p>
                    ) : (
                      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_9rem] sm:items-center">
                        <ChartContainer
                          config={pieConfig}
                          className="mx-auto aspect-square max-h-[16rem] w-full"
                        >
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
                  </div>

                  <div className="border border-white/10 bg-[#12100e] p-5">
                    <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
                      {t("chart_trend_kicker")}
                    </p>
                    <h2 className="mt-1 font-display text-lg tracking-wide">
                      {t("chart_trend_title")}
                    </h2>
                    <ChartContainer
                      config={trendConfig}
                      className="mt-4 aspect-[16/9] w-full max-h-[16rem]"
                    >
                      <AreaChart
                        data={revenueTrend}
                        margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e11d2e" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#e11d2e" stopOpacity={0.02} />
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
                          stroke="#e11d2e"
                          strokeWidth={2.2}
                          fill="url(#revenueFill)"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </div>
              </div>
            )}

            {tab === "orders" && (
              <div className="mx-auto max-w-6xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[0.24em] text-primary uppercase">
                      {t("admin_panel")}
                    </p>
                    <h1 className="mt-2 font-display text-3xl font-bold tracking-wide">
                      {t("admin_orders")}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">{t("admin_orders_sub")}</p>
                  </div>
                  <div className="text-end text-sm text-muted-foreground">
                    <p>
                      {(orders ?? []).filter((o) => o.status === "pending").length}{" "}
                      {t("status_pending")}
                    </p>
                    <p>
                      {(orders ?? []).length} {t("orders_count")}
                    </p>
                  </div>
                </header>
                <div className="overflow-hidden border border-white/10 bg-[#12100e]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("order")}</TableHead>
                        <TableHead>{t("customer")}</TableHead>
                        <TableHead>{t("items")}</TableHead>
                        <TableHead>{t("total")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="w-40" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orders ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-muted-foreground"
                          >
                            {t("no_orders")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...(orders ?? [])]
                          .sort((a, b) => {
                            const ap = a.status === "pending" ? 0 : 1;
                            const bp = b.status === "pending" ? 0 : 1;
                            if (ap !== bp) return ap - bp;
                            return (
                              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            );
                          })
                          .map((order) => {
                            const customer = getUserById(order.user_id);
                            const pending = order.status === "pending";
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
                                      {customer?.displayName ||
                                        customer?.email ||
                                        order.user_id.slice(0, 8)}
                                    </p>
                                    {customer?.email && (
                                      <p className="truncate text-xs text-muted-foreground">
                                        {customer.email}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{(order.order_items ?? []).length}</TableCell>
                                <TableCell className="font-bold text-primary">
                                  {money(order.total)}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString(
                                    lang === "ar" ? "ar" : "en",
                                    { year: "numeric", month: "short", day: "numeric" },
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={cn(
                                      "inline-flex px-2 py-1 text-[10px] tracking-wide uppercase",
                                      pending
                                        ? "border border-amber-400/30 bg-amber-400/10 text-amber-200"
                                        : "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
                                    )}
                                  >
                                    {orderStatusLabel(order.status)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {pending && (
                                      <Button
                                        size="sm"
                                        className="gap-1 text-xs font-semibold"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void approveOrderMut.mutate(order.id);
                                        }}
                                        disabled={approveOrderMut.isPending}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                        {t("approve_order")}
                                      </Button>
                                    )}
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
                                  </div>
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
              <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
                {selectedOrder && (
                  <>
                    <DialogHeader className="space-y-2 border-b border-white/8 px-6 py-6 pe-14 text-start">
                      <p className="text-[10px] tracking-[0.28em] text-primary uppercase">
                        {t("admin_orders")}
                      </p>
                      <DialogTitle>
                        {t("order_details")} #{selectedOrder.id.slice(0, 8)}
                      </DialogTitle>
                      <DialogDescription>
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
                        <div className="max-h-[min(58vh,28rem)] space-y-5 overflow-y-auto px-6 py-5">
                          <div className="grid gap-3 border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                {t("customer")}
                              </p>
                              <p className="mt-1 font-medium">{customer?.displayName || "—"}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {customer?.email || selectedOrder.user_id}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                {t("status")}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    selectedOrder.status === "pending"
                                      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                                      : "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
                                  )}
                                >
                                  {orderStatusLabel(selectedOrder.status)}
                                </Badge>
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
                            <ul className="divide-y divide-white/8 overflow-hidden border border-white/10">
                              {(selectedOrder.order_items ?? []).map((item) => {
                                const title =
                                  lang === "ar"
                                    ? item.title
                                    : (item.title_en ?? item.products?.title_en ?? item.title);
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

                    <DialogFooter className="border-t border-white/8 px-6 py-4 sm:justify-between">
                      <Button
                        variant="outline"
                        className="border-white/15"
                        onClick={() => setSelectedOrder(null)}
                      >
                        {t("cancel")}
                      </Button>
                      {!isOrderUnlocked(selectedOrder.status) && (
                        <Button
                          className="gap-2 font-semibold"
                          onClick={() => void approveOrderMut.mutate(selectedOrder.id)}
                          disabled={approveOrderMut.isPending}
                        >
                          <Check className="h-4 w-4" />
                          {t("approve_order")}
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {tab === "products" && (
              <div className="mx-auto max-w-6xl space-y-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] tracking-[0.24em] text-primary uppercase">
                      {t("admin_panel")}
                    </p>
                    <h1 className="mt-2 font-display text-3xl font-bold tracking-wide">
                      {t("admin_products")}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("admin_products_sub")} · {filteredProductCount} {t("products_total")}
                    </p>
                  </div>
                  <Button
                    className="gap-2 self-start font-semibold sm:self-auto"
                    onClick={openAddProduct}
                  >
                    <Plus className="h-4 w-4" />
                    {t("add_product")}
                  </Button>
                </header>

                <div className="flex flex-col gap-3 border border-white/10 bg-[#12100e] p-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t("search_products")}
                      className="border-white/10 bg-[#0e0c0a] ps-9"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setFilterCategory("all")}
                      className={cn(
                        "shrink-0 px-3 py-2 text-xs tracking-wide transition",
                        filterCategory === "all"
                          ? "bg-primary text-primary-foreground"
                          : "border border-white/12 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {t("all")}
                    </button>
                    {(categories ?? []).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFilterCategory(c.slug)}
                        className={cn(
                          "shrink-0 px-3 py-2 text-xs tracking-wide transition",
                          filterCategory === c.slug
                            ? "bg-primary text-primary-foreground"
                            : "border border-white/12 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {lang === "ar" ? c.name_ar : c.name_en}
                      </button>
                    ))}
                  </div>
                </div>

                {groupedProducts.length === 0 ? (
                  <div className="border border-dashed border-white/15 bg-[#12100e] px-6 py-20 text-center">
                    <Package className="mx-auto h-8 w-8 text-primary/50" />
                    <p className="mt-4 text-sm text-muted-foreground">{t("no_products")}</p>
                    <Button className="mt-5 gap-2" onClick={openAddProduct}>
                      <Plus className="h-4 w-4" />
                      {t("add_product")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {groupedProducts.map((group) => (
                      <section key={group.slug} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-lg font-semibold tracking-wide text-primary">
                            {group.label}
                          </h2>
                          <span className="text-xs text-muted-foreground">
                            {group.items.length} {t("products_in_category")}
                          </span>
                          <div className="h-px flex-1 bg-white/8" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {group.items.map((product) => {
                            const title = lang === "ar" ? product.title_ar : product.title_en;
                            const cover = product.image_url ?? product.images?.[0] ?? null;
                            return (
                              <article
                                key={product.id}
                                className="group flex flex-col overflow-hidden border border-white/10 bg-[#12100e] transition hover:border-primary/35"
                              >
                                <div className="relative aspect-[16/10] overflow-hidden bg-[#0e0c0a]">
                                  <ProductImage
                                    title={title}
                                    imageUrl={cover}
                                    category={product.category}
                                    className="h-full transition duration-500 group-hover:scale-[1.03]"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-transparent to-transparent" />
                                  <div className="absolute start-2 top-2 flex flex-wrap gap-1.5">
                                    {product.is_featured && (
                                      <span className="inline-flex items-center gap-1 bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                        <Star className="h-3 w-3" />
                                        {t("featured")}
                                      </span>
                                    )}
                                    {!product.is_active && (
                                      <span className="bg-black/70 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                                        {t("inactive")}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-1 flex-col gap-3 p-4">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-display text-base font-semibold tracking-wide">
                                      {title}
                                    </h3>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {product.slug} · {categoryName(product.category)}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-3">
                                    <p className="font-display text-lg font-semibold text-gold-gradient">
                                      {money(product.price)}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 border border-transparent hover:border-white/15"
                                        onClick={() => openEdit(product)}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 border border-transparent hover:border-destructive/30"
                                        onClick={() => void deleteProduct.mutate(product.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "categories" && (
              <div className="mx-auto max-w-6xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[0.24em] text-primary uppercase">
                      {t("admin_panel")}
                    </p>
                    <h1 className="mt-2 font-display text-3xl font-bold tracking-wide">
                      {t("admin_categories")}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("admin_categories_sub")}
                    </p>
                  </div>
                  <Button className="gap-2 font-semibold" onClick={openAddCategory}>
                    <Plus className="h-4 w-4" />
                    {t("add_category")}
                  </Button>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(categories ?? []).map((cat) => {
                    const count = (products ?? []).filter((p) => p.category === cat.slug).length;
                    const subs = cat.subcategories ?? [];
                    return (
                      <div
                        key={cat.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#12100e] p-4 transition hover:border-primary/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-display text-base font-semibold tracking-wide">
                            {lang === "ar" ? cat.name_ar : cat.name_en}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {cat.slug} · {count} {t("products_in_category")}
                          </p>
                          {subs.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {subs.map((s) => (
                                <span
                                  key={s.slug}
                                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] tracking-wide text-white/70"
                                >
                                  {lang === "ar" ? s.name_ar : s.name_en}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEditCategory(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => void deleteCategoryMut.mutate(cat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "interest" && (
              <div className="mx-auto max-w-6xl space-y-6">
                <header>
                  <p className="text-[11px] tracking-[0.24em] text-primary uppercase">
                    {t("admin_panel")}
                  </p>
                  <h1 className="mt-2 font-display text-3xl font-bold tracking-wide">
                    {t("admin_interest")}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{t("admin_interest_sub")}</p>
                </header>
                <div className="flex flex-wrap gap-3">
                  <div className="border border-white/10 bg-[#12100e] px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{t("interest_views")}: </span>
                    <span className="font-semibold text-primary">{viewCount}</span>
                  </div>
                  <div className="border border-white/10 bg-[#12100e] px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{t("interest_carts")}: </span>
                    <span className="font-semibold text-primary">{cartCount}</span>
                  </div>
                </div>
                <div className="overflow-hidden border border-white/10 bg-[#12100e]">
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
        <DialogContent className="flex max-h-[92vh] w-[min(96vw,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[52rem]">
          <DialogHeader className="shrink-0 border-b border-white/8 px-6 py-6 pe-14 text-start">
            <p className="text-[10px] tracking-[0.28em] text-primary uppercase">
              {t("admin_products")}
            </p>
            <DialogTitle className="mt-1">{editing ? t("edit") : t("add_product")}</DialogTitle>
            <DialogDescription>
              {editing ? editing.slug : t("admin_products_sub")}
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
                  className="h-10 border-white/12 bg-white/[0.03]"
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
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    const next = (categories ?? []).find((c) => c.slug === v);
                    const firstSub = next?.subcategories[0]?.slug ?? "";
                    setForm({ ...form, category: v, subcategory: firstSub });
                  }}
                >
                  <SelectTrigger className="h-10 border-white/12 bg-white/[0.03]">
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
              {((categories ?? []).find((c) => c.slug === form.category)?.subcategories.length ??
                0) > 0 && (
                <div className="space-y-2">
                  <Label>{t("subcategory")}</Label>
                  <Select
                    value={form.subcategory || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, subcategory: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="h-10 border-white/12 bg-white/[0.03]">
                      <SelectValue placeholder={t("subcategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("all_in_section")}</SelectItem>
                      {(categories ?? [])
                        .find((c) => c.slug === form.category)
                        ?.subcategories.map((s) => (
                          <SelectItem key={s.slug} value={s.slug}>
                            {lang === "ar" ? s.name_ar : s.name_en}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Title AR</Label>
                <Input
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  className="h-10 border-white/12 bg-white/[0.03]"
                />
              </div>
              <div className="space-y-2">
                <Label>Title EN</Label>
                <Input
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  className="h-10 border-white/12 bg-white/[0.03]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("price")}</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="h-10 border-white/12 bg-white/[0.03]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                  className={cn(
                    "border px-3 py-3 text-start text-sm transition",
                    form.is_featured
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-white/12 bg-white/[0.02] text-muted-foreground hover:border-white/20",
                  )}
                >
                  <span className="block text-[10px] tracking-[0.18em] uppercase">
                    {t("featured")}
                  </span>
                  <span className="mt-1 block font-medium">{form.is_featured ? "On" : "Off"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={cn(
                    "border px-3 py-3 text-start text-sm transition",
                    form.is_active
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                      : "border-white/12 bg-white/[0.02] text-muted-foreground hover:border-white/20",
                  )}
                >
                  <span className="block text-[10px] tracking-[0.18em] uppercase">
                    {t("active")}
                  </span>
                  <span className="mt-1 block font-medium">
                    {form.is_active ? t("active") : t("inactive")}
                  </span>
                </button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("features_hint")} (AR)</Label>
                <Textarea
                  value={form.features_ar}
                  onChange={(e) => setForm({ ...form, features_ar: e.target.value })}
                  rows={4}
                  className="min-h-[6.5rem] border-white/12 bg-white/[0.03]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("features_hint")} (EN)</Label>
                <Textarea
                  value={form.features_en}
                  onChange={(e) => setForm({ ...form, features_en: e.target.value })}
                  rows={4}
                  className="min-h-[6.5rem] border-white/12 bg-white/[0.03]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("install_hint")} (AR)</Label>
                <Textarea
                  value={form.install_ar}
                  onChange={(e) => setForm({ ...form, install_ar: e.target.value })}
                  rows={4}
                  className="min-h-[6.5rem] border-white/12 bg-white/[0.03]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("install_hint")} (EN)</Label>
                <Textarea
                  value={form.install_en}
                  onChange={(e) => setForm({ ...form, install_en: e.target.value })}
                  rows={4}
                  className="min-h-[6.5rem] border-white/12 bg-white/[0.03]"
                />
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-white/8 px-6 py-4 sm:justify-between">
            <Button
              variant="outline"
              className="border-white/15"
              onClick={() => setDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              className="min-w-28 font-semibold"
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
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-white/8 px-6 py-6 pe-14 text-start">
            <p className="text-[10px] tracking-[0.28em] text-primary uppercase">
              {t("admin_categories")}
            </p>
            <DialogTitle className="mt-1">
              {editingCategory ? t("edit") : t("add_category")}
            </DialogTitle>
            <DialogDescription>{t("admin_categories_sub")}</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 gap-4 overflow-y-auto px-6 py-5">
            <div className="space-y-1.5">
              <Label>{t("category_name_ar")}</Label>
              <Input
                value={categoryForm.name_ar}
                onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                placeholder="أسلحة"
                className="border-white/12 bg-white/[0.03]"
              />
            </div>
            <div className="space-y-1.5">
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
                className="border-white/12 bg-white/[0.03]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("category_slug")}</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="weapons"
                className="border-white/12 bg-white/[0.03]"
              />
              <p className="text-[11px] text-muted-foreground">{t("category_slug_hint")}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{t("subcategories")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("subcategory_hint")}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-white/15"
                  onClick={() =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      subcategories: [
                        ...prev.subcategories,
                        { slug: "", name_ar: "", name_en: "" },
                      ],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("add_subcategory")}
                </Button>
              </div>

              {categoryForm.subcategories.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("subcategory_hint")}</p>
              )}

              <div className="space-y-2">
                {categoryForm.subcategories.map((sub, index) => (
                  <div
                    key={`${index}-${sub.slug || "new"}`}
                    className="grid gap-2 rounded-xl border border-white/8 bg-black/20 p-2.5 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <Input
                      value={sub.name_ar}
                      placeholder={t("subcategory_name_ar")}
                      className="h-9 border-white/12 bg-white/[0.03]"
                      onChange={(e) => {
                        const name_ar = e.target.value;
                        setCategoryForm((prev) => {
                          const next = [...prev.subcategories];
                          const current = next[index];
                          if (!current) return prev;
                          next[index] = {
                            ...current,
                            name_ar,
                            slug:
                              current.slug ||
                              name_ar
                                .toLowerCase()
                                .replace(/[^\w\u0600-\u06FF\s-]/g, "")
                                .trim()
                                .replace(/\s+/g, "-"),
                          };
                          return { ...prev, subcategories: next };
                        });
                      }}
                    />
                    <Input
                      value={sub.name_en}
                      placeholder={t("subcategory_name_en")}
                      className="h-9 border-white/12 bg-white/[0.03]"
                      onChange={(e) => {
                        const name_en = e.target.value;
                        setCategoryForm((prev) => {
                          const next = [...prev.subcategories];
                          const current = next[index];
                          if (!current) return prev;
                          next[index] = {
                            ...current,
                            name_en,
                            slug:
                              current.slug ||
                              name_en
                                .toLowerCase()
                                .replace(/[^\w\s-]/g, "")
                                .trim()
                                .replace(/\s+/g, "-"),
                          };
                          return { ...prev, subcategories: next };
                        });
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 justify-self-end"
                      onClick={() =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          subcategories: prev.subcategories.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 px-6 py-4 sm:justify-between">
            <Button
              variant="outline"
              className="border-white/15"
              onClick={() => setCategoryDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              className="min-w-28 font-semibold"
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
