import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const secretKey = process.env.EXTERNAL_SECRET_KEY;

  if (!secretKey) {
    throw new Error("EXTERNAL_SECRET_KEY not found in environment variables.");
  }

  const users = [
    {
      id: 14,
      username: "testUser14",
      email: "testUser14@example.com",
      external_user_id: "14",
      external_secret_key: secretKey,
      //   initial_balance: 1000,
    },
    {
      id: 3,
      username: "testUser3",
      email: "testUser3@example.com",
      external_user_id: "3",
      external_secret_key: "819b0643d6b89dc9b579fdfc9094f28e",
      //   initial_balance: 1000,
    },
    // добавление дополнительных юзеров в сид при необходимости
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        username: user.username,
        email: user.email,
        last_login: new Date(),
        externalAccount: {
          create: {
            external_user_id: user.external_user_id,
            external_secret_key: user.external_secret_key,
            is_active: true,
          },
        },
        // userBalance: {
        //   create: {
        //     balance: user.initial_balance,
        //     last_checked_at: new Date(),
        //   },
        // },
      },
    });
  }

  console.log(`Seeded ${users.length} user(s).`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
