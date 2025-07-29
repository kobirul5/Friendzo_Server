import express from 'express';
import auth from '../../middlewares/auth';
import { blockController } from './block.controller';


const router = express.Router();

router.post(
'/',
auth(),
blockController.createBlock,
);


export const blockRoutes = router;