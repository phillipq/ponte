"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "components/Button"
import Navigation from "components/Navigation"

interface CleanupAnalysis {
  duplicateSections: any[]
  orphanedSections: any[]
  duplicateResponses: any[]
  emptySections: any[]
  summary: {
    duplicateSectionsCount: number
    orphanedSectionsCount: number
    duplicateResponsesCount: number
    emptySectionsCount: number
  }
}

export default function CleanupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalysis()
    }
  }, [status])

  const fetchAnalysis = async () => {
    try {
      const response = await fetch("/api/admin/cleanup")
      if (response.ok) {
        const data = await response.json() as CleanupAnalysis
        setAnalysis(data)
      } else {
        setError("Failed to fetch cleanup analysis")
      }
    } catch (error) {
      setError("Failed to fetch cleanup analysis")
    } finally {
      setLoading(false)
    }
  }

  const performCleanup = async (action: string) => {
    if (!confirm(`Are you sure you want to perform this cleanup action? This cannot be undone.`)) {
      return
    }

    setCleaning(true)
    setError("")

    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json() as { success?: boolean, results?: any, error?: string }

      if (response.ok) {
        await fetchAnalysis() // Refresh the analysis
        alert(`Cleanup completed: ${JSON.stringify(data.results)}`)
      } else {
        setError(data.error || "Cleanup failed")
      }
    } catch (error) {
      setError("Cleanup failed")
    } finally {
      setCleaning(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ponte-terracotta"></div>
          <p className="mt-4 text-ponte-olive">Loading cleanup analysis...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-ponte-cream">
        <Navigation />
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ponte-black">Cleanup Analysis Failed</h1>
            <p className="mt-2 text-ponte-olive">{error}</p>
            <Button onClick={fetchAnalysis} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin")}
                className="mr-4 p-2 text-ponte-olive hover:text-ponte-black hover:bg-ponte-sand rounded-md"
              >
                ← Back to Admin
              </button>
              <div>
                <h1 className="text-3xl font-bold text-ponte-black">Database Cleanup</h1>
                <p className="mt-2 text-ponte-olive">Clean up duplicate and orphaned data</p>
              </div>
            </div>
            <Button onClick={fetchAnalysis} intent="secondary">
              Refresh Analysis
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h3 className="text-lg font-semibold text-ponte-black">Duplicate Sections</h3>
            <p className="text-3xl font-bold text-ponte-terracotta mt-2">
              {analysis.summary.duplicateSectionsCount}
            </p>
            <p className="text-sm text-ponte-olive mt-1">Sections with same title</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h3 className="text-lg font-semibold text-ponte-black">Orphaned Sections</h3>
            <p className="text-3xl font-bold text-ponte-terracotta mt-2">
              {analysis.summary.orphanedSectionsCount}
            </p>
            <p className="text-sm text-ponte-olive mt-1">Sections without questionnaire</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h3 className="text-lg font-semibold text-ponte-black">Duplicate Responses</h3>
            <p className="text-3xl font-bold text-ponte-terracotta mt-2">
              {analysis.summary.duplicateResponsesCount}
            </p>
            <p className="text-sm text-ponte-olive mt-1">Client response duplicates</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h3 className="text-lg font-semibold text-ponte-black">Empty Sections</h3>
            <p className="text-3xl font-bold text-ponte-terracotta mt-2">
              {analysis.summary.emptySectionsCount}
            </p>
            <p className="text-sm text-ponte-olive mt-1">Sections with no questions</p>
          </div>
        </div>

        {/* Cleanup Actions */}
        <div className="space-y-6">
          {/* Orphaned Sections */}
          {analysis.orphanedSections.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-ponte-black">Orphaned Sections</h3>
                  <p className="text-sm text-ponte-olive">
                    {analysis.orphanedSections.length} sections without a questionnaire
                  </p>
                </div>
                <Button
                  onClick={() => performCleanup('removeOrphanedSections')}
                  disabled={cleaning}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cleaning ? "Cleaning..." : "Remove Orphaned Sections"}
                </Button>
              </div>
              <div className="space-y-2">
                {analysis.orphanedSections.map((section, index) => (
                  <div key={index} className="p-3 bg-ponte-sand rounded-md">
                    <p className="font-medium text-ponte-black">{section.title}</p>
                    <p className="text-sm text-ponte-olive">
                      {section.questions.length} questions • Created: {new Date(section.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Sections */}
          {analysis.emptySections.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-ponte-black">Empty Sections</h3>
                  <p className="text-sm text-ponte-olive">
                    {analysis.emptySections.length} sections with no questions
                  </p>
                </div>
                <Button
                  onClick={() => performCleanup('removeEmptySections')}
                  disabled={cleaning}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cleaning ? "Cleaning..." : "Remove Empty Sections"}
                </Button>
              </div>
              <div className="space-y-2">
                {analysis.emptySections.map((section, index) => (
                  <div key={index} className="p-3 bg-ponte-sand rounded-md">
                    <p className="font-medium text-ponte-black">{section.title}</p>
                    <p className="text-sm text-ponte-olive">
                      Questionnaire: {section.questionnaire?.name || "None"} • 
                      Created: {new Date(section.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Sections */}
          {analysis.duplicateSections.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-ponte-black">Duplicate Sections</h3>
                  <p className="text-sm text-ponte-olive">
                    {analysis.duplicateSections.length} groups of duplicate sections
                  </p>
                </div>
                <Button
                  onClick={() => performCleanup('removeDuplicateSections')}
                  disabled={cleaning}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cleaning ? "Cleaning..." : "Remove Duplicate Sections"}
                </Button>
              </div>
              <div className="space-y-2">
                {analysis.duplicateSections.map((duplicate, index) => (
                  <div key={index} className="p-3 bg-ponte-sand rounded-md">
                    <p className="font-medium text-ponte-black">{duplicate.title}</p>
                    <p className="text-sm text-ponte-olive">
                      {duplicate.count} duplicates • Questionnaire ID: {duplicate.questionnaireId || "None"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Responses */}
          {analysis.duplicateResponses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-ponte-black">Duplicate Client Responses</h3>
                  <p className="text-sm text-ponte-olive">
                    {analysis.duplicateResponses.length} groups of duplicate responses
                  </p>
                </div>
                <div className="text-sm text-ponte-olive">
                  Manual cleanup required
                </div>
              </div>
              <div className="space-y-2">
                {analysis.duplicateResponses.map((duplicate, index) => (
                  <div key={index} className="p-3 bg-ponte-sand rounded-md">
                    <p className="font-medium text-ponte-black">{duplicate.email}</p>
                    <p className="text-sm text-ponte-olive">
                      {duplicate.count} duplicates • Source: {duplicate.source} • 
                      Date: {new Date(duplicate.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
