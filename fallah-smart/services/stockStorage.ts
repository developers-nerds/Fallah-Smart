import AsyncStorage from '@react-native-async-storage/async-storage';
import { StockItem } from '../screens/Stock/types';

const STOCK_STORAGE_KEY = '@fallah_smart_stocks';

export const stockStorage = {
  async saveStocks(stocks: StockItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
    } catch (error) {
      console.error('Error saving stocks:', error);
    }
  },

  async loadStocks(): Promise<StockItem[]> {
    try {
      const stocksJson = await AsyncStorage.getItem(STOCK_STORAGE_KEY);
      return stocksJson ? JSON.parse(stocksJson) : [];
    } catch (error) {
      console.error('Error loading stocks:', error);
      return [];
    }
  }
}; 