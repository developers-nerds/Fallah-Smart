import { useState, useEffect } from 'react'
import axios from 'axios'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Icon from '@mdi/react'
import * as mdiIcons from '@mdi/js'

// Replace the hardcoded API_URL with the environment variable
const API_URL = import.meta.env.VITE_API_URL

function Wallet() {
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

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        // Update existing category
        const response = await axios.put(`${API_URL}/${editingCategory.id}`, formData)
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? response.data : cat
        ))
      } else {
        // Create new category
        const response = await axios.post(API_URL, formData)
        setCategories([...categories, response.data])
      }
      // Reset form and close modal
      setIsModalOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', type: 'Income', icon: '', color: '#000000' })
    } catch (error) {
      console.error('Error saving category:', error)
      setError('Failed to save category')
    }
  }

  // Add this helper function at the component level, before the return statement
  const getMdiIcon = (iconName: string) => {
    const mdiName = `mdi${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`;
    return (mdiIcons as any)[mdiName];
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1A2F2B]">Wallet</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-4 shadow-md"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Icon 
                    path={getMdiIcon(category.icon) || mdiIcons.mdiShape} 
                    size={1}
                    color={category.color}
                  />
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <span className="text-sm text-gray-500">{category.type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiEdit2 className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiTrash2 className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
    </>
  )
}

export default Wallet