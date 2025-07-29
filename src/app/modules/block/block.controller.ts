import httpStatus from 'http-status';

import { blockService } from './block.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const createBlock = catchAsync(async (req, res) => {
  const blockerId = req.user.id;
  const blockedUserId = req.body.blockedUserId
  const result = await blockService.createIntoDb(blockerId as string, blockedUserId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Block created successfully',
    data: result,
  });
});



export const blockController = {
  createBlock,
};