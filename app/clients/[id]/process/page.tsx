"use client"

import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Navigation from "components/Navigation"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ProcessStep {
  id: number
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'pending'
  progress: number
  lastUpdated?: string
  actions: string[]
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 1,
    title: "Questionnaire & Feasibility Guide",
    description: "Discovery call and tailored questionnaire to define your vision. Feasibility guide provides financial clarity and direction.",
    status: 'completed',
    progress: 100,
    lastUpdated: '2024-12-15',
    actions: ['View Questionnaire', 'View Feasibility Report', 'Edit Responses']
  },
  {
    id: 2,
    title: "Property Search & Evaluations",
    description: "Property search aligned with your goals and budget. Each option carefully evaluated and summarized in clear property reports.",
    status: 'in-progress',
    progress: 60,
    lastUpdated: '2024-12-20',
    actions: ['View Properties', 'Add Property Evaluation', 'Generate Report']
  },
  {
    id: 3,
    title: "Design & Virtual Walkthroughs",
    description: "Exterior design guide and virtual walkthroughs help you visualize each property before purchasing.",
    status: 'pending',
    progress: 0,
    actions: ['Start Design Process', 'View Design Guide', 'Schedule Walkthrough']
  },
  {
    id: 4,
    title: "Translation, Legal & Purchase",
    description: "From offer to final contract, we handle the complexities of buying in Italy. Trusted advisors ensure smooth, transparent, and protected purchase.",
    status: 'pending',
    progress: 0,
    actions: ['Start Legal Process', 'View Legal Documents', 'Track Purchase Progress']
  },
  {
    id: 5,
    title: "Design, Renovation & Project Management",
    description: "Our team oversees design selections and renovation work from start to finish. You enjoy results while we handle timelines, trades, and construction.",
    status: 'pending',
    progress: 0,
    actions: ['Start Renovation', 'View Design Plans', 'Track Construction']
  }
]

export default function ClientProcessPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [activeStep, setActiveStep] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchClient()
    }
  }, [status, router])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${params.id}`)
      const data = await response.json() as { client: Client }
      
      if (response.ok) {
        setClient(data.client)
      }
    } catch (error) {
      console.error("Error fetching client:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in-progress': return '🔄'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in-progress': return 'bg-blue-500'
      case 'pending': return 'bg-gray-300'
      default: return 'bg-gray-300'
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-ponte-cream">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-ponte-olive">Loading client process...</div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-ponte-cream">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-ponte-olive">Client not found</div>
        </div>
      </div>
    )
  }

  const currentStep = PROCESS_STEPS.find(step => step.id === activeStep)!

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-ponte-black">{client.name}</h1>
              <p className="text-ponte-olive mt-1">5-Step Property Journey</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/clients/${client.id}`)}
                className="px-4 py-2 border border-ponte-sand text-ponte-olive rounded-lg hover:bg-ponte-sand transition-colors"
              >
                Back to Client
              </button>
              <button className="px-4 py-2 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/80 transition-colors">
                AI Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Step Cards Dashboard */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROCESS_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  activeStep === step.id
                    ? 'border-ponte-terracotta bg-ponte-terracotta/10 shadow-lg'
                    : 'border-ponte-sand bg-white hover:border-ponte-olive hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-ponte-cream flex items-center justify-center">
                    <Image 
                      src={`/logos/icon-step${step.id}.png`} 
                      alt={`Step ${step.id}`}
                      width={32}
                      height={32}
                      className="w-8 h-8"
                      onError={(e) => {
                        // Fallback to number if icon doesn't exist
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                        if (nextElement) {
                          nextElement.style.display = 'block'
                        }
                      }}
                    />
                    <span className="text-2xl font-bold text-ponte-olive" style={{display: 'none'}}>
                      {step.id}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    step.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : step.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {step.status === 'completed' ? '✅' : step.status === 'in-progress' ? '🔄' : '⏳'}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-ponte-black mb-2">
                  Step {step.id}
                </h3>
                <p className="text-sm text-ponte-olive mb-4 line-clamp-2">
                  {step.title}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-ponte-olive">Progress</span>
                    <span className="text-xs font-medium text-ponte-black">{step.progress}%</span>
                  </div>
                  <div className="w-full bg-ponte-sand rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        step.status === 'completed' 
                          ? 'bg-green-500'
                          : step.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
                
                {step.lastUpdated && (
                  <p className="text-xs text-ponte-olive">
                    Updated: {new Date(step.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Step Details */}
        <div className="bg-white rounded-lg shadow-lg border border-ponte-sand overflow-hidden">
          <div className="px-6 py-4 border-b border-ponte-sand bg-ponte-cream">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ponte-black">
                  Step {currentStep.id}: {currentStep.title}
                </h2>
                <p className="text-ponte-olive mt-1">{currentStep.description}</p>
              </div>
              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(currentStep.status)}`}>
                {getStatusIcon(currentStep.status)} {currentStep.status.replace('-', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-ponte-black">Progress</span>
                <span className="text-sm text-ponte-olive">{currentStep.progress}%</span>
              </div>
              <div className="w-full bg-ponte-sand rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(currentStep.status)}`}
                  style={{ width: `${currentStep.progress}%` }}
                />
              </div>
            </div>

            {/* Last Updated */}
            {currentStep.lastUpdated && (
              <div className="mb-6 p-4 bg-ponte-cream rounded-lg">
                <p className="text-sm text-ponte-olive">
                  <span className="font-medium">Last Updated:</span> {new Date(currentStep.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-ponte-black mb-3">Available Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentStep.actions.map((action, index) => (
                  <button
                    key={index}
                    className="p-4 text-left border border-ponte-sand rounded-lg hover:bg-ponte-cream transition-colors"
                  >
                    <span className="text-ponte-black font-medium">{action}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step-specific content */}
            {activeStep === 1 && (
              <div className="mt-8 p-6 bg-ponte-cream rounded-lg">
                <h3 className="text-lg font-medium text-ponte-black mb-4">Questionnaire & Feasibility Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-ponte-black">Send Questionnaire Invite</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">✅ Sent</span>
                    </div>
                    <p className="text-sm text-ponte-olive mb-3">Send personalized questionnaire to client</p>
                    <button 
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="px-4 py-2 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/80 transition-colors"
                    >
                      Send Invite
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-ponte-black">Questionnaire Responses</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">📋 3 Responses</span>
                    </div>
                    <p className="text-sm text-ponte-olive mb-3">View and analyze client responses</p>
                    <button 
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="px-4 py-2 bg-ponte-terracotta text-white rounded-lg hover:bg-ponte-terracotta/80 transition-colors"
                    >
                      View Responses
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="mt-8 p-6 bg-ponte-cream rounded-lg">
                <h3 className="text-lg font-medium text-ponte-black mb-4">Property Search & Evaluations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-ponte-black">AI Analysis</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">🤖 Generated</span>
                    </div>
                    <p className="text-sm text-ponte-olive mb-3">AI-powered property analysis and recommendations</p>
                    <button 
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="px-4 py-2 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/80 transition-colors"
                    >
                      View AI Analysis
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-ponte-black">Property Preferences</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">✅ Set</span>
                    </div>
                    <p className="text-sm text-ponte-olive mb-3">Client's property preferences and criteria</p>
                    <button 
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="px-4 py-2 bg-ponte-terracotta text-white rounded-lg hover:bg-ponte-terracotta/80 transition-colors"
                    >
                      View Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="mt-8 p-6 bg-ponte-cream rounded-lg">
                <h3 className="text-lg font-medium text-ponte-black mb-4">Design & Virtual Walkthroughs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <h4 className="font-medium text-ponte-black mb-2">Design Guide</h4>
                    <p className="text-sm text-ponte-olive mb-3">Exterior design recommendations and options</p>
                    <button className="px-4 py-2 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/80 transition-colors">
                      View Design Guide
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <h4 className="font-medium text-ponte-black mb-2">Virtual Walkthroughs</h4>
                    <p className="text-sm text-ponte-olive mb-3">Schedule and manage property walkthroughs</p>
                    <button className="px-4 py-2 bg-ponte-terracotta text-white rounded-lg hover:bg-ponte-terracotta/80 transition-colors">
                      Schedule Walkthrough
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="mt-8 p-6 bg-ponte-cream rounded-lg">
                <h3 className="text-lg font-medium text-ponte-black mb-4">Translation, Legal & Purchase</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <h4 className="font-medium text-ponte-black mb-2">Legal Documents</h4>
                    <p className="text-sm text-ponte-olive mb-3">Review and manage legal documentation</p>
                    <button className="px-4 py-2 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/80 transition-colors">
                      View Documents
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <h4 className="font-medium text-ponte-black mb-2">Purchase Progress</h4>
                    <p className="text-sm text-ponte-olive mb-3">Track purchase timeline and milestones</p>
                    <button className="px-4 py-2 bg-ponte-terracotta text-white rounded-lg hover:bg-ponte-terracotta/80 transition-colors">
                      Track Progress
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="mt-8 p-6 bg-ponte-cream rounded-lg">
                <h3 className="text-lg font-medium text-ponte-black mb-4">Design, Renovation & Project Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <h4 className="font-medium text-ponte-black mb-2">Design Plans</h4>
                    <p className="text-sm text-ponte-olive mb-3">Review and approve design selections</p>
                    <button className="px-4 py-2 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/80 transition-colors">
                      View Design Plans
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-ponte-sand">
                    <h4 className="font-medium text-ponte-black mb-2">Construction Timeline</h4>
                    <p className="text-sm text-ponte-olive mb-3">Track renovation progress and milestones</p>
                    <button className="px-4 py-2 bg-ponte-terracotta text-white rounded-lg hover:bg-ponte-terracotta/80 transition-colors">
                      Track Construction
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
