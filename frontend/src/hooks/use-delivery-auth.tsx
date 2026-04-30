import { useState, createContext, useContext, type ReactNode } from 'react';
import type { DeliveryPerson } from '@/lib/types';
import deliveryService from '@/services/delivery';

interface DeliveryAuthCtx {
    isAuthed: boolean;
    personId: string | null;
    user: DeliveryPerson | null;
    signIn: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    signOut: () => void;
}

const Ctx = createContext<DeliveryAuthCtx | null>(null);

export function DeliveryAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<DeliveryPerson | null>(() => {
        if (typeof window === 'undefined') return null;
        return deliveryService.getStoredUser();
    });
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return deliveryService.getStoredToken();
    });

    const signIn = async (phone: string, password: string) => {
        try {
            const session = await deliveryService.login(phone.trim(), password);
            deliveryService.storeSession(session.token, session.user);
            setToken(session.token);
            setUser(session.user);
            return { ok: true };
        } catch (err) {
            return {
                ok: false,
                error: err instanceof Error ? err.message : 'Login failed',
            };
        }
    };

    const signOut = () => {
        deliveryService.clearSession();
        setToken(null);
        setUser(null);
    };

    return (
        <Ctx.Provider value={{ isAuthed: !!token && !!user, personId: user?.id || null, user, signIn, signOut }}>
            {children}
        </Ctx.Provider>
    );
}

export function useDeliveryAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useDeliveryAuth must be used inside DeliveryAuthProvider');
    return ctx;
}
