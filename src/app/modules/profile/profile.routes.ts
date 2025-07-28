import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { profileController } from './profile.controller';
import { profileValidation } from './profile.validation';

const router = express.Router();


router.get('/posts', auth(), profileController.getAllPostForProfile);


// router.post(
// '/',
// auth(),
// validateRequest(profileValidation.createSchema),
// profileController.createProfile,
// );


// router.get('/:id', auth(), profileController.getProfileById);

// router.put(
// '/:id',
// auth(),
// validateRequest(profileValidation.updateSchema),
// profileController.updateProfile,
// );

// router.delete('/:id', auth(), profileController.deleteProfile);

export const profileRoutes = router;