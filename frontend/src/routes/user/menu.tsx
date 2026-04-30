import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, Star, Plus, Minus, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Route = createFileRoute('/user/menu')({
    component: UserMenu,
    validateSearch: (search: Record<string, unknown>): { category?: string } => ({
        category: typeof search.category === 'string' ? search.category : undefined,
    }),
});

const API_BASE_URL = "http://localhost:5000/api";

function UserMenu() {
    const { category: initialCategory } = Route.useSearch();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeCat, setActiveCat] = useState<string>(initialCategory ?? 'all');
    
    // Foods logic
    const [foods, setFoods] = useState<any[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(true);
    const [errorFoods, setErrorFoods] = useState('');

    useEffect(() => {
        const fetchFoods = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/foods`);
                const data = await res.json();
                if (!res.ok) throw new Error("Failed to load foods");
                
                const mapped = (data.data || []).map((f: any) => ({
                    id: f._id,
                    name: f.name,
                    description: f.description || '',
                    price: f.price,
                    image: f.image || 'https://via.placeholder.com/150',
                    category: typeof f.category === 'object' ? f.category?.name : f.category,
                    categoryId: typeof f.category === 'object' ? f.category?._id : f.category,
                    rating: f.averageRating || 0,
                    totalOrders: f.totalRatings || 0,
                    bestseller: f.averageRating >= 4,
                    stock: f.stock || 0
                }));
                setFoods(mapped);
            } catch (err) {
                setErrorFoods("Failed to load matching food items");
            } finally {
                setLoadingFoods(false);
            }
        };
        fetchFoods();
    }, []);

    // Derived Categories
    const categories = useMemo(() => {
        return Array.from(new Set(foods.map(f => f.category).filter(Boolean))).map((catName, idx) => {
            const match = foods.find(f => f.category === catName);
            return {
                id: match?.categoryId || `cat-${idx}`,
                name: String(catName),
                image: ['🍲', '🥘', '🍜', '🥗', '🍨', '🍕'][idx % 6] || '🍲',
                active: true
            };
        });
    }, [foods]);

    // Cart logic
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCartItems(data.data?.items || []);
            }
        } catch (e) {
            console.error("Failed to fetch cart", e);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const filtered = useMemo(() => {
        return foods.filter(f => {
            if (activeCat !== 'all' && f.categoryId !== activeCat) return false;
            if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
            return true;
        });
    }, [foods, query, activeCat]);

    // The cart API returns item.food._id or item.food.id
    const qtyOf = (id: string) => {
        const item = cartItems.find(i => i.food?._id === id || i.food?.id === id || i.food === id);
        return item?.quantity || 0;
    };

    const handleAdd = async (foodId: string) => {
        setLoadingIds(prev => ({ ...prev, [foodId]: true }));
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate({ to: '/user/login' });
                return;
            }
            const res = await fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ foodId, quantity: 1 })
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.message || 'Failed to add item');
                return;
            }

            toast.success('Added to cart');
            await fetchCart();
        } finally {
            setLoadingIds(prev => ({ ...prev, [foodId]: false }));
        }
    };

    const handleDecrement = async (foodId: string) => {
        const currentQty = qtyOf(foodId);
        if (currentQty <= 0) return;
        
        setLoadingIds(prev => ({ ...prev, [foodId]: true }));
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/cart/update`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ foodId, quantity: currentQty - 1 })
            });
            await fetchCart();
        } finally {
            setLoadingIds(prev => ({ ...prev, [foodId]: false }));
        }
    };

    return (
        <div>
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[oklch(0.18_0.012_260)]/95 backdrop-blur-xl border-b border-[oklch(0.26_0.012_260)] px-5 pt-6 pb-3">
                <div className="flex items-center gap-3">
                    <Link to="/user" className="w-9 h-9 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="font-display font-bold text-lg flex-1">Our Menu</h1>
                </div>

                <div className="mt-3 flex items-center gap-2 bg-[oklch(0.24_0.012_260)] rounded-2xl px-4 h-11">
                    <Search className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search dishes…"
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-[oklch(0.55_0.01_260)]"
                    />
                </div>

                {/* Category chips */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-5 px-5">
                    <CatChip label="All" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
                    {categories.map(c => (
                        <CatChip
                            key={c.id}
                            label={`${c.image} ${c.name}`}
                            active={activeCat === c.id}
                            onClick={() => setActiveCat(c.id)}
                        />
                    ))}
                </div>
            </header>

            {/* List */}
            <div className="px-5 pt-4 space-y-3 pb-24">
                {loadingFoods && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <p className="text-sm text-[oklch(0.6_0.01_260)] mt-3">Loading menu...</p>
                    </div>
                )}
                
                {errorFoods && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
                        <p className="text-sm text-[oklch(0.6_0.01_260)]">{errorFoods}</p>
                    </div>
                )}
                
                {!loadingFoods && !errorFoods && (
                    <p className="text-xs text-[oklch(0.6_0.01_260)]">{filtered.length} dishes available</p>
                )}
                
                <AnimatePresence mode="popLayout">
                    {filtered.map(food => {
                        const qty = qtyOf(food.id);
                        const isLoading = loadingIds[food.id];
                        const outOfStock = food.stock <= 0;

                        return (
                            <motion.div
                                key={food.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-3 bg-[oklch(0.22_0.012_260)] rounded-2xl p-3 border border-[oklch(0.26_0.012_260)]"
                            >
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <img src={food.image} alt={food.name} className={`w-full h-full rounded-xl object-cover ${outOfStock ? 'grayscale opacity-70' : ''}`} />
                                    {food.bestseller && !outOfStock && (
                                        <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                            BEST
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <h3 className="font-semibold text-sm">{food.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-[oklch(0.6_0.01_260)] truncate">{food.category}</p>
                                        <p className="text-[10px] text-[oklch(0.6_0.01_260)] truncate">• Stock: {food.stock}</p>
                                    </div>
                                    <p className="text-[11px] text-[oklch(0.6_0.01_260)] mt-0.5 line-clamp-1">{food.description}</p>
                                    <div className="flex items-center gap-2 mt-auto">
                                        <div className="flex items-center gap-1 text-[11px] text-warning">
                                            <Star className="w-3 h-3 fill-current" /> {food.rating > 0 ? food.rating.toFixed(1) : "New"}
                                        </div>
                                        <span className="text-[10px] text-[oklch(0.55_0.01_260)]">• {food.totalOrders}+ orders</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <span className="font-display font-bold text-sm text-primary">₹{food.price}</span>
                                    {isLoading ? (
                                        <div className="h-7 w-16 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                        </div>
                                    ) : outOfStock && qty === 0 ? (
                                        <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">Out of stock</span>
                                    ) : qty === 0 ? (
                                        <button
                                            onClick={() => handleAdd(food.id)}
                                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                                        >
                                            ADD
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-primary/15 rounded-lg p-1">
                                            <button onClick={() => handleDecrement(food.id)} className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold text-primary w-4 text-center">{qty}</span>
                                            <button 
                                                onClick={() => handleAdd(food.id)} 
                                                disabled={outOfStock}
                                                className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary disabled:opacity-50"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {!loadingFoods && !errorFoods && filtered.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-sm text-[oklch(0.6_0.01_260)]">No dishes found</p>
                    </div>
                )}
            </div>
            
            {/* Floating cart summary if items exist */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 z-40">
                    <Link to="/user/cart" className="flex items-center justify-between w-full bg-primary text-primary-foreground px-5 py-4 rounded-2xl shadow-lg shadow-primary/30">
                        <div className="flex items-center gap-2">
                            <span className="font-display font-bold bg-white/20 rounded-lg px-2.5 py-1 text-sm">{cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items</span>
                        </div>
                        <span className="font-display font-bold flex items-center gap-2 text-sm">
                            View Cart <ArrowLeft className="w-4 h-4 rotate-180" />
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}

function CatChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition-colors ${active
                ? 'bg-primary text-primary-foreground'
                : 'bg-[oklch(0.24_0.012_260)] text-[oklch(0.85_0.01_260)] border border-[oklch(0.28_0.012_260)]'
                }`}
        >
            {label}
        </button>
    );
}