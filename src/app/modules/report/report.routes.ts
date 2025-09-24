import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { reportController } from './report.controller';
import { reportValidation } from './report.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(),
validateRequest(reportValidation.createSchema),
reportController.createReportUser,
);
router.post(
'/post',
auth(),
// validateRequest(reportValidation.createSchema),
reportController.createReportPost,
);

router.get('/user', auth(UserRole.ADMIN, UserRole.MANAGER), reportController.getReportedUsers);
router.get('/post', auth(UserRole.ADMIN, UserRole.MANAGER), reportController.getReportedPosts);

router.delete(
'/:id',
auth(UserRole.ADMIN, UserRole.MANAGER),
reportController.deleteReport,
);



export const reportRoutes = router;