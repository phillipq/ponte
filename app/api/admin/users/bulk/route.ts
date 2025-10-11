import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { stripe } from "lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = session.user.email === "admin@rocketlaunchingllama.com" // Replace with your admin email
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userIds, action } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs required" }, { status: 400 })
    }

    const results = []

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true }
        })

        if (!user) {
          results.push({ userId, success: false, error: "User not found" })
          continue
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
            
            results.push({ userId, success: true, message: "User deleted" })
            break

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
            
            results.push({ userId, success: true, message: "User suspended" })
            break

          case 'verify':
            // Mark email as verified
            await prisma.user.update({
              where: { id: userId },
              data: { emailVerified: new Date() }
            })
            
            results.push({ userId, success: true, message: "Email verified" })
            break

          case 'export':
            // Add user to export list (you can implement actual export logic)
            results.push({ 
              userId, 
              success: true, 
              message: "Added to export",
              data: {
                email: user.email,
                name: user.name,
                appId: user.appId,
                createdAt: user.createdAt
              }
            })
            break

          default:
            results.push({ userId, success: false, error: "Invalid action" })
        }

      } catch (error) {
        results.push({ 
          userId, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Bulk action completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    console.error("Bulk user action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
