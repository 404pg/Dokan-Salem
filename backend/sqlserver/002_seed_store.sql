USE DokanSaleem;
GO

MERGE dbo.categories AS target
USING (VALUES
  (N'الزيوت والسوائل', 10),
  (N'المحرك وقطع الغيار', 20),
  (N'الحركة والفرامل', 30),
  (N'الإطارات والكهرباء والهيكل', 40)
) AS source(name_ar, sort_order)
ON target.name_ar = source.name_ar
WHEN NOT MATCHED THEN
  INSERT (name_ar, sort_order, is_active) VALUES (source.name_ar, source.sort_order, 0);
GO

INSERT INTO dbo.delivery_regions (province_ar, neighborhood_ar, delivery_fee_iqd, is_active)
SELECT source.province_ar, N'كافة المناطق', 5000, 1
FROM (VALUES
  (N'بغداد'), (N'البصرة'), (N'نينوى'), (N'أربيل'), (N'السليمانية'),
  (N'دهوك'), (N'كركوك'), (N'ديالى'), (N'الأنبار'), (N'بابل'),
  (N'كربلاء'), (N'النجف'), (N'واسط'), (N'القادسية'), (N'ذي قار'),
  (N'ميسان'), (N'المثنى'), (N'صلاح الدين'), (N'حلبجة')
) AS source(province_ar)
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.delivery_regions existing
  WHERE existing.province_ar = source.province_ar
    AND existing.neighborhood_ar = N'كافة المناطق'
);
GO

INSERT INTO dbo.products (
  category_id, name_ar, description_ar, sku, price_iqd, image_urls, specifications, is_active
)
SELECT category.id, source.name_ar, source.description_ar, source.sku, source.price_iqd,
  CONCAT(N'["/images/', source.image_name, N'"]'),
  N'{"pricing_status":"تقديري أولي غير موثق - يحتاج مراجعة المورد","pricing_review_required":true,"image_status":"رسم توضيحي أصلي وليس صورة منتج فعلي","compatibility":"غير محددة - يلزم التحقق قبل النشر"}',
  0
FROM (VALUES
  (N'الزيوت والسوائل', N'زيت محرك دراجة نارية 4T - عبوة 1 لتر', N'مسودة توضيحية. يلزم تحديد العلامة التجارية واللزوجة والمواصفة قبل النشر.', N'DRAFT-IR-OIL-4T-1L', CONVERT(bigint,18000), N'engine-oil-4t.png'),
  (N'المحرك وقطع الغيار', N'شمعة إشعال للدراجات النارية', N'مسودة توضيحية. رمز الشمعة ومقاس القلاوظ غير محددين.', N'DRAFT-IR-SPARK-PLUG', CONVERT(bigint,5000), N'spark-plug.png'),
  (N'الحركة والفرامل', N'طقم سلسلة وتروس للدراجة النارية', N'مسودة توضيحية. عدد الأسنان وطول السلسلة غير محددين.', N'DRAFT-IR-CHAIN-SPROCKET', CONVERT(bigint,35000), N'chain-sprocket-kit.png'),
  (N'الحركة والفرامل', N'فحمات فرامل للدراجة النارية', N'مسودة توضيحية. موضع الفرامل وشكل الفحمات غير محددين.', N'DRAFT-IR-BRAKE-PADS', CONVERT(bigint,15000), N'brake-pads.png'),
  (N'المحرك وقطع الغيار', N'فلتر هواء للدراجة النارية', N'مسودة توضيحية. شكل الفلتر ومقاسه غير محددين.', N'DRAFT-IR-AIR-FILTER', CONVERT(bigint,10000), N'air-filter.png'),
  (N'الإطارات والكهرباء والهيكل', N'أنبوب داخلي للإطار', N'مسودة توضيحية. قياس الإطار ونوع الصمام غير محددين.', N'DRAFT-IR-INNER-TUBE', CONVERT(bigint,7000), N'inner-tube.png'),
  (N'الإطارات والكهرباء والهيكل', N'مصباح أمامي للدراجة النارية', N'مسودة توضيحية. نوع القاعدة والقدرة والجهد غير محددة.', N'DRAFT-IR-HEADLAMP-BULB', CONVERT(bigint,8000), N'headlamp-bulb.png'),
  (N'الإطارات والكهرباء والهيكل', N'مرآة جانبية للدراجة النارية', N'مسودة توضيحية. جهة التركيب ومقاس القلاوظ غير محددين.', N'DRAFT-IR-REAR-VIEW-MIRROR', CONVERT(bigint,12000), N'rear-view-mirror.png')
) AS source(category_name, name_ar, description_ar, sku, price_iqd, image_name)
JOIN dbo.categories category ON category.name_ar = source.category_name
WHERE NOT EXISTS (SELECT 1 FROM dbo.products existing WHERE existing.sku = source.sku);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.store_settings WHERE id = 1)
  INSERT INTO dbo.store_settings (id, store_name_ar, support_phone)
  VALUES (1, N'دكان سليم', NULL);
GO
