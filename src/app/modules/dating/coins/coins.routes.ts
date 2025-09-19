import express from 'express';
import { coinsController } from './coins.controller';
import auth from '../../../middlewares/auth';

const router = express.Router();
router.get("/list", auth(), coinsController.getCoinList);
router.post("/buy-coin", auth(), coinsController.buyCoin);

export const datingCoinsRoutes = router;