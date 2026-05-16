import { createFileRoute, Outlet, Link, useLocation, Navigate } from '@tanstack/react-router';
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { CartProvider, useCart } from '@/hooks/use-cart';
import { UserAuthProvider, useUserAuth } from '@/hooks/use-user-auth';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/user')({
    component: UserLayout,
    head: () => ({
        meta: [
            { title: 'Spice Garden — Order Food' },
            { name: 'description', content: 'Order delicious food from Spice Garden' },
        ],
    }),
});

function UserLayout() {
    return (
        <UserAuthProvider>
            <CartProvider>
                <UserShell />
            </CartProvider>
        </UserAuthProvider>
    );
}

const PUBLIC_PATHS = ['/user/login', '/user/loading'];

function UserShell() {
    const location = useLocation();
    const { isAuthed } = useUserAuth();
    const isPublic = PUBLIC_PATHS.includes(location.pathname);

    if (!isAuthed && !isPublic) {
        return <Navigate to="/user/login" />;
    }

    // Login & loading screens render their own full-screen layout
    if (isPublic) {
        return <Outlet />;
    }

    return (
        <div className="min-h-[100dvh] bg-[oklch(0.16_0.012_260)] text-[oklch(0.95_0.005_260)] flex justify-center font-body">
            {/* App frame — mobile-first, max width like an APK on a phone */}
            <div className="w-full max-w-[480px] min-h-[100dvh] bg-[oklch(0.18_0.012_260)] relative flex flex-col shadow-2xl">
                <main className="flex-1 pb-24">
                    <Outlet />
                </main>
                <BottomNav />
            </div>
        </div>
    );
}

type Tab = {
    to: '/user' | '/user/menu' | '/user/cart' | '/user/orders' | '/user/profile';
    label: string;
    icon: typeof Home;
    exact: boolean;
    isCart?: boolean;
};

const tabs: Tab[] = [
    { to: '/user', label: 'Home', icon: Home, exact: true },
    { to: '/user/menu', label: 'Menu', icon: UtensilsCrossed, exact: false },
    { to: '/user/cart', label: 'Cart', icon: ShoppingBag, exact: false, isCart: true },
    { to: '/user/orders', label: 'Orders', icon: ClipboardList, exact: false },
    { to: '/user/profile', label: 'Profile', icon: User, exact: false },
];

function BottomNav() {
    const location = useLocation();
    const { totalItems } = useCart();

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[oklch(0.20_0.012_260)] border-t border-[oklch(0.28_0.012_260)] backdrop-blur-xl z-40">
            <div className="flex items-center justify-around px-2 pt-2 pb-3 safe-bottom">
                {tabs.map(tab => {
                    const isActive = tab.exact
                        ? location.pathname === tab.to
                        : location.pathname.startsWith(tab.to);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.to}
                            to={tab.to}
                            className="flex flex-col items-center gap-1 py-1 px-3 relative min-w-[56px]"
                        >
                            <div className="relative">
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute -inset-2 bg-primary/15 rounded-2xl"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon
                                    className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-[oklch(0.6_0.01_260)]'}`}
                                />
                                {tab.isCart && totalItems > 0 && (
                                    <span className="absolute -top-1.5 -right-2 z-20 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                                        {totalItems}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium relative z-10 ${isActive ? 'text-primary' : 'text-[oklch(0.6_0.01_260)]'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
