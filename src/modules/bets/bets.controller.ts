import { Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../auth/auth.types";
import { externalApiClient } from "../../clients/externalApiClient";
import { Decimal } from "@prisma/client/runtime/library";

// GET /api/bets
export async function getBets(userId: number) {
  const bets = await prisma.bet.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
  });

  return bets.map((b) => ({
    id: b.id,
    amount: b.amount.toNumber(),
    status: b.status as "pending" | "completed",
    win_amount: b.win_amount?.toNumber(),
    created_at: b.created_at.toISOString(),
    completed_at: b.completed_at?.toISOString(),
  }));
}

export async function listBets(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const bets = await getBets(req.user!.userId);
  res.json({ bets });
}

//GET /api/bets/:id
export async function getBetById(userId: number, id: number) {
  const bet = await prisma.bet.findFirst({ where: { id, userId } });
  if (!bet) throw new Error("Bet not found");

  return {
    id: bet.id,
    amount: bet.amount.toNumber(),
    status: bet.status as "pending" | "completed",
    win_amount: bet.win_amount?.toNumber(),
    created_at: bet.created_at.toISOString(),
    completed_at: bet.completed_at?.toISOString(),
  };
}

export async function getBet(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  console.log(id);

  if (isNaN(id)) {
    res.status(400).json({
      statusCode: 400,
      error: "Invalid bet ID",
      message: "Please provide a valid positive numeric bet ID",
    });
    return;
  }

  try {
    const bet = await getBetById(req.user!.userId, id);
    res.json(bet);
  } catch {
    res.status(404).json({
      statusCode: 404,
      error: "Not Found",
      message: "Bet not found",
    });
  }
}

//POST /api/bets
export async function createBet(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { amount } = req.body;

  if (typeof amount !== "number" || amount < 1 || amount > 5) {
    res.status(400).json({
      statusCode: 400,
      error: "Invalid bet amount",
      message: "Bet amount must be a positive number",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { externalAccount: true, userBalance: true },
  });

  if (!user?.externalAccount || !user.userBalance) {
    res.status(400).json({ message: "External account or balance not found" });
    return;
  }

  const { external_user_id, external_secret_key } = user.externalAccount;

  await externalApiClient.authenticateExternalApi(
    external_user_id,
    external_secret_key
  );

  const external = await externalApiClient.placeBet(
    external_user_id,
    external_secret_key,
    amount
  );

  const now = new Date();
  const balanceBefore = new Decimal(user.userBalance.balance);
  const balanceAfter = balanceBefore.minus(amount);

  // 1. Обновляем баланс
  await prisma.userBalance.update({
    where: { userId },
    data: {
      balance: balanceAfter,
      last_checked_at: now,
    },
  });

  // 2. Создаём ставку
  const bet = await prisma.bet.create({
    data: {
      userId,
      external_bet_id: String(external.bet_id),
      amount: amount,
      status: "pending",
    },
  });

  // 3. Записываем транзакцию
  await prisma.transaction.create({
    data: {
      userId,
      betId: bet.id,
      amount: -amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      type: "bet_place",
      description: `Bet placement #${bet.id}`,
    },
  });

  res.status(201).json({
    id: bet.id,
    amount,
    status: bet.status,
  });
}

//GET /api/bets/recommended
export async function getRecommendation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { externalAccount: true },
  });

  if (!user || !user.externalAccount) {
    res.status(400).json({ message: "External account not found" } as any);
    return;
  }

  const { external_user_id, external_secret_key } = user.externalAccount;

  const recommendation = await externalApiClient.getRecommendedBet(
    external_user_id,
    external_secret_key
  );

  res.json({ recommended_amount: recommendation.bet });
}

export async function checkWin(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { bet_id } = req.body;

  if (!bet_id || isNaN(Number(bet_id))) {
    res.status(400).json({
      statusCode: 400,
      error: "Invalid bet ID",
      message: "Bet ID must be a positive number",
    });
    return;
  }

  const userId = req.user!.userId;

  const bet = await prisma.bet.findUnique({
    where: { id: Number(bet_id) },
    include: { user: { include: { externalAccount: true } } },
  });

  if (!bet || bet.userId !== userId || !bet.user.externalAccount) {
    res.status(404).json({ message: "Bet not found" });
    return;
  }

  if (bet.status !== "pending") {
    res.status(400).json({ message: "Bet already processed" });
    return;
  }

  const { external_user_id, external_secret_key } = bet.user.externalAccount;

  await externalApiClient.authenticateExternalApi(
    external_user_id,
    external_secret_key
  );

  const result = await externalApiClient.checkWin(
    external_user_id,
    external_secret_key,
    bet.external_bet_id
  );

  console.log("API /win result:", result);

  const now = new Date();
  const winAmount = new Decimal(result.win || 0);
  const isWin = result.win > 0;

  // 1. Обновляем статус ставки
  const updatedBet = await prisma.bet.update({
    where: { id: bet.id },
    data: {
      status: isWin ? "won" : "lost",
      win_amount: winAmount,
      completed_at: now,
    },
  });

  // 2. Получаем баланс пользователя
  const balanceBefore = await prisma.userBalance.findUnique({
    where: { userId },
  });

  const prevBalance = new Decimal(balanceBefore?.balance || 0);
  const newBalance = isWin ? prevBalance.plus(winAmount) : prevBalance;

  // 3. Обновляем баланс
  await prisma.userBalance.update({
    where: { userId },
    data: {
      balance: newBalance,
      last_checked_at: now,
    },
  });

  // 4. Логируем транзакцию
  await prisma.transaction.create({
    data: {
      userId,
      betId: bet.id,
      balance_before: prevBalance,
      balance_after: newBalance,
      amount: winAmount,
      type: "win_result",
      description: `Result for bet #${bet.id}`,
    },
  });

  // 5. Ответ пользователю
  res.status(200).json({
    success: true,
    external_response: {
      win: result.win,
      message: result.message,
    },
  });
}
