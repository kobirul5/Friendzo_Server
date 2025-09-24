import httpStatus from 'http-status';
import { follwerService } from './follwer.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Request, Response } from 'express';

const createFollwer = catchAsync(async (req:Request, res:Response) => {

  const userId = req.user.id; 
  const { followerId, modeType } = req.body;

  const result = await follwerService.createFollowerAndFollowingService({userId, followerId, modeType});
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

 const getMyAllFollwer = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await follwerService.getMyFollowerService(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followers  retrieved successfully',
    data: result,
  });
});


 const getMyAllFollowing = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await follwerService.getMyFollowingService(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followings retrieved successfully',
    data: result,
  });
});

const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = req.user.id; 
  const {followingId} = req.body;

  const result = await follwerService.unfollowUserSocialService(followerId, followingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  });
});
const unfollowDatingUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const {followId }= req.body
  const result = await follwerService.unfollowUserDatingService(followId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  });
});


const acceptOrRejectFollwershipRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; 
  const {followId, modeType , status} = req.body;

  const result = await follwerService.acceptOrRejectFollwershipRequestService(userId, followId, modeType, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Request accepted or rejected successfully',
    data: result,
  });
})

const getMyAllFriends = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; 
  const { type } = req.params; // type can be 'all', 'mutual', etc.
  const search = req.query.search as string || '';
  
  const result = await follwerService.getMyAllFriends(userId, type, search);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Friends retrieved successfully',
    data: result,
  });
});


const getMyAllFollwerRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; 
  const { type } = req.params;

  const result = await follwerService.getMyAllFollwerRequest({userId, type});

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Follower requests retrieved successfully',
    data: result,
  });
});

const getMyAllFollwingRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; 
  const { type } = req.params;

  const result = await follwerService.getMyAllFollwingRequest({userId, type});

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Following requests retrieved successfully',
    data: result,
  });
});


const getAllSuggestedUsers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; 
  const { type } = req.params;

  const result = await follwerService.getAllSuggestedUsers({userId, type});

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Suggested users retrieved successfully',
    data: result,
  });
});

// unfriend
const unfriendUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; 
  const type = req.params.type
  const {friendId} = req.body;

  const result = await follwerService.unfriendUser({userId, friendId, type});

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfriended successfully',
    data: result,
  });
})


export const followerController = {
  createFollwer,
  getMyFollowersAndFollowingCount,
  unfollowUser,
  getMyAllFollwer,
  getMyAllFollowing,
  acceptOrRejectFollwershipRequest,
  getMyAllFriends,
  getMyAllFollwerRequest,
  getMyAllFollwingRequest,
  unfollowDatingUser,
  getAllSuggestedUsers,
  unfriendUser
};