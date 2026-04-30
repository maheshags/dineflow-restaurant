import API_BASE_URL from './api';

export interface FoodItemResponse {
  _id: string;
  name: string;
  price: number;
  category: string | { _id: string; name: string };
  description: string;
  stock: number;
  image?: string;
  availability: boolean;
  rating?: number;
  averageRating?: number;
  totalRatings?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodItemRequest {
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  image?: string;
  availability: boolean;
}

const getDataArray = (data: any) => {
  if (Array.isArray(data)) return data;
  return data?.data || data?.foods || [];
};

const getDataObject = (data: any) => data?.data || data?.food || data;

// Transform backend response to frontend format
export const transformFood = (food: FoodItemResponse) => {
  // Handle category - it could be a string or an object
  let categoryName = '';
  let categoryId = '';
  
  if (typeof food.category === 'string') {
    categoryName = food.category;
    categoryId = `cat-${food.category.toLowerCase()}`;
  } else if (food.category && typeof food.category === 'object') {
    categoryName = (food.category as any).name || '';
    categoryId = (food.category as any)._id || `cat-${categoryName.toLowerCase()}`;
  }

  return {
    id: food._id,
    name: food.name,
    price: food.price,
    category: categoryName,
    categoryId: categoryId,
    description: food.description || '',
    stock: food.stock,
    image: food.image || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(food.name),
    availability: food.availability !== false,
    bestseller: false,
    rating: food.averageRating ?? food.rating ?? 4.0,
    totalOrders: food.totalRatings || 0,
    createdAt: food.createdAt || new Date().toISOString(),
  };
};

// Transform frontend data to backend format
export const transformFoodToBackend = (food: any): FoodItemRequest => ({
  name: food.name,
  price: Number(food.price),
  category: food.categoryId || food.category,
  description: food.description,
  stock: Number(food.stock),
  image: food.image,
  availability: food.availability,
});

export const foodsService = {
  // Get all foods
  async getFoods(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/foods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch foods: ${response.statusText}`);
      }

      const data = await response.json();
      const foods = getDataArray(data);
      
      return foods.map(transformFood);
    } catch (error) {
      console.error('Error fetching foods:', error);
      throw error;
    }
  },

  // Add new food
  async addFood(foodData: any): Promise<any> {
    try {
      const payload = transformFoodToBackend(foodData);

      const response = await fetch(`${API_BASE_URL}/admin/foods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add food');
      }

      const data = await response.json();
      return transformFood(getDataObject(data));
    } catch (error) {
      console.error('Error adding food:', error);
      throw error;
    }
  },

  // Update food
  async updateFood(id: string, foodData: any): Promise<any> {
    try {
      const payload = transformFoodToBackend(foodData);

      const response = await fetch(`${API_BASE_URL}/admin/foods/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update food');
      }

      const data = await response.json();
      return transformFood(getDataObject(data));
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  },

  // Delete food
  async deleteFood(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/foods/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete food');
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      throw error;
    }
  },

  // Get all categories
  async getCategories(): Promise<Array<{ _id: string; name: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/foods/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Backend returns array of category IDs/names
      // Transform to format expected by frontend
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};

export default foodsService;
