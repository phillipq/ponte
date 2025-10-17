"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "components/Button"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.push("/dashboard")
    }
  }, [status, session, router])

  // Show loading when session is being established after successful login
  const isSessionLoading = status === "loading" && isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
        setIsLoading(false)
      } else if (result?.ok) {
        // Don't redirect immediately - let the useEffect handle it
        // when the session becomes available
        console.log("Login successful, waiting for session...")
      } else {
        setError("Login failed. Please try again.")
        setIsLoading(false)
      }
    } catch {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-ponte-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <Image 
              src="/logos/ponte_black.png" 
              alt="Ponte" 
              width={192}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-ponte-black">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-ponte-sand placeholder-ponte-olive text-ponte-black rounded-t-md focus:outline-none focus:ring-ponte-terracotta focus:border-ponte-terracotta focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-ponte-sand placeholder-ponte-olive text-ponte-black rounded-b-md focus:outline-none focus:ring-ponte-terracotta focus:border-ponte-terracotta focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-ponte-terracotta text-sm text-center">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading || isSessionLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ponte-terracotta hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta disabled:opacity-50"
            >
              {isSessionLoading ? "Establishing session..." : isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>


        </form>
      </div>
    </div>
  )
}

