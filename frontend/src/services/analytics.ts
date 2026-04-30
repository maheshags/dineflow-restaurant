import API_BASE_URL from './api';

export interface RevenueData {
  name: string;
  revenue: number;
  orders: number;
}

export interface TopFood {
  id: string;
  name: string;
  totalOrders: number;
  totalRevenue?: number;
}

export interface CategoryData {
  _id: string;
  name: string;
  value: number;
}

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  preparingOrders: number;
  readyOrders: number;
  cancelledOrders: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageRating: number;
  topFood: string;
}

export const analyticsService = {
  /**
   * Get revenue analytics by period (daily/weekly/monthly)
   */
  async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RevenueData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/revenue?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch revenue analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  },

  /**
   * Get order analytics and order status breakdown
   */
  async getOrderAnalytics(): Promise<OrderStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      throw error;
    }
  },

  /**
   * Get top selling food items
   */
  async getTopFoods(limit: number = 5): Promise<TopFood[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/top-foods?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch top foods: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching top foods:', error);
      throw error;
    }
  },

  /**
   * Get category distribution analytics
   */
  async getCategoryAnalytics(): Promise<CategoryData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch category analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching category analytics:', error);
      throw error;
    }
  },

  /**
   * Get overall analytics summary (KPI cards)
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  /**
   * FALLBACK: Generate mock revenue data
   * Used when backend is unavailable
   */
  generateMockRevenueData(period: 'daily' | 'weekly' | 'monthly' = 'daily'): RevenueData[] {
    if (period === 'daily') {
      return [
        { name: 'Mon', revenue: 4200, orders: 28 },
        { name: 'Tue', revenue: 5100, orders: 34 },
        { name: 'Wed', revenue: 4800, orders: 31 },
        { name: 'Thu', revenue: 6200, orders: 42 },
        { name: 'Fri', revenue: 7800, orders: 52 },
        { name: 'Sat', revenue: 9200, orders: 61 },
        { name: 'Sun', revenue: 8500, orders: 56 },
      ];
    } else if (period === 'monthly') {
      return [
        { name: 'Jan', revenue: 125000, orders: 320 },
        { name: 'Feb', revenue: 148000, orders: 380 },
        { name: 'Mar', revenue: 162000, orders: 420 },
      ];
    }
    return [];
  },
};

export default analyticsService;
