"use client"

interface AppStats {
  appId: string
  _count: {
    id: number
  }
}

interface SubscriptionStats {
  status: string | null
  appId: string
  _count: {
    id: number
  }
}

interface AppAnalyticsProps {
  appStats: AppStats[]
  subscriptionStats: SubscriptionStats[]
  totalUsers: number
}

export function AppAnalytics({ appStats, subscriptionStats, totalUsers }: AppAnalyticsProps) {
  const getAppName = (appId: string) => {
    const appNames: Record<string, string> = {
      'ai-chatbot': 'AI Chatbot',
      'doc-analyzer': 'Document Analyzer',
      'code-assistant': 'Code Assistant',
      'default': 'Default App'
    }
    return appNames[appId] || appId
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'canceled': return 'bg-red-100 text-red-800'
      case 'past_due': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Users */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Users
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalUsers.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Subscriptions
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {subscriptionStats
                    .filter(stat => stat.status === 'active')
                    .reduce((sum, stat) => sum + stat._count.id, 0)
                    .toLocaleString()
                  }
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue (Estimate) */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Est. Monthly Revenue
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  ${(subscriptionStats
                    .filter(stat => stat.status === 'active')
                    .reduce((sum, stat) => sum + stat._count.id, 0) * 29
                  ).toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Apps Count */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Apps
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {appStats.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* App Breakdown */}
      <div className="md:col-span-2 lg:col-span-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Users by App</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {appStats.map((stat) => (
                <div key={stat.appId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {getAppName(stat.appId)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {stat._count.id} users
                    </span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(stat._count.id / totalUsers) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Status Breakdown */}
      <div className="md:col-span-2 lg:col-span-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['active', 'canceled', 'past_due', null].map((status) => {
                const count = subscriptionStats
                  .filter(stat => stat.status === status)
                  .reduce((sum, stat) => sum + stat._count.id, 0)
                
                return (
                  <div key={status || 'free'} className="text-center">
                    <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status || 'Free'}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {status ? 'Subscriptions' : 'Users'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
