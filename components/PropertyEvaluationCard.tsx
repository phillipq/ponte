"use client"

import { useState, useEffect } from "react"
import { EVALUATION_CATEGORIES, calculateCategoryScore, getScoreColor, getScoreBgColor, formatPercentage } from "lib/property-evaluation"

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

interface PropertyEvaluationCardProps {
  evaluation: PropertyEvaluation
  onUpdateItem: (itemId: string, updates: Partial<PropertyEvaluationItem>) => void
  onDelete: (evaluationId: string) => void
}

export default function PropertyEvaluationCard({ evaluation, onUpdateItem, onDelete }: PropertyEvaluationCardProps) {
  const [activeTab, setActiveTab] = useState("LEGAL_STATUS")
  const [editingItem, setEditingItem] = useState<string | null>(null)

  const getCategoryItems = (categoryName: string) => {
    return evaluation.evaluationItems.filter(item => item.category === categoryName)
  }

  const getCategoryScore = (categoryName: string) => {
    const items = getCategoryItems(categoryName)
    return calculateCategoryScore(items)
  }

  const handleScoreChange = (itemId: string, score: number) => {
    onUpdateItem(itemId, { score })
  }

  const exportToExcel = (evaluation: PropertyEvaluation) => {
    // Create Excel data structure
    const excelData = []
    
    // Add header row
    excelData.push([
      "Category",
      "Item",
      "Score",
      "Notes",
      "Date",
      "Evaluated By"
    ])
    
    // Add evaluation items
    evaluation.evaluationItems.forEach(item => {
      excelData.push([
        item.category,
        item.item,
        item.score,
        item.notes || "",
        item.date || "",
        item.evaluatedBy || ""
      ])
    })
    
    // Add summary row
    excelData.push([
      "TOTAL",
      "",
      evaluation.totalScore,
      "",
      "",
      ""
    ])
    
    // Convert to CSV and download
    const csvContent = excelData.map(row => 
      row.map(cell => `"${cell}"`).join(",")
    ).join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `evaluation-${evaluation.id}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleNotesChange = (itemId: string, notes: string) => {
    onUpdateItem(itemId, { notes })
  }

  const handleEvaluatedByChange = (itemId: string, evaluatedBy: string) => {
    onUpdateItem(itemId, { evaluatedBy })
  }

  const handleDateChange = (itemId: string, date: string) => {
    onUpdateItem(itemId, { date })
  }

  const categories = [
    { key: "LEGAL_STATUS", name: "Legal Status", items: EVALUATION_CATEGORIES.LEGAL_STATUS.items },
    { key: "SEISMIC_ACTIVITY", name: "Seismic Activity", items: EVALUATION_CATEGORIES.SEISMIC_ACTIVITY.items },
    { key: "FOUNDATION_CONDITION", name: "Foundation Condition", items: EVALUATION_CATEGORIES.FOUNDATION_CONDITION.items },
    { key: "HOME_INSPECTION", name: "Home Inspection", items: EVALUATION_CATEGORIES.HOME_INSPECTION.items },
    { key: "SERVICE_SUPPLIER", name: "Service Supplier", items: EVALUATION_CATEGORIES.SERVICE_SUPPLIER.items },
    { key: "GROUNDS_GARDENS", name: "Grounds/Gardens", items: EVALUATION_CATEGORIES.GROUNDS_GARDENS.items }
  ]

  const activeCategory = categories.find(cat => cat.key === activeTab)
  const activeItems = getCategoryItems(activeTab)
  const categoryScore = getCategoryScore(activeTab)

  return (
    <div className="bg-white rounded-lg shadow border border-ponte-sand">
      {/* Header */}
      <div className="bg-ponte-sand px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ponte-black font-header">
              PROPERTY EVALUATION REPORT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <span className="font-medium text-ponte-black">Client Name:</span>
                <span className="ml-2 text-ponte-olive">{evaluation.clientName || "Not specified"}</span>
              </div>
              <div>
                <span className="font-medium text-ponte-black">Date:</span>
                <span className="ml-2 text-ponte-olive">{new Date(evaluation.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-ponte-black">Created by:</span>
                <span className="ml-2 text-ponte-olive">{evaluation.createdBy}</span>
              </div>
              <div>
                <span className="font-medium text-ponte-black">Property Address:</span>
                <span className="ml-2 text-ponte-olive">{evaluation.propertyAddress || "Not specified"}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getScoreBgColor(evaluation.overallPercentage)} ${getScoreColor(evaluation.overallPercentage)}`}>
              {formatPercentage(evaluation.overallPercentage)}
            </div>
            <p className="text-sm text-ponte-olive mt-1 font-body">
              {evaluation.totalScore.toFixed(1)} / {evaluation.maxScore.toFixed(1)} points
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => exportToExcel(evaluation)}
                className="bg-ponte-olive text-white px-3 py-1 rounded text-xs hover:bg-ponte-olive/90 transition-colors font-body"
                title="Export to Excel"
              >
                📊 Export
              </button>
              <button
                onClick={() => onDelete(evaluation.id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors font-body"
                title="Delete Evaluation"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-ponte-sand">
        <div className="flex flex-wrap">
          {categories.map((category) => {
            const score = getCategoryScore(category.key)
            return (
              <button
                key={category.key}
                onClick={() => setActiveTab(category.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === category.key
                    ? "border-ponte-terracotta text-ponte-terracotta bg-ponte-cream"
                    : "border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{category.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getScoreBgColor(score.percentage)} ${getScoreColor(score.percentage)}`}>
                    {formatPercentage(score.percentage)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Content */}
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-ponte-black font-header mb-2">
            {activeCategory?.name}
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-ponte-olive font-body">
                Score: {categoryScore.totalScore.toFixed(1)} / {categoryScore.maxScore.toFixed(1)}
              </span>
              <div className="w-32 bg-ponte-sand rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreBgColor(categoryScore.percentage)}`}
                  style={{ width: `${Math.min(categoryScore.percentage, 100)}%` }}
                ></div>
              </div>
              <span className={`text-sm font-medium ${getScoreColor(categoryScore.percentage)}`}>
                {formatPercentage(categoryScore.percentage)}
              </span>
            </div>
          </div>
        </div>

        {/* Evaluation Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-ponte-cream">
                <th className="border border-ponte-sand px-4 py-3 text-left text-sm font-semibold text-ponte-black font-header">
                  CATEGORIES
                </th>
                <th className="border border-ponte-sand px-4 py-3 text-left text-sm font-semibold text-ponte-black font-header">
                  NOTES
                </th>
                <th className="border border-ponte-sand px-4 py-3 text-center text-sm font-semibold text-ponte-black font-header">
                  SCORE (1 to 10)
                </th>
                <th className="border border-ponte-sand px-4 py-3 text-center text-sm font-semibold text-ponte-black font-header">
                  DATE
                </th>
                <th className="border border-ponte-sand px-4 py-3 text-center text-sm font-semibold text-ponte-black font-header">
                  EVALUATED BY
                </th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-ponte-cream/50">
                  <td className="border border-ponte-sand px-4 py-3 text-sm text-ponte-black font-body">
                    <div className="flex items-start">
                      <span className="font-medium mr-2">{index + 1}.</span>
                      <span>{item.item}</span>
                    </div>
                  </td>
                  <td className="border border-ponte-sand px-4 py-3">
                    <textarea
                      value={item.notes || ""}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      placeholder="Add notes..."
                      className="w-full text-sm border-0 resize-none focus:ring-0 focus:outline-none bg-transparent font-body"
                      rows={2}
                    />
                  </td>
                  <td className="border border-ponte-sand px-4 py-3 text-center">
                    <select
                      value={item.score}
                      onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value))}
                      className="text-sm border border-ponte-sand rounded px-2 py-1 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-ponte-sand px-4 py-3 text-center">
                    <input
                      type="date"
                      value={item.date ? new Date(item.date).toISOString().split('T')[0] : ""}
                      onChange={(e) => handleDateChange(item.id, e.target.value)}
                      className="text-sm border border-ponte-sand rounded px-2 py-1 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                    />
                  </td>
                  <td className="border border-ponte-sand px-4 py-3 text-center">
                    <input
                      type="text"
                      value={item.evaluatedBy || ""}
                      onChange={(e) => handleEvaluatedByChange(item.id, e.target.value)}
                      placeholder="Evaluator name"
                      className="text-sm border border-ponte-sand rounded px-2 py-1 focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category Summary */}
        <div className="mt-4 p-4 bg-ponte-cream rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ponte-black font-header">
              {activeCategory?.name} Summary
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-ponte-olive font-body">
                Items: {activeItems.length}
              </span>
              <span className="text-sm text-ponte-olive font-body">
                Scored: {activeItems.filter(item => item.score > 0).length}
              </span>
              <span className={`text-sm font-medium ${getScoreColor(categoryScore.percentage)}`}>
                {formatPercentage(categoryScore.percentage)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
