export interface Transaction {
  id: number;
  amount: number;
  type: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  accountId: number;
  account: {
    id: number;
    Methods: string;
    balance: number;
    currency: string;
    userId: number;
  };
  category: {
    id: number;
    name: string;
    type: string;
    icon: string;
    color: string;
  };
}