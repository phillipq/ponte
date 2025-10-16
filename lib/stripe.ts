import { env } from "env.mjs"
import Stripe from "stripe"

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

export const getStripe = () => {
  if (typeof window !== "undefined") {
    return import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    )
  }
  return null
}

