import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "lib/prisma"
import { authOptions } from "lib/auth"
import { stripe } from "lib/stripe"

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user?.subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      )
    }

    // Cancel the subscription at the end of the current period
    const _subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    )

    // Update the subscription status in the database
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        status: "canceled",
      },
    })

    return NextResponse.json({
      message: "Subscription will be canceled at the end of the current period",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.redirect("/auth/signin")
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user?.subscription?.stripeSubscriptionId) {
      return NextResponse.redirect("/pricing")
    }

    // Cancel the subscription at the end of the current period
    const _subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    )

    // Update the subscription status in the database
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        status: "canceled",
      },
    })

    return NextResponse.redirect("/billing?canceled=true")
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.redirect("/billing?error=true")
  }
}

