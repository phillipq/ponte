import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { stripe } from "lib/stripe"
import { prisma } from "lib/prisma"
import { authOptions } from "lib/auth"
import { env } from "env.mjs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user?.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      )
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${env.NEXTAUTH_URL}/billing`,
    })

    return NextResponse.redirect(portalSession.url)
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}

