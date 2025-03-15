import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import type { EquipmentType, EquipmentStatus, OperationalStatus } from '../screens/Stock/Equipment/constants';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  operationalStatus: OperationalStatus;
  quantity: number;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceInterval?: number;
  maintenanceSchedule?: any;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  yearOfManufacture?: number;
  purchasePrice?: number;
  currentValue?: number;
  depreciationRate?: number;
  fuelType?: string;
  fuelCapacity?: number;
  fuelEfficiency?: number;
  powerOutput?: string;
  dimensions?: string;
  weight?: number;
  location?: string;
  assignedOperator?: string;
  operatingHours?: number;
  lastOperationDate?: string;
  insuranceInfo?: any;
  registrationNumber?: string;
  certifications?: any;
  maintenanceHistory?: any[];
  partsInventory?: any;
  operatingCost?: number;
  maintenanceCosts?: number;
  notes?: string;
  operatingInstructions?: string;
  safetyGuidelines?: string;
  updatedAt: string;
}

interface EquipmentContextType {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  fetchEquipment: () => Promise<void>;
  addEquipment: (equipment: Partial<Equipment>) => Promise<void>;
  updateEquipment: (id: string, equipment: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  recordMaintenance: (id: string, maintenanceData: any) => Promise<void>;
  updateStatus: (id: string, status: EquipmentStatus) => Promise<void>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
};

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment`;

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await axios.get(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        }
      });
      
      setEquipment(response.data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEquipment = useCallback(async (newEquipment: Partial<Equipment>) => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await axios.post(API_URL, newEquipment, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        }
      });
      
      setEquipment(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error adding equipment:', err);
      throw new Error('Failed to add equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEquipment = useCallback(async (id: string, updatedEquipment: Partial<Equipment>) => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await axios.put(`${API_URL}/${id}`, updatedEquipment, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        }
      });
      
      setEquipment(prev => prev.map(item => item.id === id ? response.data : item));
    } catch (err) {
      console.error('Error updating equipment:', err);
      throw new Error('Failed to update equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        }
      });
      
      setEquipment(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting equipment:', err);
      throw new Error('Failed to delete equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordMaintenance = useCallback(async (id: string, maintenanceData: any) => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await axios.post(`${API_URL}/${id}/maintenance`, maintenanceData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        }
      });
      
      setEquipment(prev => prev.map(item => item.id === id ? response.data : item));
    } catch (err) {
      console.error('Error recording maintenance:', err);
      throw new Error('Failed to record maintenance');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: EquipmentStatus) => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        }
      });
      
      setEquipment(prev => prev.map(item => item.id === id ? response.data : item));
    } catch (err) {
      console.error('Error updating equipment status:', err);
      throw new Error('Failed to update equipment status');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    equipment,
    loading,
    error,
    fetchEquipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    recordMaintenance,
    updateStatus
  };

  return (
    <EquipmentContext.Provider value={value}>
      {children}
    </EquipmentContext.Provider>
  );
}; 