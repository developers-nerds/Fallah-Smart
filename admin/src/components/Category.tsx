import React from 'react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import Icon from '@mdi/react'
import * as mdiIcons from '@mdi/js'

interface CategoryProps {
  category: {
    id: number
    name: string
    type: string
    icon: string
    color: string
  }
  onEdit: (category: CategoryProps['category']) => void
  onDelete: (id: number) => void
}

const getMdiIcon = (iconName: string) => {
  const mdiName = `mdi${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`
  return (mdiIcons as any)[mdiName]
}

const Category: React.FC<CategoryProps> = ({ category, onEdit, onDelete }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Icon 
            path={getMdiIcon(category.icon) || mdiIcons.mdiShape} 
            size={1}
            color={category.color}
          />
          <span>{category.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">{category.type}</td>
      <td className="px-6 py-4">
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color }} />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onEdit(category)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiEdit2 className="text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiTrash2 className="text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default Category