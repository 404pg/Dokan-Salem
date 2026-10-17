import React from 'react';
import { BRANCHES } from '../data/mockData';

interface BranchSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
}

export const BranchSelectModal: React.FC<BranchSelectModalProps> = ({
  isOpen,
  onClose,
  selectedBranchId,
  onSelectBranch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#ffffff] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-[#e9e0e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#954500] text-[24px]">location_on</span>
            <h3 className="text-[1.25rem] font-bold text-[#1e1b1c]">اختر فرع دكان سليم</h3>
          </div>
          <button
            aria-label="إغلاق"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4eced] flex items-center justify-center text-[#1e1b1c] hover:bg-[#efe6e7]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-[0.875rem] text-[#574337]">
          اختر الفرع الأقرب إليك لمعاينة توفر القطع على الرفوف فوراً أو لحجز موعد الصيانة:
        </p>

        <div className="flex flex-col gap-3">
          {BRANCHES.map((b) => {
            const isSelected = selectedBranchId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => {
                  onSelectBranch(b.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#954500] bg-[#ffdbc8]/20'
                    : 'border-[#e9e0e2] bg-[#faf1f3] hover:border-[#8a7265]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#954500] text-[20px]">
                      {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <h4 className="font-bold text-[#1e1b1c] text-[0.9375rem]">{b.name}</h4>
                  </div>
                  <span className="text-[11px] font-bold text-[#2c690b] bg-[#2c690b]/10 px-2 py-0.5 rounded">
                    مفتوح
                  </span>
                </div>
                <p className="text-[0.8125rem] text-[#574337] mr-7 mb-1">{b.subtext}</p>
                <p className="text-[0.75rem] text-[#5e626f] mr-7 mb-2 leading-relaxed">{b.services}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#e9e0e2]/60 text-[0.75rem]">
                  <span className="text-[#574337] font-medium">{b.status}</span>
                  <a
                    href={`tel:${b.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[#954500] font-bold hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>{b.phone}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
