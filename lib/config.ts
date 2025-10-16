// App configuration for multi-app support
export const APP_CONFIG = {
  // This should be set via environment variable
  APP_ID: process.env.APP_ID || "default",
  APP_NAME: process.env.APP_NAME || "Your App",
  APP_DOMAIN: process.env.APP_DOMAIN || "localhost:3000",
  
  // Admin configuration
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || "admin@rocketlaunchingllama.com",
    MASTER_ADMIN_EMAIL: process.env.MASTER_ADMIN_EMAIL || "admin@rocketlaunchingllama.com",
    IS_MASTER_ADMIN: process.env.IS_MASTER_ADMIN === "true",
    MASTER_ADMIN_URL: process.env.MASTER_ADMIN_URL || "https://admin.mywebsite.com",
  },
  
  // App-specific settings
  FEATURES: {
    // Enable/disable features per app
    GOOGLE_OAUTH: process.env.ENABLE_GOOGLE_OAUTH === "true",
    STRIPE_PAYMENTS: process.env.ENABLE_STRIPE === "true",
    USER_REGISTRATION: process.env.ENABLE_REGISTRATION !== "false",
  },
  
  // App-specific branding
  BRANDING: {
    PRIMARY_COLOR: process.env.PRIMARY_COLOR || "blue",
    LOGO_URL: process.env.LOGO_URL || "/logo.png",
    FAVICON_URL: process.env.FAVICON_URL || "/favicon.ico",
  }
}

// Helper function to get app-specific data
export function getAppFilter() {
  return { appId: APP_CONFIG.APP_ID }
}

// Helper function to create app-specific queries
export function withAppFilter<T extends Record<string, unknown>>(data: T): T & { appId: string } {
  return { ...data, appId: APP_CONFIG.APP_ID }
}

// Helper functions for admin access
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const { prisma } = await import("./prisma")
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    })
    return user?.role === "admin"
  } catch {
    // Fallback to email-based check for backward compatibility
    return email === APP_CONFIG.ADMIN.EMAIL || email === APP_CONFIG.ADMIN.MASTER_ADMIN_EMAIL
  }
}

export function isMasterAdmin(email: string): boolean {
  return email === APP_CONFIG.ADMIN.MASTER_ADMIN_EMAIL
}

export async function canAccessAdmin(email: string): Promise<boolean> {
  return (await isAdmin(email)) || (APP_CONFIG.ADMIN.IS_MASTER_ADMIN && isMasterAdmin(email))
}

