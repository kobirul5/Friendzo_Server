import httpStatus from 'http-status';
import { coinsService } from './coins.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';

const createCoins = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await coinsService.createIntoDb(req.body, userId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Coins created successfully',
    data: result,
  });
});

const getCoinsList = catchAsync(async (req, res) => {
  const result = await coinsService.getListFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coins list retrieved successfully',
    data: result,
  });
});

const getCoinsById = catchAsync(async (req, res) => {
  const result = await coinsService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coins details retrieved successfully',
    data: result,
  });
});

const updateCoins = catchAsync(async (req, res) => {
  const result = await coinsService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coins updated successfully',
    data: result,
  });
});

const deleteCoins = catchAsync(async (req, res) => {
  const result = await coinsService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coins deleted successfully',
    data: result,
  });
});

export const coinsController = {
  createCoins,
  getCoinsList,
  getCoinsById,
  updateCoins,
  deleteCoins,
};