import express from 'express';
import { userInfoController } from './userInfo.controller';
import auth from '../../../middlewares/auth';
import { UserRole } from '@prisma/client';


const router = express.Router();


router.get('/', auth(UserRole.ADMIN), userInfoController.dashboardStats);
router.put('/', auth(UserRole.ADMIN), userInfoController.blockedAndUnblockedUserById);
router.get('/all-users', auth(UserRole.ADMIN), userInfoController.allUsers);
router.get('/:id', auth(), userInfoController.getUserInfoById);
router.delete('/:id', auth(), userInfoController.deleteUserById);


export const userInfoRoutes = router;