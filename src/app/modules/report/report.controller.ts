import httpStatus from 'http-status';
import { reportService } from './report.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Response } from 'express';

const createReport = catchAsync(async (req: any, res: Response) => {
  const reporterId = req.user.id; 

  const result = await reportService.createReportService(req.body, reporterId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Report created successfully',
    data: result,
  });
});




export const reportController = {
  createReport,
};