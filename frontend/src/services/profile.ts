import { apiGet, apiPut } from './api';
import type { RestaurantProfile } from '@/lib/types';

const PROFILE_ENDPOINT = '/profile';

const profileService = {
  /** Fetch the current restaurant profile. */
  async getProfile(): Promise<RestaurantProfile> {
    const response = await apiGet(PROFILE_ENDPOINT);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to fetch profile');
    }

    const data = await response.json();
    return (data.profile ?? data) as RestaurantProfile;
  },

  /** Save (upsert) the restaurant profile. */
  async updateProfile(profile: Partial<RestaurantProfile>): Promise<RestaurantProfile> {
    const response = await apiPut(PROFILE_ENDPOINT, profile);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to save profile');
    }

    const data = await response.json();
    return (data.profile ?? data) as RestaurantProfile;
  },

  /** Change the admin password. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiPut(`${PROFILE_ENDPOINT}/change-password`, {
      currentPassword,
      newPassword,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to change password');
    }
  },
};

export default profileService;
