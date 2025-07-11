import { Request, Response } from "express";
import { generateToken } from "../../utils/jwt";
import { LoginRequestBody, LoginResponseBody } from "./auth.types";
import { prisma } from "../../prisma";

export async function loginHandler(
  req: Request<{}, {}, LoginRequestBody>,
  res: Response<LoginResponseBody>
): Promise<void> {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({
      statusCode: 404,
      error: "Bad Request",
      message: "Username is required",
    } as any);
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    res.status(404).json({
      statusCode: 404,
      error: "Not Found",
      message: "User not found",
    } as any);
    return;
  }

  const token = generateToken(user.id);

  res.status(200).json({ token, expiresIn: 7200 });
}
