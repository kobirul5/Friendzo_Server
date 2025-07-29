import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { reportController } from './report.controller';
import { reportValidation } from './report.validation';

const router = express.Router();

router.post(
'/',
auth(),
validateRequest(reportValidation.createSchema),
reportController.createReport,
);


export const reportRoutes = router;