import React from 'react'
import { useNavigate } from 'react-router-dom'

interface AccountProps {
  account: {
    id: number
    balance: number
    currency: string
    User: {
      firstName: string
      lastName: string
      role: string
    }
  }
}

const Account: React.FC<AccountProps> = ({ account }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/transactions/${account.id}`)
  }

  return (
    <tr 
      className="border-b hover:bg-gray-50 cursor-pointer" 
      onClick={handleClick}
    >
      <td className="px-6 py-4">{account.id}</td>
      <td className="px-6 py-4">{account.balance.toFixed(2)}</td>
      <td className="px-6 py-4">{account.currency}</td>
      <td className="px-6 py-4">{account.User.firstName}</td>
      <td className="px-6 py-4">{account.User.lastName}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs ${
          account.User.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {account.User.role}
        </span>
      </td>
    </tr>
  )
}

export default Account