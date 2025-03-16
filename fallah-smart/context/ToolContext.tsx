import React, { createContext, useContext, useState, useCallback } from 'react';
import { StockTool } from '../screens/Stock/types';
import { stockToolApi } from '../services/api';
import { useAuth } from './AuthContext';

interface ToolContextType {
  tools: StockTool[];
  loading: boolean;
  error: string | null;
  fetchTools: () => Promise<void>;
  addTool: (tool: Omit<StockTool, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTool: (id: string, tool: Partial<StockTool>) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const ToolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<StockTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTools = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stockToolApi.getAllTools();
      setTools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addTool = useCallback(async (tool: Omit<StockTool, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newTool = await stockToolApi.createTool({
        ...tool,
        userId: user.id.toString(),
      });
      setTools(prev => [...prev, newTool]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tool');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateTool = useCallback(async (id: string, tool: Partial<StockTool>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTool = await stockToolApi.updateTool(id, tool);
      setTools(prev => prev.map(t => t.id === id ? updatedTool : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTool = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await stockToolApi.deleteTool(id);
      setTools(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tool');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ToolContext.Provider
      value={{
        tools,
        loading,
        error,
        fetchTools,
        addTool,
        updateTool,
        deleteTool,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
};

export const useTool = () => {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useTool must be used within a ToolProvider');
  }
  return context;
}; 