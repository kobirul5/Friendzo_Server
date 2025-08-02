// import express from 'express';
// import auth from '../../middlewares/auth';
// import validateRequest from '../../middlewares/validateRequest';
// import { notificationController } from './notification.controller';
// import { notificationValidation } from './notification.validation';

// const router = express.Router();

// router.post(
// '/',
// auth(),
// validateRequest(notificationValidation.createSchema),
// notificationController.createNotification,
// );

// router.get('/', auth(), notificationController.getNotificationList);

// router.get('/:id', auth(), notificationController.getNotificationById);

// router.put(
// '/:id',
// auth(),
// validateRequest(notificationValidation.updateSchema),
// notificationController.updateNotification,
// );

// router.delete('/:id', auth(), notificationController.deleteNotification);

// export const notificationRoutes = router;