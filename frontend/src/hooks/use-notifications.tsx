import { useCallback, useEffect, useRef, useState } from 'react';
import deliveryService from '@/services/delivery';

interface Notification {
    id: string;
    type: 'order_assigned' | 'status_updated' | 'delivery_completed';
    title: string;
    message: string;
    orderId: string;
    timestamp: number;
    read: boolean;
}

const NOTIFICATIONS_KEY = 'delivery_notifications_v1';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(NOTIFICATIONS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        }
    }, [notifications]);

    const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotif: Notification = {
            ...notif,
            id: `notif-${Date.now()}`,
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notif.title, {
                body: notif.message,
                icon: '/delivery-icon.png',
                badge: '/delivery-badge.png',
                tag: notif.orderId,
            });
        }
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount,
    };
}

export function useDeliveryNotifications(personId: string | null, enabled = true) {
    const { addNotification } = useNotifications();
    const lastOrderIds = useRef<Set<string>>(new Set());
    const lastStatuses = useRef<Record<string, string>>({});

    useEffect(() => {
        if (!enabled || !personId) return;

        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, [enabled, personId]);

    useEffect(() => {
        if (!enabled || !personId) return;

        let cancelled = false;

        const checkOrders = async () => {
            try {
                const orders = await deliveryService.getOrders();
                if (cancelled) return;

                orders.forEach(order => {
                    if (!lastOrderIds.current.has(order.id) && order.orderStatus === 'assigned') {
                        addNotification({
                            type: 'order_assigned',
                            title: 'New Order Assigned!',
                            message: `Pick up order #${order.id.slice(-6)} from ${order.customerName}`,
                            orderId: order.id,
                        });
                    }
                });

                orders.forEach(order => {
                    const previousStatus = lastStatuses.current[order.id];
                    if (!previousStatus || previousStatus === order.orderStatus) return;

                    const statusMessages: Record<string, string> = {
                        picked: 'Order picked up. Start heading to customer.',
                        'out-for-delivery': 'Order out for delivery.',
                        delivered: 'Order delivered successfully.',
                    };

                    if (statusMessages[order.orderStatus]) {
                        addNotification({
                            type: 'status_updated',
                            title: `Order #${order.id.slice(-6)} - ${order.orderStatus.toUpperCase()}`,
                            message: statusMessages[order.orderStatus],
                            orderId: order.id,
                        });
                    }
                });

                lastOrderIds.current = new Set(orders.map(order => order.id));
                lastStatuses.current = orders.reduce((acc, order) => {
                    acc[order.id] = order.orderStatus;
                    return acc;
                }, {} as Record<string, string>);
            } catch {
                // Notifications are best-effort and should not block delivery work.
            }
        };

        checkOrders();
        const interval = window.setInterval(checkOrders, 30000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [personId, addNotification]);
}
