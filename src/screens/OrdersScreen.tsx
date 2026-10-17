import React from 'react';
import { Order, MaintenanceBooking } from '../types';

interface OrdersScreenProps {
  orders: Order[];
  bookings: MaintenanceBooking[];
  onStartShopping: () => void;
  onBookMaintenance: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  orders,
  bookings,
  onStartShopping,
  onBookMaintenance,
}) => {
  return (
    <div className="flex flex-col relative w-full pt-16 pb-24 max-w-2xl mx-auto bg-[#fff8f8] min-h-screen px-4 space-y-4">
      {/* Header Info */}
      <div className="mt-2 bg-[#efe6e7] rounded-xl p-4 flex items-center justify-between border border-[#e9e0e2]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#954500] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          </div>
          <div>
            <h2 className="text-[1rem] font-bold text-[#1e1b1c]">سجل الطلبات ومواعيد الصيانة</h2>
            <p className="text-[0.75rem] text-[#574337]">متابعة حية لحالة الشحن وحضور الفيتر</p>
          </div>
        </div>
        <span className="text-[0.75rem] bg-[#458325] text-[#f8ffee] font-bold px-2.5 py-1 rounded-full">
          محدث لحظياً
        </span>
      </div>

      {/* Maintenance Bookings Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[20px]">build_circle</span>
            <h3 className="text-[1rem] font-bold text-[#1e1b1c]">حجوزات الصيانة والفيتر</h3>
          </div>
          <button
            onClick={onBookMaintenance}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            + حجز جديد
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center border border-[#e9e0e2] shadow-sm">
            <p className="text-[0.875rem] text-[#574337] mb-2">لا يوجد لديك حجز صيانة نشط حالياً</p>
            <button
              onClick={onBookMaintenance}
              className="text-[0.8125rem] text-white bg-[#954500] px-4 py-2 rounded-lg font-bold"
            >
              احجز دورك في الورشة الآن
            </button>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl p-4 border border-[#e9e0e2] shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#f4eced]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#954500] text-[0.9375rem]">
                    #{b.id}
                  </span>
                  <span className="text-[0.75rem] text-[#574337] font-medium">({b.bikeMake} {b.bikeModel})</span>
                </div>
                <span className="text-[0.75rem] bg-[#ffdbc8] text-[#321300] font-bold px-2 py-0.5 rounded-full">
                  {b.serviceType === 'workshop' ? 'صيانة ورشة' : 'فيتر جوال'}
                </span>
              </div>

              {/* Maintenance timeline */}
              <div className="p-3 bg-[#faf1f3] rounded-lg">
                <span className="text-[0.75rem] font-bold text-[#1e1b1c] block mb-2">حالة الموعد:</span>
                <div className="flex items-center justify-between text-center relative">
                  <div className="flex flex-col items-center z-10">
                    <div className="w-6 h-6 rounded-full bg-[#2c690b] text-white flex items-center justify-center text-[12px]">✓</div>
                    <span className="text-[10px] mt-1 font-bold text-[#2c690b]">تم الاستلام</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-[#2c690b]"></div>
                  <div className="flex flex-col items-center z-10">
                    <div className="w-6 h-6 rounded-full bg-[#954500] text-white flex items-center justify-center text-[12px] animate-pulse">●</div>
                    <span className="text-[10px] mt-1 font-bold text-[#954500]">تأكيد الفني</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-[#e9e0e2]"></div>
                  <div className="flex flex-col items-center z-10">
                    <div className="w-6 h-6 rounded-full bg-[#e9e0e2] text-[#574337] flex items-center justify-center text-[12px]">3</div>
                    <span className="text-[10px] mt-1 text-[#574337]">الفحص والإصلاح</span>
                  </div>
                </div>
              </div>

              <div className="text-[0.8125rem] text-[#574337] space-y-1">
                <p><strong>الخدمات المطلوبة:</strong> {b.selectedServices.join('، ')}</p>
                <p><strong>الموعد المفضل:</strong> {b.preferredDay} - {b.preferredTimeSlot}</p>
                {b.branch && (
                  <p><strong>الورشة:</strong> {b.branch === 'doura' ? 'فرع الدورة - شارع 60' : 'فرع حي القاهرة'}</p>
                )}
                {b.address && <p><strong>العنوان:</strong> {b.district} - {b.address}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Parts Orders Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[20px]">local_shipping</span>
            <h3 className="text-[1rem] font-bold text-[#1e1b1c]">طلبات قطع الغيار</h3>
          </div>
          <button
            onClick={onStartShopping}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            + طلب جديد
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center border border-[#e9e0e2] shadow-sm">
            <p className="text-[0.875rem] text-[#574337] mb-2">لا توجد طلبات سابقة مسجلة</p>
            <button
              onClick={onStartShopping}
              className="text-[0.8125rem] text-white bg-[#954500] px-4 py-2 rounded-lg font-bold"
            >
              تسوق الآن
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl p-4 border border-[#e9e0e2] shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#f4eced]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#954500] text-[0.9375rem]">
                    #{order.id}
                  </span>
                  <span className="text-[11px] text-[#574337]">{order.date}</span>
                </div>
                <span className="text-[0.75rem] bg-[#458325]/15 text-[#2c690b] font-bold px-2 py-0.5 rounded-full">
                  قيد التجهيز الفوري
                </span>
              </div>

              {/* Items summary */}
              <div className="flex flex-col gap-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[0.8125rem]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-[#954500]">{item.quantity}×</span>
                      <span className="truncate text-[#1e1b1c]">{item.product.name}</span>
                    </div>
                    <span className="font-mono text-[#574337] flex-shrink-0">
                      {(item.product.price * item.quantity).toLocaleString('en-US')} د.ع
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[#faf1f3] rounded-lg text-[0.75rem] text-[#574337] flex items-center justify-between border border-[#e9e0e2]/50">
                <span>التوصيل: {order.branchOrAddress}</span>
                <span className="font-bold text-[#1e1b1c]">نقدًا عند الاستلام</span>
              </div>

              <div className="flex items-baseline justify-between pt-1 border-t border-[#f4eced]">
                <span className="text-[0.875rem] font-bold text-[#1e1b1c]">الإجمالي النهائي:</span>
                <span className="text-[1.125rem] font-bold text-[#954500]">
                  {order.total.toLocaleString('en-US')} د.ع
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
