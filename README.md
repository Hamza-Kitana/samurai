# KATARO

متجر Frontend كامل لمحتوى **FiveM** — بدون Backend / بدون Supabase.

كل البيانات محفوظة محلياً في المتصفح (localStorage).

## المميزات

- صفحة رئيسية بأنيميشن سينمائي
- متجر مع فلترة حسب الفئة
- صفحة تفاصيل لكل منتج
- سلة مشتريات + طلب يدوي (تفعيل من الأدمن)
- تحميل الملفات بعد الموافقة من البروفايل
- دعم عربي/إنجليزي مع RTL
- لوحة تحكم للأدمن

## التشغيل

```sh
npm install
npm run dev
```

## حساب الأدمن

| الحقل | القيمة |
|-------|--------|
| Username | `admin` |
| Password | `222` |

## تسجيل الدخول عبر Google

1. ادخل [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع → **APIs & Services** → **Credentials**
3. أنشئ **OAuth client ID** من نوع **Web application**
4. أضف Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5173`
   - (وأضف دومين موقعك عند النشر)
5. انسخ الـ Client ID إلى `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

6. أعد تشغيل `npm run dev`

سيظهر زر **Continue with Google** في صفحة `/login`.

## الصفحات

| المسار | الوصف |
|--------|-------|
| `/` | الصفحة الرئيسية |
| `/store` | المتجر |
| `/product/:slug` | تفاصيل المنتج |
| `/cart` | السلة والدفع |
| `/login` | تسجيل الدخول |
| `/profile` | الطلبات والتحميلات |
| `/admin` | لوحة التحكم |
