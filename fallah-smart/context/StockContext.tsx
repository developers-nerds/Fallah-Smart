import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StockItem, StockHistory } from '../screens/Stock/types';
import { stockStorage } from '../services/stockStorage';

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
  addStock: (stock: Omit<StockItem, 'id' | 'history'>) => void;
  updateStock: (id: string, stock: Partial<StockItem>) => void;
  deleteStock: (id: string) => void;
  addStockQuantity: (id: string, quantity: number) => void;
  removeStockQuantity: (id: string, quantity: number) => void;
  animals: Animal[];
  addAnimal: (animal: Omit<Animal, 'id'>) => void;
  deleteAnimal: (id: string) => void;
  addAnimalQuantity: (id: string, quantity: number) => void;
  removeAnimalQuantity: (id: string, quantity: number) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export const StockProvider = ({ children }: { children: React.ReactNode }) => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);

  useEffect(() => {
    const loadInitialStocks = async () => {
      const savedStocks = await stockStorage.loadStocks();
      setStocks(savedStocks);
    };
    loadInitialStocks();
  }, []);

  useEffect(() => {
    stockStorage.saveStocks(stocks);
  }, [stocks]);

  const addStock = useCallback((stockData: Omit<StockItem, 'id' | 'history'>) => {
    const newStock: StockItem = {
      ...stockData,
      id: Date.now().toString(),
      history: [{
        id: Date.now().toString(),
        date: new Date(),
        quantity: stockData.quantity,
        type: 'add',
        notes: 'Stock initial'
      }]
    };
    
    setStocks(prev => [...prev, newStock]);
  }, []);

  const updateStock = useCallback((id: string, stockData: Partial<StockItem>) => {
    setStocks(prev => prev.map(stock => 
      stock.id === id ? { ...stock, ...stockData } : stock
    ));
  }, []);

  const deleteStock = useCallback((id: string) => {
    setStocks(prev => prev.filter(stock => stock.id !== id));
  }, []);

  const addStockHistory = useCallback((id: string, quantity: number, type: 'add' | 'remove') => {
    const historyEntry: StockHistory = {
      id: Date.now().toString(),
      date: new Date(),
      quantity,
      type,
    };

    setStocks(prev => prev.map(stock => 
      stock.id === id 
        ? { ...stock, history: [historyEntry, ...stock.history] }
        : stock
    ));
  }, []);

  const addStockQuantity = useCallback((id: string, quantity: number) => {
    setStocks(prev => prev.map(stock => 
      stock.id === id 
        ? { ...stock, quantity: stock.quantity + quantity }
        : stock
    ));
    addStockHistory(id, quantity, 'add');
  }, [addStockHistory]);

  const removeStockQuantity = useCallback((id: string, quantity: number) => {
    setStocks(prev => prev.map(stock => 
      stock.id === id 
        ? { ...stock, quantity: Math.max(0, stock.quantity - quantity) }
        : stock
    ));
    addStockHistory(id, quantity, 'remove');
  }, [addStockHistory]);

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

  return (
    <StockContext.Provider value={{
      stocks,
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
    }}>
      {children}
    </StockContext.Provider>
  );
}; 