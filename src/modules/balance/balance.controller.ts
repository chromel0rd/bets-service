import { Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../auth/auth.types";
import { externalApiClient } from "../../clients/externalApiClient";

// POST /api/balance — установить начальный баланс
export async function setInitialBalance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;

  const existing = await prisma.userBalance.findUnique({ where: { userId } });

  if (existing) {
    res.status(200).json({
      balance: existing.balance.toNumber(),
      last_updated: existing.last_checked_at?.toISOString() || null,
    });
    return;
  }

  const { balance } = req.body;

  if (typeof balance !== "number" || balance < 0) {
    res.status(400).json({
      statusCode: 400,
      error: "Invalid balance",
      message: "Balance must be a non-negative number",
    });
    return;
  }

  const external = await prisma.externalApiAccount.findUnique({
    where: { userId },
  });

  if (!external) {
    res.status(400).json({
      statusCode: 400,
      error: "External account not found",
      message: "User must have external account linked",
    });
    return;
  }

  // Установка баланса во внешней системе
  await externalApiClient.setOrGetBalance(
    external.external_user_id,
    external.external_secret_key,
    balance
  );

  const now = new Date();

  const created = await prisma.userBalance.create({
    data: {
      userId,
      balance,
      external_balance: balance,
      last_checked_at: now,
    },
  });

  res.status(201).json({
    balance: created.balance.toNumber(),
    last_updated: created.last_checked_at?.toISOString() || null,
  });
}

// GET /api/balance — получить текущий баланс
export async function getBalance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;

  const balance = await prisma.userBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    res.status(404).json({ message: "Balance not found" });
    return;
  }

  res.status(200).json({
    balance: balance.balance.toNumber(),
    last_updated: balance.last_checked_at?.toISOString() || null,
  });
}
