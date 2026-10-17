import React, { useState } from 'react';
import { Product, BikeProfile } from '../types';

interface ProductDetailsScreenProps {
  product: Product;
  currentBike: BikeProfile;
  onAddToCart: (product: Product, quantity: number) => void;
  onInstantBuy: (product: Product, quantity: number) => void;
  onToggleFavorite: (productId: string) => void;
  isFavorite: boolean;
  onBack: () => void;
  onOpenBikeModal: () => void;
}

export const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({
  product,
  currentBike,
  onAddToCart,
  onInstantBuy,
  onToggleFavorite,
  isFavorite,
  onBack,
  onOpenBikeModal,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isCompatModalOpen, setIsCompatModalOpen] = useState(false);
  const [selectedMake, setSelectedMake] = useState('honda');
  const [selectedModel, setSelectedModel] = useState('CBR 600RR - 2019');
  const [isCopiedToast, setIsCopiedToast] = useState(false);

  const images = product.images.length > 0 ? product.images : [product.images[0]];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `${product.name} متوفر الآن في دكان سليم بغداد بسعر ${product.price.toLocaleString('en-US')} د.ع`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      setIsCopiedToast(true);
      setTimeout(() => setIsCopiedToast(false), 2000);
    }
  };

  return (
    <div className="flex flex-col relative w-full pt-16 pb-32 max-w-2xl mx-auto bg-[#fff8f8] min-h-screen">
      {/* Interactive Action Top Bar Quick Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 bg-[#458325]/15 text-[#2c690b] text-[0.75rem] px-2.5 py-1 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-[#2c690b] animate-pulse"></span>
            قطعة أصلية معتمدة 100%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="أضف للمفضلة"
            onClick={() => onToggleFavorite(product.id)}
            className="w-10 h-10 rounded-full bg-[#f4eced] flex items-center justify-center text-[#1e1b1c] hover:bg-[#efe6e7] transition-transform active:scale-90"
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-colors ${
                isFavorite ? 'text-[#ba1a1a] fill' : 'text-[#574337]'
              }`}
            >
              favorite
            </span>
          </button>
          <button
            aria-label="مشاركة القطعة"
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#f4eced] flex items-center justify-center text-[#574337] hover:bg-[#efe6e7] transition-transform active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {isCopiedToast && (
        <div className="mx-4 mb-2 p-2 bg-[#1e1b1c] text-white text-[0.75rem] rounded-lg text-center font-bold">
          تم نسخ رابط القطعة بنجاح!
        </div>
      )}

      {/* Media Gallery Carousel Section */}
      <div className="px-4 my-1">
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#f4eced] shadow-sm flex items-center justify-center border border-[#e9e0e2]">
          <div
            className="w-full h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${currentSlide * 100}%)` }}
          >
            {images.map((img, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 relative bg-[#f4eced] flex items-center justify-center">
                <img
                  src={img}
                  alt={`${product.name} - صورة ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Genuine Seal Badge Overlay */}
          <div className="absolute top-3 right-3 bg-[#332f30]/90 backdrop-blur-md text-[#f7eff0] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
            <span className="material-symbols-outlined text-[16px] text-[#aff589]">verified</span>
            <span className="text-[0.75rem] font-bold tracking-wide">{product.brand.split(' ')[0] || 'GENUINE'}</span>
          </div>

          {/* Discount Tag Badge Overlay */}
          {product.discountPercent && (
            <div className="absolute bottom-3 right-3 bg-[#954500] text-white text-[0.75rem] font-bold px-2.5 py-1 rounded-lg shadow-sm">
              خصم {product.discountPercent}%
            </div>
          )}

          {/* Slide Indicator Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#332f30]/40 backdrop-blur-sm px-2 py-1 rounded-full">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`صورة ${idx + 1}`}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-200 ${
                    idx === currentSlide
                      ? 'w-4 h-2 rounded-full bg-white'
                      : 'w-2 h-2 rounded-full bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Gallery Thumbnails Strip */}
        <div className="flex items-center gap-2 mt-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-14 w-16 rounded-lg overflow-hidden bg-[#efe6e7] transition-all border-2 ${
                currentSlide === idx ? 'border-[#954500] opacity-100 ring-1 ring-[#954500]' : 'border-transparent opacity-60'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center gap-1 bg-[#faf1f3] px-2.5 py-1.5 rounded-lg text-[#574337] text-[0.75rem]">
              <span className="material-symbols-outlined text-[16px]">photo_library</span>
              <span>{images.length} صور زوايا فحص</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Information Card */}
      <div className="px-4 mt-3">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
          {/* Title & Brand Row */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] text-[#954500] font-bold tracking-wider">
                {product.brand}
              </span>
              <div className="flex items-center gap-1 bg-[#efe6e7] px-2 py-0.5 rounded-md">
                <span className="material-symbols-outlined text-[14px] text-[#574337]">qr_code_2</span>
                <span className="text-[0.75rem] text-[#574337] font-mono">{product.sku}</span>
              </div>
            </div>
            <h2 className="text-[1.375rem] font-bold text-[#1e1b1c] leading-snug">
              {product.name}
            </h2>
            {product.englishName && (
              <p className="text-[0.875rem] text-[#574337] leading-relaxed">
                {product.englishName}
              </p>
            )}
          </div>

          {/* Rating and Trust Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-[#bb5800]">
                <span className="material-symbols-outlined text-[18px] fill">star</span>
                <span className="material-symbols-outlined text-[18px] fill">star</span>
                <span className="material-symbols-outlined text-[18px] fill">star</span>
                <span className="material-symbols-outlined text-[18px] fill">star</span>
                <span className="material-symbols-outlined text-[18px] fill">star_half</span>
              </div>
              <span className="text-[0.875rem] font-bold text-[#1e1b1c]">{product.rating}</span>
              <span className="text-[0.875rem] text-[#574337]">({product.reviewCount} فيتر وصاحب دراجة)</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[0.75rem] text-[#2c690b] font-bold bg-[#458325]/10 px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[14px]">local_shipping</span>
              شحن فوري بغداد
            </span>
          </div>

          {/* Pricing Bar */}
          <div className="mt-1 p-3 rounded-lg bg-[#faf1f3] flex items-center justify-between border border-[#e9e0e2]/60">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-[1.375rem] font-bold text-[#954500]">
                  {product.price.toLocaleString('en-US')}
                </span>
                <span className="text-[0.875rem] font-bold text-[#954500]">د.ع</span>
                {product.originalPrice && (
                  <span className="line-through text-[0.875rem] text-[#574337]/70 mr-1">
                    {product.originalPrice.toLocaleString('en-US')} د.ع
                  </span>
                )}
              </div>
              <span className="text-[0.75rem] text-[#574337]">السعر يشمل الضريبة ورسوم فحص الجودة</span>
            </div>

            {product.originalPrice && (
              <div className="bg-[#954500]/10 text-[#954500] px-3 py-1.5 rounded-lg flex flex-col items-center">
                <span className="text-[0.75rem] font-bold">
                  وفّر {(product.originalPrice - product.price).toLocaleString('en-US')}
                </span>
                <span className="text-[0.75rem]">دينار عراقي</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Motorcycle Compatibility Section */}
      <div className="px-4 mt-3">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#954500] text-[22px]">two_wheeler</span>
              <h3 className="text-[1.125rem] text-[#1e1b1c] font-bold">مدى التوافق مع الدراجات</h3>
            </div>
            <span className="bg-[#dcdfee] text-[#5e626f] px-2 py-0.5 rounded text-[0.75rem] font-bold">
              {product.compatibleBikes.length} فئات مدعومة
            </span>
          </div>

          <div className="p-3 bg-[#f4eced] rounded-lg flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#2c690b] text-[20px] mt-0.5 fill">
                check_circle
              </span>
              <div className="flex flex-col">
                <span className="text-[0.875rem] text-[#1e1b1c] font-bold">
                  متوافق ومُختبر على الدراجات التالية:
                </span>
                <p className="text-[0.875rem] text-[#574337] mt-0.5 leading-relaxed">
                  {product.compatibleBikes.join('، ')}.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCompatModalOpen(true)}
              className="mt-2 w-full h-11 bg-[#e9e0e2] hover:bg-[#efe6e7] text-[#1e1b1c] rounded-lg flex items-center justify-center gap-2 text-[0.875rem] font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>افحص التوافق مع دراجتك المحددة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warehouse & Branch Stock Availability (Baghdad Hubs) */}
      <div className="px-4 mt-3">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1e1b1c] text-[22px]">storefront</span>
              <h3 className="text-[1.125rem] text-[#1e1b1c] font-bold">توفر القطعة في الفروع (بغداد)</h3>
            </div>
            <span className="text-[0.75rem] text-[#2c690b] font-bold">محدث لحظياً</span>
          </div>

          <div className="space-y-2">
            {/* Dora Branch */}
            <div className="p-3 bg-[#faf1f3] rounded-lg flex items-center justify-between border border-[#e9e0e2]/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#458325]/15 text-[#2c690b] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] font-bold text-[#1e1b1c]">فرع بغداد - الدورة</span>
                    <span className="bg-[#2c690b]/10 text-[#2c690b] px-1.5 py-0.5 rounded text-[11px] font-bold">
                      جاهز للاستلام
                    </span>
                  </div>
                  <span className="text-[0.75rem] text-[#574337]">شارع المصافي قرب ساحة الزيوت • الرف A-12</span>
                </div>
              </div>
              <div className="text-left flex flex-col items-end">
                <span className="text-[1.25rem] font-bold text-[#2c690b]">{product.stockLocations.dora}</span>
                <span className="text-[0.75rem] text-[#2c690b] font-bold">قطع متوفرة</span>
              </div>
            </div>

            {/* Cairo Branch */}
            <div className="p-3 bg-[#faf1f3] rounded-lg flex items-center justify-between border border-[#e9e0e2]/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#458325]/15 text-[#2c690b] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] font-bold text-[#1e1b1c]">فرع حي القاهرة - الرصافة</span>
                    <span className="bg-[#2c690b]/10 text-[#2c690b] px-1.5 py-0.5 rounded text-[11px] font-bold">
                      استلام خلال ساعتين
                    </span>
                  </div>
                  <span className="text-[0.75rem] text-[#574337]">قرب تقاطع الصحة • الرف B-04</span>
                </div>
              </div>
              <div className="text-left flex flex-col items-end">
                <span className="text-[1.25rem] font-bold text-[#2c690b]">{product.stockLocations.cairo}</span>
                <span className="text-[0.75rem] text-[#2c690b] font-bold">قطع متوفرة</span>
              </div>
            </div>

            {/* Sinak / Logistics Central */}
            <div className="p-3 bg-[#faf1f3] rounded-lg flex items-center justify-between border border-[#e9e0e2]/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#dcdfee] text-[#5a5e6b] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warehouse</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] font-bold text-[#1e1b1c]">مستودع السنك الرئيسي</span>
                    <span className="bg-[#dcdfee] text-[#5e626f] px-1.5 py-0.5 rounded text-[11px] font-bold">
                      شحن سريع
                    </span>
                  </div>
                  <span className="text-[0.75rem] text-[#574337]">مخصص للطلبات الأونلاين والتوزيع</span>
                </div>
              </div>
              <div className="text-left flex flex-col items-end">
                <span className="text-[1.25rem] font-bold text-[#5a5e6b]">{product.stockLocations.sinak}</span>
                <span className="text-[0.75rem] text-[#5a5e6b] font-bold">قطعة متوفرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Table */}
      <div className="px-4 mt-3">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">precision_manufacturing</span>
            <h3 className="text-[1.125rem] text-[#1e1b1c] font-bold">المواصفات الفنية المعتمدة</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[#1e1b1c]">
            {product.specs.material && (
              <div className="bg-[#f4eced] p-2.5 rounded-lg flex flex-col">
                <span className="text-[0.75rem] text-[#574337]">مادة تركيبة الاحتكاك</span>
                <span className="text-[0.875rem] font-bold mt-0.5">{product.specs.material}</span>
              </div>
            )}
            {product.specs.origin && (
              <div className="bg-[#f4eced] p-2.5 rounded-lg flex flex-col">
                <span className="text-[0.75rem] text-[#574337]">بلد المنشأ</span>
                <span className="text-[0.875rem] font-bold mt-0.5">{product.specs.origin}</span>
              </div>
            )}
            {product.specs.position && (
              <div className="bg-[#f4eced] p-2.5 rounded-lg flex flex-col">
                <span className="text-[0.75rem] text-[#574337]">موضع التركيب</span>
                <span className="text-[0.875rem] font-bold mt-0.5">{product.specs.position}</span>
              </div>
            )}
            {product.specs.heatResistance && (
              <div className="bg-[#f4eced] p-2.5 rounded-lg flex flex-col">
                <span className="text-[0.75rem] text-[#574337]">مقاومة درجات الحرارة</span>
                <span className="text-[0.875rem] font-bold mt-0.5">{product.specs.heatResistance}</span>
              </div>
            )}
          </div>

          {product.mechanicNote && (
            <p className="text-[0.875rem] text-[#574337] bg-[#faf1f3] p-3 rounded-lg leading-relaxed border border-[#e9e0e2]/50">
              {product.mechanicNote}
            </p>
          )}
        </div>
      </div>

      {/* Delivery & Payment Notice Bar */}
      <div className="px-4 mt-3">
        <div className="bg-[#efe6e7]/70 p-4 rounded-xl flex items-start gap-3 border border-[#e9e0e2]">
          <div className="w-10 h-10 rounded-full bg-[#954500]/10 text-[#954500] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[22px]">payments</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[0.875rem] font-bold text-[#1e1b1c]">سياسة التوصيل والاستلام في العراق</h4>
            <p className="text-[0.875rem] text-[#574337] leading-relaxed">
              التوصيل متاح لكافة محافظات العراق (بغداد خلال 3-5 ساعات، وباقي المحافظات خلال 24-48 ساعة).{' '}
              <span className="font-bold text-[#1e1b1c]">الدفع نقدًا عند الاستلام فقط</span> مع حق فتح الشحنة ومطابقتها قبل الدفع للمندوب.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Reviews Snippet */}
      <div className="px-4 mt-3">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#954500] text-[20px]">rate_review</span>
              <h3 className="text-[1.125rem] text-[#1e1b1c] font-bold">تقييمات الفيترية والمشترين</h3>
            </div>
            <button className="text-[0.75rem] text-[#954500] font-bold">عرض الكل ({product.reviewCount})</button>
          </div>

          <div className="p-3 bg-[#faf1f3] rounded-lg flex flex-col gap-2 border border-[#e9e0e2]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#e9e0e2] flex items-center justify-center text-[0.75rem] font-bold text-[#1e1b1c]">
                  ح
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.75rem] font-bold text-[#1e1b1c]">حيدر الفيتر (ورشة الدورة)</span>
                  <span className="text-[11px] text-[#574337]">ركبها على ياماها MT-07</span>
                </div>
              </div>
              <span className="text-[11px] text-[#574337]">منذ يومين</span>
            </div>
            <p className="text-[0.875rem] text-[#574337] leading-relaxed">
              "سفايف أصلية 100%، الباكيت مختوم والحرارة ما تأثر على قوة المسكة أبداً في ازدحامات بغداد بالصيف. أنصح بيها بشدة."
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Sticky Bottom Purchase Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#fff8f8]/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] p-3 pb-safe border-t border-[#e9e0e2]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {/* Quantity Counter */}
          <div className="flex items-center bg-[#f4eced] rounded-lg p-1 h-[50px] shadow-inner">
            <button
              aria-label="تقليل الكمية"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-full rounded bg-[#efe6e7] hover:bg-[#e0d8d9] active:scale-95 flex items-center justify-center text-[#1e1b1c] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="w-8 text-center font-bold text-[1.125rem] text-[#1e1b1c] select-none">
              {quantity}
            </span>
            <button
              aria-label="زيادة الكمية"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="w-9 h-full rounded bg-[#efe6e7] hover:bg-[#e0d8d9] active:scale-95 flex items-center justify-center text-[#1e1b1c] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Add to Cart Primary Action */}
          <button
            onClick={() => onAddToCart(product, quantity)}
            className="flex-1 h-[50px] bg-[#954500] hover:bg-[#bb5800] active:scale-[0.98] text-white text-[0.875rem] font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            <span>إضافة إلى السلة</span>
          </button>

          {/* Instant Express Order Action */}
          <button
            onClick={() => onInstantBuy(product, quantity)}
            className="h-[50px] px-4 bg-[#332f30] hover:bg-[#1e1b1c] active:scale-[0.98] text-[#f7eff0] text-[0.875rem] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px] text-[#aff589]">flash_on</span>
            <span className="whitespace-nowrap">طلب فوري</span>
          </button>
        </div>
      </div>

      {/* Compatibility Check Modal Overlay */}
      {isCompatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#e9e0e2]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#954500] text-[24px]">verified</span>
                <h3 className="text-[1.25rem] font-bold text-[#1e1b1c]">فحص تطابق الدراجة</h3>
              </div>
              <button
                aria-label="إغلاق"
                onClick={() => setIsCompatModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#f4eced] flex items-center justify-center text-[#1e1b1c]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-[0.875rem] text-[#574337] leading-relaxed">
              اختر نوع دراجتك وسنة الصنع للتحقق من مطابقة فتحات المسامير وسمك الكاليبر الأمامي بدقة:
            </p>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] text-[#574337] font-bold">الشركة المصنعة للدراجة</label>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="w-full h-12 bg-[#f4eced] px-3 rounded-lg text-[#1e1b1c] text-[0.875rem] outline-none focus:ring-2 focus:ring-[#954500]"
                >
                  <option value="honda">هوندا (Honda)</option>
                  <option value="yamaha">ياماها (Yamaha)</option>
                  <option value="suzuki">سوزوكي (Suzuki)</option>
                  <option value="kawasaki">كاوازاكي (Kawasaki)</option>
                  <option value="bajaj">باجاج بوكسر (Bajaj)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] text-[#574337] font-bold">الموديل وسنة الصنع</label>
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="مثلاً: CBR 600RR - 2019"
                  className="w-full h-12 bg-[#f4eced] px-3 rounded-lg text-[#1e1b1c] text-[0.875rem] outline-none focus:ring-2 focus:ring-[#954500]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#458325]/15 rounded-lg flex items-center gap-2 text-[#2c690b] text-[0.875rem] font-bold">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>القطعة مطابقة 100% لدراجتك ومسجلة في جدول صيانة دكان سليم!</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCompatModalOpen(false)}
                className="flex-1 h-12 bg-[#954500] hover:bg-[#bb5800] text-white rounded-lg text-[0.875rem] font-bold"
              >
                تأكيد المتابعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
