"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Partner {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
}

interface Property {
  id: string
  name: string
  propertyType: string
  streetAddress?: string
  city?: string
  status: string
  createdAt: string
}

export default function PartnerDashboard() {
  const router = useRouter()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<"en" | "it">("en")

  // Translations
  const translations = {
    en: {
      title: "Partner Dashboard",
      welcome: "Welcome back",
      totalProperties: "Total Properties",
      activeProperties: "Active Properties",
      thisMonth: "This Month",
      yourProperties: "Your Properties",
      noProperties: "No properties yet",
      noPropertiesSubtitle: "Start by adding your first property",
      addProperty: "Add Property",
      logout: "Logout",
      status: "Status",
      name: "Name",
      type: "Type",
      city: "City",
      createdAt: "Created",
      actions: "Actions"
    },
    it: {
      title: "Dashboard Agente",
      welcome: "Bentornato",
      totalProperties: "Proprietà Totali",
      activeProperties: "Proprietà Attive",
      thisMonth: "Questo Mese",
      yourProperties: "Le Tue Proprietà",
      noProperties: "Nessuna proprietà ancora",
      noPropertiesSubtitle: "Inizia aggiungendo la tua prima proprietà",
      addProperty: "Aggiungi Proprietà",
      logout: "Esci",
      status: "Stato",
      name: "Nome",
      type: "Tipo",
      city: "Città",
      createdAt: "Creato",
      actions: "Azioni"
    }
  }

  const t = translations[language]

  useEffect(() => {
    // Check if partner is logged in
    const partnerSession = localStorage.getItem("partnerSession")
    if (!partnerSession) {
      router.push("/partner/login")
      return
    }

    const sessionData = JSON.parse(partnerSession) as { partner: Partner }
    setPartner(sessionData.partner)
    
    // Fetch partner's properties
    fetchProperties()
  }, [router])

  const fetchProperties = async () => {
    try {
      const partnerSession = localStorage.getItem("partnerSession")
      if (!partnerSession) return

      const sessionData = JSON.parse(partnerSession) as { partner: Partner }
      const response = await fetch(`/api/partner/properties?partnerId=${sessionData.partner.id}`)
      const data = await response.json() as { properties: Property[] }

      if (response.ok) {
        setProperties(data.properties)
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("partnerSession")
    router.push("/partner/login")
  }

  const propertyTypes = [
    { value: "house", label: "House", icon: "🏠" },
    { value: "condo", label: "Condo", icon: "🏢" },
    { value: "apartment", label: "Apartment", icon: "🏘️" },
    { value: "estate", label: "Estate", icon: "🏰" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-ponte-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ponte-olive mx-auto"></div>
          <p className="mt-4 text-ponte-olive">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-ponte-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logos/icon-property.png"
                  alt="Property"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <div>
                  <h1 className="text-2xl font-bold text-ponte-black font-serif">
                    {t.title}
                  </h1>
                  <p className="text-ponte-olive font-medium">
                    {t.welcome}, {partner?.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === "en" 
                      ? "bg-ponte-olive text-white" 
                      : "text-gray-600 hover:text-ponte-black"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("it")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === "it" 
                      ? "bg-ponte-olive text-white" 
                      : "text-gray-600 hover:text-ponte-black"
                  }`}
                >
                  IT
                </button>
              </div>
              <button
                onClick={() => router.push("/partner/properties/new")}
                className="bg-ponte-olive text-white px-6 py-3 rounded-lg hover:bg-ponte-olive/90 transition-all duration-200 font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <Image
                  src="/logos/icon-property.png"
                  alt="Add Property"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                <span>{t.addProperty}</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-ponte-olive hover:text-ponte-black transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-ponte-sand p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ponte-olive rounded-lg flex items-center justify-center">
                  <Image
                    src="/logos/icon-property.png"
                    alt="Properties"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">{t.totalProperties}</p>
                <p className="text-2xl font-bold text-ponte-black font-serif">{properties.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-ponte-sand p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ponte-olive rounded-lg flex items-center justify-center">
                  <Image
                    src="/logos/icon-analysis.png"
                    alt="Analysis"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">{t.activeProperties}</p>
                <p className="text-2xl font-bold text-ponte-black font-serif">
                  {properties.filter(p => p.status === "active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-ponte-sand p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ponte-olive rounded-lg flex items-center justify-center">
                  <Image
                    src="/logos/icon-client.png"
                    alt="Clients"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">{t.thisMonth}</p>
                <p className="text-2xl font-bold text-ponte-black font-serif">
                  {properties.filter(p => {
                    const created = new Date(p.createdAt)
                    const now = new Date()
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-lg shadow-sm border border-ponte-sand">
          <div className="px-6 py-4 border-b border-ponte-sand">
            <div className="flex items-center space-x-3">
              <Image
                src="/logos/icon-property.png"
                alt="Properties"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <h2 className="text-lg font-semibold text-ponte-black font-serif">{t.yourProperties}</h2>
            </div>
          </div>
          
          {properties.length === 0 ? (
            <div className="p-8 text-center">
              <Image
                src="/logos/icon-property.png"
                alt="No Properties"
                width={64}
                height={64}
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium text-ponte-black mb-2 font-serif">{t.noProperties}</h3>
              <p className="text-ponte-olive mb-6">{t.noPropertiesSubtitle}</p>
              <button
                onClick={() => router.push("/partner/properties/new")}
                className="bg-ponte-olive text-white px-6 py-3 rounded-lg hover:bg-ponte-olive/90 transition-all duration-200 font-medium flex items-center space-x-2 mx-auto shadow-sm hover:shadow-md"
              >
                <Image
                  src="/logos/icon-property.png"
                  alt="Add Property"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                <span>{t.addProperty}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ponte-sand">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      {t.name}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      {t.type}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      {t.city}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      {t.status}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ponte-olive uppercase tracking-wider">
                      {t.createdAt}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-ponte-sand">
                  {properties.map((property) => {
                    const typeInfo = propertyTypes.find(t => t.value === property.propertyType)
                    return (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-ponte-black">
                            {property.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{typeInfo?.icon}</span>
                            <span className="text-sm text-ponte-olive">{typeInfo?.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-ponte-black">
                            {property.streetAddress && property.city 
                              ? `${property.streetAddress}, ${property.city}`
                              : "Location not specified"
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === "active" 
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
