"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "components/Button"

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Map", href: "/map" },
  { name: "Properties", href: "/properties" },
  { name: "Destinations", href: "/destinations" },
  { name: "Clients", href: "/clients" },
  { name: "Questionnaire", href: "/questionnaire" },
  { name: "Analysis", href: "/analysis" },
  { name: "Settings", href: "/settings" },
]

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <nav className="bg-ponte-cream shadow-sm border-b border-ponte-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto,1fr,auto] items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center justify-self-start">
              <Link href="/dashboard" className="flex items-center">
                <Image 
                  src="/logos/ponte_black.png" 
                  alt="Ponte" 
                  width={141}
                  height={35}
                  className="w-auto"
                  priority
                />
              </Link>
            </div>
          {/* Center: Tabs */}
          <div className="hidden sm:flex justify-center justify-self-center w-full min-w-0 overflow-x-auto whitespace-nowrap px-2">
            <div className="flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium font-body ${
                    pathname === item.href
                      ? "border-ponte-terracotta text-ponte-black"
                      : "border-transparent text-ponte-olive hover:border-ponte-sand hover:text-ponte-black"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          {/* Right: User */}
          <div className="flex items-center justify-end justify-self-end space-x-3">
            {session?.user?.name && (
              <span className="text-sm font-medium text-ponte-olive">
                {session.user.name}
              </span>
            )}
            <Button
              onClick={() => signOut()}
              intent="secondary"
              size="sm"
              className="h-8"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}