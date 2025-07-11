import { Router } from "express";
import { healthCheckHandler } from "../modules/health/healthCheck.controller";
import { loginHandler } from "../modules/auth/auth.controller";
import { authenticate } from "../modules/auth/auth.middleware";
import betsRoutes from "../modules/bets/bets.route";
import balanceRoutes from "../modules/balance/balance.route";
import internalRoutes from "../modules/internal/internal.route";
import { getTransactions } from "../modules/transactions/transactions.controller";
import { checkWin } from "../modules/bets/bets.controller";

const router = Router();

// GET /api/health - Проверка работоспособности сервиса
router.get("/health", healthCheckHandler);
// POST /api/auth/login - Аутентификация пользователя, получение JWT-токена
router.post("/login", loginHandler);
// GET /api/transactions - Получение истории транзакций
router.get("/transactions", authenticate, getTransactions);
// POST /api/win - Получение результата ставки
router.post("/win", authenticate, checkWin);
// /bets Эндпоинты для ставок
router.use("/bets", betsRoutes);
// /balance Установка и проверка баланса
router.use("/balance", balanceRoutes);

// Внутренние эндпоинты для тестирования
router.use("/internal", internalRoutes);

export default router;
