import express from 'express';
import auth from '../../middlewares/auth';
import { commentController } from './comment.controller';


const router = express.Router();

router.post(
'/',
auth(),
commentController.createComment,
);

router.get('/:memoryId', auth(), commentController.getCommentsByMemory);


router.delete('/:id', auth(), commentController.deleteComment);

export const commentRoutes = router;