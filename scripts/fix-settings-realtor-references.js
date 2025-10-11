const fs = require('fs')
const path = require('path')

const filePath = '/mnt/storage/projects/app-ponte/app/settings/page.tsx'

// Read the file
let content = fs.readFileSync(filePath, 'utf8')

// Define replacements
const replacements = [
  // State variables
  { from: 'setRealtorSubmitting', to: 'setPartnerSubmitting' },
  { from: 'setRealtorError', to: 'setPartnerError' },
  { from: 'setEditingRealtor', to: 'setEditingPartner' },
  { from: 'setEditRealtor', to: 'setEditPartner' },
  { from: 'setEditRealtorError', to: 'setEditPartnerError' },
  { from: 'setEditRealtorSubmitting', to: 'setEditPartnerSubmitting' },
  { from: 'fetchRealtors', to: 'fetchPartners' },
  { from: 'toggleRealtorStatus', to: 'togglePartnerStatus' },
  
  // Variable references
  { from: 'realtorError', to: 'partnerError' },
  { from: 'realtorSubmitting', to: 'partnerSubmitting' },
  { from: 'realtorLoading', to: 'partnerLoading' },
  { from: 'realtors', to: 'partners' },
  { from: 'editingRealtor', to: 'editingPartner' },
  { from: 'editRealtor', to: 'editPartner' },
  { from: 'editRealtorError', to: 'editPartnerError' },
  { from: 'editRealtorSubmitting', to: 'editPartnerSubmitting' },
  
  // Function names
  { from: 'handleAddRealtor', to: 'handleAddPartner' },
  { from: 'startEditRealtor', to: 'startEditPartner' },
  { from: 'cancelEditRealtor', to: 'cancelEditPartner' },
  { from: 'handleEditRealtor', to: 'handleEditPartner' },
  { from: 'deleteRealtor', to: 'deletePartner' },
]

// Apply replacements
replacements.forEach(({ from, to }) => {
  const regex = new RegExp(`\\b${from}\\b`, 'g')
  content = content.replace(regex, to)
})

// Write back to file
fs.writeFileSync(filePath, content, 'utf8')

console.log('✅ Fixed all realtor references in settings page')
console.log('Replaced:')
replacements.forEach(({ from, to }) => {
  console.log(`  ${from} → ${to}`)
})
