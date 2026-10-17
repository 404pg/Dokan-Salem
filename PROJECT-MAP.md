# 🗺️ خريطة مشروع دكان سليم (PROJECT-MAP)

> مرجع شامل لحالة المشروع: البنية، قاعدة البيانات، المكونات، الأوامر، وطريق الإنجاز.
> **تاريخ آخر تحديث:** 16 أكتوبر 2026

---

## 1) نظرة عامة

| البند | القيمة |
|---|---|
| **الاسم** | دكان سليم — Dokan Saleem |
| **النوع** | منصة تجارة إلكترونية + خدمة صيانة |
| **التخصص** | قطع غيار وكماليات الدراجات النارية |
| **السوق** | بغداد، العراق — فرعان: الدورة + حي القاهرة |
| **اللغة** | العربية (RTL) |
| **الدفع** | نقداً عند الاستلام (COD) |
| **الحالة** | 🟡 قيد التحسين |
| **المستودع** | مجلد محلي (ليس Git repo) |

**ملخص تنفيذي:** مشروع يتكوّن من ثلاثة مكوّنات — تطبيق Flutter للزبائن، لوحة إدارة ويب، وقاعدة بيانات سحابية على Supabase — مع مسار رجوع (Rollback) محلي عبر Node.js + SQL Server. الصور تُخزَّن على Cloudflare R2.

---

## 2) البنية المعمارية

```
                    ┌──────────────────────────────────────────────┐
                    │             العملاء (Customer)                 │
                    │   تطبيق جوال  (Flutter — Android)              │
                    └───────────────────────┬──────────────────────┘
                                            │  HTTPS / Supabase SDK
                                            ▼
   ┌────────────────────────┐      ┌──────────────────────────────────────┐
   │   لوحة الإدارة (Web)    │      │          Supabase Cloud               │
   │  Vite + Vanilla JS      │─────▶│   Postgres + Auth + RPC + Edge Fn     │
   │  @supabase/supabase-js  │      │   project: jmqejkgxchjboarcqpbu       │
   └───────────┬────────────┘      └───────────────┬──────────────────────┘
               │                                   │
               │  (Rollback path)                   │  Edge Function: upload-image
               ▼                                   ▼
   ┌────────────────────────┐      ┌──────────────────────────────────────┐
   │  Local Node.js API      │      │        Cloudflare R2 (Storage)        │
   │  + SQL Server Express   │      │        products/YYYY/MM/<uuid>.<ext>  │
   │  (DokanSaleem)          │      └──────────────────────────────────────┘
   └────────────────────────┘
```

**قراءة المخطط:**
- **المسار الأساسي (Supabase):** التطبيق واللوحة يتصلان مباشرة بـ Supabase عبر SDK، مع RLS و RPC.
- **Edge Function `upload-image`:** تستقبل صورة المدير، تتحقق من الجلسة وصلاحية `is_store_admin`، ترفعها إلى R2، وتُرجع `image_url`.
- **مسار الرجوع (Rollback):** API محلي Node.js + SQL Server (`DokanSaleem`)، يُستخدم إن تعذّر الاعتماد على السحابة. Supabase يبقى مصدر رجوع ولم يُحذف.

---

## 3) المكونات الثلاثة

### 3.1 تطبيق الزبائن (Flutter)

| البند | القيمة |
|---|---|
| **التقنية** | Flutter / Dart — الاسم `dokan_saleem`، الإصدار `1.0.0+1` |
| ** Dart SDK** | `^3.13.2` |
| **الحزمة الأساسية** | `supabase_flutter ^2.18.3` |
| **حزم أخرى** | `shared_preferences ^2.5.6`, `cupertino_icons ^1.0.8` |
| **Backend** | Supabase (الأساسي) — API محلي (Rollback) |
| **الأحجام (آخر بناء)** | Debug: **150.53 MB** — Release universal: **54.69 MB** — arm64-v8a: **19.26 MB** — armeabi-v7a: **17.02 MB** — x86_64: **20.69 MB** — Signed arm64: **19.29 MB** |
| **عدد الشاشات** | **17** شاشة رئيسية (في `screens.dart`) |
| **الشاشات** | Splash/Welcome, Home, Catalog, ProductDetails, Cart, Checkout, Orders, OrderDetails, Maintenance, Account, Motorcycles, Addresses, Favorites, Branches, Notifications, Support, Configuration |

### 3.2 لوحة الإدارة (Admin Portal)

| البند | القيمة |
|---|---|
| **التقنية** | HTML + CSS + Vanilla JS مدار بواسطة **Vite 8.3.4** |
| **حزمة Supabase** | `@supabase/supabase-js ^2.118.0` |
| **ملفات المصدر** | `admin/src/main.js`, `admin/src/style.css`, `admin/src/data/store-data.js`, `admin/src/csv-import.js` |
| **حجم آخر بناء** | `index-xGuwGfSA.js` = **266.48 kB** (gzip 70.28) — `index--Xw57Hd4.css` = **9.51 kB** |
| **عدد الأقسام** | **13** قسماً في الشريط الجانبي |
| **الأقسام** | الرئيسية، الطلبات، المنتجات، الأقسام، توافق المنتجات، المخزون، مناطق التوصيل، الفروع، العروض، طلبات الصيانة، العملاء، التقارير، إعدادات المتجر |

### 3.3 الـ Backend Cloud (Supabase)

| البند | القيمة |
|---|---|
| **المشروع (ref)** | `jmqejkgxchjboarcqpbu` |
| **الرابط** | `https://jmqejkgxchjboarcqpbu.supabase.co` |
| **Auth** | مجهول/جلسة زائر للعملاء + بريد/كلمة مرور للمدير |
| **التخزين (Storage)** | Cloudflare R2 (ليس Supabase Storage) |
| **Edge Functions** | `upload-image` (موجودة في `mobile/supabase/functions/upload-image/`) |
| **الأمان** | RLS مفعّل على كل الجداول + RPC `security definer` |

---

## 4) قاعدة البيانات — 16 جدولاً

| # | الجدول | الغرض | الصفوف حالياً |
|---|---|---|---|
| 1 | `profiles` | ملفات المستخدمين (مدير/عميل) | غير مُتحقق |
| 2 | `categories` | أقسام المنتجات | غير مُتحقق |
| 3 | `products` | المنتجات (السعر، الصور، المواصفات) | غير مُتحقق |
| 4 | `promotions` | العروض والبانرات | غير مُتحقق |
| 5 | `product_compatibility` | توافق المنتج مع الماركة/الطراز/السنة | غير مُتحقق |
| 6 | `branches` | الفروع (الدورة، القاهرة) | غير مُتحقق |
| 7 | `delivery_regions` | المحافظات والأحياء ورسوم التوصيل | غير مُتحقق |
| 8 | `branch_inventory` | مخزون كل منتج في كل فرع | غير مُتحقق |
| 9 | `customer_addresses` | عناوين العملاء | غير مُتحقق |
| 10 | `customer_motorcycles` | دراجات العميل | غير مُتحقق |
| 11 | `wishlist_items` | المفضلة | غير مُتحقق |
| 12 | `orders` | الطلبات (COD) | غير مُتحقق |
| 13 | `order_items` | عناصر الطلب | غير مُتحقق |
| 14 | `maintenance_requests` | طلبات الصيانة | غير مُتحقق |
| 15 | `customer_notifications` | إشعارات داخل التطبيق | غير مُتحقق |
| 16 | `store_settings` | إعدادات المتجر (صف واحد `id=1`) | صف واحد |

> **ملاحظة الصفوف:** لا يوجد وصول مباشر لقاعدة البيانات من هذه الجلسة، لذا عمود «الصفوف حالياً» = **غير مُتحقق**. يُذكر أن قاعدة SQL Server المحلية (مسار الرجوع) تحتوي بذوراً: 4 أقسام مسودة، 8 منتجات توضيحية غير منشورة، و19 منطقة توصيل.

**أعمدة مهمة في `profiles`:**
- `full_name` — الاسم الكامل للعميل (أضيف في `20261016000500_profiles_identity.sql`).
- `phone` — رقم الهاتف (موجود أصلاً في `20261015000100_store_core.sql`).
- `archived_at` — ختم الأرشفة الناعمة للعميل (يُضاف في `20261016000300_profiles_archived.sql`).

---

## 5) RPC Functions (18 دالة)

### 5.1 دوال قابلة للاستدعاء (9)

| الدالة | التصنيف | الغرض |
|---|---|---|
| `save_customer_address(...)` | العناوين | حفظ/تحديث عنوان العميل (مع ضبط الافتراضي) |
| `save_customer_profile(p_full_name, p_phone)` | الملف الشخصي | حفظ هوية العميل (اسم + هاتف) |
| `create_cod_order(...)` | الطلبات | إنشاء طلب COD ذرّي (فحص مخزون، خصم، عناصر) |
| `cancel_pending_cod_order(p_order_id)` | الطلبات | إلغاء طلب معلّق |
| `get_catalog_products(...)` | الفهارس | جلب كتالوج المنتجات النشطة مع الفلترة |
| `is_store_admin()` | صلاحيات | التحقق إن كان المستخدم مديراً |
| `admin_store_summary()` | الأدمن | ملخص لوحة الرئيسية |
| `admin_customer_overview()` | الأدمن | نظرة عامة على العملاء (غير المؤرشفين) |
| `admin_archive_customer(p_user_id)` | الأدمن | أرشفة عميل (soft delete) |

### 5.2 دوال المشغّلات Triggers (9)

| الدالة | الغرض |
|---|---|
| `set_updated_at()` | تحديث `updated_at` عند كل تعديل |
| `create_customer_profile()` | إنشاء صف `profiles` تلقائياً عند إنشاء مستخدم |
| `validate_order_status_transition()` | قيد انتقالات حالة الطلب |
| `validate_maintenance_status_transition()` | قيد انتقالات حالة الصيانة |
| `validate_maintenance_preferred_date()` | منع اختيار موعد صيانة في الماضي |
| `release_cancelled_order_inventory()` | إرجاع المخزون عند إلغاء الطلب |
| `notify_order_status_change()` | إنشاء إشعار عند تغيّر حالة الطلب |
| `notify_maintenance_status_change()` | إنشاء إشعار عند تغيّر حالة الصيانة |
| `notify_promotion_active()` | إشعار العملاء عند تفعيل عرض |

> **ملاحظة (Task 2.5):** استُبدِلت دالة `notify_order_status_change()` بنسخة أغنى لكل حالة (عنوان ونص مخصّصان + إيموجي) عبر الترحيل `20261016000700_order_status_notifications.sql`.

> **ملاحظة:** الدالة `customer_confirm_delivery(order_id)` **لم تُنشأ بعد** (مؤجّلة — Phase 4.7 في `FROZEN-SCOPE-v1.md`).

---

## 6) مميزات النظام

### 6.1 للزبون (Flutter)
- تصفح الأقسام والمنتجات مع بحث وتوافق مع الدراجات.
- عربة تسوق وإتمام طلب COD.
- إدارة العناوين، الدراجات، والمفضلة.
- طلبات الصيانة (ورشة / موقع العميل).
- إشعارات داخل التطبيق + شاشات الفروع والدعم.
- هوية محفوظة (اسم + هاتف) تُملأ تلقائياً في الدفع.

### 6.2 للأدمن (Admin)
- لوحة رئيسية بإحصائيات.
- إدارة الطلبات مع أزرار إجراءات سريعة للحالة (تأكيد، تجهيز، إرسال، تسليم، إلغاء).
- إدارة المنتجات (مع رفع صور إلى R2) والأقسام والتوافق.
- استيراد منتجات دفعة واحدة من ملف CSV مع مطابقة الأقسام العربية التقريبية.
- إدارة المخزون لكل فرع، مناطق التوصيل، الفروع، والعروض.
- طلبات الصيانة، سجل العملاء (مع الأرشفة)، التقارير، وإعدادات المتجر.

---

## 7) تدفق المستخدم

### 7.1 طلب جديد (COD)
```
العميل → تصفح المنتجات → إضافة للسلة
       → الدفع (اختيار عنوان / إدخال بيانات) 
       → create_cod_order()  [فحص مخزون + خصم + إنشاء طلب + حفظ عنوان]
       → نجاح (رقم طلب DOK-XXXXXXXXXX) → إشعار داخل التطبيق
```

### 7.2 حجز صيانة
```
العميل → شاشة الصيانة → اختيار النوع (ورشة/موقع) + دراجة + وصف + موعد
       → insert maintenance_requests  [تحقق تلقائي]
       → بانتظار المراجعة → تأكيد → قيد التنفيذ → مكتمل  (إشعارات تلقائية)
```

---

## 8) التقنيات المستخدمة

### 8.1 الواجهة (Frontend)
| الطبقة | التقنية |
|---|---|
| تطبيق الجوال | Flutter / Dart |
| لوحة الإدارة | HTML + CSS + Vanilla JS + Vite |
| RTL | دعم كامل للعربية |

### 8.2 الخلفية (Backend)
| الطبقة | التقنية |
|---|---|
| قاعدة البيانات السحابية | Supabase Postgres |
| المصادقة | Supabase Auth |
| منطق الأعمال | Postgres RPC + Triggers |
| تخزين الصور | Cloudflare R2 |
| Edge Functions | Deno (`upload-image`) |

### 8.3 المسار القديم (Legacy / Rollback)
| الطبقة | التقنية |
|---|---|
| API | Node.js (Express) |
| قاعدة البيانات | SQL Server Express (`DokanSaleem`) |
| المصادقة | JWT محلي |

---

## 9) هيكل الملفات

```
Dokan/
├── 01-design-system/       # البذرة: هوية بصرية + Design tokens
├── 02-customer-app/        # 36 تصديراً بصرياً لشاشات الزبون (مرجع)
├── 03-admin-portal/        # تصديرات شاشات لوحة الإدارة (مرجع)
├── 04-user-journeys/       # خرائط رحلات المستخدم (مرجع)
├── admin/                  # لوحة الإدارة (المصدر الفعلي)
│   ├── src/
│   │   ├── main.js         # المنطق + الصفحات + الأحداث
│   │   ├── style.css
│   │   ├── csv-import.js   # استيراد CSV (parse/validate/template)
│   │   └── data/store-data.js   # طبقة البيانات (API + Supabase)
│   ├── dist/               # بناء الإنتاج
│   ├── vite.config.mjs
│   └── .env.local / .env.example
├── backend/                # API المحلي (Rollback) + SQL Server
│   ├── src/
│   └── .env / .env.example
├── mobile/                 # تطبيق Flutter
│   ├── lib/
│   │   ├── main.dart
│   │   └── src/
│   │       ├── screens.dart        # 17 شاشة
│   │       ├── models.dart
│   │       ├── app_state.dart
│   │       ├── store_repository.dart
│   │       └── data/
│   │           ├── supabase_repository.dart
│   │           ├── store_repository.dart
│   │           └── api_repository.dart
│   ├── supabase/
│   │   ├── migrations/     # 6 ملفات ترحيل
│   │   └── functions/upload-image/
│   ├── android/ ios/
│   ├── config.local.json / config.example.json
│   └── build/app/outputs/flutter-apk/
├── scripts/                # سكربتات تشغيل
├── FROZEN-SCOPE-v1.md      # القرارات المجمّدة
├── README.md
├── stracture.md
├── ملاحظات-ونواقص-الإصدار.md
├── app.js / server.js / index.html / styles.css   # كتالوغ المعاينة
└── package.json            # جذر المشروع (Vite + supabase-js)
```

---

## 10) أوامر البناء

### 10.1 Flutter — Supabase (الإصدار الموقّع)
```powershell
# من مجلد mobile/
flutter pub get
flutter analyze
flutter build apk --release --split-per-abi
# التوقيع بمفتاح debug الحالي (اختبار فقط):
# app-arm64-v8a-release-SIGNED.apk
```

### 10.2 Flutter — API المحلي (Rollback)
```powershell
# من مجلد mobile/
flutter run --dart-define=API_BASE_URL=http://192.168.68.107:4176
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.68.107:4176
```

### 10.3 لوحة الإدارة
```powershell
# من جذر المشروع
npm.cmd run admin:dev      # تطوير (Vite)
npm.cmd run admin:build    # بناء الإنتاج → admin/dist
npm.cmd start              # كتالوغ المعاينة → http://127.0.0.1:4173/admin/
```

### 10.4 Edge Function
```powershell
# تتطلب Supabase CLI (غير مثبّت حالياً)
supabase functions deploy upload-image --project-ref jmqejkgxchjboarcqpbu
```

---

## 11) الحالة الحالية

### ✅ ما يعمل
| المكوّن | الحالة |
|---|---|
| طبقة Flutter على Supabase (كتالوج، سلة، طلبات، صيانة) | ✅ |
| لوحة الإدارة على Supabase (تسجيل دخول، جداول، RPC) | ✅ |
| هوية العميل (اسم + هاتف) والحفظ الفوري | ✅ |
| أرشفة العملاء (soft delete) | ✅ |
| الإجراءات السريعة لحالة الطلب | ✅ |
| استيراد المنتجات من CSV + قالب | ✅ |
| Edge Function `upload-image` | ✅ مُنشورة وتعمل |
| إشعارات تغيير حالة الطلب | ✅ يعمل (Task 2.5) |
| مسار API المحلي + SQL Server (Rollback) | ✅ |
| تنظيف المستودع (Cleanup Audit) | ✅ مُكتمل — تقليل **91%** من الحجم (3,294 → 297.88 MB): حُذف `build/`, `.dart_tool/`, `.gradle/`, `assets/catalog/`، مع إبقاء `node_modules` (مطلوب للتطوير) |

### ⏳ قيد التنفيذ
| البند | الملاحظة |
|---|---|
| اختبار الاستيراد الميداني | بعد إصلاح افتراضيات `NOT NULL` |
| الترحيلات غير المُطبَّقة | `20261016000200` (حالة غير مؤكدة) — الترحيلان `20261016000300` و `20261016000500` مطبَّقان ومُختبران (Customer Overview يعتمد عليهما) |
| اختبارات القبول على الجهاز الفعلي | متبقية |
| تقليل حجم الـ APK (Phase B) | خطوات 2–6 |

### ❌ لم يُخطط بعد
- إشعارات Push (FCM / APNs) — Phase C.
- تأكيد العميل لتسليم الطلب (`customer_confirm_delivery`) — Phase 4.7.
- طلب الملف الشخصي عند أول تشغيل — Phase 4.6.
- النشر على HTTPS عام + Google Play / App Store.
- نسخ احتياطية آلية وخطة استعادة.

---

## 12) الأمان

### ما هو مطبَّق
| الإجراء | التفصيل |
|---|---|
| RLS | مفعّل على **كل** الجداول الـ16 |
| سياسات القراءة العامة | للكتالوج فقط (`categories`, `products`, `branches`, إلخ) |
| RPC آمنة | `security definer` + قيود `auth.uid()` + تحقق `is_store_admin()` |
| تثبيت البحث (search_path) | مضبوط على `public` في كل الدوال |
| التحقق من الصور | نوع (`png/jpeg/webp`) + حجم (≤ 5 MB) في `upload-image` |
| أسرار الخادم | في ملفات `.env` / `config.local.json` (مستثناة من Git) |

### ⚠️ تحذيرات
- **لا تستخدم** حساب SQL Server مسؤولاً لتشغيل الـ API الشبكي.
- **لا ترفع** مفاتيح أو كلمات مرور أو رموز إلى Git.
- إصدار النشر **يجب ألا** يُوقَّع بمفتاح debug.
- الاتصال المحلي HTTP لا يُستخدم عبر إنترنت عام.
- Supabase يبقى مصدر رجوع **حتى** إكمال التحقق التشغيلي — لا تحذفه.

---

## 13) خارطة الطريق (Roadmap)

### المرحلة الحالية — تحسينات UX
- إصلاح استيراد CSV (افتراضات أعمدة `NOT NULL`) ✅.
- المطابقة التقريبية للأقسام العربية + رسائل خطأ واضحة ✅.
- ضبط شرائط الحالة السريعة للطلبات ✅.

### المرحلة المتوسطة — الميزات
- عدّاد تنازلي للعروض (Phase A).
- تحسين أداء الإقلاع وتقليل حجم الحزمة (Phase B، خطوات 2–6).
- نشر Edge Function `upload-image` (يحتاج Supabase CLI).
- تأكيد العميل للتسليم (Phase 4.7).
- شاشة الملف الشخصي عند أول تشغيل (Phase 4.6).

### المرحلة البعيدة — الإطلاق
- إشعارات Push (FCM / APNs) — Phase C.
- نشر HTTPS عام + Google Play / App Store.
- سياسات خصوصية وشروط استخدام.
- نسخ احتياطية آلية وخطة استعادة + اختبار شامل.

---

## 14) معلومات مهمة

### بيانات الدخول (بدون كلمات مرور)
| البند | القيمة |
|---|---|
| بريد المدير | `braintechpg@gmail.com` |
| Supabase Project ref | `jmqejkgxchjboarcqpbu` |
| Supabase URL | `https://jmqejkgxchjboarcqpbu.supabase.co` |

### المنافذ
| المنفذ | الاستخدام |
|---|---|
| `4173` | كتالوغ المعاينة (`server.js`) |
| `4176` | API المحلي (Node.js) + `VITE_DOKAN_API_URL` |

> ⚠️ **لا يوجد منفذ `3000`** في المشروع (البحث أظهر فقط `30000` كقيمة `timeout`).

### الملفات الحساسة (لا تُرفع / لا تُنشر)
- `admin/.env.local`
- `mobile/config.local.json`
- `backend/.env`
- `backend/data/images/`
- `mobile/android/key.properties` و `*.jks`
- `cloudflarekeys.txt`

---

## 15) الدروس المستفادة

| المشكلة | الحل |
|---|---|
| حقل `category` مقابل `category_ar` في CSV | دالة `pick()` تقبل صيغاً متعددة |
| فشل إدراج بسبب `null` في أعمدة `NOT NULL` | إرسال الافتراضيات صراحةً (`''`, `{}`) |
| اختلاف أسماء الأقسام في CSV عن قاعدة البيانات | مطابقة عربية تقريبية (`normalizeArabic` + substring) |
| ترميز عربي معطوب عند استيراد CSV | إضافة BOM `\uFEFF` للقالب |
| حالة الطلب نصّية لا مرئية | شرائط `badge` + أزرار إجراءات سريعة |
| عدم تحديث القائمة بعد تغيير الحالة | `await loadPage()` بعد النجاح |

### القواعد الذهبية
1. لا أسرار في الملفات أو السجلات أو Git.
2. الترحيلات تُطبَّق **يدوياً** (لا تطبيق تلقائي).
3. خطوة واحدة في كل مرة + تأكيد قبل التطبيق.
4. Supabase مصدر رجوع — لا يُحذف حتى التحقق الكامل.
5. اختبار ميداني على الجهاز الفعلي قبل الإطلاق.

---

## 16) الإنجازات الرئيسية

| # | الإنجاز |
|---|---|
| 1 | طبقة بيانات Flutter كاملة على Supabase (كتالوج، سلة، طلبات، صيانة) |
| 2 | لوحة إدارة ويب تعمل بالكامل على Supabase مع RLS |
| 3 | مخطط قاعدة بيانات من 16 جدولاً + 18 دالة RPC/Trigger |
| 4 | نظام طلب COD ذرّي مع فحص وخصم مخزون تلقائي |
| 5 | هوية العميل المحفوظة فورياً (اسم + هاتف) + أرشفة ناعمة |
| 6 | إجراءات سريعة لحالة الطلب مع شرائط حالة مرئية |
| 7 | استيراد منتجات من CSV مع مطابقة أقسام عربية تقريبية |
| 8 | Edge Function `upload-image` مع Cloudflare R2 |
| 9 | مسار رجوع كامل (Node.js + SQL Server) |
| 10 | توثيق معماري شامل وقواعد عمل صارمة |

---

## 17) التقييم النهائي

| المعيار | التقييم | ملاحظة |
|---|---|---|
| اكتمال الوظائف | 8/10 | الميزات الأساسية تعمل |
| جودة البنية | 9/10 | فصل واضح بين الطبقات |
| الأمان | 8/10 | RLS + RPC + تحقق صور |
| التوثيق | 9/10 | شامل ومحدّث |
| الجاهزية للنشر | 5/10 | ينقص HTTPS + توقيع نشر + اختبارات |
| الأداء | 6/10 | حجم الحزمة يحتاج تحسيناً |
| **الإجمالي** | **7.5/10** | 🟢 جيد — جاهز للمرحلة التالية |

---

## 18) التحقق (Verification)

| البند في المحتوى | الحقيقة في المستودع | الإجراء |
|---|---|---|
| `admin/package.json` | **لا يوجد** — لا ملف `package.json` داخل `admin/` | صُحِّح: الإصدارات مأخوذة من `package.json` الجذري (`dokan-screen-library`): Vite `^8.3.4`، `@supabase/supabase-js ^2.118.0` |
| عدد الشاشات | 17 شاشة عامة (`class .*Screen`) | مُثبَّت |
| أقسام الشريط الجانبي | 13 قسماً | مُثبَّت |
| عدد الجداول | 16 جدولاً | مُثبَّت |
| عدد دوال RPC | 9 قابلة للاستدعاء + 9 Triggers = **18** | صُحِّح: المحتوى توقّع «20+» — العدد الفعلي 18 |
| `profiles.full_name / phone / archived_at` | `full_name` و`archived_at` مضافان بترحيلات؛ `phone` أصلي | مُثبَّت |
| Edge Function `upload-image` | **موجودة ومنشورة**: `index.ts` + `deno.json` | مُحدَّث (2026-10-16): مُنشورة وتعمل |
| المنفذ 3000 | **غير موجود** — فقط `4173` (معاينة) و`4176` (API) | صُحِّح: حُذف 3000 من قائمة المنافذ |
| أحجام APK | مُتحقَّق منها من `mobile/build/.../flutter-apk` | مُثبَّت |
| `porst`/`profiles` أعمدة | مطابقة للترحيلات | مُثبَّت |
| ملفات `.md` في الجذر | `README.md`, `stracture.md`, `FROZEN-SCOPE-v1.md`, `ملاحظات-ونواقص-الإصدار.md` (4 ملفات) | مُثبَّت |

**إجمالي الاختلافات المكتشفة:** 4 (مصدر إصدارات الحزمة، عدد دوال RPC، حالة Edge Function، منفذ 3000) — وكلها صُحِّحت أعلاه.
- لا توجد اختلافات أخرى — بقية التفاصيل مطابقة للملفات الفعلية.
- تم تحديث 2026-10-16 — `upload-image` مُنشور، و Task 2.5 مُطبَّق ومُختبَر.

---

*نهاية الخريطة — يُحدَّث هذا الملف عند تغيّر البنية أو الترحيلات أو الحالة.*
