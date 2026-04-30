import API_BASE_URL from './api';
import type { InventoryItem } from '@/lib/types';

export interface InventoryItemResponse {
  _id: string;
  foodId?: string;
  foodName: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  status?: string;
  lastUpdated?: string;
  updatedAt?: string;
}

export interface UpdateInventoryRequest {
  currentStock?: number;
  minThreshold?: number;
}

// Transform backend response to frontend format
export const transformInventoryItem = (item: InventoryItemResponse): InventoryItem => {
  const stock = item.currentStock || 0;
  const minThreshold = item.minThreshold || 10;
  
  let status: 'in-stock' | 'low-stock' | 'out-of-stock';
  if (stock === 0) {
    status = 'out-of-stock';
  } else if (stock <= minThreshold) {
    status = 'low-stock';
  } else {
    status = 'in-stock';
  }

  return {
    id: item._id,
    foodId: item.foodId || item._id,
    foodName: item.foodName,
    category: item.category,
    currentStock: stock,
    minThreshold: minThreshold,
    status: status,
    lastUpdated: item.updatedAt || item.lastUpdated || new Date().toISOString(),
  };
};

export const inventoryService = {
  /**
   * Fetch all inventory items from the backend
   */
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both array and object response
      const items = Array.isArray(data) ? data : data.inventory || [];

      return items.map(transformInventoryItem);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  /**
   * Update an inventory item with new stock and/or threshold values
   */
  async updateInventoryItem(
    id: string,
    updateData: UpdateInventoryRequest
  ): Promise<InventoryItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update inventory item');
      }

      const data = await response.json();
      return transformInventoryItem(data.inventory || data);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  /**
   * Update only the stock quantity for an inventory item
   * Tries PATCH first, falls back to PUT if not available
   */
  async updateStock(id: string, stock: number): Promise<InventoryItem> {
    try {
      let response: Response;

      try {
        // Try PATCH endpoint first
        response = await fetch(`${API_BASE_URL}/inventory/${id}/stock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
          },
          body: JSON.stringify({ stock }),
        });
      } catch {
        // Fall back to PUT if PATCH fails
        response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
          },
          body: JSON.stringify({ currentStock: stock }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }

      const data = await response.json();
      return transformInventoryItem(data.inventory || data);
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  /**
   * Get inventory items that are below the specified threshold
   */
  async getLowStockItems(threshold?: number): Promise<InventoryItem[]> {
    try {
      const query = threshold ? `?threshold=${threshold}` : '';
      const response = await fetch(`${API_BASE_URL}/inventory/low-stock${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch low stock items: ${response.statusText}`);
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.inventory || [];

      return items.map(transformInventoryItem);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },
};

export default inventoryService;
