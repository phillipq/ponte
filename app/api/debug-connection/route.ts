import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 Vercel IPv6 Connection Debug Started')
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  })

  try {
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ IPv6 connection successful')

    console.log('2. Testing basic queries...')
    
    // Test user access
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      take: 3
    })
    console.log(`✅ Users accessible: ${users.length}`)

    // Test properties access
    const properties = await prisma.property.findMany({
      select: { id: true, name: true, propertyType: true },
      take: 3
    })
    console.log(`✅ Properties accessible: ${properties.length}`)

    // Test clients access
    const clients = await prisma.client.findMany({
      select: { id: true, name: true },
      take: 3
    })
    console.log(`✅ Clients accessible: ${clients.length}`)

    // Test destinations access
    const destinations = await prisma.destination.findMany({
      select: { id: true, name: true, category: true },
      take: 3
    })
    console.log(`✅ Destinations accessible: ${destinations.length}`)

    console.log('3. Testing connection stability...')
    
    // Test multiple rapid queries
    const promises = Array(5).fill(null).map(async (_, i) => {
      try {
        const result = await prisma.user.count()
        console.log(`✅ Rapid query ${i+1}: ${result} users`)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Rapid query ${i+1} failed:`, errorMessage)
        return null
      }
    })

    await Promise.all(promises)

    console.log('4. Testing environment variables...')
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('NEXTAUTH_SECRET present:', !!process.env.NEXTAUTH_SECRET)
    console.log('NODE_ENV:', process.env.NODE_ENV)

    return NextResponse.json({
      success: true,
      message: 'IPv6 connection working in Vercel',
      data: {
        users: users.length,
        properties: properties.length,
        clients: clients.length,
        destinations: destinations.length,
        environment: {
          databaseUrlPresent: !!process.env.DATABASE_URL,
          nextAuthUrl: process.env.NEXTAUTH_URL,
          nextAuthSecretPresent: !!process.env.NEXTAUTH_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ IPv6 connection failed in Vercel:', errorMessage)
    console.error('Stack:', errorStack)
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack,
      environment: {
        databaseUrlPresent: !!process.env.DATABASE_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nextAuthSecretPresent: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 })

  } finally {
    await prisma.$disconnect()
    console.log('✅ Disconnected from database')
  }
}
