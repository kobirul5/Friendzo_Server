import express from "express";
import { giftController } from "./gift.controller";
import auth from "../../../middlewares/auth";

const router = express.Router();

router.post("/buy-gift-card", auth(), giftController.buyGiftCard);

export const giftRoutes = router;
