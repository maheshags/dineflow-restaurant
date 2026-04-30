import type {
  FoodItem, Category, InventoryItem, Order, Customer, Review,
  PaymentSettings, RestaurantProfile, DeliveryPerson,
} from './types';

export const categories: Category[] = [
  { id: 'cat-1', name: 'Starters', description: 'Appetizers and snacks', image: '🥗', active: true, itemCount: 4 },
  { id: 'cat-2', name: 'Main Course', description: 'Full meals and entrees', image: '🍛', active: true, itemCount: 5 },
  { id: 'cat-3', name: 'Desserts', description: 'Sweet treats', image: '🍰', active: true, itemCount: 3 },
  { id: 'cat-4', name: 'Beverages', description: 'Drinks and refreshments', image: '🥤', active: true, itemCount: 4 },
  { id: 'cat-5', name: 'Biryani', description: 'Special rice dishes', image: '🍚', active: true, itemCount: 3 },
  { id: 'cat-6', name: 'Pizza', description: 'Fresh baked pizzas', image: '🍕', active: false, itemCount: 0 },
];

export const foodItems: FoodItem[] = [
  { id: 'f-1', name: 'Paneer Tikka', category: 'Starters', categoryId: 'cat-1', description: 'Grilled cottage cheese with spices', price: 249, stock: 45, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop', availability: true, bestseller: true, rating: 4.5, totalOrders: 320, createdAt: '2024-01-15' },
  { id: 'f-2', name: 'Chicken Biryani', category: 'Biryani', categoryId: 'cat-5', description: 'Aromatic basmati rice with tender chicken', price: 349, stock: 30, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop', availability: true, bestseller: true, rating: 4.8, totalOrders: 580, createdAt: '2024-01-10' },
  { id: 'f-3', name: 'Butter Chicken', category: 'Main Course', categoryId: 'cat-2', description: 'Creamy tomato-based chicken curry', price: 329, stock: 25, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop', availability: true, bestseller: true, rating: 4.7, totalOrders: 450, createdAt: '2024-01-12' },
  { id: 'f-4', name: 'Gulab Jamun', category: 'Desserts', categoryId: 'cat-3', description: 'Deep-fried milk dumplings in sugar syrup', price: 129, stock: 60, image: 'https://images.unsplash.com/photo-1666190851498-953dcb1b794e?w=300&h=200&fit=crop', availability: true, bestseller: false, rating: 4.3, totalOrders: 210, createdAt: '2024-02-01' },
  { id: 'f-5', name: 'Masala Dosa', category: 'Main Course', categoryId: 'cat-2', description: 'Crispy crepe with spiced potato filling', price: 179, stock: 3, image: 'https://images.unsplash.com/photo-1668236543090-82eb5eaf15ee?w=300&h=200&fit=crop', availability: true, bestseller: false, rating: 4.4, totalOrders: 290, createdAt: '2024-02-05' },
  { id: 'f-6', name: 'Mango Lassi', category: 'Beverages', categoryId: 'cat-4', description: 'Sweet yogurt drink with mango', price: 99, stock: 0, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=200&fit=crop', availability: false, bestseller: false, rating: 4.6, totalOrders: 180, createdAt: '2024-02-10' },
  { id: 'f-7', name: 'Veg Biryani', category: 'Biryani', categoryId: 'cat-5', description: 'Fragrant rice with mixed vegetables', price: 269, stock: 20, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=200&fit=crop', availability: true, bestseller: false, rating: 4.2, totalOrders: 150, createdAt: '2024-02-15' },
  { id: 'f-8', name: 'Samosa', category: 'Starters', categoryId: 'cat-1', description: 'Crispy pastry with spiced potato filling', price: 49, stock: 80, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop', availability: true, bestseller: true, rating: 4.5, totalOrders: 620, createdAt: '2024-01-05' },
  { id: 'f-9', name: 'Cold Coffee', category: 'Beverages', categoryId: 'cat-4', description: 'Iced coffee blended with cream', price: 149, stock: 15, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop', availability: true, bestseller: false, rating: 4.1, totalOrders: 95, createdAt: '2024-03-01' },
  { id: 'f-10', name: 'Dal Makhani', category: 'Main Course', categoryId: 'cat-2', description: 'Creamy black lentils slow cooked overnight', price: 229, stock: 18, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop', availability: true, bestseller: false, rating: 4.6, totalOrders: 340, createdAt: '2024-01-20' },
];

export const inventoryItems: InventoryItem[] = foodItems.map(f => ({
  id: `inv-${f.id}`,
  foodId: f.id,
  foodName: f.name,
  category: f.category,
  currentStock: f.stock,
  minThreshold: 10,
  status: f.stock === 0 ? 'out-of-stock' as const : f.stock <= 10 ? 'low-stock' as const : 'in-stock' as const,
  lastUpdated: '2024-03-15T10:30:00',
}));

export const orders: Order[] = [
  { id: 'ORD-001', customerId: 'c-1', customerName: 'Rahul Sharma', customerPhone: '+91 98765 43210', items: [{ foodId: 'f-2', foodName: 'Chicken Biryani', quantity: 2, price: 349 }, { foodId: 'f-9', foodName: 'Cold Coffee', quantity: 1, price: 149 }], totalAmount: 847, paymentMethod: 'upi', paymentStatus: 'paid', orderStatus: 'completed', notes: 'Extra spicy please', diningType: 'dine-in', createdAt: '2024-03-15T12:30:00', updatedAt: '2024-03-15T13:15:00' },
  { id: 'ORD-002', customerId: 'c-2', customerName: 'Priya Patel', customerPhone: '+91 87654 32109', items: [{ foodId: 'f-1', foodName: 'Paneer Tikka', quantity: 1, price: 249 }, { foodId: 'f-3', foodName: 'Butter Chicken', quantity: 1, price: 329 }, { foodId: 'f-10', foodName: 'Dal Makhani', quantity: 1, price: 229 }], totalAmount: 807, paymentMethod: 'card', paymentStatus: 'paid', orderStatus: 'preparing', notes: '', diningType: 'dine-in', createdAt: '2024-03-15T13:00:00', updatedAt: '2024-03-15T13:10:00' },
  { id: 'ORD-003', customerId: 'c-3', customerName: 'Amit Kumar', customerPhone: '+91 76543 21098', items: [{ foodId: 'f-8', foodName: 'Samosa', quantity: 4, price: 49 }, { foodId: 'f-4', foodName: 'Gulab Jamun', quantity: 2, price: 129 }], totalAmount: 454, paymentMethod: 'cash', paymentStatus: 'pending', orderStatus: 'new', notes: 'No onion', diningType: 'takeaway', createdAt: '2024-03-15T13:30:00', updatedAt: '2024-03-15T13:30:00' },
  { id: 'ORD-004', customerId: 'c-4', customerName: 'Sneha Reddy', customerPhone: '+91 65432 10987', items: [{ foodId: 'f-5', foodName: 'Masala Dosa', quantity: 2, price: 179 }], totalAmount: 358, paymentMethod: 'upi', paymentStatus: 'paid', orderStatus: 'ready', notes: '', diningType: 'takeaway', createdAt: '2024-03-15T11:00:00', updatedAt: '2024-03-15T11:45:00' },
  { id: 'ORD-005', customerId: 'c-5', customerName: 'Vikram Singh', customerPhone: '+91 54321 09876', items: [{ foodId: 'f-7', foodName: 'Veg Biryani', quantity: 1, price: 269 }, { foodId: 'f-1', foodName: 'Paneer Tikka', quantity: 1, price: 249 }], totalAmount: 518, paymentMethod: 'qr', paymentStatus: 'paid', orderStatus: 'accepted', notes: 'Less spice', diningType: 'delivery', createdAt: '2024-03-15T14:00:00', updatedAt: '2024-03-15T14:05:00' },
  { id: 'ORD-006', customerId: 'c-1', customerName: 'Rahul Sharma', customerPhone: '+91 98765 43210', items: [{ foodId: 'f-3', foodName: 'Butter Chicken', quantity: 1, price: 329 }], totalAmount: 329, paymentMethod: 'upi', paymentStatus: 'refunded', orderStatus: 'cancelled', notes: 'Changed mind', diningType: 'dine-in', createdAt: '2024-03-14T18:00:00', updatedAt: '2024-03-14T18:30:00' },
  { id: 'ORD-007', customerId: 'c-6', customerName: 'Neha Gupta', customerPhone: '+91 43210 98765', items: [{ foodId: 'f-2', foodName: 'Chicken Biryani', quantity: 3, price: 349 }, { foodId: 'f-4', foodName: 'Gulab Jamun', quantity: 3, price: 129 }], totalAmount: 1434, paymentMethod: 'card', paymentStatus: 'paid', orderStatus: 'completed', notes: '', diningType: 'dine-in', createdAt: '2024-03-14T19:00:00', updatedAt: '2024-03-14T20:00:00' },
  { id: 'ORD-008', customerId: 'c-7', customerName: 'Arjun Nair', customerPhone: '+91 32109 87654', items: [{ foodId: 'f-10', foodName: 'Dal Makhani', quantity: 2, price: 229 }, { foodId: 'f-8', foodName: 'Samosa', quantity: 6, price: 49 }], totalAmount: 752, paymentMethod: 'upi', paymentStatus: 'paid', orderStatus: 'completed', notes: 'Party order', diningType: 'delivery', createdAt: '2024-03-14T20:00:00', updatedAt: '2024-03-14T21:00:00' },
];

export const customers: Customer[] = [
  { id: 'c-1', name: 'Rahul Sharma', email: 'rahul@email.com', phone: '+91 98765 43210', totalOrders: 15, totalSpending: 5240, joinedDate: '2024-01-10', lastOrderDate: '2024-03-15', status: 'active', favoriteItems: ['Chicken Biryani', 'Butter Chicken'] },
  { id: 'c-2', name: 'Priya Patel', email: 'priya@email.com', phone: '+91 87654 32109', totalOrders: 8, totalSpending: 3120, joinedDate: '2024-01-20', lastOrderDate: '2024-03-15', status: 'active', favoriteItems: ['Paneer Tikka', 'Dal Makhani'] },
  { id: 'c-3', name: 'Amit Kumar', email: 'amit@email.com', phone: '+91 76543 21098', totalOrders: 5, totalSpending: 1850, joinedDate: '2024-02-01', lastOrderDate: '2024-03-15', status: 'active', favoriteItems: ['Samosa'] },
  { id: 'c-4', name: 'Sneha Reddy', email: 'sneha@email.com', phone: '+91 65432 10987', totalOrders: 12, totalSpending: 4580, joinedDate: '2024-01-15', lastOrderDate: '2024-03-15', status: 'active', favoriteItems: ['Masala Dosa', 'Cold Coffee'] },
  { id: 'c-5', name: 'Vikram Singh', email: 'vikram@email.com', phone: '+91 54321 09876', totalOrders: 3, totalSpending: 1240, joinedDate: '2024-02-20', lastOrderDate: '2024-03-15', status: 'active', favoriteItems: ['Veg Biryani'] },
  { id: 'c-6', name: 'Neha Gupta', email: 'neha@email.com', phone: '+91 43210 98765', totalOrders: 20, totalSpending: 7890, joinedDate: '2024-01-05', lastOrderDate: '2024-03-14', status: 'active', favoriteItems: ['Chicken Biryani', 'Gulab Jamun'] },
  { id: 'c-7', name: 'Arjun Nair', email: 'arjun@email.com', phone: '+91 32109 87654', totalOrders: 2, totalSpending: 980, joinedDate: '2024-03-01', lastOrderDate: '2024-03-14', status: 'active', favoriteItems: ['Dal Makhani'] },
  { id: 'c-8', name: 'Kavita Joshi', email: 'kavita@email.com', phone: '+91 21098 76543', totalOrders: 1, totalSpending: 349, joinedDate: '2024-03-10', lastOrderDate: '2024-03-10', status: 'inactive', favoriteItems: [] },
];

export const reviews: Review[] = [
  { id: 'r-1', customerId: 'c-1', customerName: 'Rahul Sharma', foodId: 'f-2', foodName: 'Chicken Biryani', rating: 5, text: 'Absolutely delicious! Best biryani in town. The flavors are incredible.', date: '2024-03-14', status: 'published' },
  { id: 'r-2', customerId: 'c-2', customerName: 'Priya Patel', foodId: 'f-1', foodName: 'Paneer Tikka', rating: 4, text: 'Great paneer tikka with perfect charring. Could use a bit more spice.', date: '2024-03-13', status: 'published' },
  { id: 'r-3', customerId: 'c-6', customerName: 'Neha Gupta', foodId: 'f-3', foodName: 'Butter Chicken', rating: 5, text: 'Rich, creamy, and absolutely divine. My go-to order every time!', date: '2024-03-12', status: 'published' },
  { id: 'r-4', customerId: 'c-4', customerName: 'Sneha Reddy', foodId: 'f-5', foodName: 'Masala Dosa', rating: 4, text: 'Crispy dosa with perfect chutney. Loved it!', date: '2024-03-11', status: 'published' },
  { id: 'r-5', customerId: 'c-3', customerName: 'Amit Kumar', foodId: 'f-8', foodName: 'Samosa', rating: 3, text: 'Decent samosa but was a bit cold when served.', date: '2024-03-10', status: 'published' },
  { id: 'r-6', customerId: 'c-5', customerName: 'Vikram Singh', foodId: 'f-7', foodName: 'Veg Biryani', rating: 2, text: 'Expected more vegetables. Rice was slightly overcooked.', date: '2024-03-09', status: 'flagged' },
  { id: 'r-7', customerId: 'c-7', customerName: 'Arjun Nair', foodId: 'f-10', foodName: 'Dal Makhani', rating: 5, text: 'Authentic taste! Reminds me of home cooking.', date: '2024-03-08', status: 'published' },
  { id: 'r-8', customerId: 'c-6', customerName: 'Neha Gupta', foodId: 'f-4', foodName: 'Gulab Jamun', rating: 4, text: 'Perfectly sweet and soft. Great dessert option.', date: '2024-03-07', status: 'published' },
  { id: 'r-9', customerId: 'c-1', customerName: 'Rahul Sharma', foodId: 'f-9', foodName: 'Cold Coffee', rating: 1, text: 'Too watery and not enough flavor. Disappointing.', date: '2024-03-06', status: 'hidden' },
];

export const defaultPaymentSettings: PaymentSettings = {
  upiId: 'restaurant@upi',
  qrCodeImage: '',
  upiEnabled: true,
  qrEnabled: false,
  cashEnabled: true,
  cardEnabled: true,
  instructions: 'Scan the QR code or use UPI ID to complete payment before placing your order.',
};

export const defaultProfile: RestaurantProfile = {
  name: 'Spice Garden Restaurant',
  ownerName: 'Rajesh Kumar',
  email: 'admin@spicegarden.com',
  phone: '+91 98765 43210',
  address: '42, MG Road, Indiranagar, Bangalore - 560038',
  logo: '',
  openingTime: '10:00',
  closingTime: '23:00',
  description: 'Authentic Indian cuisine with a modern twist. Serving the best flavors since 2020.',
};

export const revenueData = [
  { name: 'Mon', revenue: 4200, orders: 28 },
  { name: 'Tue', revenue: 5100, orders: 34 },
  { name: 'Wed', revenue: 4800, orders: 31 },
  { name: 'Thu', revenue: 6200, orders: 42 },
  { name: 'Fri', revenue: 7800, orders: 52 },
  { name: 'Sat', revenue: 9200, orders: 61 },
  { name: 'Sun', revenue: 8500, orders: 56 },
];

export const monthlyRevenue = [
  { name: 'Jan', revenue: 125000 },
  { name: 'Feb', revenue: 148000 },
  { name: 'Mar', revenue: 162000 },
];

export const deliveryPersons: DeliveryPerson[] = [
  { id: 'dp-1', name: 'Ravi Verma', email: 'ravi@spicegarden.com', phone: '9000000001', password: 'pass1234', vehicle: 'Bike — KA01 AB 1234', status: 'active', joinedDate: '2024-02-01', totalDeliveries: 142, rating: 4.8 },
  { id: 'dp-2', name: 'Suresh Yadav', email: 'suresh@spicegarden.com', phone: '9000000002', password: 'pass1234', vehicle: 'Scooter — KA02 CD 5678', status: 'active', joinedDate: '2024-02-15', totalDeliveries: 98, rating: 4.6 },
  { id: 'dp-3', name: 'Manoj Kumar', email: 'manoj@spicegarden.com', phone: '9000000003', password: 'pass1234', vehicle: 'Bike — KA03 EF 9012', status: 'active', joinedDate: '2024-03-05', totalDeliveries: 56, rating: 4.7 },
  { id: 'dp-4', name: 'Imran Khan', email: 'imran@spicegarden.com', phone: '9000000004', password: 'pass1234', vehicle: 'Bicycle', status: 'inactive', joinedDate: '2024-01-20', totalDeliveries: 24, rating: 4.2 },
];

// Add delivery addresses to delivery-type orders for the delivery app
orders.forEach(o => {
  if (o.diningType === 'delivery' && !o.deliveryAddress) {
    o.deliveryAddress = '14, 2nd Cross, Indiranagar, Bangalore — 560038';
  }
});