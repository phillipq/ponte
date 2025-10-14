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
  onEvaluationChange?: () => void
}

export default function PropertyEvaluationDashboard({ propertyId, propertyName, onEvaluationChange }: PropertyEvaluationDashboardProps) {
  const [evaluations, setEvaluations] = useState<PropertyEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvaluation, setNewEvaluation] = useState({
    clientName: "",
    propertyAddress: "",
    createdBy: ""
  })
  const [showImportForm, setShowImportForm] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [updateTimeouts, setUpdateTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    fetchEvaluations()
  }, [propertyId])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      updateTimeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [updateTimeouts])

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/evaluations`)
      
      if (response.ok) {
        const data = await response.json() as { evaluations?: PropertyEvaluation[] }
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
        onEvaluationChange?.() // Notify parent of evaluation change
      } else {
        setError("Failed to create evaluation")
      }
    } catch (error) {
      setError("Failed to create evaluation")
    }
  }

  const updateEvaluationItem = async (itemId: string, updates: Partial<PropertyEvaluationItem>) => {
    // Clear existing timeout for this item
    const existingTimeout = updateTimeouts.get(itemId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Find the evaluation that contains this item
    const evaluation = evaluations.find(evaluationItem => 
      evaluationItem.evaluationItems.some(item => item.id === itemId)
    )
    
    if (!evaluation) {
      setError("Evaluation not found")
      return
    }

    // Optimistic update - update the UI immediately
    setEvaluations(prevEvaluations => 
      prevEvaluations.map(evaluationItem => {
        if (evaluationItem.id === evaluation.id) {
          const updatedItems = evaluationItem.evaluationItems.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
          
          // Recalculate totals
          const totalScore = updatedItems.reduce((sum, item) => sum + item.score, 0)
          const maxScore = updatedItems.length * 10
          const overallPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
          
          return {
            ...evaluationItem,
            evaluationItems: updatedItems,
            totalScore,
            maxScore,
            overallPercentage
          }
        }
        return evaluationItem
      })
    )

    // Debounce the server update
    const timeout = setTimeout(async () => {
      try {
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

        if (!response.ok) {
          // Revert optimistic update on error
          fetchEvaluations()
          setError("Failed to update evaluation item")
        } else {
          // Notify parent of evaluation change on successful update
          onEvaluationChange?.()
        }
      } catch (error) {
        // Revert optimistic update on error
        fetchEvaluations()
        setError("Failed to update evaluation item")
      }
    }, 500) // 500ms debounce

    // Store the timeout
    setUpdateTimeouts(prev => {
      const newMap = new Map(prev)
      newMap.set(itemId, timeout)
      return newMap
    })
  }

  const deleteEvaluation = async (evaluationId: string) => {
    if (!confirm("Are you sure you want to delete this evaluation? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}/evaluations/${evaluationId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchEvaluations()
        onEvaluationChange?.() // Notify parent of evaluation change
      } else {
        setError("Failed to delete evaluation")
      }
    } catch (error) {
      setError("Failed to delete evaluation")
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setError("Please select a file to import")
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", importFile)

      const response = await fetch(`/api/properties/${propertyId}/evaluations/import`, {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        setShowImportForm(false)
        setImportFile(null)
        fetchEvaluations()
        onEvaluationChange?.() // Notify parent of evaluation change
      } else {
        const errorData = await response.json() as { error?: string }
        setError(errorData.error || "Failed to import evaluation")
      }
    } catch (error) {
      setError("Failed to import evaluation")
    } finally {
      setImporting(false)
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportForm(true)}
            className="bg-ponte-olive text-white px-4 py-2 rounded-lg hover:bg-ponte-olive/90 transition-colors font-body"
          >
            📊 Import Excel
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-ponte-terracotta text-white px-4 py-2 rounded-lg hover:bg-ponte-terracotta/90 transition-colors font-body"
          >
            New Evaluation
          </button>
        </div>
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

      {showImportForm && (
        <div className="bg-ponte-cream rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-ponte-black mb-4 font-header">Import Evaluation from Excel</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-ponte-black mb-2 font-body">
              Select Excel/CSV File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full border border-ponte-sand rounded-md px-3 py-2 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
            />
            <p className="text-xs text-ponte-olive mt-1 font-body">
              Supported formats: .xlsx, .xls, .csv. Supports Ponte evaluation format, table format, and field-value format. Avoid merged cells for best results.
            </p>
            <div className="mt-2 p-3 bg-ponte-sand rounded text-xs text-ponte-black">
              <strong>Ponte Evaluation Format (Recommended):</strong><br/>
              <div className="mt-1 text-xs">
                <div>Client Name: [Client Name]</div>
                <div>Date: [Date]</div>
                <div>Created by: [Evaluator Name]</div>
                <div>Property Address: [Address]</div>
                <div className="mt-2">
                  <table className="w-full">
                    <thead>
                      <tr><td className="font-bold">CATEGORIES</td><td className="font-bold">NOTES</td><td className="font-bold">SCORE (1 to 10)</td><td className="font-bold">DATE</td></tr>
                    </thead>
                    <tbody>
                      <tr><td>LEGAL STATUS</td><td></td><td></td><td></td></tr>
                      <tr><td>1. Liens on property...</td><td>Notes here</td><td>8</td><td>2024-01-15</td></tr>
                      <tr><td>2. Notary selected...</td><td>More notes</td><td>7</td><td>2024-01-15</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <br/>
              <strong>Other Supported Formats:</strong><br/>
              <div className="mt-1 text-xs">
                <strong>Table Format:</strong> Category | Item | Score | Notes<br/>
                <strong>Field-Value Format:</strong> Field | Value
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="bg-ponte-olive text-white px-4 py-2 rounded-lg hover:bg-ponte-olive/90 transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "Import Evaluation"}
            </button>
            <button
              onClick={() => {
                setShowImportForm(false)
                setImportFile(null)
              }}
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
              onDelete={deleteEvaluation}
            />
          ))}
        </div>
      )}
    </div>
  )
}
