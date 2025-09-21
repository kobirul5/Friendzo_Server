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



export const userInfoController = {
  dashboardStats,
  allUsers,
  getUserInfoById,

};