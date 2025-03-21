import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { FiFolder } from 'react-icons/fi'

const API_URL = `${import.meta.env.VITE_API_URL}/categories`

function Wallet() {
  const [categoryCount, setCategoryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategoryCount()
  }, [])

  const fetchCategoryCount = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(API_URL)
      setCategoryCount(response.data.length)
    } catch (error) {
      console.error('Error details:', error)
      setError('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1A2F2B] mb-6">Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {/* Add more wallet-related cards here */}
      </div>
    </div>
  )
}

export default Wallet