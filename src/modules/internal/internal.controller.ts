import { Request, Response } from "express";
import { externalApiClient } from "../../clients/externalApiClient";
import { prisma } from "../../prisma";

// POST /api/internal/auth
export async function internalAuth(req: Request, res: Response): Promise<void> {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      res.status(400).json({ error: "user_id is required" });
      return;
    }

    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id },
    });
    if (!account) {
      res.status(404).json({ error: "External account not found" });
      return;
    }

    const external_response = await externalApiClient.authenticateExternalApi(
      account.external_user_id,
      account.external_secret_key,
      req,
      account.userId
    );

    res.json({ success: true, external_response });
  } catch (error: any) {
    res.status(502).json({
      error: "External API error",
      detail: error?.response?.data || error.message,
    });
  }
}

// POST /api/internal/betRec
export async function internalGetBet(
  req: Request,
  res: Response
): Promise<void> {
  const { user_id } = req.body;
  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }

  const account = await prisma.externalApiAccount.findFirst({
    where: { external_user_id: user_id },
  });
  if (!account) {
    res.status(404).json({ error: "External account not found" });
    return;
  }

  const external_response = await externalApiClient.getRecommendedBet(
    account.external_user_id,
    account.external_secret_key,
    req,
    account.userId
  );

  res.json({ success: true, external_response });
}

// POST /api/internal/bet
export async function internalPlaceBet(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { user_id, bet } = req.body;
    if (!user_id || typeof bet !== "number") {
      res.status(400).json({ error: "user_id and bet are required" });
      return;
    }

    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id },
    });
    if (!account) {
      res.status(404).json({ error: "External account not found" });
      return;
    }

    const external_response = await externalApiClient.placeBet(
      account.external_user_id,
      account.external_secret_key,
      bet,
      req,
      account.userId
    );

    res.json({ success: true, external_response });
  } catch (error: any) {
    res.status(502).json({
      error: "External API error",
      detail: error?.response?.data || error.message,
    });
  }
}

// POST /api/internal/win
export async function internalCheckWin(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { user_id, bet_id } = req.body;
    if (!user_id || !bet_id) {
      res.status(400).json({ error: "user_id and bet_id are required" });
      return;
    }

    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id },
    });
    if (!account) {
      res.status(404).json({ error: "External account not found" });
      return;
    }

    const external_response = await externalApiClient.checkWin(
      account.external_user_id,
      account.external_secret_key,
      bet_id,
      req,
      account.userId
    );

    res.json({ success: true, external_response });
  } catch (error: any) {
    res.status(502).json({
      error: "External API error",
      detail: error?.response?.data || error.message,
    });
  }
}

// POST /api/internal/balance
export async function internalSetBalance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { user_id, balance } = req.body;
    if (!user_id) {
      res.status(400).json({ error: "user_id is required" });
      return;
    }

    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id },
    });
    if (!account) {
      res.status(404).json({ error: "External account not found" });
      return;
    }

    const external_response = await externalApiClient.setOrGetBalance(
      account.external_user_id,
      account.external_secret_key,
      balance,
      req,
      account.userId
    );

    res.json({ success: true, external_response });
  } catch (error: any) {
    res.status(502).json({
      error: "External API error",
      detail: error?.response?.data || error.message,
    });
  }
}

// POST /api/internal/check-balance
export async function internalCheckBalance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { user_id, expected_balance } = req.body;
    if (!user_id || typeof expected_balance !== "number") {
      res
        .status(400)
        .json({ error: "user_id and expected_balance are required" });
      return;
    }

    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id },
    });
    if (!account) {
      res.status(404).json({ error: "External account not found" });
      return;
    }

    const balanceResult = await externalApiClient.getBalance(
      account.external_user_id,
      account.external_secret_key,
      req,
      account.userId
    );

    const actual = balanceResult.balance;
    const is_correct = actual === expected_balance;

    res.json({
      success: true,
      external_response: is_correct
        ? { is_correct: true, balance: actual }
        : {
            is_correct: false,
            message: `Incorrect balance. Expected: ${expected_balance}, Actual: ${actual}`,
            correct_balance: actual,
          },
    });
  } catch (error: any) {
    res.status(502).json({
      error: "External API error",
      detail: error?.response?.data || error.message,
    });
  }
}

// GET /api/internal/logs
export async function internalGetLogs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const logs = await prisma.apiLog.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
    });

    res.json({ success: true, logs });
  } catch (err) {
    console.error("Failed to fetch logs", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
}
