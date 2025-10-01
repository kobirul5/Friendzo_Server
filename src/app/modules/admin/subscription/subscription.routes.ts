import express from "express";
import auth from "../../../middlewares/auth";
import { subscriptionController } from "./subscription.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/",
  auth(),
//   auth(UserRole.ADMIN, UserRole.MANAGER),
  subscriptionController.createSubscriptionPlan
);

router.get("/", auth(), subscriptionController.getSubscriptionPlanList);
router.put("/", auth(), subscriptionController.updateSubscriptionPlan);

export const subscriptionRoutes = router;
