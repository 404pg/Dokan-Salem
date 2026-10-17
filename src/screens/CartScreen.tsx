import React from 'react';
import { CartItem } from '../types';

interface CartScreenProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  fulfillmentType: 'pickup' | 'delivery';
  onFulfillmentChange: (type: 'pickup' | 'delivery') => void;
  onProceedCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  fulfillmentType,
  onFulfillmentChange,
  onProceedCheckout,
  onContinueShopping,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = fulfillmentType === 'delivery' ? 5000 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex flex-col relative w-full pt-16 pb-24 max-w-2xl mx-auto bg-[#fff8f8] min-h-screen">
      {/* Top Progress & Micro-Notice Tracker */}
      <div className="px-4 pt-3 pb-1">
        <div className="bg-[#efe6e7] rounded-xl p-4 flex items-center justify-between shadow-sm border border-[#e9e0e2]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#954500] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.875rem] font-bold text-[#1e1b1c]">سلة القطع الأصلية</span>
              <span className="text-[0.75rem] text-[#574337]">
                {items.length} {items.length === 1 ? 'منتج محدد' : 'منتجات محددة'} لطلبك
              </span>
            </div>
          </div>
          <span className="bg-[#458325] text-[#f8ffee] text-[0.75rem] px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f8ffee] animate-pulse"></span>
            تجهيز فوري ببغداد
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#f4eced] flex items-center justify-center text-[#8a7265] mb-4">
            <span className="material-symbols-outlined text-[40px]">remove_shopping_cart</span>
          </div>
          <h3 className="text-[1.25rem] font-bold text-[#1e1b1c] mb-1">سلتك فارغة حالياً</h3>
          <p className="text-[0.875rem] text-[#574337] max-w-xs mb-6">
            تصفح كتالوج قطع الغيار الأصلية والزيوت وسفايف الفرامل واختر ما يناسب دراجتك.
          </p>
          <button
            onClick={onContinueShopping}
            className="h-11 px-6 bg-[#954500] hover:bg-[#bb5800] text-white rounded-lg font-bold text-[0.875rem] transition-all"
          >
            تصفح قطع الغيار الآن
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items List */}
          <div className="px-4 flex flex-col gap-2.5 mt-2">
            {items.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <div
                  key={item.product.id}
                  className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-2 border border-[#e9e0e2] relative overflow-hidden"
                >
                  <div className="flex gap-3 items-start">
                    <div className="w-20 h-20 rounded-lg bg-[#f4eced] flex-shrink-0 overflow-hidden relative border border-[#e9e0e2]/60 flex items-center justify-center">
                      <img
                        className="w-full h-full object-contain p-1"
                        src={item.product.images[0]}
                        alt={item.product.name}
                      />
                      <span className="absolute bottom-1 right-1 bg-[#332f30]/90 text-white text-[9px] font-bold px-1 rounded">
                        أصلي 100%
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h2 className="text-[0.875rem] font-bold text-[#1e1b1c] leading-tight line-clamp-2">
                          {item.product.name}
                        </h2>
                        <button
                          aria-label="حذف المنتج"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[#574337] hover:text-[#ba1a1a] p-1 rounded-lg active:scale-90 transition-transform flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                        </button>
                      </div>

                      <span className="text-[0.75rem] text-[#574337] font-mono mt-0.5">
                        SKU: {item.product.sku}
                      </span>

                      {/* Stock indicator */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-[#2c690b]/10 text-[#2c690b] text-[11px] font-bold px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[13px] fill">
                            warehouse
                          </span>
                          متوفر للتجهيز: فرع الدورة وحي القاهرة
                        </span>
                      </div>

                      {/* Price & Stepper */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#f4eced]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[1.125rem] font-bold text-[#954500]">
                            {itemTotal.toLocaleString('en-US')}
                          </span>
                          <span className="text-[0.75rem] text-[#574337]">د.ع</span>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center bg-[#efe6e7] rounded-lg p-0.5">
                          <button
                            aria-label="تقليل الكمية"
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-[#1e1b1c] active:scale-95 transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="w-8 text-center font-bold text-[#1e1b1c] text-[0.875rem]">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="زيادة الكمية"
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-[#1e1b1c] active:scale-95 transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fulfillment Method Options */}
          <div className="px-4 mt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e9e0e2]">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#954500] text-[22px]">local_shipping</span>
                <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">طريقة الاستلام والتوصيل</h3>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Option A: Branch Pickup */}
                <label
                  onClick={() => onFulfillmentChange('pickup')}
                  className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    fulfillmentType === 'pickup'
                      ? 'border-[#954500] bg-[#ffdbc8]/20'
                      : 'border-[#e9e0e2] bg-[#faf1f3] hover:bg-[#f4eced]'
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === 'pickup'}
                    onChange={() => onFulfillmentChange('pickup')}
                    className="mt-1 h-4 w-4 text-[#954500] accent-[#954500] cursor-pointer"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.875rem] font-bold text-[#1e1b1c]">
                        استلام مباشر من الفرع
                      </span>
                      <span className="text-[0.75rem] bg-[#458325] text-[#f8ffee] px-2 py-0.5 rounded font-bold">
                        مجاني
                      </span>
                    </div>
                    <p className="text-[0.8125rem] text-[#574337] mt-0.5 leading-relaxed">
                      استلام مجاني وفوري من فرع الدورة أو فرع حي القاهرة ببغداد بعد تجهيز الطلب.
                    </p>
                  </div>
                </label>

                {/* Option B: Home Delivery */}
                <label
                  onClick={() => onFulfillmentChange('delivery')}
                  className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    fulfillmentType === 'delivery'
                      ? 'border-[#954500] bg-[#ffdbc8]/20'
                      : 'border-[#e9e0e2] bg-[#faf1f3] hover:bg-[#f4eced]'
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === 'delivery'}
                    onChange={() => onFulfillmentChange('delivery')}
                    className="mt-1 h-4 w-4 text-[#954500] accent-[#954500] cursor-pointer"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.875rem] font-bold text-[#1e1b1c]">
                        توصيل إلى باب منزلك
                      </span>
                      <span className="text-[0.75rem] bg-[#dcdfee] text-[#5e626f] px-2 py-0.5 rounded font-medium">
                        سريع وآمن (5,000 د.ع)
                      </span>
                    </div>
                    <p className="text-[0.8125rem] text-[#574337] mt-0.5 leading-relaxed">
                      خدمة الشحن والتسليم متوفرة في جميع محافظات العراق وبغداد (الكرخ والرصافة).
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Cost Summary & Payment Badge */}
          <div className="px-4 mt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-3 border border-[#e9e0e2]">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.125rem] font-bold text-[#1e1b1c]">ملخص الطلب</h3>
                <span className="text-[0.75rem] text-[#574337]">الأسعار بالدينار العراقي</span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[0.875rem] text-[#574337]">المجموع الفرعي للقطع</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[1.125rem] font-bold text-[#1e1b1c]">
                      {subtotal.toLocaleString('en-US')}
                    </span>
                    <span className="text-[0.75rem] text-[#574337]">د.ع</span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex flex-col max-w-[65%]">
                    <span className="text-[0.875rem] text-[#574337]">كلفة التوصيل الشاملة</span>
                    <span className="text-[11px] text-[#574337] leading-tight">
                      {fulfillmentType === 'delivery'
                        ? 'توصيل سريع داخل بغداد'
                        : 'استلام مباشر من الورشة مجاناً'}
                    </span>
                  </div>
                  <span className="text-[0.75rem] text-[#954500] font-bold bg-[#ffdbc8]/40 px-2 py-0.5 rounded">
                    {fulfillmentType === 'delivery' ? '5,000 د.ع' : 'مجاني'}
                  </span>
                </div>

                {/* COD Notice Banner */}
                <div className="bg-[#efe6e7] rounded-lg p-2.5 flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[#954500] text-[20px]">payments</span>
                  <div className="flex flex-col">
                    <span className="text-[0.75rem] font-bold text-[#1e1b1c]">
                      الدفع نقدًا عند الاستلام فقط (COD)
                    </span>
                    <span className="text-[11px] text-[#574337]">
                      افحص طلبك وتأكد من سلامة القطع والأختام قبل تسليم المبلغ للمندوب.
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-[#f4eced] mt-1"></div>

                {/* Total Calculation */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-[1.25rem] font-bold text-[#1e1b1c]">المجموع الكلي</span>
                    <span className="text-[11px] text-[#574337]">شامل ضريبة القيمة المضافة</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[1.5rem] font-bold text-[#954500]">
                      {total.toLocaleString('en-US')}
                    </span>
                    <span className="text-[0.875rem] font-bold text-[#954500]">د.ع</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Buyer Assurance Badge */}
          <div className="px-4 mt-4">
            <div className="bg-[#faf1f3] rounded-xl p-4 flex items-center gap-3 shadow-sm border border-[#e9e0e2]">
              <div className="w-10 h-10 rounded-full bg-[#dcdfee] flex items-center justify-center flex-shrink-0 text-[#5a5e6b]">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.875rem] font-bold text-[#1e1b1c]">
                  ضمان دكان سليم للميكانيك
                </span>
                <span className="text-[0.8125rem] text-[#574337] leading-snug">
                  جميع قطع الغيار أصلية ومضمونة، مع إمكانية استبدال القطعة مجانًا في حال عدم توافقها مع محرك دراجتك.
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="px-4 mt-6 flex flex-col gap-2.5">
            {/* Primary Checkout Button */}
            <button
              aria-label="متابعة إتمام الطلب"
              onClick={onProceedCheckout}
              className="w-full h-[52px] rounded-lg bg-[#954500] hover:bg-[#bb5800] active:translate-y-[1px] text-white text-[0.875rem] font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>متابعة إتمام الطلب</span>
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>

            {/* Secondary Action Button */}
            <button
              aria-label="متابعة التسوق"
              onClick={onContinueShopping}
              className="w-full h-[48px] rounded-lg bg-[#efe6e7] hover:bg-[#e9e0e2] active:scale-[0.99] text-[#1e1b1c] text-[0.875rem] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>متابعة التسوق وإضافة قطع أخرى</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
