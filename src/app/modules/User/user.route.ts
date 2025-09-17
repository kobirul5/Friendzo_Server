import express from "express";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();




router.post(
  "/register",// Multer middleware for handling multiple files
  userController.createUser
);
router.put("/update-profile", auth(), fileUploader.uploadSingle, userController.updateProfile);

router.get("/profile", auth(), userController.getUserProfile);


router.get("/:id", auth(), userController.getSingleUser);

// router.delete("/:id", auth(), userController.deleteUser);



export const userRoutes = router;
