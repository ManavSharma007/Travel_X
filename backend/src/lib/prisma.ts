import { PrismaClient } from "@prisma/client";

// One shared Prisma client for the whole app.
// A module is cached by Node, so importing this file anywhere reuses the
// same instance (avoids opening a new DB connection pool per import).

export const prisma = new PrismaClient();
