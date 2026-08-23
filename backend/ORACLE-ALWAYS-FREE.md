# Oracle Cloud Always Free — نشر API مجاناً للأبد

هذا الدليل خطوة بخطوة لمبتدئ. الهدف: تشغيل باك إند Samurai على سيرفر Oracle مجاني، وربطه بـ Vercel.

---

## قبل ما تبدأ

تحتاج:
- إيميل
- رقم جوال (للتأكيد)
- بطاقة بنكية للتحقق فقط (Oracle غالباً ما يخصم إذا اخترت Always Free) — إذا ما قبلت البطاقة، جرّب حساب جديد أو دولة أخرى لاحقاً
- حساب GitHub (المشروع أصلاً عليه)

الوقت المتوقع: 30–60 دقيقة أول مرة.

---

## الخطوة 1 — اعمل حساب Oracle Cloud

1. افتح: https://www.oracle.com/cloud/free/
2. اضغط **Start for free**
3. عبّي البيانات وأكّد الإيميل والجوال
4. اختار **Home Region** قريبة منك (مثلاً `me-jeddah-1` أو `eu-frankfurt-1`)
5. خلّص التسجيل وادخل على **Oracle Cloud Console**

> إذا الحساب ما اكتمل (قيد المراجعة)، انتظر أو جرّب لاحقاً. ما تكمل الخطوات قبل ما تدخل الداشبورد.

---

## الخطوة 2 — اعمل Virtual Cloud Network (شبكة)

غالباً Oracle بيعمل VCN تلقائياً مع الحساب. إذا ما عندك:

1. من القائمة ≡ → **Networking** → **Virtual cloud networks**
2. **Start VCN Wizard** → **Create VCN with Internet Connectivity**
3. Name: `samurai-vcn` → Create

---

## الخطوة 3 — افتح المنافذ (Firewall / Security List)

لازم تفتح البورتات عشان الموقع يوصل للـ API:

1. ≡ → **Networking** → **Virtual cloud networks** → شبكتك
2. ادخل **Public Subnet** → **Security List**
3. **Add Ingress Rules**:

| Source CIDR | Protocol | Destination Port | معنى |
|-------------|----------|------------------|------|
| `0.0.0.0/0` | TCP | `22` | SSH (دخول السيرفر) |
| `0.0.0.0/0` | TCP | `8080` | الـ API |

احفظ القواعد.

> لاحقاً تقدر تضيف 80 و 443 إذا ركّبت Nginx + HTTPS.

---

## الخطوة 4 — اعمل Compute Instance (السيرفر المجاني)

1. ≡ → **Compute** → **Instances** → **Create Instance**
2. Name: `samurai-api`
3. **Image**: Ubuntu 22.04
4. **Shape**: Always Free
   - الأفضل: **VM.Standard.A1.Flex** (Ampere ARM) — 1 OCPU + 6 GB RAM (مجاني ضمن الحصة)
   - أو: **VM.Standard.E2.1.Micro** (AMD) — أضعف بس مجاني أيضاً
5. **Networking**: Public subnet + عيّن Public IP
6. **SSH keys**:
   - Generate a key pair → **Save Private Key** على جهازك (ملف `.key`)
   - ما تضيع الملف — بدونه ما تدخل السيرفر
7. **Create**

انتظر لحد ما الحالة تصير **Running**. انسخ **Public IP**.

---

## الخطوة 5 — ادخل السيرفر بـ SSH (من ويندوز)

1. ضع ملف المفتاح الخاص مثلاً في:
   `C:\Users\hamza\Downloads\samurai-api.key`
2. افتح PowerShell:

```powershell
# صلّح صلاحيات المفتاح (مرة واحدة)
icacls $env:USERPROFILE\Downloads\samurai-api.key /inheritance:r
icacls $env:USERPROFILE\Downloads\samurai-api.key /grant:r "$($env:USERNAME):(R)"

ssh -i $env:USERPROFILE\Downloads\samurai-api.key ubuntu@YOUR_PUBLIC_IP
```

بدّل `YOUR_PUBLIC_IP` بالـ IP من Oracle.

أول مرة اكتب `yes` إذا سأل عن البصمة.

---

## الخطوة 6 — ثبّت الـ API على السيرفر

بعد ما تدخل بـ SSH، الصق الأوامر التالية **واحد واحد**:

```bash
sudo apt-get update -y
sudo apt-get install -y git curl
```

حمّل سكربت التثبيت من المشروع:

```bash
curl -fsSL https://raw.githubusercontent.com/Hamza-Kitana/samurai/main/backend/scripts/oracle-setup.sh -o oracle-setup.sh
bash oracle-setup.sh
```

السكربت رح:
- يثبّت Docker
- يسحب المشروع من GitHub
- يبني ويشغّل الـ API على البورت **8080**
- يطبع لك رابط الصحة ورابط Vercel

اختبر من المتصفح على جهازك:

```
http://YOUR_PUBLIC_IP:8080/api/health
```

لازم تشوف: `{"status":"ok"}`

تسجيل الأدمن: `admin` / `222`

---

## الخطوة 7 — اربط Vercel بالـ API

1. افتح Vercel → مشروع `samurai` → **Settings** → **Environment Variables**
2. أضف / عدّل:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `http://YOUR_PUBLIC_IP:8080` |

بدون `/` في الآخر.

3. **Deployments** → آخر نشر → **Redeploy**
4. افتح `https://samurai-rho.vercel.app` وجرب تسجيل الدخول

---

## أوامر مفيدة على السيرفر

```bash
# حالة الحاوية
sudo docker ps

# لوجات
sudo docker logs -f samurai-api

# إعادة تشغيل
sudo docker restart samurai-api

# تحديث من GitHub وإعادة البناء
cd /opt/samurai-api/repo && git pull
cd backend
sudo docker build -t samurai-api .
sudo docker rm -f samurai-api
# ثم شغّل نفس docker run من السكربت، أو أعد تشغيل oracle-setup.sh
```

---

## مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| SSH ما يدخل | تأكد Port 22 مفتوح + المفتاح الصحيح + المستخدم `ubuntu` |
| `/api/health` ما يفتح | تأكد Port 8080 مفتوح في Security List + `docker ps` يبيّن الحاوية |
| Vercel لسا Failed to fetch | `VITE_API_URL` غلط أو ما عملت Redeploy |
| Oracle رفض الحساب | انتظر / جرّب لاحقاً / بطاقة ثانية — مو دايماً فوري |
| Shape A1 مش متوفر | جرّب Region ثانية أو E2.1.Micro |

---

## هل هذا مجاني للأبد؟

ضمن حدود Always Free (Ampere أو Micro):
- السيرفر **ما ينام** زي Render Free
- **ما في cold start طويل**
- لازم تبقي الحساب Active وما تتجاوز الحصة المجانية

بعد النجاح:
1. احفظ الـ IP والمفتاح الخاص
2. لاحقاً تقدر تضيف دومين + HTTPS (Nginx + Let's Encrypt)

---

## ملخص سريع

1. حساب Oracle Always Free  
2. Instance Ubuntu + Public IP  
3. افتح 22 و 8080  
4. SSH → شغّل `oracle-setup.sh`  
5. `VITE_API_URL=http://IP:8080` على Vercel → Redeploy  

إذا علقت بأي خطوة، ابعت سكرين من وين وصلت وأكمّل معك من هناك.
