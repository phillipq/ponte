import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { canAccessAdmin } from "lib/config"
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

    // Check if user can access admin
    if (!canAccessAdmin(session.user.email!)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action } = await request.json()
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    switch (action) {
      case 'delete':
        // Cancel subscription first if exists
        if (user.subscription?.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId)
        }
        
        // Delete user and all related data
        await prisma.user.delete({
          where: { id: userId }
        })
        
        return NextResponse.json({ message: "User deleted successfully" })

      case 'suspend':
        // Cancel subscription if exists
        if (user.subscription?.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId)
        }
        
        // Update subscription status
        if (user.subscription) {
          await prisma.subscription.update({
            where: { userId },
            data: { status: 'canceled' }
          })
        }
        
        return NextResponse.json({ message: "User suspended successfully" })

      case 'verify':
        // Mark email as verified
        await prisma.user.update({
          where: { id: userId },
          data: { emailVerified: new Date() }
        })
        
        return NextResponse.json({ message: "Email verified successfully" })

      case 'change_password':
        // Generate a new random password
        const newPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword }
        })
        
        return NextResponse.json({ 
          message: "Password changed successfully",
          newPassword: newPassword // Only for admin use - in production, send via email
        })

      case 'view':
        // Return user details
        return NextResponse.json({ user })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Admin user action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
