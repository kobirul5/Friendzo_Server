import express from 'express';
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import { ChatController } from "./chatController";


const router = express.Router();
// Upload chat images
router.post(
  '/upload-images',
  auth(),
  fileUploader.uploadMultipleImage,
  ChatController.uploadChatImages
);

router.post(
  '/share-memory',
  auth(),
  ChatController.shareMemoryThorwChat
);

export const ChatRoutes = router; 