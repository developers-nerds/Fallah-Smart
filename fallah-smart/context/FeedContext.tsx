import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockFeed } from '../screens/Stock/types';
import { stockFeedApi } from '../services/api';
import { useAuth } from './AuthContext';

interface FeedContextType {
  feed: StockFeed[];
  loading: boolean;
  error: string | null;
  fetchFeed: () => Promise<void>;
  addFeed: (feed: Omit<StockFeed, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFeed: (id: string, feed: Partial<StockFeed>) => Promise<void>;
  deleteFeed: (id: string) => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feed, setFeed] = useState<StockFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stockFeedApi.getAllFeed();
      setFeed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFeed = useCallback(async (feed: Omit<StockFeed, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newFeed = await stockFeedApi.createFeed({
        ...feed,
        userId: user.id.toString(),
      });
      setFeed(prev => [...prev, newFeed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateFeed = useCallback(async (id: string, feed: Partial<StockFeed>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedFeed = await stockFeedApi.updateFeed(id, feed);
      setFeed(prev => prev.map(f => f.id === id ? updatedFeed : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFeed = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockFeedApi.deleteFeed(id);
      setFeed(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FeedContext.Provider
      value={{
        feed,
        loading,
        error,
        fetchFeed,
        addFeed,
        updateFeed,
        deleteFeed,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
}; 