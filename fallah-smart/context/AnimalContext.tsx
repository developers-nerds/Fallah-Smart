import React, { createContext, useContext, useState, useCallback } from 'react';
import { Animal } from '../screens/Stock/types';
import { animalApi } from '../services/api';
import { useAuth } from './AuthContext';

interface AnimalContextType {
  animals: Animal[];
  loading: boolean;
  error: string | null;
  fetchAnimals: () => Promise<void>;
  addAnimal: (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAnimal: (id: string, animal: Partial<Animal>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export const AnimalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnimals = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await animalApi.getAllAnimals();
      setAnimals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch animals');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addAnimal = useCallback(async (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newAnimal = await animalApi.createAnimal({
        ...animal,
        userId: user.id.toString(),
      });
      setAnimals(prev => [...prev, newAnimal]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add animal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateAnimal = useCallback(async (id: string, animal: Partial<Animal>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAnimal = await animalApi.updateAnimal(id, animal);
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update animal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnimal = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await animalApi.deleteAnimal(id);
      setAnimals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete animal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AnimalContext.Provider
      value={{
        animals,
        loading,
        error,
        fetchAnimals,
        addAnimal,
        updateAnimal,
        deleteAnimal,
      }}
    >
      {children}
    </AnimalContext.Provider>
  );
};

export const useAnimal = () => {
  const context = useContext(AnimalContext);
  if (context === undefined) {
    throw new Error('useAnimal must be used within an AnimalProvider');
  }
  return context;
}; 