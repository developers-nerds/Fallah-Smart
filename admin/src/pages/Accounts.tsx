import { useState, useEffect } from 'react'
import axios from 'axios'
import Account from '../components/Account'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../redux/store'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const API_URL = `${import.meta.env.VITE_API_URL}/accounts/all-with-users`

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [accountsPerPage] = useState(10)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { error: 'Please login to access this page' } })
      return
    }
    fetchAccounts()
  }, [isAuthenticated, navigate])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(API_URL)
      setAccounts(response.data)
    } catch (error) {
      console.error('Error details:', error)
      setError('Failed to fetch accounts')
    } finally {
      setIsLoading(false)
    }
  }

  // Get current accounts
  const indexOfLastAccount = currentPage * accountsPerPage
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage
  const currentAccounts = accounts.slice(indexOfFirstAccount, indexOfLastAccount)

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1A2F2B] mb-6">Accounts</h1>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAccounts.map((account) => (
                <Account key={account.id} account={account} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{indexOfFirstAccount + 1}</span>
              {' '}-{' '}
              <span className="font-medium">
                {Math.min(indexOfLastAccount, accounts.length)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{accounts.length}</span>
              {' '}results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.ceil(accounts.length / accountsPerPage) }).map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === index + 1
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(accounts.length / accountsPerPage)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === Math.ceil(accounts.length / accountsPerPage)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Accounts