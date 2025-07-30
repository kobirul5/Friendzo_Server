import httpStatus from 'http-status';

import { blockService } from './block.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { isBlocked } from '../../middlewares/checkBlockedStatus';
import { Response } from 'express';
import ApiError from '../../../errors/ApiErrors';

const createBlock = catchAsync(async (req, res:Response) => {
  const blockerId = req.user.id;
  const blockedUserId = req.body.blockedUserId
  const result = await blockService.createBlockBetweenUsers(blockerId as string, blockedUserId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Block created successfully',
    data: result,
  });
});

const checkBlockStatus = catchAsync(async (req: any, res: Response) => {
  const currentUserId = req.user?.id;
  const targetUserId = req.params.receiverId;

  
  if (! currentUserId ||!targetUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot block yourself");
  }
  const blocked = await isBlocked(currentUserId, targetUserId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User Status successfully',
    data: {blockedStatuse:blocked},
  });

});

export const blockController = {
  createBlock,
  checkBlockStatus
};