import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ShoppingCart, DollarSign, Clock, CheckCircle, UtensilsCrossed, AlertTriangle,
  Plus, Package, Eye, CreditCard, Loader,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { ordersService } from '@/services/orders';
import { foodsService } from '@/services/foods';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items: Array<{ foodId: string; foodName: string; quantity: number; price: number }>;
}

interface DashboardFood {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
}

// ─── Week Chart Helpers ───────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function buildWeeklyData(orders: DashboardOrder[]) {
  const revenueByDay: Record<string, number> = {};
  const ordersByDay: Record<string, number> = {};
  DAY_LABELS.forEach(d => { revenueByDay[d] = 0; ordersByDay[d] = 0; });

  orders.forEach(order => {
    try {
      const date = new Date(order.createdAt);
      if (isNaN(date.getTime())) return;
      const label = DAY_LABELS[date.getDay()];
      revenueByDay[label] = (revenueByDay[label] ?? 0) + (Number(order.totalAmount) || 0);
      ordersByDay[label] = (ordersByDay[label] ?? 0) + 1;
    } catch {
      // skip malformed dates
    }
  });

  // Arrange Mon → Sun to match existing UI order
  const arranged = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return arranged.map(name => ({
    name,
    revenue: revenueByDay[name] ?? 0,
    orders: ordersByDay[name] ?? 0,
  }));
}

// ─── Top Selling Items ────────────────────────────────────────────────────────

interface TopSellingItem {
  id: string;
  name: string;
  image: string;
  price: number;
  totalOrders: number;
}

function buildTopSelling(orders: DashboardOrder[], foods: DashboardFood[]): TopSellingItem[] {
  const foodMap = new Map(foods.map(f => [f.id, f]));
  const qtyMap = new Map<string, number>();
  const nameMap = new Map<string, string>();
  const priceMap = new Map<string, number>();

  orders.forEach(order => {
    (order.items ?? []).forEach(item => {
      const key = item.foodId ?? item.foodName ?? '';
      if (!key) return;
      qtyMap.set(key, (qtyMap.get(key) ?? 0) + (Number(item.quantity) || 1));
      nameMap.set(key, foodMap.get(item.foodId)?.name ?? item.foodName ?? key);
      priceMap.set(key, foodMap.get(item.foodId)?.price ?? item.price ?? 0);
    });
  });

  return [...qtyMap.entries()]
    .map(([key, qty]) => ({
      id: key,
      name: nameMap.get(key) ?? key,
      image:
        foodMap.get(key)?.image ??
        `https://via.placeholder.com/80x80?text=${encodeURIComponent(nameMap.get(key)?.slice(0, 2) ?? '?')}`,
      price: priceMap.get(key) ?? 0,
      totalOrders: qty,
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);
}

// ─── Component ────────────────────────────────────────────────────────────────

function DashboardHome() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [foods, setFoods] = useState<DashboardFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersResult, foodsResult] = await Promise.allSettled([
        ordersService.getOrders(),
        foodsService.getFoods(),
      ]);

      setOrders(ordersResult.status === 'fulfilled' ? (ordersResult.value as DashboardOrder[]) : []);
      setFoods(foodsResult.status === 'fulfilled' ? (foodsResult.value as DashboardFood[]) : []);

      if (ordersResult.status === 'rejected' && foodsResult.status === 'rejected') {
        setError('Failed to load dashboard data. Please retry.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayRevenue = useMemo(
    () =>
      orders
        .filter(o => (o.createdAt ?? '').startsWith(todayStr))
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
    [orders, todayStr],
  );

  const totalOrders = orders.length;

  const pendingOrders = useMemo(
    () =>
      orders.filter(o => {
        const s = (o.orderStatus ?? '').toLowerCase();
        return s === 'pending' || s === 'new' || s === 'accepted';
      }).length,
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter(o => (o.orderStatus ?? '').toLowerCase() === 'completed').length,
    [orders],
  );

  const menuItems = foods.length;
  const lowStock = useMemo(() => foods.filter(f => Number(f.stock) <= 5).length, [foods]);

  const weeklyData = useMemo(() => buildWeeklyData(orders), [orders]);
  const topSelling = useMemo(() => buildTopSelling(orders, foods), [orders, foods]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [orders],
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <TopNavbar title="Dashboard" subtitle="Welcome back, Admin" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <TopNavbar title="Dashboard" subtitle="Welcome back, Admin" />
      <div className="p-6 space-y-6">

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <button
              onClick={fetchData}
              className="text-sm font-medium text-destructive hover:underline ml-4 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} change="+12% from last week" trend="up" />
          <StatCard
            title="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
            icon={DollarSign}
            change="+8% from yesterday"
            trend="up"
            variant="primary"
          />
          <StatCard title="Pending Orders" value={pendingOrders} icon={Clock} variant="warning" />
          <StatCard title="Completed" value={completedOrders} icon={CheckCircle} variant="success" />
          <StatCard title="Menu Items" value={menuItems} icon={UtensilsCrossed} />
          <StatCard title="Low Stock" value={lowStock} icon={AlertTriangle} variant="destructive" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
          >
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
          >
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">Orders Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                  }}
                />
                <Bar dataKey="orders" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Items */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
          >
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">Top Selling Items</h3>
            {topSelling.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {topSelling.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src =
                          `https://via.placeholder.com/36x36?text=${encodeURIComponent(item.name.slice(0, 2))}`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.totalOrders} orders</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">₹{item.price}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-xl border border-border p-5 shadow-sm lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-semibold text-foreground">Recent Orders</h3>
              <Link to="/dashboard/orders" className="text-xs text-primary font-medium hover:underline">
                View All
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Order ID</th>
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium text-foreground">{order.id}</td>
                        <td className="py-2.5 text-muted-foreground">{order.customerName ?? '—'}</td>
                        <td className="py-2.5 font-medium text-foreground">
                          ₹{(Number(order.totalAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={order.orderStatus ?? 'new'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { to: '/dashboard/menu', icon: Plus, label: 'Add Food', color: 'bg-primary/10 text-primary' },
            { to: '/dashboard/inventory', icon: Package, label: 'Update Stock', color: 'bg-success/10 text-success' },
            { to: '/dashboard/orders', icon: Eye, label: 'View Orders', color: 'bg-info/10 text-info' },
            { to: '/dashboard/payments', icon: CreditCard, label: 'Payments', color: 'bg-warning/10 text-warning' },
          ].map(action => (
            <Link
              key={action.label}
              to={action.to}
              className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
