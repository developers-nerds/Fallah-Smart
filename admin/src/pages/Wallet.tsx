import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { FiFolder, FiUsers, FiDollarSign } from 'react-icons/fi'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'

const CATEGORIES_URL = `${import.meta.env.VITE_API_URL}/categories`
const ACCOUNTS_URL = `${import.meta.env.VITE_API_URL}/accounts/all-with-users`
const TRANSACTIONS_URL = `${import.meta.env.VITE_API_URL}/transactions/admin/all`

interface Transaction {
  id: number
  amount: number
  type: string
  date: string
  category: {
    name: string
    color: string
  }
}

interface Account {
  id: number
  balance: number
  currency: string
}

function Wallet() {
  const [categoryCount, setCategoryCount] = useState(0)
  const [accountCount, setAccountCount] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)

  useEffect(() => {
    Promise.all([
      fetchCategoryCount(), 
      fetchAccountCount(),
      fetchAllTransactions()
    ]).finally(() => setIsLoading(false))
  }, [])

  const fetchCategoryCount = async () => {
    try {
      const response = await axios.get(CATEGORIES_URL)
      setCategoryCount(response.data.length)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to fetch categories')
    }
  }

  const fetchAccountCount = async () => {
    try {
      const response = await axios.get(ACCOUNTS_URL)
      setAccountCount(response.data.length)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError('Failed to fetch accounts')
    }
  }

  const fetchAllTransactions = async () => {
    try {
      const response = await axios.get(TRANSACTIONS_URL)
      
      // Extract transactions and accounts from the response
      const transactionsData = response.data.data.transactions || []
      const accountsData = response.data.data.accounts || []
      
      setTransactions(transactionsData)
      setAccounts(accountsData)

      // Calculate total balance from all accounts
      const totalAccountBalance = accountsData.reduce((sum, account) => sum + account.balance, 0)
      setTotalBalance(totalAccountBalance)

      // Calculate income and expense totals
      const income = transactionsData
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = transactionsData
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      setTotalIncome(income)
      setTotalExpense(expense)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to fetch transactions')
    }
  }

  // Prepare data for charts
  const categoryData = transactions.reduce((acc, transaction) => {
    const existingCategory = acc.find(cat => cat.name === transaction.category.name)
    if (existingCategory) {
      existingCategory.amount += transaction.amount
    } else {
      acc.push({
        name: transaction.category.name,
        amount: transaction.amount,
        color: transaction.category.color
      })
    }
    return acc
  }, [] as any[])

  const monthlyData = transactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleString('default', { month: 'short' })
    const existingMonth = acc.find(m => m.month === month)
    if (existingMonth) {
      if (transaction.type === 'income') existingMonth.income += transaction.amount
      else existingMonth.expense += transaction.amount
    } else {
      acc.push({
        month,
        income: transaction.type === 'income' ? transaction.amount : 0,
        expense: transaction.type === 'expense' ? transaction.amount : 0
      })
    }
    return acc
  }, [] as any[])

  // Sort monthly data chronologically
  monthlyData.sort((a, b) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.indexOf(a.month) - months.indexOf(b.month)
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1A2F2B] mb-6">Wallet Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link to="/categories" className="block">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A2F2B]">Categories</h3>
                {isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : error ? (
                  <p className="text-red-500">Error loading categories</p>
                ) : (
                  <p className="text-2xl font-bold text-[#1A2F2B]">{categoryCount}</p>
                )}
              </div>
              <div className="bg-[#1A2F2B] bg-opacity-10 p-3 rounded-full">
                <FiFolder className="text-[#1A2F2B] text-xl" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/accounts" className="block">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A2F2B]">Accounts</h3>
                {isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : error ? (
                  <p className="text-red-500">Error loading accounts</p>
                ) : (
                  <p className="text-2xl font-bold text-[#1A2F2B]">{accountCount}</p>
                )}
              </div>
              <div className="bg-[#1A2F2B] bg-opacity-10 p-3 rounded-full">
                <FiUsers className="text-[#1A2F2B] text-xl" />
              </div>
            </div>
          </div>
        </Link>

        {/* Total Balance Card */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#1A2F2B]">Total Balance</h3>
              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : error ? (
                <p className="text-red-500">Error loading balance</p>
              ) : (
                <p className="text-2xl font-bold text-[#1A2F2B]">
                  {totalBalance.toFixed(2)} DT
                </p>
              )}
            </div>
            <div className="bg-[#1A2F2B] bg-opacity-10 p-3 rounded-full">
              <FiDollarSign className="text-[#1A2F2B] text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Income vs Expense */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
          {isLoading ? (
            <p>Loading chart data...</p>
          ) : monthlyData.length > 0 ? (
            <BarChart width={500} height={300} data={monthlyData} margin={{ right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#4CAF50" name="Income" />
              <Bar dataKey="expense" fill="#F44336" name="Expense" />
            </BarChart>
          ) : (
            <p>No transaction data available</p>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          {isLoading ? (
            <p>Loading chart data...</p>
          ) : categoryData.length > 0 ? (
            <PieChart width={500} height={300}>
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <p>No category data available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wallet