import express from 'express';
import { coinsController } from './coins.controller';
import { coinsValidation } from './coins.validation';
import auth from '../../../middlewares/auth';
import validateRequest from '../../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../../helpars/fileUploader';

const router = express.Router();

router.post(
'/',
auth(UserRole.ADMIN),
coinsController.createCoins,
);

router.get('/', auth(), coinsController.getCoinsList);

router.get('/:id', auth(), coinsController.getCoinsById);

router.put(
'/:id',
auth(),
validateRequest(coinsValidation.updateSchema),
coinsController.updateCoins,
);

router.delete('/:id', auth(), coinsController.deleteCoins);

export const coinsRoutes = router;