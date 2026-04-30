import { useState, createContext, useContext, type ReactNode } from 'react';

interface UserAuthContextType {
    isAuthed: boolean;
    phone: string | null;
    name: string | null;
    signIn: (phone: string, name: string) => void;
    signOut: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | null>(null);

const PHONE_KEY = 'user_phone';
const NAME_KEY = 'user_name';

export function UserAuthProvider({ children }: { children: ReactNode }) {
    const [phone, setPhone] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(PHONE_KEY);
        }
        return null;
    });
    const [name, setName] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(NAME_KEY);
        }
        return null;
    });

    const signIn = (p: string, n: string) => {
        setPhone(p);
        setName(n);
        if (typeof window !== 'undefined') {
            localStorage.setItem(PHONE_KEY, p);
            localStorage.setItem(NAME_KEY, n);
        }
    };

    const signOut = () => {
        setPhone(null);
        setName(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(PHONE_KEY);
            localStorage.removeItem(NAME_KEY);
        }
    };

    return (
        <UserAuthContext.Provider value={{ isAuthed: !!phone, phone, name, signIn, signOut }}>
            {children}
        </UserAuthContext.Provider>
    );
}

export function useUserAuth() {
    const ctx = useContext(UserAuthContext);
    if (!ctx) throw new Error('useUserAuth must be inside UserAuthProvider');
    return ctx;
}