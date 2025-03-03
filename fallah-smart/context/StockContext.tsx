import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StockItem, StockHistory, Animal } from '../screens/Stock/types';
import { stockApi, animalApi } from '../services/api';

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
  createAnimal: (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAnimal: (id: string, animal: Partial<Animal>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  addAnimalQuantity: (id: string, quantity: number) => Promise<void>;
  removeAnimalQuantity: (id: string, quantity: number) => Promise<void>;
  refreshStocks: () => Promise<void>;
  refreshAnimals: () => Promise<void>;
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
      // Validation des champs obligatoires
      if (!stock.name || !stock.category || !stock.unit || !stock.lowStockThreshold) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }

      if (stock.quantity < 0) {
        throw new Error('La quantité ne peut pas être négative');
      }

      if (stock.lowStockThreshold < 0) {
        throw new Error('Le seuil de stock bas ne peut pas être négatif');
      }

      setLoading(true);
      setError(null);

      // Ajouter des valeurs par défaut
      const newStock = {
        ...stock,
        quantity: stock.quantity || 0,
        stockHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const createdStock = await stockApi.createStock(newStock);
      setStocks(prev => [...prev, createdStock]);
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

  const refreshAnimals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await animalApi.getAllAnimals();
      setAnimals(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch animals';
      setError(errorMessage);
      console.error('Error refreshing animals:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAnimal = async (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);

      if (!animal.type || !animal.count) {
        throw new Error('Le type et le nombre d\'animaux sont requis');
      }

      const createdAnimal = await animalApi.createAnimal(animal);
      setAnimals(prev => [...prev, createdAnimal]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create animal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAnimal = async (id: string, animal: Partial<Animal>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAnimal = await animalApi.updateAnimal(id, animal);
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update animal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAnimal = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await animalApi.deleteAnimal(id);
      setAnimals(prev => prev.filter(animal => animal.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete animal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addAnimalQuantity = async (id: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const animal = animals.find(a => a.id === id);
      if (!animal) throw new Error('Animal not found');

      const updatedAnimal = await animalApi.updateAnimal(id, {
        count: animal.count + quantity
      });
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update animal quantity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeAnimalQuantity = async (id: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const animal = animals.find(a => a.id === id);
      if (!animal) throw new Error('Animal not found');

      const newCount = Math.max(0, animal.count - quantity);
      const updatedAnimal = await animalApi.updateAnimal(id, {
        count: newCount
      });
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update animal quantity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
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
    refreshAnimals();
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
        createAnimal,
        updateAnimal,
        deleteAnimal,
        addAnimalQuantity,
        removeAnimalQuantity,
        refreshStocks,
        refreshAnimals,
        fetchStockHistory,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}; 