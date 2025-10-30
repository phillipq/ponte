import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'

const prisma = new PrismaClient()

// Category normalization function
const normalizeCategory = (category: string) => {
  const normalized = category.toLowerCase().trim()
  
  const categoryMap: { [key: string]: string } = {
    'international airport': 'int_airport',
    'international airports': 'int_airport',
    'int airport': 'int_airport',
    'int_airport': 'int_airport',
    'airport': 'airport',
    'airports': 'airport',
    'bus station': 'bus_station',
    'bus stations': 'bus_station',
    'bus_station': 'bus_station',
    'train station': 'train_station',
    'train stations': 'train_station',
    'train_station': 'train_station',
    'attraction': 'attraction',
    'attractions': 'attraction',
    'beach': 'beach',
    'beaches': 'beach',
    'entertainment': 'entertainment',
    'hospital': 'hospital',
    'hospitals': 'hospital',
    'hotel': 'hotel',
    'hotels': 'hotel',
    'museum': 'museum',
    'museums': 'museum',
    'mountain': 'mountain',
    'mountains': 'mountain',
    'other': 'other',
    'park': 'park',
    'parks': 'park',
    'restaurant': 'restaurant',
    'restaurants': 'restaurant',
    'school': 'school',
    'schools': 'school',
    'shopping': 'shopping',
    'store': 'shopping',
    'stores': 'shopping',
    'theater': 'entertainment',
    'theatre': 'entertainment',
    'theaters': 'entertainment',
    'theatres': 'entertainment'
  }
  
  return categoryMap[normalized] || null
}

// Valid categories
const _validCategories = [
  'int_airport', 'airport', 'attraction', 'beach', 'bus_station', 'entertainment',
  'hospital', 'hotel', 'museum', 'mountain', 'other', 'park', 'restaurant',
  'school', 'shopping', 'train_station'
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
    }

    // Parse CSV content
    const csvContent = await file.text()
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (records.length === 0) {
      return NextResponse.json({ error: 'No data found in CSV' }, { status: 400 })
    }

    let count = 0

    if (type === 'properties') {
      for (const record of records) {
        try {
          const recordData = record as { 
            name?: string; 
            propertyType?: string; 
            propertyNumber?: string;
            recipientName?: string; 
            streetAddress?: string; 
            postalCode?: string; 
            city?: string; 
            province?: string; 
            country?: string; 
            latitude?: string; 
            longitude?: string; 
            tags?: string 
          }
          await prisma.property.create({
            data: {
              name: recordData.name || '',
              propertyType: recordData.propertyType || 'house',
              propertyNumber: parseInt(recordData.propertyNumber || '0') || 0,
              recipientName: recordData.recipientName || '',
              streetAddress: recordData.streetAddress || '',
              postalCode: recordData.postalCode || '',
              city: recordData.city || '',
              province: recordData.province || '',
              country: recordData.country || '',
              latitude: parseFloat(recordData.latitude || '0') || 0,
              longitude: parseFloat(recordData.longitude || '0') || 0,
              tags: recordData.tags ? recordData.tags.split(',').map((tag: string) => tag.trim()) : [],
              userId: (session.user as { id: string }).id
            }
          })
          count++
        } catch (error) {
          console.error('Error creating property:', error)
          // Continue with other records
        }
      }
    } else if (type === 'destinations') {
      for (const record of records) {
        try {
          const recordData = record as { 
            name?: string; 
            category?: string; 
            streetAddress?: string; 
            postalCode?: string; 
            city?: string; 
            province?: string; 
            country?: string; 
            latitude?: string; 
            longitude?: string; 
            tags?: string 
          }
          // Construct address from individual fields
          const addressParts = [
            recordData.streetAddress,
            recordData.postalCode,
            recordData.city,
            recordData.province,
            recordData.country
          ].filter(part => part && part.trim())
          
          const address = addressParts.join(', ') || ''

          // Normalize and validate category
          const rawCategory = recordData.category || 'other'
          const normalizedCategory = normalizeCategory(rawCategory)
          
          if (!normalizedCategory) {
            console.warn(`Invalid category "${rawCategory}" for destination "${recordData.name}". Using 'other' instead.`)
          }
          
          const category = normalizedCategory || 'other'

          await prisma.destination.create({
            data: {
              name: recordData.name || '',
              category: category,
              address: address,
              streetAddress: recordData.streetAddress || '',
              postalCode: recordData.postalCode || '',
              city: recordData.city || '',
              province: recordData.province || '',
              country: recordData.country || 'ITALY',
              latitude: parseFloat(recordData.latitude || '0') || 0,
              longitude: parseFloat(recordData.longitude || '0') || 0,
              tags: recordData.tags ? recordData.tags.split(',').map((tag: string) => tag.trim()) : [],
              userId: (session.user as { id: string }).id
            }
          })
          count++
        } catch (error) {
          console.error('Error creating destination:', error)
          // Continue with other records
        }
      }
    } else if (type === 'clients') {
      for (const record of records) {
        try {
          const recordData = record as {
            name?: string;
            email?: string;
            phone?: string;
            company?: string;
            notes?: string;
          }

          const name = (recordData.name || '').trim()
          const email = (recordData.email || '').trim()

          // Require name and email
          if (!name || !email) {
            console.warn('Skipping client record due to missing required fields (name/email):', record)
            continue
          }

          // Create or update existing client by email for this user
          const existing = await prisma.client.findFirst({
            where: {
              email: email,
              userId: (session.user as { id: string }).id
            }
          })

          if (existing) {
            await prisma.client.update({
              where: { id: existing.id },
              data: {
                name,
                phone: recordData.phone || existing.phone || null,
                company: recordData.company || existing.company || null,
                notes: recordData.notes || existing.notes || null
              }
            })
          } else {
            await prisma.client.create({
              data: {
                name,
                email,
                phone: recordData.phone || null,
                company: recordData.company || null,
                notes: recordData.notes || null,
                userId: (session.user as { id: string }).id
              }
            })
          }

          count++
        } catch (error) {
          console.error('Error creating/updating client:', error)
          // Continue processing other records
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      count,
      message: `Successfully imported ${count} ${type}` 
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: 'Failed to import data' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
