import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockFertilizer } from '../screens/Stock/types';
import { stockFertilizerApi } from '../services/api';
import { useAuth } from './AuthContext';

interface FertilizerContextType {
  fertilizers: StockFertilizer[];
  loading: boolean;
  error: string | null;
  fetchFertilizers: () => Promise<void>;
  addFertilizer: (fertilizer: Omit<StockFertilizer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFertilizer: (id: string, fertilizer: Partial<StockFertilizer>) => Promise<void>;
  deleteFertilizer: (id: string) => Promise<void>;
}

const FertilizerContext = createContext<FertilizerContextType | undefined>(undefined);

export const FertilizerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fertilizers, setFertilizers] = useState<StockFertilizer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFertilizers = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stockFertilizerApi.getAllFertilizers();
      setFertilizers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fertilizers');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFertilizer = useCallback(async (fertilizer: Omit<StockFertilizer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newFertilizer = await stockFertilizerApi.createFertilizer({
        ...fertilizer,
        userId: user.id.toString(),
      });
      setFertilizers(prev => [...prev, newFertilizer]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fertilizer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateFertilizer = useCallback(async (id: string, fertilizer: Partial<StockFertilizer>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedFertilizer = await stockFertilizerApi.updateFertilizer(id, fertilizer);
      setFertilizers(prev => prev.map(f => f.id === id ? updatedFertilizer : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fertilizer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFertilizer = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockFertilizerApi.deleteFertilizer(id);
      setFertilizers(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fertilizer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FertilizerContext.Provider
      value={{
        fertilizers,
        loading,
        error,
        fetchFertilizers,
        addFertilizer,
        updateFertilizer,
        deleteFertilizer,
      }}
    >
      {children}
    </FertilizerContext.Provider>
  );
};

export const useFertilizer = () => {
  const context = useContext(FertilizerContext);
  if (context === undefined) {
    throw new Error('useFertilizer must be used within a FertilizerProvider');
  }
  return context;
}; 