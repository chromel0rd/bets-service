import { Router } from "express";
import { verifyAdminToken } from "../../utils/verifyAdminToken";
import {
  internalAuth,
  internalGetBet,
  internalPlaceBet,
  internalCheckWin,
  internalSetBalance,
  internalCheckBalance,
  internalGetLogs,
} from "./internal.controller";


const router = Router();
router.use(verifyAdminToken);

router.post("/auth", internalAuth);
//  возможно в ТЗ допущена техническая ошибка, GET-запросы не должны содержать тело, так что решил заменить название эндпоинта
router.post("/betRec", internalGetBet);
router.post("/bet", internalPlaceBet);
router.post("/win", internalCheckWin);
router.post("/balance", internalSetBalance);
router.post("/check-balance", internalCheckBalance);
router.get("/logs", internalGetLogs); 

export default router;
