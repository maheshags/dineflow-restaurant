import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Search, MapPin, Bell, Star, Flame, Clock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';
import { useUserAuth } from '@/hooks/use-user-auth';

export const Route = createFileRoute('/user/')({
    component: UserHome,
});

import API_BASE_URL from '../../services/api';

function UserHome() {
    const [foods, setFoods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addItem } = useCart();
    
    // Auth and Location states
    const { name } = useUserAuth();
    const displayName = name || 'User';
    const [locationName, setLocationName] = useState('Fetching location...');

    useEffect(() => {
        // Fetch Foods
        const fetchFoods = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/foods`);
                const data = await res.json();
                if (!res.ok) throw new Error("Failed to load foods");
                
                // Map API fields to UI expected structure
                const mapped = (data.data || []).map((f: any) => ({
                    id: f._id,
                    name: f.name,
                    description: f.description || '',
                    price: f.price,
                    image: f.image || 'https://via.placeholder.com/150',
                    category: typeof f.category === 'object' ? f.category?.name : f.category,
                    categoryId: typeof f.category === 'object' ? f.category?._id : f.category,
                    rating: f.averageRating || 4.0, // fallback
                    totalOrders: f.totalRatings || Math.floor(Math.random() * 100), // fallback if backend has no orders
                    bestseller: f.averageRating >= 4
                }));
                
                setFoods(mapped);
            } catch (err) {
                setError("Failed to load foods");
            } finally {
                setLoading(false);
            }
        };
        fetchFoods();

        // Fetch Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        const area = addr.suburb || addr.neighbourhood || addr.city_district || "";
                        const city = addr.city || addr.town || addr.state || "";
                        const formatted = area && city ? `${area}, ${city}` : city || area || "Current Location";
                        setLocationName(formatted);
                    } else {
                        setLocationName('Current Location');
                    }
                } catch (err) {
                    setLocationName('Location unavailable');
                }
            }, () => {
                setLocationName('Location off / Denied');
            });
        } else {
            setLocationName('Location unsupported');
        }
    }, []);

    // Derived states
    const bestsellers = [...foods]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
        
    const trending = [...foods]
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, 6);
        
    const activeCategories = Array.from(new Set(foods.map(f => f.category).filter(Boolean))).map((catName, idx) => {
        // Find matching food to grab categoryId
        const match = foods.find(f => f.category === catName);
        return {
            id: match?.categoryId || `cat-${idx}`,
            name: catName,
            image: ['🍲', '🥘', '🍜', '🥗', '🍨', '🍕'][idx % 6] || '🍲',
            active: true
        };
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-5 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                <h2 className="font-display font-bold text-lg text-destructive">{error}</h2>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <header className="px-5 pt-8 pb-4 bg-gradient-to-b from-[oklch(0.22_0.015_260)] to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-[oklch(0.65_0.01_260)]">
                            <MapPin className="w-3 h-3 text-primary" />
                            Deliver to
                        </div>
                        <p className="font-display font-semibold text-sm mt-0.5 truncate max-w-[200px]">
                            {locationName}
                        </p>
                    </div>
                    <button className="relative w-10 h-10 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center">
                        <Bell className="w-4 h-4 text-[oklch(0.85_0.01_260)]" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                    </button>
                </div>

                <div className="mt-5">
                    <h1 className="font-display text-2xl font-bold leading-tight">
                        Hey {displayName} 👋<br />
                        <span className="text-primary">What are you</span> craving?
                    </h1>
                </div>

                {/* Search */}
                <Link to="/user/menu" search={{}} className="mt-5 flex items-center gap-3 bg-[oklch(0.24_0.012_260)] rounded-2xl px-4 h-12">
                    <Search className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                    <span className="text-sm text-[oklch(0.55_0.01_260)] flex-1">Search biryani, pizza, dosa…</span>
                </Link>
            </header>

            {/* Promo banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mt-2 rounded-3xl p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, oklch(0.65 0.17 45), oklch(0.55 0.18 30))' }}
            >
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                    <span className="inline-block bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Limited Offer</span>
                    <h3 className="font-display text-xl font-bold text-white mt-2">Flat 40% OFF</h3>
                    <p className="text-white/80 text-xs mt-1">on your first order above ₹299</p>
                    <p className="text-white/70 text-[10px] mt-3 font-mono">CODE: SPICE40</p>
                </div>
            </motion.div>

            {/* Categories */}
            {activeCategories.length > 0 && (
                <section className="mt-6">
                    <div className="flex items-center justify-between px-5 mb-3">
                        <h2 className="font-display font-bold text-base">Categories</h2>
                        <Link to="/user/menu" search={{}} className="text-xs text-primary font-medium">See all</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-thin">
                        {activeCategories.map(cat => (
                            <Link
                                key={cat.id}
                                to="/user/menu"
                                search={{ category: cat.id }}
                                className="flex-shrink-0 w-20 flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[oklch(0.24_0.012_260)] flex items-center justify-center text-3xl">
                                    {cat.image}
                                </div>
                                <span className="text-[11px] text-center text-[oklch(0.85_0.01_260)] font-medium leading-tight">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Bestsellers */}
            {bestsellers.length > 0 && (
                <section className="mt-6">
                    <div className="flex items-center justify-between px-5 mb-3">
                        <h2 className="font-display font-bold text-base flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-primary" /> Bestsellers
                        </h2>
                        <Link to="/user/menu" search={{}} className="text-xs text-primary font-medium">See all</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-thin">
                        {bestsellers.map((food, i) => (
                            <motion.div
                                key={food.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex-shrink-0 w-44 bg-[oklch(0.22_0.012_260)] rounded-3xl overflow-hidden border border-[oklch(0.26_0.012_260)]"
                            >
                                <div className="relative h-28 bg-[oklch(0.24_0.012_260)]">
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 fill-warning text-warning" />
                                        {food.rating}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm truncate">{food.name}</h3>
                                    <p className="text-[10px] text-[oklch(0.6_0.01_260)] mt-0.5 truncate">{food.category}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-display font-bold text-sm text-primary">₹{food.price}</span>
                                        <button
                                            onClick={() => addItem(food)}
                                            className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold hover:bg-primary/90 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending list */}
            {trending.length > 0 && (
                <section className="mt-6 px-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-display font-bold text-base flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" /> Trending Now
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {trending.map(food => (
                            <div key={food.id} className="flex gap-3 bg-[oklch(0.22_0.012_260)] rounded-2xl p-3 border border-[oklch(0.26_0.012_260)]">
                                <img src={food.image} alt={food.name} className="w-20 h-20 rounded-xl object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{food.name}</h3>
                                    <p className="text-[11px] text-[oklch(0.6_0.01_260)] mt-0.5 line-clamp-1">{food.description}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1 text-[11px] text-warning">
                                            <Star className="w-3 h-3 fill-current" /> {food.rating}
                                        </div>
                                        <span className="text-[10px] text-[oklch(0.55_0.01_260)]">• {food.totalOrders} orders</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <span className="font-display font-bold text-sm text-primary">₹{food.price}</span>
                                    <button
                                        onClick={() => addItem(food)}
                                        className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        ADD
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}