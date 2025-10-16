"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Question {
  id: string
  question: string
  questionType: "text" | "ranking" | "yesno"
  order: number
}

interface Section {
  id: string
  title: string
  order: number
  questions: Question[]
}

interface QuestionnaireData {
  invite: {
    id: string
    client: {
      id: string
      name: string
      email: string
    }
    expiresAt: string
    status: string
  }
  questionnaire: {
    sections: Section[]
  }
}

export default function PublicQuestionnairePage() {
  const params = useParams()
  const token = params?.token as string
  
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchQuestionnaire()
  }, [token])

  // Load saved responses from localStorage
  useEffect(() => {
    if (token) {
      const savedResponses = localStorage.getItem(`questionnaire_${token}`)
      if (savedResponses) {
        try {
          const parsed = JSON.parse(savedResponses) as Record<string, string>
          setResponses(parsed)
          setLastSaved(new Date(parsed._lastSaved || Date.now()))
        } catch (error) {
          console.error('Error loading saved responses:', error)
        }
      }
    }
  }, [token])

  // Auto-save responses to localStorage
  useEffect(() => {
    if (Object.keys(responses).length > 0 && token) {
      const saveData = {
        ...responses,
        _lastSaved: new Date().toISOString()
      }
      
      setAutoSaving(true)
      localStorage.setItem(`questionnaire_${token}`, JSON.stringify(saveData))
      setLastSaved(new Date())
      
      // Clear auto-saving indicator after a short delay
      setTimeout(() => setAutoSaving(false), 1000)
    }
  }, [responses, token])


  const fetchQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaire/public/${token}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError("Invalid questionnaire link")
        } else if (response.status === 410) {
          const errorData = data as { completed?: boolean }
          if (errorData.completed) {
            setError("This questionnaire has already been completed")
          } else {
            setError("This questionnaire link has expired")
          }
        } else {
          const errorData = data as { error?: string }
          setError(errorData.error || "Failed to load questionnaire")
        }
        return
      }

      setQuestionnaireData(data as QuestionnaireData)
    } catch (error) {
      console.error("Error fetching questionnaire:", error)
      setError("Failed to load questionnaire")
    } finally {
      setLoading(false)
    }
  }

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const manualSave = () => {
    if (token && Object.keys(responses).length > 0) {
      const saveData = {
        ...responses,
        _lastSaved: new Date().toISOString()
      }
      localStorage.setItem(`questionnaire_${token}`, JSON.stringify(saveData))
      setLastSaved(new Date())
      alert("Progress saved!")
    }
  }

  // Check if question is asking for importance/rating
  const _isRatingQuestion = (question: string) => {
    const ratingKeywords = [
      'how important', 'importance', 'priority', 'rate', 'ranking',
      'scale', 'level', 'degree', 'extent', 'significance'
    ]
    return ratingKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    )
  }

  // Rating scale component with emoji faces - stores descriptive words
  const RatingScale = ({ questionId: _questionId, value, onChange }: { questionId: string, value: string, onChange: (value: string) => void }) => {
    const ratings = [
      { value: 'Not Important', label: 'Not Important', emoji: '⭐' },
      { value: 'Somewhat Important', label: 'Somewhat Important', emoji: '⭐⭐' },
      { value: 'Very Important', label: 'Very Important', emoji: '⭐⭐⭐' }
    ]

    return (
      <div className="space-y-3">
        <div className="flex justify-start items-center gap-4">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              type="button"
              onClick={() => onChange(rating.value)}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                value === rating.value
                  ? 'border-ponte-terracotta bg-ponte-terracotta/10'
                  : 'border-ponte-sand hover:border-ponte-terracotta/50'
              }`}
            >
              <span className="text-2xl mb-1">{rating.emoji}</span>
              <span className="text-xs font-medium text-ponte-black">{rating.value}</span>
            </button>
          ))}
        </div>
        {value && (
          <div className="text-center text-sm text-ponte-olive">
            Selected: {value}
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!questionnaireData) return

    // Validate all questions are answered
    const allQuestions = questionnaireData.questionnaire.sections.flatMap(section => section.questions)
    const unansweredQuestions = allQuestions.filter(question => !responses[question.id]?.trim())

    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions. You have ${unansweredQuestions.length} unanswered questions.`)
      return
    }

    setSubmitting(true)

    try {
      const responseData = allQuestions.map(question => ({
        questionId: question.id,
        answer: responses[question.id] || ""
      }))

      const response = await fetch(`/api/questionnaire/public/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: responseData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorData = data as { error?: string }
        throw new Error(errorData.error || "Failed to submit questionnaire")
      }

      setSubmitted(true)
      
      // Clear saved data after successful submission
      localStorage.removeItem(`questionnaire_${token}`)
    } catch (error) {
      console.error("Error submitting questionnaire:", error)
      setError("Failed to submit questionnaire. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ponte-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ponte-terracotta"></div>
          <p className="mt-4 text-ponte-olive">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ponte-cream flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-ponte-sand">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-ponte-black mb-4">Questionnaire Error</h1>
            <p className="text-ponte-olive mb-6">{error}</p>
            <p className="text-sm text-ponte-olive">
              Please contact the person who sent you this link for assistance.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-ponte-cream flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-ponte-sand">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-ponte-black mb-4">Thank You!</h1>
            <p className="text-ponte-olive mb-6">
              Your questionnaire has been submitted successfully.
            </p>
            <p className="text-sm text-ponte-olive">
              We'll review your responses and get back to you soon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!questionnaireData) {
    return null
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header - Sticky */}
        <div className="sticky top-4 z-10 bg-white rounded-lg shadow-xl p-6 mb-8 border border-ponte-sand backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-ponte-black mb-2">
                Property Preferences Questionnaire
              </h1>
              <p className="text-ponte-olive text-sm md:text-base">
                Hello {questionnaireData.invite.client.name}, please complete this questionnaire to help us understand your property preferences.
              </p>
              <div className="mt-3 text-xs md:text-sm text-ponte-olive">
                <p>Expires: {new Date(questionnaireData.invite.expiresAt).toLocaleDateString()}</p>
                {lastSaved && (
                  <p className="mt-1">
                    {autoSaving ? (
                      <span className="text-blue-600 font-medium">💾 Auto-saving...</span>
                    ) : (
                      <span className="text-green-600 font-medium">✅ Last saved: {lastSaved.toLocaleTimeString()}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={manualSave}
                className="bg-ponte-olive text-white px-3 py-2 rounded-lg hover:bg-ponte-olive/80 transition-colors text-sm font-medium shadow-md"
              >
                💾 Save Progress
              </button>
            </div>
          </div>
        </div>

        {/* Questionnaire Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {questionnaireData.questionnaire.sections.map((section, _sectionIndex) => (
              <div key={section.id} className="mb-8">
                <h2 className="text-2xl font-semibold text-ponte-black mb-4 border-b border-ponte-sand pb-2">
                  {section.title}
                </h2>
                
                <div className="space-y-6">
                  {section.questions.map((question, questionIndex) => (
                    <div key={question.id} className="space-y-4">
                      <label className="block text-lg font-medium text-ponte-black">
                        {questionIndex + 1}. {question.question}
                      </label>
                      
                      {question.questionType === "ranking" ? (
                        <RatingScale
                          questionId={question.id}
                          value={responses[question.id] || ""}
                          onChange={(value) => handleResponseChange(question.id, value)}
                        />
                      ) : question.questionType === "yesno" ? (
                        <div className="space-y-3">
                          <div className="flex space-x-6">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`question_${question.id}`}
                                value="Yes"
                                checked={responses[question.id] === "Yes"}
                                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                className="mr-2 text-ponte-terracotta focus:ring-ponte-terracotta"
                                required
                              />
                              <span className="text-ponte-black font-medium">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`question_${question.id}`}
                                value="No"
                                checked={responses[question.id] === "No"}
                                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                className="mr-2 text-ponte-terracotta focus:ring-ponte-terracotta"
                                required
                              />
                              <span className="text-ponte-black font-medium">No</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={responses[question.id] || ""}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="w-full px-4 py-3 border border-ponte-sand rounded-lg focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent resize-vertical min-h-[100px]"
                          placeholder="Please provide your answer here..."
                          required
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-ponte-sand">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ponte-terracotta text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-ponte-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Questionnaire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
