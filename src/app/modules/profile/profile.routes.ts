import express from 'express';
import auth from '../../middlewares/auth';
import { profileController } from './profile.controller';


const router = express.Router();


router.get('/posts', auth(), profileController.getAllPostForProfile);


export const profileRoutes = router;