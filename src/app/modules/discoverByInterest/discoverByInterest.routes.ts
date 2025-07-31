import express from 'express';
import auth from '../../middlewares/auth';
import { discoverByInterestController } from './discoverByInterest.controller';


const router = express.Router();


router.get('/', auth(), discoverByInterestController.getNearbyPeopleController);


export const discoverByInterestRoutes = router;