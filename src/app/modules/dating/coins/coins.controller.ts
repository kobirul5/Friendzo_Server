import httpStatus from 'http-status';
import { coinsService } from './coins.service';
import ApiError from '../../../../errors/ApiErrors';
import prisma from '../../../../shared/prisma';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { paymentsService } from '../../payments/payments.service';




const getCoinList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await coinsService.getCoinList({ userId });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "coins list retrieved successfully",
    data: result,
  });
});

const buyCoin = catchAsync(async (req, res) => {
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
    message: "Coins buy successfully",
    data: result,
  });
});

const sendCoin  = catchAsync(async (req, res) => {
 const { paymentMethod, coinId, currency, recipients } = req.body;
   const userId = req.user.id;
 
   const result = await paymentsService.createGiftCoinPurchase({
     paymentMethod,
     coinId,
     currency,
     recipients,
     userId,
   });
   
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Coins buy successfully",
    data: result,
  });
});

const giftCoin  = catchAsync(async (req, res) => {
 const { coinAmount,  recipients } = req.body;
   const userId = req.user.id;
 
   const result = await coinsService.createGiftCoin({
     coinAmount,
     recipients,
     userId,
   });
   
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Coins buy successfully",
    data: result,
  });
});


export const coinsController = {
  getCoinList,
  buyCoin,
  sendCoin,
  giftCoin
};