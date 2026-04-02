import express from "express";
import auth from "../../middlewares/auth";
import { adminController } from "./admin.controller";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();

router.get(
  "/total-user",
  auth(UserRole.ADMIN),
  adminController.getTotalUsers
);
router.get(
  "/total-report",
  auth(UserRole.ADMIN),
  adminController.getTotalreport
);
router.delete("/delete/:userId", adminController.deleteUser);
router.get(
  "/total-report-monthly",
  auth(UserRole.ADMIN),
  adminController.getMonthlyReport
);
router.get(
  "/total-report-weekly",
  auth(UserRole.ADMIN),
  adminController.getweeklyReport
);
router.get(
  "/total-report-daily",
  auth(UserRole.ADMIN),
  adminController.getDailyReport
);
router.post(
  "/interest",
  auth(UserRole.ADMIN),
  fileUploader.uploadFile,
  adminController.createInterest
);
router.get("/interest", auth(UserRole.ADMIN), adminController.getInterests);

//
router.get(
  "/conversation",
  auth(UserRole.ADMIN),
  adminController.getConversation
);
router.get(
  "/conversation/:roomId",
  auth(UserRole.ADMIN),
  adminController.getSingleConversationService
);
router.put(
  "/interest/:interestId",
  auth(UserRole.ADMIN),
    fileUploader.uploadFile, 
  adminController.updateInterest
);
router.delete(
  "/interest/:interestId",
  auth(UserRole.ADMIN),
  adminController.deleteInterest
);

export const adminRoutes = router;
