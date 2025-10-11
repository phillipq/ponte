import { NextRequest, NextResponse } from "next/server"
import { stripe } from "lib/stripe"
import { prisma } from "lib/prisma"
import { env } from "env.mjs"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } }
        })

        if (user) {
          await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              status: subscription.status,
            },
            create: {
              userId: user.id,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              status: subscription.status,
            },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } }
        })

        if (user) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: "canceled",
            },
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } }
        })

        if (user && invoice.subscription) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: "active",
            },
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } }
        })

        if (user) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: "past_due",
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

