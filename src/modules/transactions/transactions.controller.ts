import { Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../auth/auth.types";

export async function getTransactions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;

  // Получаем и валидируем параметры пагинации
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  res.json({
    transactions: transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      balance_before: t.balance_before.toNumber(),
      balance_after: t.balance_after.toNumber(),
      description: t.description,
      created_at: t.created_at.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
