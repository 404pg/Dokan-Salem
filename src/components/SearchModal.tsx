import React, { useState } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/mockData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenScanner: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onOpenScanner,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredProducts = PRODUCTS.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.englishName && p.englishName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 pt-16">
      <div className="w-full sm:max-w-md bg-[#ffffff] rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#574337]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن قطعة غيار أو منتج أو رقم القطعة..."
              className="w-full h-12 pr-10 pl-10 bg-[#f4eced] rounded-lg text-[0.875rem] text-[#1e1b1c] placeholder:text-[#574337]/70 focus:outline-none focus:ring-2 focus:ring-[#954500]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 left-3 flex items-center text-[#574337] hover:text-[#1e1b1c]"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            title="مسح الباركود"
            className="w-12 h-12 rounded-lg bg-[#efe6e7] hover:bg-[#e9e0e2] text-[#954500] flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">barcode_scanner</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[0.875rem] text-[#574337] font-semibold px-1"
          >
            إغلاق
          </button>
        </div>

        {/* Quick suggestions tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[0.75rem]">
          <span className="text-[#574337] flex-shrink-0">مقترحات:</span>
          {['سفايف بريمبو', 'زيت موتول', 'شمعات NGK', 'زنجيل DID', 'بطارية يواسا'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="bg-[#f4eced] hover:bg-[#efe6e7] text-[#1e1b1c] px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-1">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-[#574337] flex flex-col items-center">
              <span className="material-symbols-outlined text-[40px] text-[#8a7265] mb-2">search_off</span>
              <p className="font-bold text-[0.9375rem]">لم نجد أي قطعة تطابق بحثك</p>
              <p className="text-[0.75rem] mt-1">جرب البحث بكلمات أخرى أو تواصل مع ورشة دكان سليم لتوفيرها طلبية خاصة.</p>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-[#faf1f3] hover:bg-[#f4eced] flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-white p-1 flex-shrink-0 overflow-hidden border border-[#e9e0e2]">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[0.8125rem] text-[#1e1b1c] truncate">{p.name}</h4>
                  <span className="font-mono text-[10px] text-[#574337]">{p.sku}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-[#2c690b] font-bold">متوفر بالدورة والقاهرة</span>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end flex-shrink-0">
                  <span className="font-bold text-[0.875rem] text-[#954500]">
                    {p.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-[9px] text-[#574337]">د.ع</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
