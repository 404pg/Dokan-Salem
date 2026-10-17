import React, { useState } from 'react';
import { Product, BikeProfile } from '../types';
import { CATEGORIES, PRODUCTS } from '../data/mockData';

interface CategoriesScreenProps {
  initialCategory?: string;
  currentBike: BikeProfile;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  initialCategory = 'all',
  currentBike,
  onSelectProduct,
  onAddToCart,
  favoriteIds,
  onToggleFavorite,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  const displayedProducts = PRODUCTS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="flex flex-col relative w-full pt-16 pb-24 max-w-2xl mx-auto bg-[#fff8f8] min-h-screen px-4 space-y-4">
      {/* Bike Compatibility Reminder */}
      <div className="mt-2 bg-[#954500]/10 rounded-xl p-3 flex items-center justify-between gap-2 border border-[#954500]/15">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#954500] text-[20px]">two_wheeler</span>
          <span className="text-[0.75rem] text-[#1e1b1c]">
            معاينة القطع لدراجة: <strong className="text-[#954500]">{currentBike.make} {currentBike.model}</strong>
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#2c690b] bg-[#458325]/15 px-2 py-0.5 rounded">
          مطابقة معتمدة
        </span>
      </div>

      {/* Category Pills Strip */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-[0.8125rem] font-bold flex-shrink-0 transition-all ${
            activeCategory === 'all'
              ? 'bg-[#954500] text-white shadow-sm'
              : 'bg-white text-[#1e1b1c] border border-[#e9e0e2] hover:bg-[#f4eced]'
          }`}
        >
          جميع القطع ({PRODUCTS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-[0.8125rem] font-bold flex-shrink-0 flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-[#954500] text-white shadow-sm'
                  : 'bg-white text-[#1e1b1c] border border-[#e9e0e2] hover:bg-[#f4eced]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-2 gap-3">
        {displayedProducts.map((p) => {
          const isFav = favoriteIds.includes(p.id);
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl p-3 flex flex-col justify-between shadow-sm relative group border border-[#e9e0e2]"
            >
              <button
                onClick={() => onToggleFavorite(p.id)}
                className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/80 text-[#574337] hover:text-[#ba1a1a] flex items-center justify-center shadow-sm"
              >
                <span className={`material-symbols-outlined text-[18px] ${isFav ? 'text-[#ba1a1a] fill' : ''}`}>
                  favorite
                </span>
              </button>
              {p.discountPercent && (
                <span className="absolute top-2.5 right-2.5 z-10 bg-[#ba1a1a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  خصم {p.discountPercent}%
                </span>
              )}

              <div
                onClick={() => onSelectProduct(p)}
                className="w-full h-32 rounded-lg bg-[#f4eced] overflow-hidden mb-2 relative flex items-center justify-center cursor-pointer"
              >
                <img
                  alt={p.name}
                  className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                  src={p.images[0]}
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[0.75rem] text-[#5a5e6b] block font-medium">{p.brand}</span>
                  <h4
                    onClick={() => onSelectProduct(p)}
                    className="text-[0.875rem] font-bold text-[#1e1b1c] line-clamp-2 cursor-pointer hover:text-[#954500]"
                  >
                    {p.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1 text-[#2c690b] text-[0.75rem] pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2c690b]"></span>
                  <span>متوفر بفرعي بغداد</span>
                </div>

                <div className="pt-2 flex items-center justify-between gap-1">
                  <div className="flex flex-col">
                    <span className="text-[1.125rem] font-bold text-[#954500]">
                      {p.price.toLocaleString('en-US')}
                    </span>
                    <span className="text-[10px] text-[#574337] -mt-1">دينار عراقي</span>
                  </div>
                  <button
                    onClick={() => onAddToCart(p)}
                    className="w-10 h-10 rounded-lg bg-[#954500] text-white flex items-center justify-center shadow hover:bg-[#bb5800] active:scale-90 transition-transform"
                    title="إضافة للسلة"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
