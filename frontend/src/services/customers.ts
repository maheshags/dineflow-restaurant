import API_BASE_URL from './api';
import ordersService from './orders';
import type { Customer } from '@/lib/types';

interface UserResponse {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
});

export const customersService = {
  async getCustomers(): Promise<Customer[]> {
    const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!usersResponse.ok) {
      const data = await usersResponse.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to fetch customers');
    }

    const usersData = await usersResponse.json();
    const users: UserResponse[] = Array.isArray(usersData) ? usersData : usersData.data || usersData.users || [];
    const orders = await ordersService.getAdminOrders();

    return users
      .filter(user => user.role === 'user')
      .map(user => {
        const customerOrders = orders.filter(order => order.customerId === user._id);
        const deliveredOrders = customerOrders.filter(order => order.orderStatus === 'delivered' || order.orderStatus === 'completed');
        const favoriteCounts = new Map<string, number>();

        customerOrders.forEach(order => {
          order.items.forEach((item: any) => {
            favoriteCounts.set(item.foodName, (favoriteCounts.get(item.foodName) || 0) + item.quantity);
          });
        });

        const favoriteItems = [...favoriteCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name]) => name);

        const lastOrder = [...customerOrders].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          totalOrders: customerOrders.length,
          totalSpending: deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          joinedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
          lastOrderDate: lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString() : 'No orders',
          status: user.status || 'active',
          favoriteItems,
        };
      });
  },
};

export default customersService;
