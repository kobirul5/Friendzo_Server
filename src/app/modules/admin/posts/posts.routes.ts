import express from 'express';
import { postsController } from './posts.controller';
import auth from '../../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();


router.get('/', auth(UserRole.ADMIN), postsController.getPostsList);

router.get('/:id', auth(UserRole.ADMIN), postsController.getPostsById);

router.put(
'/:id',
auth(UserRole.ADMIN),
postsController.updatePosts,
);

router.delete('/:id', auth(UserRole.ADMIN), postsController.deletePosts);

export const postsRoutes = router;