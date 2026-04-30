import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { StatCard } from '@/components/shared/StatCard';
import { DollarSign, ShoppingCart, TrendingUp, Users, Star, Package, Loader } from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import analyticsService from '@/services/analytics';
import type { RevenueData, TopFood, CategoryData, AnalyticsSummary } from '@/services/analytics';

export const Route = createFileRoute('/dashboard/analytics')({
  component: AnalyticsPage,
});

const COLORS = ['var(--primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--destructive)'];

function AnalyticsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPI Card Data
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageRating: 0,
    topFood: '',
  });

  // Chart Data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topFoods, setTopFoods] = useState<TopFood[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  // Fetch analytics data on mount and when period changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, revenueData, topFoodsData, categoriesData] = await Promise.all([
        analyticsService.getAnalyticsSummary(),
        analyticsService.getRevenueAnalytics(period),
        analyticsService.getTopFoods(5),
        analyticsService.getCategoryAnalytics(),
      ]);

      setSummary(summaryData);
      setRevenueData(revenueData);
      setTopFoods(topFoodsData);
      setCategoryData(categoriesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(message);
      toast.error(message);

      // FALLBACK: Use mock data
      console.warn('Using mock analytics data due to API error');
      setRevenueData(analyticsService.generateMockRevenueData(period));
      setSummary({
        totalRevenue: 37000,
        totalOrders: 35,
        totalCustomers: 8,
        averageRating: 4.2,
        topFood: 'Chicken Biryani',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNavbar title="Analytics" subtitle="Business insights" />
      <div className="p-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <button onClick={fetchAnalyticsData} className="text-sm font-medium text-destructive hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Revenue" 
                value={`₹${summary.totalRevenue.toLocaleString()}`} 
                icon={DollarSign} 
                change="+18% from last month" 
                trend="up" 
                variant="primary" 
              />
              <StatCard 
                title="Total Orders" 
                value={summary.totalOrders} 
                icon={ShoppingCart} 
                change="+12%" 
                trend="up" 
              />
              <StatCard 
                title="Total Customers" 
                value={summary.totalCustomers} 
                icon={Users} 
                change="+5 this month" 
                trend="up" 
                variant="success" 
              />
              <StatCard 
                title="Avg Rating" 
                value={summary.averageRating} 
                icon={Star} 
                variant="warning" 
              />
            </div>

            {/* Period Toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)} 
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-display font-semibold text-foreground mb-4">Revenue Analytics</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#aGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Order Volume */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-display font-semibold text-foreground mb-4">Order Volume</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                    <Bar dataKey="orders" fill="var(--success)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Selling */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-display font-semibold text-foreground mb-4">Top Selling Items</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topFoods} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={100} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                    <Bar dataKey="totalOrders" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-display font-semibold text-foreground mb-4">Category Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {categoryData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
