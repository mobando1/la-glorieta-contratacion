import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: "admin@laglorieta.com" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcryptjs.hash("admin123", 10);

  await prisma.adminUser.create({
    data: {
      email: "admin@laglorieta.com",
      passwordHash,
    },
  });

  console.log("Admin user created: admin@laglorieta.com / admin123");
  console.log("IMPORTANT: Change this password in production!");

  // Seed restaurants
  const restaurants = [
    { name: "La Glorieta", slug: "la-glorieta" },
    { name: "Salomé Restaurante", slug: "salome-restaurante" },
    { name: "Salomé Heladería", slug: "salome-heladeria" },
  ];
  for (const r of restaurants) {
    await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: {},
      create: { name: r.name, slug: r.slug },
    });
  }
  console.log("Restaurants seeded: La Glorieta, Salomé Restaurante, Salomé Heladería");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
