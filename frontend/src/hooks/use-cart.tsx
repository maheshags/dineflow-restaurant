import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import type { FoodItem } from '@/lib/types';

export interface CartLine {
    item: FoodItem;
    quantity: number;
}

interface CartContextValue {
    lines: CartLine[];
    addItem: (item: FoodItem) => void;
    removeItem: (id: string) => void;
    decrement: (id: string) => void;
    setQuantity: (id: string, qty: number) => void;
    clear: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>([]);

    const addItem = useCallback((item: FoodItem) => {
        setLines(prev => {
            const existing = prev.find(l => l.item.id === item.id);
            if (existing) {
                return prev.map(l => l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
            }
            return [...prev, { item, quantity: 1 }];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setLines(prev => prev.filter(l => l.item.id !== id));
    }, []);

    const decrement = useCallback((id: string) => {
        setLines(prev => prev.flatMap(l => {
            if (l.item.id !== id) return [l];
            if (l.quantity <= 1) return [];
            return [{ ...l, quantity: l.quantity - 1 }];
        }));
    }, []);

    const setQuantity = useCallback((id: string, qty: number) => {
        setLines(prev => prev.flatMap(l => {
            if (l.item.id !== id) return [l];
            if (qty <= 0) return [];
            return [{ ...l, quantity: qty }];
        }));
    }, []);

    const clear = useCallback(() => setLines([]), []);

    const { totalItems, subtotal } = useMemo(() => ({
        totalItems: lines.reduce((s, l) => s + l.quantity, 0),
        subtotal: lines.reduce((s, l) => s + l.quantity * l.item.price, 0),
    }), [lines]);

    return (
        <CartContext.Provider value={{ lines, addItem, removeItem, decrement, setQuantity, clear, totalItems, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}