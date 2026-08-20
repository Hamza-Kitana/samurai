import { deleteProductBlob } from "@/lib/product-files-db";

export type LocalUser = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "user";
  provider?: "local" | "google";
  googleId?: string;
  avatar?: string;
};

export type OrderItem = {
  id: string;
  product_id: string;
  title: string;
  title_en?: string;
  price: number;
  products?: {
    id: string;
    slug: string;
    title_ar: string;
    title_en: string;
    category: string;
    image_url: string | null;
  } | null;
};

export type Order = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

export type ProductFile = {
  id: string;
  product_id: string;
  file_name: string;
  file_url: string;
  products?: {
    slug: string;
    title_ar: string;
    title_en: string;
    category: string;
    image_url: string | null;
  } | null;
};

export type Interest = {
  id: string;
  product_id: string;
  user_id: string | null;
  kind: "view" | "cart";
  created_at: string;
  products?: { title_ar: string; title_en: string; slug: string } | null;
};

const KEYS = {
  users: "samurai-users",
  session: "samurai-session",
  products: "samurai-products",
  orders: "samurai-orders",
  files: "samurai-files",
  interest: "samurai-interest",
  categories: "samurai-categories",
  version: "samurai-data-version",
} as const;

const DATA_VERSION = "6";

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
};

export type Product = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  short_ar: string | null;
  short_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  category: string;
  price: number;
  image_url: string | null;
  images: string[];
  features_ar: string[];
  features_en: string[];
  install_ar: string[];
  install_en: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

function uid() {
  return crypto.randomUUID();
}

const memoryStore = new Map<string, string>();

function isQuotaError(err: unknown) {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function freeLocalStorageSpace() {
  // Drop analytics + cart only — never wipe orders, users, or catalog files
  const disposable = [KEYS.interest, "samurai-cart"];
  for (const key of disposable) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function userOrdersKey(userId: string) {
  return `samurai-user-orders-${userId}`;
}

function mergeOrders(lists: Order[][]): Order[] {
  const byId = new Map<string, Order>();
  for (const list of lists) {
    for (const order of list) byId.set(order.id, order);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function appendOrder(order: Order) {
  const global = read<Order[]>(KEYS.orders, []);
  global.unshift(order);
  write(KEYS.orders, global);

  const userKey = userOrdersKey(order.user_id);
  const userOrders = read<Order[]>(userKey, []);
  userOrders.unshift(order);
  write(userKey, userOrders);
}

function migrateOrdersToUserKeys() {
  const global = read<Order[]>(KEYS.orders, []);
  if (!global.length) return;
  for (const order of global) {
    const userKey = userOrdersKey(order.user_id);
    const existing = read<Order[]>(userKey, []);
    if (existing.some((o) => o.id === order.id)) continue;
    existing.unshift(order);
    write(userKey, existing);
  }
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key) ?? memoryStore.get(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  memoryStore.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch (err) {
    if (!isQuotaError(err)) {
      console.warn("localStorage write failed", key, err);
      return;
    }
    freeLocalStorageSpace();
    try {
      localStorage.setItem(key, raw);
    } catch (retryErr) {
      // Keep working from memory so the app never crashes
      console.warn("localStorage quota exceeded; using memory for", key, retryErr);
    }
  }
}

function hasKey(key: string) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) != null || memoryStore.has(key);
}

function galleryFromUrl(url: string | null | undefined): string[] {
  if (!url) return [];
  const jpg = url.replace(/\.png$/i, ".jpg");
  return jpg !== url ? [url, jpg] : [url];
}

const SEED_PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "yakuza-casino",
    title_ar: "كازينو الياكوزا",
    title_en: "Yakuza Casino",
    short_ar: "ماب كازينو فاخر بتفاصيل داخلية كاملة",
    short_en: "Luxury casino MLO with full interior",
    description_ar:
      "ماب MLO احترافي بتصميم داخلي كامل، إضاءة واقعية، وأداء عالي مناسب لسيرفرات الرول بلاي الكبيرة.",
    description_en:
      "A professional MLO with a fully detailed interior, realistic lighting and high performance for large roleplay servers.",
    category: "maps",
    price: 49,
    image_url: "/images/p-casino.png",
    features_ar: ["تصميم داخلي كامل", "إضاءة RTX واقعية", "محسّن للأداء (FPS)", "تركيب سهل بدقيقتين"],
    features_en: ["Full custom interior", "Realistic lighting", "FPS optimized", "2-minute install"],
    install_ar: [
      "حمّل ملف الماب بعد الشراء من حسابك",
      "ضع المجلد داخل resources في سيرفرك",
      "أضف ensure اسم-المورد في server.cfg",
      "أعد تشغيل السيرفر وتأكد أن الماب يظهر بدون أخطاء",
    ],
    install_en: [
      "Download the map file from your account after purchase",
      "Place the folder inside your server resources",
      "Add ensure resource-name to server.cfg",
      "Restart the server and confirm the map loads cleanly",
    ],
    is_featured: true,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p2",
    slug: "samurai-dojo",
    title_ar: "دوجو الساموراي",
    title_en: "Samurai Dojo",
    short_ar: "ماب دوجو ياباني بأجواء ليلية",
    short_en: "Japanese dojo map with night ambience",
    description_ar: "ماب دوجو ياباني مع ساحة تدريب، أشجار ساكورا متحركة، ومؤثرات صوتية محيطة.",
    description_en: "Japanese dojo with a training yard, animated sakura trees and ambient audio.",
    category: "maps",
    price: 39,
    image_url: "/images/p-dojo.png",
    features_ar: ["أشجار ساكورا متحركة", "مؤثرات صوتية محيطة", "مناسب لعصابات الرول بلاي"],
    features_en: ["Animated sakura", "Ambient sounds", "Great for gang RP"],
    install_ar: [
      "حمّل ملف الماب بعد الشراء من حسابك",
      "ضع المجلد داخل resources في سيرفرك",
      "أضف ensure اسم-المورد في server.cfg",
      "أعد تشغيل السيرفر وتأكد أن الماب يظهر بدون أخطاء",
    ],
    install_en: [
      "Download the map file from your account after purchase",
      "Place the folder inside your server resources",
      "Add ensure resource-name to server.cfg",
      "Restart the server and confirm the map loads cleanly",
    ],
    is_featured: true,
    is_active: true,
    created_at: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "p3",
    slug: "neon-drift-garage",
    title_ar: "كراج نيون درفت",
    title_en: "Neon Drift Garage",
    short_ar: "كراج تعديل سيارات مع نيون",
    short_en: "Tuning garage with neon lighting",
    description_ar: "كراج تعديل بمساحات واسعة، رافعات متحركة، ونظام إضاءة نيون قابل للتخصيص.",
    description_en: "A spacious tuning garage with animated lifts and customizable neon lighting.",
    category: "maps",
    price: 34,
    image_url: "/images/p-garage.png",
    features_ar: ["رافعات متحركة", "نيون قابل للتخصيص", "يدعم أنظمة التعديل الشهيرة"],
    features_en: ["Animated lifts", "Custom neon", "Works with popular tuner scripts"],
    install_ar: [
      "حمّل ملف الماب بعد الشراء من حسابك",
      "ضع المجلد داخل resources في سيرفرك",
      "أضف ensure اسم-المورد في server.cfg",
      "أعد تشغيل السيرفر وتأكد أن الماب يظهر بدون أخطاء",
    ],
    install_en: [
      "Download the map file from your account after purchase",
      "Place the folder inside your server resources",
      "Add ensure resource-name to server.cfg",
      "Restart the server and confirm the map loads cleanly",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "p4",
    slug: "advanced-heist",
    title_ar: "سكربت السرقات المتقدم",
    title_en: "Advanced Heist Script",
    short_ar: "نظام سرقات كامل مع مهام ومكافآت",
    short_en: "Complete heist system with missions",
    description_ar:
      "سكربت سرقات متكامل يدعم ESX و QBCore مع مهام متعددة المراحل، شرطة ديناميكية، ونظام مكافآت.",
    description_en:
      "Full heist script supporting ESX and QBCore with multi-stage missions, dynamic police alerts and rewards.",
    category: "scripts",
    price: 59,
    image_url: "/images/p-heist.png",
    features_ar: ["يدعم ESX و QBCore", "مهام متعددة المراحل", "إعدادات كاملة في config", "تحديثات مجانية"],
    features_en: ["ESX & QBCore", "Multi-stage missions", "Full config", "Free updates"],
    install_ar: [
      "حمّل السكربت من صفحة التحميلات في حسابك",
      "ضع المجلد داخل resources",
      "عدّل ملف config.lua حسب فريموورك سيرفرك (ESX / QBCore)",
      "أضف ensure اسم-السكربت في server.cfg ثم أعد التشغيل",
    ],
    install_en: [
      "Download the script from your account downloads",
      "Place the folder inside resources",
      "Edit config.lua for your framework (ESX / QBCore)",
      "Add ensure script-name to server.cfg and restart",
    ],
    is_featured: true,
    is_active: true,
    created_at: "2026-01-04T00:00:00.000Z",
  },
  {
    id: "p5",
    slug: "hud-samurai",
    title_ar: "واجهة HUD ساموراي",
    title_en: "Samurai HUD",
    short_ar: "واجهة لاعب أنيقة وسريعة",
    short_en: "Sleek and fast player HUD",
    description_ar:
      "واجهة HUD خفيفة بتصميم ياباني حديث، تعرض الصحة والدرع والجوع والعطش مع أنيميشن ناعم.",
    description_en:
      "A lightweight HUD with a modern Japanese design showing health, armor, hunger and thirst with smooth animations.",
    category: "scripts",
    price: 19,
    image_url: "/images/p-hud.png",
    features_ar: ["استهلاك موارد منخفض", "قابل للتخصيص بالكامل", "أنيميشن ناعم"],
    features_en: ["Low resource usage", "Fully customizable", "Smooth animations"],
    install_ar: [
      "حمّل السكربت من صفحة التحميلات في حسابك",
      "ضع المجلد داخل resources",
      "عدّل ملف config.lua حسب فريموورك سيرفرك (ESX / QBCore)",
      "أضف ensure اسم-السكربت في server.cfg ثم أعد التشغيل",
    ],
    install_en: [
      "Download the script from your account downloads",
      "Place the folder inside resources",
      "Edit config.lua for your framework (ESX / QBCore)",
      "Add ensure script-name to server.cfg and restart",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "p6",
    slug: "anticheat-shield",
    title_ar: "درع مكافحة الغش",
    title_en: "AntiCheat Shield",
    short_ar: "حماية قوية ضد المخترقين",
    short_en: "Strong protection against cheaters",
    description_ar:
      "نظام حماية متقدم يكشف الأدوات المعروفة، يسجل المحاولات، ويرسل تنبيهات لديسكورد فوراً.",
    description_en:
      "Advanced protection that detects known tools, logs attempts and sends instant Discord alerts.",
    category: "scripts",
    price: 45,
    image_url: "/images/p-anticheat.png",
    features_ar: ["كشف فوري", "سجلات ديسكورد", "تحديث مستمر"],
    features_en: ["Instant detection", "Discord logs", "Constant updates"],
    install_ar: [
      "حمّل السكربت من صفحة التحميلات في حسابك",
      "ضع المجلد داخل resources",
      "عدّل ملف config.lua حسب فريموورك سيرفرك (ESX / QBCore)",
      "أضف ensure اسم-السكربت في server.cfg ثم أعد التشغيل",
    ],
    install_en: [
      "Download the script from your account downloads",
      "Place the folder inside resources",
      "Edit config.lua for your framework (ESX / QBCore)",
      "Add ensure script-name to server.cfg and restart",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-06T00:00:00.000Z",
  },
  {
    id: "p7",
    slug: "samurai-outfit-pack",
    title_ar: "باقة ملابس ساموراي",
    title_en: "Samurai Outfit Pack",
    short_ar: "60 قطعة ملابس حصرية",
    short_en: "60 exclusive clothing pieces",
    description_ar: "باقة ملابس EUP حصرية للرجال والنساء بتصميم ياباني عصري مع دقة تفاصيل عالية.",
    description_en:
      "Exclusive EUP clothing pack for male and female peds with a modern Japanese design.",
    category: "clothing",
    price: 29,
    image_url: "/images/p-outfit.png",
    features_ar: ["60 قطعة", "للرجال والنساء", "جودة 4K"],
    features_en: ["60 pieces", "Male & female", "4K quality"],
    install_ar: [
      "حمّل باقة الملابس من حسابك",
      "ضعها داخل مجلد stream أو مورد EUP حسب تعليمات الملف",
      "تأكد من تفعيل مورد الملابس في server.cfg",
      "أعد تشغيل السيرفر وجرّب القطع من قائمة الملابس",
    ],
    install_en: [
      "Download the clothing pack from your account",
      "Place it in stream or your EUP resource as noted in the pack",
      "Ensure the clothing resource is enabled in server.cfg",
      "Restart and test the pieces in the clothing menu",
    ],
    is_featured: true,
    is_active: true,
    created_at: "2026-01-07T00:00:00.000Z",
  },
  {
    id: "p8",
    slug: "street-wear-pack",
    title_ar: "باقة ستريت وير",
    title_en: "Street Wear Pack",
    short_ar: "ملابس شوارع عصرية",
    short_en: "Modern streetwear collection",
    description_ar: "مجموعة ملابس شوارع عصرية تشمل هوديز وجاكيتات وأحذية بجودة عالية.",
    description_en: "A modern streetwear collection with hoodies, jackets and sneakers in high quality.",
    category: "clothing",
    price: 24,
    image_url: "/images/p-street.png",
    features_ar: ["هوديز وجاكيتات", "أحذية حصرية", "تركيب سهل"],
    features_en: ["Hoodies & jackets", "Exclusive sneakers", "Easy install"],
    install_ar: [
      "حمّل باقة الملابس من حسابك",
      "ضعها داخل مجلد stream أو مورد EUP حسب تعليمات الملف",
      "تأكد من تفعيل مورد الملابس في server.cfg",
      "أعد تشغيل السيرفر وجرّب القطع من قائمة الملابس",
    ],
    install_en: [
      "Download the clothing pack from your account",
      "Place it in stream or your EUP resource as noted in the pack",
      "Ensure the clothing resource is enabled in server.cfg",
      "Restart and test the pieces in the clothing menu",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-08T00:00:00.000Z",
  },
  {
    id: "p9",
    slug: "jdm-car-pack",
    title_ar: "باقة سيارات JDM",
    title_en: "JDM Car Pack",
    short_ar: "10 سيارات يابانية معدلة",
    short_en: "10 tuned Japanese cars",
    description_ar: "باقة سيارات يابانية بتفاصيل داخلية كاملة، أصوات محركات حقيقية، ودعم كامل للتعديل.",
    description_en: "Japanese car pack with full interiors, real engine sounds and complete tuning support.",
    category: "vehicles",
    price: 54,
    image_url: "/images/p-jdm.png",
    features_ar: ["10 سيارات", "أصوات محركات حقيقية", "دعم كامل للتعديل"],
    features_en: ["10 cars", "Real engine sounds", "Full tuning support"],
    install_ar: [
      "حمّل باقة السيارات بعد الشراء",
      "ضع كل سيارة في resources كمورد مستقل أو حسب هيكل الباقة",
      "أضف ensure لكل سيارة في server.cfg",
      "أعد تشغيل السيرفر واستدعِ السيارة من الكراج أو الأدمن",
    ],
    install_en: [
      "Download the vehicle pack after purchase",
      "Place each car in resources as its own resource or as packed",
      "Add ensure for each vehicle in server.cfg",
      "Restart and spawn via garage or admin menu",
    ],
    is_featured: true,
    is_active: true,
    created_at: "2026-01-09T00:00:00.000Z",
  },
  {
    id: "p10",
    slug: "police-fleet",
    title_ar: "أسطول الشرطة",
    title_en: "Police Fleet",
    short_ar: "سيارات شرطة كاملة مع إضاءة",
    short_en: "Full police fleet with liveries",
    description_ar: "أسطول سيارات شرطة مع إضاءة ELS، ستيكرات قابلة للتخصيص، وتفاصيل داخلية كاملة.",
    description_en: "Police fleet with ELS lighting, customizable liveries and full interiors.",
    category: "vehicles",
    price: 44,
    image_url: "/images/p-police.png",
    features_ar: ["إضاءة ELS", "ستيكرات قابلة للتخصيص", "تفاصيل داخلية"],
    features_en: ["ELS lighting", "Custom liveries", "Full interiors"],
    install_ar: [
      "حمّل باقة السيارات بعد الشراء",
      "ضع كل سيارة في resources كمورد مستقل أو حسب هيكل الباقة",
      "أضف ensure لكل سيارة في server.cfg",
      "أعد تشغيل السيرفر واستدعِ السيارة من الكراج أو الأدمن",
    ],
    install_en: [
      "Download the vehicle pack after purchase",
      "Place each car in resources as its own resource or as packed",
      "Add ensure for each vehicle in server.cfg",
      "Restart and spawn via garage or admin menu",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "p11",
    slug: "discord-bot-link",
    title_ar: "ربط ديسكورد",
    title_en: "Discord Link System",
    short_ar: "ربط اللاعبين بحساب ديسكورد",
    short_en: "Link players to Discord",
    description_ar: "نظام ربط اللاعبين بحساب الديسكورد مع أدوار تلقائية وصلاحيات حسب الرتبة.",
    description_en:
      "Link players to their Discord account with automatic roles and rank-based permissions.",
    category: "scripts",
    price: 22,
    image_url: "/images/p-discord.png",
    features_ar: ["أدوار تلقائية", "صلاحيات حسب الرتبة", "إعداد سريع"],
    features_en: ["Auto roles", "Rank permissions", "Quick setup"],
    install_ar: [
      "حمّل السكربت من صفحة التحميلات في حسابك",
      "ضع المجلد داخل resources",
      "عدّل ملف config.lua حسب فريموورك سيرفرك (ESX / QBCore)",
      "أضف ensure اسم-السكربت في server.cfg ثم أعد التشغيل",
    ],
    install_en: [
      "Download the script from your account downloads",
      "Place the folder inside resources",
      "Edit config.lua for your framework (ESX / QBCore)",
      "Add ensure script-name to server.cfg and restart",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-11T00:00:00.000Z",
  },
  {
    id: "p12",
    slug: "night-market",
    title_ar: "ماب السوق الليلي",
    title_en: "Night Market",
    short_ar: "سوق ليلي ياباني مليء بالتفاصيل",
    short_en: "Japanese night market full of detail",
    description_ar: "ماب سوق ليلي بأكشاك مضيئة، حشود متحركة، وأجواء مطر واقعية.",
    description_en: "A night market with glowing stalls, animated crowds and realistic rain ambience.",
    category: "maps",
    price: 37,
    image_url: "/images/p-market.png",
    features_ar: ["أكشاك مضيئة", "حشود متحركة", "أجواء مطر"],
    features_en: ["Glowing stalls", "Animated crowds", "Rain ambience"],
    install_ar: [
      "حمّل ملف الماب بعد الشراء من حسابك",
      "ضع المجلد داخل resources في سيرفرك",
      "أضف ensure اسم-المورد في server.cfg",
      "أعد تشغيل السيرفر وتأكد أن الماب يظهر بدون أخطاء",
    ],
    install_en: [
      "Download the map file from your account after purchase",
      "Place the folder inside your server resources",
      "Add ensure resource-name to server.cfg",
      "Restart the server and confirm the map loads cleanly",
    ],
    is_featured: false,
    is_active: true,
    created_at: "2026-01-12T00:00:00.000Z",
  },
].map((p) => ({ ...p, images: galleryFromUrl(p.image_url) }));

const SEED_ADMIN: LocalUser = {
  id: "admin-1",
  email: "admin",
  password: "222",
  displayName: "Admin",
  role: "admin",
};

const SEED_CATEGORIES: Category[] = [
  { id: "c-maps", slug: "maps", name_ar: "مابات", name_en: "Maps" },
  { id: "c-scripts", slug: "scripts", name_ar: "سكربتات", name_en: "Scripts" },
  { id: "c-clothing", slug: "clothing", name_ar: "ملابس", name_en: "Clothing" },
  { id: "c-vehicles", slug: "vehicles", name_ar: "سيارات", name_en: "Vehicles" },
];

export function ensureSeed() {
  if (typeof window === "undefined") return;

  try {
    const needsReseed = !hasKey(KEYS.version) || localStorage.getItem(KEYS.version) !== DATA_VERSION;
    if (needsReseed || !hasKey(KEYS.products)) {
      // Clear analytics only — keep user orders intact
      freeLocalStorageSpace();
      write(KEYS.products, SEED_PRODUCTS);
      write(
        KEYS.files,
        SEED_PRODUCTS.map((p) => ({
          id: `f-${p.id}`,
          product_id: p.id,
          file_name: `${p.slug}.zip`,
          file_url: `#download-${p.slug}`,
        })),
      );
      write(KEYS.categories, SEED_CATEGORIES);
      write(KEYS.version, DATA_VERSION);
    }

    if (!hasKey(KEYS.categories)) {
      write(KEYS.categories, SEED_CATEGORIES);
    }

    const users = read<LocalUser[]>(KEYS.users, []);
    if (!users.some((u) => u.email === "admin")) {
      write(KEYS.users, [...users, SEED_ADMIN]);
    }
    if (!hasKey(KEYS.orders)) write(KEYS.orders, []);
    migrateOrdersToUserKeys();
    if (!hasKey(KEYS.interest)) write(KEYS.interest, []);
  } catch (err) {
    console.warn("ensureSeed failed safely", err);
    // Guarantee in-memory catalog so UI still works
    if (!memoryStore.has(KEYS.products)) memoryStore.set(KEYS.products, JSON.stringify(SEED_PRODUCTS));
    if (!memoryStore.has(KEYS.categories)) {
      memoryStore.set(KEYS.categories, JSON.stringify(SEED_CATEGORIES));
    }
  }
}

export function getCategories(): Category[] {
  ensureSeed();
  return read<Category[]>(KEYS.categories, SEED_CATEGORIES);
}

export function getCategoryBySlug(slug: string): Category | null {
  return getCategories().find((c) => c.slug === slug) ?? null;
}

export function categoryLabel(slug: string, lang: "ar" | "en"): string {
  const cat = getCategoryBySlug(slug);
  if (!cat) return slug;
  return lang === "ar" ? cat.name_ar : cat.name_en;
}

export function saveCategory(category: Category) {
  ensureSeed();
  const cats = getCategories();
  const idx = cats.findIndex((c) => c.id === category.id);
  if (idx >= 0) {
    const existing = cats[idx];
    if (!existing) return;
    const oldSlug = existing.slug;
    cats[idx] = category;
    if (oldSlug !== category.slug) {
      const products = getProducts(true).map((p) =>
        p.category === oldSlug ? { ...p, category: category.slug } : p,
      );
      write(KEYS.products, products);
    }
  } else {
    if (cats.some((c) => c.slug === category.slug)) {
      throw new Error("Category slug already exists");
    }
    cats.push(category);
  }
  write(KEYS.categories, cats);
}

export function deleteCategory(id: string) {
  ensureSeed();
  const cats = getCategories();
  const target = cats.find((c) => c.id === id);
  if (!target) return;
  const inUse = getProducts(true).some((p) => p.category === target.slug);
  if (inUse) {
    throw new Error("Cannot delete category while products use it");
  }
  write(
    KEYS.categories,
    cats.filter((c) => c.id !== id),
  );
}

function normalizeProduct(raw: Product): Product {
  const seed = SEED_PRODUCTS.find((p) => p.id === raw.id || p.slug === raw.slug);
  const categorySample = SEED_PRODUCTS.find((p) => p.category === raw.category);
  const install_ar =
    raw.install_ar?.length > 0
      ? raw.install_ar
      : (seed?.install_ar ?? categorySample?.install_ar ?? []);
  const install_en =
    raw.install_en?.length > 0
      ? raw.install_en
      : (seed?.install_en ?? categorySample?.install_en ?? []);
  const images =
    raw.images?.length > 0
      ? raw.images
      : seed?.images?.length
        ? seed.images
        : galleryFromUrl(raw.image_url ?? seed?.image_url);
  const image_url = raw.image_url ?? images[0] ?? null;
  return { ...raw, images, image_url, install_ar, install_en };
}

export function getProducts(includeInactive = false): Product[] {
  ensureSeed();
  const products = read<Product[]>(KEYS.products, SEED_PRODUCTS).map(normalizeProduct);
  return includeInactive ? products : products.filter((p) => p.is_active);
}

export function getProductBySlug(slug: string): Product | null {
  return getProducts().find((p) => p.slug === slug) ?? null;
}

export function getFeaturedProducts(): Product[] {
  return getProducts().filter((p) => p.is_featured).slice(0, 4);
}

export function getProductFileMeta(productId: string): ProductFile | null {
  return read<ProductFile[]>(KEYS.files, []).find((f) => f.product_id === productId) ?? null;
}

export function upsertProductFileMeta(
  productId: string,
  fileName: string,
  fileUrl?: string,
): ProductFile {
  const files = read<ProductFile[]>(KEYS.files, []);
  const idx = files.findIndex((f) => f.product_id === productId);
  const next: ProductFile = {
    id: idx >= 0 ? files[idx]!.id : uid(),
    product_id: productId,
    file_name: fileName,
    file_url: fileUrl ?? (idx >= 0 ? files[idx]!.file_url : `idb:${productId}`),
  };
  if (idx >= 0) files[idx] = next;
  else files.push(next);
  write(KEYS.files, files);
  return next;
}

export function saveProduct(product: Product) {
  const products = getProducts(true);
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product;
  else products.unshift(product);
  write(KEYS.products, products);

  const files = read<ProductFile[]>(KEYS.files, []);
  if (!files.some((f) => f.product_id === product.id)) {
    files.push({
      id: uid(),
      product_id: product.id,
      file_name: `${product.slug}.zip`,
      file_url: `#download-${product.slug}`,
    });
    write(KEYS.files, files);
  } else {
    // Keep file entry in sync with slug when no custom upload name was set yet
    const existing = files.find((f) => f.product_id === product.id);
    if (existing && existing.file_url.startsWith("#download-")) {
      existing.file_name = `${product.slug}.zip`;
      existing.file_url = `#download-${product.slug}`;
      write(KEYS.files, files);
    }
  }
}

export function deleteProduct(id: string) {
  write(
    KEYS.products,
    getProducts(true).filter((p) => p.id !== id),
  );
  write(
    KEYS.files,
    read<ProductFile[]>(KEYS.files, []).filter((f) => f.product_id !== id),
  );
  void deleteProductBlob(id);
}

export function getSessionUserId(): string | null {
  return read<string | null>(KEYS.session, null);
}

export function getCurrentUser(): LocalUser | null {
  ensureSeed();
  const id = getSessionUserId();
  if (!id) return null;
  return read<LocalUser[]>(KEYS.users, []).find((u) => u.id === id) ?? null;
}

export function getAllUsers(): LocalUser[] {
  ensureSeed();
  return read<LocalUser[]>(KEYS.users, []);
}

export function getUserById(id: string): LocalUser | null {
  return getAllUsers().find((u) => u.id === id) ?? null;
}

export function signUp(email: string, password: string, displayName: string): LocalUser {
  ensureSeed();
  const users = read<LocalUser[]>(KEYS.users, []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Account already exists");
  }
  const user: LocalUser = {
    id: uid(),
    email,
    password,
    displayName: displayName.trim() || email.split("@")[0] || "user",
    role: "user",
  };
  users.push(user);
  write(KEYS.users, users);
  write(KEYS.session, user.id);
  return user;
}

export function signIn(email: string, password: string): LocalUser {
  ensureSeed();
  const users = read<LocalUser[]>(KEYS.users, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw new Error("Invalid credentials");
  write(KEYS.session, user.id);
  return user;
}

export function signInWithGoogle(profile: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}): LocalUser {
  ensureSeed();
  const users = read<LocalUser[]>(KEYS.users, []);
  const existing =
    users.find((u) => u.googleId === profile.googleId) ??
    users.find((u) => u.email.toLowerCase() === profile.email.toLowerCase());

  let user: LocalUser;

  if (existing) {
    user = {
      ...existing,
      googleId: profile.googleId,
      provider: "google",
      displayName: profile.name || existing.displayName,
      email: profile.email || existing.email,
    };
    if (profile.avatar) user.avatar = profile.avatar;
    else if (existing.avatar) user.avatar = existing.avatar;

    const idx = users.findIndex((u) => u.id === existing.id);
    if (idx >= 0) users[idx] = user;
  } else {
    user = {
      id: uid(),
      email: profile.email,
      password: "",
      displayName: profile.name || profile.email.split("@")[0] || "user",
      role: "user",
      provider: "google",
      googleId: profile.googleId,
    };
    if (profile.avatar) user.avatar = profile.avatar;
    users.push(user);
  }

  write(KEYS.users, users);
  write(KEYS.session, user.id);
  return user;
}

export function signOut() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.session);
  } catch {
    /* ignore */
  }
  memoryStore.delete(KEYS.session);
}

export function createOrder(
  userId: string,
  items: { id: string; title_ar: string; title_en: string; price: number }[],
): string {
  ensureSeed();
  const products = getProducts(true);
  const orderId = uid();
  const order: Order = {
    id: orderId,
    user_id: userId,
    total: items.reduce((s, i) => s + Number(i.price), 0),
    status: "paid",
    created_at: new Date().toISOString(),
    order_items: items.map((item) => {
      const product = products.find((p) => p.id === item.id);
      return {
        id: uid(),
        product_id: item.id,
        title: item.title_ar,
        title_en: item.title_en,
        price: item.price,
        products: product
          ? {
              id: product.id,
              slug: product.slug,
              title_ar: product.title_ar,
              title_en: product.title_en,
              category: product.category,
              image_url: product.image_url,
            }
          : null,
      };
    }),
  };
  appendOrder(order);
  return orderId;
}

export function getUserOrders(userId: string): Order[] {
  ensureSeed();
  return mergeOrders([
    read<Order[]>(KEYS.orders, []).filter((o) => o.user_id === userId),
    read<Order[]>(userOrdersKey(userId), []),
  ]);
}

export function getAllOrders(): Order[] {
  ensureSeed();
  const users = read<LocalUser[]>(KEYS.users, []);
  return mergeOrders([
    read<Order[]>(KEYS.orders, []),
    ...users.map((u) => read<Order[]>(userOrdersKey(u.id), [])),
  ]);
}

export function getUserDownloads(userId: string): ProductFile[] {
  ensureSeed();
  const orders = getUserOrders(userId).filter((o) => o.status === "paid");
  const productIds = new Set(
    orders.flatMap((o) => o.order_items.map((i) => i.product_id)),
  );
  const products = getProducts(true);
  return read<ProductFile[]>(KEYS.files, [])
    .filter((f) => productIds.has(f.product_id))
    .map((f) => {
      const product = products.find((p) => p.id === f.product_id);
      return {
        ...f,
        products: product
          ? {
              slug: product.slug,
              title_ar: product.title_ar,
              title_en: product.title_en,
              category: product.category,
              image_url: product.image_url ?? product.images?.[0] ?? null,
            }
          : null,
      };
    });
}

export function logInterest(productId: string, kind: "view" | "cart", userId?: string) {
  ensureSeed();
  const products = getProducts(true);
  const product = products.find((p) => p.id === productId);
  const interest = read<Interest[]>(KEYS.interest, []);
  interest.unshift({
    id: uid(),
    product_id: productId,
    user_id: userId ?? null,
    kind,
    created_at: new Date().toISOString(),
    products: product
      ? { title_ar: product.title_ar, title_en: product.title_en, slug: product.slug }
      : null,
  });
  write(KEYS.interest, interest.slice(0, 200));
}

export function getInterest(): Interest[] {
  ensureSeed();
  return read<Interest[]>(KEYS.interest, []);
}

export { uid };
