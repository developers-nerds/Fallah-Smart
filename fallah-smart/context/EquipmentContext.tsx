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
  recordMaintenance: (id: string, data: { maintenanceNotes: string; cost: number; nextMaintenanceDate?: Date }) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<StockEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEquipment = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping equipment fetch');
      return;
    }
    
    try {
      console.log('EquipmentContext: Starting to fetch equipment');
      setLoading(true);
      setError(null);
      const data = await stockEquipmentApi.getAllEquipment();
      console.log('EquipmentContext: Equipment fetched successfully, count:', data?.length || 0);
      console.log('EquipmentContext: First equipment item:', data && data.length > 0 ? JSON.stringify(data[0], null, 2) : 'No items');
      setEquipment(data || []);
    } catch (err) {
      console.error('EquipmentContext: Error fetching equipment:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
    } finally {
      setLoading(false);
      console.log('EquipmentContext: Fetch equipment completed, loading set to false');
    }
  }, [user]);

  const addEquipment = useCallback(async (equipment: Omit<StockEquipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      console.log('No user found, skipping add equipment');
      return;
    }

    try {
      console.log('EquipmentContext: Adding new equipment:', JSON.stringify(equipment, null, 2));
      setLoading(true);
      setError(null);
      const newEquipment = await stockEquipmentApi.createEquipment({
        ...equipment,
        userId: user.id.toString(),
      });
      console.log('EquipmentContext: Equipment added successfully:', JSON.stringify(newEquipment, null, 2));
      setEquipment(prev => [...prev, newEquipment]);
    } catch (err) {
      console.error('EquipmentContext: Error adding equipment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add equipment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateEquipment = useCallback(async (id: string, equipment: Partial<StockEquipment>) => {
    try {
      console.log(`EquipmentContext: Updating equipment ${id}:`, JSON.stringify(equipment, null, 2));
      setLoading(true);
      setError(null);
      const updatedEquipment = await stockEquipmentApi.updateEquipment(id, equipment);
      console.log('EquipmentContext: Equipment updated successfully:', JSON.stringify(updatedEquipment, null, 2));
      setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
    } catch (err) {
      console.error('EquipmentContext: Error updating equipment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update equipment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: string) => {
    try {
      console.log(`EquipmentContext: Deleting equipment ${id}`);
      setLoading(true);
      setError(null);
      await stockEquipmentApi.deleteEquipment(id);
      console.log('EquipmentContext: Equipment deleted successfully');
      setEquipment(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('EquipmentContext: Error deleting equipment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete equipment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordMaintenance = useCallback(async (id: string, data: { maintenanceNotes: string; cost: number; nextMaintenanceDate?: Date }) => {
    try {
      console.log(`EquipmentContext: Recording maintenance for equipment ${id}:`, JSON.stringify(data, null, 2));
      setLoading(true);
      setError(null);
      const updatedEquipment = await stockEquipmentApi.recordMaintenance(id, data);
      console.log('EquipmentContext: Maintenance recorded successfully:', JSON.stringify(updatedEquipment, null, 2));
      setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
    } catch (err) {
      console.error('EquipmentContext: Error recording maintenance:', err);
      setError(err instanceof Error ? err.message : 'Failed to record maintenance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      console.log(`EquipmentContext: Updating status for equipment ${id} to ${status}`);
      setLoading(true);
      setError(null);
      const updatedEquipment = await stockEquipmentApi.updateStatus(id, status);
      console.log('EquipmentContext: Status updated successfully:', JSON.stringify(updatedEquipment, null, 2));
      setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
    } catch (err) {
      console.error('EquipmentContext: Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
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
        recordMaintenance,
        updateStatus
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