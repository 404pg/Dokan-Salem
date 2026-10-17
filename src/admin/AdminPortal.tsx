import React, { useState } from 'react';
import { Order, MaintenanceBooking } from '../types';
import { DOKAN_LOGO_URL } from '../data/mockData';
import { SwaggerApiTab } from './components/SwaggerApiTab';
import { FlutterEcosystemTab } from './components/FlutterEcosystemTab';
import { GrafanaDevOpsTab } from './components/GrafanaDevOpsTab';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

export type AdminPortalModule = 'frontend' | 'backend-swagger' | 'flutter' | 'devops-grafana';

interface AdminPortalProps {
  orders: Order[];
  bookings: MaintenanceBooking[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateBookingStatus: (bookingId: string, status: MaintenanceBooking['status']) => void;
  onBackToCustomerApp: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  orders,
  bookings,
  onUpdateOrderStatus,
  onUpdateBookingStatus,
  onBackToCustomerApp,
}) => {
  const [activeModule, setActiveModule] = useState<AdminPortalModule>('frontend');

  return (
    <div className="min-h-screen bg-[#0d0a0b] text-[#f7eff0] flex flex-col w-full font-sans antialiased selection:bg-[#954500] selection:text-white">
      {/* Top Standalone Global Engineering Navigation Bar */}
      <header className="h-16 px-6 bg-[#171b26] border-b border-[#332f30] flex items-center justify-between sticky top-0 z-50 shadow-md">
        {/* Left: Branding & Portal Badge */}
        <div className="flex items-center gap-3">
          <img
            src={DOKAN_LOGO_URL}
            alt="دكان سليم"
            className="h-9 w-auto object-contain invert brightness-200 cursor-pointer"
            onClick={onBackToCustomerApp}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[1rem] text-white">منصة الإدارة والهندسة المركزية</span>
              <span className="text-[10px] bg-[#954500] text-white px-2 py-0.5 rounded font-mono font-bold">
                ENTERPRISE
              </span>
            </div>
            <span className="text-[11px] text-[#ffb68b] font-mono">
              Dokan Saleem Ops • Baghdad Hub (بغداد)
            </span>
          </div>
        </div>

        {/* Center: The 4 Core Requested Pillars */}
        <div className="hidden lg:flex items-center bg-[#0d0a0b] p-1 rounded-xl border border-[#332f30]">
          <button
            onClick={() => setActiveModule('frontend')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-bold transition-all ${
              activeModule === 'frontend'
                ? 'bg-[#954500] text-white shadow-sm'
                : 'text-[#c3c6d5] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Frontend & المخازن</span>
          </button>

          <button
            onClick={() => setActiveModule('backend-swagger')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-bold transition-all ${
              activeModule === 'backend-swagger'
                ? 'bg-[#2c690b] text-white shadow-sm'
                : 'text-[#c3c6d5] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">api</span>
            <span>Backend (Swagger)</span>
          </button>

          <button
            onClick={() => setActiveModule('flutter')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-bold transition-all ${
              activeModule === 'flutter'
                ? 'bg-[#02569B] text-white shadow-sm'
                : 'text-[#c3c6d5] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">phone_android</span>
            <span>Flutter Ecosystem</span>
          </button>

          <button
            onClick={() => setActiveModule('devops-grafana')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-bold transition-all ${
              activeModule === 'devops-grafana'
                ? 'bg-[#F46800] text-white shadow-sm'
                : 'text-[#c3c6d5] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            <span>DevOps (Grafana)</span>
          </button>
        </div>

        {/* Right: Return to Customer App */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCustomerApp}
            className="px-4 py-2 rounded-lg bg-[#332f30] hover:bg-[#574337] text-white text-[0.8125rem] font-bold flex items-center gap-2 border border-[#574337] transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
            <span>شاشة الزبون (Customer App)</span>
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Sub-Header for module switching */}
      <div className="lg:hidden flex items-center justify-around bg-[#171b26] border-b border-[#332f30] p-2 overflow-x-auto">
        <button
          onClick={() => setActiveModule('frontend')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap ${
            activeModule === 'frontend' ? 'bg-[#954500] text-white' : 'text-[#c3c6d5]'
          }`}
        >
          Frontend & المخازن
        </button>
        <button
          onClick={() => setActiveModule('backend-swagger')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap ${
            activeModule === 'backend-swagger' ? 'bg-[#2c690b] text-white' : 'text-[#c3c6d5]'
          }`}
        >
          Backend (Swagger)
        </button>
        <button
          onClick={() => setActiveModule('flutter')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap ${
            activeModule === 'flutter' ? 'bg-[#02569B] text-white' : 'text-[#c3c6d5]'
          }`}
        >
          Flutter
        </button>
        <button
          onClick={() => setActiveModule('devops-grafana')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap ${
            activeModule === 'devops-grafana' ? 'bg-[#F46800] text-white' : 'text-[#c3c6d5]'
          }`}
        >
          DevOps (Grafana)
        </button>
      </div>

      {/* Active Module Viewport */}
      <main className="flex-1 w-full bg-[#171b26]">
        {activeModule === 'frontend' && (
          <AdminDashboardScreen
            orders={orders}
            bookings={bookings}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onUpdateBookingStatus={onUpdateBookingStatus}
            onBackToCustomerApp={onBackToCustomerApp}
          />
        )}

        {activeModule === 'backend-swagger' && <SwaggerApiTab />}

        {activeModule === 'flutter' && <FlutterEcosystemTab />}

        {activeModule === 'devops-grafana' && <GrafanaDevOpsTab />}
      </main>
    </div>
  );
};
