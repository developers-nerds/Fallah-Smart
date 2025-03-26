import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockHarvest } from '../screens/Stock/types';
import { harvestApi } from '../services/api';
import { useAuth } from './AuthContext';

interface HarvestContextType {
  harvests: StockHarvest[];
  loading: boolean;
  error: string | null;
  fetchHarvests: () => Promise<void>;
  addHarvest: (harvest: Partial<StockHarvest>) => Promise<StockHarvest>;
  updateHarvest: (id: string, harvest: Partial<StockHarvest>) => Promise<StockHarvest>;
  deleteHarvest: (id: string) => Promise<void>;
  updateHarvestQuantity: (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => Promise<StockHarvest>;
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
      console.log('Fetching harvests with user:', user);
      
      const data = await harvestApi.getAllHarvests();
      console.log('Harvests fetched:', data.length);
      setHarvests(data);
    } catch (err: any) {
      console.error('Error fetching harvests:', err);
      setError(err.message || 'Failed to fetch harvests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addHarvest = useCallback(async (harvest: Partial<StockHarvest>): Promise<StockHarvest> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);
      
      // Ensure userId is properly set
      const harvestData = {
        ...harvest,
        userId: user.id
      };
      
      console.log('Adding harvest:', harvestData);
      const newHarvest = await harvestApi.createHarvest(harvestData);
      console.log('Harvest added successfully:', newHarvest);
      
      setHarvests(prev => [...prev, newHarvest]);
      return newHarvest;
    } catch (err: any) {
      console.error('Error adding harvest:', err);
      setError(err.message || 'Failed to add harvest');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateHarvest = useCallback(async (id: string, harvest: Partial<StockHarvest>): Promise<StockHarvest> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Updating harvest:', id, harvest);
      const updatedHarvest = await harvestApi.updateHarvest(id, harvest);
      console.log('Harvest updated successfully:', updatedHarvest);
      
      setHarvests(prev => prev.map(h => h.id === id ? updatedHarvest : h));
      return updatedHarvest;
    } catch (err: any) {
      console.error('Error updating harvest:', err);
      setError(err.message || 'Failed to update harvest');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteHarvest = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Deleting harvest:', id);
      await harvestApi.deleteHarvest(id);
      console.log('Harvest deleted successfully');
      
      setHarvests(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Error deleting harvest:', err);
      setError(err.message || 'Failed to delete harvest');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHarvestQuantity = useCallback(async (
    id: string, 
    data: { quantity: number; type: 'add' | 'remove'; notes?: string }
  ): Promise<StockHarvest> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Updating harvest quantity:', id, data);
      const updatedHarvest = await harvestApi.updateHarvestQuantity(id, data);
      console.log('Harvest quantity updated successfully:', updatedHarvest);
      
      setHarvests(prev => prev.map(h => h.id === id ? updatedHarvest : h));
      return updatedHarvest;
    } catch (err: any) {
      console.error('Error updating harvest quantity:', err);
      setError(err.message || 'Failed to update harvest quantity');
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
        updateHarvestQuantity
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