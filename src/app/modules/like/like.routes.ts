import express from 'express';
import auth from '../../middlewares/auth';
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
likeController.createMemoryLike,
);

router.get('/memories/:id', auth(), likeController.getMemoryLikeStats);
router.delete('/memories', auth(), likeController.removeMemoryLike);


export const likesRoutes = router;