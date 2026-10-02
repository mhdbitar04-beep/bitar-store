# مراحل بناء BITAR STORE

لكل مرحلة: الخطة، والملفات، والأشياء اللي لازم تجربها، ورسالة Commit مقترحة، وأسئلة مقابلة.

> نصيحة: اعمل Commit منفصل لكل مرحلة، بنفس الترتيب، ليطلع تاريخ الـ Git مرتب.

---

## المرحلة 1: تجهيز المشروع وتصميم قاعدة البيانات

**الخطة:** هيكلية Monorepo (`backend/` + `frontend/`)، ومخطط ERD، والـ Migrations، والـ Models مع العلاقات، والـ Enums، والـ Factories والـ Seeders.

**الملفات:** `backend/database/migrations/*`، `app/Models/*`، `app/Enums/*`، `database/factories/*`، `database/seeders/*`، `docs/erd.png`

**جرّب:**

- [ ] `php artisan migrate:fresh --seed` بيشتغل بدون أخطاء
- [ ] `php artisan tinker` ← `Product::with('variants.attributeValues')->first()`
- [ ] 34 منتج بـ 10 تصنيفات فرعية، وكل منتج إلو Variant واحد على الأقل
- [ ] الطلبات الوهمية موزعة على آخر 90 يوم

```
chore: scaffold monorepo and design database schema

- Laravel 13 API skeleton with MySQL
- domain tables: catalog, variants/attributes, reviews, wishlist, coupons, orders, payments
- money stored as integer cents; order items keep snapshots
- factories + realistic multi-category seeders
```

**أسئلة مقابلة:**

1. ليش خزّنا الأسعار كـ Integer (سنتات) بدل Decimal أو Float؟
2. ليش `order_items` بيحفظ اسم المنتج وسعره بدل ما يعتمد على `product_id` بس؟
3. شو فايدة إنه كل منتج يكون إلو Variant واحد على الأقل حتى لو ما إلو خيارات؟

---

## المرحلة 2: API المصادقة والمنتجات مع الاختبارات

**الخطة:** Sanctum Tokens، والتسجيل والدخول والخروج، واستعادة كلمة السر، والفلترة والبحث والترتيب، والمراجعات، والمفضلة، وشكل موحد للأخطاء، وتحديد عدد الطلبات (Rate Limiting)، واختبارات Pest.

**الملفات:** `app/Http/Controllers/Api/V1/*`، `app/Http/Requests/*`، `app/Http/Resources/*`، `app/Services/{AuthService,ProductQueryService,ReviewService}.php`، `app/Exceptions/ApiExceptionRenderer.php`، `routes/api.php`، `tests/Feature/{Auth,ProductCatalog,Review,Wishlist}Test.php`

**جرّب:**

- [ ] `php artisan test` ← كل الاختبارات خضرا
- [ ] `GET /api/v1/products?category=electronics&min_price=50000&sort=price_desc`
- [ ] `GET /api/v1/auth/me` بدون توكن ← `{"message":"Unauthenticated.","code":"unauthenticated"}`
- [ ] 6 محاولات دخول غلط بدقيقة وحدة ← 429
- [ ] `MAIL_MAILER=log` ← رابط الاستعادة بيطلع بـ `storage/logs/laravel.log`

```
feat(api): authentication, catalog and reviews endpoints

- Sanctum bearer tokens, password reset link pointing to SPA
- product filtering/search/sort/pagination via ProductQueryService
- reviews with cached rating aggregates, wishlist
- unified JSON error contract { message, code, errors }
- Pest feature tests
```

**أسئلة مقابلة:**

1. ليش رسالة "بيانات الدخول غلط" نفسها سواء الإيميل مش موجود أو كلمة السر غلط؟
2. شو الفرق بين `FormRequest` و `Policy`؟ ومين بيتنفذ أول؟
3. ليش خزّنا `rating_avg` بجدول المنتجات بدل ما نحسبه بكل طلب؟ وشو سلبيات هالشي؟

---

## المرحلة 3: تجهيز React والتصميم العام وصفحة المنتجات

**الخطة:** Vite + TS + Tailwind v4، ونظام ألوان أسود وذهبي مع وضع نهاري، و Layout، و Router مع تحميل كسول (Lazy)، و TanStack Query، وصفحة منتجات فلاترها كلها بالـ URL، و Skeletons.

**الملفات:** `frontend/src/index.css`، `src/app/*`، `src/lib/*`، `src/components/{ui,layout}/*`، `src/features/products/api.ts`، `src/pages/ProductsPage.tsx`

**جرّب:**

- [ ] `npm run dev` ← الصفحة الرئيسية بتفتح
- [ ] غيّر الفلاتر ← الـ URL بيتغير، وزر Back بيرجع للفلتر القديم
- [ ] Skeletons بتظهر أول تحميل، والشبكة ما بترمش لما تغير الفلتر (keepPreviousData)
- [ ] زر الثيم بيبدل بين الأسود والعاجي، وبيتذكر اختيارك بعد الـ Refresh
- [ ] الجوال: الفلاتر بتطلع كدرج جانبي

```
feat(web): React app shell, black & gold theme and product listing

- Vite + React 19 + TS + Tailwind v4 design tokens (dark/light)
- router with route-level code splitting and page transitions
- TanStack Query data layer, URL-driven filters, skeleton loaders
```

**أسئلة مقابلة:**

1. ليش خلينا الـ URL هو مصدر حالة الفلاتر بدل `useState`؟
2. شو الفرق بين حالة السيرفر (TanStack Query) وحالة الواجهة (Zustand)؟ وليش ما حطينا المنتجات بـ Zustand؟
3. كيف منعنا "وميض الثيم الغلط" عند أول تحميل للصفحة؟

---

## المرحلة 4: صفحة المنتج والسلة والأنيميشن

**الخطة:** معرض صور مع تكبير، وخيارات الـ Variant (الخيارات غير المتوفرة بتنطفي)، وسلة Zustand محفوظة، ودرج السلة، وحركة "طيران المنتج للسلة"، وعداد متحرك، و Toasts، و Hero بـ GSAP ScrollTrigger.

**الملفات:** `pages/ProductPage.tsx`، `components/product/*`، `components/cart/*`، `stores/cartStore.ts`، `stores/uiStore.ts`، `components/home/Hero.tsx`

**جرّب:**

- [ ] اختار لون ومقاس ← السعر والمخزون بيتغيروا
- [ ] "Add to cart" ← صورة المنتج بتطير لأيقونة السلة، والعداد بيقفز
- [ ] الدرج: تعديل الكمية، والحذف، و Esc بيسكّر
- [ ] فعّل Reduce Motion من إعدادات النظام ← لا حركة طيران ولا Pin بالـ Hero
- [ ] الـ Hero بيثبت (Pin) وبيتحرك مع السكرول

```
feat(web): product page, cart drawer and motion system

- zoomable gallery, variant picker with availability
- persisted Zustand cart, animated drawer, fly-to-cart, animated badge
- GSAP ScrollTrigger hero (only place GSAP is used)
- global prefers-reduced-motion support
```

**أسئلة مقابلة:**

1. ليش استخدمنا GSAP بس للـ Hero، و Framer Motion لباقي الواجهة؟
2. كيف بتحترم `prefers-reduced-motion` بالمكتبتين وبالـ CSS؟
3. السلة محفوظة بـ localStorage: كيف بنضمن إنه الزبون ما يدفع سعر قديم أو كمية مش متوفرة؟

---

## المرحلة 5: الدفع و Stripe والطلبات

**الخطة:** `CartPricingService` (السيرفر بيعيد التسعير)، والكوبونات، و `CheckoutService` (Transaction + Row locks + حجز المخزون)، و PaymentIntent، و Webhook موقّع و Idempotent، وسجل الطلبات، و Pay-later، والإلغاء، وانتهاء صلاحية الطلبات غير المدفوعة.

**الملفات:** `app/Services/{Cart/*,CouponService,CheckoutService,OrderService,StripeWebhookService}.php`، `app/Services/Payments/*`، `tests/Feature/{CartQuote,Checkout,StripeWebhook}Test.php`، `pages/{CheckoutPage,CheckoutSuccessPage,OrdersPage,OrderDetailPage}.tsx`

**جرّب:**

- [ ] `stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe`
- [ ] ادفع بـ `4242 4242 4242 4242` ← صفحة النجاح بتتحول لـ "Thank you" لحالها (Polling)
- [ ] بطاقة `4000 0000 0000 9995` (رصيد غير كافي) ← رسالة خطأ، والطلب بيضل Pending
- [ ] كوبون `EXPIRED5` ← رسالة "expired"
- [ ] `WELCOME10` مرتين بنفس الحساب ← المرة التانية بتنرفض
- [ ] `php artisan orders:expire-pending` ← الطلبات القديمة بتتلغى والمخزون بيرجع
- [ ] بدون مفاتيح Stripe: `PAYMENT_GATEWAY=fake` ← زر Simulate payment

```
feat(checkout): Stripe payments, coupons and order lifecycle

- server-side cart pricing, coupon validation with atomic redemption
- transactional checkout with row locks and stock reservation
- PaymentIntent + signed, idempotent webhook handling
- order history, pay-later, cancellation, pending-order expiry
```

**أسئلة مقابلة:**

1. ليش تأكيد الدفع بيجي من الـ Webhook مش من الفرونت بعد `confirmPayment`؟
2. كيف منعنا بيع آخر قطعة لزبونين بنفس اللحظة؟ (`lockForUpdate` + ترتيب الأقفال)
3. ليش استدعاء Stripe صار **برا** الـ DB Transaction؟ وشو بيصير إذا فشل؟

---

## المرحلة 6: لوحة تحكم الأدمن

**الخطة:** Middleware `admin` مع Policies، و CRUD للمنتجات مع Variant Builder ورفع أكتر من صورة، والتصنيفات، والكوبونات، وإدارة الطلبات بـ State Machine و Refund، وداشبورد برسوم بيانية.

**الملفات:** `app/Http/Controllers/Api/V1/Admin/*`، `app/Services/{ProductService,DashboardService}.php`، `tests/Feature/Admin/*`، `components/layout/AdminLayout.tsx`، `pages/admin/*`

**جرّب:**

- [ ] ادخل كزبون ← `/admin` بيرجعك، والـ API بيرد 403
- [ ] منتج جديد ← "Generate all combinations" ← ارفع 3 صور ← اختار الصورة الرئيسية
- [ ] حاول تحذف تصنيف فيه منتجات ← 409
- [ ] غيّر حالة طلب Delivered لـ Pending ← مرفوض (422)
- [ ] Refund لطلب مدفوع ← بيظهر بـ Stripe Dashboard
- [ ] الداشبورد: بدّل بين 7d و 30d و 90d

```
feat(admin): dashboard, catalog management and order operations

- role-based admin area (middleware + policies)
- products with variant builder and multi-image upload
- categories, coupons, order status state machine with refunds
- analytics: revenue over time, orders per day, best sellers
```

**أسئلة مقابلة:**

1. ليش حطينا التحقق من الصلاحية بالـ Middleware **و** بالـ Policies؟ ما كان واحد بيكفي؟
2. كيف مثّلنا حالات الطلب كـ State Machine؟ وليش هيك أحسن من `if` متفرقة بالكونترولر؟
3. ليش حذف المنتج Soft Delete؟

---

## المرحلة 7: التحسينات والأداء والتوثيق

**الخطة:** تقسيم الكود لكل صفحة، و Vendor chunks، وصور Lazy، و `fetchpriority` لصورة المنتج الرئيسية، وإصلاح الـ Scroll restoration، وإمكانية الوصول (Skip link، و aria، والتركيز)، و README، ودليل الرفع، و CI.

**جرّب:**

- [ ] `npm run build` ← لازم تشوف chunk منفصل لكل صفحة، و Recharts بس بـ `DashboardPage`
- [ ] `npm run preview` ← Lighthouse (Mobile) على `/products`: الهدف فوق 90 بالأداء وإمكانية الوصول
- [ ] التنقل بالكيبورد بس (Tab): زر "Skip to content" بيظهر
- [ ] GitHub Actions: الـ workflow بيشغّل Pest و Build

```
chore: performance, accessibility and documentation

- route-level code splitting and long-term cacheable vendor chunks
- lazy images, fetchpriority, scroll restoration by pathname
- README with screenshots, deployment guide, CI workflow
```

**أسئلة مقابلة:**

1. شو الفرق بين LCP و CLS؟ وكيف أثّرت `width/height` على الصور على CLS؟
2. ليش المكتبات التقيلة (Recharts) ما لازم تنزل للزبون العادي؟ وكيف تحققنا من هالشي؟
3. شو الخطوات اللي لازم تعملها قبل ما تحط `APP_DEBUG=false` وتطلق للإنتاج؟
