import { Request, Response, NextFunction } from "express";

export function verifyAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  console.log(process.env.ADMIN_TOKEN, "process.env.ADMIN_TOKEN");
  console.log(authHeader, "authHeader");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  console.log(token, "token");

  if (token !== process.env.ADMIN_TOKEN) {
    res.status(403).json({ error: "Invalid admin token" });
    return;
  }

  next();
}
