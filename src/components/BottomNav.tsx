import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, cartCount }) => {
  // If in product details or admin screen, hide bottom nav
  if (currentScreen === 'product-details' || currentScreen === 'admin') {
    return null;
  }

  const navItems: { screen: Screen; label: string; icon: string; badge?: number }[] = [
    { screen: 'home', label: 'الرئيسية', icon: 'home' },
    { screen: 'categories', label: 'الأقسام', icon: 'grid_view' },
    { screen: 'maintenance', label: 'الصيانة', icon: 'build' },
    { screen: 'orders', label: 'طلباتي', icon: 'receipt_long' },
    { screen: 'profile', label: 'حسابي', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#fff8f8]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.06)] border-t border-[#e9e0e2]">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 transition-colors relative ${
                isActive ? 'text-[#954500] font-bold' : 'text-[#574337] hover:text-[#1e1b1c]'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'font-bold' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[11px] leading-tight">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 bg-[#954500] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
