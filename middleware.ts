import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard and billing routes
        if (req.nextUrl.pathname.startsWith("/dashboard") || 
            req.nextUrl.pathname.startsWith("/billing")) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*"]
}

