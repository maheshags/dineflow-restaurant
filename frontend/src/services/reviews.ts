import API_BASE_URL from './api';
import type { Review } from '@/lib/types';

export interface BackendRating {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  food?: {
    _id: string;
    name: string;
  };
  rating: number;
  review?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend rating to frontend Review format
 */
export const transformRating = (rating: BackendRating): Review => {
  return {
    id: rating._id,
    customerId: rating.user?._id || 'unknown',
    customerName: rating.user?.name || 'Anonymous',
    foodId: rating.food?._id || 'unknown',
    foodName: rating.food?.name || 'Unknown Item',
    rating: rating.rating,
    text: rating.review || rating.comment || '',
    date: new Date(rating.createdAt).toISOString().split('T')[0], // Format as YYYY-MM-DD
    status: 'published' as const, // Default status from backend
  };
};

export const reviewsService = {
  /**
   * Fetch all reviews/ratings from the backend
   */
  async getReviews(): Promise<Review[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle array responses and wrapped backend responses.
      const ratings = Array.isArray(data) ? data : data.data || data.ratings || [];

      return ratings.map(transformRating);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  /**
   * Get average rating across all reviews
   */
  calculateAverageRating(reviews: Review[]): string {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = (sum / reviews.length).toFixed(1);
    return average;
  },

  /**
   * Count low-rated reviews (rating <= 2)
   */
  countLowRated(reviews: Review[]): number {
    return reviews.filter(review => review.rating <= 2).length;
  },

  /**
   * Get unique food names from reviews for filtering
   */
  getUniqueFoodNames(reviews: Review[]): string[] {
    return [...new Set(reviews.map(r => r.foodName))];
  },
};

export default reviewsService;
