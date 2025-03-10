import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockSeed } from '../screens/Stock/types';
import { stockSeedApi } from '../services/api';
import { useAuth } from './AuthContext';

interface SeedContextType {
  seeds: StockSeed[];
  loading: boolean;
  error: string | null;
  fetchSeeds: () => Promise<void>;
  addSeed: (seed: Omit<StockSeed, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSeed: (id: string, seed: Partial<StockSeed>) => Promise<void>;
  deleteSeed: (id: string) => Promise<void>;
}

const SeedContext = createContext<SeedContextType | undefined>(undefined);

export const SeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [seeds, setSeeds] = useState<StockSeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSeeds = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stockSeedApi.getAllSeeds();
      setSeeds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seeds');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addSeed = useCallback(async (seed: Omit<StockSeed, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newSeed = await stockSeedApi.createSeed({
        ...seed,
        userId: user.id.toString(),
      });
      setSeeds(prev => [...prev, newSeed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add seed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSeed = useCallback(async (id: string, seed: Partial<StockSeed>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSeed = await stockSeedApi.updateSeed(id, seed);
      setSeeds(prev => prev.map(s => s.id === id ? updatedSeed : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSeed = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockSeedApi.deleteSeed(id);
      setSeeds(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete seed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SeedContext.Provider
      value={{
        seeds,
        loading,
        error,
        fetchSeeds,
        addSeed,
        updateSeed,
        deleteSeed,
      }}
    >
      {children}
    </SeedContext.Provider>
  );
};

export const useSeed = () => {
  const context = useContext(SeedContext);
  if (context === undefined) {
    throw new Error('useSeed must be used within a SeedProvider');
  }
  return context;
}; 