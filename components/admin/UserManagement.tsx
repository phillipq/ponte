"use client"

import { useState } from "react"
import { Button } from "components/Button"

interface User {
  id: string
  name: string | null
  email: string
  appId: string
  emailVerified: Date | null
  createdAt: Date
  subscription: {
    id: string
    status: string | null
    stripeCustomerId: string | null
  } | null
}

interface UserManagementProps {
  users: User[]
}

export function UserManagement({ users }: UserManagementProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [action, setAction] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleUserAction = async (userId: string, action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        if (action === 'change_password' && data.newPassword) {
          alert(`Password changed successfully. New password: ${data.newPassword}`)
        } else {
          alert(data.message || 'Action completed successfully')
        }
        // Refresh the page or update state
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Action failed')
      }
    } catch {
      alert('Error performing action')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !action) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userIds: selectedUsers, 
          action 
        }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Bulk action failed')
      }
    } catch {
      alert('Error performing bulk action')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id))
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage users across all applications ({users.length} total users)
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedUsers.length === users.length}
              onChange={selectAllUsers}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Select All ({selectedUsers.length} selected)
            </span>
          </div>
          
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select Action</option>
            <option value="delete">Delete Users</option>
            <option value="suspend">Suspend Users</option>
            <option value="verify">Verify Email</option>
            <option value="export">Export Data</option>
          </select>
          
          <Button
            onClick={handleBulkAction}
            disabled={selectedUsers.length === 0 || !action || isLoading}
            size="sm"
          >
            {isLoading ? "Processing..." : "Execute"}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                App
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.appId}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.emailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.subscription ? (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : user.subscription.status === 'canceled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscription.status || 'Unknown'}
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Free
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    onClick={() => handleUserAction(user.id, 'view')}
                    size="sm"
                    intent="secondary"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleUserAction(user.id, 'change_password')}
                    size="sm"
                    intent="secondary"
                  >
                    Change Password
                  </Button>
                  <Button
                    onClick={() => handleUserAction(user.id, 'suspend')}
                    size="sm"
                    intent="secondary"
                  >
                    Suspend
                  </Button>
                  <Button
                    onClick={() => handleUserAction(user.id, 'delete')}
                    size="sm"
                    intent="secondary"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
