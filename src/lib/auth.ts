import { NextRequest } from "next/server";

/**
 * Validates the authorization header of a request.
 * For scaffolding purposes, this simply checks if a token is present and equals "mock-token".
 * In the future, this should be replaced with real JWT verification or NextAuth.
 */
export function isAuthenticated(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  
  // Scaffold mock check
  return token === "mock-token";
}
