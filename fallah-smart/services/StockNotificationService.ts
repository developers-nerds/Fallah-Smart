import notificationService, { NotificationService } from './NotificationService';
import { storage } from '../utils/storage';
import axios from 'axios';
import { stockApi, animalApi, stockPesticideApi, stockSeedApi, stockEquipmentApi, stockFeedApi, stockFertilizerApi, stockToolApi, stockHarvestApi, pesticideApi } from './api';

interface StockItem {
  id: number | string;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  expiryDate?: string;
  type: 'pesticide' | 'animal' | 'equipment' | 'feed' | 'fertilizer' | 'harvest' | 'seed' | 'tool';
  lastNotificationSent?: string;
}

interface NotificationSettings {
  lowStockAlerts?: boolean;
  expiryAlerts?: boolean;
  maintenanceAlerts?: boolean;
  vaccinationAlerts?: boolean;
  breedingAlerts?: boolean;
  automaticStockAlerts?: boolean;
}

class StockNotificationService {
  private static instance: StockNotificationService;
  private notificationService: typeof notificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private debugMode: boolean = false;
  private settings: NotificationSettings = {
    lowStockAlerts: true,
    expiryAlerts: true,
    maintenanceAlerts: true,
    vaccinationAlerts: true,
    breedingAlerts: true,
    automaticStockAlerts: true,
  };

  // Tracking variables to limit notification bursts
  private notificationCounts: Record<string, number> = {};
  private lastCategoryTimestamp: Record<string, number> = {};
  private MAX_NOTIFICATIONS_PER_CATEGORY = 2; // Maximum notifications per category in a single check
  private CATEGORY_COOLDOWN_MS = 10000; // 10 seconds cooldown between notifications of same category

  private constructor() {
    this.notificationService = notificationService;
  }

  public static getInstance(): StockNotificationService {
    if (!StockNotificationService.instance) {
      StockNotificationService.instance = new StockNotificationService();
    }
    return StockNotificationService.instance;
  }

  public async initialize() {
    try {
      console.log('Initializing stock notification service...');
      
      // Check if user is authenticated first
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.log('User not authenticated, skipping stock notification initialization');
        // Don't continue initialization until user is authenticated
        return;
      }
      
      if (this.isInitialized) {
        console.log('Stock notification service already initialized');
        return;
      }

      // Load notification settings from storage
      await this.loadSettings();

      // Start periodic stock checks only if user is authenticated
      this.startStockChecks();
      
      this.isInitialized = true;
      console.log('Stock notification service successfully initialized');
    } catch (error) {
      console.error('Failed to initialize stock notification service:', error);
      // Don't set isInitialized to true if initialization failed
    }
  }

  private async loadSettings() {
    try {
      const userSettings = await this.notificationService.getNotificationSettings();
      this.settings = { ...this.settings, ...userSettings };
      console.log('Loaded notification settings:', this.settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private startStockChecks() {
    // Only start checks if automatic alerts are enabled
    if (!this.settings.automaticStockAlerts) {
      console.log('Automatic stock alerts are disabled, not scheduling periodic checks');
      return;
    }

    // Don't start another interval if one is already running
    if (this.checkInterval) {
      console.log('Stock check interval already running');
      return;
    }

    console.log('Starting periodic stock checks...');
    
    // Run the first check after a short delay to allow the app to finish initialization
    setTimeout(() => this.checkStocks(), 3000);
    
    // Set an interval for regular checks (every 15 minutes)
    // Changed this from 10 seconds to 15 minutes for production
    this.checkInterval = setInterval(() => this.checkStocks(), 15 * 60 * 1000);
    
    console.log('Stock check interval scheduled');
  }

  private async checkStocks() {
    // If automatic alerts are disabled, don't proceed
    if (!this.settings.automaticStockAlerts) {
      console.log('[StockNotificationService] Automatic alerts disabled, skipping check');
      return;
    }
    
    console.log('[StockNotificationService] Starting stock check...');
    
    try {
      // Make sure we're authenticated before proceeding
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('[StockNotificationService] No access token available, skipping stock check');
        return;
      }

      console.log('[StockNotificationService] Access token verified, proceeding with check');

      // Check for stock with a sequential approach to avoid throttling
      // First, run a simple test to see which endpoints exist
      await this.verifyEndpointsAndCheckItems();
      
      console.log('[StockNotificationService] Stock check completed');
    } catch (error) {
      console.error('[StockNotificationService] General error in stock check:', error);
    }
  }

  private async verifyEndpointsAndCheckItems(isManualCheck = false) {
    try {
      // Skip if notifications aren't enabled
      if (!this.settings.automaticStockAlerts) {
        console.log('Automatic stock alerts are disabled. Skipping checks.');
        return;
      }
      
      // Make sure we're authenticated before proceeding
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('[StockNotificationService] No access token available, skipping stock check');
        return;
      }
      
      const endpoints = [
        { name: 'Animals', path: '/animals', check: this.checkAnimals.bind(this) },
        { name: 'Equipment', path: '/stock/equipment', check: this.checkEquipment.bind(this) },
        { name: 'Tools', path: '/stock/tools', check: this.checkTools.bind(this) },
        { name: 'Seeds', path: '/stock/seeds', check: this.checkSeeds.bind(this) },
        { name: 'Pesticides', path: '/pesticides', check: this.checkPesticides.bind(this) },
        { name: 'Feed', path: '/stock/feed', check: this.checkFeed.bind(this) },
        { name: 'Fertilizers', path: '/stock/fertilizer', check: this.checkFertilizers.bind(this) },
        { name: 'Harvests', path: '/stock/harvest', check: this.checkHarvests.bind(this) },
      ];
      
      if (this.debugMode) {
        console.log('Verifying endpoints and checking items with increased delays:');
        for (const endpoint of endpoints) {
          console.log(`  - ${endpoint.name}: ${process.env.EXPO_PUBLIC_API_URL}${endpoint.path}`);
        }
      }
      
      // Shuffle the endpoints to avoid predictable patterns which might lead to API contention
      const shuffledEndpoints = [...endpoints].sort(() => 0.5 - Math.random());
      
      // Add an initial delay to allow the app to complete startup before checking
      await this.delay(isManualCheck ? 1000 : 5000);
      
      // Check each endpoint with MUCH LARGER delays between them to avoid notification overload
      for (const endpoint of shuffledEndpoints) {
        try {
          console.log(`Starting check for ${endpoint.name}...`);
          
          // Add a delay before each check
          await this.delay(1000 + Math.random() * 2000);
          
          await endpoint.check();
          
          // Add a MUCH LARGER delay between category checks to prevent simultaneous notifications
          // 8-12 seconds in manual mode, 5-10 seconds in auto mode
          const delayMs = isManualCheck ? 8000 + Math.random() * 4000 : 5000 + Math.random() * 5000;
          console.log(`Waiting ${Math.round(delayMs/1000)} seconds before checking next category...`);
          await this.delay(delayMs);
        } catch (error) {
          console.error(`Error checking ${endpoint.name}:`, error);
          // Still wait before continuing to the next check
          await this.delay(3000);
        }
      }
      
      console.log('All category checks completed');
    } catch (error) {
      console.error('Error in verifyEndpointsAndCheckItems:', error);
    }
  }

  // Helper method to execute API calls with throttling handling
  private async safeApiCall<T>(apiCall: () => Promise<T>, fallbackValue: T, operationName: string): Promise<T> {
    try {
      return await apiCall();
    } catch (error: any) {
      // Special handling for throttled responses with cached data
      if (error.throttled && error.cachedData) {
        console.log(`Request throttled for ${operationName}, using cached data`);
        return error.cachedData;
      }
      
      console.error(`Error in ${operationName}:`, error);
      return fallbackValue;
    }
  }

  private async checkPesticides() {
    try {
      console.log('Checking pesticides...');
      let pesticidesData = await this.safeApiCall(
        () => stockPesticideApi.getPesticides(), 
        [],
        'pesticides fetch'
      );
      
      // Try fallback endpoint if needed
      if (!pesticidesData || !Array.isArray(pesticidesData) || pesticidesData.length === 0) {
        console.log('No pesticides found from primary endpoint, trying fallback...');
        
        pesticidesData = await this.safeApiCall(
          () => pesticideApi.getAllPesticides(),
          [],
          'pesticides fallback fetch'
        );
        
        // Map the response to match expected format if needed
        if (pesticidesData && Array.isArray(pesticidesData)) {
          pesticidesData = pesticidesData.map(p => ({
            id: p.id,
            name: p.name || 'Unknown pesticide',
            quantity: p.quantity || 0,
            minQuantityAlert: p.minQuantityAlert || 0,
            expiryDate: p.expiryDate
          }));
        }
      }
      
      if (!pesticidesData || !Array.isArray(pesticidesData)) {
        console.log('No pesticides found or invalid data');
        return;
      }
      
      console.log(`Found ${pesticidesData.length} pesticides`);
      
      // Limit the number of notifications
      const maxItemsToProcess = Math.min(2, pesticidesData.length);
      console.log(`Will process ${maxItemsToProcess} pesticides to avoid overloading notifications`);
      
      for (let i = 0; i < maxItemsToProcess; i++) {
        const pesticide = pesticidesData[i];
        try {
          const stockItem: StockItem = {
            id: pesticide.id,
            name: pesticide.name,
            currentQuantity: pesticide.quantity,
            minimumQuantity: pesticide.minQuantityAlert || 0,
            expiryDate: pesticide.expiryDate,
            type: 'pesticide'
          };
          
          await this.checkItem(stockItem);
        } catch (error) {
          console.error(`Error checking pesticide ${pesticide.id}:`, error);
        }
      }
      
      console.log('Pesticide check completed');
    } catch (error) {
      console.log('Could not check pesticides, skipping:', error);
    }
  }

  private async checkAnimals() {
    try {
      console.log('Checking animals...');
      
      // Use the safe API call helper
      let animals = await this.safeApiCall(
        () => animalApi.getAllAnimals(),
        [],
        'animals fetch'
      );
      
      // Try direct request if still empty
      if (!animals || !Array.isArray(animals) || animals.length === 0) {
        console.log('No animals found from API, trying direct request');
        
        try {
          const tokens = await storage.getTokens();
          if (!tokens?.access) return;
          
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/animals`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.access}`
              }
            }
          );
          
          if (response.data && Array.isArray(response.data)) {
            animals = response.data;
          }
        } catch (directError) {
          console.error('Direct animals request failed:', directError);
          return;
        }
      }
      
      if (!animals || !Array.isArray(animals)) {
        console.log('No animals found or invalid data');
        return;
      }
      
      console.log(`Found ${animals.length} animals`);
      
      // Limit processing to avoid notification overload
      const maxAnimalsToProcess = Math.min(2, animals.length);
      console.log(`Will process ${maxAnimalsToProcess} animals to avoid overloading notifications`);
      
      for (let i = 0; i < maxAnimalsToProcess; i++) {
        const animal = animals[i];
        try {
          // Add a small delay between each animal to avoid notification bursts
          if (i > 0) {
            await this.delay(1500);
          }
          
          // Check if there's a name, if not use ID or default name
          const animalName = animal.name || `حيوان ${animal.id}` || 'حيوان';
          
          // Handle animal-specific notifications (vaccination, breeding)
          if (this.settings.vaccinationAlerts && animal.nextVaccinationDate) {
            const nextVaccinationDate = new Date(animal.nextVaccinationDate);
            const now = new Date();
            const daysUntilVaccination = Math.ceil((nextVaccinationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilVaccination <= 7 && daysUntilVaccination > 0) {
              const message = `يحتاج إلى تطعيم خلال ${daysUntilVaccination} أيام`;
              await this.notificationService.scheduleAnimalAlert(animalName, message, 'vaccination');
              
              if (this.debugMode) {
                console.log(`[DEBUG] Sent vaccination alert for ${animalName}`);
              }
            }
          } else if (this.debugMode && this.settings.vaccinationAlerts) {
            console.log(`[DEBUG] No vaccination date for ${animalName}`);
          }
          
          if (this.settings.breedingAlerts && animal.breedingStatus === 'in_heat') {
            const message = 'حيوان في فترة التكاثر';
            
            // Add a slight delay before sending breeding alert
            await this.delay(1500);
            
            await this.notificationService.scheduleAnimalAlert(animalName, message, 'breeding');
            
            if (this.debugMode) {
              console.log(`[DEBUG] Sent breeding alert for ${animalName}`);
            }
          } else if (this.debugMode && this.settings.breedingAlerts) {
            console.log(`[DEBUG] Animal ${animalName} not in breeding status`);
          }
          
          // If nothing sent and in debug mode, send a test notification
          if (this.debugMode && !animal.nextVaccinationDate && animal.breedingStatus !== 'in_heat') {
            console.log(`[DEBUG] No conditions met for ${animalName}, sending test notification`);
            await this.notificationService.scheduleAnimalAlert(animalName, 'اختبار إشعار حيوان', 'other');
          }
        } catch (error) {
          console.error(`Error checking animal ${animal.id}:`, error);
        }
      }
      
      console.log('Animal check completed');
    } catch (error) {
      console.log('Could not check animals, skipping:', error);
    }
  }

  private async checkSeeds() {
    try {
      console.log('Checking seeds...');
      const seeds = await stockSeedApi.getSeeds();
      
      if (!seeds || !Array.isArray(seeds)) {
        console.log('No seeds found or invalid data');
        return;
      }
      
      console.log(`Found ${seeds.length} seeds`);
      
      for (const seed of seeds) {
        try {
          const stockItem: StockItem = {
            id: seed.id,
            name: seed.name,
            currentQuantity: seed.quantity,
            minimumQuantity: seed.minQuantityAlert,
            expiryDate: seed.expiryDate,
            type: 'seed'
          };
          
          await this.checkItem(stockItem);
        } catch (error) {
          console.error(`Error checking seed ${seed.id}:`, error);
        }
      }
      
      console.log('Seed check completed');
    } catch (error) {
      console.log('Could not check seeds, skipping:', error);
    }
  }

  private async checkEquipment() {
    try {
      console.log('Checking equipment...');
      
      // Use the safe API call helper
      const equipment = await this.safeApiCall(
        () => stockEquipmentApi.getAllEquipment(),
        [],
        'equipment fetch'
      );
      
      if (!equipment || !Array.isArray(equipment)) {
        console.log('No equipment found or invalid data');
        return;
      }
      
      console.log(`Found ${equipment.length} equipment items`);
      
      // Limit processing to avoid notification overload
      const maxItemsToProcess = Math.min(2, equipment.length);
      console.log(`Will process ${maxItemsToProcess} equipment items to avoid overloading notifications`);
      
      for (let i = 0; i < maxItemsToProcess; i++) {
        const item = equipment[i];
        try {
          // Add a small delay between each item to avoid notification bursts
          if (i > 0) {
            await this.delay(1500);
          }
          
          // Check maintenance schedule
          if (this.settings.maintenanceAlerts && item.nextMaintenanceDate) {
            const nextMaintenanceDate = new Date(item.nextMaintenanceDate);
            const now = new Date();
            const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilMaintenance <= 7 && daysUntilMaintenance > 0) {
              const message = `يحتاج إلى صيانة خلال ${daysUntilMaintenance} أيام`;
              await this.notificationService.scheduleEquipmentAlert(item.name, message, 'maintenance');
            }
          }
          
          // For testing in development
          if (this.debugMode) {
            console.log(`[DEBUG] Scheduling test notification for equipment ${item.name}`);
            await this.delay(1200);
            await this.notificationService.scheduleTestNotification();
          }
        } catch (error) {
          console.error(`Error checking equipment ${item.id}:`, error);
        }
      }
      
      console.log('Equipment check completed');
    } catch (error) {
      console.log('Could not check equipment, skipping:', error);
    }
  }

  private async checkTools() {
    try {
      console.log('Checking tools...');
      
      // Use the safe API call helper
      const tools = await this.safeApiCall(
        () => stockToolApi.getTools(),
        [],
        'tools fetch'
      );
      
      if (!tools || !Array.isArray(tools)) {
        console.log('No tools found or invalid data');
        return;
      }
      
      console.log(`Found ${tools.length} tools`);
      
      // Limit processing to avoid notification overload
      const maxItemsToProcess = Math.min(2, tools.length);
      console.log(`Will process ${maxItemsToProcess} tool items to avoid overloading notifications`);
      
      for (let i = 0; i < maxItemsToProcess; i++) {
        const tool = tools[i];
        try {
          // Add a small delay between each item to avoid notification bursts
          if (i > 0) {
            await this.delay(1500);
          }
          
          // Check maintenance schedule
          if (this.settings.maintenanceAlerts && tool.nextMaintenanceDate) {
            const nextMaintenanceDate = new Date(tool.nextMaintenanceDate);
            const now = new Date();
            const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilMaintenance <= 7 && daysUntilMaintenance > 0) {
              const message = `يحتاج إلى صيانة خلال ${daysUntilMaintenance} أيام`;
              await this.notificationService.scheduleToolAlert(tool.name, message, 'maintenance');
            }
          }
        } catch (error) {
          console.error(`Error checking tool ${tool.id}:`, error);
        }
      }
      
      console.log('Tools check completed');
    } catch (error) {
      console.log('Could not check tools, skipping:', error);
    }
  }

  private async checkFeed() {
    try {
      console.log('Checking feed...');
      let feedData = [];
      
      // Try to get feeds from the API
      try {
        feedData = await stockFeedApi.getFeeds();
        
        if (this.debugMode) {
          console.log(`[DEBUG] Successfully fetched feed from /stock/feed endpoint: ${feedData?.length || 0} items`);
        }
      } catch (error) {
        console.log('Error with feed endpoint, trying to find feeds in general stock');
        
        try {
          // Try to get from general stock
          const allStock = await stockApi.getAllStocks();
          if (allStock && Array.isArray(allStock)) {
            feedData = allStock
              .filter(item => item.category === 'feed')
              .map(item => ({
                id: item.id,
                name: item.name || 'Unknown feed',
                quantity: item.quantity || 0,
                minQuantityAlert: item.minimumQuantity || 0,
                expiryDate: item.expiryDate
              }));
              
            if (this.debugMode) {
              console.log(`[DEBUG] Successfully fetched feed from general stock: ${feedData?.length || 0} items`);
            }
          }
        } catch (innerError) {
          console.error('Both feed endpoints failed:', innerError);
        }
      }
      
      if (!feedData || !Array.isArray(feedData)) {
        console.log('No feeds found or invalid data');
        return;
      }
      
      console.log(`Found ${feedData.length} feed items`);
      
      for (const feed of feedData) {
        try {
          const stockItem: StockItem = {
            id: feed.id,
            name: feed.name,
            currentQuantity: feed.quantity,
            minimumQuantity: feed.minQuantityAlert || 0,
            expiryDate: feed.expiryDate,
            type: 'feed'
          };
          
          await this.checkItem(stockItem);
        } catch (error) {
          console.error(`Error checking feed ${feed.id}:`, error);
        }
      }
      
      console.log('Feed check completed');
    } catch (error) {
      console.log('Could not check feeds, skipping:', error);
    }
  }

  private async checkFertilizers() {
    try {
      console.log('Checking fertilizers...');
      let fertilizerData = [];
      
      // Try to get fertilizers from the API
      try {
        fertilizerData = await stockFertilizerApi.getFertilizers();
        
        if (this.debugMode) {
          console.log(`[DEBUG] Successfully fetched fertilizers from /stock/fertilizer endpoint: ${fertilizerData?.length || 0} items`);
        }
      } catch (error) {
        console.log('Error with fertilizer endpoint, trying to find fertilizers in general stock');
        
        try {
          // Try to get from general stock
          const allStock = await stockApi.getAllStocks();
          if (allStock && Array.isArray(allStock)) {
            fertilizerData = allStock
              .filter(item => item.category === 'fertilizer')
              .map(item => ({
                id: item.id,
                name: item.name || 'Unknown fertilizer',
                quantity: item.quantity || 0,
                minQuantityAlert: item.minimumQuantity || 0,
                expiryDate: item.expiryDate
              }));
              
            if (this.debugMode) {
              console.log(`[DEBUG] Successfully fetched fertilizers from general stock: ${fertilizerData?.length || 0} items`);
            }
          }
        } catch (innerError) {
          console.error('Both fertilizer endpoints failed:', innerError);
        }
      }
      
      if (!fertilizerData || !Array.isArray(fertilizerData)) {
        console.log('No fertilizers found or invalid data');
        return;
      }
      
      console.log(`Found ${fertilizerData.length} fertilizer items`);
      
      for (const fertilizer of fertilizerData) {
        try {
          const stockItem: StockItem = {
            id: fertilizer.id,
            name: fertilizer.name,
            currentQuantity: fertilizer.quantity,
            minimumQuantity: fertilizer.minQuantityAlert || 0,
            expiryDate: fertilizer.expiryDate,
            type: 'fertilizer'
          };
          
          await this.checkItem(stockItem);
        } catch (error) {
          console.error(`Error checking fertilizer ${fertilizer.id}:`, error);
        }
      }
      
      console.log('Fertilizer check completed');
    } catch (error) {
      console.log('Could not check fertilizers, skipping:', error);
    }
  }

  private async checkHarvests() {
    try {
      console.log('Checking harvests...');
      let harvestData = [];
      
      // Try to get harvests from the API
      try {
        harvestData = await stockHarvestApi.getHarvests();
        
        if (this.debugMode) {
          console.log(`[DEBUG] Successfully fetched harvests from /stock/harvest endpoint: ${harvestData?.length || 0} items`);
        }
      } catch (error) {
        console.log('Error with harvest endpoint, trying to find harvests in general stock');
        
        try {
          // Try to get from general stock
          const allStock = await stockApi.getAllStocks();
          if (allStock && Array.isArray(allStock)) {
            harvestData = allStock
              .filter(item => item.category === 'harvest')
              .map(item => ({
                id: item.id,
                name: item.name || 'Unknown harvest',
                cropName: item.name || 'Unknown crop',
                quantity: item.quantity || 0,
                expiryDate: item.expiryDate
              }));
              
            if (this.debugMode) {
              console.log(`[DEBUG] Successfully fetched harvests from general stock: ${harvestData?.length || 0} items`);
            }
          }
        } catch (innerError) {
          console.error('Both harvest endpoints failed:', innerError);
        }
      }
      
      if (!harvestData || !Array.isArray(harvestData)) {
        console.log('No harvests found or invalid data');
        return;
      }
      
      console.log(`Found ${harvestData.length} harvest items`);
      
      for (const harvest of harvestData) {
        try {
          // Check expiry dates for harvests
          if (this.settings.expiryAlerts && harvest.expiryDate) {
            const expiryDate = new Date(harvest.expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              const message = `ينتهي الصلاحية خلال ${daysUntilExpiry} أيام`;
              await this.notificationService.scheduleHarvestAlert(
                harvest.cropName || harvest.name, 
                message, 
                'expiry'
              );
            }
          }
        } catch (error) {
          console.error(`Error checking harvest ${harvest.id}:`, error);
        }
      }
      
      console.log('Harvest check completed');
    } catch (error) {
      console.log('Could not check harvests, skipping:', error);
    }
  }

  private async checkItem(item: StockItem) {
    const now = new Date();
    const lastNotification = item.lastNotificationSent ? new Date(item.lastNotificationSent) : null;
    const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

    // Debug logging
    if (this.debugMode) {
      console.log(`[DEBUG] Checking item: ${item.name}, Type: ${item.type}, Quantity: ${item.currentQuantity}, Min: ${item.minimumQuantity}`);
      
      if (item.currentQuantity <= item.minimumQuantity) {
        console.log(`[DEBUG] ⚠️ LOW STOCK DETECTED: ${item.name}`);
      }
      
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          console.log(`[DEBUG] ⚠️ EXPIRATION APPROACHING: ${item.name} (${daysUntilExpiry} days)`);
        }
      }
    }

    // Check if enough time has passed since last notification
    if (lastNotification && (now.getTime() - lastNotification.getTime() < NOTIFICATION_COOLDOWN)) {
      if (this.debugMode) {
        console.log(`[DEBUG] Skipping notification for ${item.name} due to cooldown`);
      }
      return;
    }

    // Check low stock
    if (this.settings.lowStockAlerts && item.currentQuantity <= item.minimumQuantity) {
      await this.handleLowStock(item);
    }

    // Check expiry date if applicable
    if (this.settings.expiryAlerts && item.expiryDate) {
      await this.handleExpiry(item, Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  private async handleLowStock(item: StockItem) {
    try {
      // Check notification limits for this category
      if (!this.shouldSendNotification(item.type)) {
        if (this.debugMode) {
          console.log(`[DEBUG] Skipping notification for ${item.name} due to category limits`);
        }
        return;
      }
      
      // Validate stock quantities
      if (typeof item.currentQuantity !== 'number' || typeof item.minimumQuantity !== 'number') {
        if (this.debugMode) {
          console.log(`[DEBUG] Invalid quantities for ${item.name}: Current=${item.currentQuantity}, Min=${item.minimumQuantity}`);
        }
        return;
      }
      
      // Double check the low stock condition
      if (item.currentQuantity > item.minimumQuantity) {
        if (this.debugMode) {
          console.log(`[DEBUG] Item ${item.name} is not actually low in stock (${item.currentQuantity} > ${item.minimumQuantity})`);
        }
        return;
      }
      
      const message = `الكمية الحالية (${item.currentQuantity}) أقل من الحد الأدنى (${item.minimumQuantity})`;
      
      if (this.debugMode) {
        console.log(`[DEBUG] Sending low stock alert for ${item.name} (${item.currentQuantity}/${item.minimumQuantity})`);
      }
      
      // Track this notification
      this.trackNotification(item.type);
      
      switch (item.type) {
        case 'pesticide':
          await this.notificationService.schedulePesticideAlert(item.name, message, 'low_stock');
          break;
        case 'feed':
          await this.notificationService.scheduleFeedAlert(item.name, message, 'low_stock');
          break;
        case 'fertilizer':
          await this.notificationService.scheduleFertilizerAlert(item.name, message, 'low_stock');
          break;
        case 'seed':
          await this.notificationService.scheduleSeedAlert(item.name, message, 'low_stock');
          break;
        case 'equipment':
          await this.notificationService.scheduleEquipmentAlert(item.name, message, 'other');
          break;
        case 'tool':
          await this.notificationService.scheduleToolAlert(item.name, message, 'other');
          break;
        case 'harvest':
          await this.notificationService.scheduleHarvestAlert(item.name, message, 'other');
          break;
        default:
          if (this.debugMode) {
            console.log(`[DEBUG] No specific handler for low stock of type ${item.type}`);
          }
          await this.notificationService.scheduleTestNotification();
      }

      await this.updateLastNotificationSent(item.id);
    } catch (error) {
      console.error(`Error handling low stock for ${item.name}:`, error);
    }
  }

  private async handleExpiry(item: StockItem, daysUntilExpiry: number) {
    // Check notification limits for this category
    if (!this.shouldSendNotification(item.type)) {
      if (this.debugMode) {
        console.log(`[DEBUG] Skipping expiry notification for ${item.name} due to category limits`);
      }
      return;
    }
    
    if (!item.expiryDate) {
      if (this.debugMode) {
        console.log(`[DEBUG] No expiry date for ${item.name}`);
      }
      return;
    }
    
    // Validate expiry date
    try {
      const expiryDate = new Date(item.expiryDate);
      // Check if the date is invalid
      if (isNaN(expiryDate.getTime())) {
        if (this.debugMode) {
          console.log(`[DEBUG] Invalid expiry date for ${item.name}: ${item.expiryDate}`);
        }
        return;
      }
      
      const now = new Date();
      // Recalculate days until expiry to ensure accuracy
      const recalculatedDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only proceed if the item is actually expiring soon
      if (recalculatedDays > 7 || recalculatedDays <= 0) {
        if (this.debugMode) {
          console.log(`[DEBUG] Item ${item.name} not expiring soon (${recalculatedDays} days)`);
        }
        return;
      }
      
      // Prepare the message
      const message = `ينتهي الصلاحية خلال ${recalculatedDays} أيام`;
      
      if (this.debugMode) {
        console.log(`[DEBUG] Sending expiry alert for ${item.name} (${recalculatedDays} days until expiry)`);
      }
      
      // Track this notification
      this.trackNotification(item.type);
      
      // Send type-specific notification
      switch (item.type) {
        case 'pesticide':
          await this.notificationService.schedulePesticideAlert(item.name, message, 'expiry');
          break;
        case 'feed':
          await this.notificationService.scheduleFeedAlert(item.name, message, 'expiry');
          break;
        case 'fertilizer':
          await this.notificationService.scheduleFertilizerAlert(item.name, message, 'expiry');
          break;
        case 'harvest':
          await this.notificationService.scheduleHarvestAlert(item.name, message, 'expiry');
          break;
        case 'seed':
          await this.notificationService.scheduleSeedAlert(item.name, message, 'expiry');
          break;
        default:
          if (this.debugMode) {
            console.log(`[DEBUG] No specific handler for expiry of type ${item.type}`);
          }
          await this.notificationService.scheduleTestNotification();
      }
      
      await this.updateLastNotificationSent(item.id);
    } catch (error) {
      console.error(`Error handling expiry for ${item.name}:`, error);
    }
  }

  // Helper functions to manage notification limits
  private shouldSendNotification(category: string): boolean {
    const now = Date.now();
    const lastTimestamp = this.lastCategoryTimestamp[category] || 0;
    const count = this.notificationCounts[category] || 0;
    
    // If we're within the cooldown period and already sent notifications, skip
    if (now - lastTimestamp < this.CATEGORY_COOLDOWN_MS && count > 0) {
      return false;
    }
    
    // If we've reached the maximum for this category, skip
    if (count >= this.MAX_NOTIFICATIONS_PER_CATEGORY) {
      return false;
    }
    
    // If this is a new period, reset the count
    if (now - lastTimestamp >= this.CATEGORY_COOLDOWN_MS) {
      this.notificationCounts[category] = 0;
      this.lastCategoryTimestamp[category] = now;
    }
    
    return true;
  }
  
  private trackNotification(category: string): void {
    const now = Date.now();
    // If this is a new period, reset the count
    if (now - (this.lastCategoryTimestamp[category] || 0) >= this.CATEGORY_COOLDOWN_MS) {
      this.notificationCounts[category] = 1;
      this.lastCategoryTimestamp[category] = now;
    } else {
      // Increment the count
      this.notificationCounts[category] = (this.notificationCounts[category] || 0) + 1;
    }
    
    if (this.debugMode) {
      console.log(`[DEBUG] Notification count for ${category}: ${this.notificationCounts[category]}`);
    }
  }

  private async updateLastNotificationSent(itemId: number | string) {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return;

      try {
        await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/items/${itemId}/notification-sent`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
            timeout: 5000 // 5 second timeout
          }
        );
      } catch (error: any) {
        // If endpoint doesn't exist, just log and continue
        if (error.response && error.response.status === 404) {
          console.log(`Update notification-sent endpoint not available for item ${itemId}`);
        } else {
          console.error('Error updating last notification sent:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateLastNotificationSent:', error);
    }
  }

  public async updateSettings(newSettings: NotificationSettings) {
    // Update settings
    const previousAutoAlertsEnabled = this.settings.automaticStockAlerts;
    this.settings = { ...this.settings, ...newSettings };
    
    // If automatic alerts setting changed
    if (newSettings.automaticStockAlerts !== undefined && 
        previousAutoAlertsEnabled !== newSettings.automaticStockAlerts) {
      
      // If automatic checks were off and are now on, start checks
      if (newSettings.automaticStockAlerts && !this.checkInterval) {
        console.log('Starting automatic stock checks');
        this.startStockChecks();
      }
      
      // If automatic checks were on and are now off, stop checks
      if (newSettings.automaticStockAlerts === false && this.checkInterval) {
        console.log('Stopping automatic stock checks');
        this.stopStockChecks();
      }
    }
    
    console.log('Stock notification service settings updated:', this.settings);
  }
  
  private stopStockChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Stock checks stopped');
    }
  }

  public cleanup() {
    this.stopStockChecks();
    this.isInitialized = false;
    console.log('Stock notification service cleaned up');
  }

  public async reinitializeAfterLogin() {
    console.log('Reinitializing stock notification service after login');
    this.isInitialized = false;
    await this.initialize();
  }

  public async runManualStockCheck() {
    try {
      console.log('[StockNotificationService] Starting MANUAL stock check...');
      
      // Get token for API calls
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('[StockNotificationService] No access token available for API checks');
        return;
      }
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      
      // Check each category for actual items
      const categoryItemCounts = await this.getCategoryItemCounts();
      console.log('[StockNotificationService] Category counts:', categoryItemCounts);
      
      // Only include categories that have at least one item
      const stockTypes = [
        { id: 1, type: 'pesticide', name: 'المبيدات', icon: '🧪', nameAr: 'المبيدات', priority: 'high' },
        { id: 2, type: 'feed', name: 'الأعلاف', icon: '🌾', nameAr: 'الأعلاف', priority: 'high' },
        { id: 3, type: 'fertilizer', name: 'الأسمدة', icon: '🌱', nameAr: 'الأسمدة', priority: 'medium' },
        { id: 4, type: 'seed', name: 'البذور', icon: '🌱', nameAr: 'البذور', priority: 'medium' },
        { id: 5, type: 'tool', name: 'الأدوات', icon: '🔨', nameAr: 'الأدوات', priority: 'low' },
        { id: 6, type: 'equipment', name: 'المعدات', icon: '🚜', nameAr: 'المعدات', priority: 'low' }
      ].filter(item => categoryItemCounts[item.type] > 0);
      
      if (stockTypes.length === 0) {
        console.log('[StockNotificationService] No stock categories have items, skipping notifications');
        return;
      }
      
      console.log(`[StockNotificationService] Sending notifications for ${stockTypes.length} categories with items`);
      
      // Use the improved notification spreading
      await this.spreadNotifications(stockTypes);
      
      // Run the API checks
      try {
        console.log('[StockNotificationService] Proceeding with API checks');
        await this.verifyEndpointsAndCheckItems(true);
      } catch (checkError) {
        console.error('[StockNotificationService] Error in manual API checks:', checkError);
      }
      
      console.log('[StockNotificationService] Manual stock check completed');
    } catch (error) {
      console.error('[StockNotificationService] Error in manual stock check:', error);
    }
  }
  
  // Helper method to check how many items are in each category
  private async getCategoryItemCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {
      'pesticide': 0,
      'feed': 0,
      'fertilizer': 0,
      'seed': 0,
      'tool': 0,
      'equipment': 0,
      'animal': 0,
      'harvest': 0
    };
    
    try {
      // Check pesticides
      try {
        const pesticides = await this.safeApiCall(
          () => stockPesticideApi.getPesticides(),
          [],
          'pesticides count'
        );
        counts['pesticide'] = Array.isArray(pesticides) ? pesticides.length : 0;
      } catch (e) {
        console.log('Error checking pesticide count:', e);
      }
      
      // Check feeds
      try {
        const feeds = await this.safeApiCall(
          () => stockFeedApi.getFeeds(),
          [],
          'feeds count'
        );
        counts['feed'] = Array.isArray(feeds) ? feeds.length : 0;
      } catch (e) {
        console.log('Error checking feed count:', e);
      }
      
      // Check fertilizers
      try {
        const fertilizers = await this.safeApiCall(
          () => stockFertilizerApi.getFertilizers(),
          [],
          'fertilizers count'
        );
        counts['fertilizer'] = Array.isArray(fertilizers) ? fertilizers.length : 0;
      } catch (e) {
        console.log('Error checking fertilizer count:', e);
      }
      
      // Check seeds
      try {
        const seeds = await this.safeApiCall(
          () => stockSeedApi.getSeeds(),
          [],
          'seeds count'
        );
        counts['seed'] = Array.isArray(seeds) ? seeds.length : 0;
      } catch (e) {
        console.log('Error checking seed count:', e);
      }
      
      // Check tools
      try {
        const tools = await this.safeApiCall(
          () => stockToolApi.getTools(),
          [],
          'tools count'
        );
        counts['tool'] = Array.isArray(tools) ? tools.length : 0;
      } catch (e) {
        console.log('Error checking tool count:', e);
      }
      
      // Check equipment
      try {
        const equipment = await this.safeApiCall(
          () => stockEquipmentApi.getAllEquipment(),
          [],
          'equipment count'
        );
        counts['equipment'] = Array.isArray(equipment) ? equipment.length : 0;
      } catch (e) {
        console.log('Error checking equipment count:', e);
      }
      
      return counts;
    } catch (error) {
      console.error('Error getting category counts:', error);
      return counts; // Return default zero counts on error
    }
  }

  // Helper function to introduce delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // When sending multiple notifications, spread them out with better timing
  private async spreadNotifications(stockTypes: any[]) {
    console.log('[StockNotificationService] Sending notifications with 10-second spacing...');
    
    // Send all notifications with a 10-second delay between each one
    for (let i = 0; i < stockTypes.length; i++) {
      const item = stockTypes[i];
      
      // Send the notification
      await this.sendStockNotification(item, 0);
      
      // If there are more notifications to send, wait 10 seconds
      if (i < stockTypes.length - 1) {
        console.log(`[StockNotificationService] Waiting 10 seconds before sending next notification...`);
        await this.delay(10000); // 10 seconds
      }
    }
    
    console.log('[StockNotificationService] All notifications sent with 10-second spacing');
  }

  // Helper to send a single notification with consistent styling
  private async sendStockNotification(item: any, delayMs: number) {
    try {
      // Create fake stock item for notification
      const fakeItem = {
        id: typeof item.id === 'number' ? item.id : Math.floor(Math.random() * 1000),
        name: item.name,
        nameAr: item.nameAr,
        currentQuantity: 5,
        quantity: 5,
        minimumQuantity: 10,
        type: item.type as any,
        unit: 'وحدة'
      };
      
      // Send notification with better content
      const options = { 
        screen: 'StockList', 
        params: { itemType: item.type }
      };
      
      await this.notificationService.scheduleStockNotification(
        fakeItem,
        'low',
        options
      );
      
      console.log(`[StockNotificationService] Sent notification for ${item.type}: ${item.name}`);
    } catch (error) {
      console.error(`[StockNotificationService] Error sending notification:`, error);
    }
  }
}

export default StockNotificationService; 