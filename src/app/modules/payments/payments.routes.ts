import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { paymentsController } from "./payments.controller";
import { paymentsValidation } from "./payments.validation";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/",
  auth(),
  // validateRequest(paymentValidation.createSchema),
  paymentsController.createPayment
);

router.get("/", auth(UserRole.ADMIN, UserRole.MANAGER), paymentsController.getPaymentList);

export const paymentsRoutes = router;
