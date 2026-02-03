import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();

const shouldLog = process.env.DB_LOG === "true";
if (shouldLog) {
  prisma
    .$connect()
    .then(() => {
      console.log("[db] connected");
    })
    .catch((error) => {
      console.error("[db] connection failed", error);
    });
}

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
