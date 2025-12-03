import httpStatus from "http-status";
import { Request, Response } from "express";

import { discoverByInterestService } from "./discoverByInterest.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const getNearbyPeopleController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radiusKm as string) || 657018000; // default to 10km if not provided
    const search = req.query.search as string;
    const gender = req.query.gender as string;

    console.log(radiusKm)
// maxDistance 
const maxDistance =  Number(req.query.maxDistance as string)
// minDistance 
const minDistance =  Number(req.query.minDistance as string)

  
  const result = await discoverByInterestService.getNearbyPeople({
      userId,
      lat,
      lng,
      radiusKm,
      search,
      gender,
      minDistance,
          maxDistance,

    }
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Nearby people retrieved successfully.",
      data: result,
    });
  }
);

const getTodaysBuzzController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const event = await discoverByInterestService.getTodaysBuzz(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Nearby people retrieved successfully.",
      data: event,
    });
  }
);

const getPeopleBySharedInterestsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const interest = req.query.interest as string;
    const result = await discoverByInterestService.getPeopleBySharedInterests({
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

export const discoverByInterestController = {
  getNearbyPeopleController,
  getPeopleBySharedInterestsController,
  getTodaysBuzzController,
};
