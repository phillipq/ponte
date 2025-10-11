// Property evaluation system based on Ponte evaluation framework
export interface PropertyEvaluationItem {
  id: string
  category: string
  item: string
  notes?: string
  score: number // 1-10
  date?: string
  evaluatedBy?: string
}

export interface PropertyEvaluationCategory {
  name: string
  items: PropertyEvaluationItem[]
  totalScore: number
  maxScore: number
  percentage: number
}

export interface PropertyEvaluation {
  id: string
  propertyId: string
  clientName?: string
  date: string
  createdBy: string
  propertyAddress?: string
  
  // Evaluation categories
  legalStatus: PropertyEvaluationCategory
  seismicActivity: PropertyEvaluationCategory
  foundationCondition: PropertyEvaluationCategory
  homeInspection: PropertyEvaluationCategory
  serviceSupplier: PropertyEvaluationCategory
  groundsGardens: PropertyEvaluationCategory
  
  // Overall scoring
  totalScore: number
  maxScore: number
  overallPercentage: number
  
  // Metadata
  createdAt: string
  updatedAt: string
}

// Evaluation categories and items structure
export const EVALUATION_CATEGORIES = {
  LEGAL_STATUS: {
    name: "LEGAL STATUS",
    items: [
      { id: "legal-1", item: "Liens on property or family dispute clarification" },
      { id: "legal-2", item: "Notary selected and initial property legal docs reviewed" },
      { id: "legal-3", item: "Habitable or non habitable status confirmation" },
      { id: "legal-4", item: "Assign retained PONTE Engineer and Architect" }
    ]
  },
  SEISMIC_ACTIVITY: {
    name: "PREVIOUS DECADE SEISMIC ACTIVITY REVIEW",
    items: [
      { id: "seismic-1", item: "Review records in local town hall" },
      { id: "seismic-2", item: "Meeting with retained PONTE engineer" }
    ]
  },
  FOUNDATION_CONDITION: {
    name: "FOUNDATION CONDITION",
    items: [
      { id: "foundation-1", item: "Expose foundation and assess depth and bearing capacity" },
      { id: "foundation-2", item: "Supply underpinning report (if required)" }
    ]
  },
  HOME_INSPECTION: {
    name: "HOME INSPECTION",
    items: [
      { id: "inspection-1", item: "Evaluate cracks in masonry (if required)" },
      { id: "inspection-2", item: "Check stairs and railings" },
      { id: "inspection-3", item: "Check windows and doors" },
      { id: "inspection-4", item: "Check decks and overhangs" },
      { id: "inspection-5", item: "Check out-buildings and wells" },
      { id: "inspection-6", item: "Check plumbing" },
      { id: "inspection-7", item: "Check electrical system" },
      { id: "inspection-8", item: "Check HVAC (if installed)" },
      { id: "inspection-9", item: "Check asbestos" },
      { id: "inspection-10", item: "Supply home inspection report" }
    ]
  },
  SERVICE_SUPPLIER: {
    name: "SERVICE SUPPLIER REVIEW",
    items: [
      { id: "service-1", item: "Connect with electricity provider" },
      { id: "service-2", item: "Connect with water provider" },
      { id: "service-3", item: "Connect with gas supplier" }
    ]
  },
  GROUNDS_GARDENS: {
    name: "GROUNDS OR GARDENS",
    items: [
      { id: "grounds-1", item: "Quality and stability soil" },
      { id: "grounds-2", item: "Arborist report" },
      { id: "grounds-3", item: "Vineyard / fruit tree quality control" },
      { id: "grounds-4", item: "Underground water / natural spring quality control" },
      { id: "grounds-5", item: "Invasive species report" },
      { id: "grounds-6", item: "Fencing and property line evaluation report" },
      { id: "grounds-7", item: "Swimming pool review" },
      { id: "grounds-8", item: "Decks and patio" }
    ]
  }
}

// Calculate category scores
export function calculateCategoryScore(items: PropertyEvaluationItem[]): { totalScore: number, maxScore: number, percentage: number } {
  const totalScore = items.reduce((sum, item) => sum + (item.score || 0), 0)
  const maxScore = items.length * 10 // Each item can score up to 10
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
  
  return { totalScore, maxScore, percentage }
}

// Calculate overall evaluation score
export function calculateOverallScore(categories: PropertyEvaluationCategory[]): { totalScore: number, maxScore: number, percentage: number } {
  const totalScore = categories.reduce((sum, category) => sum + category.totalScore, 0)
  const maxScore = categories.reduce((sum, category) => sum + category.maxScore, 0)
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
  
  return { totalScore, maxScore, percentage }
}

// Get score color based on percentage
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return "text-green-600"
  if (percentage >= 60) return "text-yellow-600"
  if (percentage >= 40) return "text-orange-600"
  return "text-red-600"
}

// Get score background color
export function getScoreBgColor(percentage: number): string {
  if (percentage >= 80) return "bg-green-100"
  if (percentage >= 60) return "bg-yellow-100"
  if (percentage >= 40) return "bg-orange-100"
  return "bg-red-100"
}

// Format percentage for display
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}
