import express from 'express';
import { findByInterestController } from './findByInterest.controller';
import auth from '../../../middlewares/auth';



const router = express.Router();

router.get('/match/dating', auth(), findByInterestController.getPeopleBySharedInterestsController);

export const findByInterestRoutes = router;