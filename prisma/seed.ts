import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create sample products and prices
  const freeProduct = await prisma.product.upsert({
    where: { id: "free" },
    update: {},
    create: {
      id: "free",
      name: "Free Plan",
      description: "Perfect for getting started",
      active: true,
    },
  })

  const proProduct = await prisma.product.upsert({
    where: { id: "pro" },
    update: {},
    create: {
      id: "pro",
      name: "Pro Plan",
      description: "Best for growing businesses",
      active: true,
    },
  })

  const enterpriseProduct = await prisma.product.upsert({
    where: { id: "enterprise" },
    update: {},
    create: {
      id: "enterprise",
      name: "Enterprise Plan",
      description: "For large organizations",
      active: true,
    },
  })

  // Create prices (these would typically be created in Stripe first)
  await prisma.price.upsert({
    where: { id: "price_free" },
    update: {},
    create: {
      id: "price_free",
      productId: freeProduct.id,
      active: true,
      currency: "usd",
      type: "one_time",
      unitAmount: 0,
    },
  })

  await prisma.price.upsert({
    where: { id: "price_pro_monthly" },
    update: {},
    create: {
      id: "price_pro_monthly",
      productId: proProduct.id,
      active: true,
      currency: "usd",
      type: "recurring",
      unitAmount: 2900, // $29.00
      interval: "month",
      intervalCount: 1,
    },
  })

  await prisma.price.upsert({
    where: { id: "price_enterprise_monthly" },
    update: {},
    create: {
      id: "price_enterprise_monthly",
      productId: enterpriseProduct.id,
      active: true,
      currency: "usd",
      type: "recurring",
      unitAmount: 9900, // $99.00
      interval: "month",
      intervalCount: 1,
    },
  })

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

