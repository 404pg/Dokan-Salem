-- Illustrative catalog drafts for review only.
-- Prices are estimates, not verified Iraqi market prices. No inventory is created.

insert into public.categories (id, name_ar, sort_order, is_active)
values
  ('10000000-0000-4000-8000-000000000001', 'الزيوت والسوائل', 10, false),
  ('10000000-0000-4000-8000-000000000002', 'المحرك وقطع الغيار', 20, false),
  ('10000000-0000-4000-8000-000000000003', 'الحركة والفرامل', 30, false),
  ('10000000-0000-4000-8000-000000000004', 'الإطارات والكهرباء والهيكل', 40, false)
on conflict (id) do nothing;

insert into public.products (
  id,
  category_id,
  name_ar,
  brand,
  description_ar,
  sku,
  price_iqd,
  image_urls,
  specifications,
  is_active
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'زيت محرك دراجة نارية 4T - عبوة 1 لتر',
    null,
    'مسودة توضيحية. يجب تحديد العلامة التجارية واللزوجة ومواصفة الزيت ومناسبته للمحرك قبل النشر.',
    'DRAFT-IR-OIL-4T-1L',
    18000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/engine-oil-4t.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من دليل الدراجة"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'شمعة إشعال للدراجات النارية',
    null,
    'مسودة توضيحية. رمز الشمعة ومقاس القلاوظ ودرجة الحرارة غير محددة؛ يجب مطابقتها مع الطراز قبل النشر.',
    'DRAFT-IR-SPARK-PLUG',
    5000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/spark-plug.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من رقم القطعة"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'طقم سلسلة وتروس للدراجة النارية',
    null,
    'مسودة توضيحية. عدد الأسنان وطول السلسلة والمقاس غير محددة؛ يجب التحقق من التوافق قبل النشر.',
    'DRAFT-IR-CHAIN-SPROCKET',
    35000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/chain-sprocket-kit.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من عدد الأسنان وطول السلسلة"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000003',
    'فحمات فرامل للدراجة النارية',
    null,
    'مسودة توضيحية. موضع الفرامل وشكل الفحمات غير محددين؛ يجب مطابقتها مع الدراجة قبل النشر.',
    'DRAFT-IR-BRAKE-PADS',
    15000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/brake-pads.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من شكل ومقاس الفحمات"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'فلتر هواء للدراجة النارية',
    null,
    'مسودة توضيحية. شكل الفلتر ومقاسه غير محددين؛ يجب تحديد الطراز المناسب قبل النشر.',
    'DRAFT-IR-AIR-FILTER',
    10000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/air-filter.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من الطراز والمقاس"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000004',
    'أنبوب داخلي للإطار',
    null,
    'مسودة توضيحية. قياس الإطار ونوع الصمام غير محددين؛ يجب التحقق منهما قبل النشر.',
    'DRAFT-IR-INNER-TUBE',
    7000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/inner-tube.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من قياس الإطار ونوع الصمام"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000004',
    'مصباح أمامي للدراجة النارية',
    null,
    'مسودة توضيحية. نوع القاعدة والقدرة الكهربائية والجهد غير محددة؛ يجب مطابقتها قبل النشر.',
    'DRAFT-IR-HEADLAMP-BULB',
    8000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/headlamp-bulb.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من القاعدة والقدرة والجهد"}'::jsonb,
    false
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000004',
    'مرآة جانبية للدراجة النارية',
    null,
    'مسودة توضيحية. جهة التركيب ومقاس القلاوظ غير محددين؛ يجب التحقق من التوافق قبل النشر.',
    'DRAFT-IR-REAR-VIEW-MIRROR',
    12000,
    array['https://jmqejkgxchjboarcqpbu.supabase.co/storage/v1/object/public/catalog-draft-images/rear-view-mirror.png'],
    '{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق من جهة التركيب ومقاس القلاوظ"}'::jsonb,
    false
  )
on conflict (id) do nothing;
