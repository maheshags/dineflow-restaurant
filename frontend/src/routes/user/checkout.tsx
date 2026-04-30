import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Wallet, CreditCard, Smartphone, Banknote, CheckCircle2, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useUserAuth } from '@/hooks/use-user-auth';

export const Route = createFileRoute('/user/checkout')({
    component: Checkout,
});

const API_BASE_URL = "http://localhost:5000/api";

const payments = [
    { id: 'upi', label: 'UPI', desc: 'Pay via Google Pay, PhonePe', icon: Smartphone },
    { id: 'cash', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
];

function Checkout() {
    const navigate = useNavigate();
    const { name: authName, phone: authPhone } = useUserAuth();
    
    const [cartData, setCartData] = useState<{ items: any[]; totalAmount: number } | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Checkout states
    const [paymentId, setPaymentId] = useState('upi');
    const [placing, setPlacing] = useState(false);
    const [placed, setPlaced] = useState(false);
    
    const [details, setDetails] = useState({
        name: authName || '',
        phone: authPhone || '',
        location: '',
        address: '',
        instructions: ''
    });
    const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);
    const [locating, setLocating] = useState(false);

    // Fetch Cart
    useEffect(() => {
        const fetchCart = async () => {
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
                setError(e instanceof Error ? e.message : 'Error loading cart');
            } finally {
                setPageLoading(false);
            }
        };
        fetchCart();
    }, [navigate]);

    // Derived values for bill
    const items = cartData?.items || [];
    const subtotal = cartData?.totalAmount || 0;
    const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
    
    // Using simple math for additional charges if subtotal > 0
    const deliveryFee = subtotal > 0 ? 29 : 0;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + taxes;

    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ latitude, longitude });
                
                // Reverse geocode to get a readable string
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const area = addr.suburb || addr.neighbourhood || addr.city_district || "";
                        const city = addr.city || addr.town || addr.state || "";
                        const formattedLoc = area && city ? `${area}, ${city}` : city || area || "Current Location";
                        setDetails(prev => ({ ...prev, location: formattedLoc }));
                    }
                } catch (e) {
                    console.error(e);
                }
                
                toast.success('Location added successfully');
                setLocating(false);
            },
            () => {
                toast.error("Location permission denied. Please enter manually.");
                setLocating(false);
            }
        );
    };

    const handlePlace = async () => {
        if (items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        
        // Validation
        if (!details.name.trim() || !details.phone.trim()) {
            toast.error('Name and phone number are required');
            return;
        }
        
        if (!details.location.trim() || !details.address.trim()) {
            toast.error('Location map-area and complete house address are securely required');
            return;
        }

        setPlacing(true);
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/orders/place`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    customerDetails: {
                        name: details.name.trim(),
                        phone: details.phone.trim(),
                        location: details.location.trim(),
                        address: details.address.trim(),
                        instructions: details.instructions.trim(),
                        coordinates: coords || { latitude: 0, longitude: 0 }
                    },
                    paymentMethod: paymentId
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to place order');
            }
            
            toast.success('Order placed successfully!');
            setPlaced(true);
            setTimeout(() => {
                navigate({ to: '/user/orders' });
            }, 1800);
            
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error placing order');
            setPlacing(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
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
                <h2 className="font-display font-bold text-lg mt-5 text-destructive">Error loading checkout</h2>
                <p className="text-sm text-[oklch(0.6_0.01_260)] mt-1">{error}</p>
                <button onClick={() => window.location.reload()} className="inline-block mt-6 px-6 py-3 rounded-full bg-[oklch(0.24_0.012_260)] text-sm font-semibold">
                    Retry
                </button>
            </div>
        );
    }

    if (placed) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center"
                >
                    <CheckCircle2 className="w-14 h-14 text-success" />
                </motion.div>
                <h1 className="font-display font-bold text-2xl mt-6">Order Placed! 🎉</h1>
                <p className="text-sm text-[oklch(0.65_0.01_260)] mt-2">Your delicious food is being prepared.</p>
            </div>
        );
    }

    return (
        <div>
            <header className="sticky top-0 z-30 bg-[oklch(0.18_0.012_260)]/95 backdrop-blur-xl border-b border-[oklch(0.26_0.012_260)] px-5 pt-6 pb-3">
                <div className="flex items-center gap-3">
                    <Link to="/user/cart" className="w-9 h-9 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="font-display font-bold text-lg flex-1">Checkout</h1>
                </div>
            </header>

            <div className="px-5 pt-4 space-y-5 pb-32">
                {/* Details Form */}
                <section>
                    <h2 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" /> Delivery Details
                    </h2>
                    <div className="space-y-3 bg-[oklch(0.22_0.012_260)] rounded-2xl p-4 border border-[oklch(0.26_0.012_260)]">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Name"
                                value={details.name}
                                onChange={(e) => setDetails({...details, name: e.target.value})}
                                className="w-full bg-[oklch(0.24_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-xl px-4 h-11 text-sm outline-none focus:border-primary transition-colors"
                            />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={details.phone}
                                onChange={(e) => setDetails({...details, phone: e.target.value})}
                                className="w-full bg-[oklch(0.24_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-xl px-4 h-11 text-sm outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        
                        <div className="flex flex-col gap-3 pt-2 border-t border-[oklch(0.28_0.012_260)]">
                            <button
                                onClick={handleFetchLocation}
                                disabled={locating}
                                className="flex items-center justify-center gap-2 w-full bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 h-11 text-sm font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors"
                            >
                                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                {locating ? "getting location..." : "Use Current Location"}
                            </button>
                            <input
                                type="text"
                                placeholder="Area Location (e.g. Indiranagar)"
                                value={details.location}
                                onChange={(e) => setDetails({...details, location: e.target.value})}
                                className="w-full bg-[oklch(0.24_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-xl px-4 h-11 text-sm outline-none focus:border-primary transition-colors"
                            />
                            <textarea
                                placeholder="Complete Address (House no, Street)"
                                value={details.address}
                                onChange={(e) => setDetails({...details, address: e.target.value})}
                                rows={2}
                                className="w-full bg-[oklch(0.24_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                            />
                            <input
                                type="text"
                                placeholder="Delivery Instructions (Optional)"
                                value={details.instructions}
                                onChange={(e) => setDetails({...details, instructions: e.target.value})}
                                className="w-full bg-[oklch(0.24_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-xl px-4 h-11 text-sm outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* Items summary */}
                <section>
                    <h2 className="font-display font-bold text-sm mb-2">Order Summary</h2>
                    <div className="bg-[oklch(0.22_0.012_260)] rounded-2xl p-4 border border-[oklch(0.26_0.012_260)] space-y-2">
                        <p className="text-[11px] text-[oklch(0.6_0.01_260)] border-b border-[oklch(0.28_0.012_260)] pb-2 mb-2">
                            {totalItems} items • ₹{subtotal} subtotal
                        </p>
                        {items.length === 0 ? (
                            <p className="text-xs text-[oklch(0.6_0.01_260)] text-center py-2">No items in cart</p>
                        ) : items.map(l => (
                            <div key={l._id || l.id || Math.random()} className="flex justify-between text-xs">
                                <span className="text-[oklch(0.85_0.01_260)] truncate max-w-[200px]">{l.food?.name} × {l.quantity}</span>
                                <span className="font-medium">₹{(l.food?.price || 0) * l.quantity}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Payment */}
                <section>
                    <h2 className="font-display font-bold text-sm mb-2">Payment Method</h2>
                    <div className="space-y-2">
                        {payments.map(p => {
                            const active = paymentId === p.id;
                            const Icon = p.icon;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setPaymentId(p.id)}
                                    className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border transition ${active ? 'border-primary bg-primary/10' : 'border-[oklch(0.26_0.012_260)] bg-[oklch(0.22_0.012_260)]'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-[oklch(0.26_0.012_260)] text-[oklch(0.7_0.01_260)]'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{p.label}</p>
                                        <p className="text-[11px] text-[oklch(0.65_0.01_260)]">{p.desc}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-[oklch(0.4_0.01_260)]'}`} />
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Bill */}
                <section className="bg-[oklch(0.22_0.012_260)] rounded-2xl p-4 border border-[oklch(0.26_0.012_260)] space-y-2">
                    <h3 className="font-display font-bold text-sm mb-1">Bill Details</h3>
                    <Row label="Item Total" value={`₹${subtotal}`} />
                    <Row label="Delivery Fee" value={`₹${deliveryFee}`} />
                    <Row label="Taxes & Charges" value={`₹${taxes}`} />
                    <div className="border-t border-[oklch(0.28_0.012_260)] pt-2 mt-1 flex justify-between">
                        <span className="font-display font-bold text-sm">Grand Total</span>
                        <span className="font-display font-bold text-primary text-base">₹{total}</span>
                    </div>
                </section>
            </div>

            {/* CTA */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 z-30">
                <button
                    onClick={handlePlace}
                    disabled={placing || items.length === 0}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {placing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Placing Order…
                        </>
                    ) : (
                        `Place Order • ₹${total}`
                    )}
                </button>
            </div>
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