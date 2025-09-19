import httpStatus from 'http-status';
import { coinsService } from './coins.service';
import ApiError from '../../../../errors/ApiErrors';
import prisma from '../../../../shared/prisma';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';




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
  const data = req.body;
  const userId = req.user.id;
  const result = await coinsService.buyCoin({
    data,
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
  buyCoin
};