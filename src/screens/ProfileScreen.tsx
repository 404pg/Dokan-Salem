import React from 'react';
import { BikeProfile, Product } from '../types';
import { BRANCHES, PRODUCTS } from '../data/mockData';

interface ProfileScreenProps {
  currentBike: BikeProfile;
  onOpenBikeModal: () => void;
  onOpenBranchModal: () => void;
  favoriteIds: string[];
  onSelectProduct: (product: Product) => void;
  onStartShopping: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentBike,
  onOpenBikeModal,
  onOpenBranchModal,
  favoriteIds,
  onSelectProduct,
  onStartShopping,
}) => {
  const favoriteProducts = PRODUCTS.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="flex flex-col relative w-full pt-16 pb-24 max-w-2xl mx-auto bg-[#fff8f8] min-h-screen px-4 space-y-4">
      {/* Profile Card */}
      <div className="mt-2 bg-white rounded-xl p-4 flex items-center gap-3.5 shadow-sm border border-[#e9e0e2]">
        <div className="w-14 h-14 rounded-full bg-[#954500] text-white flex items-center justify-center text-[24px] font-bold shadow-sm">
          <span className="material-symbols-outlined text-[28px]">person</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[1.125rem] font-bold text-[#1e1b1c]">سجاد العراقي</h2>
            <span className="bg-[#458325]/15 text-[#2c690b] text-[10px] font-bold px-2 py-0.5 rounded-full">
              زبون مميز
            </span>
          </div>
          <p className="text-[0.75rem] text-[#574337] mt-0.5 font-mono">07701234567 • بغداد</p>
        </div>
      </div>

      {/* My Garage (كراجي) */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e9e0e2] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">two_wheeler</span>
            <h3 className="text-[1rem] font-bold text-[#1e1b1c]">كراجي (دراجتي الحالية)</h3>
          </div>
          <button
            onClick={onOpenBikeModal}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            تغيير الدراجة
          </button>
        </div>

        <div className="p-3 bg-[#faf1f3] rounded-xl flex items-center justify-between border border-[#e9e0e2]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#954500]/10 text-[#954500] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">sports_motorsports</span>
            </div>
            <div>
              <h4 className="text-[0.875rem] font-bold text-[#1e1b1c]">
                {currentBike.make} {currentBike.model}
              </h4>
              <p className="text-[0.75rem] text-[#574337]">موديل سنة {currentBike.year}</p>
            </div>
          </div>
          <span className="text-[0.75rem] text-[#2c690b] font-bold bg-[#2c690b]/10 px-2 py-1 rounded">
            مفعلة للبحث
          </span>
        </div>
      </div>

      {/* Favorites Wishlist */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e9e0e2] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">favorite</span>
            <h3 className="text-[1rem] font-bold text-[#1e1b1c]">القطع المفضلة ({favoriteProducts.length})</h3>
          </div>
        </div>

        {favoriteProducts.length === 0 ? (
          <p className="text-[0.8125rem] text-[#574337] py-2 text-center">
            لم تقم بإضافة أي قطع إلى المفضلة بعد.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {favoriteProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="p-2.5 rounded-lg bg-[#faf1f3] hover:bg-[#f4eced] flex items-center justify-between gap-3 cursor-pointer border border-[#e9e0e2]/50"
              >
                <div className="w-12 h-12 rounded bg-white p-1 flex-shrink-0 flex items-center justify-center">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-[0.8125rem] font-bold text-[#1e1b1c] truncate">{p.name}</h5>
                  <span className="text-[11px] text-[#954500] font-bold">
                    {p.price.toLocaleString('en-US')} د.ع
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#574337] text-[18px]">chevron_left</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dokan Saleem Branches in Baghdad */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e9e0e2] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[22px]">store</span>
            <h3 className="text-[1rem] font-bold text-[#1e1b1c]">فروع وورشات دكان سليم</h3>
          </div>
          <button
            onClick={onOpenBranchModal}
            className="text-[0.75rem] text-[#954500] font-bold hover:underline"
          >
            تغيير الفرع
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {BRANCHES.map((b) => (
            <div key={b.id} className="p-3 bg-[#faf1f3] rounded-lg border border-[#e9e0e2]/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[0.875rem] font-bold text-[#1e1b1c]">{b.name}</span>
                <a
                  href={`tel:${b.phone}`}
                  className="text-[0.75rem] text-[#954500] font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  {b.phone}
                </a>
              </div>
              <p className="text-[0.75rem] text-[#574337]">{b.subtext}</p>
            </div>
          ))}
        </div>
      </div>


      {/* Support and Direct WhatsApp Contact */}
      <div className="p-4 bg-[#2c690b]/10 rounded-xl border border-[#2c690b]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2c690b] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">support_agent</span>
          </div>
          <div>
            <h4 className="text-[0.875rem] font-bold text-[#1e1b1c]">تحتاج مساعدة أو استشارة فيتر؟</h4>
            <p className="text-[0.75rem] text-[#574337]">فريقنا التقني جاهز للإجابة على مدار الساعة</p>
          </div>
        </div>
        <a
          href="https://wa.me/9647712345678"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 bg-[#2c690b] text-white rounded-lg text-[0.75rem] font-bold flex items-center gap-1 hover:bg-[#1d5200] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          <span>واتساب</span>
        </a>
      </div>
    </div>
  );
};
