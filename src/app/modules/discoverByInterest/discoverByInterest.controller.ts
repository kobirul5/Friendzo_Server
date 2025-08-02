import httpStatus from 'http-status';
import { Request, Response } from 'express';

import { discoverByInterestService } from './discoverByInterest.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const getNearbyPeopleController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseFloat(req.query.radiusKm as string || "10"); // default to 10km if not provided



  if (!userId) {
    throw new Error("User not authenticated.");
  }

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error("Latitude and Longitude must be valid numbers.");
  }

  const result = await discoverByInterestService.getNearbyPeople(userId, lat, lng, radiusKm);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Nearby people retrieved successfully.",
    data: result,
  });
});

const getTodaysBuzzController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;


  const event = await discoverByInterestService.getTodaysBuzz(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Nearby people retrieved successfully.",
    data: event,
  });
});

const getPeopleBySharedInterestsController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await discoverByInterestService.getPeopleBySharedInterests(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "People with shared interests retrieved successfully.",
    data: result,
  });
});

export const discoverByInterestController = {
 getNearbyPeopleController,
 getPeopleBySharedInterestsController,
 getTodaysBuzzController
};