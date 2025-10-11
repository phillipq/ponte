const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@ponte.com",
        password: hashedPassword,
        role: "admin"
      }
    })
    
    console.log(`✅ Created admin user: ${user.name} (${user.email})`)
    console.log('🔑 Login credentials:')
    console.log('   Email: admin@ponte.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('You can now log in and start using the app!')
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
  .catch((error) => {
    console.error('Creation failed:', error)
    process.exit(1)
  })
