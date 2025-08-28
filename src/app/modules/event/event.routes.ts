import express from 'express';

import  authMiddleware  from '../../middlewares/auth';
import { eventController } from './event.controller';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post('/', authMiddleware(),fileUploader.uploadFile,  eventController.createEvent);
router.get('/', authMiddleware(), eventController.getUserEvent);
router.get('/all-events', authMiddleware(), eventController.getAllEvents);
router.get('/:id', authMiddleware(), eventController.getSingleEvent);
router.patch('/:id', authMiddleware(), eventController.updateEvent);
router.delete('/:id', authMiddleware(), eventController.deleteEvent);



export const eventsRoutes = router;
