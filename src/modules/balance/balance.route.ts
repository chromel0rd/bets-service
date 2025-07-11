import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getBalance, setInitialBalance } from "./balance.controller";

const router = Router();
router.use(authenticate);

// POST /api/balance - Установка текущего баланса пользователя (1 раз), при повторном вызове происходит только получение текущего баланса
router.post("/", setInitialBalance);

// GET /api/balance - Получение текущего баланса пользователя
router.get("/", getBalance);

export default router;
