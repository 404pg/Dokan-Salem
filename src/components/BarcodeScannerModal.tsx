import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/mockData';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setDetectedCode(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const simulateScan = (product: Product) => {
    setIsScanning(false);
    setDetectedCode(product.sku);
    setTimeout(() => {
      onProductFound(product);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1b1c] text-white rounded-2xl p-5 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-[#332f30]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb68b] text-[24px]">barcode_scanner</span>
            <h3 className="font-bold text-[1rem]">ماسح الباركود السريع</h3>
          </div>
          <button
            aria-label="إغلاق"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#332f30] flex items-center justify-center text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative w-full aspect-square my-4 bg-[#0d0a0b] rounded-xl overflow-hidden border border-[#574337] flex items-center justify-center">
          {/* Target Corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#ffb68b]"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#ffb68b]"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#ffb68b]"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#ffb68b]"></div>

          {/* Red animated laser line */}
          {isScanning && (
            <div className="absolute inset-x-4 h-0.5 bg-[#ba1a1a] shadow-[0_0_12px_#ba1a1a] animate-pulse transition-all"></div>
          )}

          <div className="text-center p-4 z-10">
            <span className="material-symbols-outlined text-[48px] text-[#ffb68b] mb-2 opacity-80">
              qr_code_scanner
            </span>
            <p className="text-[0.8125rem] text-[#e0d8d9]">
              وجّه الكاميرا نحو باركود علبة قطعة الغيار أو اختر من العينات أدناه للمعاينة الفورية
            </p>
          </div>

          {detectedCode && (
            <div className="absolute inset-0 bg-[#2c690b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <span className="material-symbols-outlined text-[40px] text-white mb-1">check_circle</span>
              <span className="text-[1.125rem] font-bold">تم التعرف على القطعة!</span>
              <span className="font-mono text-[0.875rem] text-white/90">{detectedCode}</span>
            </div>
          )}
        </div>

        {/* Sample Barcode buttons to test scanner immediately */}
        <div className="w-full flex flex-col gap-1.5">
          <span className="text-[0.75rem] text-[#e0d8d9] font-medium">اختبر المسح على قطع متوفرة:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => simulateScan(PRODUCTS[0])}
              className="p-2 rounded-lg bg-[#332f30] hover:bg-[#574337] text-right text-[0.75rem] flex flex-col gap-0.5 border border-[#574337]/50"
            >
              <span className="font-bold text-[#ffb68b] truncate">سفايف بريمبو</span>
              <span className="font-mono text-[10px] text-[#e0d8d9]">BRM-7045-SP</span>
            </button>
            <button
              onClick={() => simulateScan(PRODUCTS[1])}
              className="p-2 rounded-lg bg-[#332f30] hover:bg-[#574337] text-right text-[0.75rem] flex flex-col gap-0.5 border border-[#574337]/50"
            >
              <span className="font-bold text-[#ffb68b] truncate">زيت موتول 7100</span>
              <span className="font-mono text-[10px] text-[#e0d8d9]">MOT-7100-1040</span>
            </button>
            <button
              onClick={() => simulateScan(PRODUCTS[3])}
              className="p-2 rounded-lg bg-[#332f30] hover:bg-[#574337] text-right text-[0.75rem] flex flex-col gap-0.5 border border-[#574337]/50"
            >
              <span className="font-bold text-[#ffb68b] truncate">بطارية يواسا 12V</span>
              <span className="font-mono text-[10px] text-[#e0d8d9]">YUA-BAT-12V9</span>
            </button>
            <button
              onClick={() => simulateScan(PRODUCTS[5])}
              className="p-2 rounded-lg bg-[#332f30] hover:bg-[#574337] text-right text-[0.75rem] flex flex-col gap-0.5 border border-[#574337]/50"
            >
              <span className="font-bold text-[#ffb68b] truncate">شمعة NGK إيريديوم</span>
              <span className="font-mono text-[10px] text-[#e0d8d9]">NGK-IRID-CR9</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
