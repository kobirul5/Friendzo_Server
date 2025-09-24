import express from 'express';
import auth from '../../middlewares/auth';
import { adminController } from './admin.controller';
import { UserRole } from '@prisma/client';


const router = express.Router();

router.get('/total-user', auth(UserRole.ADMIN, UserRole.MANAGER), adminController.getTotalUsers);
router.get('/total-report', auth(UserRole.ADMIN, UserRole.MANAGER), adminController.getTotalreport);
router.delete('/delete/:userId',  adminController.deleteUser);
router.get('/total-report-monthly', auth(UserRole.ADMIN, UserRole.MANAGER), adminController.getMonthlyReport);
router.get('/total-report-weekly', auth(UserRole.ADMIN, UserRole.MANAGER), adminController.getweeklyReport);
router.get('/total-report-daily', auth(UserRole.ADMIN, UserRole.MANAGER), adminController.getDailyReport);
router.post('/interest', auth(UserRole.ADMIN, UserRole.MANAGER), adminController.createInterest);
router.get('/interest', adminController.getInterests);


export const adminRoutes = router;