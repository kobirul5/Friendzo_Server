import express from "express";
import auth from "../../../middlewares/auth";
import { subscriptionController } from "./subscription.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

// subscription routes
router.post("/", auth(), subscriptionController.purchaseSubscription);
router.post("/purchase", auth(), subscriptionController.purchaseSubscriptionStatic);

router.get("/my-subscriptions", auth(), subscriptionController.getUserSubscriptions);



router.post(
  "/plan",
  auth(),
//   auth(UserRole.ADMIN, UserRole.MANAGER),
  subscriptionController.createSubscriptionPlan
);

router.get("/plan", auth(), subscriptionController.getSubscriptionPlanList);
router.put("/plan", auth(), subscriptionController.updateSubscriptionPlan);
router.delete("/plan/:id", auth(), subscriptionController.deleteSubscriptionPlan);


export const subscriptionRoutes = router;
