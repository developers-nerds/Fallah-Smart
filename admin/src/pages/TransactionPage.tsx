import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Transaction } from '../types/Transaction';

const API_URL = `${import.meta.env.VITE_API_URL}/transactions/admin`;

export default function TransactionPage() {
  const { accountId } = useParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [accountId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/${accountId}`);
      // Access the data property from the response
      setTransactions(response.data.data.transactions || []);
      console.log('Response:', response.data); // For debugging
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts only when transactions are available
  const categoryData = transactions && transactions.length > 0 
    ? transactions.reduce((acc, transaction) => {
        const existingCategory = acc.find(cat => cat.name === transaction.category.name);
        if (existingCategory) {
          existingCategory.amount += transaction.amount;
          existingCategory.count += 1;
        } else {
          acc.push({
            name: transaction.category.name,
            amount: transaction.amount,
            count: 1,
            color: transaction.category.color,
            type: transaction.type
          });
        }
        return acc;
      }, [] as any[])
    : [];

  const timelineData = transactions && transactions.length > 0
    ? transactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(transaction => ({
          date: new Date(transaction.date).toLocaleDateString(),
          amount: transaction.amount,
          type: transaction.type
        }))
    : [];

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!transactions || transactions.length === 0) {
    return <div className="p-6">No transactions found for this account.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Account Transactions</h1>
      
      {/* Account Summary */}
      {transactions[0]?.account && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Account Details</h2>
          <p>Method: {transactions[0].account.Methods}</p>
          <p>Balance: {transactions[0].account.balance} {transactions[0].account.currency}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
          <PieChart width={400} height={400}>
            <Pie
              data={categoryData}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/* Timeline Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Transaction Timeline</h2>
          <LineChart width={400} height={400} data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#8884d8"
              name="Transaction Amount"
            />
          </LineChart>
        </div>

        {/* Transaction Type Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Income vs Expenses</h2>
          <BarChart width={400} height={400} data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" />
          </BarChart>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-auto max-h-96">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="border-b p-2 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{transaction.category.name}</p>
                  <p className="text-sm text-gray-600">{transaction.note}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount} {transaction.account.currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}