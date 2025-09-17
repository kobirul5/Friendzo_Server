import express from 'express';
import auth from '../../middlewares/auth';
import { adminController } from './admin.controller';


const router = express.Router();

router.get('/total-user', auth("ADMIN"), adminController.getTotalUsers);
router.get('/total-report', auth("ADMIN"), adminController.getTotalreport);
router.delete('/delete/:userId',  adminController.deleteUser);
router.get('/total-report-monthly', auth("ADMIN"), adminController.getMonthlyReport);
router.get('/total-report-weekly', auth("ADMIN"), adminController.getweeklyReport);
router.get('/total-report-daily', auth("ADMIN"), adminController.getDailyReport);
router.post('/interest', auth("ADMIN"), adminController.createInterest);
router.get('/interest', auth(), adminController.getInterests);


export const adminRoutes = router;