import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { ModeType, RequestStatus } from "@prisma/client";

const createFollowerAndFollowingService = async (payload: {
  followerId: string;
  followingId: string;
  modeType: ModeType;
}) => {
  const { followerId, followingId, modeType } = payload;

  if (followerId === followingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");
  }

  if(modeType !== ModeType.DATING && modeType !== ModeType.SOCIAL){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid mode type, it should be DATING or SOCIAL");
  }


  const following = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!following) {
    throw new ApiError(httpStatus.NOT_FOUND, "Following user not found");
  }


   //  Application-level check for duplicates
  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId,
      modeType,
    },
  });

  if (alreadyFollowing) {
    throw new ApiError(httpStatus.CONFLICT, "Already following this user with this mode");
  }

  if (alreadyFollowing) {
    throw new ApiError(httpStatus.CONFLICT, "Already following this user");
  }

  const follow = await prisma.follow.create({
    data: {
      followerId,
      modeType,
      followingId,
    },
  });

  return follow;
};

const getMyNetworkCount = async (userId: string) => {
  const followerCount = await prisma.follow.count({
    where: { followingId: userId },
  });

  const followingCount = await prisma.follow.count({
    where: { followerId: userId },
  });

  return {
    followerCount,
    followingCount,
  };
};

const getMyFollowerService = async (userId: string) => {
  const tootalFollowers = await prisma.follow.count({
    where: { followingId: userId },
  });

  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    followers: followers.map((f) => f.follower),
    totalFollowers: tootalFollowers,
  };
};

const getMyFollowingService = async (userId: string) => {
  const totalFollowing = await prisma.follow.count({
    where: { followerId: userId },
  });

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    following: following.map((f) => f.following),
    totalFollowing: totalFollowing,
  };
};

const unfollowUserService = async (followerId: string, followingId: string) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId,
    },
  });

  if (!follow) {
    throw new Error("Follow relationship not found");
  }

  // Delete the follow relation
  await prisma.follow.delete({
    where: {
      id: follow.id,
    },
  });

  return { unfollowed: true };
};


const acceptOrRejectFollwershipRequestService = async (userId: string, followId: string, modeType: ModeType, status: RequestStatus) => {
  // Check if follow relation exists

  const follow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      id: followId,
      modeType,
    },
  });

  if(!follow){
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  if(follow.followerId === userId){
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized to accept or reject this request");
  }

  if(follow.followingId !== userId){
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized to accept or reject this request");
  }

  console.log(followId, follow.followingId)

 if(status !== RequestStatus.ACCEPTED && status !== RequestStatus.REJECTED && status !== RequestStatus.CANCELED){
   throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status. status should be ACCEPTED, REJECTED or CANCELLED");
 }

  if (!follow) {
    throw new Error("Follow relationship not found");
  }


  const acceptOrReject = await prisma.follow.update({
    where: {
      id: follow.id,
      modeType,
    },
    data: {
      requestStatus: status
    },
  });

  return acceptOrReject;


}

export const follwerService = {
  createFollowerAndFollowingService,
  unfollowUserService,
  getMyFollowerService,
  getMyNetworkCount,
  getMyFollowingService,
  acceptOrRejectFollwershipRequestService
};
