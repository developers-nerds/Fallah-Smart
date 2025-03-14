import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockHarvest } from '../screens/Stock/types';
import { stockHarvestApi } from '../services/api';
import { useAuth } from './AuthContext';

interface HarvestContextType {
  harvests: StockHarvest[];
  loading: boolean;
  error: string | null;
  fetchHarvests: () => Promise<void>;
  addHarvest: (harvest: Omit<StockHarvest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHarvest: (id: string, harvest: Partial<StockHarvest>) => Promise<void>;
  deleteHarvest: (id: string) => Promise<void>;
}

const HarvestContext = createContext<HarvestContextType | undefined>(undefined);

export const HarvestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [harvests, setHarvests] = useState<StockHarvest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchHarvests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stockHarvestApi.getAllHarvests();
      setHarvests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch harvests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addHarvest = useCallback(async (harvest: Omit<StockHarvest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newHarvest = await stockHarvestApi.createHarvest({
        ...harvest,
        userId: user.id.toString(),
      });
      setHarvests(prev => [...prev, newHarvest]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add harvest');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateHarvest = useCallback(async (id: string, harvest: Partial<StockHarvest>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedHarvest = await stockHarvestApi.updateHarvest(id, harvest);
      setHarvests(prev => prev.map(h => h.id === id ? updatedHarvest : h));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update harvest');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteHarvest = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockHarvestApi.deleteHarvest(id);
      setHarvests(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete harvest');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <HarvestContext.Provider
      value={{
        harvests,
        loading,
        error,
        fetchHarvests,
        addHarvest,
        updateHarvest,
        deleteHarvest,
      }}
    >
      {children}
    </HarvestContext.Provider>
  );
};

export const useHarvest = () => {
  const context = useContext(HarvestContext);
  if (context === undefined) {
    throw new Error('useHarvest must be used within a HarvestProvider');
  }
  return context;
}; 