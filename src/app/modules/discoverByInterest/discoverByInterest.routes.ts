import express from 'express';
import auth from '../../middlewares/auth';
import { discoverByInterestController } from './discoverByInterest.controller';


const router = express.Router();


router.get('/', auth(), discoverByInterestController.getNearbyPeopleController);
router.get('/match', auth(), discoverByInterestController.getPeopleBySharedInterestsController);
router.get('/today-buzz', auth(), discoverByInterestController.getTodaysBuzzController);


export const discoverByInterestRoutes = router;