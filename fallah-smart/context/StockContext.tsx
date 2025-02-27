import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StockItem, StockHistory } from '../screens/Stock/types';
import { stockApi } from '../services/api';
import { api } from '../services/api';

interface Animal {
  id: string;
  type: string;
  count: number;
  healthStatus: string;
  feedingSchedule: string;
  gender: string;
  notes: string;
}

interface StockContextType {
  stocks: StockItem[];
  loading: boolean;
  error: string | null;
  addStock: (stock: Omit<StockItem, 'id' | 'stockHistory'>) => Promise<void>;
  updateStock: (id: string, stock: Partial<StockItem>) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  addStockQuantity: (id: string, quantity: number, notes?: string) => Promise<void>;
  removeStockQuantity: (id: string, quantity: number, notes?: string) => Promise<void>;
  animals: Animal[];
  addAnimal: (animal: Omit<Animal, 'id'>) => void;
  deleteAnimal: (id: string) => void;
  addAnimalQuantity: (id: string, quantity: number) => void;
  removeAnimalQuantity: (id: string, quantity: number) => void;
  refreshStocks: () => Promise<void>;
  fetchStockHistory: (stockId: string) => Promise<StockHistory[]>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const useStock = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stockApi.getAllStocks();
      setStocks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stocks';
      setError(errorMessage);
      console.error('Error refreshing stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (stock: Omit<StockItem, 'id' | 'stockHistory'>) => {
    try {
      setLoading(true);
      setError(null);
      await stockApi.createStock(stock);
      await refreshStocks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add stock';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: string, stock: Partial<StockItem>) => {
    try {
      setLoading(true);
      setError(null);
      await stockApi.updateStock(id, stock);
      await refreshStocks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stock';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStock = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockApi.deleteStock(id);
      await refreshStocks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete stock';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addStockQuantity = useCallback(async (id: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedStock = await stockApi.updateStockQuantity(id, {
        quantity,
        type: 'add',
        notes
      });
      setStocks(prev => prev.map(stock => 
        stock.id === id ? updatedStock : stock
      ));
    } catch (err) {
      setError('Failed to add stock quantity');
      console.error('Error adding stock quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeStockQuantity = useCallback(async (id: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedStock = await stockApi.updateStockQuantity(id, {
        quantity,
        type: 'remove',
        notes
      });
      setStocks(prev => prev.map(stock => 
        stock.id === id ? updatedStock : stock
      ));
    } catch (err) {
      setError('Failed to remove stock quantity');
      console.error('Error removing stock quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addAnimal = (animal: Omit<Animal, 'id'>) => {
    const newAnimal = {
      ...animal,
      id: Date.now().toString(),
    };
    setAnimals(prev => [...prev, newAnimal]);
  };

  const deleteAnimal = (id: string) => {
    setAnimals(prev => prev.filter(animal => animal.id !== id));
  };

  const addAnimalQuantity = (id: string, quantity: number) => {
    setAnimals(prev => prev.map(animal => 
      animal.id === id 
        ? { ...animal, count: animal.count + quantity }
        : animal
    ));
  };

  const removeAnimalQuantity = (id: string, quantity: number) => {
    setAnimals(prev => prev.map(animal => 
      animal.id === id 
        ? { ...animal, count: Math.max(0, animal.count - quantity) }
        : animal
    ));
  };

  const fetchStockHistory = async (stockId: string) => {
    try {
      const history = await stockApi.getStockHistory(stockId);
      return history;
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshStocks();
  }, []);

  return (
    <StockContext.Provider
      value={{
        stocks,
        loading,
        error,
        addStock,
        updateStock,
        deleteStock,
        addStockQuantity,
        removeStockQuantity,
        animals,
        addAnimal,
        deleteAnimal,
        addAnimalQuantity,
        removeAnimalQuantity,
        refreshStocks,
        fetchStockHistory,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}; 