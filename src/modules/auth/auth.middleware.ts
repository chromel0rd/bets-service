import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth.types";
import { verifyToken } from "../../utils/jwt";

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid token" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    req.user = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
