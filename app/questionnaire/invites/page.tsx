"use client"

import { Button } from "components/Button"
import Navigation from "components/Navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Client {
  id: string
  name: string
  email: string
}

interface QuestionnaireInvite {
  id: string
  token: string
  expiresAt: string
  status: string
  createdAt: string
  client: Client
  questionnaireUrl: string
}

export default function QuestionnaireInvitesPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [invites, setInvites] = useState<QuestionnaireInvite[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [expiresInDays, setExpiresInDays] = useState(30)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [invitesRes, clientsRes] = await Promise.all([
        fetch("/api/questionnaire/invite"),
        fetch("/api/clients")
      ])

      if (invitesRes.ok) {
        const data = await invitesRes.json() as { invites?: QuestionnaireInvite[] }
        setInvites(data.invites || [])
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json() as { clients?: Client[] }
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async () => {
    if (!selectedClientId) {
      alert("Please select a client")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/questionnaire/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          expiresInDays
        })
      })

      if (response.ok) {
        const data = await response.json() as { invite: QuestionnaireInvite }
        setInvites(prev => [data.invite, ...prev])
        setSelectedClientId("")
        alert(`Questionnaire invite created! Share this link: ${data.invite.questionnaireUrl}`)
      } else {
        const error = await response.json() as { error?: string }
        alert(error.error || "Failed to create invite")
      }
    } catch (error) {
      console.error("Error creating invite:", error)
      alert("Failed to create invite")
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert("Link copied to clipboard!")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50"
      case "expired":
        return "text-red-600 bg-red-50"
      case "pending":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "expired":
        return "Expired"
      case "pending":
        return "Pending"
      default:
        return status
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ponte-black">Questionnaire Invites</h1>
          <p className="mt-2 text-ponte-olive">Send questionnaire links to your clients</p>
        </div>

        {/* Create New Invite */}
        <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand mb-8">
          <h2 className="text-xl font-semibold text-ponte-black mb-4">Create New Invite</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ponte-olive mb-2">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-ponte-sand rounded-lg focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email && `(${client.email})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ponte-olive mb-2">
                Expires In (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-ponte-sand rounded-lg focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCreateInvite}
                disabled={creating || !selectedClientId}
                className="w-full"
              >
                {creating ? "Creating..." : "Create Invite"}
              </Button>
            </div>
          </div>
        </div>

        {/* Invites List */}
        <div className="bg-white rounded-lg shadow border border-ponte-sand">
          <div className="px-6 py-4 border-b border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black">Questionnaire Invites</h2>
          </div>

          {invites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-ponte-olive">No questionnaire invites created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ponte-cream">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ponte-sand">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-ponte-cream/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-ponte-black">
                            {invite.client.name}
                          </div>
                          {invite.client.email && (
                            <div className="text-sm text-ponte-olive">
                              {invite.client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invite.status)}`}>
                          {getStatusText(invite.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => copyToClipboard(invite.questionnaireUrl)}
                          className="text-ponte-terracotta hover:text-ponte-terracotta/80 mr-4"
                        >
                          Copy Link
                        </button>
                        <a
                          href={invite.questionnaireUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ponte-terracotta hover:text-ponte-terracotta/80"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
