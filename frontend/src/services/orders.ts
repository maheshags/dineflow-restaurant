import API_BASE_URL from './api';

export interface OrderItemResponse {
  _id?: string;
  food?: string | { _id: string };
  foodId?: string;
  name?: string;
  foodName?: string;
  quantity: number;
  price: number;
}

export interface OrderResponse {
  _id: string;
  id?: string;
  user?: string | { _id: string; name?: string; email?: string; phone?: string };
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerDetails?: {
    name?: string;
    phone?: string;
    location?: string;
    address?: string;
    instructions?: string;
  };
  items: OrderItemResponse[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes?: string;
  diningType?: string;
  deliveryAddress?: string;
  deliveryPersonId?: string | null;
  deliveryPersonName?: string | null;
  assignedDeliveryPerson?: string | { _id: string; name?: string; email?: string; phone?: string } | null;
  placedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateOrderStatusRequest {
  orderStatus: string;
}

const toFrontendStatus = (status?: string) =>
  status === 'out_for_delivery' ? 'out-for-delivery' : (status || 'pending');

const toBackendStatus = (status: string) => {
  if (status === 'out-for-delivery') return 'out_for_delivery';
  if (status === 'completed') return 'delivered';
  return status;
};

const getDataArray = (data: any) => {
  if (Array.isArray(data)) return data;
  return data?.data || data?.orders || [];
};

const getDataObject = (data: any) => data?.data || data?.order || data;

// Transform backend response to frontend format
export const transformOrder = (order: OrderResponse): any => {
  const user = typeof order.user === 'object' && order.user ? order.user : null;
  const assigned =
    typeof order.assignedDeliveryPerson === 'object' && order.assignedDeliveryPerson
      ? order.assignedDeliveryPerson
      : null;
  const assignedId =
    typeof order.assignedDeliveryPerson === 'string'
      ? order.assignedDeliveryPerson
      : assigned?._id || order.deliveryPersonId || null;
  const customerDetails = order.customerDetails || {};
  const deliveryAddress =
    order.deliveryAddress || customerDetails.address || customerDetails.location || '';

  return {
    id: order._id || order.id,
    customerId: order.customerId || (user?._id ?? ''),
    customerName: order.customerName || customerDetails.name || user?.name || 'Customer',
    customerPhone: order.customerPhone || customerDetails.phone || user?.phone || '',
    items: (order.items || []).map(item => ({
      foodId:
        item.foodId ||
        (typeof item.food === 'string' ? item.food : item.food?._id) ||
        item._id ||
        '',
      foodName: item.foodName || item.name || 'Food item',
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: order.totalAmount || 0,
    paymentMethod: order.paymentMethod || 'cash',
    paymentStatus: order.paymentStatus || 'pending',
    orderStatus: toFrontendStatus(order.orderStatus),
    notes: order.notes || customerDetails.instructions || '',
    diningType: order.diningType || 'delivery',
    deliveryAddress,
    deliveryPersonId: assignedId,
    deliveryPersonName: order.deliveryPersonName || assigned?.name || null,
    createdAt: order.createdAt || order.placedAt || new Date().toISOString(),
    updatedAt: order.updatedAt,
  };
};

export const ordersService = {
  // Get all orders
  async getOrders(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both array and object response
      const orders = getDataArray(data);

      return orders.map(transformOrder);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get single order by ID
  async getOrderById(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      const data = await response.json();
      return transformOrder(getDataObject(data));
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(id: string, status: string): Promise<any> {
    try {
      const payload: UpdateOrderStatusRequest = {
        orderStatus: toBackendStatus(status),
      };

      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update order status');
      }

      const data = await response.json();
      return transformOrder(data.data || data);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Assign delivery person to order
  async assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/assign-delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({ deliveryPersonId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign delivery person');
      }

      const data = await response.json();
      return transformOrder(data.data || data);
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(id: string, paymentStatus: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({ paymentStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment status');
      }

      const data = await response.json();
      return transformOrder(data.data || data);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Get admin orders (with filters)
  async getAdminOrders(filters?: { status?: string; paymentStatus?: string }): Promise<any[]> {
    try {
      let url = `${API_BASE_URL}/admin/orders`;
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', toBackendStatus(filters.status));
      if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin orders: ${response.statusText}`);
      }

      const data = await response.json();
      const orders = getDataArray(data);

      return orders.map(transformOrder);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      throw error;
    }
  },
};

export default ordersService;
