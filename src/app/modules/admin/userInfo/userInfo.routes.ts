import express from 'express';
import { userInfoController } from './userInfo.controller';
import auth from '../../../middlewares/auth';
import { UserRole } from '@prisma/client';


const router = express.Router();


router.get('/', auth(UserRole.ADMIN), userInfoController.dashboardStats);

router.get('/:id', auth(), userInfoController.getUserInfoById);


export const userInfoRoutes = router;