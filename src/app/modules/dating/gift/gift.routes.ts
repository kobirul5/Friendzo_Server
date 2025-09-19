import express from "express";
import { giftController } from "./gift.controller";
import auth from "../../../middlewares/auth";

const router = express.Router();

router.post("/buy-gift-card", auth(), giftController.buyGiftCard);
router.get("/gift-card-list", auth(), giftController.getGiftCardList);

export const giftRoutes = router;
