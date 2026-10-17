import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { BAGHDAD_DISTRICTS } from '../data/mockData';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  deliveryType: 'pickup' | 'delivery';
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryType,
  onOrderPlaced,
}) => {
  const [recipientName, setRecipientName] = useState('سجاد العراقي');
  const [phoneNumber, setPhoneNumber] = useState('07701234567');
  const [district, setDistrict] = useState(BAGHDAD_DISTRICTS[0].name);
  const [streetAddress, setStreetAddress] = useState('قرب ساحة الطيران، عمارة الأمل');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const deliveryFee = deliveryType === 'delivery' ? 5000 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: orderId,
        items: [...items],
        subtotal,
        deliveryFee,
        total,
        fulfillment: deliveryType,
        branchOrAddress:
          deliveryType === 'pickup'
            ? 'فرع بغداد - الدورة (استلام مباشر)'
            : `${district} - ${streetAddress}`,
        recipientName,
        phoneNumber,
        paymentMethod: 'COD',
        status: 'received',
        date: new Date().toLocaleDateString('ar-IQ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setIsSubmitting(false);
      onOrderPlaced(newOrder);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#ffffff] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[24px]">local_shipping</span>
            <h3 className="text-[1.25rem] font-bold text-[#1e1b1c]">تأكيد طلب الشراء نقدًا عند الاستلام</h3>
          </div>
          <button
            aria-label="إغلاق"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4eced] flex items-center justify-center text-[#1e1b1c]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* COD notice */}
        <div className="p-3 bg-[#ffdbc8]/40 border border-[#ffb68b] rounded-xl flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#954500] text-[24px]">payments</span>
          <div className="text-[0.75rem] text-[#1e1b1c]">
            <p className="font-bold">الدفع نقدًا عند الاستلام فقط (COD)</p>
            <p className="text-[#574337]">عاين قطع الغيار وتأكد من سلامة الصناديق والأختام قبل تسليم الدينار للمندوب.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[0.75rem] font-bold text-[#1e1b1c]">اسم المستلم</label>
            <input
              required
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="الاسم الكامل"
              className="h-11 px-3 rounded-lg bg-[#f4eced] text-[0.875rem] text-[#1e1b1c] outline-none focus:ring-2 focus:ring-[#954500]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.75rem] font-bold text-[#1e1b1c]">رقم الهاتف للتواصل وتأكيد المندوب</label>
            <input
              required
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="مثال: 07701234567"
              className="h-11 px-3 rounded-lg bg-[#f4eced] text-[0.875rem] text-[#1e1b1c] font-mono outline-none focus:ring-2 focus:ring-[#954500]"
            />
          </div>

          {deliveryType === 'delivery' ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-bold text-[#1e1b1c]">منطقة التوصيل في بغداد</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="h-11 px-3 rounded-lg bg-[#f4eced] text-[0.875rem] text-[#1e1b1c] outline-none focus:ring-2 focus:ring-[#954500]"
                >
                  {BAGHDAD_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.eta})
                    </option>
                  ))}
                  <option value="محافظة أخرى">محافظة أخرى (شحن 24-48 ساعة)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-bold text-[#1e1b1c]">تفاصيل العنوان وأقرب نقطة دالة</label>
                <input
                  required
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="الشارع، المحلة، الزقاق، أو محل تجاري معروف..."
                  className="h-11 px-3 rounded-lg bg-[#f4eced] text-[0.875rem] text-[#1e1b1c] outline-none focus:ring-2 focus:ring-[#954500]"
                />
              </div>
            </>
          ) : (
            <div className="p-3 bg-[#f4eced] rounded-lg text-[0.8125rem] text-[#574337]">
              <span className="font-bold text-[#1e1b1c] block mb-1">الاستلام المباشر من الفرع:</span>
              فرع الدورة - شارع المصافي قرب محطة الوقود. سيتم تجهيز طلبك خلال 20 دقيقة للاستلام الفوري دون أي رسوم توصيل.
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[0.75rem] font-bold text-[#1e1b1c]">ملاحظات إضافية للمندوب أو الورشة (اختياري)</label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="مثال: يرجى الاتصال قبل الوصول بربع ساعة"
              className="h-10 px-3 rounded-lg bg-[#f4eced] text-[0.8125rem] text-[#1e1b1c] outline-none focus:ring-2 focus:ring-[#954500]"
            />
          </div>

          {/* Pricing summary */}
          <div className="p-3 bg-[#faf1f3] rounded-xl flex flex-col gap-1.5 mt-1 border border-[#e9e0e2]">
            <div className="flex justify-between text-[0.8125rem]">
              <span className="text-[#574337]">مجموع قطع الغيار ({items.length} أصناف):</span>
              <span className="font-bold text-[#1e1b1c]">{subtotal.toLocaleString('en-US')} د.ع</span>
            </div>
            <div className="flex justify-between text-[0.8125rem]">
              <span className="text-[#574337]">أجور التوصيل السريع:</span>
              <span className="font-bold text-[#1e1b1c]">
                {deliveryType === 'delivery' ? '5,000 د.ع' : 'مجاني (استلام فرع)'}
              </span>
            </div>
            <div className="h-[1px] bg-[#e9e0e2] my-0.5"></div>
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-[0.9375rem] text-[#1e1b1c]">المبلغ الكلي المطلوب:</span>
              <span className="font-bold text-[1.125rem] text-[#954500]">
                {total.toLocaleString('en-US')} د.ع
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-lg bg-[#954500] hover:bg-[#bb5800] text-white font-bold text-[0.9375rem] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1"
          >
            {isSubmitting ? (
              <span className="animate-spin material-symbols-outlined text-[20px]">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>تأكيد إرسال الطلب الآن</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
