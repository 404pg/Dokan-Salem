export type Screen = 'home' | 'product-details' | 'cart' | 'maintenance' | 'categories' | 'orders' | 'profile' | 'admin';

export type AdminTab = 'overview' | 'inventory' | 'workshop' | 'orders' | 'dispatch' | 'settings';

export interface Mechanic {
  id: string;
  name: string;
  role: 'ورشة الدورة' | 'ورشة حي القاهرة' | 'فيتر جوال متجول';
  phone: string;
  specialty: string;
  status: 'available' | 'on_job' | 'busy' | 'off_duty';
  activeJobsCount: number;
  completedJobsToday: number;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  englishName?: string;
  brand: string;
  origin: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isGenuine: boolean;
  isPopular?: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  stockLocations: {
    dora: number;
    cairo: number;
    sinak: number;
  };
  compatibleBikes: string[];
  specs: {
    material?: string;
    origin?: string;
    position?: string;
    heatResistance?: string;
    [key: string]: string | undefined;
  };
  mechanicNote?: string;
  deliveryTime: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MaintenanceBooking {
  id: string;
  serviceType: 'workshop' | 'mobile';
  branch?: 'doura' | 'qahira';
  district?: string;
  address?: string;
  bikeMake: string;
  bikeModel: string;
  bikeYear: string;
  selectedServices: string[];
  problemDescription: string;
  preferredDay: string;
  preferredTimeSlot: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'mechanic_on_way' | 'in_progress' | 'completed';
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: 'pickup' | 'delivery';
  branchOrAddress: string;
  recipientName: string;
  phoneNumber: string;
  paymentMethod: 'COD';
  status: 'received' | 'preparing' | 'on_the_way' | 'delivered';
  date: string;
}

export interface BikeProfile {
  make: string;
  model: string;
  year: string;
}
