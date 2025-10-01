import express from "express";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();

router.post(
  "/register", // Multer middleware for handling multiple files
  userController.createUser
);
router.put( 
  "/update-profile",
  auth(),
  fileUploader.uploadSingle,
  userController.updateProfile
);
router.put(
  "/update-profile-image",
  auth(),
  fileUploader.uploadSingle,
  userController.profileImageUpload
);

router.put(
  "/update-dating-profile",
  auth(),
  fileUploader.uploadMultipleImage,
  userController.updateDatingProfile
);
router.get("/referral-code", auth(), userController.getReferralCode);

router.get("/profile", auth(), userController.getUserProfile);

router.get("/mode", auth(), userController.seeMode);

router.put("/change-mode", auth(), userController.changeDatingMode);

router.get("/:id", auth(), userController.getSingleUser);

router.put("/decrease-ai-message-count", auth(), userController.decreaseAiMessageCount);

// router.delete("/:id", auth(), userController.deleteUser);

export const userRoutes = router;
