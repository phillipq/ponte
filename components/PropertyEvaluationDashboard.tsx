"use client"

import { useState, useEffect } from "react"
import { EVALUATION_CATEGORIES, calculateCategoryScore, getScoreColor, getScoreBgColor, formatPercentage } from "lib/property-evaluation"
import PropertyEvaluationCard from "./PropertyEvaluationCard"

interface PropertyEvaluationItem {
  id: string
  category: string
  item: string
  notes?: string
  score: number
  date?: string
  evaluatedBy?: string
}

interface PropertyEvaluation {
  id: string
  propertyId: string
  clientName?: string
  date: string
  createdBy: string
  propertyAddress?: string
  totalScore: number
  maxScore: number
  overallPercentage: number
  evaluationItems: PropertyEvaluationItem[]
}

interface PropertyEvaluationDashboardProps {
  propertyId: string
  propertyName: string
}

export default function PropertyEvaluationDashboard({ propertyId, propertyName }: PropertyEvaluationDashboardProps) {
  const [evaluations, setEvaluations] = useState<PropertyEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvaluation, setNewEvaluation] = useState({
    clientName: "",
    propertyAddress: "",
    createdBy: ""
  })

  useEffect(() => {
    fetchEvaluations()
  }, [propertyId])

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/evaluations`)
      
      if (response.ok) {
        const data = await response.json()
        setEvaluations(data.evaluations || [])
      } else {
        setError("Failed to load evaluations")
      }
    } catch (error) {
      setError("Failed to load evaluations")
    } finally {
      setLoading(false)
    }
  }

  const createEvaluation = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvaluation)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewEvaluation({ clientName: "", propertyAddress: "", createdBy: "" })
        fetchEvaluations()
      } else {
        setError("Failed to create evaluation")
      }
    } catch (error) {
      setError("Failed to create evaluation")
    }
  }

  const updateEvaluationItem = async (itemId: string, updates: Partial<PropertyEvaluationItem>) => {
    try {
      // Find the evaluation that contains this item
      const evaluation = evaluations.find(evaluationItem => 
        evaluationItem.evaluationItems.some(item => item.id === itemId)
      )
      
      if (!evaluation) {
        setError("Evaluation not found")
        return
      }

      const response = await fetch(`/api/properties/${propertyId}/evaluations/${evaluation.id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: itemId,
            ...updates
          }]
        })
      })

      if (response.ok) {
        fetchEvaluations()
      } else {
        setError("Failed to update evaluation item")
      }
    } catch (error) {
      setError("Failed to update evaluation item")
    }
  }

  const getCategoryItems = (evaluation: PropertyEvaluation, categoryName: string) => {
    return evaluation.evaluationItems.filter(item => item.category === categoryName)
  }

  const getCategoryScore = (evaluation: PropertyEvaluation, categoryName: string) => {
    const items = getCategoryItems(evaluation, categoryName)
    return calculateCategoryScore(items)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-ponte-cream rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-ponte-cream rounded"></div>
            <div className="h-4 bg-ponte-cream rounded"></div>
            <div className="h-4 bg-ponte-cream rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-ponte-black font-header">
          Property Evaluation Dashboard
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-ponte-terracotta text-white px-4 py-2 rounded-lg hover:bg-ponte-terracotta/90 transition-colors font-body"
        >
          New Evaluation
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-ponte-cream rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-ponte-black mb-4 font-header">Create New Evaluation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-ponte-black mb-1 font-body">Client Name</label>
              <input
                type="text"
                value={newEvaluation.clientName}
                onChange={(e) => setNewEvaluation({...newEvaluation, clientName: e.target.value})}
                className="w-full border border-ponte-sand rounded-md px-3 py-2 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                placeholder="Enter client name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black mb-1 font-body">Property Address</label>
              <input
                type="text"
                value={newEvaluation.propertyAddress}
                onChange={(e) => setNewEvaluation({...newEvaluation, propertyAddress: e.target.value})}
                className="w-full border border-ponte-sand rounded-md px-3 py-2 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                placeholder="Enter property address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black mb-1 font-body">Created By</label>
              <input
                type="text"
                value={newEvaluation.createdBy}
                onChange={(e) => setNewEvaluation({...newEvaluation, createdBy: e.target.value})}
                className="w-full border border-ponte-sand rounded-md px-3 py-2 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                placeholder="Enter evaluator name"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createEvaluation}
              className="bg-ponte-terracotta text-white px-4 py-2 rounded-lg hover:bg-ponte-terracotta/90 transition-colors font-body"
            >
              Create Evaluation
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-ponte-sand text-ponte-black px-4 py-2 rounded-lg hover:bg-ponte-sand/90 transition-colors font-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {evaluations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-ponte-olive font-body">No evaluations found. Create your first evaluation to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {evaluations.map((evaluation) => (
            <PropertyEvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              onUpdateItem={updateEvaluationItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
