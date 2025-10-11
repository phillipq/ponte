const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function renameRealtorToPartner() {
  try {
    console.log('Starting migration: Rename Realtor to Partner...')
    
    // First, let's check if the Partner table already exists
    const existingPartner = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Partner'
    `
    
    if (existingPartner.length > 0) {
      console.log('Partner table already exists, skipping migration')
      return
    }
    
    // Rename the Realtor table to Partner
    await prisma.$executeRaw`ALTER TABLE "Realtor" RENAME TO "Partner"`
    console.log('✅ Renamed Realtor table to Partner')
    
    // Update the Property table to use partnerId instead of realtorId
    await prisma.$executeRaw`ALTER TABLE "Property" RENAME COLUMN "realtorId" TO "partnerId"`
    console.log('✅ Renamed realtorId column to partnerId in Property table')
    
    // Update the foreign key constraint
    await prisma.$executeRaw`ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_realtorId_fkey"`
    await prisma.$executeRaw`ALTER TABLE "Property" ADD CONSTRAINT "Property_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE`
    console.log('✅ Updated foreign key constraint')
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

renameRealtorToPartner()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
