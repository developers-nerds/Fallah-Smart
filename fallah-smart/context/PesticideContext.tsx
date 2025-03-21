import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { pesticideService } from '../services/pesticideService';
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
      const data = await pesticideService.getAllPesticides();
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
      const newPesticide = await pesticideService.createPesticide(pesticide);
      setPesticides(prev => [...prev, newPesticide]);
      return newPesticide;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add pesticide';
      setError(errorMessage);
      console.error('Error adding pesticide:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePesticide = async (id: string, pesticide: Partial<Pesticide>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPesticide = await pesticideService.updatePesticide(Number(id), pesticide);
      setPesticides(prev => prev.map(p => p.id === updatedPesticide.id ? updatedPesticide : p));
      return updatedPesticide;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pesticide';
      setError(errorMessage);
      console.error('Error updating pesticide:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePesticide = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await pesticideService.deletePesticide(Number(id));
      setPesticides(prev => prev.filter(p => p.id !== Number(id)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pesticide';
      setError(errorMessage);
      console.error('Error deleting pesticide:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addPesticideQuantity = async (id: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPesticide = await pesticideService.updatePesticideQuantity(Number(id), quantity, 'add');
      setPesticides(prev => prev.map(p => p.id === updatedPesticide.id ? updatedPesticide : p));
      return updatedPesticide;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add pesticide quantity';
      setError(errorMessage);
      console.error('Error adding pesticide quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePesticideQuantity = async (id: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPesticide = await pesticideService.updatePesticideQuantity(Number(id), quantity, 'remove');
      setPesticides(prev => prev.map(p => p.id === updatedPesticide.id ? updatedPesticide : p));
      return updatedPesticide;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove pesticide quantity';
      setError(errorMessage);
      console.error('Error removing pesticide quantity:', err);
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