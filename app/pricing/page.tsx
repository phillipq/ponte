import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import { Button } from "components/Button"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Basic features",
      "Community support",
      "Limited usage",
      "Basic analytics"
    ],
    stripePriceId: null,
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "Best for growing businesses",
    features: [
      "All Free features",
      "Advanced features",
      "Priority support",
      "Advanced analytics",
      "API access",
      "Custom integrations"
    ],
    stripePriceId: "price_pro_monthly", // Replace with actual Stripe price ID
    popular: true
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    description: "For large organizations",
    features: [
      "All Pro features",
      "Dedicated support",
      "Custom deployment",
      "SLA guarantee",
      "Advanced security",
      "White-label options"
    ],
    stripePriceId: "price_enterprise_monthly", // Replace with actual Stripe price ID
    popular: false
  }
]

export default async function Pricing() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.stripePriceId ? (
                  <Button
                    href={`/api/stripe/create-checkout-session?priceId=${plan.stripePriceId}`}
                    className={`w-full ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {session ? "Upgrade Now" : "Get Started"}
                  </Button>
                ) : (
                  <Button
                    href={session ? "/dashboard" : "/auth/signup"}
                    intent="secondary"
                    className="w-full"
                  >
                    {session ? "Current Plan" : "Get Started"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Need a custom solution?
          </h2>
          <p className="mt-4 text-gray-600">
            Contact us to discuss your specific requirements
          </p>
          <div className="mt-6">
            <Button href="mailto:support@yourapp.com" intent="secondary">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

