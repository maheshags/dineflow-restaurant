import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useDeliveryAuth } from '@/hooks/use-delivery-auth';
import { LogOut, Phone, Mail, Bike, Star, ShieldCheck } from 'lucide-react';
import type { DeliveryPerson, Order } from '@/lib/types';
import deliveryService from '@/services/delivery';

export const Route = createFileRoute('/delivery/profile')({
    component: DeliveryProfile,
});

function DeliveryProfile() {
    const { user, signOut } = useDeliveryAuth();
    const navigate = useNavigate();
    const [me, setMe] = useState<DeliveryPerson | null>(user);
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profile, assignedOrders] = await Promise.all([
                deliveryService.getProfile(),
                deliveryService.getOrders(),
            ]);
            setMe(profile);
            setOrders(assignedOrders);
        } catch {
            setMe(user);
        }
    };

    if (!me) return null;

    const done = orders.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).length;
    const active = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.orderStatus)).length;

    const onLogout = () => {
        signOut();
        navigate({ to: '/delivery/login' });
    };

    return (
        <div className="px-4 pb-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary/25 to-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] p-5 text-center">
                <div className="w-20 h-20 rounded-full mx-auto bg-primary/30 text-primary flex items-center justify-center text-2xl font-bold">
                    {me.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <h2 className="mt-3 font-display font-bold text-lg">{me.name}</h2>
                <p className="text-xs text-[oklch(0.7_0.01_260)]">{me.vehicle}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-[oklch(0.85_0.15_75)]">
                    <Star className="w-3.5 h-3.5 fill-[oklch(0.85_0.15_75)]" /> {me.rating.toFixed(1)} rating
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
                <Stat label="Total" value={me.totalDeliveries || done} />
                <Stat label="Done" value={done} />
                <Stat label="Active" value={active} />
            </div>

            <div className="mt-4 rounded-2xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] divide-y divide-[oklch(0.26_0.015_260)]">
                <Row icon={<Phone className="w-4 h-4 text-primary" />} label="Phone" value={me.phone} />
                <Row icon={<Mail className="w-4 h-4 text-primary" />} label="Email" value={me.email} />
                <Row icon={<Bike className="w-4 h-4 text-primary" />} label="Vehicle" value={me.vehicle} />
                <Row icon={<ShieldCheck className="w-4 h-4 text-primary" />} label="Status" value={me.status} />
            </div>

            <button
                onClick={onLogout}
                className="mt-6 w-full h-12 rounded-xl bg-destructive/15 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/25 transition-colors"
            >
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] p-3 text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-[oklch(0.65_0.01_260)] uppercase tracking-wider">{label}</p>
        </div>
    );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[oklch(0.18_0.012_260)] flex items-center justify-center">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[oklch(0.6_0.01_260)]">{label}</p>
                <p className="text-sm text-[oklch(0.92_0.005_260)] capitalize truncate">{value}</p>
            </div>
        </div>
    );
}
