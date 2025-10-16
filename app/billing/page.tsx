import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Button } from "components/Button"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export default async function Billing() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true }
  })

  if (!user?.subscription) {
    redirect("/pricing")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Billing & Subscription
            </h1>
            
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Current Subscription
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : user.subscription.status === 'past_due'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.subscription.status}
                    </span>
                  </dd>
                </div>
                
                {user.subscription.stripeCurrentPeriodEnd && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Next Billing Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(user.subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                
                {user.subscription.stripePriceId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Plan</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.subscription.stripePriceId}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Manage Subscription
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Manage your subscription, update payment methods, and view billing history.
                </p>
                
                <div className="flex space-x-4">
                  <Button
                    href={`/api/stripe/create-portal-session`}
                    intent="primary"
                  >
                    Manage Billing
                  </Button>
                  
                  <Button
                    href="/api/stripe/cancel-subscription"
                    intent="secondary"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button href="/dashboard" intent="secondary">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

