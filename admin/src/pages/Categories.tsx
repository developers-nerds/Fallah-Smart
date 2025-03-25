import { useState, useEffect } from 'react'
import axios from 'axios'
import { FiPlus } from 'react-icons/fi'
import Category from '../components/Category.tsx'

interface Category {
  id?: number
  name: string
  type: string
  icon: string
  color: string
}

const API_URL = `${import.meta.env.VITE_API_URL}/categories`

function Categories() {
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Income',
    icon: '',
    color: '#000000'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(categories.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Update fetchCategories
  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(API_URL)
      console.log('Categories response:', response.data)
      setCategories(response.data)
    } catch (error) {
      console.error('Error details:', error)
      setError('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  // Update handleDelete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`${API_URL}/${id}`)
        setCategories(categories.filter(category => category.id !== id))
      } catch (error) {
        console.error('Error deleting category:', error)
        setError('Failed to delete category')
      }
    }
  }

  // Update handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        const response = await axios.put(`${API_URL}/${editingCategory.id}`, formData)
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? response.data : cat
        ))
      } else {
        const response = await axios.post(API_URL, formData)
        setCategories([...categories, response.data])
      }
      setIsModalOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', type: 'Income', icon: '', color: '#000000' })
    } catch (error) {
      console.error('Error saving category:', error)
      setError('Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color
    })
    setIsModalOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1A2F2B]">Categories</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1A2F2B] text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      {isLoading && <div>Loading categories...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!isLoading && !error && categories.length === 0 && (
        <div>No categories found</div>
      )}
      {!isLoading && !error && categories.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCategories.map((category) => (
                <Category
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {/* Add empty rows to maintain consistent height */}
              {[...Array(Math.max(0, itemsPerPage - currentCategories.length))].map((_, index) => (
                <tr key={`empty-${index}`} className="h-[57px]">
                  <td colSpan={4}></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-[#1A2F2B] text-white hover:bg-[#2A3F3B]'
                  }`}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === index + 1
                        ? 'bg-[#1A2F2B] text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-[#1A2F2B] text-white hover:bg-[#2A3F3B]'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="crops">Crops</option>
                  <option value="animals">Animals</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="Enter icon name (e.g., 'account', 'cash', 'pig')"
                />
                <small className="text-gray-500 mt-1 block">
                  Use Material Design Icons names without the 'mdi-' prefix
                </small>
              </div>
              <div>
                <label className="block mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border rounded-lg p-1"
                />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingCategory(null)
                    setFormData({ name: '', type: 'Income', icon: '', color: '#000000' })
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A2F2B] text-white rounded-lg"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories