import express from "express";
import auth from "../../../middlewares/auth";
import { giftCardController } from "./giftCard.controller";
import { Role } from "../../../db/db.interface";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../../helpars/fileUploader";

const router = express.Router();

router.post(
  "/",
  fileUploader.uploadFile,
  auth(UserRole.ADMIN),
  giftCardController.createGiftCard
);

router.post("/buy-gift-card", auth(), giftCardController.buyGiftCard);

router.get("/", auth(), giftCardController.getGiftCardList);

router.get("/:id", auth(), giftCardController.getGiftCardById);

router.put("/:id", auth(), giftCardController.updateGiftCard);

router.delete("/:id", auth(), giftCardController.deleteGiftCard);

export const giftCardRoutes = router;
