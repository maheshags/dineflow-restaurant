import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Bike, CheckCircle2, Clock, Package, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/user/orders')({
    component: UserOrders,
});

const API_BASE_URL = "http://localhost:5000/api";

const stages = [
    { key: 'placed', label: 'Order Placed', icon: Package },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ontheway', label: 'On the way', icon: Bike },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function statusToStage(s: string): number {
    const status = s.toLowerCase();
    if (['pending', 'accepted'].includes(status)) return 0;
    if (['preparing', 'ready'].includes(status)) return 1;
    if (['assigned', 'picked', 'out_for_delivery'].includes(status)) return 2;
    if (status === 'delivered') return 3;
    if (status === 'cancelled') return -1; // -1 for not applicable
    return 0;
}

function getBadgeColor(s: string): string {
    const status = s.toLowerCase();
    switch (status) {
        case 'pending': return 'bg-yellow-500/20 text-yellow-600';
        case 'preparing': return 'bg-orange-500/20 text-orange-600';
        case 'out_for_delivery': return 'bg-blue-500/20 text-blue-600';
        case 'delivered': return 'bg-success/20 text-success';
        case 'cancelled': return 'bg-destructive/20 text-destructive';
        default: return 'bg-primary/20 text-primary';
    }
}

function UserOrders() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'active' | 'past'>('active');
    
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate({ to: '/user/login' });
                return;
            }
            
            const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch orders');
            }
            // Backend already returns latest orders first via sort({ createdAt: -1 })
            setOrders(data.data || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [navigate]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const activeList = orders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled');
    const pastList = orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'cancelled');
    const list = tab === 'active' ? activeList : pastList;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-5 py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-9 h-9 text-destructive" />
                </div>
                <h2 className="font-display font-bold text-lg mt-5 text-destructive">Error loading orders</h2>
                <p className="text-sm text-[oklch(0.6_0.01_260)] mt-1">{error}</p>
                <button onClick={handleRefresh} className="inline-block mt-6 px-6 py-3 rounded-full bg-[oklch(0.24_0.012_260)] text-sm font-semibold flex items-center mx-auto gap-2">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <header className="sticky top-0 z-30 bg-[oklch(0.18_0.012_260)]/95 backdrop-blur-xl border-b border-[oklch(0.26_0.012_260)] px-5 pt-6 pb-3">
                <div className="flex items-center gap-3">
                    <Link to="/user" className="w-9 h-9 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="font-display font-bold text-lg flex-1">My Orders</h1>
                    <button onClick={handleRefresh} className="w-9 h-9 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center text-[oklch(0.7_0.01_260)] hover:text-primary transition-colors">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="mt-3 grid grid-cols-2 bg-[oklch(0.24_0.012_260)] p-1 rounded-xl">
                    <button
                        onClick={() => setTab('active')}
                        className={`py-2 rounded-lg text-xs font-semibold transition-colors ${tab === 'active' ? 'bg-primary text-primary-foreground' : 'text-[oklch(0.7_0.01_260)]'}`}
                    >
                        Active ({activeList.length})
                    </button>
                    <button
                        onClick={() => setTab('past')}
                        className={`py-2 rounded-lg text-xs font-semibold transition-colors ${tab === 'past' ? 'bg-primary text-primary-foreground' : 'text-[oklch(0.7_0.01_260)]'}`}
                    >
                        Past ({pastList.length})
                    </button>
                </div>
            </header>

            <div className="px-5 pt-4 pb-24 space-y-4">
                {list.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="w-12 h-12 text-[oklch(0.4_0.01_260)] mx-auto" />
                        <p className="text-sm text-[oklch(0.6_0.01_260)] mt-3">No {tab} orders yet</p>
                        <Link to="/user/menu" search={{}} className="inline-block mt-4 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/20">
                            Browse Menu
                        </Link>
                    </div>
                ) : list.map((order, idx) => {
                    const stage = statusToStage(order.orderStatus);
                    return (
                        <motion.div
                            key={order._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-[oklch(0.22_0.012_260)] rounded-2xl p-4 border border-[oklch(0.26_0.012_260)]"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-display font-medium text-xs text-[oklch(0.6_0.01_260)]">Order #{order._id.slice(-6).toUpperCase()}</p>
                                    <p className="text-[10px] text-[oklch(0.6_0.01_260)] mt-1">
                                        {new Date(order.placedAt || order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getBadgeColor(order.orderStatus)}`}>
                                    {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>

                            <div className="mt-3 space-y-2">
                                {order.items.map((it: any) => (
                                    <div key={it._id || it.food} className="flex gap-3">
                                        {it.image && (
                                            <img src={it.image} alt={it.name} className="w-10 h-10 rounded-lg object-cover bg-[oklch(0.18_0.012_260)]" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-semibold text-[oklch(0.9_0.01_260)] truncate mr-2">{it.name}</span>
                                                <span className="font-medium">₹{it.price * it.quantity}</span>
                                            </div>
                                            <span className="text-[10px] text-[oklch(0.6_0.01_260)]">Qty: {it.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Customer Details Display */}
                            <div className="mt-3 pt-3 border-t border-[oklch(0.28_0.012_260)] text-[11px] text-[oklch(0.65_0.01_260)]">
                                <p className="font-medium text-[oklch(0.8_0.01_260)] mb-0.5">{order.customerDetails?.name} • {order.customerDetails?.phone}</p>
                                <p className="truncate">{order.customerDetails?.location || order.customerDetails?.address}</p>
                                <p className="truncate text-[10px] mt-0.5 opacity-80">{order.customerDetails?.address}</p>
                            </div>

                            {/* UI Stage mapping for active orders */}
                            {tab === 'active' && stage >= 0 && (
                                <div className="mt-4 pt-4 border-t border-[oklch(0.28_0.012_260)]">
                                    <div className="flex justify-between mb-2">
                                        {stages.map((s, i) => {
                                            const reached = i <= stage;
                                            const Icon = s.icon;
                                            return (
                                                <div key={s.key} className="flex flex-col items-center flex-1 relative">
                                                    {i < stages.length - 1 && (
                                                        <div className={`absolute top-3 left-1/2 w-full h-0.5 ${i < stage ? 'bg-primary' : 'bg-[oklch(0.3_0.01_260)]/50'}`} />
                                                    )}
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${reached ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-[oklch(0.28_0.012_260)] text-[oklch(0.5_0.01_260)]'
                                                        }`}>
                                                        <Icon className="w-3 h-3" />
                                                    </div>
                                                    <span className={`text-[9px] mt-1 text-center truncate w-full px-1 ${reached ? 'text-primary font-bold' : 'text-[oklch(0.5_0.01_260)]'}`}>
                                                        {s.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 flex items-center justify-between pt-3 border-t border-[oklch(0.28_0.012_260)]">
                                <span className="text-[11px] font-semibold text-[oklch(0.7_0.01_260)] flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-success' : 'bg-yellow-500'}`} />
                                    {order.paymentMethod?.toUpperCase()}
                                </span>
                                <span className="font-display font-bold text-primary">₹{order.totalAmount}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}