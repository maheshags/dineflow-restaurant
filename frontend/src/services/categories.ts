import API_BASE_URL from './api';

export interface CategoryResponse {
  _id: string;
  name: string;
  description: string;
  image?: string;
  status?: boolean;
  active?: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  description: string;
  image?: string;
  active?: boolean;
}

const getDataArray = (data: any) => {
  if (Array.isArray(data)) return data;
  return data?.data || data?.categories || [];
};

const getDataObject = (data: any) => data?.data || data?.category || data;

// Transform backend response to frontend format
export const transformCategory = (category: CategoryResponse): any => {
  return {
    id: category._id,
    name: category.name,
    description: category.description,
    image: category.image || '📦',
    active: category.active !== false && category.status !== false,
    itemCount: category.itemCount || 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

// Transform frontend data to backend format
export const transformCategoryToBackend = (category: any): CategoryRequest => ({
  name: category.name,
  description: category.description,
  image: category.image,
  active: category.active !== false,
});

export const categoriesService = {
  // Get all categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data = await response.json();

      const categories = getDataArray(data);

      return categories.map(transformCategory);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Add new category
  async addCategory(categoryData: any): Promise<any> {
    try {
      const payload = transformCategoryToBackend(categoryData);

      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add category');
      }

      const data = await response.json();
      return transformCategory(getDataObject(data));
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  // Update category
  async updateCategory(id: string, categoryData: any): Promise<any> {
    try {
      const payload = transformCategoryToBackend(categoryData);

      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update category');
      }

      const data = await response.json();
      return transformCategory(getDataObject(data));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};

export default categoriesService;
