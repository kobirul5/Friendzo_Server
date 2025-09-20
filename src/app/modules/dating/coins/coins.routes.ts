import express from 'express';
import { coinsController } from './coins.controller';
import auth from '../../../middlewares/auth';

const router = express.Router();
router.get("/list", auth(), coinsController.getCoinList);
router.post("/buy-coin", auth(), coinsController.buyCoin);
router.post("/send-coin", auth(), coinsController.sendCoin);

export const datingCoinsRoutes = router;