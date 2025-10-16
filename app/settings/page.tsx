"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Navigation from "components/Navigation"

interface Tag {
  id: string
  name: string
  color: string
}

interface Keyword {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count?: {
    properties: number
    clients: number
  }
}

interface Partner {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  isActive: boolean
  createdAt: string
  _count?: {
    properties: number
  }
}

export default function SettingsPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Map settings
  const [defaultLocation, setDefaultLocation] = useState({
    lat: 41.9028, // Rome
    lng: 12.4964,
    zoom: 10
  })

  // Password change settings
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // Tag management settings
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#C1664A") // Default to terracotta
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editTagName, setEditTagName] = useState("")
  const [editTagColor, setEditTagColor] = useState("")
  const [tagLoading, setTagLoading] = useState(false)
  const [tagError, setTagError] = useState("")
  const [tagSuccess, setTagSuccess] = useState("")

  // Keywords & Features management settings
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [newKeywordName, setNewKeywordName] = useState("")
  const [newKeywordColor, setNewKeywordColor] = useState("#7A8664") // Default to olive
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null)
  const [editKeywordName, setEditKeywordName] = useState("")
  const [editKeywordColor, setEditKeywordColor] = useState("")
  const [keywordLoading, setKeywordLoading] = useState(false)
  const [keywordError, setKeywordError] = useState("")
  const [keywordSuccess, setKeywordSuccess] = useState("")

  // Predefined color palette based on Ponte scheme
  const colorPalette = [
    { name: "Terracotta", value: "#C1664A" },
    { name: "Olive", value: "#7A8664" },
    { name: "Sand", value: "#D3BFA4" },
    { name: "Black", value: "#222222" },
    { name: "Cream", value: "#FDF9F3" },
    { name: "Primary 100", value: "#F5F0E8" },
    { name: "Primary 200", value: "#E8DCC8" },
    { name: "Primary 400", value: "#B8A68A" },
    { name: "Primary 600", value: "#6B7557" },
    { name: "Primary 700", value: "#5C644A" },
    { name: "Primary 800", value: "#4D533D" },
    { name: "Accent 600", value: "#A8553A" }
  ]

  // Tab management
  const [activeTab, setActiveTab] = useState("user")

  // User management state
  const [users, setUsers] = useState<User[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  })
  const [userSubmitting, setUserSubmitting] = useState(false)
  const [userError, setUserError] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  })
  const [editUserSubmitting, setEditUserSubmitting] = useState(false)
  const [editUserError, setEditUserError] = useState("")

  // Partner management state
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [showAddPartner, setShowAddPartner] = useState(false)
  const [newPartner, setNewPartner] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: ""
  })
  const [partnerSubmitting, setPartnerSubmitting] = useState(false)
  const [partnerError, setPartnerError] = useState("")
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [editPartner, setEditPartner] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: ""
  })
  const [editPartnerSubmitting, setEditPartnerSubmitting] = useState(false)
  const [editPartnerError, setEditPartnerError] = useState("")

  // Import settings
  const [importType, setImportType] = useState("properties")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState("")

  // Load settings on component mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      loadSettings()
      loadTags()
      loadKeywords()
      if (activeTab === "partners") {
        fetchPartners()
      }
      if (activeTab === "users") {
        fetchUsers()
      }
    }
  }, [status, router])

  // Load partners when partners tab is selected
  useEffect(() => {
    if (activeTab === "partners" && status === "authenticated") {
      fetchPartners()
    }
  }, [activeTab, status])

  // Load users when users tab is selected
  useEffect(() => {
    if (activeTab === "users" && status === "authenticated") {
      fetchUsers()
    }
  }, [activeTab, status])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // For now, we'll use localStorage to persist settings
      // In a real app, you'd fetch from your API
      const savedSettings = localStorage.getItem("mapSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings) as { defaultLocation?: { lat: number; lng: number; zoom: number } }
        if (settings.defaultLocation && 
            typeof settings.defaultLocation.lat === 'number' && 
            typeof settings.defaultLocation.lng === 'number' && 
            typeof settings.defaultLocation.zoom === 'number') {
          setDefaultLocation(settings.defaultLocation)
        }
      }
    } catch {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      // Save to localStorage (in a real app, you'd save to your API)
      const settings = {
        defaultLocation
      }
      localStorage.setItem("mapSettings", JSON.stringify(settings))
      
      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch {
      console.error("Error saving settings:", error)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setDefaultLocation({
      lat: 40.7128, // New York City
      lng: -74.0060,
      zoom: 10
    })
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setPasswordSuccess("Password changed successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordError(data.error || "Failed to change password")
      }
    } catch {
      setPasswordError("An error occurred. Please try again.")
    } finally {
      setPasswordLoading(false)
    }
  }

  // Tag management functions
  const loadTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json() as { tags?: Tag[] }
        setTags(data.tags || [])
      }
    } catch {
      console.error("Error loading tags:", error)
    }
  }

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault()
    setTagLoading(true)
    setTagError("")
    setTagSuccess("")

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor
        })
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setTagSuccess("Tag created successfully!")
        setNewTagName("")
        setNewTagColor("#3B82F6")
        loadTags() // Reload tags
      } else {
        setTagError(data.error || "Failed to create tag")
      }
    } catch {
      setTagError("An error occurred. Please try again.")
    } finally {
      setTagLoading(false)
    }
  }

  const updateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTag) return
    setTagLoading(true)
    setTagError("")
    setTagSuccess("")

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTagName,
          color: editTagColor
        })
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setTagSuccess("Tag updated successfully!")
        setEditingTag(null)
        setEditTagName("")
        setEditTagColor("")
        loadTags() // Reload tags
      } else {
        setTagError(data.error || "Failed to update tag")
      }
    } catch {
      setTagError("An error occurred. Please try again.")
    } finally {
      setTagLoading(false)
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return

    setTagLoading(true)
    setTagError("")
    setTagSuccess("")

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setTagSuccess("Tag deleted successfully!")
        loadTags() // Reload tags
      } else {
        const data = await response.json() as { error?: string }
        setTagError(data.error || "Failed to delete tag")
      }
    } catch {
      setTagError("An error occurred. Please try again.")
    } finally {
      setTagLoading(false)
    }
  }

  // Keywords & Features functions
  const loadKeywords = async () => {
    try {
      const response = await fetch("/api/admin/keywords")
      if (response.ok) {
        const data = await response.json() as { keywords?: Keyword[] }
        setKeywords(data.keywords || [])
      }
    } catch {
      console.error("Error loading keywords:", error)
    }
  }

  const createKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    setKeywordLoading(true)
    setKeywordError("")
    setKeywordSuccess("")

    try {
      const response = await fetch("/api/admin/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newKeywordName,
          color: newKeywordColor
        })
      })

      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        setKeywordSuccess("Keyword created successfully")
        setNewKeywordName("")
        setNewKeywordColor("#7A8664")
        loadKeywords() // Reload keywords
      } else {
        setKeywordError(data.error || "Failed to create keyword")
      }
    } catch {
      setKeywordError("An error occurred. Please try again.")
    } finally {
      setKeywordLoading(false)
    }
  }

  const updateKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKeyword) return

    setKeywordLoading(true)
    setKeywordError("")
    setKeywordSuccess("")

    try {
      const response = await fetch(`/api/admin/keywords/${editingKeyword.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editKeywordName,
          color: editKeywordColor
        })
      })

      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        setKeywordSuccess("Keyword updated successfully")
        setEditingKeyword(null)
        setEditKeywordName("")
        setEditKeywordColor("")
        loadKeywords() // Reload keywords
      } else {
        setKeywordError(data.error || "Failed to update keyword")
      }
    } catch {
      setKeywordError("An error occurred. Please try again.")
    } finally {
      setKeywordLoading(false)
    }
  }

  const deleteKeyword = async (keywordId: string) => {
    if (!confirm("Are you sure you want to delete this keyword?")) return

    setKeywordLoading(true)
    setKeywordError("")
    setKeywordSuccess("")

    try {
      const response = await fetch(`/api/admin/keywords/${keywordId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setKeywordSuccess("Keyword deleted successfully!")
        loadKeywords() // Reload keywords
      } else {
        const data = await response.json() as { error?: string }
        setKeywordError(data.error || "Failed to delete keyword")
      }
    } catch {
      setKeywordError("An error occurred. Please try again.")
    } finally {
      setKeywordLoading(false)
    }
  }

  const startEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setEditTagName(tag.name)
    setEditTagColor(tag.color || "#C1664A")
  }

  const cancelEditTag = () => {
    setEditingTag(null)
    setEditTagName("")
    setEditTagColor("")
  }

  // Import functionality
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportError("")
      setImportSuccess("")
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return

    setImportLoading(true)
    setImportError("")
    setImportSuccess("")

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('type', importType)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json() as { count?: number; error?: string }

      if (response.ok) {
        setImportSuccess(`Successfully imported ${data.count} ${importType}!`)
        setImportFile(null)
        // Reset file input
        const fileInput = document.getElementById('importFile') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setImportError(data.error || 'Import failed')
      }
    } catch {
      setImportError('An error occurred during import')
    } finally {
      setImportLoading(false)
    }
  }

  const downloadSampleCSV = (type: string) => {
    let csvContent = ""
    let filename = ""

    if (type === "properties") {
      filename = "properties_sample.csv"
      csvContent = `name,propertyType,recipientName,streetAddress,postalCode,city,province,country,latitude,longitude,tags
"Villa Toscana","house","Mario Rossi","Via Roma 123","50100","Florence","FI","Italy","43.7696","11.2558","luxury,historic
"Modern Apartment","apartment","Giulia Bianchi","Corso Italia 45","20100","Milan","MI","Italy","45.4642","9.1900","modern,urban
"Beach House","estate","Alessandro Verdi","Via del Mare 78","00100","Rome","RM","Italy","41.9028","12.4964","beach,luxury"`
    } else {
      filename = "destinations_sample.csv"
      csvContent = `name,category,streetAddress,postalCode,city,province,country,latitude,longitude,tags
"Colosseum","attraction","Piazza del Colosseo 1","00184","Rome","RM","Italy","41.8902","12.4922","historic,landmark
"Florence Airport","airport","Via del Termine 11","50127","Florence","FI","Italy","43.8100","11.2050","transportation,international
"Florence International Airport","int_airport","Via del Termine 11","50127","Florence","FI","Italy","43.8100","11.2050","transportation,international
"Central Station","train_station","Piazza della Stazione","50123","Florence","FI","Italy","43.7764","11.2480","transportation,urban
"Bus Terminal","bus_station","Via della Stazione","50123","Florence","FI","Italy","43.7764","11.2480","transportation,urban"`
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Realtor management functions
  const fetchPartners = async () => {
    try {
      setPartnerLoading(true)
      const response = await fetch("/api/admin/partners")
      const data = await response.json() as { partners: Partner[] }
      
      if (response.ok) {
        setPartners(data.partners)
      }
    } catch {
      console.error("Error fetching partners:", error)
    } finally {
      setPartnerLoading(false)
    }
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
        setPartnerSubmitting(true)
        setPartnerError("")

    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPartner),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setShowAddPartner(false)
        setNewPartner({ name: "", email: "", password: "", company: "", phone: "" })
        fetchPartners()
      } else {
        setPartnerError(data.error || "Failed to create partner")
      }
    } catch {
      setPartnerError("Failed to create partner")
    } finally {
      setPartnerSubmitting(false)
    }
  }

  const togglePartnerStatus = async (partnerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchPartners()
      }
    } catch {
      console.error("Error updating realtor status:", error)
    }
  }

  const startEditPartner = (realtor: Partner) => {
    setEditingPartner(realtor)
    setEditPartner({
      name: realtor.name,
      email: realtor.email,
      password: "", // Don't pre-fill password for security
      company: realtor.company || "",
      phone: realtor.phone || ""
    })
    setEditPartnerError("")
  }

  const cancelEditPartner = () => {
    setEditingPartner(null)
    setEditPartner({
      name: "",
      email: "",
      password: "",
      company: "",
      phone: ""
    })
    setEditPartnerError("")
  }

  const handleEditPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPartner) return
    setEditPartnerSubmitting(true)
    setEditPartnerError("")

    try {
      const response = await fetch(`/api/admin/partners/${editingPartner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editPartner),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setEditingPartner(null)
        setEditPartner({
          name: "",
          email: "",
          password: "",
          company: "",
          phone: ""
        })
        fetchPartners()
      } else {
        setEditPartnerError(data.error || "Failed to update realtor")
      }
    } catch {
      setEditPartnerError("Failed to update realtor")
    } finally {
      setEditPartnerSubmitting(false)
    }
  }

  // User management functions
  const fetchUsers = async () => {
    try {
      setUserLoading(true)
      const response = await fetch("/api/admin/users")
      const data = await response.json() as { users: User[] }
      
      if (response.ok) {
        setUsers(data.users)
      }
    } catch {
      console.error("Error fetching users:", error)
    } finally {
      setUserLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserSubmitting(true)
    setUserError("")

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setShowAddUser(false)
        setNewUser({ name: "", email: "", password: "", role: "user" })
        fetchUsers()
      } else {
        setUserError(data.error || "Failed to create user")
      }
    } catch {
      setUserError("Failed to create user")
    } finally {
      setUserSubmitting(false)
    }
  }

  const startEditUser = (user: User) => {
    setEditingUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password for security
      role: user.role
    })
    setEditUserError("")
  }

  const cancelEditUser = () => {
    setEditingUser(null)
    setEditUser({
      name: "",
      email: "",
      password: "",
      role: "user"
    })
    setEditUserError("")
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setEditUserSubmitting(true)
    setEditUserError("")

    try {
      const response = await fetch(`/api/admin/users/manage/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editUser),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        setEditingUser(null)
        setEditUser({
          name: "",
          email: "",
          password: "",
          role: "user"
        })
        fetchUsers()
      } else {
        setEditUserError(data.error || "Failed to update user")
      }
    } catch {
      setEditUserError("Failed to update user")
    } finally {
      setEditUserSubmitting(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/users/manage/${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const data = await response.json() as { error?: string }
        alert(data.error || "Failed to delete user")
      }
    } catch {
      alert("Failed to delete user")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-ponte-cream">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-ponte-olive">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg border border-ponte-sand">
          <div className="px-6 py-4 border-b border-ponte-sand">
            <h1 className="text-2xl font-bold text-ponte-black">Settings</h1>
            <p className="mt-1 text-sm text-ponte-olive">
              Configure your application preferences
            </p>
          </div>

          <div className="p-6">
            {/* Tab Navigation */}
            <div className="border-b border-ponte-sand mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("user")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "user"
                      ? "border-ponte-terracotta text-ponte-terracotta"
                      : "border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand"
                  }`}
                >
                  User Settings
                </button>
                <button
                  onClick={() => setActiveTab("app")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "app"
                      ? "border-ponte-terracotta text-ponte-terracotta"
                      : "border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand"
                  }`}
                >
                  App Settings
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "import"
                      ? "border-ponte-terracotta text-ponte-terracotta"
                      : "border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand"
                  }`}
                >
                  Import Data
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "users"
                      ? "border-ponte-terracotta text-ponte-terracotta"
                      : "border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand"
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab("partners")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "partners"
                      ? "border-ponte-terracotta text-ponte-terracotta"
                      : "border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand"
                  }`}
                >
                  Partners
                </button>
              </nav>
        </div>

            {/* Tab Content */}
            {activeTab === "user" && (
              <div className="space-y-8">
                {/* Password Settings */}
                <div>
                  <h2 className="text-lg font-medium text-ponte-black mb-4">Account Security</h2>
                  <div className="bg-ponte-cream p-4 rounded-lg border border-ponte-sand">
                    <h3 className="text-sm font-medium text-ponte-black mb-3">Change Password</h3>
                    <p className="text-sm text-ponte-olive mb-4">
                      Update your account password for better security
                    </p>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-ponte-black mb-1">
                          Current Password
                        </label>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          required
                          className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
              </div>
              
              <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-ponte-black mb-1">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          required
                          className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-ponte-olive">
                          Must be at least 6 characters long
                        </p>
              </div>
              
              <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-ponte-black mb-1">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
              </div>

                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="text-sm text-red-600">{passwordError}</div>
            </div>
                      )}

                      {passwordSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="text-sm text-green-600">{passwordSuccess}</div>
          </div>
                      )}

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full px-4 py-2 bg-ponte-terracotta text-white rounded-md text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-ponte-terracotta disabled:opacity-50"
                      >
                        {passwordLoading ? "Changing Password..." : "Change Password"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "app" && (
              <div className="space-y-8">
                {/* Map Settings */}
                <div>
                  <h2 className="text-lg font-medium text-ponte-black mb-4">Map Settings</h2>
              <div className="bg-ponte-cream p-4 rounded-lg border border-ponte-sand">
                <h3 className="text-sm font-medium text-ponte-black mb-3">Default Map Location</h3>
                <p className="text-sm text-ponte-olive mb-4">
                  Set the default location and zoom level when the map loads
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={defaultLocation.lat}
                      onChange={(e) => setDefaultLocation(prev => ({ 
                        ...prev, 
                        lat: parseFloat(e.target.value) || 0 
                      }))}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                      placeholder="e.g., 40.7128"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={defaultLocation.lng}
                      onChange={(e) => setDefaultLocation(prev => ({ 
                        ...prev, 
                        lng: parseFloat(e.target.value) || 0 
                      }))}
                      className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                      placeholder="e.g., -74.0060"
                    />
            </div>
          </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-ponte-black mb-1">
                    Zoom Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={defaultLocation.zoom}
                    onChange={(e) => setDefaultLocation(prev => ({ 
                      ...prev, 
                      zoom: parseInt(e.target.value) || 10 
                    }))}
                    className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                    placeholder="e.g., 10"
                  />
                  <p className="mt-1 text-xs text-ponte-olive">
                    1 = World view, 20 = Street level detail
                  </p>
                </div>

                {/* Quick Location Presets */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDefaultLocation({ lat: 41.9028, lng: 12.4964, zoom: 10 })}
                      className="text-xs px-3 py-2 bg-ponte-sand text-ponte-black rounded hover:bg-primary-200"
                    >
                      Rome
                    </button>
                    <button
                      onClick={() => setDefaultLocation({ lat: 43.6158, lng: 13.5189, zoom: 10 })}
                      className="text-xs px-3 py-2 bg-ponte-sand text-ponte-black rounded hover:bg-primary-200"
                    >
                      Ancona
                    </button>
                    <button
                      onClick={() => setDefaultLocation({ lat: 43.9424, lng: 12.4578, zoom: 10 })}
                      className="text-xs px-3 py-2 bg-ponte-sand text-ponte-black rounded hover:bg-primary-200"
                    >
                      San Marino
                    </button>
                    <button
                      onClick={() => setDefaultLocation({ lat: 43.7696, lng: 11.2558, zoom: 10 })}
                      className="text-xs px-3 py-2 bg-ponte-sand text-ponte-black rounded hover:bg-primary-200"
                    >
                      Florence
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tag and Keywords Management - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tag Management */}
              <div>
              <h2 className="text-lg font-medium text-ponte-black mb-4">Tag Management</h2>
              <div className="bg-ponte-cream p-4 rounded-lg border border-ponte-sand">
                <h3 className="text-sm font-medium text-ponte-black mb-3">Create New Tag</h3>
                <form onSubmit={createTag} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="newTagName" className="block text-sm font-medium text-ponte-black mb-1">
                        Tag Name
                      </label>
                      <input
                        type="text"
                        id="newTagName"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                        placeholder="e.g., Beach, Luxury, Family"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setNewTagColor(color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newTagColor === color.value
                                ? 'border-ponte-black scale-110'
                                : 'border-ponte-sand hover:border-ponte-olive hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-ponte-olive">
                        Selected: {colorPalette.find(c => c.value === newTagColor)?.name || 'Custom'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={tagLoading}
                    className="w-full px-4 py-2 bg-ponte-terracotta text-white rounded-md text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-ponte-terracotta disabled:opacity-50"
                  >
                    {tagLoading ? "Creating..." : "Create Tag"}
                  </button>
                </form>
              </div>

              {/* Existing Tags */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-ponte-black mb-3">Existing Tags</h3>
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 bg-white border border-ponte-sand rounded-md">
                      {editingTag?.id === tag.id ? (
                        <form onSubmit={updateTag} className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            className="flex-1 px-3 py-1 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                            required
                          />
                          <div className="flex items-center space-x-1">
                            <div className="grid grid-cols-4 gap-1">
                              {colorPalette.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => setEditTagColor(color.value)}
                                  className={`w-6 h-6 rounded-full border transition-all ${
                                    editTagColor === color.value
                                      ? 'border-ponte-black scale-110'
                                      : 'border-ponte-sand hover:border-ponte-olive hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={tagLoading}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTag}
                            className="px-3 py-1 bg-ponte-olive text-white text-xs rounded hover:bg-primary-600"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color || "#3B82F6" }}
                            ></div>
                            <span className="text-sm font-medium text-ponte-black">{tag.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditTag(tag)}
                              className="text-xs text-ponte-terracotta hover:text-accent-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <div className="text-center py-4 text-ponte-olive">
                      No tags created yet. Create your first tag above.
                    </div>
                  )}
                </div>
              </div>

              {/* Tag Error/Success Messages */}
              {tagError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm text-red-600">{tagError}</div>
                </div>
              )}
              {tagSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="text-sm text-green-600">{tagSuccess}</div>
            </div>
          )}
        </div>

              {/* Keywords & Features Management */}
              <div>
              <h2 className="text-lg font-medium text-ponte-black mb-4">Keywords & Features Management</h2>
              <div className="bg-ponte-cream p-4 rounded-lg border border-ponte-sand">
                <h3 className="text-sm font-medium text-ponte-black mb-3">Create New Keyword</h3>
                <form onSubmit={createKeyword} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="newKeywordName" className="block text-sm font-medium text-ponte-black mb-1">
                        Keyword Name
                      </label>
                      <input
                        type="text"
                        id="newKeywordName"
                        value={newKeywordName}
                        onChange={(e) => setNewKeywordName(e.target.value)}
                        className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                        placeholder="e.g., family friendly, great sand, romantic sunset"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setNewKeywordColor(color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newKeywordColor === color.value
                                ? 'border-ponte-black scale-110'
                                : 'border-ponte-sand hover:border-ponte-olive hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-ponte-olive">
                        Selected: {colorPalette.find(c => c.value === newKeywordColor)?.name || 'Custom'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={keywordLoading}
                    className="w-full px-4 py-2 bg-ponte-olive text-white rounded-md text-sm font-medium hover:bg-ponte-olive/80 focus:outline-none focus:ring-2 focus:ring-ponte-olive disabled:opacity-50"
                  >
                    {keywordLoading ? "Creating..." : "Create Keyword"}
                  </button>
                </form>
              </div>

              {/* Existing Keywords */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-ponte-black mb-3">Existing Keywords</h3>
                <div className="space-y-2">
                  {keywords.map((keyword) => (
                    <div key={keyword.id} className="flex items-center justify-between p-3 bg-white border border-ponte-sand rounded-md">
                      {editingKeyword?.id === keyword.id ? (
                        <form onSubmit={updateKeyword} className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editKeywordName}
                            onChange={(e) => setEditKeywordName(e.target.value)}
                            className="flex-1 px-3 py-1 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                            required
                          />
                          <div className="flex items-center space-x-1">
                            <div className="grid grid-cols-4 gap-1">
                              {colorPalette.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => setEditKeywordColor(color.value)}
                                  className={`w-6 h-6 rounded-full border transition-all ${
                                    editKeywordColor === color.value
                                      ? 'border-ponte-black scale-110'
                                      : 'border-ponte-sand hover:border-ponte-olive hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={keywordLoading}
                            className="px-3 py-1 bg-ponte-olive text-white text-xs rounded hover:bg-ponte-olive/80 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKeyword(null)
                              setEditKeywordName("")
                              setEditKeywordColor("")
                            }}
                            className="px-3 py-1 bg-ponte-terracotta text-white text-xs rounded hover:bg-ponte-terracotta/80"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: keyword.color || "#7A8664" }}
                            />
                            <span className="text-sm font-medium text-ponte-black">{keyword.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingKeyword(keyword)
                                setEditKeywordName(keyword.name)
                                setEditKeywordColor(keyword.color || "#7A8664")
                              }}
                              className="px-2 py-1 bg-ponte-olive text-white text-xs rounded hover:bg-ponte-olive/80"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteKeyword(keyword.id)}
                              className="px-2 py-1 bg-ponte-terracotta text-white text-xs rounded hover:bg-ponte-terracotta/80"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {keywords.length === 0 && (
                    <div className="text-center py-4 text-ponte-olive">
                      No keywords created yet. Create your first keyword above.
                    </div>
                  )}
                </div>
              </div>

              {/* Keyword Error/Success Messages */}
              {keywordError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm text-red-600">{keywordError}</div>
                </div>
              )}
              {keywordSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="text-sm text-green-600">{keywordSuccess}</div>
                </div>
              )}
              </div>
            </div>
              </div>
            )}

            {activeTab === "import" && (
              <div className="space-y-8">
                {/* Import Data */}
                <div>
                  <h2 className="text-lg font-medium text-ponte-black mb-4">Import Data</h2>
                  <div className="bg-ponte-cream p-4 rounded-lg border border-ponte-sand">
                    <h3 className="text-sm font-medium text-ponte-black mb-3">Import Properties or Destinations</h3>
                    <p className="text-sm text-ponte-olive mb-4">
                      Upload a CSV file to import multiple properties or destinations at once
                    </p>
                    
                    <form onSubmit={handleImport} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-ponte-black mb-2">
                          Import Type
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="importType"
                              value="properties"
                              checked={importType === "properties"}
                              onChange={(e) => setImportType(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm text-ponte-black">Properties</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="importType"
                              value="destinations"
                              checked={importType === "destinations"}
                              onChange={(e) => setImportType(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm text-ponte-black">Destinations</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ponte-black mb-2">
                          CSV File
                        </label>
                        <input
                          id="importFile"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
                          required
                        />
                        <p className="mt-1 text-xs text-ponte-olive">
                          Select a CSV file to import
                        </p>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => downloadSampleCSV(importType)}
                          className="px-4 py-2 border border-ponte-sand rounded-md text-sm font-medium text-ponte-black bg-white hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                        >
                          Download Sample CSV
                        </button>
                        
                        <button
                          type="submit"
                          disabled={importLoading || !importFile}
                          className="px-4 py-2 bg-ponte-terracotta text-white rounded-md text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-ponte-terracotta disabled:opacity-50"
                        >
                          {importLoading ? "Importing..." : "Import Data"}
                        </button>
                      </div>
                    </form>

                    {/* Import Instructions */}
                    <div className="mt-6 p-4 bg-ponte-sand rounded-lg">
                      <h4 className="text-sm font-medium text-ponte-black mb-2">CSV Format Instructions</h4>
                      <div className="text-xs text-ponte-olive space-y-2">
                        <div>
                          <p className="font-semibold text-ponte-black">Properties CSV - Required Fields:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1 mt-1">
                            <li><strong>name</strong> (required) - Property name</li>
                            <li><strong>latitude, longitude</strong> (required) - GPS coordinates</li>
                            <li><strong>propertyType</strong> (optional) - house/condo/apartment/estate</li>
                            <li><strong>recipientName, streetAddress, postalCode, city, province, country</strong> (optional)</li>
                            <li><strong>tags</strong> (optional) - comma-separated tags</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-ponte-black">Destinations CSV - Required Fields:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1 mt-1">
                            <li><strong>name</strong> (required) - Destination name</li>
                            <li><strong>latitude, longitude</strong> (required) - GPS coordinates</li>
                            <li><strong>category</strong> (required) - airport/int_airport/train_station/bus_station/attraction/etc.</li>
                            <li><strong>streetAddress, postalCode, city, province, country</strong> (optional)</li>
                            <li><strong>tags</strong> (optional) - comma-separated tags</li>
                          </ul>
                          <p className="text-xs text-ponte-terracotta mt-2">
                            <strong>Valid categories:</strong> airport, int_airport, train_station, bus_station, attraction, beach, hotel, restaurant, etc.
                          </p>
                        </div>
                        <p className="text-ponte-terracotta font-medium">💡 Download the sample CSV files above to see the exact format!</p>
                      </div>
                    </div>

                    {/* Import Messages */}
                    {importError && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="text-sm text-red-600">{importError}</div>
                      </div>
                    )}
                    {importSuccess && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="text-sm text-green-600">{importSuccess}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab Content */}
            {activeTab === "users" && (
              <div className="space-y-8">
                {/* User Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-ponte-black">Manage Users</h2>
                    <button
                      onClick={() => setShowAddUser(true)}
                      className="bg-ponte-olive text-white px-4 py-2 rounded-lg hover:bg-ponte-olive/80 transition-colors"
                    >
                      + Add User
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-ponte-olive rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👥</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ponte-olive">Total Users</p>
                          <p className="text-2xl font-bold text-ponte-black">{users.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👑</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ponte-olive">Admins</p>
                          <p className="text-2xl font-bold text-ponte-black">
                            {users.filter((u) => u.role === "admin").length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👤</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ponte-olive">Regular Users</p>
                          <p className="text-2xl font-bold text-ponte-black">
                            {users.filter((u) => u.role === "user").length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="bg-white rounded-lg shadow-lg border border-ponte-sand">
                    <div className="px-6 py-4 border-b border-ponte-sand">
                      <h3 className="text-lg font-semibold text-ponte-black">User Accounts</h3>
                    </div>
                    
                    {userLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-olive mx-auto"></div>
                        <p className="mt-4 text-ponte-olive">Loading users...</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-lg font-medium text-ponte-black mb-2">No users yet</h3>
                        <p className="text-ponte-olive mb-4">Create your first user account</p>
                        <button
                          onClick={() => setShowAddUser(true)}
                          className="bg-ponte-olive text-white px-6 py-2 rounded-lg hover:bg-ponte-olive/80 transition-colors"
                        >
                          Add User
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ponte-sand">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Properties
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Clients
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Created
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-ponte-sand">
                            {users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-ponte-black">
                                      {user.name}
                                    </div>
                                    <div className="text-sm text-ponte-olive">
                                      {user.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.role === "admin" 
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}>
                                    {user.role === "admin" ? "Admin" : "User"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-ponte-black">
                                    {user._count?.properties || 0}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-ponte-black">
                                    {user._count?.clients || 0}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => startEditUser(user)}
                                      className="text-ponte-olive hover:text-ponte-black"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteUser(user.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Delete
                                    </button>
                                  </div>
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
            )}

            {/* Realtors Tab Content */}
            {activeTab === "partners" && (
              <div className="space-y-8">
                {/* Partner Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-ponte-black">Manage Partners</h2>
                    <button
                      onClick={() => setShowAddPartner(true)}
                      className="bg-ponte-olive text-white px-4 py-2 rounded-lg hover:bg-ponte-olive/80 transition-colors"
                    >
                      + Add Partner
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-ponte-olive rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👥</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ponte-olive">Total Realtors</p>
                          <p className="text-2xl font-bold text-ponte-black">{partners.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ponte-olive">Active Realtors</p>
                          <p className="text-2xl font-bold text-ponte-black">
                            {partners.filter((r) => r.isActive).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 border border-ponte-sand">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">🏠</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ponte-olive">Total Properties</p>
                          <p className="text-2xl font-bold text-ponte-black">
                            {partners.reduce((sum: number, r) => sum + (r._count?.properties || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Realtors List */}
                  <div className="bg-white rounded-lg shadow-lg border border-ponte-sand">
                    <div className="px-6 py-4 border-b border-ponte-sand">
                      <h3 className="text-lg font-semibold text-ponte-black">Realtor Accounts</h3>
                    </div>
                    
                    {partnerLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-olive mx-auto"></div>
                        <p className="mt-4 text-ponte-olive">Loading partners...</p>
                      </div>
                    ) : partners.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-lg font-medium text-ponte-black mb-2">No partners yet</h3>
                        <p className="text-ponte-olive mb-4">Create your first partner account</p>
                        <button
                          onClick={() => setShowAddPartner(true)}
                          className="bg-ponte-olive text-white px-6 py-2 rounded-lg hover:bg-ponte-olive/80 transition-colors"
                        >
                          Add Partner
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ponte-sand">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Realtor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Company
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Properties
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Created
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-ponte-sand">
                            {partners.map((realtor) => (
                              <tr key={realtor.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-ponte-black">
                                      {realtor.name}
                                    </div>
                                    <div className="text-sm text-ponte-olive">
                                      {realtor.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-ponte-black">
                                    {realtor.company || "N/A"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-ponte-black">
                                    {realtor._count?.properties || 0}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    realtor.isActive 
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {realtor.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                                  {new Date(realtor.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => startEditPartner(realtor)}
                                      className="text-ponte-olive hover:text-ponte-black"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => togglePartnerStatus(realtor.id, realtor.isActive)}
                                      className={`${
                                        realtor.isActive 
                                          ? "text-red-600 hover:text-red-900"
                                          : "text-green-600 hover:text-green-900"
                                      }`}
                                    >
                                      {realtor.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                  </div>
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
            )}

            {/* Add Realtor Modal */}
            {showAddPartner && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-ponte-black">Add New Realtor</h3>
                      <button
                        onClick={() => setShowAddPartner(false)}
                        className="text-ponte-olive hover:text-ponte-black"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleAddPartner} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newPartner.name}
                            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newPartner.email}
                            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ponte-black mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                          value={newPartner.password}
                          onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newPartner.company}
                            onChange={(e) => setNewPartner({ ...newPartner, company: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newPartner.phone}
                            onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      {partnerError && (
                        <div className="text-red-600 text-sm">
                          {partnerError}
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddPartner(false)}
                          className="px-4 py-2 border border-ponte-sand text-ponte-olive rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={partnerSubmitting}
                          className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-olive/80 disabled:opacity-50"
                        >
                          {partnerSubmitting ? "Creating..." : "Create Realtor"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-ponte-black">Add New User</h3>
                      <button
                        onClick={() => setShowAddUser(false)}
                        className="text-ponte-olive hover:text-ponte-black"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Role *
                          </label>
                          <select
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      {userError && (
                        <div className="text-red-600 text-sm">
                          {userError}
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddUser(false)}
                          className="px-4 py-2 border border-ponte-sand text-ponte-olive rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={userSubmitting}
                          className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-olive/80 disabled:opacity-50"
                        >
                          {userSubmitting ? "Creating..." : "Create User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-ponte-black">Edit User</h3>
                      <button
                        onClick={cancelEditUser}
                        className="text-ponte-olive hover:text-ponte-black"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleEditUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editUser.name}
                            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editUser.email}
                            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editUser.password}
                            onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                            placeholder="Leave blank to keep current password"
                          />
                          <p className="text-xs text-ponte-olive mt-1">
                            Leave blank to keep the current password
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Role *
                          </label>
                          <select
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editUser.role}
                            onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      {editUserError && (
                        <div className="text-red-600 text-sm">
                          {editUserError}
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={cancelEditUser}
                          className="px-4 py-2 border border-ponte-sand text-ponte-olive rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={editUserSubmitting}
                          className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-olive/80 disabled:opacity-50"
                        >
                          {editUserSubmitting ? "Updating..." : "Update User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Realtor Modal */}
            {editingPartner && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-ponte-black">Edit Realtor</h3>
                      <button
                        onClick={cancelEditPartner}
                        className="text-ponte-olive hover:text-ponte-black"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleEditPartner} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editPartner.name}
                            onChange={(e) => setEditPartner({ ...editPartner, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editPartner.email}
                            onChange={(e) => setEditPartner({ ...editPartner, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ponte-black mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                          value={editPartner.password}
                          onChange={(e) => setEditPartner({ ...editPartner, password: e.target.value })}
                          placeholder="Leave blank to keep current password"
                        />
                        <p className="text-xs text-ponte-olive mt-1">
                          Leave blank to keep the current password
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editPartner.company}
                            onChange={(e) => setEditPartner({ ...editPartner, company: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ponte-black mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                            value={editPartner.phone}
                            onChange={(e) => setEditPartner({ ...editPartner, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      {editPartnerError && (
                        <div className="text-red-600 text-sm">
                          {editPartnerError}
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={cancelEditPartner}
                          className="px-4 py-2 border border-ponte-sand text-ponte-olive rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={editPartnerSubmitting}
                          className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-olive/80 disabled:opacity-50"
                        >
                          {editPartnerSubmitting ? "Updating..." : "Update Realtor"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-sm text-green-600">{success}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 border border-ponte-sand rounded-md text-sm font-medium text-ponte-black bg-white hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
              >
                Reset to Defaults
              </button>
              
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 bg-ponte-terracotta text-white rounded-md text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-ponte-terracotta disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}