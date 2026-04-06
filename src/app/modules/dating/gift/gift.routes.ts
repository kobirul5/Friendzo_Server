import express from "express";
import { giftController } from "./gift.controller";
import auth from "../../../middlewares/auth";

const router = express.Router();

router.post("/buy-gift-card", auth(), giftController.buyGiftCard);
router.get("/gift-card-list", auth(), giftController.getGiftCardList);
router.get("/my-purchases-and-received-gifts", auth(), giftController.getMyPurchasesAndReceivedGifts);
router.post("/send-gift", auth(), giftController.sendGiftToFriends);
router.post("/send-multiple-gift", auth(), giftController.sendMultipleGifts);
router.post("/send-gift-with-coins", auth(), giftController.sendGiftWithCoins);

export const datingGiftRoutes = router;
