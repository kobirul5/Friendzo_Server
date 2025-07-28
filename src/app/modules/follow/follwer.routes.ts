import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { follwerController } from './follwer.controller';


const router = express.Router();

router.post(
'/',
auth(),
follwerController.createFollwer,
);


router.get('/count', auth(), follwerController.getMyFollowersAndFollowingCount);
router.delete('/unfollow', auth(), follwerController.unfollowUser);

export const follwerRoutes = router;