import { api } from './api';

export interface Pesticide {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  isNatural: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export const pesticideService = {
  async getAllPesticides(): Promise<Pesticide[]> {
    const response = await api.get('/pesticides');
    return response.data;
  },

  async getPesticideById(id: number): Promise<Pesticide> {
    const response = await api.get(`/pesticides/${id}`);
    return response.data;
  },

  async createPesticide(pesticide: Omit<Pesticide, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Pesticide> {
    const response = await api.post('/pesticides', pesticide);
    return response.data;
  },

  async updatePesticide(id: number, pesticide: Partial<Pesticide>): Promise<Pesticide> {
    const response = await api.put(`/pesticides/${id}`, pesticide);
    return response.data;
  },

  async deletePesticide(id: number): Promise<void> {
    await api.delete(`/pesticides/${id}`);
  },

  async updatePesticideQuantity(id: number, quantity: number, type: 'add' | 'remove'): Promise<Pesticide> {
    const response = await api.patch(`/pesticides/${id}/quantity`, { quantity, type });
    return response.data;
  }
}; 