/**
 * Shared in-app store for orders + delivery persons.
 * Persists to localStorage and syncs across tabs (admin <-> delivery app).
 * Replace with real API calls later — keep the same hook signature.
 */
import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { orders as initialOrders, deliveryPersons as initialDeliveryPersons } from '@/lib/data';
import type { Order, OrderStatus, DeliveryPerson } from '@/lib/types';

const ORDERS_KEY = 'app_orders_v1';
const DP_KEY = 'app_delivery_persons_v1';

function load<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

interface AppStoreCtx {
    orders: Order[];
    deliveryPersons: DeliveryPerson[];
    updateOrderStatus: (id: string, status: OrderStatus) => void;
    assignDelivery: (orderId: string, personId: string) => void;
    addDeliveryPerson: (p: Omit<DeliveryPerson, 'id' | 'joinedDate' | 'totalDeliveries' | 'rating'>) => void;
    updateDeliveryPerson: (id: string, patch: Partial<DeliveryPerson>) => void;
    removeDeliveryPerson: (id: string) => void;
}

const Ctx = createContext<AppStoreCtx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
    const [orders, setOrders] = useState<Order[]>(() => load(ORDERS_KEY, initialOrders));
    const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>(() =>
        load(DP_KEY, initialDeliveryPersons),
    );

    // Persist
    useEffect(() => {
        if (typeof window !== 'undefined') localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }, [orders]);
    useEffect(() => {
        if (typeof window !== 'undefined') localStorage.setItem(DP_KEY, JSON.stringify(deliveryPersons));
    }, [deliveryPersons]);

    // Cross-tab sync
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onStorage = (e: StorageEvent) => {
            if (e.key === ORDERS_KEY && e.newValue) {
                try { setOrders(JSON.parse(e.newValue)); } catch { /* noop */ }
            }
            if (e.key === DP_KEY && e.newValue) {
                try { setDeliveryPersons(JSON.parse(e.newValue)); } catch { /* noop */ }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, orderStatus: status, updatedAt: new Date().toISOString() } : o));
    }, []);

    const assignDelivery = useCallback((orderId: string, personId: string) => {
        setDeliveryPersons(currentDps => {
            const dp = currentDps.find(d => d.id === personId);
            setOrders(prev => prev.map(o => o.id === orderId
                ? {
                    ...o,
                    deliveryPersonId: personId,
                    deliveryPersonName: dp?.name ?? null,
                    orderStatus: 'ready',
                    updatedAt: new Date().toISOString(),
                }
                : o));
            return currentDps;
        });
    }, []);

    const addDeliveryPerson: AppStoreCtx['addDeliveryPerson'] = useCallback((p) => {
        setDeliveryPersons(prev => [
            ...prev,
            {
                ...p,
                id: `dp-${Date.now()}`,
                joinedDate: new Date().toISOString().slice(0, 10),
                totalDeliveries: 0,
                rating: 0,
            },
        ]);
    }, []);

    const updateDeliveryPerson: AppStoreCtx['updateDeliveryPerson'] = useCallback((id, patch) => {
        setDeliveryPersons(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    }, []);

    const removeDeliveryPerson = useCallback((id: string) => {
        setDeliveryPersons(prev => prev.filter(d => d.id !== id));
    }, []);

    return (
        <Ctx.Provider value={{
            orders, deliveryPersons,
            updateOrderStatus, assignDelivery,
            addDeliveryPerson, updateDeliveryPerson, removeDeliveryPerson,
        }}>
            {children}
        </Ctx.Provider>
    );
}

export function useAppStore() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
    return ctx;
}