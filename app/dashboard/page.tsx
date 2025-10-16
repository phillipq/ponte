"use client"

import Navigation from "components/Navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Property {
  id: string
  address: string
  name?: string
  propertyType: string
  tags: string[]
  latitude: number
  longitude: number
  createdAt: string
}

interface Destination {
  id: string
  name: string
  address: string
  category: string
  latitude: number
  longitude: number
  tags: string[]
  createdAt: string
}

interface Client {
  id: string
  name: string
  email?: string
  company?: string
  preferredProperties?: string[]
  createdAt: string
  aiAnalyses?: unknown[]
  questionnaireResponseSets?: unknown[]
}

interface StatItem {
  type?: string
  category?: string
  count: number
  percentage: number
}

export default function Dashboard() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

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
      const [propertiesRes, destinationsRes, clientsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/destinations"),
        fetch("/api/clients")
      ])

      if (propertiesRes.ok) {
        const data = await propertiesRes.json() as { properties?: Property[] }
        setProperties(data.properties || [])
      }

      if (destinationsRes.ok) {
        const data = await destinationsRes.json() as { destinations?: Destination[] }
        setDestinations(data.destinations || [])
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

  // Helper functions for statistics
  const getPropertyTypeStats = () => {
    const stats = properties.reduce((acc, property) => {
      const type = property.propertyType || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(stats).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / properties.length) * 100)
    }))
  }

  const normalizeCategory = (category: string) => {
    if (!category) return 'other'
    
    const normalized = category.toLowerCase().trim()
    
    // Handle international airport variations
    if (normalized.includes('international') && normalized.includes('airport')) {
      return 'int_airport'
    }
    
    // Handle other variations
    const categoryMap: { [key: string]: string } = {
      'airport': 'airport',
      'bus station': 'bus_station',
      'bus': 'bus_station',
      'train station': 'train_station',
      'train': 'train_station',
      'attraction': 'attraction',
      'beach': 'beach',
      'entertainment': 'entertainment',
      'hospital': 'hospital',
      'hotel': 'hotel',
      'museum': 'museum',
      'mountain': 'mountain',
      'park': 'park',
      'restaurant': 'restaurant',
      'school': 'school',
      'shopping': 'shopping'
    }
    
    return categoryMap[normalized] || 'other'
  }

  const getDestinationCategoryStats = () => {
    const stats = destinations.reduce((acc, destination) => {
      const normalizedCategory = normalizeCategory(destination.category)
      acc[normalizedCategory] = (acc[normalizedCategory] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(stats).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / destinations.length) * 100)
    }))
  }

  const getPropertyTypeInfo = (type: string) => {
    const typeMap: { [key: string]: { label: string, icon: string } } = {
      'house': { label: 'House', icon: '/logos/icon-house.png' },
      'condo': { label: 'Condo', icon: '/logos/icon-condo.png' },
      'apartment': { label: 'Apartment', icon: '/logos/icon-apartment.png' },
      'estate': { label: 'Estate', icon: '/logos/icon-estate.png' }
    }
    return typeMap[type] || { label: type, icon: '/logos/icon-property.png' }
  }

  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { label: string, icon: string } } = {
      'int_airport': { label: 'International Airport', icon: '/logos/icon-int-airport.png' },
      'airport': { label: 'Airport', icon: '/logos/icon-airport.png' },
      'bus_station': { label: 'Bus Station', icon: '/logos/icon-bus.png' },
      'train_station': { label: 'Train Station', icon: '/logos/icon-train.png' },
      'attraction': { label: 'Attraction', icon: '/logos/icon-destination.png' },
      'beach': { label: 'Beach', icon: '/logos/icon-beach.png' },
      'entertainment': { label: 'Entertainment', icon: '/logos/icon-entertainment.png' },
      'hospital': { label: 'Hospital', icon: '/logos/icon-destination.png' },
      'hotel': { label: 'Hotel', icon: '/logos/icon-hotel.png' },
      'museum': { label: 'Museum', icon: '/logos/icon-destination.png' },
      'mountain': { label: 'Mountain', icon: '/logos/icon-destination.png' },
      'other': { label: 'Other', icon: '/logos/icon-destination.png' },
      'park': { label: 'Park', icon: '/logos/icon-destination.png' },
      'restaurant': { label: 'Restaurant', icon: '/logos/icon-restaurant.png' },
      'school': { label: 'School', icon: '/logos/icon-destination.png' },
      'shopping': { label: 'Shopping', icon: '/logos/icon-destination.png' }
    }
    return categoryMap[category] || { label: category, icon: '/logos/icon-destination.png' }
  }

  // Client analytics functions
  const getClientStats = () => {
    const totalClients = clients.length
    const clientsWithAiAnalysis = clients.filter(client => 
      client.aiAnalyses && client.aiAnalyses.length > 0
    ).length
    const clientsWithoutAiAnalysis = totalClients - clientsWithAiAnalysis
    const clientsWithPreferences = clients.filter(client => 
      client.preferredProperties && client.preferredProperties.length > 0
    ).length

    return {
      totalClients,
      clientsWithAiAnalysis,
      clientsWithoutAiAnalysis,
      clientsWithPreferences
    }
  }

  const getDistanceCalculationStats = () => {
    // This would need to be calculated based on PropertyDistance records
    // For now, we'll estimate based on properties and destinations
    const totalPossibleDistances = properties.length * destinations.length
    return {
      totalPossibleDistances,
      hasCalculations: totalPossibleDistances > 0
    }
  }

  // Simple pie chart component
  const PieChart = ({ data, title, getInfo }: { data: StatItem[], title: string, getInfo: (item: string) => { label: string, icon: string } }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0)
    if (total === 0) return null

    let currentAngle = 0
    const colors = ['#C1664A', '#7A8664', '#D3BFA4', '#FDF9F3', '#222222', '#C1664A', '#7A8664', '#D3BFA4']

  return (
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          <svg width="120" height="120" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.count / total) * 100
              const angle = (percentage / 100) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle
              currentAngle += angle

              const radius = 50
              const centerX = 60
              const centerY = 60
              
              const startAngleRad = (startAngle * Math.PI) / 180
              const endAngleRad = (endAngle * Math.PI) / 180
              
              const x1 = centerX + radius * Math.cos(startAngleRad)
              const y1 = centerY + radius * Math.sin(startAngleRad)
              const x2 = centerX + radius * Math.cos(endAngleRad)
              const y2 = centerY + radius * Math.sin(endAngleRad)
              
              const largeArcFlag = angle > 180 ? 1 : 0
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')

              return (
                <path
                  key={item.type || item.category}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
                        </svg>
                      </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-ponte-black">{title}</h3>
          {data.map((item, _index) => {
            const info = getInfo(item.type || item.category || '')
            return (
              <div key={item.type || item.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src={info.icon} alt={info.label} width={16} height={16} className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium text-ponte-black">{info.label}</span>
                    </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-ponte-black">{item.count}</span>
                  <span className="text-xs text-ponte-olive ml-2">({item.percentage}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-4 text-ponte-olive font-body">Loading Dashboard...</p>
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
          <h1 className="text-3xl font-bold text-ponte-black">Property Mapping Dashboard</h1>
          <p className="mt-2 text-ponte-olive">Overview of your properties and destinations</p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <div className="flex items-center">
              <div className="p-2 bg-ponte-terracotta rounded-lg">
                <Image src="/logos/icon-property.png" alt="Properties" width={24} height={24} className="w-6 h-6" />
                    </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">Total Properties</p>
                <p className="text-2xl font-bold text-ponte-black">{properties.length}</p>
                  </div>
                </div>
              </div>

          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
                  <div className="flex items-center">
              <div className="p-2 bg-ponte-olive rounded-lg">
                <Image src="/logos/icon-destination.png" alt="Destinations" width={24} height={24} className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">Total Destinations</p>
                <p className="text-2xl font-bold text-ponte-black">{destinations.length}</p>
              </div>
                      </div>
                    </div>

          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <div className="flex items-center">
              <div className="p-2 bg-ponte-sand rounded-lg">
                <Image src="/logos/icon-distance.png" alt="Types" width={24} height={24} className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">Property Types</p>
                <p className="text-2xl font-bold text-ponte-black">{getPropertyTypeStats().length}</p>
                    </div>
                  </div>
                </div>

          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <div className="flex items-center">
              <div className="p-2 bg-ponte-terracotta rounded-lg">
                <Image src="/logos/icon-client.png" alt="Clients" width={24} height={24} className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ponte-olive">Total Clients</p>
                <p className="text-2xl font-bold text-ponte-black">{getClientStats().totalClients}</p>
              </div>
            </div>
          </div>

                  </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Property Types Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-6">Property Types</h2>
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-ponte-olive">No properties to display</p>
                </div>
              ) : (
              <PieChart 
                data={getPropertyTypeStats()} 
                title="Property Distribution"
                getInfo={getPropertyTypeInfo}
              />
              )}
            </div>

          {/* Destination Categories Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-6">Destination Categories</h2>
            {destinations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-ponte-olive">No destinations to display</p>
              </div>
            ) : (
              <PieChart 
                data={getDestinationCategoryStats()} 
                title="Destination Distribution"
                getInfo={getCategoryInfo}
              />
            )}
          </div>
        </div>

        {/* Client Analytics & Missing Calculations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Analysis Status */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h3 className="text-lg font-semibold text-ponte-black mb-4 flex items-center">
              <div className="p-2 bg-ponte-terracotta rounded-lg mr-3">
                <Image src="/logos/icon-analysis.png" alt="AI Analysis" width={20} height={20} className="w-5 h-5" />
              </div>
              AI Analysis Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ponte-olive">Clients with AI Analysis</span>
                <span className="font-semibold text-green-600">{getClientStats().clientsWithAiAnalysis}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ponte-olive">Clients without AI Analysis</span>
                <span className={`font-semibold ${getClientStats().clientsWithoutAiAnalysis > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getClientStats().clientsWithoutAiAnalysis}
                </span>
              </div>
              {getClientStats().clientsWithoutAiAnalysis > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    ⚠️ {getClientStats().clientsWithoutAiAnalysis} client(s) need AI analysis
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Distance Calculations Status */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h3 className="text-lg font-semibold text-ponte-black mb-4 flex items-center">
              <div className="p-2 bg-ponte-terracotta rounded-lg mr-3">
                <Image src="/logos/icon-combined.png" alt="Distance Calculations" width={20} height={20} className="w-5 h-5" />
              </div>
              Distance Calculations
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ponte-olive">Properties</span>
                <span className="font-semibold text-ponte-black">{properties.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ponte-olive">Destinations</span>
                <span className="font-semibold text-ponte-black">{destinations.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ponte-olive">Possible Distance Pairs</span>
                <span className="font-semibold text-ponte-black">{getDistanceCalculationStats().totalPossibleDistances}</span>
              </div>
              {getDistanceCalculationStats().totalPossibleDistances > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    💡 Run distance analysis to calculate travel times between properties and destinations
                  </p>
                </div>
              )}
            </div>
          </div>
            </div>

        {/* Client Preferences Overview */}
        <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand mb-8">
          <h3 className="text-lg font-semibold text-ponte-black mb-4 flex items-center">
            <div className="p-2 bg-ponte-terracotta rounded-lg mr-3">
              <Image src="/logos/icon-preference.png" alt="Client Preferences" width={20} height={20} className="w-5 h-5" />
            </div>
            Client Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-ponte-cream rounded-lg">
              <p className="text-2xl font-bold text-ponte-black">{getClientStats().clientsWithPreferences}</p>
              <p className="text-sm text-ponte-olive">Clients with Manual Preferences</p>
            </div>
            <div className="text-center p-4 bg-ponte-cream rounded-lg">
              <p className="text-2xl font-bold text-ponte-black">{getClientStats().totalClients - getClientStats().clientsWithPreferences}</p>
              <p className="text-sm text-ponte-olive">Clients without Preferences</p>
            </div>
            <div className="text-center p-4 bg-ponte-cream rounded-lg">
              <p className="text-2xl font-bold text-ponte-black">
                {getClientStats().totalClients > 0 ? Math.round((getClientStats().clientsWithPreferences / getClientStats().totalClients) * 100) : 0}%
              </p>
              <p className="text-sm text-ponte-olive">Preference Coverage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}