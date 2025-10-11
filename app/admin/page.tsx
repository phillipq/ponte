import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import { canAccessAdmin, isMasterAdmin, APP_CONFIG } from "lib/config"
import { prisma } from "lib/prisma"
import { stripe } from "lib/stripe"
import { UserManagement } from "components/admin/UserManagement"
import { SubscriptionManagement } from "components/admin/SubscriptionManagement"
import { AppAnalytics } from "components/admin/AppAnalytics"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Check if user can access admin
  if (!canAccessAdmin(session.user.email!)) {
    redirect("/dashboard")
  }

  const isMasterAdminUser = isMasterAdmin(session.user.email!)

  // Get users based on admin type
  const allUsers = await prisma.user.findMany({
    where: isMasterAdminUser ? {} : { appId: APP_CONFIG.APP_ID },
    include: {
      subscription: true,
      accounts: true,
      sessions: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Get app statistics
  const appStats = await prisma.user.groupBy({
    by: ['appId'],
    where: isMasterAdminUser ? {} : { appId: APP_CONFIG.APP_ID },
    _count: {
      id: true
    }
  })

  // Get subscription statistics
  const subscriptionStats = await prisma.subscription.groupBy({
    by: ['status', 'appId'],
    where: isMasterAdminUser ? {} : { appId: APP_CONFIG.APP_ID },
    _count: {
      id: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isMasterAdminUser ? "Master Admin Dashboard" : `${APP_CONFIG.APP_NAME} Admin`}
            </h1>
            <p className="mt-2 text-gray-600">
              {isMasterAdminUser 
                ? "Manage users and subscriptions across all AI applications" 
                : `Manage users and subscriptions for ${APP_CONFIG.APP_NAME}`
              }
            </p>
            {!isMasterAdminUser && (
              <div className="mt-2">
                <a 
                  href={APP_CONFIG.ADMIN.MASTER_ADMIN_URL}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Back to Master Admin Dashboard
                </a>
              </div>
            )}
          </div>

          {/* App Analytics */}
          <AppAnalytics 
            appStats={appStats}
            subscriptionStats={subscriptionStats}
            totalUsers={allUsers.length}
          />

          {/* User Management */}
          <div className="mt-8">
            <UserManagement users={allUsers} />
          </div>

          {/* Subscription Management */}
          <div className="mt-8">
            <SubscriptionManagement users={allUsers} />
          </div>
        </div>
      </div>
    </div>
  )
}
