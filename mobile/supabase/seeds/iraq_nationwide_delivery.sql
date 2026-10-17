-- Flat-rate delivery draft requested for all Iraqi governorates.
-- Customers should provide their district/neighborhood in the detailed address.
insert into public.delivery_regions (
  province_ar,
  neighborhood_ar,
  delivery_fee_iqd,
  is_active
)
values
  ('بغداد', 'كافة المناطق', 5000, true),
  ('البصرة', 'كافة المناطق', 5000, true),
  ('نينوى', 'كافة المناطق', 5000, true),
  ('أربيل', 'كافة المناطق', 5000, true),
  ('السليمانية', 'كافة المناطق', 5000, true),
  ('دهوك', 'كافة المناطق', 5000, true),
  ('كركوك', 'كافة المناطق', 5000, true),
  ('ديالى', 'كافة المناطق', 5000, true),
  ('الأنبار', 'كافة المناطق', 5000, true),
  ('بابل', 'كافة المناطق', 5000, true),
  ('كربلاء', 'كافة المناطق', 5000, true),
  ('النجف', 'كافة المناطق', 5000, true),
  ('واسط', 'كافة المناطق', 5000, true),
  ('القادسية', 'كافة المناطق', 5000, true),
  ('ذي قار', 'كافة المناطق', 5000, true),
  ('ميسان', 'كافة المناطق', 5000, true),
  ('المثنى', 'كافة المناطق', 5000, true),
  ('صلاح الدين', 'كافة المناطق', 5000, true),
  ('حلبجة', 'كافة المناطق', 5000, true)
on conflict (province_ar, neighborhood_ar) do update
set delivery_fee_iqd = excluded.delivery_fee_iqd,
    is_active = excluded.is_active,
    updated_at = now();
