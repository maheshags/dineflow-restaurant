import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Tag, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Route = createFileRoute('/user/cart')({
    component: UserCart,
});

import API_BASE_URL from '../../services/api';

function UserCart() {
    const navigate = useNavigate();
    
    const [cartData, setCartData] = useState<{ items: any[]; totalAmount: number } | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

    const fetchCart = async () => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate({ to: '/user/login' });
                return;
            }
            const res = await fetch(`${API_BASE_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
            
            setCartData({
                items: data.data?.items || [],
                totalAmount: data.data?.totalAmount || 0
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred');
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const updateQuantity = async (foodId: string, quantity: number) => {
        setLoadingIds(prev => ({ ...prev, [foodId]: true }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/cart/update`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ foodId, quantity })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update total');
            }
            await fetchCart();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error updating quantity');
        } finally {
            setLoadingIds(prev => ({ ...prev, [foodId]: false }));
        }
    };

    const handleRemoveItem = async (foodId: string) => {
        setLoadingIds(prev => ({ ...prev, [foodId]: true }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/cart/remove/${foodId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to remove item');
            }
            toast.success("Item removed from cart");
            await fetchCart();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error removing item');
        } finally {
            setLoadingIds(prev => ({ ...prev, [foodId]: false }));
        }
    };

    const handleClearCart = async () => {
        setLoadingIds(prev => ({ ...prev, "clear": true }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/cart/clear`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to clear cart');
            }
            toast.success("Cart cleared");
            await fetchCart();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error clearing cart');
        } finally {
            setLoadingIds(prev => ({ ...prev, "clear": false }));
        }
    };

    // Derived values for bill
    const items = cartData?.items || [];
    const subtotal = cartData?.totalAmount || 0;
    const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
    
    // Using simple math for additional charges if subtotal > 0
    const deliveryFee = subtotal > 0 ? 29 : 0;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + taxes;

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <header className="sticky top-0 z-30 bg-[oklch(0.18_0.012_260)]/95 backdrop-blur-xl border-b border-[oklch(0.26_0.012_260)] px-5 pt-6 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/user" className="w-9 h-9 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="font-display font-bold text-lg">My Cart</h1>
                            <p className="text-[11px] text-[oklch(0.6_0.01_260)]">{totalItems} items</p>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <button 
                            onClick={handleClearCart}
                            disabled={loadingIds["clear"]}
                            className="bg-destructive/10 text-destructive text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 rounded-lg hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                        >
                            {loadingIds["clear"] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Clear
                        </button>
                    )}
                </div>
            </header>

            {error ? (
                <div className="px-5 py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-9 h-9 text-destructive" />
                    </div>
                    <h2 className="font-display font-bold text-lg mt-5 text-destructive">Error loading cart</h2>
                    <p className="text-sm text-[oklch(0.6_0.01_260)] mt-1">{error}</p>
                    <button onClick={fetchCart} className="inline-block mt-6 px-6 py-3 rounded-full bg-[oklch(0.24_0.012_260)] text-sm font-semibold">
                        Retry
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="px-5 py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-9 h-9 text-[oklch(0.5_0.01_260)]" />
                    </div>
                    <h2 className="font-display font-bold text-lg mt-5">Your cart is empty</h2>
                    <p className="text-sm text-[oklch(0.6_0.01_260)] mt-1">Browse our delicious menu and add some food</p>
                    <Link to="/user/menu" search={{}} className="inline-block mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        Browse Menu
                    </Link>
                </div>
            ) : (
                <>
                    <div className="px-5 pt-4 space-y-3">
                        <AnimatePresence mode="popLayout">
                            {items.map(line => {
                                // Extract food data exactly as provided by API
                                const food = line.food || {};
                                const foodId = food._id || food.id;
                                const isLoading = loadingIds[foodId];
                                const itemSubtotal = food.price * line.quantity;
                                
                                return (
                                    <motion.div
                                        key={foodId}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="flex gap-3 bg-[oklch(0.22_0.012_260)] rounded-2xl p-3 border border-[oklch(0.26_0.012_260)] relative"
                                    >
                                        {isLoading && (
                                            <div className="absolute inset-0 bg-[oklch(0.18_0.012_260)]/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            </div>
                                        )}
                                        
                                        <img src={food.image || 'https://via.placeholder.com/80'} alt={food.name} className="w-20 h-20 rounded-xl object-cover" />
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <h3 className="font-semibold text-sm truncate">{food.name}</h3>
                                            <p className="text-[11px] text-[oklch(0.6_0.01_260)] mt-0.5">{food.category?.name || typeof food.category === 'string' ? food.category : 'Food'}</p>
                                            <div className="mt-auto">
                                                <span className="font-display font-bold text-sm text-primary inline-block">₹{food.price}</span>
                                                <span className="text-[10px] text-[oklch(0.6_0.01_260)] ml-1.5 hidden lg:inline">x {line.quantity}</span>
                                                <p className="text-[11px] font-semibold text-[oklch(0.85_0.01_260)] mt-0.5">Subtotal: ₹{itemSubtotal}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between">
                                            <button onClick={() => handleRemoveItem(foodId)} className="text-[oklch(0.5_0.01_260)] hover:text-destructive transition-colors pb-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-1.5 bg-primary/15 rounded-lg p-1">
                                                <button onClick={() => updateQuantity(foodId, line.quantity - 1)} className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-bold text-primary w-5 text-center">{line.quantity}</span>
                                                <button onClick={() => updateQuantity(foodId, line.quantity + 1)} className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Coupon */}
                    <div className="px-5 mt-4">
                        <button className="w-full flex items-center gap-3 bg-[oklch(0.22_0.012_260)] border border-dashed border-primary/40 rounded-2xl px-4 py-3">
                            <Tag className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium flex-1 text-left">Apply Coupon</span>
                            <span className="text-xs text-primary font-semibold">SPICE40</span>
                        </button>
                    </div>

                    {/* Bill */}
                    <div className="px-5 mt-4 mb-32">
                        <div className="bg-[oklch(0.22_0.012_260)] rounded-2xl p-4 border border-[oklch(0.26_0.012_260)] space-y-2">
                            <h3 className="font-display font-bold text-sm mb-2">Bill Details</h3>
                            <Row label="Item Total" value={`₹${subtotal}`} />
                            <Row label="Delivery Fee" value={`₹${deliveryFee}`} />
                            <Row label="Taxes & Charges" value={`₹${taxes}`} />
                            <div className="border-t border-[oklch(0.28_0.012_260)] pt-2 mt-2 flex justify-between">
                                <span className="font-display font-bold">Grand Total</span>
                                <span className="font-display font-bold text-primary text-lg">₹{total}</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 z-30">
                        <button
                            onClick={() => navigate({ to: '/user/checkout' })}
                            disabled={totalItems === 0}
                            className="w-full h-13 py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-between px-5 shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span>₹{total} • Proceed</span>
                            <span className="bg-white/20 rounded-lg px-3 py-1 text-xs">Checkout →</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-xs">
            <span className="text-[oklch(0.7_0.01_260)]">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}