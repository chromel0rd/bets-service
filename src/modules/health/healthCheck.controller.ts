import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../../prisma";

async function pingExternalApi(): Promise<boolean> {
  const base = process.env.EXTERNAL_API_URL;
  if (!base) {
    console.error("EXTERNAL_API_URL environment variable is not set");
    return false;
  }

  const url = `${base.replace(/\/+$/, "")}/health`;
  try {
    const resp = await axios.get(url, { timeout: 2000 });
    return resp.status === 200;
  } catch (err: any) {
    console.error(`Error pinging external API (${url}):`, err.message || err);
    return false;
  }
}

export async function healthCheckHandler(_req: Request, res: Response) {
  const now = new Date().toISOString();

  // Проверка БД
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbOk = false;
    console.error("DB health check failed:", err.message);
  }

  // Проверка внешнего API на /api/health
  const extOk = await pingExternalApi();

  // Если хоть одна проверка упала, весь статус — error
  const allOk = dbOk && extOk;
  const status = allOk ? "ok" : "error";

  res.status(allOk ? 200 : 503).json({
    status,
    timestamp: now,
    services: {
      api: status,
      database: status,
      external_api: status,
    },
  });
}
