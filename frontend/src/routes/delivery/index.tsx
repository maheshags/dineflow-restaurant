import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryAuth } from '@/hooks/use-delivery-auth';
import { DeliveryMap } from '@/components/shared/DeliveryMap';
import { NotificationCenter } from '@/components/shared/NotificationCenter';
import type { Order, OrderStatus } from '@/lib/types';
import {
    MapPin, Phone, Package, ChevronDown, ChevronUp, Bike, CheckCircle2, Navigation,
    CreditCard, Banknote, Clock, IndianRupee, User
} from 'lucide-react';
import { toast } from 'sonner';
import deliveryService from '@/services/delivery';

export const Route = createFileRoute('/delivery/')({
    component: DeliveryHome,
});

const tabs: { value: 'active' | 'completed'; label: string }[] = [
    { value: 'active', label: 'Active Orders' },
    { value: 'completed', label: 'Completed' },
];

function DeliveryHome() {
    const { user } = useDeliveryAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [tab, setTab] = useState<'active' | 'completed'>('active');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await deliveryService.getOrders();
            setOrders(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load delivery orders');
        }
    };

    const active = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.orderStatus));
    const completed = orders.filter(o => ['delivered', 'completed'].includes(o.orderStatus));

    const list = tab === 'active' ? active : completed;
    const earnings = completed.reduce((s, o) => s + Math.round(o.totalAmount * 0.1), 0);

    const handleOrderUpdated = (updated: Order) => {
        setOrders(prev => prev.map(order => order.id === updated.id ? updated : order));
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-body pb-20">
            {/* Header Area */}
            <div className="bg-gradient-to-b from-primary/20 to-transparent pt-12 pb-6 px-6 rounded-b-[2.5rem]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Welcome back,</p>
                            <h1 className="text-xl font-display font-bold text-white">{user?.name || 'Partner'}</h1>
                        </div>
                    </div>
                    <NotificationCenter />
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-3 gap-3">
                    <StatTile label="Active" value={active.length} tint="primary" icon={<Package className="w-4 h-4" />} />
                    <StatTile label="Done" value={completed.length} tint="success" icon={<CheckCircle2 className="w-4 h-4" />} />
                    <StatTile label="Earned" value={`₹${earnings}`} tint="warning" icon={<IndianRupee className="w-4 h-4" />} />
                </div>
            </div>

            <div className="px-5 mt-6">
                {/* Tabs */}
                <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-sm relative z-10">
                    {tabs.map(t => (
                        <button
                            key={t.value}
                            onClick={() => setTab(t.value)}
                            className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-300 relative ${tab === t.value ? 'text-white' : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            {tab === t.value && (
                                <motion.div layoutId="delivery-tab" className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                            )}
                            <span className="relative z-10">{t.label} {t.value === 'active' && active.length > 0 && `(${active.length})`}</span>
                        </button>
                    ))}
                </div>

                {/* List */}
                <AnimatePresence mode="popLayout">
                    {list.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-3xl bg-white/5 border border-white/10 p-10 text-center flex flex-col items-center justify-center mt-10"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <Bike className="w-10 h-10 text-white/30" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No {tab} orders</h3>
                            <p className="text-sm text-white/50 max-w-[200px] leading-relaxed">
                                {tab === 'active' ? 'You have no pending deliveries. Wait for new assignments.' : 'You haven\'t completed any deliveries yet.'}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {list.map(o => <OrderCard key={o.id} order={o} onOrderUpdated={handleOrderUpdated} />)}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function StatTile({ label, value, icon, tint }: { label: string; value: number | string; icon: React.ReactNode; tint: 'primary' | 'success' | 'warning' }) {
    const tintMap = {
        primary: 'bg-primary/20 text-primary border-primary/30',
        success: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
        warning: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
    };
    return (
        <div className={`rounded-2xl border backdrop-blur-md p-3.5 flex flex-col items-center justify-center text-center ${tintMap[tint]}`}>
            <div className="mb-2">{icon}</div>
            <p className="text-xl font-display font-bold leading-none mb-1">{value}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{label}</p>
        </div>
    );
}

function statusTone(s: OrderStatus) {
    if (s === 'out-for-delivery') return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
    if (s === 'delivered' || s === 'completed') return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30';
    return 'bg-primary/20 text-primary border-primary/30';
}

function OrderCard({ order, onOrderUpdated }: { order: Order; onOrderUpdated: (order: Order) => void }) {
    const [expanded, setExpanded] = useState(false);

    const next = async (status: OrderStatus, label: string) => {
        try {
            const updated = await deliveryService.updateOrderStatus(order.id, status);
            onOrderUpdated(updated);
            toast.success(label);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update delivery status');
        }
    };

    const callCustomer = () => { window.location.href = `tel:${order.customerPhone}`; };
    const openMap = () => {
        const destination = encodeURIComponent(order.deliveryAddress || order.customerName || 'Delivery Location');
        window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    };

    const payIcon = order.paymentMethod === 'cash' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />;
    const isDone = order.orderStatus === 'delivered' || order.orderStatus === 'completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-[2rem] bg-[#141414] border border-white/5 overflow-hidden shadow-xl"
        >
            {/* Fake Map Background Header */}
            <div className="relative h-24 bg-[#1a1a1a] w-full overflow-hidden flex items-center justify-center border-b border-white/5">
                {/* Dummy map pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent"></div>

                <div className="relative z-10 w-full px-5 flex justify-between items-center">
                    <div>
                        <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/70 tracking-widest uppercase">
                            #{order.id.slice(-6)}
                        </span>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize border backdrop-blur-md ${statusTone(order.orderStatus)} shadow-lg`}>
                        {order.orderStatus.replace(/-/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="px-5 pt-3 pb-5">
                {/* Customer Details */}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Delivering to</p>
                        <h2 className="text-xl font-display font-bold text-white leading-tight">{order.customerName}</h2>
                    </div>
                    <button onClick={callCustomer} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                        <Phone className="w-4 h-4" />
                    </button>
                </div>

                {/* Address Box */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-4 mb-5">
                    <div className="flex gap-3 relative z-10">
                        <div className="mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/90 leading-relaxed font-medium">{order.deliveryAddress || 'No address provided'}</p>
                        </div>
                        <button onClick={openMap} className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 hover:scale-105 transition-transform">
                            <Navigation className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Delivery Map */}
                <div className="mb-5">
                    <DeliveryMap 
                        address={order.deliveryAddress || 'Delivery Location'} 
                        customerName={order.customerName}
                    />
                </div>

                {/* Order Meta info */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                        <div className="flex items-center gap-1.5 text-white/50 mb-1">
                            {payIcon} <span className="text-[10px] uppercase font-bold tracking-wider">{order.paymentMethod}</span>
                        </div>
                        <p className={`font-semibold text-sm ${order.paymentStatus === 'paid' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                            {order.paymentStatus === 'paid' ? 'Paid' : 'To Collect'}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                        <div className="flex items-center gap-1.5 text-white/50 mb-1">
                            <Package className="w-4 h-4" /> <span className="text-[10px] uppercase font-bold tracking-wider">Items</span>
                        </div>
                        <p className="font-semibold text-white text-sm">{order.items.length} items</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                        <div className="flex items-center gap-1.5 text-white/50 mb-1">
                            <IndianRupee className="w-4 h-4" /> <span className="text-[10px] uppercase font-bold tracking-wider">Total</span>
                        </div>
                        <p className="font-semibold text-white text-sm font-display">₹{order.totalAmount}</p>
                    </div>
                </div>

                {/* Expand Items */}
                <button onClick={() => setExpanded(!expanded)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors mb-4">
                    {expanded ? 'Hide Items' : 'View Order Items'}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-5 space-y-3">
                                {order.items.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white/70">{it.quantity}x</span>
                                            <span className="text-white/80">{it.foodName}</span>
                                        </div>
                                        <span className="font-semibold text-white/90">₹{it.price * it.quantity}</span>
                                    </div>
                                ))}
                                {order.notes && (
                                    <div className="mt-3 p-3 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                                        <p className="text-[10px] uppercase text-[#f59e0b] font-bold mb-1">Customer Note</p>
                                        <p className="text-sm text-[#f59e0b]/90">{order.notes}</p>
                                    </div>
                                )}
                                <div className="text-xs text-white/40 flex items-center gap-1 pt-2 border-t border-white/5 mt-2">
                                    <Clock className="w-3 h-3" /> Placed {new Date(order.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Big Actions */}
                <div className="pt-2">
                    {!isDone && order.orderStatus !== 'out-for-delivery' && (
                        <button
                            onClick={() => next('out-for-delivery', 'Marked as Out for Delivery!')}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-[1.02] transition-transform"
                        >
                            <Bike className="w-5 h-5" /> Start Delivery
                        </button>
                    )}
                    {order.orderStatus === 'out-for-delivery' && (
                        <button
                            onClick={() => next('delivered', 'Order successfully delivered!')}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-base font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-transform"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Mark as Delivered
                        </button>
                    )}
                    {isDone && (
                        <div className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-[#10b981] text-base font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Delivery Completed
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
