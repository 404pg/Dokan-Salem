import React, { useState } from 'react';
import { AdminTab, Order, MaintenanceBooking, Product, Mechanic } from '../types';
import { PRODUCTS, BRANCHES, MECHANICS, DOKAN_LOGO_URL } from '../data/mockData';

interface AdminDashboardScreenProps {
  orders: Order[];
  bookings: MaintenanceBooking[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateBookingStatus: (bookingId: string, status: MaintenanceBooking['status']) => void;
  onBackToCustomerApp: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  orders,
  bookings,
  onUpdateOrderStatus,
  onUpdateBookingStatus,
  onBackToCustomerApp,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [mechanicsList, setMechanicsList] = useState<Mechanic[]>(MECHANICS);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<'all' | 'dora' | 'cairo' | 'sinak'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(true);
  const [isMobileVanActive, setIsMobileVanActive] = useState(true);
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);

  // Quick stock adjuster
  const adjustStock = (productId: string, location: 'dora' | 'cairo' | 'sinak', delta: number) => {
    setProductsList((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const current = p.stockLocations[location];
          const updated = Math.max(0, current + delta);
          return {
            ...p,
            stockLocations: {
              ...p.stockLocations,
              [location]: updated,
            },
          };
        }
        return p;
      })
    );
  };

  // Toggle mechanic status
  const toggleMechanicStatus = (mechId: string) => {
    setMechanicsList((prev) =>
      prev.map((m) => {
        if (m.id === mechId) {
          const nextStatus: Mechanic['status'] =
            m.status === 'available' ? 'busy' : m.status === 'busy' ? 'on_job' : 'available';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  // Filtered products for inventory
  const filteredProducts = productsList.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0) + 1240000;
  const pendingOrdersCount = orders.filter((o) => o.status !== 'delivered').length;
  const activeBookingsCount = bookings.filter((b) => b.status !== 'completed').length;
  const lowStockCount = productsList.filter(
    (p) => p.stockLocations.dora <= 8 || p.stockLocations.cairo <= 4
  ).length;

  return (
    <div className="min-h-screen bg-[#171b26] text-[#f7eff0] flex flex-col md:flex-row w-full font-sans antialiased">
      {/* Persistent Right-Anchored RTL Sidebar (280px fixed width on desktop) */}
      <aside className="w-full md:w-[280px] bg-[#0d0a0b] border-l border-[#332f30] flex flex-col flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#332f30] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={DOKAN_LOGO_URL} alt="دكان سليم" className="h-9 w-auto object-contain invert brightness-200" />
            <div className="flex flex-col">
              <span className="font-bold text-[0.9375rem] text-white">إدارة دكان سليم</span>
              <span className="text-[10px] text-[#ffb68b] font-mono">الورشة والمستودع المركزي</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#aff589] animate-pulse" title="النظام متصل لحظياً"></span>
        </div>

        {/* Back to Client App Switcher */}
        <div className="p-3 border-b border-[#332f30]">
          <button
            onClick={onBackToCustomerApp}
            className="w-full py-2.5 px-3 rounded-lg bg-[#954500] hover:bg-[#bb5800] text-white text-[0.8125rem] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
            <span>العودة لتطبيق الزبون</span>
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'لوحة التحكم والعمليات', icon: 'dashboard' },
            { id: 'inventory', label: 'المخزون ومستودعات بغداد', icon: 'warehouse', badge: lowStockCount },
            { id: 'workshop', label: 'إدارة الورش وحجوزات الفيتر', icon: 'build_circle', badge: activeBookingsCount },
            { id: 'orders', label: 'طلبات الزبائن والتوصيل', icon: 'local_shipping', badge: pendingOrdersCount },
            { id: 'dispatch', label: 'كادر الفيترية والطوارئ', icon: 'engineering' },
            { id: 'settings', label: 'إعدادات المنظومة والفروع', icon: 'settings' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-[0.875rem] font-bold transition-all text-right ${
                  isActive
                    ? 'bg-[#954500] text-white shadow-md'
                    : 'text-[#dfe2f1] hover:bg-[#1e1b1c] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                      isActive ? 'bg-white text-[#954500]' : 'bg-[#ba1a1a] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Branch Status Footer */}
        <div className="p-3.5 border-t border-[#332f30] bg-[#1e1b1c]/60 text-[0.75rem] text-[#c3c6d5] space-y-1">
          <div className="flex justify-between items-center">
            <span>فرع الدورة:</span>
            <span className="text-[#aff589] font-bold">مفتوح (طاقة 100%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span>فرع القاهرة:</span>
            <span className="text-[#aff589] font-bold">مفتوح (طاقة 85%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span>مستودع السنك:</span>
            <span className="text-[#ffb68b] font-bold">جاهز للشحن</span>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#171b26] overflow-y-auto">
        {/* Top Operational Bar */}
        <header className="h-16 px-6 bg-[#0d0a0b]/80 backdrop-blur-md border-b border-[#332f30] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-[1.125rem] font-bold text-white">
              {activeTab === 'overview' && 'مركز العمليات والمبيعات المباشرة'}
              {activeTab === 'inventory' && 'إدارة المستودعات وجرد قطع الغيار في بغداد'}
              {activeTab === 'workshop' && 'جدول ورشات الصيانة وتوجيه الفيتر الجوال'}
              {activeTab === 'orders' && 'سجل طلبيات الشحن والتسليم الميداني (COD)'}
              {activeTab === 'dispatch' && 'فريق الفيترية وطوارئ الطرق السريعة'}
              {activeTab === 'settings' && 'إعدادات التسعير والفروع وساعات العمل'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#1e1b1c] px-3 py-1.5 rounded-lg border border-[#332f30] text-[0.75rem]">
              <span className="text-[#c3c6d5]">المستخدم:</span>
              <span className="font-bold text-[#ffb68b]">سليم الخزرجي (مدير عام)</span>
            </div>
            <button
              onClick={onBackToCustomerApp}
              className="px-3 py-1.5 bg-[#332f30] hover:bg-[#574337] text-white rounded-lg text-[0.75rem] font-bold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span className="hidden sm:inline">معاينة المتجر</span>
            </button>
          </div>
        </header>

        {/* Tab 1: Overview & Analytics */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0d0a0b] p-4 rounded-xl border border-[#332f30] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[0.75rem] font-bold text-[#c3c6d5]">مبيعات اليوم الكلية</span>
                  <span className="w-8 h-8 rounded-lg bg-[#954500]/20 text-[#ffb68b] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-[1.5rem] font-bold text-white font-mono">
                    {totalRevenue.toLocaleString('en-US')}
                  </span>
                  <span className="text-[0.75rem] text-[#c3c6d5] mr-1">د.ع</span>
                </div>
                <div className="flex items-center gap-1 text-[0.75rem] text-[#aff589]">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>+16.4% مقارنة بيوم أمس</span>
                </div>
              </div>

              <div className="bg-[#0d0a0b] p-4 rounded-xl border border-[#332f30] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[0.75rem] font-bold text-[#c3c6d5]">طلبات قيد التجهيز والتوصيل</span>
                  <span className="w-8 h-8 rounded-lg bg-[#2c690b]/20 text-[#aff589] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-[1.5rem] font-bold text-white font-mono">{orders.length}</span>
                  <span className="text-[0.75rem] text-[#c3c6d5] mr-1">طلبات نشطة</span>
                </div>
                <div className="text-[0.75rem] text-[#dfe2f1]">
                  بغداد (الكرخ والرصافة) والمحافظات
                </div>
              </div>

              <div className="bg-[#0d0a0b] p-4 rounded-xl border border-[#332f30] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[0.75rem] font-bold text-[#c3c6d5]">حجوزات الصيانة والفيتر</span>
                  <span className="w-8 h-8 rounded-lg bg-[#5a5e6b]/30 text-[#dfe2f1] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">build</span>
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-[1.5rem] font-bold text-white font-mono">{bookings.length}</span>
                  <span className="text-[0.75rem] text-[#c3c6d5] mr-1">دراجات بالجدول</span>
                </div>
                <div className="text-[0.75rem] text-[#aff589]">
                  4 فنيين متوفرين بالورشات حالياً
                </div>
              </div>

              <div className="bg-[#0d0a0b] p-4 rounded-xl border border-[#332f30] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[0.75rem] font-bold text-[#c3c6d5]">تنبيهات نقص المخزون</span>
                  <span className="w-8 h-8 rounded-lg bg-[#ba1a1a]/20 text-[#ffdad6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-[1.5rem] font-bold text-[#ffdad6] font-mono">{lowStockCount}</span>
                  <span className="text-[0.75rem] text-[#c3c6d5] mr-1">قطع قريبة من النفاد</span>
                </div>
                <div className="text-[0.75rem] text-[#ffdad6]">
                  يجب التعزيز من مستودع السنك
                </div>
              </div>
            </div>

            {/* Emergency SOS Banner in Baghdad */}
            <div className="bg-[#93000a]/30 border border-[#ba1a1a] p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span className="material-symbols-outlined text-[24px]">sos</span>
                </span>
                <div>
                  <h4 className="font-bold text-white text-[0.9375rem]">خدمة طوارئ فيترية الطرق السريعة (24/7)</h4>
                  <p className="text-[0.8125rem] text-[#ffdad6]">
                    جاهزية 2 دراجة صيانة مجهزة بمضخات هواء وبطاريات وعدد فك سريعة في المنصور والدورة.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('dispatch')}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/80 text-white font-bold text-[0.75rem] rounded-lg transition-colors whitespace-nowrap"
              >
                فتح خريطة التوجيه
              </button>
            </div>

            {/* Recent Orders & Bookings Dual Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Bookings Card */}
              <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb68b] text-[20px]">event_available</span>
                    <h3 className="font-bold text-white text-[1rem]">أحدث حجوزات الصيانة</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('workshop')}
                    className="text-[0.75rem] text-[#ffb68b] font-bold hover:underline"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="space-y-2.5">
                  {bookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-[#1e1b1c] rounded-lg border border-[#332f30] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#ffb68b]">#{b.id}</span>
                          <span className="text-[0.8125rem] text-white font-bold">
                            {b.bikeMake} {b.bikeModel} ({b.bikeYear})
                          </span>
                        </div>
                        <p className="text-[0.75rem] text-[#c3c6d5] mt-0.5">
                          {b.selectedServices.slice(0, 2).join('، ')}
                        </p>
                      </div>

                      <div className="text-left flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#954500]/30 text-[#ffb68b] border border-[#954500]">
                          {b.serviceType === 'workshop' ? 'بالورشة' : 'فيتر جوال'}
                        </span>
                        <span className="text-[11px] text-[#aff589] font-medium">{b.preferredTimeSlot}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Orders Card */}
              <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#aff589] text-[20px]">shopping_bag</span>
                    <h3 className="font-bold text-white text-[1rem]">أحدث طلبات قطع الغيار (COD)</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-[0.75rem] text-[#ffb68b] font-bold hover:underline"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="space-y-2.5">
                  {orders.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      className="p-3 bg-[#1e1b1c] rounded-lg border border-[#332f30] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#aff589]">#{o.id}</span>
                          <span className="text-[0.8125rem] text-white font-bold">{o.recipientName}</span>
                        </div>
                        <p className="text-[0.75rem] text-[#c3c6d5] mt-0.5 truncate max-w-[220px]">
                          {o.branchOrAddress}
                        </p>
                      </div>

                      <div className="text-left flex flex-col items-end gap-1">
                        <span className="font-mono font-bold text-white text-[0.875rem]">
                          {o.total.toLocaleString('en-US')} د.ع
                        </span>
                        <span className="text-[10px] bg-[#2c690b]/30 text-[#aff589] px-2 py-0.5 rounded font-bold">
                          {o.status === 'received' ? 'مستلم جديد' : 'قيد التجهيز'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory & Multi-Hub Warehouse Management */}
        {activeTab === 'inventory' && (
          <div className="p-6 space-y-5">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0a0b] p-3.5 rounded-xl border border-[#332f30]">
              <div className="relative flex-1 w-full sm:w-auto">
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#c3c6d5]">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو رقم الـ SKU أو الماركة..."
                  className="w-full h-10 pr-9 pl-4 bg-[#1e1b1c] rounded-lg text-[0.875rem] text-white placeholder:text-[#c3c6d5]/60 outline-none border border-[#332f30] focus:border-[#954500]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-[0.75rem] text-[#c3c6d5] flex-shrink-0">عرض الفرع:</span>
                {[
                  { id: 'all', label: 'كافة الفروع' },
                  { id: 'dora', label: 'فرع الدورة' },
                  { id: 'cairo', label: 'فرع القاهرة' },
                  { id: 'sinak', label: 'مستودع السنك' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranchFilter(b.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-bold transition-all whitespace-nowrap ${
                      selectedBranchFilter === b.id
                        ? 'bg-[#954500] text-white'
                        : 'bg-[#1e1b1c] text-[#c3c6d5] hover:text-white border border-[#332f30]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Inventory Table */}
            <div className="bg-[#0d0a0b] rounded-xl border border-[#332f30] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[0.8125rem]">
                  <thead className="bg-[#1e1b1c] text-[#c3c6d5] border-b border-[#332f30] text-[0.75rem]">
                    <tr>
                      <th className="p-3.5">المنتج والـ SKU</th>
                      <th className="p-3.5">السعر (د.ع)</th>
                      <th className="p-3.5 text-center">فرع الدورة</th>
                      <th className="p-3.5 text-center">فرع القاهرة</th>
                      <th className="p-3.5 text-center">مستودع السنك</th>
                      <th className="p-3.5 text-center">المجموع الكلي</th>
                      <th className="p-3.5 text-center">حالة المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#332f30]">
                    {filteredProducts.map((p) => {
                      const totalStock = p.stockLocations.dora + p.stockLocations.cairo + p.stockLocations.sinak;
                      const isLow = p.stockLocations.dora <= 8 || p.stockLocations.cairo <= 4;
                      return (
                        <tr key={p.id} className="hover:bg-[#1e1b1c]/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-contain rounded bg-[#1e1b1c] p-1 border border-[#332f30]" />
                              <div>
                                <h4 className="font-bold text-white text-[0.875rem]">{p.name}</h4>
                                <span className="font-mono text-[11px] text-[#ffb68b]">{p.sku}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-white">
                            {p.price.toLocaleString('en-US')}
                          </td>

                          {/* Dora Branch with live stepper */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#1e1b1c] p-1 rounded-lg border border-[#332f30]">
                              <button
                                onClick={() => adjustStock(p.id, 'dora', -1)}
                                className="w-6 h-6 rounded bg-[#332f30] hover:bg-[#574337] text-white flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold font-mono text-[#aff589]">
                                {p.stockLocations.dora}
                              </span>
                              <button
                                onClick={() => adjustStock(p.id, 'dora', 1)}
                                className="w-6 h-6 rounded bg-[#332f30] hover:bg-[#574337] text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Cairo Branch with live stepper */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#1e1b1c] p-1 rounded-lg border border-[#332f30]">
                              <button
                                onClick={() => adjustStock(p.id, 'cairo', -1)}
                                className="w-6 h-6 rounded bg-[#332f30] hover:bg-[#574337] text-white flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold font-mono text-[#aff589]">
                                {p.stockLocations.cairo}
                              </span>
                              <button
                                onClick={() => adjustStock(p.id, 'cairo', 1)}
                                className="w-6 h-6 rounded bg-[#332f30] hover:bg-[#574337] text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Sinak Warehouse with live stepper */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#1e1b1c] p-1 rounded-lg border border-[#332f30]">
                              <button
                                onClick={() => adjustStock(p.id, 'sinak', -1)}
                                className="w-6 h-6 rounded bg-[#332f30] hover:bg-[#574337] text-white flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold font-mono text-[#ffb68b]">
                                {p.stockLocations.sinak}
                              </span>
                              <button
                                onClick={() => adjustStock(p.id, 'sinak', 1)}
                                className="w-6 h-6 rounded bg-[#332f30] hover:bg-[#574337] text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="p-3.5 text-center font-bold font-mono text-white text-[0.9375rem]">
                            {totalStock}
                          </td>

                          <td className="p-3.5 text-center">
                            {isLow ? (
                              <span className="inline-block px-2.5 py-1 bg-[#ba1a1a]/20 text-[#ffdad6] border border-[#ba1a1a] rounded-full font-bold text-[10px]">
                                منخفض (أعد الطلب)
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 bg-[#2c690b]/20 text-[#aff589] border border-[#2c690b] rounded-full font-bold text-[10px]">
                                متوفر ومستقر
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Workshop Bays & Mechanics Dispatch */}
        {activeTab === 'workshop' && (
          <div className="p-6 space-y-6">
            {/* Workshop Bay Availability Grid */}
            <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
              <h3 className="font-bold text-white text-[1rem] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb68b]">garage</span>
                <span>حالة الروافع ومنصات الفحص الحالية (فرع الدورة والقاهرة)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#1e1b1c] border border-[#332f30] flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-[0.875rem]">رافعة هيدروليكية 1</span>
                    <span className="text-[10px] bg-[#ba1a1a]/20 text-[#ffdad6] px-2 py-0.5 rounded font-bold">
                      مشغولة
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-[#c3c6d5]">باجاج بوكسر 150 - تبديل سفايف فرامل</p>
                  <span className="text-[11px] text-[#ffb68b] mt-2 block font-medium">الفيتر: حيدر الفيتر</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1e1b1c] border border-[#332f30] flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-[0.875rem]">رافعة هيدروليكية 2</span>
                    <span className="text-[10px] bg-[#2c690b]/20 text-[#aff589] px-2 py-0.5 rounded font-bold">
                      متاحة الآن
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-[#c3c6d5]">جاهزة لاستقبال موعد فوري</p>
                  <span className="text-[11px] text-[#aff589] mt-2 block font-medium">ورشة الدورة</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1e1b1c] border border-[#332f30] flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-[0.875rem]">منصة فحص الكمبيوتر</span>
                    <span className="text-[10px] bg-[#ba1a1a]/20 text-[#ffdad6] px-2 py-0.5 rounded font-bold">
                      قيد الفحص
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-[#c3c6d5]">ياماها MT-07 - تشخيص كود حاقن الوقود</p>
                  <span className="text-[11px] text-[#ffb68b] mt-2 block font-medium">المهندس: أحمد الكهربائي</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1e1b1c] border border-[#332f30] flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-[0.875rem]">طاولة تجفيت المحركات</span>
                    <span className="text-[10px] bg-[#954500]/20 text-[#ffb68b] px-2 py-0.5 rounded font-bold">
                      نص عمرة
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-[#c3c6d5]">تيفي إس أباتشي - تبديل بساتن ورنكات</p>
                  <span className="text-[11px] text-[#ffb68b] mt-2 block font-medium">ورشة حي القاهرة</span>
                </div>
              </div>
            </div>

            {/* Bookings Queue and Dispatch Table */}
            <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-[1rem] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#aff589]">schedule</span>
                  <span>طابور الحجوزات وإسناد الفيترية</span>
                </h3>
              </div>

              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-[#1e1b1c] rounded-xl border border-[#332f30] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#ffb68b] text-[1rem]">#{b.id}</span>
                        <span className="text-white font-bold text-[0.9375rem]">
                          {b.bikeMake} {b.bikeModel} ({b.bikeYear})
                        </span>
                        <span className="text-[10px] bg-[#332f30] text-[#dfe2f1] px-2 py-0.5 rounded font-bold">
                          {b.serviceType === 'workshop' ? 'داخل الورشة' : 'فيتر جوال'}
                        </span>
                      </div>
                      <p className="text-[0.8125rem] text-[#c3c6d5]">
                        <strong>الخدمات:</strong> {b.selectedServices.join(' + ')}
                      </p>
                      {b.problemDescription && (
                        <p className="text-[0.75rem] text-[#ffb68b] italic">
                          "الملاحظة: {b.problemDescription}"
                        </p>
                      )}
                      <p className="text-[0.75rem] text-[#dfe2f1]">
                        الموعد المفضل: {b.preferredDay} ({b.preferredTimeSlot})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <select
                        value={b.status}
                        onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as any)}
                        className="h-10 px-3 bg-[#0d0a0b] text-white rounded-lg text-[0.8125rem] font-bold border border-[#332f30] outline-none focus:border-[#954500]"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="confirmed">تم تأكيد الموعد</option>
                        <option value="mechanic_on_way">الفيتر بالطريق للزبون</option>
                        <option value="in_progress">قيد الفحص والإصلاح</option>
                        <option value="completed">تم الانتهاء وتسليم الدراجة</option>
                      </select>

                      <a
                        href={`tel:${MECHANICS[0].phone}`}
                        className="h-10 px-3 bg-[#2c690b] hover:bg-[#1d5200] text-white rounded-lg text-[0.75rem] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>اتصال بالفيتر</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Orders & Delivery Courier Dispatch */}
        {activeTab === 'orders' && (
          <div className="p-6 space-y-5">
            <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-[1rem] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#aff589]">local_shipping</span>
                  <span>طلبيات قطع الغيار وشحن المحافظات (الدفع عند الاستلام)</span>
                </h3>
              </div>

              <div className="space-y-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 bg-[#1e1b1c] rounded-xl border border-[#332f30] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#aff589] text-[1rem]">#{o.id}</span>
                        <span className="text-white font-bold text-[0.9375rem]">{o.recipientName}</span>
                        <span className="font-mono text-[11px] text-[#c3c6d5]">({o.phoneNumber})</span>
                        <span className="text-[10px] bg-[#954500]/20 text-[#ffb68b] px-2 py-0.5 rounded font-bold">
                          {o.fulfillment === 'delivery' ? 'توصيل منزل' : 'استلام فرع'}
                        </span>
                      </div>

                      <p className="text-[0.8125rem] text-[#c3c6d5]">
                        <strong>العنوان:</strong> {o.branchOrAddress}
                      </p>

                      <div className="text-[0.75rem] text-[#dfe2f1] flex items-center gap-2">
                        <span>القطع:</span>
                        {o.items.map((it, idx) => (
                          <span key={idx} className="bg-[#332f30] px-1.5 py-0.5 rounded">
                            {it.quantity}× {it.product.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-left">
                        <span className="font-mono font-bold text-white text-[1.125rem] block">
                          {o.total.toLocaleString('en-US')} د.ع
                        </span>
                        <span className="text-[10px] text-[#aff589]">COD نقدًا عند الاستلام</span>
                      </div>

                      <select
                        value={o.status}
                        onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any)}
                        className="h-10 px-3 bg-[#0d0a0b] text-white rounded-lg text-[0.8125rem] font-bold border border-[#332f30] outline-none focus:border-[#954500]"
                      >
                        <option value="received">مستلم جديد</option>
                        <option value="preparing">قيد التجهيز من الرف</option>
                        <option value="on_the_way">مع مندوب التوصيل</option>
                        <option value="delivered">تم التسليم واستلام المبلغ</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Mechanics Roster & Mobile Team */}
        {activeTab === 'dispatch' && (
          <div className="p-6 space-y-5">
            <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-[1rem]">كادر الفيترية والورش المعتمدين</h3>
                  <p className="text-[0.75rem] text-[#c3c6d5]">متابعة التواجد والإسناد في بغداد</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mechanicsList.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-[#1e1b1c] rounded-xl border border-[#332f30] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#954500] text-white flex items-center justify-center font-bold text-[1.125rem]">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-[0.9375rem]">{m.name}</h4>
                          <span className="text-[0.75rem] text-[#ffb68b]">{m.role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleMechanicStatus(m.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          m.status === 'available'
                            ? 'bg-[#2c690b] text-white'
                            : m.status === 'on_job'
                            ? 'bg-[#954500] text-white'
                            : 'bg-[#5a5e6b] text-white'
                        }`}
                      >
                        {m.status === 'available' && '● متاح للطلب'}
                        {m.status === 'on_job' && '● في موقع صيانة'}
                        {m.status === 'busy' && '● مشغول'}
                      </button>
                    </div>

                    <p className="text-[0.75rem] text-[#dfe2f1] bg-[#0d0a0b] p-2 rounded">
                      <strong>التخصص:</strong> {m.specialty}
                    </p>

                    <div className="flex items-center justify-between text-[0.75rem] text-[#c3c6d5] border-t border-[#332f30] pt-2">
                      <span>إنجاز اليوم: <strong>{m.completedJobsToday} دراجات</strong></span>
                      <a
                        href={`tel:${m.phone}`}
                        className="flex items-center gap-1 text-[#ffb68b] font-bold hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>{m.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Workshop Settings & Pricing */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 max-w-3xl">
            <div className="bg-[#0d0a0b] p-5 rounded-xl border border-[#332f30] space-y-4">
              <h3 className="font-bold text-white text-[1rem]">التحكم في خدمات الصيانة المباشرة</h3>

              {/* Maintenance On/Off Toggle (Matches Design Constitution: 48x28px track with #454955 inactive and #3F7D20 active) */}
              <div className="flex items-center justify-between p-3.5 bg-[#1e1b1c] rounded-xl border border-[#332f30]">
                <div>
                  <h4 className="font-bold text-white text-[0.875rem]">استقبال طلبات صيانة الورشات (الدورة والقاهرة)</h4>
                  <p className="text-[0.75rem] text-[#c3c6d5]">إتاحة حجز المواعيد على التطبيق</p>
                </div>
                <button
                  onClick={() => setIsMaintenanceActive(!isMaintenanceActive)}
                  style={{
                    backgroundColor: isMaintenanceActive ? '#2c690b' : '#454955',
                    width: '48px',
                    height: '28px',
                  }}
                  className="rounded-full p-1 transition-colors relative flex items-center cursor-pointer"
                >
                  <span
                    style={{
                      transform: isMaintenanceActive ? 'translateX(-20px)' : 'translateX(0px)',
                    }}
                    className="w-5 h-5 rounded-full bg-white transition-transform block"
                  />
                </button>
              </div>

              {/* Mobile Van On/Off Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#1e1b1c] rounded-xl border border-[#332f30]">
                <div>
                  <h4 className="font-bold text-white text-[0.875rem]">خدمة الفيتر الجوّال (بغداد)</h4>
                  <p className="text-[0.75rem] text-[#c3c6d5]">تفعيل إرسال فني إلى موقع دراجة الزبون</p>
                </div>
                <button
                  onClick={() => setIsMobileVanActive(!isMobileVanActive)}
                  style={{
                    backgroundColor: isMobileVanActive ? '#2c690b' : '#454955',
                    width: '48px',
                    height: '28px',
                  }}
                  className="rounded-full p-1 transition-colors relative flex items-center cursor-pointer"
                >
                  <span
                    style={{
                      transform: isMobileVanActive ? 'translateX(-20px)' : 'translateX(0px)',
                    }}
                    className="w-5 h-5 rounded-full bg-white transition-transform block"
                  />
                </button>
              </div>

              {/* Working hours & Contact */}
              <div className="p-3.5 bg-[#1e1b1c] rounded-xl border border-[#332f30] space-y-2 text-[0.8125rem]">
                <h4 className="font-bold text-white">ساعات عمل الفروع الرسمية:</h4>
                <p className="text-[#c3c6d5]">• فرع الدورة: 8:00 صباحاً حتى 10:00 مساءً يومياً</p>
                <p className="text-[#c3c6d5]">• فرع حي القاهرة: 8:30 صباحاً حتى 9:30 مساءً يومياً</p>
                <p className="text-[#c3c6d5]">• مستودع السنك: 7:30 صباحاً حتى 6:00 مساءً</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
