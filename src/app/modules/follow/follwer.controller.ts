import httpStatus from 'http-status';
import { follwerService } from './follwer.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Request, Response } from 'express';

const createFollwer = catchAsync(async (req:Request, res:Response) => {

  const followerId = req.user.id; 
  const { followingId } = req.body;

  const result = await follwerService.createFollowerAndFollowingService({followerId, followingId});
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Follwer created successfully',
    data: result,
  });
});


 const getMyFollowersAndFollowingCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await follwerService.getMyNetworkCount(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followers and followings retrieved successfully',
    data: result,
  });
});

//  const getMyFollowersAndFollowings = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;

//   const result = await follwerService.getMyNetwork(userId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Followers and followings retrieved successfully',
//     data: result,
//   });
// });

const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = req.user.id; 
  const {followingId} = req.body;

  const result = await follwerService.unfollowUserService(followerId, followingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  });
});

export const follwerController = {
  createFollwer,
  getMyFollowersAndFollowingCount,
  unfollowUser,
};