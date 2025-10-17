import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

export async function GET() {
  console.log('🔍 Vercel Auth Debug Started')
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  })

  try {
    console.log('1. Testing session retrieval...')
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No session found',
        debug: {
          hasSession: false,
          environment: {
            databaseUrlPresent: !!process.env.DATABASE_URL,
            nextAuthUrl: process.env.NEXTAUTH_URL,
            nextAuthSecretPresent: !!process.env.NEXTAUTH_SECRET
          }
        }
      })
    }

    console.log('✅ Session found:', {
      user: session.user?.email,
      role: (session.user as { role?: string })?.role
    })

    console.log('2. Testing user lookup with session...')
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || undefined },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
        session: {
          email: session.user?.email,
          name: session.user?.name
        }
      })
    }

    console.log('✅ User found in database:', user)

    console.log('3. Testing data access with user context...')
    
    // Test properties access
    const properties = await prisma.property.findMany({
      select: { id: true, name: true, propertyType: true },
      take: 5
    })

    // Test clients access  
    const clients = await prisma.client.findMany({
      select: { id: true, name: true },
      take: 5
    })

    // Test destinations access
    const destinations = await prisma.destination.findMany({
      select: { id: true, name: true, category: true },
      take: 5
    })

    console.log('✅ Data access successful:', {
      properties: properties.length,
      clients: clients.length,
      destinations: destinations.length
    })

    return NextResponse.json({
      success: true,
      message: 'Auth and data access working',
      session: {
        email: session.user?.email,
        name: session.user?.name,
        role: (session.user as { role?: string })?.role
      },
      user: user,
      data: {
        properties: properties.length,
        clients: clients.length,
        destinations: destinations.length
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ Auth debug failed:', errorMessage)
    console.error('Stack:', errorStack)
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 })

  } finally {
    await prisma.$disconnect()
  }
}
