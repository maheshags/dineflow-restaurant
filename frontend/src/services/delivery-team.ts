import API_BASE_URL from './api';

export interface DeliveryPersonResponse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  vehicle?: string;
  status?: 'active' | 'inactive';
  totalDeliveries?: number;
  rating?: number;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryPersonRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  vehicle?: string;
  status?: 'active' | 'inactive';
}

// Transform backend response to frontend format
export const transformDeliveryPerson = (person: DeliveryPersonResponse): any => {
  return {
    id: person._id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    password: '', // Don't expose password
    address: person.address || '',
    vehicle: person.vehicle || 'Bike',
    status: person.status || 'active',
    joinedDate: person.createdAt || new Date().toISOString().slice(0, 10),
    totalDeliveries: person.totalDeliveries || 0,
    rating: person.rating || 4.5,
  };
};

// Transform frontend data to backend format
export const transformDeliveryToBackend = (person: any): DeliveryPersonRequest => ({
  name: person.name,
  email: person.email,
  password: person.password,
  phone: person.phone,
  address: person.address,
  vehicle: person.vehicle,
  status: person.status,
});

export const deliveryTeamService = {
  // Get all delivery persons
  async getDeliveryPersons(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/delivery-team`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch delivery team: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both array and object response
      const persons = Array.isArray(data) ? data : data.data || [];

      return persons.map(transformDeliveryPerson);
    } catch (error) {
      console.error('Error fetching delivery team:', error);
      throw error;
    }
  },

  // Get single delivery person
  async getDeliveryPersonById(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/delivery-team/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch delivery person: ${response.statusText}`);
      }

      const data = await response.json();
      return transformDeliveryPerson(data.data || data);
    } catch (error) {
      console.error('Error fetching delivery person:', error);
      throw error;
    }
  },

  // Create delivery person
  async addDeliveryPerson(person: DeliveryPersonRequest): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/delivery-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(transformDeliveryToBackend(person)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create delivery person');
      }

      const data = await response.json();
      return transformDeliveryPerson(data.data || data);
    } catch (error) {
      console.error('Error creating delivery person:', error);
      throw error;
    }
  },

  // Update delivery person
  async updateDeliveryPerson(id: string, person: Partial<DeliveryPersonRequest>): Promise<any> {
    try {
      const payload: Partial<DeliveryPersonRequest> = transformDeliveryToBackend(person);
      if (!payload.password) {
        delete payload.password;
      }

      const response = await fetch(`${API_BASE_URL}/admin/delivery-team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update delivery person');
      }

      const data = await response.json();
      return transformDeliveryPerson(data.data || data);
    } catch (error) {
      console.error('Error updating delivery person:', error);
      throw error;
    }
  },

  // Delete delivery person
  async deleteDeliveryPerson(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/delivery-team/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete delivery person');
      }
    } catch (error) {
      console.error('Error deleting delivery person:', error);
      throw error;
    }
  },
};

export default deliveryTeamService;
