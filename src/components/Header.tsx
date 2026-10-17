import React, { useState } from 'react';
import { Screen } from '../types';
import { DOKAN_LOGO_URL } from '../data/mockData';

interface HeaderProps {
  currentScreen: Screen;
  cartCount: number;
  selectedBranchName: string;
  onNavigate: (screen: Screen) => void;
  onOpenBranchModal: () => void;
  onOpenSearchModal: () => void;
  onOpenBikeModal: () => void;
  productTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  cartCount,
  selectedBranchName,
  onNavigate,
  onOpenBranchModal,
  onOpenSearchModal,
  productTitle,
}) => {
  const isHome = currentScreen === 'home';
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 4) {
      setLogoClicks(0);
      onNavigate('admin');
    } else {
      onNavigate('home');
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#fff8f8]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-2xl mx-auto">
        {/* Left Side (RTL Start) */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isHome ? (
            <button
              aria-label="الرجوع"
              onClick={() => onNavigate('home')}
              className="w-10 h-10 flex items-center justify-center text-[#1e1b1c] rounded-full hover:bg-[#efe6e7] active:scale-95 transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
            </button>
          ) : null}

          <img
            alt="شعار دكان سليم"
            className="h-8 w-auto object-contain flex-shrink-0 cursor-pointer select-none"
            src={DOKAN_LOGO_URL}
            onClick={handleLogoClick}
            title="دكان سليم"
          />

          {isHome ? (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 text-[#1e1b1c]">
                <span className="material-symbols-outlined text-[#954500] text-[18px]">motorcycle</span>
                <span className="text-[0.875rem] font-bold truncate">دكان سليم</span>
              </div>
              <button
                onClick={onOpenBranchModal}
                className="flex items-center gap-1 text-[#574337] hover:text-[#954500] transition-colors text-right"
              >
                <span className="material-symbols-outlined text-[14px] text-[#954500]">location_on</span>
                <span className="text-[0.75rem] font-medium truncate">{selectedBranchName}</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>
          ) : (
            <h1 className="text-[1.125rem] font-bold text-[#1e1b1c] truncate">
              {currentScreen === 'product-details' && (productTitle || 'Product Details')}
              {currentScreen === 'cart' && 'Cart'}
              {currentScreen === 'maintenance' && 'حجز موعد صيانة'}
              {currentScreen === 'categories' && 'أقسام قطع الغيار'}
              {currentScreen === 'orders' && 'طلباتي ومتابعة الصيانة'}
              {currentScreen === 'profile' && 'حسابي وكراجي'}
            </h1>
          )}
        </div>

        {/* Right Side (RTL End) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            aria-label="بحث"
            onClick={onOpenSearchModal}
            className="w-10 h-10 flex items-center justify-center text-[#1e1b1c] rounded-full hover:bg-[#efe6e7] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>

          <button
            aria-label="سلة المشتريات"
            onClick={() => onNavigate('cart')}
            className="relative w-10 h-10 flex items-center justify-center text-[#1e1b1c] rounded-full hover:bg-[#efe6e7] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute top-1.5 left-1.5 bg-[#954500] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          <button
            aria-label="الإشعارات"
            onClick={() => onNavigate('orders')}
            className="relative w-10 h-10 flex items-center justify-center text-[#1e1b1c] rounded-full hover:bg-[#efe6e7] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-[#fff8f8]"></span>
          </button>

          <button
            aria-label="حسابي"
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-[#954500] flex items-center justify-center flex-shrink-0 mr-1 text-white hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
