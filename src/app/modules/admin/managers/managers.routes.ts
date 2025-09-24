import express from "express";
import { managersController } from "./managers.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/", auth(), managersController.createManagers);

router.get("/", auth(UserRole.ADMIN, UserRole.MANAGER), managersController.getAllManagerList);

router.get("/:id", auth(), managersController.getManagersById);

router.put("/:id", auth(), managersController.updateManagers);

router.delete("/:id", auth(), managersController.deleteManagers);

export const managersRoutes = router;
