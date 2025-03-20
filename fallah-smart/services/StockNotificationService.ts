import NotificationService from './NotificationService';
import { storage } from '../utils/storage';
import axios from 'axios';
import { stockApi, animalApi, stockPesticideApi, stockSeedApi, stockEquipmentApi, stockFeedApi, stockFertilizerApi, stockToolApi, stockHarvestApi } from './api';

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
  private notificationService: NotificationService;
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

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  public static getInstance(): StockNotificationService {
    if (!StockNotificationService.instance) {
      StockNotificationService.instance = new StockNotificationService();
    }
    return StockNotificationService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing stock notification service...');
      
      // Check if user is authenticated first
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.log('User not authenticated, delaying stock notification initialization');
        // Don't continue initialization until user is authenticated
        return;
      }
      
      // Load settings first
      try {
        await this.loadSettings();
      } catch (error) {
        console.error('Error loading settings, using defaults:', error);
        // Continue with default settings
      }
      
      // Only start checks if automatic alerts are enabled
      if (this.settings.automaticStockAlerts) {
        this.startStockChecks();
      }
      
      this.isInitialized = true;
      console.log('Stock notification service initialized');
    } catch (error) {
      console.error('Error initializing stock notification service:', error);
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
    // Check every hour
    const CHECK_INTERVAL = 60 * 60 * 1000;

    // Initial check
    this.checkStocks();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkStocks();
    }, CHECK_INTERVAL);
  }

  private async checkStocks() {
    // If automatic alerts are disabled, don't proceed
    if (!this.settings.automaticStockAlerts) {
      return;
    }
    
    console.log('Starting stock check...');
    
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('No access token available, skipping stock check');
        return;
      }

      // Check for stock with a sequential approach to avoid throttling
      // First, run a simple test to see which endpoints exist
      await this.verifyEndpointsAndCheckItems();
      
      console.log('Stock check completed');
    } catch (error) {
      console.error('General error in stock check:', error);
    }
  }

  private async verifyEndpointsAndCheckItems() {
    // First check which endpoints are working by trying to fetch data
    const endpoints = [
      { name: 'animals', path: '/animals', check: this.checkAnimals.bind(this) },
      { name: 'equipment', path: '/stock/equipment', check: this.checkEquipment.bind(this) },
      { name: 'tools', path: '/stock/tools', check: this.checkTools.bind(this) },
      { name: 'seeds', path: '/stock/seeds', check: this.checkSeeds.bind(this) },
      { name: 'pesticides', path: '/pesticides', check: this.checkPesticides.bind(this) },
      { name: 'feed', path: '/stock/feed', check: this.checkFeed.bind(this) },
      { name: 'fertilizers', path: '/stock/fertilizer', check: this.checkFertilizers.bind(this) },
      { name: 'harvests', path: '/stock/harvest', check: this.checkHarvests.bind(this) }
    ];
    
    if (this.debugMode) {
      console.log('[DEBUG] Endpoints to be tested:');
      endpoints.forEach(endpoint => {
        console.log(`[DEBUG] - ${endpoint.name}: ${process.env.EXPO_PUBLIC_API_URL}${endpoint.path}`);
      });
    }
    
    // Run each check with a delay to prevent throttling
    for (const endpoint of endpoints) {
      try {
        console.log(`Checking ${endpoint.name}...`);
        await endpoint.check();
        
        // Add a delay between requests to avoid throttling
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error checking ${endpoint.name}:`, error);
      }
    }
  }

  private async checkPesticides() {
    try {
      console.log('Checking pesticides...');
      let pesticidesData;
      
      // Try with both endpoints to see which one works
      try {
        // First try the /pesticides endpoint (which is the correct one)
        pesticidesData = await stockPesticideApi.getPesticides();
        
        if (this.debugMode) {
          console.log(`[DEBUG] Successfully fetched pesticides from /pesticides endpoint: ${pesticidesData?.length || 0} items`);
        }
      } catch (error) {
        console.log('Error with /pesticides endpoint:', error);
        
        try {
          // If that fails, try the main pesticides endpoint
          const response = await pesticideApi.getAllPesticides();
          if (response && Array.isArray(response)) {
            pesticidesData = response.map(p => ({
              id: p.id,
              name: p.name || 'Unknown pesticide',
              quantity: p.quantity || 0,
              minQuantityAlert: p.minQuantityAlert || 0,
              expiryDate: p.expiryDate
            }));
            
            if (this.debugMode) {
              console.log(`[DEBUG] Successfully fetched pesticides from fallback endpoint: ${pesticidesData?.length || 0} items`);
            }
          }
        } catch (innerError) {
          console.error('Both pesticide endpoints failed:', innerError);
          return;
        }
      }
      
      if (!pesticidesData || !Array.isArray(pesticidesData)) {
        console.log('No pesticides found or invalid data');
        return;
      }
      
      console.log(`Found ${pesticidesData.length} pesticides`);
      
      for (const pesticide of pesticidesData) {
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
      let animals;
      
      try {
        animals = await animalApi.getAllAnimals();
      } catch (error) {
        console.log('Error fetching animals from API, trying direct request');
        
        try {
          // Try a direct request to the animals endpoint
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
        } catch (innerError) {
          console.error('Both animal endpoints failed:', innerError);
          return;
        }
      }
      
      if (!animals || !Array.isArray(animals)) {
        console.log('No animals found or invalid data');
        return;
      }
      
      console.log(`Found ${animals.length} animals`);
      
      for (const animal of animals) {
        try {
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
      const equipment = await stockEquipmentApi.getAllEquipment();
      
      if (!equipment || !Array.isArray(equipment)) {
        console.log('No equipment found or invalid data');
        return;
      }
      
      console.log(`Found ${equipment.length} equipment items`);
      
      for (const item of equipment) {
        try {
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
      const tools = await stockToolApi.getTools();
      
      if (!tools || !Array.isArray(tools)) {
        console.log('No tools found or invalid data');
        return;
      }
      
      console.log(`Found ${tools.length} tools`);
      
      for (const tool of tools) {
        try {
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
          await this.notificationService.scheduleEquipmentAlert(item.name, message, 'low_stock');
          break;
        case 'tool':
          await this.notificationService.scheduleToolAlert(item.name, message, 'low_stock');
          break;
        case 'harvest':
          await this.notificationService.scheduleHarvestAlert(item.name, message, 'low_stock');
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
    console.log('Running manual stock check...');
    // Enable debug mode for this manual check
    this.debugMode = true;
    await this.checkStocks();
    this.debugMode = false;
  }
}

export default StockNotificationService; 