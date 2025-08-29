import express from 'express';

import  authMiddleware  from '../../middlewares/auth';
import { memoriesController } from './memories.controller';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post('/', authMiddleware(),fileUploader.uploadFile,  memoriesController.createMemory);
router.get('/', authMiddleware(), memoriesController.getUserMemories);
router.get('/all-memories', authMiddleware(), memoriesController.getUserMemoriesAllUsers);
router.get('/:id', authMiddleware(), memoriesController.getSingleMemory);
router.patch('/:id', authMiddleware(), memoriesController.updateMemory);
router.delete('/:id', authMiddleware(), memoriesController.deleteMemory);


export const memoriesRoutes = router;
