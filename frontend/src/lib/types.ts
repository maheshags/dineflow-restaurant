export interface FoodItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  availability: boolean;
  bestseller: boolean;
  rating: number;
  totalOrders: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  itemCount: number;
}

export interface InventoryItem {
  id: string;
  foodId: string;
  foodName: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

export type OrderStatus = 'pending' | 'new' | 'accepted' | 'preparing' | 'ready' | 'assigned' | 'picked' | 'out-for-delivery' | 'delivered' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'cash' | 'qr';

export interface OrderItem {
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes: string;
  diningType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  deliveryPersonId?: string | null;
  deliveryPersonName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicle: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  totalDeliveries: number;
  rating: number;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpending: number;
  joinedDate: string;
  lastOrderDate: string;
  status: 'active' | 'inactive';
  favoriteItems: string[];
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  foodId: string;
  foodName: string;
  rating: number;
  text: string;
  date: string;
  status: 'published' | 'hidden' | 'flagged';
}

export interface PaymentSettings {
  upiId: string;
  qrCodeImage: string;
  upiEnabled: boolean;
  qrEnabled: boolean;
  cashEnabled: boolean;
  cardEnabled: boolean;
  instructions: string;
}

export interface RestaurantProfile {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  openingTime: string;
  closingTime: string;
  description: string;
}
