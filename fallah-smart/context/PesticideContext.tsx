import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { pesticideApi } from '../services/api';
import { Pesticide } from '../screens/Stock/types';

interface PesticideContextType {
  pesticides: Pesticide[];
  loading: boolean;
  error: string | null;
  fetchPesticides: () => Promise<void>;
  refreshPesticides: () => Promise<void>;
  addPesticide: (pesticide: Omit<Pesticide, 'id'>) => Promise<void>;
  updatePesticide: (id: string, pesticide: Partial<Pesticide>) => Promise<void>;
  deletePesticide: (id: string) => Promise<void>;
  addPesticideQuantity: (id: string, quantity: number, notes?: string) => Promise<void>;
  removePesticideQuantity: (id: string, quantity: number, notes?: string) => Promise<void>;
}

const PesticideContext = createContext<PesticideContextType | undefined>(undefined);

export const PesticideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pesticides, setPesticides] = useState<Pesticide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const isLoadingRef = useRef(false);

  const fetchPesticides = useCallback(async () => {
    // Prevent concurrent fetches
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      const data = await pesticideApi.getAllPesticides();
      setPesticides(data);
      return data;
    } catch (err) {
      // Handle throttled requests gracefully
      if (err && typeof err === 'object' && 'throttled' in err) {
        console.log('Request throttled, using existing data');
        return pesticides; // Return existing data
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pesticides';
      setError(errorMessage);
      console.error('Error fetching pesticides:', err);
      throw err;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [pesticides]);

  // Initial fetch only on first mount
  useEffect(() => {
    if (isInitialLoad.current) {
      fetchPesticides().catch(err => {
        console.error('Failed initial pesticides fetch:', err);
      });
      isInitialLoad.current = false;
    }
  }, []);

  const addPesticide = async (pesticide: Omit<Pesticide, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const newPesticide = await pesticideApi.createPesticide(pesticide);
      setPesticides(prev => [...prev, newPesticide]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add pesticide');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePesticide = async (id: string, pesticide: Partial<Pesticide>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPesticide = await pesticideApi.updatePesticide(id, pesticide);
      setPesticides(prev => prev.map(p => p.id === id ? updatedPesticide : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pesticide');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePesticide = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideApi.deletePesticide(id);
      setPesticides(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pesticide');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addPesticideQuantity = async (id: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPesticide = await pesticideApi.updatePesticide(id, {
        quantity: (pesticides.find(p => p.id === id)?.quantity || 0) + quantity
      });
      setPesticides(prev => prev.map(p => p.id === id ? updatedPesticide : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add pesticide quantity');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePesticideQuantity = async (id: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const currentPesticide = pesticides.find(p => p.id === id);
      if (!currentPesticide) throw new Error('Pesticide not found');
      if (currentPesticide.quantity < quantity) throw new Error('Insufficient quantity');
      
      const updatedPesticide = await pesticideApi.updatePesticide(id, {
        quantity: currentPesticide.quantity - quantity
      });
      setPesticides(prev => prev.map(p => p.id === id ? updatedPesticide : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove pesticide quantity');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PesticideContext.Provider
      value={{
        pesticides,
        loading,
        error,
        fetchPesticides,
        refreshPesticides: fetchPesticides,
        addPesticide,
        updatePesticide,
        deletePesticide,
        addPesticideQuantity,
        removePesticideQuantity
      }}
    >
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