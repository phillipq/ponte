"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "components/Button"
import Navigation from "components/Navigation"

interface Questionnaire {
  id: string
  name: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  sections: QuestionnaireSection[]
}

interface QuestionnaireSection {
  id: string
  title: string
  order: number
  questions: QuestionnaireQuestion[]
}

interface QuestionnaireQuestion {
  id: string
  question: string
  order: number
  sectionId: string
}

export default function QuestionnaireDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const questionnaireId = params.id as string

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<QuestionnaireSection | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null)
  const [newSection, setNewSection] = useState({ title: "", order: 0 })
  const [newQuestion, setNewQuestion] = useState({ question: "", order: 0 })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (questionnaireId) {
      fetchQuestionnaire()
    }
  }, [questionnaireId])

  const fetchQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaires/${questionnaireId}`)
      if (response.ok) {
        const data = await response.json() as { questionnaire: Questionnaire }
        setQuestionnaire(data.questionnaire)
        // Expand all sections by default
        setExpandedSections(new Set(data.questionnaire.sections.map(s => s.id)))
      } else {
        setError("Questionnaire not found")
      }
    } catch (error) {
      console.error("Error fetching questionnaire:", error)
      setError("Failed to load questionnaire")
    } finally {
      setLoading(false)
    }
  }

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/questionnaire/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newSection.title,
          order: newSection.order,
          questionnaireId: questionnaireId
        }),
      })

      if (response.ok) {
        await fetchQuestionnaire()
        setNewSection({ title: "", order: 0 })
        setShowAddSection(false)
      } else {
        const data = await response.json() as { error?: string }
        setError(data.error || "Failed to create section")
      }
    } catch (error) {
      setError("Failed to create section")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/questionnaire/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: newQuestion.question,
          order: newQuestion.order,
          sectionId: showAddQuestion
        }),
      })

      if (response.ok) {
        await fetchQuestionnaire()
        setNewQuestion({ question: "", order: 0 })
        setShowAddQuestion(null)
      } else {
        const data = await response.json() as { error?: string }
        setError(data.error || "Failed to create question")
      }
    } catch (error) {
      setError("Failed to create question")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section? This will also delete all questions in this section.")) {
      return
    }

    try {
      const response = await fetch(`/api/questionnaire/sections/${sectionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchQuestionnaire()
      } else {
        setError("Failed to delete section")
      }
    } catch (error) {
      setError("Failed to delete section")
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return
    }

    try {
      const response = await fetch(`/api/questionnaire/questions/${questionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchQuestionnaire()
      } else {
        setError("Failed to delete question")
      }
    } catch (error) {
      setError("Failed to delete question")
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ponte-terracotta"></div>
          <p className="mt-4 text-ponte-olive">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-ponte-cream">
        <Navigation />
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ponte-black">Questionnaire Not Found</h1>
            <p className="mt-2 text-ponte-olive">The questionnaire you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push("/questionnaire")}
              className="mt-4 px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600"
            >
              Back to Questionnaires
            </button>
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
                onClick={() => router.push("/questionnaire")}
                className="mr-4 p-2 text-ponte-olive hover:text-ponte-black hover:bg-ponte-sand rounded-md"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-ponte-black">{questionnaire.name}</h1>
                <p className="mt-2 text-ponte-olive">
                  {questionnaire.description || "No description provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {questionnaire.isDefault && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Default Questionnaire
                </span>
              )}
              <Button
                onClick={() => setShowAddSection(true)}
                className="bg-ponte-terracotta hover:bg-accent-600"
              >
                Add Section
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {questionnaire.sections.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-ponte-sand p-8 text-center">
              <p className="text-ponte-olive mb-4">No sections yet</p>
              <Button onClick={() => setShowAddSection(true)}>
                Create Your First Section
              </Button>
            </div>
          ) : (
            questionnaire.sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow border border-ponte-sand">
                <div 
                  className="p-6 cursor-pointer hover:bg-ponte-sand"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-ponte-black">{section.title}</h3>
                      <span className="ml-3 text-sm text-ponte-olive">
                        ({section.questions.length} questions)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAddQuestion(section.id)
                        }}
                        className="text-ponte-terracotta hover:text-accent-600 text-sm"
                      >
                        Add Question
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSection(section)
                        }}
                        className="text-ponte-olive hover:text-ponte-black text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSection(section.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                      <span className="text-ponte-olive">
                        {expandedSections.has(section.id) ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedSections.has(section.id) && (
                  <div className="border-t border-ponte-sand">
                    {section.questions.length === 0 ? (
                      <div className="p-6 text-center text-ponte-olive">
                        No questions in this section
                      </div>
                    ) : (
                      <div className="p-6 space-y-3">
                        {section.questions.map((question) => (
                          <div key={question.id} className="flex items-center justify-between p-3 bg-ponte-sand rounded-md">
                            <div className="flex items-center">
                              <span className="text-sm text-ponte-olive mr-3">#{question.order}</span>
                              <span className="text-ponte-black">{question.question}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingQuestion(question)}
                                className="text-ponte-olive hover:text-ponte-black text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Section Modal */}
        {showAddSection && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-ponte-black">Add New Section</h3>
                  <button
                    onClick={() => setShowAddSection(false)}
                    className="text-ponte-olive hover:text-ponte-black"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddSection} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-ponte-black">
                      Section Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newSection.title}
                      onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      placeholder="e.g., Basic Information, Property Preferences"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="order" className="block text-sm font-medium text-ponte-black">
                      Order
                    </label>
                    <input
                      type="number"
                      id="order"
                      value={newSection.order}
                      onChange={(e) => setNewSection({ ...newSection, order: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      min="0"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAddSection(false)}
                      className="px-4 py-2 border border-ponte-sand text-ponte-black rounded-md hover:bg-ponte-sand"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
                    >
                      {submitting ? "Creating..." : "Create Section"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Question Modal */}
        {showAddQuestion && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-ponte-black">Add New Question</h3>
                  <button
                    onClick={() => setShowAddQuestion(null)}
                    className="text-ponte-olive hover:text-ponte-black"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <label htmlFor="question" className="block text-sm font-medium text-ponte-black">
                      Question Text *
                    </label>
                    <textarea
                      id="question"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="order" className="block text-sm font-medium text-ponte-black">
                      Order
                    </label>
                    <input
                      type="number"
                      id="order"
                      value={newQuestion.order}
                      onChange={(e) => setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      min="0"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAddQuestion(null)}
                      className="px-4 py-2 border border-ponte-sand text-ponte-black rounded-md hover:bg-ponte-sand"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
                    >
                      {submitting ? "Creating..." : "Create Question"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
