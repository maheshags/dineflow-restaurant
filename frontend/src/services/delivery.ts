import API_BASE_URL from './api';
import type { DeliveryPerson, Order, OrderStatus } from '@/lib/types';

const TOKEN_KEY = 'deliveryToken';
const USER_KEY = 'deliveryUser';

interface DeliveryUserResponse {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    address?: string;
    vehicle?: string;
    status?: 'active' | 'inactive';
    totalDeliveries?: number;
    rating?: number;
    createdAt?: string;
}

interface DeliveryOrderResponse {
    _id: string;
    customerDetails?: {
        name?: string;
        phone?: string;
        location?: string;
        address?: string;
        instructions?: string;
    };
    items?: Array<{
        _id?: string;
        food?: string;
        name?: string;
        price: number;
        quantity: number;
    }>;
    totalAmount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    orderStatus?: string;
    assignedDeliveryPerson?: string;
    placedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

const toFrontendStatus = (status?: string): OrderStatus =>
    (status === 'out_for_delivery' ? 'out-for-delivery' : (status || 'assigned')) as OrderStatus;

const toBackendStatus = (status: OrderStatus) =>
    status === 'out-for-delivery' ? 'out_for_delivery' : status;

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}`,
});

const getDataArray = (data: any) => {
    if (Array.isArray(data)) return data;
    return data?.data || data?.orders || [];
};

const getDataObject = (data: any) => data?.data || data?.user || data;

export const transformDeliveryUser = (user: DeliveryUserResponse): DeliveryPerson => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    password: '',
    vehicle: user.vehicle || 'Bike',
    status: user.status || 'active',
    joinedDate: user.createdAt || new Date().toISOString().slice(0, 10),
    totalDeliveries: user.totalDeliveries || 0,
    rating: user.rating || 4.5,
});

export const transformDeliveryOrder = (order: DeliveryOrderResponse): Order => {
    const customer = order.customerDetails || {};

    return {
        id: order._id,
        customerId: '',
        customerName: customer.name || 'Customer',
        customerPhone: customer.phone || '',
        items: (order.items || []).map(item => ({
            foodId: item.food || item._id || '',
            foodName: item.name || 'Food item',
            quantity: item.quantity,
            price: item.price,
        })),
        totalAmount: order.totalAmount || 0,
        paymentMethod: (order.paymentMethod || 'cash') as Order['paymentMethod'],
        paymentStatus: (order.paymentStatus || 'pending') as Order['paymentStatus'],
        orderStatus: toFrontendStatus(order.orderStatus),
        notes: customer.instructions || '',
        diningType: 'delivery',
        deliveryAddress: customer.address || customer.location || '',
        deliveryPersonId: order.assignedDeliveryPerson || null,
        deliveryPersonName: null,
        createdAt: order.createdAt || order.placedAt || new Date().toISOString(),
        updatedAt: order.updatedAt || order.createdAt || order.placedAt || new Date().toISOString(),
    };
};

export const deliveryService = {
    async login(phone: string, password: string): Promise<{ token: string; user: DeliveryPerson }> {
        const response = await fetch(`${API_BASE_URL}/auth/delivery-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return {
            token: data.token,
            user: transformDeliveryUser(data.user),
        };
    },

    async getProfile(): Promise<DeliveryPerson> {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: authHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load profile');
        }

        return transformDeliveryUser(getDataObject(data));
    },

    async getOrders(): Promise<Order[]> {
        const response = await fetch(`${API_BASE_URL}/delivery/orders`, {
            method: 'GET',
            headers: authHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load delivery orders');
        }

        return getDataArray(data).map(transformDeliveryOrder);
    },

    async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
        const response = await fetch(`${API_BASE_URL}/delivery/orders/${id}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ orderStatus: toBackendStatus(status) }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update order status');
        }

        return transformDeliveryOrder(getDataObject(data));
    },

    storeSession(token: string, user: DeliveryPerson) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem('delivery_person_id', user.id);
    },

    clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('delivery_person_id');
    },

    getStoredUser(): DeliveryPerson | null {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    getStoredToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },
};

export default deliveryService;
