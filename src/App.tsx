import React, { useState, useEffect } from 'react';
import { Screen, Product, CartItem, BikeProfile, Order, MaintenanceBooking } from './types';
import { PRODUCTS, BRANCHES } from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { BikeSelectModal } from './components/BikeSelectModal';
import { BranchSelectModal } from './components/BranchSelectModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { SearchModal } from './components/SearchModal';
import { CheckoutModal } from './components/CheckoutModal';

import { HomeScreen } from './screens/HomeScreen';
import { ProductDetailsScreen } from './screens/ProductDetailsScreen';
import { CartScreen } from './screens/CartScreen';
import { MaintenanceBookingScreen } from './screens/MaintenanceBookingScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AdminPortal } from './admin/AdminPortal';

export default function App() {
  const getInitialScreen = (): Screen => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        return 'admin';
      }
    }
    return 'home';
  };

  const [currentScreen, setCurrentScreen] = useState<Screen>(getInitialScreen());
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]); // Brembo pads

  // Initial cart items matching Image 6.png mockup (Motul 2x, Brembo 1x, NGK 2x = 97,000 IQD)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: PRODUCTS[1], quantity: 2 }, // Motul 7100
    { product: PRODUCTS[0], quantity: 1 }, // Brembo brake pads
    { product: PRODUCTS[5], quantity: 2 }, // NGK spark plugs
  ]);

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('dora');

  // Active motorcycle profile matching Image 2.png
  const [currentBike, setCurrentBike] = useState<BikeProfile>({
    make: 'باجاج (Bajaj)',
    model: 'بوكسر 150',
    year: '2022',
  });

  const [favoriteIds, setFavoriteIds] = useState<string[]>(['brembo-brakes-7045']);
  const [maintenanceMode, setMaintenanceMode] = useState<'workshop' | 'mobile'>('workshop');
  const [categoriesFilter, setCategoriesFilter] = useState<string>('all');

  // Existing orders & bookings
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-9842',
      items: [
        { product: PRODUCTS[1], quantity: 1 },
        { product: PRODUCTS[2], quantity: 1 },
      ],
      subtotal: 38500,
      deliveryFee: 5000,
      total: 43500,
      fulfillment: 'delivery',
      branchOrAddress: 'بغداد - الكرادة خارج',
      recipientName: 'سجاد العراقي',
      phoneNumber: '07701234567',
      paymentMethod: 'COD',
      status: 'preparing',
      date: 'اليوم، 11:30 ص',
    },
  ]);

  const [bookings, setBookings] = useState<MaintenanceBooking[]>([
    {
      id: 'DK-8842',
      serviceType: 'workshop',
      branch: 'doura',
      bikeMake: 'باجاج (Bajaj)',
      bikeModel: 'بوكسر 150',
      bikeYear: '2022',
      selectedServices: ['صيانة دورية وتبديل زيت وفلاتر', 'فحص منظومة الفرامل والدسك'],
      problemDescription: 'تبديل زيت موتول مع فحص سفايف الفرامل الأمامية',
      preferredDay: 'اليوم (فوري)',
      preferredTimeSlot: 'صباحاً (9:00 ص - 1:00 م)',
      createdAt: 'اليوم',
      status: 'confirmed',
    },
  ]);

  // Modals state
  const [isBikeModalOpen, setIsBikeModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('check_circle');

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentScreen('admin');
      } else if (currentScreen === 'admin') {
        setCurrentScreen('home');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin shortcut for developers/managers: Alt + A
      if (e.altKey && (e.key === 'a' || e.key === 'A' || e.key === 'ش')) {
        e.preventDefault();
        navigateTo(currentScreen === 'admin' ? 'home' : 'admin');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentScreen]);

  const showToast = (message: string, icon = 'check_circle') => {
    setToastMessage(message);
    setToastIcon(icon);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`تمت إضافة ${quantity} إلى سلة التسوق بنجاح`, 'shopping_bag');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('تم حذف المنتج من السلة', 'delete');
  };

  const handleToggleFavorite = (productId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(productId)) {
        showToast('تمت الإزالة من المفضلة', 'heart_broken');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('تمت الإضافة إلى المفضلة', 'favorite');
        return [...prev, productId];
      }
    });
  };

  const handleInstantBuy = (product: Product, quantity: number) => {
    handleAddToCart(product, quantity);
    setIsCheckoutModalOpen(true);
  };

  const handleOrderPlaced = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setCartItems([]);
    showToast(`تم تأكيد الطلب #${order.id} بنجاح!`, 'local_shipping');
    setCurrentScreen('orders');
  };

  const handleBookingSubmitted = (booking: MaintenanceBooking) => {
    setBookings((prev) => [booking, ...prev]);
    showToast(`تم تسجيل موعد الصيانة #${booking.id}!`, 'event_available');
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast(`تم تحديث حالة الطلب #${orderId}`, 'local_shipping');
  };

  const handleUpdateBookingStatus = (bookingId: string, status: MaintenanceBooking['status']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    showToast(`تم تحديث موعد الصيانة #${bookingId}`, 'build');
  };

  const activeBranch = BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0];
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    if (typeof window !== 'undefined') {
      if (screen === 'admin') {
        window.location.hash = '#admin';
      } else if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  };

  // If in Admin Portal mode, render full standalone separate screen layout
  if (currentScreen === 'admin') {
    return (
      <div className="min-h-screen bg-[#0d0a0b] text-white w-full">
        <AdminPortal
          orders={orders}
          bookings={bookings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onBackToCustomerApp={() => navigateTo('home')}
        />
        <Toast message={toastMessage} icon={toastIcon} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#1e1b1c] font-sans antialiased selection:bg-[#954500] selection:text-white flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[#fff8f8] min-h-screen relative flex flex-col shadow-sm">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          cartCount={cartCount}
          selectedBranchName={activeBranch.name}
          onNavigate={(screen) => navigateTo(screen)}
          onOpenBranchModal={() => setIsBranchModalOpen(true)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onOpenBikeModal={() => setIsBikeModalOpen(true)}
          productTitle={selectedProduct.name}
        />

        {/* Dynamic Screen Container */}
        <main className="flex-1 w-full flex flex-col">
          {currentScreen === 'home' && (
            <HomeScreen
              currentBike={currentBike}
              onOpenBikeModal={() => setIsBikeModalOpen(true)}
              onOpenScanner={() => setIsScannerModalOpen(true)}
              onOpenSearch={() => setIsSearchModalOpen(true)}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                navigateTo('product-details');
              }}
              onAddToCart={handleAddToCart}
              onBookMaintenance={(mode) => {
                setMaintenanceMode(mode);
                navigateTo('maintenance');
              }}
              onOpenCategories={(category) => {
                setCategoriesFilter(category || 'all');
                navigateTo('categories');
              }}
              onToggleFavorite={handleToggleFavorite}
              favoriteIds={favoriteIds}
            />
          )}

          {currentScreen === 'product-details' && (
            <ProductDetailsScreen
              product={selectedProduct}
              currentBike={currentBike}
              onAddToCart={handleAddToCart}
              onInstantBuy={handleInstantBuy}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favoriteIds.includes(selectedProduct.id)}
              onBack={() => navigateTo('home')}
              onOpenBikeModal={() => setIsBikeModalOpen(true)}
            />
          )}

          {currentScreen === 'cart' && (
            <CartScreen
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              fulfillmentType={fulfillmentType}
              onFulfillmentChange={setFulfillmentType}
              onProceedCheckout={() => setIsCheckoutModalOpen(true)}
              onContinueShopping={() => navigateTo('home')}
            />
          )}

          {currentScreen === 'maintenance' && (
            <MaintenanceBookingScreen
              initialMode={maintenanceMode}
              currentBike={currentBike}
              onBookingSubmitted={handleBookingSubmitted}
              onViewOrders={() => navigateTo('orders')}
            />
          )}

          {currentScreen === 'categories' && (
            <CategoriesScreen
              initialCategory={categoriesFilter}
              currentBike={currentBike}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                navigateTo('product-details');
              }}
              onAddToCart={handleAddToCart}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentScreen === 'orders' && (
            <OrdersScreen
              orders={orders}
              bookings={bookings}
              onStartShopping={() => navigateTo('home')}
              onBookMaintenance={() => {
                setMaintenanceMode('workshop');
                navigateTo('maintenance');
              }}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              currentBike={currentBike}
              onOpenBikeModal={() => setIsBikeModalOpen(true)}
              onOpenBranchModal={() => setIsBranchModalOpen(true)}
              favoriteIds={favoriteIds}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                navigateTo('product-details');
              }}
              onStartShopping={() => navigateTo('home')}
            />
          )}
        </main>

        {/* Global Bottom Navigation (for tab screens) */}
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={(screen) => navigateTo(screen)}
          cartCount={cartCount}
        />

        {/* Global Toast Feedback */}
        <Toast message={toastMessage} icon={toastIcon} />

        {/* Modals */}
        <BikeSelectModal
          isOpen={isBikeModalOpen}
          onClose={() => setIsBikeModalOpen(false)}
          currentBike={currentBike}
          onSelectBike={(b) => {
            setCurrentBike(b);
            showToast(`تم تعيين دراجتك: ${b.make} ${b.model}`, 'two_wheeler');
          }}
        />

        <BranchSelectModal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          selectedBranchId={selectedBranchId}
          onSelectBranch={(id) => {
            setSelectedBranchId(id);
            const b = BRANCHES.find((item) => item.id === id);
            if (b) showToast(`تم اختيار ${b.name}`, 'location_on');
          }}
        />

        <BarcodeScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          onProductFound={(product) => {
            setSelectedProduct(product);
            setCurrentScreen('product-details');
            showToast(`تم العثور على: ${product.name}`, 'verified');
          }}
        />

        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelectProduct={(product) => {
            setSelectedProduct(product);
            setCurrentScreen('product-details');
          }}
          onOpenScanner={() => setIsScannerModalOpen(true)}
        />

        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          items={cartItems}
          subtotal={cartSubtotal}
          deliveryType={fulfillmentType}
          onOrderPlaced={handleOrderPlaced}
        />
      </div>
    </div>
  );
}
