import express from "express";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();

//check user 
router.post("/check-user",  userController.checkUser);

router.post(
  "/register", // Multer middleware for handling multiple files
  userController.createUser
);
router.put(
  "/update-profile",
  auth(),
  fileUploader.uploadMultipleImage,
  userController.updateProfile
);
router.put(
  "/update-profile-image",
  auth(),
  fileUploader.uploadSingle,
  userController.profileImageUpload
);

router.get("/referral-code", auth(), userController.getReferralCode);

router.get("/:id", auth(), userController.getSingleUser);

router.put("/decrease-ai-message-count", auth(), userController.decreaseAiMessageCount);


// router.delete("/:id", auth(), userController.deleteUser);

export const userRoutes = router;
