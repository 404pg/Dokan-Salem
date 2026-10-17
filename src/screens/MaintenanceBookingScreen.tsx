import React, { useState } from 'react';
import { MaintenanceBooking, BikeProfile } from '../types';
import { BAGHDAD_DISTRICTS } from '../data/mockData';

interface MaintenanceBookingScreenProps {
  initialMode?: 'workshop' | 'mobile';
  currentBike: BikeProfile;
  onBookingSubmitted: (booking: MaintenanceBooking) => void;
  onViewOrders: () => void;
}

export const MaintenanceBookingScreen: React.FC<MaintenanceBookingScreenProps> = ({
  initialMode = 'workshop',
  currentBike,
  onBookingSubmitted,
  onViewOrders,
}) => {
  const [serviceType, setServiceType] = useState<'workshop' | 'mobile'>(initialMode);
  const [branch, setBranch] = useState<'doura' | 'qahira'>('doura');
  const [district, setDistrict] = useState(BAGHDAD_DISTRICTS[0].name);
  const [address, setAddress] = useState('');
  const [bikeMake, setBikeMake] = useState(currentBike.make);
  const [bikeModel, setBikeModel] = useState(currentBike.model);
  const [bikeYear, setBikeYear] = useState(currentBike.year);

  const [selectedServices, setSelectedServices] = useState<string[]>([
    'صيانة دورية وتبديل زيت وفلاتر',
  ]);
  const [problemDescription, setProblemDescription] = useState('');
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [preferredDay, setPreferredDay] = useState('اليوم (فوري)');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('صباحاً (9:00 ص - 1:00 م)');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName) ? prev.filter((s) => s !== serviceName) : [...prev, serviceName]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasUploadedFile(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bookingId = `DK-${Math.floor(8000 + Math.random() * 1000)}`;
    setConfirmedBookingId(bookingId);

    const booking: MaintenanceBooking = {
      id: bookingId,
      serviceType,
      branch: serviceType === 'workshop' ? branch : undefined,
      district: serviceType === 'mobile' ? district : undefined,
      address: serviceType === 'mobile' ? address : undefined,
      bikeMake,
      bikeModel,
      bikeYear,
      selectedServices,
      problemDescription,
      preferredDay,
      preferredTimeSlot,
      createdAt: new Date().toLocaleDateString('ar-IQ'),
      status: 'confirmed',
    };

    onBookingSubmitted(booking);
    setShowConfirmation(true);
  };

  return (
    <div className="flex flex-col relative w-full pt-16 pb-24 max-w-2xl mx-auto bg-[#fff8f8] min-h-screen px-4">
      {/* Interactive Hero / Header Context */}
      <div className="relative w-full rounded-xl overflow-hidden bg-[#efe6e7] p-4 my-3 shadow-sm border border-[#e9e0e2]">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex flex-col min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#954500]/10 text-[#954500] mb-1.5 w-fit">
              <span className="material-symbols-outlined text-[16px]">build_circle</span>
              <span className="text-[0.75rem] font-bold">ورشة دكان سليم المعتمدة</span>
            </div>
            <h1 className="text-[1.375rem] font-bold text-[#1e1b1c]">حجز موعد صيانة</h1>
            <p className="text-[0.875rem] text-[#574337] mt-0.5 leading-relaxed">
              فريق من أمهر الفيترية لتشخيص وإصلاح دراجتك بدقة وضمان قطع غيار أصلية.
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-[#954500] flex-shrink-0 shadow-sm border border-[#e9e0e2]">
            <span className="material-symbols-outlined text-[32px]">two_wheeler</span>
          </div>
        </div>

        <div className="mt-3 pt-3 flex items-center justify-between text-[0.75rem] text-[#574337] border-t border-[#e9e0e2]/60">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2c690b]"></span> فحص كمبيوتر مجاني
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2c690b]"></span> ضمان الصيانة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2c690b]"></span> أسعار شفافة
          </span>
        </div>
      </div>

      {/* Service Mode Selector (Tabs) */}
      <div className="flex flex-col mb-4">
        <label className="text-[0.875rem] font-bold text-[#1e1b1c] mb-2 block">نوع خدمة الصيانة</label>
        <div className="grid grid-cols-2 p-1.5 rounded-xl bg-[#f4eced] gap-1.5 border border-[#e9e0e2]">
          <button
            type="button"
            onClick={() => setServiceType('workshop')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-[0.875rem] font-bold transition-all active:scale-[0.98] ${
              serviceType === 'workshop'
                ? 'bg-white text-[#954500] shadow-sm'
                : 'text-[#574337] hover:text-[#1e1b1c]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <span>داخل الورشة</span>
          </button>
          <button
            type="button"
            onClick={() => setServiceType('mobile')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-[0.875rem] font-bold transition-all active:scale-[0.98] ${
              serviceType === 'mobile'
                ? 'bg-white text-[#954500] shadow-sm'
                : 'text-[#574337] hover:text-[#1e1b1c]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">electric_moped</span>
            <span>صيانة متنقلة</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Workshop Branch Selection */}
        {serviceType === 'workshop' && (
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#faf1f3] border border-[#e9e0e2]">
            <div className="flex items-center justify-between">
              <label className="text-[0.875rem] font-bold text-[#1e1b1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#954500] text-[20px]">store</span>
                <span>اختر الفرع الأقرب إليك</span>
              </label>
              <span className="text-[0.75rem] text-[#2c690b] bg-[#aff589]/40 px-2 py-0.5 rounded-full font-bold">
                متاح اليوم
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <label
                onClick={() => setBranch('doura')}
                className={`relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer shadow-sm border transition-all ${
                  branch === 'doura'
                    ? 'border-[#954500] bg-[#ffdbc8]/20'
                    : 'border-[#e9e0e2] bg-white hover:bg-[#f4eced]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="branch"
                    checked={branch === 'doura'}
                    onChange={() => setBranch('doura')}
                    className="w-5 h-5 accent-[#954500] cursor-pointer"
                  />
                  <div>
                    <p className="text-[0.875rem] font-bold text-[#1e1b1c]">فرع الدورة - شارع 60</p>
                    <p className="text-[0.75rem] text-[#574337]">مقابل محطة الوقود، متاح رافعة هيدروليكية وفحص كمبيوتر</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#574337] text-[20px]">directions_walk</span>
              </label>

              <label
                onClick={() => setBranch('qahira')}
                className={`relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer shadow-sm border transition-all ${
                  branch === 'qahira'
                    ? 'border-[#954500] bg-[#ffdbc8]/20'
                    : 'border-[#e9e0e2] bg-white hover:bg-[#f4eced]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="branch"
                    checked={branch === 'qahira'}
                    onChange={() => setBranch('qahira')}
                    className="w-5 h-5 accent-[#954500] cursor-pointer"
                  />
                  <div>
                    <p className="text-[0.875rem] font-bold text-[#1e1b1c]">فرع حي القاهرة - مجاور جامع النداء</p>
                    <p className="text-[0.75rem] text-[#574337]">قسم خاص بتوضيب المحركات الحديثة والسريعة</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#574337] text-[20px]">directions_walk</span>
              </label>
            </div>
          </div>
        )}

        {/* Mobile Service Zone Selector */}
        {serviceType === 'mobile' && (
          <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#faf1f3] border border-[#e9e0e2]">
            <div className="flex items-center justify-between">
              <label className="text-[0.875rem] font-bold text-[#1e1b1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#954500] text-[20px]">local_shipping</span>
                <span>خدمة الفيتر المتنقل (بغداد فقط)</span>
              </label>
              <span className="text-[0.75rem] text-[#954500] bg-[#ffdbc8]/40 px-2 py-0.5 rounded-full font-bold">
                خلال 60 دقيقة
              </span>
            </div>

            <p className="text-[0.8125rem] text-[#574337] leading-relaxed">
              تصلك ورشتنا المتنقلة المزودة بجميع العدد وقطع الغيار الاستهلاكية أينما كنت.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-bold text-[#1e1b1c]">منطقة التواجد في بغداد</label>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-12 pr-10 pl-4 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] appearance-none focus:outline-none border border-[#e9e0e2] shadow-sm"
                >
                  {BAGHDAD_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.eta})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-[#574337] pointer-events-none text-[20px]">
                  location_city
                </span>
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-[#574337] pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-bold text-[#1e1b1c]">العنوان بالتفصيل أو أقرب نقطة دالة</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: الكرادة خارج، مجاور مرطبات الفقمة، عمارة 12"
                  className="w-full h-12 pr-10 pl-4 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] focus:outline-none border border-[#e9e0e2] shadow-sm placeholder:text-[#574337]/60"
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-[#954500] text-[20px]">
                  pin_drop
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Motorcycle Details Card */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#faf1f3] shadow-sm border border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">two_wheeler</span>
            <h2 className="text-[1.125rem] font-bold text-[#1e1b1c]">بيانات الدراجة النارية</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-bold text-[#1e1b1c]">الشركة المصنعة</label>
              <div className="relative">
                <select
                  value={bikeMake}
                  onChange={(e) => setBikeMake(e.target.value)}
                  className="w-full h-12 pr-3 pl-8 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] appearance-none focus:outline-none border border-[#e9e0e2] shadow-sm"
                >
                  <option value="باجاج (Bajaj)">باجاج (Bajaj)</option>
                  <option value="تيفي إس (TVS)">تيفي إس (TVS)</option>
                  <option value="هوندا (Honda)">هوندا (Honda)</option>
                  <option value="ياماها (Yamaha)">ياماها (Yamaha)</option>
                  <option value="دايون (Dayun)">دايون (Dayun)</option>
                  <option value="سوزوكي (Suzuki)">سوزوكي (Suzuki)</option>
                  <option value="أخرى">أخرى</option>
                </select>
                <span className="material-symbols-outlined absolute left-2.5 top-3.5 text-[#574337] pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-bold text-[#1e1b1c]">الموديل (الطراز)</label>
              <input
                type="text"
                value={bikeModel}
                onChange={(e) => setBikeModel(e.target.value)}
                placeholder="مثال: بوكسر 150 / HLX"
                className="w-full h-12 px-3 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] focus:outline-none border border-[#e9e0e2] shadow-sm placeholder:text-[#574337]/60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.75rem] font-bold text-[#1e1b1c]">سنة الصنع</label>
            <div className="relative">
              <select
                value={bikeYear}
                onChange={(e) => setBikeYear(e.target.value)}
                className="w-full h-12 pr-3 pl-8 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] appearance-none focus:outline-none border border-[#e9e0e2] shadow-sm"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019 أو أقدم">2019 أو أقدم</option>
              </select>
              <span className="material-symbols-outlined absolute left-2.5 top-3.5 text-[#574337] pointer-events-none text-[18px]">
                calendar_today
              </span>
            </div>
          </div>
        </div>

        {/* Required Service Type */}
        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#faf1f3] shadow-sm border border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">mobile_arrow_right</span>
            <h2 className="text-[1.125rem] font-bold text-[#1e1b1c]">نوع الصيانة المطلوبة</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'oil', label: 'صيانة دورية وتبديل زيت وفلاتر', badge: 'الأكثر طلباً' },
              { id: 'brakes', label: 'فحص منظومة الفرامل والدسك' },
              { id: 'engine', label: 'توضيب محرك (نص عمرة / تجفيت كامل)' },
              { id: 'electrical', label: 'كهربائيات، دينمو، وبطارية' },
              { id: 'inspection', label: 'فحص شامل وعطل عام غير محدد' },
            ].map((service) => {
              const isChecked = selectedServices.includes(service.label);
              return (
                <label
                  key={service.id}
                  onClick={() => toggleService(service.label)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer shadow-sm border transition-all ${
                    isChecked
                      ? 'border-[#954500] bg-[#ffdbc8]/25'
                      : 'border-[#e9e0e2] bg-white hover:bg-[#f4eced]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 accent-[#954500] rounded cursor-pointer"
                    />
                    <span className="text-[0.875rem] font-semibold text-[#1e1b1c]">{service.label}</span>
                  </div>
                  {service.badge && (
                    <span className="text-[0.75rem] text-[#954500] font-bold">{service.badge}</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Detailed Problem Description */}
        <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-[#faf1f3] shadow-sm border border-[#e9e0e2]">
          <label className="text-[0.875rem] font-bold text-[#1e1b1c] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#954500] text-[20px]">notes</span>
            <span>وصف العطل أو الصوت بالتفصيل</span>
          </label>
          <textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="اشرح لنا المشكلة، مثل: خنقة عند السرعة العالية، طقة في العجلة الخلفية، تهريب زيت خفيف..."
            rows={3}
            className="w-full p-3 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] focus:outline-none border border-[#e9e0e2] shadow-sm placeholder:text-[#574337]/60 resize-none"
          />
        </div>

        {/* Media Upload (Photo / Video / Voice) */}
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#faf1f3] shadow-sm border border-[#e9e0e2]">
          <div className="flex items-center justify-between">
            <label className="text-[0.875rem] font-bold text-[#1e1b1c] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#954500] text-[20px]">perm_media</span>
              <span>رفع صورة العطل أو تسجيل صوت المحرك</span>
            </label>
            <span className="text-[0.75rem] text-[#574337]">اختياري</span>
          </div>

          <label className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border-2 border-dashed border-[#ddc1b2] text-center cursor-pointer hover:bg-[#f4eced] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#ffdbc8] flex items-center justify-center text-[#321300] mb-2">
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
            </div>
            <p className="text-[0.875rem] font-bold text-[#1e1b1c]">
              {hasUploadedFile ? 'تم رفع الملف بنجاح (جاهز للفحص)' : 'اضغط لرفع فيديو أو صورة أو مقطع صوتي'}
            </p>
            <p className="text-[0.75rem] text-[#574337] mt-0.5">
              يساعد فني الصيانة في جلب القطع المطابقة فوراً (الحد الأقصى 25 ميجابايت)
            </p>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Preferred Date & Time */}
        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#faf1f3] shadow-sm border border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">event_available</span>
            <h2 className="text-[1.125rem] font-bold text-[#1e1b1c]">موعد الحجز المفضل</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-bold text-[#1e1b1c]">اليوم المطلوب</label>
              <div className="relative">
                <select
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  className="w-full h-12 pr-3 pl-8 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] appearance-none focus:outline-none border border-[#e9e0e2] shadow-sm"
                >
                  <option value="اليوم (فوري)">اليوم (فوري)</option>
                  <option value="غداً">غداً</option>
                  <option value="بعد غد">بعد غد</option>
                </select>
                <span className="material-symbols-outlined absolute left-2.5 top-3.5 text-[#574337] pointer-events-none text-[18px]">
                  today
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[0.75rem] font-bold text-[#1e1b1c]">الفترة المناسبة</label>
              <div className="relative">
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full h-12 pr-3 pl-8 rounded-lg bg-white text-[#1e1b1c] text-[0.875rem] appearance-none focus:outline-none border border-[#e9e0e2] shadow-sm"
                >
                  <option value="صباحاً (9:00 ص - 1:00 م)">صباحاً (9:00 ص - 1:00 م)</option>
                  <option value="عصراً (2:00 م - 6:00 م)">عصراً (2:00 م - 6:00 م)</option>
                  <option value="مساءً (6:00 م - 10:00 م)">مساءً (6:00 م - 10:00 م)</option>
                </select>
                <span className="material-symbols-outlined absolute left-2.5 top-3.5 text-[#574337] pointer-events-none text-[18px]">
                  schedule
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Transparency Alert Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#efe6e7] text-[#1e1b1c] shadow-sm border border-[#e9e0e2]">
          <span className="material-symbols-outlined text-[#954500] text-[24px] flex-shrink-0 mt-0.5">
            info
          </span>
          <div className="flex flex-col">
            <p className="text-[0.875rem] font-bold text-[#954500]">تنبيه إرشادي وشفافية الأسعار:</p>
            <p className="text-[0.8125rem] text-[#1e1b1c] leading-snug mt-0.5">
              سيتم التواصل معك هاتفياً من قبل إدارة الورشة لتأكيد الموعد والتكلفة التقديرية بناءً على نوع العطل وتوفر الفنيين قبل بدء العمل.
            </p>
          </div>
        </div>

        {/* Primary Action CTA */}
        <button
          type="submit"
          className="w-full h-[52px] rounded-lg bg-[#954500] hover:bg-[#bb5800] active:scale-[0.99] text-white font-bold text-[1rem] flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">send</span>
          <span>تأكيد إرسال طلب الصيانة</span>
        </button>
      </form>

      {/* Emergency Quick Call / WhatsApp Mechanics Card */}
      <div className="mt-4 p-4 rounded-xl bg-[#faf1f3] shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">sos</span>
            <div>
              <h3 className="text-[0.875rem] font-bold text-[#1e1b1c]">دراجتك عاطلة في الطريق؟</h3>
              <p className="text-[0.75rem] text-[#574337]">طوارئ الصيانة والإنقاذ السريع في شوارع بغداد</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] text-[0.75rem] font-bold">
            24/7 طوارئ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:07712345678"
            className="flex items-center justify-center gap-2 h-11 rounded-lg bg-[#5a5e6b] hover:bg-[#434752] text-white text-[0.875rem] font-bold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
            <span>اتصال بالفيتر</span>
          </a>
          <a
            href="https://wa.me/9647712345678"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 rounded-lg bg-[#2c690b] hover:bg-[#1d5200] text-white text-[0.875rem] font-bold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>مراسلة واتساب</span>
          </a>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 flex flex-col items-center text-center shadow-2xl transition-all border border-[#e9e0e2]">
            <div className="w-16 h-16 rounded-full bg-[#aff589] text-[#072100] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="text-[1.25rem] font-bold text-[#1e1b1c] mb-1">تم تسجيل طلبك بنجاح!</h3>
            <p className="text-[0.875rem] text-[#574337] mb-4 leading-relaxed">
              رقم الحجز الخاص بك هو{' '}
              <span className="font-bold text-[#954500] font-mono">#{confirmedBookingId}</span>.
              سيتصل بك مهندس الصيانة خلال 15 دقيقة لتأكيد الموعد وقطع الغيار المطلوبة.
            </p>
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  onViewOrders();
                }}
                className="w-full h-11 rounded-lg bg-[#954500] hover:bg-[#bb5800] text-white font-bold text-[0.875rem] transition-all active:scale-95"
              >
                متابعة حالة الحجز في طلباتي
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="w-full h-10 rounded-lg bg-[#f4eced] text-[#1e1b1c] text-[0.875rem] font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
