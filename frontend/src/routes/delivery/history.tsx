import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, IndianRupee } from 'lucide-react';
import type { Order } from '@/lib/types';
import deliveryService from '@/services/delivery';

export const Route = createFileRoute('/delivery/history')({
    component: DeliveryHistory,
});

function DeliveryHistory() {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await deliveryService.getOrders();
            setOrders(data);
        } catch {
            setOrders([]);
        }
    };

    const completed = orders
        .filter(o => ['delivered', 'completed'].includes(o.orderStatus))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return (
        <div className="px-4 pb-4">
            <h1 className="font-display font-bold text-xl mb-4">Delivery History</h1>
            {completed.length === 0 ? (
                <div className="rounded-2xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] p-8 text-center text-sm text-[oklch(0.65_0.01_260)]">
                    No completed deliveries yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {completed.map(o => (
                        <div key={o.id} className="rounded-xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[oklch(0.65_0.01_260)]">{o.id}</p>
                                    <p className="font-semibold">{o.customerName}</p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs text-[oklch(0.7_0.16_145)]">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                                </span>
                            </div>
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-[oklch(0.7_0.01_260)]">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                                <span>{o.deliveryAddress}</span>
                            </div>
                            <div className="mt-2 flex justify-between items-center text-xs">
                                <span className="text-[oklch(0.65_0.01_260)]">{new Date(o.updatedAt).toLocaleString()}</span>
                                <span className="inline-flex items-center font-semibold"><IndianRupee className="w-3 h-3" />{o.totalAmount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
