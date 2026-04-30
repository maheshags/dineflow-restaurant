import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bike, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useDeliveryAuth } from '@/hooks/use-delivery-auth';

export const Route = createFileRoute('/delivery/login')({
    component: DeliveryLoginPage,
});

function DeliveryLoginPage() {
    const navigate = useNavigate();
    const { signIn } = useDeliveryAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await signIn(phone, password);
        setLoading(false);
        if (!res.ok) {
            setError(res.error ?? 'Login failed');
            return;
        }
        navigate({ to: '/delivery' });
    };

    return (
        <div className="min-h-screen bg-[oklch(0.16_0.012_260)] text-[oklch(0.95_0.005_260)] flex justify-center font-body">
            <div className="w-full max-w-[480px] min-h-screen bg-[oklch(0.18_0.012_260)] flex flex-col px-6 pt-14">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                        <Bike className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-display font-bold">Delivery Partner</h1>
                    <p className="text-sm text-[oklch(0.65_0.01_260)] mt-1">Sign in to view your assigned orders</p>
                </motion.div>

                <form onSubmit={onSubmit} className="mt-10 space-y-4">
                    <div>
                        <label className="text-xs text-[oklch(0.65_0.01_260)] mb-1.5 block">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="9000000001"
                                className="w-full h-12 rounded-xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] pl-10 pr-3 text-sm text-[oklch(0.95_0.005_260)] placeholder:text-[oklch(0.5_0.01_260)] focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[oklch(0.65_0.01_260)] mb-1.5 block">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                            <input
                                type={show ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 rounded-xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)] pl-10 pr-10 text-sm text-[oklch(0.95_0.005_260)] placeholder:text-[oklch(0.5_0.01_260)] focus:outline-none focus:border-primary transition-colors"
                            />
                            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.6_0.01_260)]">
                                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive">{error}</motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !phone || !password}
                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 p-3 rounded-xl bg-[oklch(0.22_0.015_260)] border border-[oklch(0.28_0.015_260)]">
                    <p className="text-xs text-[oklch(0.65_0.01_260)] mb-1">Demo credentials</p>
                    <p className="text-xs text-[oklch(0.85_0.005_260)]">Phone: <span className="font-mono">9000000001</span> · Password: <span className="font-mono">pass1234</span></p>
                </div>
            </div>
        </div>
    );
}
