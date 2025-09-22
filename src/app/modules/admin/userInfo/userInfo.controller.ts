import httpStatus from 'http-status';

import { userInfoService } from './userInfo.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';


const dashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const options = req.query;              
  const result = await userInfoService.dashboardStats(options, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});
const allUsers = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const options = req.query;              
  const result = await userInfoService.allUsers(options, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

const getUserInfoById = catchAsync(async (req, res) => {
  const result = await userInfoService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserInfo details retrieved successfully',
    data: result,
  });
});

const deleteUserById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const {id} = req.params;
  const result = await userInfoService.deleteUserByIdFromDb(userId, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const blockedAndUnblockedUserById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const {userId: id, status} = req.body;
  const result = await userInfoService.blockedAndUnblockedUserByIdFromDb(userId, id, status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User ${status} successfully`,
    data: result,
  });
});

export const userInfoController = {
  dashboardStats,
  allUsers,
  getUserInfoById,
  deleteUserById,
  blockedAndUnblockedUserById

};