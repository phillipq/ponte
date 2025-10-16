import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { stripe } from "lib/stripe"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = session.user?.email === "admin@rocketlaunchingllama.com" // Replace with your admin email
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action, trialDays, planId } = await request.json() as { action: string; trialDays?: number; planId?: string }
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    switch (action) {
      case 'give_trial':
        if (!trialDays || trialDays < 1 || trialDays > 90) {
          return NextResponse.json({ error: "Invalid trial days" }, { status: 400 })
        }

        // Create or update subscription with trial
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + trialDays)

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            status: 'trialing',
            stripeCurrentPeriodEnd: trialEndDate,
          },
          create: {
            userId,
            status: 'trialing',
            stripeCurrentPeriodEnd: trialEndDate,
          }
        })

        return NextResponse.json({ 
          message: `${trialDays}-day trial granted successfully`,
          trialEndDate 
        })

      case 'cancel':
        if (!user.subscription?.stripeSubscriptionId) {
          return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
        }

        // Cancel subscription at period end
        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        })

        await prisma.subscription.update({
          where: { userId },
          data: { status: 'canceled' }
        })

        return NextResponse.json({ message: "Subscription canceled successfully" })

      case 'reactivate':
        if (!user.subscription?.stripeSubscriptionId) {
          return NextResponse.json({ error: "No subscription found" }, { status: 400 })
        }

        // Reactivate subscription
        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          cancel_at_period_end: false
        })

        await prisma.subscription.update({
          where: { userId },
          data: { status: 'active' }
        })

        return NextResponse.json({ message: "Subscription reactivated successfully" })

      case 'refund':
        if (!user.subscription?.stripeCustomerId) {
          return NextResponse.json({ error: "No customer found" }, { status: 400 })
        }

        // Get recent invoices
        const invoices = await stripe.invoices.list({
          customer: user.subscription.stripeCustomerId,
          limit: 1
        })

        if (invoices.data.length === 0) {
          return NextResponse.json({ error: "No invoices found" }, { status: 400 })
        }

        // Create refund
        const refund = await stripe.refunds.create({
          payment_intent: invoices.data[0]?.payment_intent as string,
          reason: 'requested_by_customer'
        })

        return NextResponse.json({ 
          message: "Refund processed successfully",
          refundId: refund.id,
          amount: refund.amount
        })

      case 'upgrade':
        if (!planId) {
          return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
        }

        if (!user.subscription?.stripeSubscriptionId) {
          return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
        }

        // Update subscription to new plan
        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          items: [{
            id: user.subscription.stripeSubscriptionId,
            price: planId
          }]
        })

        await prisma.subscription.update({
          where: { userId },
          data: { stripePriceId: planId }
        })

        return NextResponse.json({ message: "Subscription upgraded successfully" })

      case 'downgrade':
        if (!planId) {
          return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
        }

        if (!user.subscription?.stripeSubscriptionId) {
          return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
        }

        // Update subscription to new plan
        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          items: [{
            id: user.subscription.stripeSubscriptionId,
            price: planId
          }]
        })

        await prisma.subscription.update({
          where: { userId },
          data: { stripePriceId: planId }
        })

        return NextResponse.json({ message: "Subscription downgraded successfully" })

      case 'view':
        // Return subscription details
        return NextResponse.json({ 
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            appId: user.appId
          },
          subscription: user.subscription
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Admin subscription action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
