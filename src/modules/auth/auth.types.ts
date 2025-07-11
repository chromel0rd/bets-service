import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: { userId: number };
}

export interface LoginRequestBody {
  username: string;
}

export interface LoginResponseBody {
  token: string;
  expiresIn: number;
}
