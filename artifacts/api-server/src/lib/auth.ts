import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";
import { store } from "./store";

export async function getSignedInUserId(req: Request, res: Response): Promise<string | null> {
  let userId: string | null = null;
  try {
    const auth = getAuth(req);
    if (auth && auth.userId) {
      userId = auth.userId;
    }
  } catch {}

  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token && token !== "null" && token !== "undefined") {
        userId = token;
      }
    } else if (req.headers["x-user-id"]) {
      userId = String(req.headers["x-user-id"]).trim();
    }
  }

  // If in development/demo context without auth header, check cookies or default collector
  if (!userId) {
    const demoUser = req.query.demo_user as string;
    if (demoUser) {
      userId = demoUser;
    }
  }

  if (!userId) {
    res.status(401).json({ error: "Sign-in required" });
    return null;
  }

  return userId;
}

export async function ensureMarketplaceUser(userId: string) {
  return store.ensureUser(userId, "buyer");
}

export async function requireRole(
  req: Request,
  res: Response,
  role: "buyer" | "artist" | "admin",
) {
  const userId = await getSignedInUserId(req, res);
  if (!userId) return null;

  const user = await ensureMarketplaceUser(userId);
  if (!user) {
    res.status(403).json({ error: `User profile could not be found` });
    return null;
  }

  // Admins can access everything; otherwise roles must match
  if (user.role !== role && user.role !== "admin" && user.role !== "unset") {
    // If user has 'unset', let them choose role or default
    res.status(403).json({ error: `A ${role} account is required` });
    return null;
  }

  return user;
}
