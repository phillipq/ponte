const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createUserAndQuestionnaire() {
  try {
    console.log('Creating user and questionnaire structure...')
    
    // Create a user first
    const user = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@ponte.com",
        role: "admin"
      }
    })
    
    console.log(`✅ Created user: ${user.name} (${user.email})`)
    
    // Create basic questionnaire sections
    const sections = [
      {
        title: "Personal Information",
        order: 1,
        questions: [
          {
            question: "What is your full name?",
            questionType: "text",
            order: 1
          },
          {
            question: "What is your email address?",
            questionType: "text", 
            order: 2
          },
          {
            question: "What is your phone number?",
            questionType: "text",
            order: 3
          }
        ]
      },
      {
        title: "Property Preferences",
        order: 2,
        questions: [
          {
            question: "What type of property are you looking for?",
            questionType: "text",
            order: 1
          },
          {
            question: "How important is location to you?",
            questionType: "ranking",
            order: 2
          },
          {
            question: "Do you prefer a house or apartment?",
            questionType: "yesno",
            order: 3
          },
          {
            question: "How important is having a garden?",
            questionType: "ranking",
            order: 4
          }
        ]
      },
      {
        title: "Budget & Timeline",
        order: 3,
        questions: [
          {
            question: "What is your budget range?",
            questionType: "text",
            order: 1
          },
          {
            question: "When do you hope to purchase?",
            questionType: "text",
            order: 2
          },
          {
            question: "Are you pre-approved for a mortgage?",
            questionType: "yesno",
            order: 3
          }
        ]
      }
    ]
    
    for (const sectionData of sections) {
      const { questions, ...sectionInfo } = sectionData
      
      const section = await prisma.questionnaireSection.create({
        data: {
          ...sectionInfo,
          userId: user.id
        }
      })
      
      console.log(`✅ Created section: ${section.title}`)
      
      for (const questionData of questions) {
        await prisma.questionnaireQuestion.create({
          data: {
            ...questionData,
            sectionId: section.id
          }
        })
        
        console.log(`  ✅ Created question: ${questionData.question} (${questionData.questionType})`)
      }
    }
    
    console.log('🎉 User and questionnaire structure created successfully!')
    console.log('You can now log in with: admin@ponte.com')
    
  } catch (error) {
    console.error('❌ Error creating user and questionnaire:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createUserAndQuestionnaire()
  .catch((error) => {
    console.error('Creation failed:', error)
    process.exit(1)
  })
