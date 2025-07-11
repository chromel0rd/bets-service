import { Request } from "express";
import { prisma } from "../prisma";

type LogOptions = {
  userId?: number | null;
  endpoint: string;
  method: string;
  requestBody?: any;
  responseBody?: any;
  statusCode: number;
  durationMs?: number;
  req?: Request;
};

export async function saveApiLog({
  userId,
  endpoint,
  method,
  requestBody,
  responseBody,
  statusCode,
  durationMs,
  req,
}: LogOptions): Promise<void> {
  try {
    await prisma.apiLog.create({
      data: {
        userId: userId ?? null,
        endpoint,
        method,
        request_body: requestBody || {},
        response_body: responseBody || {},
        status_code: statusCode,
        request_duration_ms: durationMs,
        ip_address: req?.ip || null,
      },
    });
  } catch (err) {
    console.error("Failed to save API log", err);
  }
}
