export type StockStackParamList = {
  StockHome: undefined;
  AddStock: undefined;
  StockDetails: { stockId: string };
  AddFertilizer: { fertilizerId?: number };
  AddPesticide: { pesticideId?: number };
  AddAnimal: { animalId?: number };
  AddEquipment: { equipmentId?: string };
  EquipmentDetail: { equipmentId: string };
  AddSeed: { seedId?: number };
  EditStock: { stockId: string };
  StockHistory: { stockId: string };
  StockStatistics: undefined;
  PesticideList: undefined;
  PesticideDetail: { pesticideId: string };
  EditPesticide: { pesticideId: string };
  Animals: undefined;
  AnimalDetail: { animalId: string };
  EditAnimal: { animalId: string };
  ToolList: undefined;
  ToolDetail: { toolId: string };
  EquipmentList: undefined;
  SeedList: undefined;
  SeedDetail: { seedId: string };
  FeedList: undefined;
  FeedDetail: { feedId: string };
  HarvestList: undefined;
  HarvestDetail: { harvestId: string };
  FertilizerList: undefined;
  FertilizerDetail: { fertilizerId: string };
  Login: undefined;
  Register: undefined;
  StockTab: undefined;
  StockList: undefined;
  Blogs: undefined;
  PostDetail: { postId: string };
  Statistics: undefined;
  Marketplace: undefined;
  AdvisorApplication: undefined;
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
