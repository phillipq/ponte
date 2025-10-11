const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupQuestionnaireSchema() {
  try {
    console.log('🧹 Starting questionnaire schema cleanup...')

    // 1. Remove questionnaireId from sections (set to null)
    console.log('📝 Removing questionnaire associations from sections...')
    const updateResult = await prisma.questionnaireSection.updateMany({
      data: {
        questionnaireId: null
      }
    })
    console.log(`✅ Updated ${updateResult.count} sections`)

    // 2. Delete all questionnaires (since we're using single questionnaire)
    console.log('🗑️ Deleting all questionnaires...')
    const deleteQuestionnaires = await prisma.questionnaire.deleteMany({})
    console.log(`✅ Deleted ${deleteQuestionnaires.count} questionnaires`)

    // 3. Show current section count
    const sectionCount = await prisma.questionnaireSection.count()
    console.log(`📊 Current sections: ${sectionCount}`)

    // 4. Show current question count
    const questionCount = await prisma.questionnaireQuestion.count()
    console.log(`📊 Current questions: ${questionCount}`)

    console.log('✅ Questionnaire schema cleanup completed!')
    console.log('📋 Next steps:')
    console.log('   1. Update your Prisma schema to remove Questionnaire model')
    console.log('   2. Run: npx prisma db push')
    console.log('   3. Run: npx prisma generate')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupQuestionnaireSchema()
