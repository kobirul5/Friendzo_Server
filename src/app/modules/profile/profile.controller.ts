import httpStatus from 'http-status';
import { profileService } from './profile.service';
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';



const getAllPostForProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await profileService.getAllPostForProfileService(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Total post retrieved successfully',
    data: result,
  });
});


export const profileController = {
  getAllPostForProfile,
};