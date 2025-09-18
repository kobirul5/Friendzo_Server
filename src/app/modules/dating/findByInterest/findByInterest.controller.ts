import httpStatus from 'http-status';
import { findByInterestService } from './findByInterest.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { Request, Response } from 'express';


const getPeopleBySharedInterestsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const interest = req.query.interest as string;
    const result = await findByInterestService.getPeopleBySharedInterests({
      userId,
      interest,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "People with shared interests retrieved successfully.",
      data: result,
    });
  }
);

export const findByInterestController = {
  getPeopleBySharedInterestsController
};