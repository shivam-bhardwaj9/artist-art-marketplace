import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { usersTable } from "@workspace/db/schema";
import { db } from "./db";

export async function getSignedInUserId(req: Request, res: Response): Promise<string | null> {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign-in required" });
    return null;
  }
  return userId;
}

export async function ensureMarketplaceUser(userId: string) {
  await db.insert(usersTable).values({ id: userId, role: "unset" }).onConflictDoNothing();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user ?? null;
}

export async function requireRole(
  req: Request,
  res: Response,
  role: "buyer" | "artist" | "admin",
) {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return null;
  const user = await ensureMarketplaceUser(userId);
  if (!user || user.role !== role) {
    res.status(403).json({ error: `A ${role} account is required` });
    return null;
  }
  return user;
}
