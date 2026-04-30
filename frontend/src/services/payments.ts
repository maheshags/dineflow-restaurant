import { apiGet, apiPut } from './api';
import type { PaymentSettings } from '@/lib/types';

const ENDPOINT = '/payments/settings';

const paymentsService = {
  /** Fetch the current payment settings from the backend. */
  async getSettings(): Promise<PaymentSettings> {
    const response = await apiGet(ENDPOINT);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to fetch payment settings');
    }

    const data = await response.json();
    // Backend returns { success: true, settings: { ... } }
    return (data.settings ?? data) as PaymentSettings;
  },

  /** Save (upsert) payment settings to the backend. */
  async updateSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const response = await apiPut(ENDPOINT, settings);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to save payment settings');
    }

    const data = await response.json();
    return (data.settings ?? data) as PaymentSettings;
  },
};

export default paymentsService;
