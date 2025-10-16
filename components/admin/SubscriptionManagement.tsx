"use client"

import { useState } from "react"
import { Button } from "components/Button"

interface User {
  id: string
  name: string | null
  email: string
  appId: string
  subscription: {
    id: string
    status: string | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripeCurrentPeriodEnd: Date | null
  } | null
}

interface SubscriptionManagementProps {
  users: User[]
}

export function SubscriptionManagement({ users }: SubscriptionManagementProps) {
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [action, setAction] = useState<string>("")
  const [trialDays, setTrialDays] = useState<number>(7)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscriptionAction = async (userId: string, action: string, data?: unknown) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...(data as Record<string, unknown>) }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json() as { message?: string }
        alert(`Action failed: ${error.message}`)
      }
    } catch {
      alert('Error performing action')
    } finally {
      setIsLoading(false)
    }
  }

  const usersWithSubscriptions = users.filter(user => user.subscription)
  const freeUsers = users.filter(user => !user.subscription)

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Subscription Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage subscriptions and billing across all applications
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Subscription Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Trial Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Free Trial Management</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Choose a user...</option>
                  {freeUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.appId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trial Days
                </label>
                <input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min="1"
                  max="90"
                />
              </div>

              <Button
                onClick={() => handleSubscriptionAction(selectedUser, 'give_trial', { trialDays })}
                disabled={!selectedUser || isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : `Give ${trialDays}-Day Free Trial`}
              </Button>
            </div>
          </div>

          {/* Subscription Actions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Actions</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User with Subscription
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Choose a user...</option>
                  {usersWithSubscriptions.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} - {user.subscription?.status} ({user.appId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select action...</option>
                  <option value="cancel">Cancel Subscription</option>
                  <option value="reactivate">Reactivate Subscription</option>
                  <option value="refund">Issue Refund</option>
                  <option value="upgrade">Upgrade Plan</option>
                  <option value="downgrade">Downgrade Plan</option>
                </select>
              </div>

              <Button
                onClick={() => handleSubscriptionAction(selectedUser, action)}
                disabled={!selectedUser || !action || isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Execute Action"}
              </Button>
            </div>
          </div>
        </div>

        {/* Subscription Overview */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {usersWithSubscriptions.filter(u => u.subscription?.status === 'active').length}
              </div>
              <div className="text-sm text-green-700">Active Subscriptions</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {usersWithSubscriptions.filter(u => u.subscription?.status === 'canceled').length}
              </div>
              <div className="text-sm text-red-700">Canceled Subscriptions</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {freeUsers.length}
              </div>
              <div className="text-sm text-gray-700">Free Users</div>
            </div>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Subscriptions</h3>
          
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
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersWithSubscriptions.slice(0, 10).map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.appId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.subscription?.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : user.subscription?.status === 'canceled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription?.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.subscription?.stripeCurrentPeriodEnd 
                        ? new Date(user.subscription.stripeCurrentPeriodEnd).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        onClick={() => handleSubscriptionAction(user.id, 'view')}
                        size="sm"
                        intent="secondary"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => handleSubscriptionAction(user.id, 'cancel')}
                        size="sm"
                        intent="secondary"
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
