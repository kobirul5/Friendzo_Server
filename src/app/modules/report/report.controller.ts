import httpStatus from 'http-status';
import { reportService } from './report.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Response } from 'express';

const createReportUser = catchAsync(async (req: any, res: Response) => {
  const reporterId = req.user.id; 

  const result = await reportService.createReportUserService(req.body, reporterId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Report created successfully',
    data: result,
  });
});
const createReportPost = catchAsync(async (req: any, res: Response) => {
  const reporterId = req.user.id; 

  const result = await reportService.createReportPostService(req.body, reporterId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Report created successfully',
    data: result,
  });
});

const deleteReport = catchAsync(async (req: any, res: Response) => {
  const reportId = req.params.id;
  const result = await reportService.deleteReportService(reportId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report deleted successfully',
    data: result,
  });
});


const getReportedUsers = catchAsync(async (req: any, res: Response) => {
  const result = await reportService.getReportedUsersService();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reported users retrieved successfully',
    data: result,
  });
});
const getReportedPosts = catchAsync(async (req: any, res: Response) => {
  const result = await reportService.getReportedPostsService();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reported users retrieved successfully',
    data: result,
  });
});

export const reportController = {
  createReportUser,
  createReportPost,
  deleteReport,
  getReportedUsers,
  getReportedPosts
};