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
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Image 
                  src="/logos/ponte_black.png" 
                  alt="Ponte" 
                  width={128}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
          <div className="flex items-center space-x-3">
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