import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockEquipment } from '../screens/Stock/types';
import { stockEquipmentApi } from '../services/api';
import { useAuth } from './AuthContext';

interface EquipmentContextType {
  equipment: StockEquipment[];
  loading: boolean;
  error: string | null;
  fetchEquipment: () => Promise<void>;
  addEquipment: (equipment: Omit<StockEquipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEquipment: (id: string, equipment: Partial<StockEquipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<StockEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEquipment = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stockEquipmentApi.getAllEquipment();
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addEquipment = useCallback(async (equipment: Omit<StockEquipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newEquipment = await stockEquipmentApi.createEquipment({
        ...equipment,
        userId: user.id.toString(),
      });
      setEquipment(prev => [...prev, newEquipment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add equipment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateEquipment = useCallback(async (id: string, equipment: Partial<StockEquipment>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEquipment = await stockEquipmentApi.updateEquipment(id, equipment);
      setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update equipment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockEquipmentApi.deleteEquipment(id);
      setEquipment(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete equipment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <EquipmentContext.Provider
      value={{
        equipment,
        loading,
        error,
        fetchEquipment,
        addEquipment,
        updateEquipment,
        deleteEquipment,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (context === undefined) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
}; 