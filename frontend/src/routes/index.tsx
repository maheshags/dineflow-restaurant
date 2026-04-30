import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UtensilsCrossed, Loader2, Smartphone, Bike } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/')({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: 'Admin Login — Spice Garden' },
      { name: 'description', content: 'Admin login for Spice Garden Restaurant Management System' },
    ],
  }),
});

function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoggedIn) {
    navigate({ to: '/dashboard' });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate({ to: '/dashboard' });
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg relative overflow-hidden flex-col justify-center px-16">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold text-sidebar-foreground leading-tight">
            Spice Garden<br />
            <span className="text-primary">Admin Panel</span>
          </h1>
          <p className="text-sidebar-foreground/60 mt-4 text-lg max-w-md">
            Manage your restaurant operations, orders, menu, inventory, and more — all from one powerful dashboard.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Orders Today', value: '156' },
              { label: 'Revenue', value: '₹45.2K' },
              { label: 'Menu Items', value: '48' },
            ].map((stat) => (
              <div key={stat.label} className="bg-sidebar-accent/50 rounded-xl p-4">
                <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-sidebar-foreground/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Spice Garden</span>
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground mt-1">Sign in to your admin account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@spicegarden.com"
                className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-input accent-primary" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary font-medium hover:underline">Forgot password?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Use any email + password (4+ chars) to sign in
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/user" className="h-10 rounded-lg border border-input text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-accent transition-colors">
              <Smartphone className="w-3.5 h-3.5" /> Customer App
            </Link>
            <Link to="/delivery" className="h-10 rounded-lg border border-input text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-accent transition-colors">
              <Bike className="w-3.5 h-3.5" /> Delivery App
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}