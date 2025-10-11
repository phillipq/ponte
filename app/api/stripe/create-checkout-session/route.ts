import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { stripe } from "lib/stripe"
import { prisma } from "lib/prisma"
import { authOptions } from "lib/auth"
import { env } from "env.mjs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId: string
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (user?.subscription?.stripeCustomerId) {
      customerId = user.subscription.stripeCustomerId
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: {
          userId: session.user.id,
        },
      })
      customerId = customer.id

      // Update user with customer ID
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customerId },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
        },
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const priceId = searchParams.get("priceId")

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId: string
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (user?.subscription?.stripeCustomerId) {
      customerId = user.subscription.stripeCustomerId
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: {
          userId: session.user.id,
        },
      })
      customerId = customer.id

      // Update user with customer ID
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customerId },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
        },
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.redirect(checkoutSession.url!)
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

