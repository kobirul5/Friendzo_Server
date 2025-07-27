import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { likeController } from './like.controller';


const router = express.Router();

router.post(
'/event',
auth(),
likeController.createEventLike,
);
router.post(
'/memories',
auth(),
likeController.createMemoryLike,
);

// router.get('/', auth(), likeController.getLikeList);

// router.get('/:id', auth(), likeController.getLikeById);

// router.put(
// '/:id',
// auth(),
// likeController.updateLike,
// );

// router.delete('/:id', auth(), likeController.deleteLike);

export const likesRoutes = router;