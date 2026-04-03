import { NextRequest } from "next/server";

export function isAdminAuthenticated(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  return authHeader === `Bearer ${process.env.ADMIN_PASSWORD}`;
}
