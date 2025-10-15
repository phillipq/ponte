"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "components/Button"
import Navigation from "components/Navigation"

interface QuestionnaireSection {
  id: string
  title: string
  order: number
  questions: QuestionnaireQuestion[]
}

interface QuestionnaireQuestion {
  id: string
  question: string
  questionType: "text" | "ranking" | "yesno"
  order: number
  sectionId: string
}

export default function QuestionnairePage() {
  const router = useRouter()
  const [sections, setSections] = useState<QuestionnaireSection[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null)
  const [_editingSection, setEditingSection] = useState<QuestionnaireSection | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null)
  const [newSection, setNewSection] = useState({ title: "", order: 0 })
  const [newQuestion, setNewQuestion] = useState({ question: "", questionType: "text" as "text" | "ranking" | "yesno", order: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/questionnaire/sections")
      if (response.ok) {
        const data = await response.json() as { sections?: QuestionnaireSection[] }
        setSections(data.sections || [])
        // Keep all sections collapsed by default
        setExpandedSections(new Set())
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
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
          order: newSection.order
        }),
      })

      if (response.ok) {
        await fetchSections()
        setNewSection({ title: "", order: 0 })
        setShowAddSection(false)
      } else {
        const data = await response.json() as { error?: string }
        setError(data.error || "Failed to create section")
      }
    } catch {
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
          questionType: newQuestion.questionType,
          order: newQuestion.order,
          sectionId: showAddQuestion
        }),
      })

      if (response.ok) {
        await fetchSections()
        setNewQuestion({ question: "", questionType: "text", order: 0 })
        setShowAddQuestion(null)
      } else {
        const data = await response.json() as { error?: string }
        setError(data.error || "Failed to create question")
      }
    } catch {
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
        await fetchSections()
      } else {
        setError("Failed to delete section")
      }
    } catch {
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
        await fetchSections()
      } else {
        setError("Failed to delete question")
      }
    } catch {
      setError("Failed to delete question")
    }
  }

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuestion) return

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/questionnaire/questions/${editingQuestion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: newQuestion.question,
          questionType: newQuestion.questionType,
          order: newQuestion.order
        }),
      })

      if (response.ok) {
        await fetchSections()
        setNewQuestion({ question: "", questionType: "text", order: 0 })
        setEditingQuestion(null)
      } else {
        const data = await response.json() as { error?: string }
        setError(data.error || "Failed to update question")
      }
    } catch {
      setError("Failed to update question")
    } finally {
      setSubmitting(false)
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

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image 
                src="/logos/icon-questionnaire.png" 
                alt="Questionnaire Icon" 
                width={32}
                height={32}
                className="w-8 h-8 mr-3"
              />
              <div>
                <h1 className="text-3xl font-bold text-ponte-black">Questionnaire</h1>
                <p className="mt-2 text-ponte-olive">Manage your client questionnaire sections and questions</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setShowAddSection(true)}
                className="bg-ponte-terracotta hover:bg-accent-600"
              >
                Add Section
              </Button>
              <Button 
                onClick={() => router.push('/questionnaire/questions/import')} 
                intent="secondary"
              >
                Import Questions
              </Button>
              <Button 
                onClick={() => router.push('/questionnaire/import')} 
                intent="secondary"
              >
                Import Responses
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
          {sections.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-ponte-sand p-8 text-center">
              <p className="text-ponte-olive mb-4">No sections yet</p>
              <Button onClick={() => setShowAddSection(true)}>
                Create Your First Section
              </Button>
            </div>
          ) : (
            sections.map((section) => (
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
                          <div key={question.id} className="flex items-center justify-between p-3 bg-white border border-ponte-sand rounded-md">
                            <div className="flex items-center">
                              <span className="text-sm text-ponte-olive mr-3">#{question.order}</span>
                              <span className="text-ponte-black">{question.question}</span>
                              <span className="ml-3 px-2 py-1 text-xs rounded-full bg-ponte-olive/20 text-ponte-olive">
                                {question.questionType === "text" && "Text"}
                                {question.questionType === "ranking" && "Ranking (1-5)"}
                                {question.questionType === "yesno" && "Yes/No"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingQuestion(question)
                                  setNewQuestion({
                                    question: question.question,
                                    questionType: question.questionType,
                                    order: question.order
                                  })
                                }}
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
                    <label htmlFor="questionType" className="block text-sm font-medium text-ponte-black">
                      Question Type *
                    </label>
                    <select
                      id="questionType"
                      value={newQuestion.questionType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value as "text" | "ranking" | "yesno" })}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      required
                    >
                      <option value="text">Text Input</option>
                      <option value="ranking">Ranking (1-5)</option>
                      <option value="yesno">Yes/No</option>
                    </select>
                    <p className="mt-1 text-sm text-ponte-olive">
                      {newQuestion.questionType === "text" && "Free text response"}
                      {newQuestion.questionType === "ranking" && "Scale from 1 (lowest) to 5 (highest)"}
                      {newQuestion.questionType === "yesno" && "Simple Yes or No response"}
                    </p>
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

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-ponte-black">Edit Question</h3>
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="text-ponte-olive hover:text-ponte-black"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleEditQuestion} className="space-y-4">
                  <div>
                    <label htmlFor="edit-question" className="block text-sm font-medium text-ponte-black">
                      Question Text *
                    </label>
                    <textarea
                      id="edit-question"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-questionType" className="block text-sm font-medium text-ponte-black">
                      Question Type *
                    </label>
                    <select
                      id="edit-questionType"
                      value={newQuestion.questionType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value as "text" | "ranking" | "yesno" })}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      required
                    >
                      <option value="text">Text Input</option>
                      <option value="ranking">Ranking (1-5)</option>
                      <option value="yesno">Yes/No</option>
                    </select>
                    <p className="mt-1 text-sm text-ponte-olive">
                      {newQuestion.questionType === "text" && "Free text response"}
                      {newQuestion.questionType === "ranking" && "Scale from 1 (lowest) to 5 (highest)"}
                      {newQuestion.questionType === "yesno" && "Simple Yes or No response"}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="edit-order" className="block text-sm font-medium text-ponte-black">
                      Order
                    </label>
                    <input
                      type="number"
                      id="edit-order"
                      value={newQuestion.order}
                      onChange={(e) => setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      min="0"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2 border border-ponte-sand text-ponte-black rounded-md hover:bg-ponte-sand"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
                    >
                      {submitting ? "Updating..." : "Update Question"}
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