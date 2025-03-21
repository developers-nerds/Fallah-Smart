export type StockStackParamList = {
  StockHome: undefined;
  AddStock: undefined;
  StockDetail: { stockId: string };
  PesticideList: undefined;
  AddPesticide: undefined;
  PesticideDetail: { pesticideId: string };
  EditPesticide: { pesticideId: string };
  Animals: undefined;
  AddAnimal: { animalId?: string; mode?: 'edit' | 'add' };
  AnimalDetail: { animalId: string };
  EditAnimal: { animalId: string };
  ToolList: undefined;
  AddTool: undefined;
  ToolDetail: { toolId: string };
  EquipmentList: undefined;
  AddEquipment: undefined;
  EquipmentDetail: { equipmentId: string };
  SeedList: undefined;
  AddSeed: { seedId?: string; mode?: 'edit' | 'add' };
  SeedDetail: { seedId: string };
  FeedList: undefined;
  AddFeed: undefined;
  FeedDetail: { feedId: string };
  HarvestList: undefined;
  AddHarvest: undefined;
  HarvestDetail: { harvestId: string };
  FertilizerList: undefined;
  AddFertilizer: { fertilizerId?: string };
  FertilizerDetail: { fertilizerId: string };
  Login: undefined;
  Register: undefined;
  StockTab: undefined;
  StockList: undefined;
  Blogs: undefined;
  PostDetail: { postId: string };
  Statistics: undefined;
  Marketplace: undefined;
  AddProduct: undefined;
  AdvisorApplication: undefined;
  SupplierRegistrationForm: undefined;
};

export type DrawerParamList = {
  HomeContent: undefined;
  Chat: undefined;
  Scan: undefined;
  Stock: undefined;
  Wallet: undefined;
  Dictionary: undefined;
  Marketplace: undefined;
};
