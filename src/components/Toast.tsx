import React from 'react';

interface ToastProps {
  message: string | null;
  icon?: string;
}

export const Toast: React.FC<ToastProps> = ({ message, icon = 'check_circle' }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#332f30] text-[#f7eff0] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 transition-all duration-300 max-w-[90vw] animate-in fade-in slide-in-from-top-2 border border-[#574337]">
      <span className="material-symbols-outlined text-[#aff589] text-[20px]">{icon}</span>
      <span className="text-[0.875rem] font-bold">{message}</span>
    </div>
  );
};
