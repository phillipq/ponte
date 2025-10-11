"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "components/Button"
import Navigation from "components/Navigation"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  questionnaireResponses?: any
  preferredProperties?: string[]
  createdAt: string
  updatedAt: string
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
  questionType: "text" | "ranking" | "yesno"
  order: number
  sectionId: string
}

export default function ClientDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [questionnaireSections, setQuestionnaireSections] = useState<QuestionnaireSection[]>([])
  const [questionnaireResponses, setQuestionnaireResponses] = useState<any>(null)
  const [selectedResponseSet, setSelectedResponseSet] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [deletingResponseSet, setDeletingResponseSet] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [propertyRankings, setPropertyRankings] = useState<any[]>([])
  const [generatingAi, setGeneratingAi] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [questionnaireInvites, setQuestionnaireInvites] = useState<any[]>([])
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [inviteExpiresInDays, setInviteExpiresInDays] = useState(30)
  const [destinations, setDestinations] = useState<any[]>([])
  const [storedAiAnalyses, setStoredAiAnalyses] = useState<any[]>([])
  const [selectedAiAnalysis, setSelectedAiAnalysis] = useState<string>("")
  const [showPropertyPreferences, setShowPropertyPreferences] = useState(false)
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [updatingPreferences, setUpdatingPreferences] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: ""
  })
  const [editingResponse, setEditingResponse] = useState<any>(null)
  const [editingResponseValue, setEditingResponseValue] = useState("")
  const [updatingResponse, setUpdatingResponse] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [activeStep, setActiveStep] = useState(1)

  // 5-Step Process Data
  const PROCESS_STEPS = [
    {
      id: 1,
      title: "Questionnaire & Feasibility Guide",
      description: "Discovery call and tailored questionnaire to define your vision. Feasibility guide provides financial clarity and direction.",
      status: 'completed',
      progress: 100,
      lastUpdated: '2024-12-15',
      updatedBy: session?.user?.name || 'System'
    },
    {
      id: 2,
      title: "Property Search & Evaluations",
      description: "Property search aligned with your goals and budget. Each option carefully evaluated and summarized in clear property reports.",
      status: 'in-progress',
      progress: 60,
      lastUpdated: '2024-12-20',
      updatedBy: session?.user?.name || 'System'
    },
    {
      id: 3,
      title: "Design & Virtual Walkthroughs",
      description: "Exterior design guide and virtual walkthroughs help you visualize each property before purchasing.",
      status: 'pending',
      progress: 0
    },
    {
      id: 4,
      title: "Translation, Legal & Purchase",
      description: "From offer to final contract, we handle the complexities of buying in Italy. Trusted advisors ensure smooth, transparent, and protected purchase.",
      status: 'pending',
      progress: 0
    },
    {
      id: 5,
      title: "Design, Renovation & Project Management",
      description: "Our team oversees design selections and renovation work from start to finish. You enjoy results while we handle timelines, trades, and construction.",
      status: 'pending',
      progress: 0
    }
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchClient()
      fetchQuestionnaireSections()
      fetchQuestionnaireResponses()
      fetchPropertiesAndDestinations()
      fetchStoredAiAnalyses()
      fetchQuestionnaireInvites()
    }
  }, [status, router, params.id])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      
      if (response.ok) {
        const data = await response.json() as { client?: Client }
        setClient(data.client!)
        setEditForm({
          name: data.client!.name,
          email: data.client!.email || "",
          phone: data.client!.phone || "",
          company: data.client!.company || "",
          notes: data.client!.notes || ""
        })
        setLoading(false)
      } else {
        router.push("/clients")
      }
    } catch (error) {
      console.error("Error fetching client:", error)
      setLoading(false)
    }
  }

  const fetchQuestionnaireSections = async () => {
    try {
      const response = await fetch('/api/questionnaire/sections')
      if (response.ok) {
        const data = await response.json() as { sections?: QuestionnaireSection[] }
        setQuestionnaireSections(data.sections || [])
      }
    } catch (error) {
      console.error("Error fetching questionnaire sections:", error)
    }
  }

  const fetchQuestionnaireResponses = async () => {
    try {
      console.log("Fetching questionnaire responses...")
      const response = await fetch(`/api/clients/${params.id}/questionnaire-responses`)
      if (response.ok) {
        const data = await response.json() as any
        setQuestionnaireResponses(data)
        // Set the first response set as default if none selected
        if (data.responseSets && data.responseSets.length > 0 && !selectedResponseSet) {
          setSelectedResponseSet(data.responseSets[0].id)
        }
      } else {
        console.error("Failed to fetch questionnaire responses:", response.status)
      }
    } catch (error) {
      console.error("Error fetching questionnaire responses:", error)
    }
  }

  const fetchPropertiesAndDestinations = async () => {
    try {
      const [propertiesResponse, destinationsResponse] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/destinations')
      ])

      if (propertiesResponse.ok) {
        const data = await propertiesResponse.json() as { properties?: any[] }
        setProperties(data.properties || [])
      }

      if (destinationsResponse.ok) {
        const data = await destinationsResponse.json() as { destinations?: any[] }
        setDestinations(data.destinations || [])
      }
    } catch (error) {
      console.error("Error fetching properties and destinations:", error)
    }
  }

  const fetchStoredAiAnalyses = async () => {
    try {
      console.log("Fetching stored AI analyses...")
      const response = await fetch(`/api/clients/${params.id}/ai-analysis`)
      console.log("AI analysis API response status:", response.status)
      
      if (response.ok) {
        const data = await response.json() as { aiAnalyses?: any[] }
        console.log("AI analyses data received:", data)
        setStoredAiAnalyses(data.aiAnalyses || [])
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch AI analyses:", errorData)
      }
    } catch (error) {
      console.error("Error fetching stored AI analyses:", error)
    }
  }

  const fetchQuestionnaireInvites = async () => {
    try {
      const response = await fetch(`/api/questionnaire/invite`)
      if (response.ok) {
        const data = await response.json() as { invites?: any[] }
        // Filter invites for this specific client
        const clientInvites = (data.invites || []).filter((invite: any) => invite.client.id === params.id)
        setQuestionnaireInvites(clientInvites)
      }
    } catch (error) {
      console.error("Error fetching questionnaire invites:", error)
    }
  }

  const createQuestionnaireInvite = async () => {
    if (!client) return

    setCreatingInvite(true)
    try {
      const response = await fetch("/api/questionnaire/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: client.id,
          expiresInDays: inviteExpiresInDays
        })
      })

      if (response.ok) {
        const data = await response.json() as { invite: any }
        setQuestionnaireInvites(prev => [data.invite, ...prev])
        alert(`Questionnaire invite created! Share this link: ${data.invite.questionnaireUrl}`)
      } else {
        const error = await response.json() as { error?: string }
        alert(error.error || "Failed to create invite")
      }
    } catch (error) {
      console.error("Error creating questionnaire invite:", error)
      alert("Failed to create invite")
    } finally {
      setCreatingInvite(false)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      console.error('Failed to copy:', error)
      alert("Failed to copy link. Please copy manually: " + url)
    }
  }

  const loadAiAnalysis = (analysis: any) => {
    setAiAnalysis({
      summary: analysis.summary,
      preferences: analysis.preferences,
      recommendations: analysis.recommendations
    })
    setPropertyRankings(analysis.propertyRankings || [])
  }

  const deleteAiAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this AI analysis? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${params.id}/ai-analysis/${analysisId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh stored analyses
        await fetchStoredAiAnalyses()
        
        // Clear current analysis if it was deleted
        if (selectedAiAnalysis === analysisId) {
          setAiAnalysis(null)
          setPropertyRankings([])
          setSelectedAiAnalysis("")
        }
      } else {
        alert('Failed to delete AI analysis')
      }
    } catch (error) {
      console.error('Error deleting AI analysis:', error)
      alert('Error deleting AI analysis')
    }
  }

  const deleteResponseSet = async (responseSetId: string) => {
    try {
      const response = await fetch(`/api/clients/${params.id}/questionnaire-responses?responseSetId=${responseSetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh questionnaire responses
        await fetchQuestionnaireResponses()
        
        // Clear selected response set if it was deleted
        if (selectedResponseSet === responseSetId) {
          setSelectedResponseSet('')
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to delete response set:", errorData)
        alert('Failed to delete response set. Please try again.')
      }
    } catch (error) {
      console.error("Error deleting response set:", error)
      alert('Error deleting response set. Please try again.')
    }
  }

  const loadStoredAnalysis = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/clients/${params.id}/ai-analysis/${analysisId}`)
      
      if (response.ok) {
        const data = await response.json() as { summary: string; recommendations: string; propertyRankings?: any[] }
        setAiAnalysis({
          summary: data.summary,
          recommendations: data.recommendations
        })
        setPropertyRankings(data.propertyRankings || [])
        setSelectedAiAnalysis(analysisId)
      } else {
        console.error("Failed to load stored analysis")
        alert('Failed to load analysis. Please try again.')
      }
    } catch (error) {
      console.error("Error loading stored analysis:", error)
      alert('Error loading analysis. Please try again.')
    }
  }

  const handlePropertyPreferenceToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const savePropertyPreferences = async () => {
    try {
      setUpdatingPreferences(true)
      const response = await fetch(`/api/clients/${params.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredProperties: selectedProperties,
          updatedBy: session?.user?.name || 'System'
        })
      })

      if (response.ok) {
        const data = await response.json() as { client: Client }
        if (client) {
          setClient({ ...client, preferredProperties: data.client.preferredProperties })
        }
        setShowPropertyPreferences(false)
      } else {
        alert('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Error saving preferences')
    } finally {
      setUpdatingPreferences(false)
    }
  }

  const startEditingResponse = (response: any) => {
    setEditingResponse(response)
    setEditingResponseValue(response.answer)
  }

  const cancelEditingResponse = () => {
    setEditingResponse(null)
    setEditingResponseValue("")
  }

  const formatResponseByType = (answer: string, questionType: string) => {
    if (questionType === "ranking") {
      const numericValue = parseInt(answer)
      if (!isNaN(numericValue)) {
        return `${numericValue}/5`
      }
      return answer
    } else if (questionType === "yesno") {
      return answer === "Yes" ? "✅ Yes" : answer === "No" ? "❌ No" : answer
    } else {
      return answer
    }
  }

  const saveResponseEdit = async () => {
    if (!editingResponse) return

    try {
      setUpdatingResponse(true)
      
      const response = await fetch(`/api/clients/${params.id}/responses/${editingResponse.id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: editingResponseValue,
          updatedBy: session?.user?.name || 'System'
        }),
      })

      if (response.ok) {
        await fetchQuestionnaireResponses()
        setEditingResponse(null)
        setEditingResponseValue("")
      } else {
        const errorData = await response.json()
        console.error("Failed to update response:", errorData)
      }
    } catch (error) {
      console.error("Error updating response:", error)
    } finally {
      setUpdatingResponse(false)
    }
  }

  const startEditResponse = (responseId: string, currentAnswer: string) => {
    setEditingResponse({ id: responseId })
    setEditingResponseValue(currentAnswer)
  }

  const cancelEditResponse = () => {
    setEditingResponse(null)
    setEditingResponseValue("")
  }

  const saveEditResponse = async (responseId: string) => {
    if (!editingResponse) return

    try {
      setUpdatingResponse(true)
      
      const response = await fetch(`/api/clients/${params.id}/responses/${responseId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: editingResponseValue,
          updatedBy: session?.user?.name || 'System'
        }),
      })

      if (response.ok) {
        await fetchQuestionnaireResponses()
        setEditingResponse(null)
        setEditingResponseValue("")
      } else {
        const errorData = await response.json()
        console.error("Failed to update response:", errorData)
      }
    } catch (error) {
      console.error("Error updating response:", error)
    } finally {
      setUpdatingResponse(false)
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

  const generateAiAnalysis = async () => {
    try {
      setGeneratingAi(true)
      const response = await fetch('/api/ai/client-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: params.id,
          questionnaireResponses: questionnaireResponses,
          properties: properties,
          destinations: destinations,
          updatedBy: session?.user?.name || 'System'
        })
      })

      if (response.ok) {
        const data = await response.json() as { analysis: any; propertyRankings: any[] }
        setAiAnalysis(data.analysis)
        setPropertyRankings(data.propertyRankings)
        await fetchStoredAiAnalyses()
      } else {
        alert('Failed to generate AI analysis')
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error)
      alert('Error generating AI analysis')
    } finally {
      setGeneratingAi(false)
    }
  }

  const handleDeleteResponseSet = async (responseSetId: string) => {
    if (!confirm('Are you sure you want to delete this response set? This action cannot be undone.')) {
      return
    }

    setDeletingResponseSet(responseSetId)
    try {
      const response = await fetch(`/api/questionnaire/responses/${responseSetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the questionnaire responses
        await fetchQuestionnaireResponses()
        // Reset selected response set if it was deleted
        if (selectedResponseSet === responseSetId) {
          setSelectedResponseSet('')
        }
      } else {
        alert('Failed to delete response set')
      }
    } catch (error) {
      console.error('Error deleting response set:', error)
      alert('Error deleting response set')
    } finally {
      setDeletingResponseSet(null)
    }
  }

  const handleSaveClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          updatedBy: session?.user?.name || 'System'
        })
      })

      if (response.ok) {
        const data = await response.json() as { client?: Client }
        setClient(data.client!)
      } else {
        alert("Failed to update client")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      alert("Failed to update client")
    }
  }

  const handleDeleteClient = async () => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/clients/${params.id}`, { method: "DELETE" })
      if (response.ok) {
        router.push("/clients")
      } else {
        alert("Failed to delete client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      alert("Failed to delete client")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-2 text-ponte-olive">Loading client...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated" || !client) {
    return null
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ponte-black font-header">{client.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {client.email && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-ponte-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-ponte-olive font-body">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-ponte-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-ponte-olive font-body">{client.phone}</p>
                  </div>
                )}
                {client.company && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-ponte-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-ponte-olive font-body">{client.company}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-ponte-olive">
                <span>Created: {new Date(client.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(client.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.push("/clients")}
                intent="secondary"
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Clients</span>
              </Button>
              <Button
                onClick={handleDeleteClient}
                intent="danger"
                className="bg-ponte-terracotta hover:bg-ponte-terracotta/80"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Client Overview and Information - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Client Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Client Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ponte-black mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ponte-black mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ponte-black mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-ponte-black mb-1">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                onClick={() => setEditForm({
                  name: client.name,
                  email: client.email || '',
                  phone: client.phone || '',
                  company: client.company || '',
                  notes: client.notes || ''
                })}
                intent="secondary"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveClient}
                className="bg-ponte-olive hover:bg-ponte-olive/80 px-4 py-2"
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Client Information Sidebar */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-4">
            <h3 className="text-lg font-semibold text-ponte-black mb-4 font-header">Client Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-ponte-black">Created</p>
                <p className="text-sm text-ponte-olive">{new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ponte-black">Last Updated</p>
                <p className="text-sm text-ponte-olive">{new Date(client.updatedAt).toLocaleDateString()}</p>
              </div>
              {client.email && (
                <div>
                  <p className="text-sm font-medium text-ponte-black">Email</p>
                  <p className="text-sm text-ponte-olive break-all">{client.email}</p>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-sm font-medium text-ponte-black">Phone</p>
                  <p className="text-sm text-ponte-olive">{client.phone}</p>
                </div>
              )}
              {client.company && (
                <div>
                  <p className="text-sm font-medium text-ponte-black">Company</p>
                  <p className="text-sm text-ponte-olive">{client.company}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5-Step Process Cards - Compact */}
        <div className="bg-white rounded-lg shadow border border-ponte-sand p-4 mb-6">
          <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">5-Step Property Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {PROCESS_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  activeStep === step.id
                    ? 'border-ponte-terracotta bg-ponte-terracotta/10 shadow-lg'
                    : 'border-ponte-sand bg-white hover:border-ponte-olive hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-ponte-black">
                    Step {step.id}
                  </h3>
                  <div className="w-8 h-8 rounded-lg bg-ponte-cream flex items-center justify-center">
                    <img 
                      src={`/logos/icon-step${step.id}.png`} 
                      alt={`Step ${step.id}`}
                      className="w-6 h-6"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                        if (nextElement) {
                          nextElement.style.display = 'block'
                        }
                      }}
                    />
                    <span className="text-sm font-bold text-ponte-olive" style={{display: 'none'}}>
                      {step.id}
                    </span>
                  </div>
                </div>
                <h4 className="text-xs font-medium text-ponte-black mb-1">{step.title}</h4>
                <p className="text-xs text-ponte-olive mb-2 line-clamp-2">{step.description}</p>
                <div className="text-xs text-ponte-olive">
                  <p>Updated: {step.lastUpdated}</p>
                  <p>By: {step.updatedBy}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {activeStep === 1 && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Step 1: Questionnaire & Feasibility Guide</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Questionnaire Invite Section */}
              <div className="bg-ponte-cream rounded-lg p-4">
                <h3 className="font-medium text-ponte-black mb-2">Send Questionnaire Invite</h3>
                <p className="text-sm text-ponte-olive mb-3">Create and manage questionnaire invites</p>
                <div className="bg-white rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-olive mb-2">
                        Expires In (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={inviteExpiresInDays}
                        onChange={(e) => setInviteExpiresInDays(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-ponte-sand rounded-lg focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={createQuestionnaireInvite}
                        disabled={creatingInvite}
                        className="w-full bg-ponte-olive hover:bg-ponte-olive/80"
                      >
                        {creatingInvite ? "Creating..." : "Create New Invite"}
                      </Button>
                    </div>
                  </div>

                  {/* Existing Invites */}
                  {questionnaireInvites.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-ponte-black mb-2">Existing Invites:</h5>
                      <div className="space-y-2">
                        {questionnaireInvites.map((invite) => (
                          <div key={invite.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-ponte-sand">
                            <div className="flex-1">
                              <div className="text-sm text-ponte-black">
                                <span className="font-medium">Status:</span> 
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  invite.status === 'completed' ? 'bg-ponte-olive/20 text-ponte-olive' :
                                  invite.status === 'expired' ? 'bg-ponte-terracotta/20 text-ponte-terracotta' :
                                  'bg-ponte-sand/50 text-ponte-black'
                                }`}>
                                  {invite.status === 'completed' ? 'Completed' :
                                   invite.status === 'expired' ? 'Expired' : 'Pending'}
                                </span>
                              </div>
                              <div className="text-xs text-ponte-olive">
                                Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => copyToClipboard(invite.questionnaireUrl)}
                                className="text-xs bg-ponte-terracotta text-white px-3 py-1 rounded hover:bg-ponte-terracotta/80"
                              >
                                Copy Link
                              </button>
                              <button
                                onClick={() => alert("Email functionality coming soon!")}
                                className="text-xs bg-ponte-olive text-white px-3 py-1 rounded hover:bg-ponte-olive/80"
                              >
                                Email Link
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questionnaire Responses Section */}
              <div className="bg-ponte-cream rounded-lg p-4">
                <h3 className="font-medium text-ponte-black mb-2">Questionnaire Responses</h3>
                <p className="text-sm text-ponte-olive mb-3">View and analyze client responses</p>
                <div className="bg-white rounded-lg p-4">
                  {questionnaireResponses?.responseSets && questionnaireResponses.responseSets.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-ponte-black mb-2">
                          Select Response Set:
                        </label>
                        <select
                          value={selectedResponseSet}
                          onChange={(e) => setSelectedResponseSet(e.target.value)}
                          className="w-full px-3 py-2 border border-ponte-sand rounded-lg focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                        >
                          <option value="">Choose a response set...</option>
                          {questionnaireResponses.responseSets.map((set: any) => (
                            <option key={set.id} value={set.id}>
                              Response Set #{set.version} - {new Date(set.submittedAt).toLocaleDateString()} ({set.status})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedResponseSet && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setSelectedResponseSet('')}
                            intent="secondary"
                            className="px-4 py-2"
                          >
                            Hide Response Set
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this response set? This action cannot be undone.')) {
                                deleteResponseSet(selectedResponseSet)
                              }
                            }}
                            className="bg-ponte-terracotta hover:bg-ponte-terracotta/80 text-white px-4 py-2"
                          >
                            Delete Response Set
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-ponte-olive text-center py-4">No responses yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Response Set Details - Only show on Step 1 */}
        {activeStep === 1 && selectedResponseSet && questionnaireResponses?.responseSets && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Response Details</h2>
            {(() => {
              const selectedSet = questionnaireResponses.responseSets.find((set: any) => set.id === selectedResponseSet)
              if (!selectedSet) return null

              // Group responses by section
              const responsesBySection = selectedSet.responses?.reduce((acc: any, response: any) => {
                const sectionTitle = response.sectionTitle || 'Other'
                if (!acc[sectionTitle]) {
                  acc[sectionTitle] = []
                }
                acc[sectionTitle].push(response)
                return acc
              }, {}) || {}

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-ponte-black">
                      Response Set #{selectedSet.version}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedSet.status === 'completed' ? 'bg-ponte-olive/20 text-ponte-olive' :
                        selectedSet.status === 'pending' ? 'bg-ponte-sand/50 text-ponte-black' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedSet.status}
                      </span>
                      <span className="text-sm text-ponte-olive">
                        {new Date(selectedSet.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {Object.keys(responsesBySection).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(responsesBySection).map(([sectionTitle, responses]) => {
                        const responsesArray = responses as any[]
                        return (
                        <div key={sectionTitle} className="border border-ponte-sand rounded-lg bg-white shadow-sm">
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-ponte-cream p-4 rounded-t-lg transition-colors"
                            onClick={() => toggleSection(sectionTitle)}
                          >
                            <h4 className="text-md font-semibold text-ponte-black font-header">
                              {sectionTitle}
                              <span className="ml-2 text-sm text-ponte-olive font-normal">
                                ({responsesArray.length} {responsesArray.length === 1 ? 'response' : 'responses'})
                              </span>
                            </h4>
                            <div className="flex items-center">
                              <svg
                                className={`w-5 h-5 text-ponte-olive transition-transform duration-200 ${
                                  expandedSections.has(sectionTitle) ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {expandedSections.has(sectionTitle) && (
                            <div className="px-4 pb-4">
                              <div className="space-y-3">
                                {responsesArray.map((response: any) => (
                                  <div key={response.id} className="border-l-4 border-ponte-terracotta pl-4 py-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-ponte-black text-sm mb-1">
                                          {response.questionText}
                                        </p>
                                        {editingResponse?.id === response.id ? (
                                          <div className="space-y-2">
                                            <textarea
                                              value={editingResponseValue}
                                              onChange={(e) => setEditingResponseValue(e.target.value)}
                                              className="w-full px-3 py-2 border border-ponte-sand rounded-lg focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent text-sm"
                                              rows={3}
                                              placeholder="Enter response..."
                                            />
                                            <div className="flex space-x-2">
                                              <Button
                                                onClick={() => saveEditResponse(response.id)}
                                                disabled={updatingResponse}
                                                className="bg-ponte-terracotta hover:bg-ponte-terracotta/80 text-white px-3 py-1 text-xs"
                                              >
                                                {updatingResponse ? 'Saving...' : 'Save'}
                                              </Button>
                                              <Button
                                                onClick={cancelEditResponse}
                                                intent="secondary"
                                                className="px-3 py-1 text-xs"
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-start justify-between">
                                            <p className="text-sm text-ponte-olive flex-1">
                                              {formatResponseByType(response.answer, response.question?.questionType || "text")}
                                            </p>
                                            <Button
                                              onClick={() => startEditResponse(response.id, response.answer)}
                                              intent="secondary"
                                              className="ml-2 px-2 py-1 text-xs"
                                            >
                                              Edit
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-ponte-olive">No responses in this set</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {activeStep === 2 && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Step 2: Property Search & Evaluations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">AI Analysis</h3>
                <p className="text-sm text-ponte-olive mb-3">AI-powered property analysis and recommendations</p>
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <Button
                    onClick={generateAiAnalysis}
                    disabled={generatingAi}
                    className="w-full bg-ponte-terracotta hover:bg-ponte-terracotta/80"
                  >
                    {generatingAi ? "Generating..." : "Generate AI Analysis"}
                  </Button>
                  
                  {storedAiAnalyses && storedAiAnalyses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-ponte-black mb-2">Stored Analyses</h4>
                      <div className="space-y-2">
                        {storedAiAnalyses.map((analysis: any) => (
                          <div key={analysis.id} className="flex items-center justify-between p-3 border border-ponte-sand rounded-lg">
                            <div>
                              <p className="font-medium text-ponte-black text-sm">
                                Analysis #{analysis.id}
                              </p>
                              <p className="text-xs text-ponte-olive">
                                {new Date(analysis.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => loadStoredAnalysis(analysis.id)}
                                className="bg-ponte-olive hover:bg-ponte-olive/80 text-white px-3 py-1 text-xs"
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => deleteAiAnalysis(analysis.id)}
                                className="bg-ponte-terracotta hover:bg-ponte-terracotta/80 text-white px-3 py-1 text-xs"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiAnalysis && (
                    <div className="mt-4 border-t border-ponte-sand pt-4">
                      <h4 className="font-medium text-ponte-black mb-3">Current Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-ponte-black text-sm mb-1">Summary</h5>
                          <p className="text-sm text-ponte-olive">{aiAnalysis.summary}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-ponte-black text-sm mb-1">Recommendations</h5>
                          <p className="text-sm text-ponte-olive">{aiAnalysis.recommendations}</p>
                        </div>
                        {propertyRankings && propertyRankings.length > 0 && (
                          <div>
                            <h5 className="font-medium text-ponte-black text-sm mb-2">Property Rankings</h5>
                            <div className="space-y-2">
                              {propertyRankings.map((property: any, index: number) => (
                                <div key={property.id} className="flex items-center justify-between p-2 bg-ponte-cream rounded">
                                  <span className="text-sm font-medium text-ponte-black">
                                    #{index + 1} {property.name}
                                  </span>
                                  <span className="text-sm text-ponte-olive">
                                    Score: {property.score || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Property Preferences</h3>
                <p className="text-sm text-ponte-olive mb-3">Client's property preferences and criteria</p>
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <Button
                    onClick={() => setShowPropertyPreferences(true)}
                    className="w-full bg-ponte-olive hover:bg-ponte-olive/80"
                  >
                    Manage Preferences
                  </Button>
                  
                  {selectedProperties && selectedProperties.length > 0 && (
                    <div>
                      <h4 className="font-medium text-ponte-black mb-2">Selected Properties</h4>
                      <div className="space-y-2">
                        {selectedProperties.map((propertyId: string) => {
                          const property = properties.find((p: any) => p.id === propertyId)
                          return property ? (
                            <div key={propertyId} className="flex items-center justify-between p-3 border border-ponte-sand rounded-lg">
                              <div>
                                <p className="font-medium text-ponte-black text-sm">
                                  {property.name}
                                </p>
                                <p className="text-xs text-ponte-olive">
                                  {property.address}
                                </p>
                              </div>
                              <Button
                                onClick={() => handlePropertyPreferenceToggle(propertyId)}
                                className="bg-ponte-terracotta hover:bg-ponte-terracotta/80 text-white px-2 py-1 text-xs"
                              >
                                Remove
                              </Button>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                  
                  {(!selectedProperties || selectedProperties.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-ponte-olive text-sm">No properties selected yet</p>
                      <p className="text-xs text-ponte-olive mt-1">Click "Manage Preferences" to select properties</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Step 3: Design & Virtual Walkthroughs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Design Guide</h3>
                <p className="text-sm text-ponte-olive mb-3">Exterior design recommendations and options</p>
                <div className="bg-white rounded-lg p-4">
                  <Button className="w-full bg-ponte-olive hover:bg-ponte-olive/80">
                    View Design Guide
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Virtual Walkthroughs</h3>
                <p className="text-sm text-ponte-olive mb-3">Schedule and manage property walkthroughs</p>
                <div className="bg-white rounded-lg p-4">
                  <Button className="w-full bg-ponte-terracotta hover:bg-ponte-terracotta/80">
                    Schedule Walkthrough
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Step 4: Translation, Legal & Purchase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Legal Documents</h3>
                <p className="text-sm text-ponte-olive mb-3">Review and manage legal documentation</p>
                <div className="bg-white rounded-lg p-4">
                  <Button className="w-full bg-ponte-olive hover:bg-ponte-olive/80">
                    View Documents
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Purchase Progress</h3>
                <p className="text-sm text-ponte-olive mb-3">Track purchase timeline and milestones</p>
                <div className="bg-white rounded-lg p-4">
                  <Button className="w-full bg-ponte-terracotta hover:bg-ponte-terracotta/80">
                    Track Progress
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 5 && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Step 5: Design, Renovation & Project Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Design Plans</h3>
                <p className="text-sm text-ponte-olive mb-3">Review and approve design selections</p>
                <div className="bg-white rounded-lg p-4">
                  <Button className="w-full bg-ponte-olive hover:bg-ponte-olive/80">
                    View Design Plans
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-ponte-cream rounded-lg">
                <h3 className="font-medium text-ponte-black mb-2">Construction Timeline</h3>
                <p className="text-sm text-ponte-olive mb-3">Track renovation progress and milestones</p>
                <div className="bg-white rounded-lg p-4">
                  <Button className="w-full bg-ponte-terracotta hover:bg-ponte-terracotta/80">
                    Track Construction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Property Preferences Modal */}
        {showPropertyPreferences && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-ponte-black font-header">Select Preferred Properties</h2>
                <Button
                  onClick={() => setShowPropertyPreferences(false)}
                  intent="secondary"
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => handlePropertyPreferenceToggle(property.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProperties.includes(property.id)
                        ? 'border-ponte-terracotta bg-ponte-terracotta/10'
                        : 'border-ponte-sand bg-white hover:border-ponte-olive'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-ponte-black">{property.name}</h3>
                      {selectedProperties.includes(property.id) && (
                        <svg className="w-5 h-5 text-ponte-terracotta" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-ponte-olive">{property.propertyType || 'Property'}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => setShowPropertyPreferences(false)}
                  intent="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePropertyPreferences}
                  disabled={updatingPreferences}
                  className="bg-ponte-terracotta hover:bg-accent-600"
                >
                  {updatingPreferences ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Save and Cancel Buttons */}
        <div className="flex justify-end space-x-3 mt-8">
          <Button
            onClick={() => {
              setEditForm({
                name: client?.name || "",
                email: client?.email || "",
                phone: client?.phone || "",
                company: client?.company || "",
                notes: client?.notes || ""
              })
            }}
            intent="secondary"
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveClient}
            className="bg-ponte-olive hover:bg-ponte-olive/80 px-6 py-2"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

