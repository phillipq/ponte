"use client"

import { Button } from "components/Button"
import Navigation from "components/Navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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

export default function ClientsPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchClients()
    }
  }, [status, router])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json() as { clients?: Client[] }
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients"
      const method = editingClient ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient)
      })

      if (response.ok) {
        const data = await response.json() as { client?: Client }
        if (editingClient) {
          setClients(clients.map(c => c.id === editingClient.id ? data.client! : c))
        } else {
          setClients([...clients, data.client!])
        }
        resetForm()
      } else {
        const error = await response.json() as { error?: string }
        alert(error.error || "Failed to save client")
      }
    } catch (error) {
      console.error("Error saving client:", error)
      alert("Failed to save client")
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setNewClient({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      notes: client.notes || ""
    })
    setShowAddForm(true)
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return

    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" })
      if (response.ok) {
        setClients(clients.filter(c => c.id !== id))
      } else {
        alert("Failed to delete client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      alert("Failed to delete client")
    }
  }

  const resetForm = () => {
    setNewClient({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: ""
    })
    setEditingClient(null)
    setShowAddForm(false)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-2 text-ponte-olive">Loading clients...</p>
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
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ponte-black flex items-center">
                <Image src="/logos/icon-destination.png" alt="Clients" width={32} height={32} className="w-8 h-8 mr-3" />
                Clients
              </h1>
              <p className="mt-2 text-ponte-olive">Manage your client information and preferences</p>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              Add Client
            </Button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow border border-ponte-sand">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ponte-sand">
              <thead className="bg-ponte-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-ponte-sand">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-ponte-olive">No clients added yet</p>
                      <Button 
                        onClick={() => setShowAddForm(true)} 
                        className="mt-4"
                        size="sm"
                      >
                        Add Your First Client
                      </Button>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-ponte-cream cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-ponte-black">
                          {client.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ponte-olive">
                          {client.company || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ponte-olive">
                          {client.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ponte-olive">
                          {client.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            intent="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClient(client)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            intent="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClient(client.id)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Client Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-ponte-sand">
                <h2 className="text-lg font-semibold text-ponte-black">
                  {editingClient ? "Edit Client" : "Add New Client"}
                </h2>
              </div>
              
              <form onSubmit={handleSubmitClient} className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newClient.notes}
                      onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    intent="secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingClient ? "Update Client" : "Add Client"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
