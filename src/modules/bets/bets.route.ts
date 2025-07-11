import { Router } from "express";
import {
  createBet,
  listBets,
  getBet,
  getRecommendation,
} from "./bets.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();
router.use(authenticate);

// Размещение новой ставки
router.post("/", createBet);
// Получение информации о конкретной ставке
router.get("/:id", getBet);
// Получение истории ставок пользователя
router.get("/", listBets);
// Получение рекомендуемой ставки
router.get("/recommended", getRecommendation);

export default router;
