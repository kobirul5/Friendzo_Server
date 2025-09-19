import httpStatus from 'http-status';

import { giftService } from './gift.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';

const buyGiftCard = catchAsync(async (req, res) => {
  const data = req.body
  const userId = req.user.id;
  const result = await giftService.buyGiftCard({
    data,
    userId
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "GiftCard created successfully",
    data: result,
  });
})


export const giftController = {
  buyGiftCard
};