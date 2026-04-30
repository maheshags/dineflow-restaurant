import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Layers, Package,
  Users, Star, CreditCard, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Bike,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/dashboard/categories', icon: Layers, label: 'Categories' },
  { to: '/dashboard/inventory', icon: Package, label: 'Inventory' },
  { to: '/dashboard/customers', icon: Users, label: 'Customers' },
  { to: '/dashboard/delivery', icon: Bike, label: 'Delivery Team' },
  { to: '/dashboard/reviews', icon: Star, label: 'Reviews' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col bg-sidebar-bg border-r border-sidebar-border h-screen sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
          S
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
            >
              Spice Garden
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          const isExactDashboard = item.to === '/dashboard' && location.pathname === '/dashboard';
          const active = item.to === '/dashboard' ? isExactDashboard : isActive;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}