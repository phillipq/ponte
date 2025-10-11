import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generates the next property number starting from 10000
 * @returns Promise<number> The next available property number
 */
export async function getNextPropertyNumber(): Promise<number> {
  try {
    // Find the highest existing property number
    const lastProperty = await prisma.property.findFirst({
      orderBy: {
        propertyNumber: 'desc'
      },
      select: {
        propertyNumber: true
      }
    })

    // If no properties exist, start with 10000
    if (!lastProperty) {
      return 10000
    }

    // Return the next number in sequence
    return lastProperty.propertyNumber + 1
  } catch (error) {
    console.error('Error generating property number:', error)
    // Fallback to a timestamp-based number if database fails
    return 10000 + Math.floor(Date.now() / 1000)
  }
}

/**
 * Validates that a property number is unique
 * @param propertyNumber The property number to validate
 * @param excludeId Optional property ID to exclude from uniqueness check (for updates)
 * @returns Promise<boolean> True if the number is unique
 */
export async function isPropertyNumberUnique(
  propertyNumber: number, 
  excludeId?: string
): Promise<boolean> {
  try {
    const existingProperty = await prisma.property.findFirst({
      where: {
        propertyNumber,
        ...(excludeId && { id: { not: excludeId } })
      },
      select: {
        id: true
      }
    })

    return !existingProperty
  } catch (error) {
    console.error('Error checking property number uniqueness:', error)
    return false
  }
}

/**
 * Formats a property number for display
 * @param propertyNumber The property number to format
 * @returns string Formatted property number (e.g., "P-10000")
 */
export function formatPropertyNumber(propertyNumber: number): string {
  return `P-${propertyNumber}`
}

/**
 * Parses a property number from a formatted string
 * @param formattedNumber The formatted property number (e.g., "P-10000")
 * @returns number The numeric property number
 */
export function parsePropertyNumber(formattedNumber: string): number {
  const match = formattedNumber.match(/P-(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}
