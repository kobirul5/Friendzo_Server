import express from "express";
import { managersController } from "./managers.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../../helpars/fileUploader";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.MANAGER),
  fileUploader.uploadSingle,
  managersController.createManagers
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.MANAGER),
  managersController.getAllManagerList
);

router.get("/:id", auth(), managersController.getManagersById);

router.put(
  "/:id",
  auth(),
  auth(UserRole.ADMIN, UserRole.MANAGER),
  fileUploader.uploadSingle,
  managersController.updateManagers
);

router.delete("/:id", auth(), managersController.deleteManagers);

export const managersRoutes = router;
