import httpStatus from 'http-status';
import { paymentsService } from './payments.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';


const createPayment = catchAsync(async (req, res) => {
  const { paymentMethod, coinId, currency } = req.body;
  const userId = req.user.id;

  const result = await paymentsService.createCoinPurchase({
    paymentMethod,
    coinId,
    currency,
    userId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment created successfully',
    data: result,
  });
});



export const paymentsController = {
  createPayment
};