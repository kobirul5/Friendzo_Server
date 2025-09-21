import httpStatus from 'http-status';
import { adminService } from './admin.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';



const getTotalUsers = catchAsync(async (req, res) => {
  const result = await adminService.getTotalUsersService(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin list retrieved successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params


  const result = await adminService.deleteUserService(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const getTotalreport = catchAsync(async (req, res) => {
  const result = await adminService.getTotalReportService(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Total Report Count retrieved successfully',
    data: result,
  });
});

const getMonthlyReport = catchAsync(async (req, res) => {
  const result = await adminService.getMonthlyReportService();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Last 1 month report count retrieved successfully',
    data: result,
  });
});


const getweeklyReport = catchAsync(async (req, res) => {
  const result = await adminService.getweeklyReportService();
   sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Last 7 day report retrieved successfully',
    data: result,
  });
});

const getDailyReport = catchAsync(async (req, res) => {
  const result = await adminService.getDailyReportService();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily report retrieved successfully',
    data: result,
  });
});


const createInterest = catchAsync(async (req, res) => {
  const result = await adminService.createInterestService(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Interest created successfully',
    data: result,
  });
});

// 
const getInterests = catchAsync(async (req, res) => {
  const result = await adminService.getAllInterestsService(); 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Interests retrieved successfully',
    data: result,
  });
});


export const adminController = {
  getTotalUsers,
  deleteUser,
  getTotalreport,
  getMonthlyReport,
  getweeklyReport,
  getDailyReport,
  createInterest,
  getInterests
};