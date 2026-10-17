import React, { useState } from 'react';
import { Product, BikeProfile } from '../types';
import { PRODUCTS, CATEGORIES, BRANDS } from '../data/mockData';

interface HomeScreenProps {
  currentBike: BikeProfile;
  onOpenBikeModal: () => void;
  onOpenScanner: () => void;
  onOpenSearch: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBookMaintenance: (mode: 'workshop' | 'mobile') => void;
  onOpenCategories: (categoryFilter?: string) => void;
  onToggleFavorite: (productId: string) => void;
  favoriteIds: string[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentBike,
  onOpenBikeModal,
  onOpenScanner,
  onOpenSearch,
  onSelectProduct,
  onAddToCart,
  onBookMaintenance,
  onOpenCategories,
  onToggleFavorite,
  favoriteIds,
}) => {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);

  // Products from mock data
  const motulProduct = PRODUCTS.find((p) => p.id === 'motul-7100-oil') || PRODUCTS[1];
  const nissinProduct = PRODUCTS.find((p) => p.id === 'nissin-ceramic-pads') || PRODUCTS[2];
  const yuasaProduct = PRODUCTS.find((p) => p.id === 'yuasa-gel-battery') || PRODUCTS[3];
  const didProduct = PRODUCTS.find((p) => p.id === 'did-drive-chain') || PRODUCTS[4];
  const bremboProduct = PRODUCTS[0];

  return (
    <div className="flex flex-col w-full pb-24 pt-16 max-w-2xl mx-auto space-y-5">
      {/* Branch Availability Ticker Strip */}
      <section className="px-4 pt-1">
        <div className="bg-[#f4eced] rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#2c690b] animate-pulse"></span>
              <span className="text-[0.75rem] text-[#1e1b1c] font-semibold">فرع الدورة:</span>
              <span className="text-[0.75rem] text-[#2c690b]">مفتوح الآن</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#2c690b] animate-pulse"></span>
              <span className="text-[0.75rem] text-[#1e1b1c] font-semibold">فرع القاهرة:</span>
              <span className="text-[0.75rem] text-[#2c690b]">مفتوح الآن</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 text-[#574337] text-[0.75rem]">
            <span className="material-symbols-outlined text-[16px] text-[#954500]">local_shipping</span>
            <span className="hidden sm:inline">توصيل لكافة المحافظات</span>
            <span className="sm:hidden">لكل العراق</span>
          </div>
        </div>
      </section>

      {/* Search & Barcode Scan & Quick Bike Fitment Bar */}
      <section className="px-4 space-y-2.5">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 cursor-pointer" onClick={onOpenSearch}>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#574337]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              readOnly
              className="w-full h-12 pr-10 pl-11 bg-white rounded-lg text-[0.875rem] text-[#1e1b1c] placeholder:text-[#574337]/70 cursor-pointer shadow-sm border border-[#e9e0e2] focus:outline-none"
              placeholder="ابحث عن قطعة غيار أو منتج أو رقم القطعة..."
              type="text"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenScanner();
              }}
              className="absolute inset-y-0 left-2 my-auto w-8 h-8 flex items-center justify-center rounded-md text-[#574337] hover:text-[#954500] active:scale-90 transition-transform"
              title="مسح الباركود"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
            </button>
          </div>

          <button
            onClick={onOpenBikeModal}
            className="h-12 px-3 bg-[#5a5e6b] hover:bg-[#434752] text-white rounded-lg text-[0.875rem] font-semibold flex items-center gap-1.5 shadow-sm active:translate-y-0.5 transition-all flex-shrink-0"
            id="bikeFilterToggle"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
            <span className="text-[0.75rem]">دراجتي</span>
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </button>
        </div>

        {/* Active Vehicle Compatibility Strip */}
        <div className="bg-[#954500]/10 rounded-lg p-2.5 flex items-center justify-between gap-2 border border-[#954500]/15">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#954500] text-[20px] flex-shrink-0">check_circle</span>
            <div className="truncate">
              <span className="text-[0.75rem] text-[#574337]">القطع المتوافقة مع: </span>
              <span className="text-[0.75rem] font-bold text-[#954500] truncate">
                {currentBike.make} {currentBike.model} (موديل {currentBike.year})
              </span>
            </div>
          </div>
          <button
            onClick={onOpenBikeModal}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline flex-shrink-0 cursor-pointer"
          >
            تغيير
          </button>
        </div>
      </section>

      {/* Hero Promotional Banner */}
      <section className="px-4">
        <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-[#5a5e6b] text-white p-5 flex flex-col justify-between min-h-[160px]">
          <div className="absolute -left-6 -bottom-8 w-44 h-44 rounded-full bg-[#954500]/20 pointer-events-none"></div>
          <div className="absolute left-3 top-2 opacity-15 pointer-events-none text-[#ffb68b]">
            <span className="material-symbols-outlined text-[120px]">oil_barrel</span>
          </div>
          <div className="relative z-10 space-y-1.5 max-w-[75%]">
            <span className="inline-block bg-[#954500] text-white text-[0.75rem] px-2.5 py-0.5 rounded-full font-bold">
              عرض الأسبوع الحصري
            </span>
            <h2 className="text-[1.375rem] sm:text-[1.5rem] font-bold leading-tight">
              خصم 15% على زيوت وسوائل المحركات الأصلية
            </h2>
            <p className="text-[0.875rem] text-[#dfe2f1] opacity-90 leading-relaxed">
              موتول، كاسترول، وياماها بأعلى جودة وضمان أصلي 100%
            </p>
          </div>
          <div className="relative z-10 pt-3 flex items-center gap-3">
            <button
              onClick={() => onSelectProduct(motulProduct)}
              className="h-10 px-5 bg-[#954500] text-white rounded-lg text-[0.875rem] font-bold flex items-center gap-1 shadow hover:bg-[#bb5800] active:scale-95 transition-all"
            >
              <span>تسوق الآن</span>
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <span className="text-[0.75rem] text-[#dfe2f1]">ينتهي بعد: 3 أيام</span>
          </div>
        </div>
      </section>

      {/* Categories Grid Mosaic */}
      <section className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">category</span>
            <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">الأقسام وقطع الغيار</h3>
          </div>
          <button
            onClick={() => onOpenCategories()}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            عرض الكل
          </button>
        </div>

        <div className="px-4 grid grid-cols-4 gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onOpenCategories(cat.id)}
              className="flex flex-col items-center p-2 rounded-xl bg-white hover:bg-[#f4eced] shadow-sm active:scale-95 transition-all text-center border border-[#e9e0e2]/60"
            >
              <div className="w-12 h-12 rounded-lg bg-[#f4eced] flex items-center justify-center text-[#954500] mb-1.5">
                <span className="material-symbols-outlined text-[26px]">{cat.icon}</span>
              </div>
              <span className="text-[0.75rem] font-semibold text-[#1e1b1c] leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Maintenance Booking Dual Banner */}
      <section className="px-4">
        <div className="bg-[#efe6e7] rounded-xl p-4 space-y-3 shadow-sm border border-[#e9e0e2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#954500] text-[22px]">home_repair_service</span>
              <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">خدمات صيانة دكان سليم</h3>
            </div>
            <span className="text-[0.75rem] text-[#2c690b] bg-[#458325]/20 px-2 py-0.5 rounded font-bold">
              فيتر معتمد
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* In-Workshop Maintenance */}
            <div className="bg-white rounded-lg p-3 flex flex-col justify-between space-y-3 shadow-sm hover:shadow transition-shadow border border-[#e9e0e2]/50">
              <div className="space-y-1">
                <div className="w-9 h-9 rounded-md bg-[#5a5e6b]/10 flex items-center justify-center text-[#5a5e6b]">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
                <h4 className="text-[0.875rem] font-bold text-[#1e1b1c]">صيانة الورشة</h4>
                <p className="text-[0.75rem] text-[#574337] line-clamp-2 leading-relaxed">
                  احجز دورك المسبق في ورشات الدورة أو القاهرة وتجنب الانتظار.
                </p>
              </div>
              <button
                onClick={() => onBookMaintenance('workshop')}
                className="w-full h-9 bg-[#5a5e6b] hover:bg-[#434752] text-white rounded-lg text-[0.75rem] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                <span>حجز موعد ورشة</span>
              </button>
            </div>

            {/* On-Site Mobile Van Maintenance */}
            <div className="bg-white rounded-lg p-3 flex flex-col justify-between space-y-3 shadow-sm hover:shadow transition-shadow border border-[#e9e0e2]/50">
              <div className="space-y-1">
                <div className="w-9 h-9 rounded-md bg-[#954500]/10 flex items-center justify-center text-[#954500]">
                  <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                </div>
                <h4 className="text-[0.875rem] font-bold text-[#1e1b1c]">الفيتر الجوّال</h4>
                <p className="text-[0.75rem] text-[#574337] line-clamp-2 leading-relaxed">
                  صيانة وتبديل قطع في موقعك داخل بغداد (الكرخ والرصافة).
                </p>
              </div>
              <button
                onClick={() => onBookMaintenance('mobile')}
                className="w-full h-9 bg-[#954500] hover:bg-[#bb5800] text-white rounded-lg text-[0.75rem] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                <span>طلب فيتر فوري</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Carousel / Cards Grid */}
      <section className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">local_fire_department</span>
            <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">الأكثر مبيعاً</h3>
          </div>
          <button
            onClick={() => onOpenCategories()}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            مشاهدة المزيد
          </button>
        </div>

        <div className="px-4 grid grid-cols-2 gap-3">
          {/* Product Card 1: Motul Oil */}
          <div className="bg-white rounded-xl p-3 flex flex-col justify-between shadow-sm relative group border border-[#e9e0e2]">
            <button
              onClick={() => onToggleFavorite(motulProduct.id)}
              className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/80 text-[#574337] hover:text-[#ba1a1a] flex items-center justify-center shadow-sm"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  favoriteIds.includes(motulProduct.id) ? 'text-[#ba1a1a] fill' : ''
                }`}
              >
                favorite
              </span>
            </button>
            <span className="absolute top-2.5 right-2.5 z-10 bg-[#458325] text-[#f8ffee] text-[10px] px-2 py-0.5 rounded-full font-bold">
              أصلي 100%
            </span>

            <div
              onClick={() => onSelectProduct(motulProduct)}
              className="w-full h-32 rounded-lg bg-[#f4eced] overflow-hidden mb-2 relative flex items-center justify-center cursor-pointer"
            >
              <img
                alt={motulProduct.name}
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                src={motulProduct.images[0]}
              />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[0.75rem] text-[#5a5e6b] block font-medium">موتول فرنسا</span>
                <h4
                  onClick={() => onSelectProduct(motulProduct)}
                  className="text-[0.875rem] font-bold text-[#1e1b1c] line-clamp-2 cursor-pointer hover:text-[#954500]"
                >
                  {motulProduct.name}
                </h4>
              </div>

              <div className="flex items-center gap-1 text-[#2c690b] text-[0.75rem] pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2c690b]"></span>
                <span>متوفر بفرعي الدورة والقاهرة</span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-1">
                <div className="flex flex-col">
                  <span className="text-[1.25rem] font-bold text-[#954500]">
                    {motulProduct.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-[#574337] -mt-1">دينار عراقي</span>
                </div>
                <button
                  onClick={() => onAddToCart(motulProduct, 1)}
                  className="w-10 h-10 rounded-lg bg-[#954500] text-white flex items-center justify-center shadow hover:bg-[#bb5800] active:scale-90 transition-transform"
                  title="إضافة للسلة"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Card 2: Nissin Ceramic Brake Pads */}
          <div className="bg-white rounded-xl p-3 flex flex-col justify-between shadow-sm relative group border border-[#e9e0e2]">
            <button
              onClick={() => onToggleFavorite(nissinProduct.id)}
              className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/80 text-[#574337] hover:text-[#ba1a1a] flex items-center justify-center shadow-sm"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  favoriteIds.includes(nissinProduct.id) ? 'text-[#ba1a1a] fill' : ''
                }`}
              >
                favorite
              </span>
            </button>
            <span className="absolute top-2.5 right-2.5 z-10 bg-[#bb5800] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              شائع
            </span>

            <div
              onClick={() => onSelectProduct(nissinProduct)}
              className="w-full h-32 rounded-lg bg-[#f4eced] overflow-hidden mb-2 relative flex items-center justify-center cursor-pointer"
            >
              <img
                alt={nissinProduct.name}
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                src={nissinProduct.images[0]}
              />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[0.75rem] text-[#5a5e6b] block font-medium">نيسين اليابان</span>
                <h4
                  onClick={() => onSelectProduct(nissinProduct)}
                  className="text-[0.875rem] font-bold text-[#1e1b1c] line-clamp-2 cursor-pointer hover:text-[#954500]"
                >
                  {nissinProduct.name}
                </h4>
              </div>

              <div className="flex items-center gap-1 text-[#2c690b] text-[0.75rem] pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2c690b]"></span>
                <span>متوفر في فرع الدورة</span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-1">
                <div className="flex flex-col">
                  <span className="text-[1.25rem] font-bold text-[#954500]">
                    {nissinProduct.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-[#574337] -mt-1">دينار عراقي</span>
                </div>
                <button
                  onClick={() => onAddToCart(nissinProduct, 1)}
                  className="w-10 h-10 rounded-lg bg-[#954500] text-white flex items-center justify-center shadow hover:bg-[#bb5800] active:scale-90 transition-transform"
                  title="إضافة للسلة"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brembo Card Showcase */}
      <section className="px-4">
        <div
          onClick={() => onSelectProduct(bremboProduct)}
          className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e9e0e2] flex items-center justify-between gap-3 cursor-pointer hover:border-[#954500] transition-colors"
        >
          <div className="w-20 h-20 rounded-lg bg-[#f4eced] p-1 flex-shrink-0 flex items-center justify-center">
            <img src={bremboProduct.images[0]} alt="سفايف بريمبو" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] bg-[#2c690b]/15 text-[#2c690b] font-bold px-2 py-0.5 rounded">
                أصلي معتمد 100%
              </span>
              <span className="text-[10px] text-[#954500] font-bold font-mono">BREMBO ITALY</span>
            </div>
            <h4 className="text-[0.875rem] font-bold text-[#1e1b1c] truncate">{bremboProduct.name}</h4>
            <p className="text-[0.75rem] text-[#574337] line-clamp-1">سيراميك حراري مضغوط - كفاءة كبح فائقة</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[1rem] font-bold text-[#954500]">35,000 د.ع</span>
              <span className="text-[0.75rem] text-[#574337] line-through">42,000 د.ع</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#954500] text-[24px]">chevron_left</span>
        </div>
      </section>

      {/* Special Offers Section with Discount Tags */}
      <section className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">percent</span>
            <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">عروض خاصة وتخفيضات</h3>
          </div>
          <button
            onClick={() => onOpenCategories()}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            كل العروض
          </button>
        </div>

        <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {/* Promo Item 1: Yuasa Battery */}
          <div className="min-w-[240px] max-w-[240px] bg-white rounded-xl p-3 shadow-sm flex flex-col justify-between relative border border-[#e9e0e2]">
            <span className="absolute top-2.5 right-2.5 z-10 bg-[#ba1a1a] text-white text-[0.75rem] px-2 py-0.5 rounded-full font-bold">
              خصم 20%
            </span>
            <div
              onClick={() => onSelectProduct(yuasaProduct)}
              className="w-full h-28 bg-[#f4eced] rounded-lg overflow-hidden mb-2 flex items-center justify-center cursor-pointer"
            >
              <img
                alt={yuasaProduct.name}
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                src={yuasaProduct.images[0]}
              />
            </div>
            <div className="space-y-1">
              <h4
                onClick={() => onSelectProduct(yuasaProduct)}
                className="text-[0.875rem] font-bold text-[#1e1b1c] truncate cursor-pointer hover:text-[#954500]"
              >
                {yuasaProduct.name}
              </h4>
              <p className="text-[0.75rem] text-[#574337] truncate">عمر طويل مع ضمان استبدال 6 أشهر</p>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-[1.125rem] font-bold text-[#954500]">
                  {yuasaProduct.price.toLocaleString('en-US')} د.ع
                </span>
                <span className="text-[0.75rem] text-[#574337] line-through">40,000 د.ع</span>
              </div>
            </div>
            <button
              onClick={() => onAddToCart(yuasaProduct, 1)}
              className="w-full mt-3 h-9 bg-[#954500] hover:bg-[#bb5800] text-white rounded-lg text-[0.75rem] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>إضافة سريعة</span>
            </button>
          </div>

          {/* Promo Item 2: DID Chain */}
          <div className="min-w-[240px] max-w-[240px] bg-white rounded-xl p-3 shadow-sm flex flex-col justify-between relative border border-[#e9e0e2]">
            <span className="absolute top-2.5 right-2.5 z-10 bg-[#ba1a1a] text-white text-[0.75rem] px-2 py-0.5 rounded-full font-bold">
              خصم 25%
            </span>
            <div
              onClick={() => onSelectProduct(didProduct)}
              className="w-full h-28 bg-[#f4eced] rounded-lg overflow-hidden mb-2 flex items-center justify-center cursor-pointer"
            >
              <img
                alt={didProduct.name}
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                src={didProduct.images[0]}
              />
            </div>
            <div className="space-y-1">
              <h4
                onClick={() => onSelectProduct(didProduct)}
                className="text-[0.875rem] font-bold text-[#1e1b1c] truncate cursor-pointer hover:text-[#954500]"
              >
                {didProduct.name}
              </h4>
              <p className="text-[0.75rem] text-[#574337] truncate">صلابة فائقة ومقاوم للصدأ والاحتكاك</p>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-[1.125rem] font-bold text-[#954500]">
                  {didProduct.price.toLocaleString('en-US')} د.ع
                </span>
                <span className="text-[0.75rem] text-[#574337] line-through">25,000 د.ع</span>
              </div>
            </div>
            <button
              onClick={() => onAddToCart(didProduct, 1)}
              className="w-full mt-3 h-9 bg-[#954500] hover:bg-[#bb5800] text-white rounded-lg text-[0.75rem] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>إضافة سريعة</span>
            </button>
          </div>
        </div>
      </section>

      {/* Brand Hub (Bajaj, Honda, Yamaha, Suzuki, TVS) */}
      <section className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">stars</span>
            <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">وصل حديثاً حسب الشركة</h3>
          </div>
          <span className="text-[0.75rem] text-[#574337]">قطع أصلية ومضمونة</span>
        </div>

        <div className="px-4 flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {BRANDS.map((brand) => {
            const isSelected = selectedBrandFilter === brand.id;
            return (
              <button
                key={brand.id}
                onClick={() => setSelectedBrandFilter(isSelected ? null : brand.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 border transition-all ${
                  isSelected
                    ? 'bg-[#954500] text-white border-[#954500]'
                    : 'bg-white text-[#1e1b1c] border-[#e9e0e2] hover:bg-[#f4eced]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isSelected ? 'text-white' : 'text-[#954500]'
                  }`}
                >
                  {brand.id === 'bajaj' ? 'verified' : 'two_wheeler'}
                </span>
                <span className="text-[0.875rem] font-bold">{brand.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Iraq Delivery & Trust Banner (COD Only) */}
      <section className="px-4 pt-2">
        <div className="bg-[#f4eced] rounded-xl p-4 space-y-3 border border-[#e9e0e2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#954500]/10 flex items-center justify-center text-[#954500] flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <h4 className="text-[0.875rem] font-bold text-[#1e1b1c]">الدفع نقدًا عند الاستلام فقط</h4>
              <p className="text-[0.75rem] text-[#574337]">
                عاين قطع الغيار وتأكد من مطابقتها قبل دفع أي دينار للمندوب.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[#574337] text-[0.75rem]">
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-[#e9e0e2]/60">
              <span className="material-symbols-outlined text-[#954500] text-[16px]">local_shipping</span>
              <span>شحن لكافة محافظات العراق</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-[#e9e0e2]/60">
              <span className="material-symbols-outlined text-[#954500] text-[16px]">assignment_return</span>
              <span>استبدال واسترجاع سهل</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
