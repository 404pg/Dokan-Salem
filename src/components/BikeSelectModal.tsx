import React, { useState } from 'react';
import { BikeProfile } from '../types';
import { BRANDS } from '../data/mockData';

interface BikeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBike: BikeProfile;
  onSelectBike: (bike: BikeProfile) => void;
}

export const BikeSelectModal: React.FC<BikeSelectModalProps> = ({
  isOpen,
  onClose,
  currentBike,
  onSelectBike,
}) => {
  const [make, setMake] = useState(currentBike.make);
  const [model, setModel] = useState(currentBike.model);
  const [year, setYear] = useState(currentBike.year);

  if (!isOpen) return null;

  const currentBrandData = BRANDS.find((b) => b.name.includes(make)) || BRANDS[0];

  const handleSave = () => {
    onSelectBike({ make, model, year });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#ffffff] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[24px]">two_wheeler</span>
            <h3 className="text-[1.25rem] font-bold text-[#1e1b1c]">تحديد دراجتك (دراجتي)</h3>
          </div>
          <button
            aria-label="إغلاق"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4eced] flex items-center justify-center text-[#1e1b1c] hover:bg-[#efe6e7]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-[0.875rem] text-[#574337] leading-relaxed">
          حدد مواصفات دراجتك النارية لنعرض لك حصراً قطع الغيار والسفايف والزيوت المتوافقة 100% مع محركك وهيكلك.
        </p>

        {/* Brand selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.75rem] font-bold text-[#1e1b1c]">الشركة المصنعة</label>
          <div className="grid grid-cols-2 gap-2">
            {BRANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setMake(b.name);
                  setModel(b.models[0]);
                }}
                className={`py-2 px-3 rounded-lg text-right text-[0.875rem] font-semibold border transition-all ${
                  make === b.name
                    ? 'border-[#954500] bg-[#ffdbc8]/30 text-[#954500]'
                    : 'border-[#e9e0e2] bg-[#fff8f8] text-[#1e1b1c] hover:bg-[#f4eced]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.75rem] font-bold text-[#1e1b1c]">الموديل (الطراز)</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-11 px-3 bg-[#f4eced] rounded-lg text-[#1e1b1c] text-[0.875rem] font-medium outline-none border border-transparent focus:border-[#954500]"
            >
              {currentBrandData.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="طراز آخر">طراز آخر (اكتب أدناه)</option>
            </select>
          </div>
          {model === 'طراز آخر' && (
            <input
              type="text"
              placeholder="اكتب موديل دراجتك..."
              className="w-full h-11 px-3 mt-1 bg-[#fff8f8] rounded-lg border border-[#e9e0e2] text-[#1e1b1c] text-[0.875rem] outline-none focus:border-[#954500]"
              onChange={(e) => setModel(e.target.value)}
            />
          )}
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.75rem] font-bold text-[#1e1b1c]">سنة الصنع</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full h-11 px-3 bg-[#f4eced] rounded-lg text-[#1e1b1c] text-[0.875rem] font-medium outline-none border border-transparent focus:border-[#954500]"
          >
            {['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2015 وأقدم'].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-[#2c690b]/10 text-[#2c690b] p-3 rounded-lg flex items-center gap-2 text-[0.8125rem] font-semibold">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>سيتم فلترة جميع نتائج البحث والكتالوج لتناسب: {make} {model} ({year})</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 bg-[#954500] hover:bg-[#bb5800] text-white rounded-lg font-bold text-[0.875rem] transition-all active:scale-[0.98]"
          >
            حفظ وتطبيق التوافق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-12 bg-[#f4eced] text-[#1e1b1c] rounded-lg font-bold text-[0.875rem]"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
