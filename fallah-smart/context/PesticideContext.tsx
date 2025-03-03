import React, { createContext, useContext, useState, useCallback } from 'react';
import { Pesticide, pesticideService } from '../services/pesticideService';

interface PesticideContextType {
  pesticides: Pesticide[];
  loading: boolean;
  error: string | null;
  refreshPesticides: () => Promise<void>;
  addPesticideQuantity: (id: number, quantity: number, notes?: string) => Promise<void>;
  removePesticideQuantity: (id: number, quantity: number, notes?: string) => Promise<void>;
  createPesticide: (pesticide: Omit<Pesticide, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updatePesticide: (id: number, pesticide: Partial<Pesticide>) => Promise<void>;
  deletePesticide: (id: number) => Promise<void>;
}

const PesticideContext = createContext<PesticideContextType | undefined>(undefined);

export const PesticideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pesticides, setPesticides] = useState<Pesticide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPesticides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pesticideService.getAllPesticides();
      setPesticides(data);
    } catch (err) {
      setError('Failed to fetch pesticides');
      console.error('Error fetching pesticides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPesticideQuantity = useCallback(async (id: number, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideService.updatePesticideQuantity(id, quantity, 'add');
      await refreshPesticides();
    } catch (err) {
      setError('Failed to add quantity');
      console.error('Error adding quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPesticides]);

  const removePesticideQuantity = useCallback(async (id: number, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideService.updatePesticideQuantity(id, quantity, 'remove');
      await refreshPesticides();
    } catch (err) {
      setError('Failed to remove quantity');
      console.error('Error removing quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPesticides]);

  const createPesticide = useCallback(async (pesticide: Omit<Pesticide, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideService.createPesticide(pesticide);
      await refreshPesticides();
    } catch (err) {
      setError('Failed to create pesticide');
      console.error('Error creating pesticide:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPesticides]);

  const updatePesticide = useCallback(async (id: number, pesticide: Partial<Pesticide>) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideService.updatePesticide(id, pesticide);
      await refreshPesticides();
    } catch (err) {
      setError('Failed to update pesticide');
      console.error('Error updating pesticide:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPesticides]);

  const deletePesticide = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideService.deletePesticide(id);
      await refreshPesticides();
    } catch (err) {
      setError('Failed to delete pesticide');
      console.error('Error deleting pesticide:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPesticides]);

  React.useEffect(() => {
    refreshPesticides();
  }, [refreshPesticides]);

  const value = {
    pesticides,
    loading,
    error,
    refreshPesticides,
    addPesticideQuantity,
    removePesticideQuantity,
    createPesticide,
    updatePesticide,
    deletePesticide,
  };

  return (
    <PesticideContext.Provider value={value}>
      {children}
    </PesticideContext.Provider>
  );
};

export const usePesticide = () => {
  const context = useContext(PesticideContext);
  if (context === undefined) {
    throw new Error('usePesticide must be used within a PesticideProvider');
  }
  return context;
};