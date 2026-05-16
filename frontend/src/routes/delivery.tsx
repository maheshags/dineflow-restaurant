import { createFileRoute, Outlet, Link, useLocation, Navigate } from '@tanstack/react-router';
import { Home, History, User } from 'lucide-react';
import { DeliveryAuthProvider, useDeliveryAuth } from '@/hooks/use-delivery-auth';
import { NotificationCenter } from '@/components/shared/NotificationCenter';
import { useDeliveryNotifications } from '@/hooks/use-notifications';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/delivery')({
    component: DeliveryLayout,
    head: () => ({
        meta: [
            { title: 'Spice Garden — Delivery Partner' },
            { name: 'description', content: 'Manage your deliveries' },
        ],
    }),
});

function DeliveryLayout() {
    return (
        <DeliveryAuthProvider>
            <DeliveryShell />
        </DeliveryAuthProvider>
    );
}

const PUBLIC_PATHS = ['/delivery/login'];

function DeliveryShell() {
    const location = useLocation();
    const { isAuthed, personId } = useDeliveryAuth();
    const isPublic = PUBLIC_PATHS.includes(location.pathname);

    // Enable delivery notifications only after login.
    useDeliveryNotifications(personId, isAuthed && !isPublic);

    if (!isAuthed && !isPublic) {
        return <Navigate to="/delivery/login" />;
    }

    // Login screen renders its own full-screen layout
    if (isPublic) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex justify-center font-body">
            {/* App frame — mobile-first, max width like an APK on a phone */}
            <div className="w-full max-w-[480px] min-h-screen bg-[#0A0A0A] relative flex flex-col shadow-2xl">
                {/* Header with notification center */}
                <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 p-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-end">
                    <NotificationCenter />
                </header>
                <main className="flex-1 pb-24 pt-14">
                    <Outlet />
                </main>
                <BottomNav />
            </div>
        </div>
    );
}

type DeliveryTab = {
    to: '/delivery' | '/delivery/history' | '/delivery/profile';
    label: string;
    icon: typeof Home;
    exact: boolean;
};

const tabs: DeliveryTab[] = [
    { to: '/delivery', label: 'Home', icon: Home, exact: true },
    { to: '/delivery/history', label: 'History', icon: History, exact: false },
    { to: '/delivery/profile', label: 'Profile', icon: User, exact: false },
];

function BottomNav() {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/5 border-t border-white/10 backdrop-blur-xl z-40">
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
                                        layoutId="nav-pill-delivery"
                                        className="absolute -inset-2 bg-primary/15 rounded-2xl"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon
                                    className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-white/50'}`}
                                />
                            </div>
                            <span className={`text-[10px] font-medium relative z-10 ${isActive ? 'text-primary' : 'text-white/50'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
