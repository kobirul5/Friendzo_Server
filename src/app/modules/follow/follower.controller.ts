import httpStatus from 'http-status';
import { followerService } from './follower.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Request, Response } from 'express';

const createFollower = catchAsync(async (req: Request, res: Response) => {

  const userId = req.user.id;
  const { followerId } = req.body;

  const result = await followerService.createFollowerAndFollowingService({ userId, followerId });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Request successfully sent',
    data: result,
  });
});


const getMyFollowersAndFollowingCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await followerService.getMyNetworkCount(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followers and followings retrieved successfully',
    data: result,
  });
});

const getMyAllFollower = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await followerService.getMyFollowerService(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followers retrieved successfully',
    data: result,
  });
});


const getMyAllFollowing = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await followerService.getMyFollowingService(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followings retrieved successfully',
    data: result,
  });
});


const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = req.user.id;
  const { followingId } = req.body;

  const result = await followerService.unfollowUserSocialService(followerId, followingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  });
});

const unfollowDatingUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { followId } = req.body
  const result = await followerService.unfollowUserDatingService(followId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  });
});


const acceptOrRejectFollowershipRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { followId, status } = req.body;

  const result = await followerService.acceptOrRejectFollowershipRequestService(userId, followId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Request ${status.toLowerCase()} successfully`,
    data: result,
  });
})

const getMyAllFriends = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { type } = req.params; // type can be 'all', 'mutual', etc.
  const search = req.query.search as string || '';

  const result = await followerService.getMyAllFriends(userId, type, search);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Friends retrieved successfully',
    data: result,
  });
});


const getMyAllFollowerRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { type } = req.params;

  const result = await followerService.getMyAllFollowerRequest({ userId, type });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Follower requests retrieved successfully',
    data: result,
  });
});

const getMyAllFollowingRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { type } = req.params;

  const result = await followerService.getMyAllFollowingRequest({ userId, type });

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

  const result = await followerService.getAllSuggestedUsers({ userId, type });

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
  // const type = req.params.type
  const { friendId } = req.body;

  const result = await followerService.unfriendUser({ userId, friendId });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfriended successfully',
    data: result,
  });
})


const acceptOrDeclineFollowerRequestByUserId = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id: followerId, status } = req.body;

  const result = await followerService.acceptOrDeclineFollowerRequestByUserId({ userId, followerId, status });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Request accepted successfully',
    data: result,
  });
})

const unfollowUserBYUserId = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { userId: followerId } = req.body;

  const result = await followerService.unfollowUserByUserId({ userId, followerId });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  });
})




export const followerController = {
  createFollower,
  getMyFollowersAndFollowingCount,
  unfollowUser,
  getMyAllFollower,
  getMyAllFollowing,
  acceptOrRejectFollowershipRequest,
  getMyAllFriends,
  getMyAllFollowerRequest,
  getMyAllFollowingRequest,
  unfollowDatingUser,
  getAllSuggestedUsers,
  unfriendUser,
  acceptOrDeclineFollowerRequestByUserId,
  unfollowUserBYUserId,

};