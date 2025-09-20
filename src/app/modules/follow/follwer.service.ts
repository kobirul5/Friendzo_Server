import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { ModeType, RequestStatus } from "@prisma/client";

const createFollowerAndFollowingService = async (payload: {
  userId: string;
  followerId: string;
  modeType: ModeType;
}) => {
  const { userId, followerId, modeType } = payload;

  if (userId === followerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");
  }

  if (modeType !== ModeType.DATING && modeType !== ModeType.SOCIAL) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid mode type, it should be DATING or SOCIAL"
    );
  }

  const following = await prisma.user.findUnique({
    where: { id: followerId , },
  });

  if (!following) {
    throw new ApiError(httpStatus.NOT_FOUND, "Following user not found");
  }

  //  Application-level check for duplicates
  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId: userId,
      modeType,
    },
  });

  if (alreadyFollowing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Already following this user with this mode"
    );
  }

  if (alreadyFollowing) {
    throw new ApiError(httpStatus.CONFLICT, "Already following this user");
  }

  const follow = await prisma.follow.create({
    data: {
      followerId,
      modeType,
      followingId: userId,
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

const unfollowUserSocialService = async (followerId: string, followingId: string) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId,
      modeType: ModeType.SOCIAL,
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

const unfollowUserDatingService = async (followId: string , userId: string) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
     id:followId,
    //  modeType: ModeType.DATING
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND,"Follow relationship not found");
  }

  if (follow.followerId !== userId) {
    throw new ApiError(httpStatus.BAD_REQUEST,"You are not authorized to unfollow this user");
  }

  // Delete the follow relation
  await prisma.follow.deleteMany({
    where: {
      id: follow.id,
    },
  });

  return { unfollowed: true };
};

const acceptOrRejectFollwershipRequestService = async (
  userId: string,
  followId: string,
  modeType: ModeType,
  status: RequestStatus
) => {
  // Check if follow relation exists

  if (
    status !== RequestStatus.ACCEPTED &&
    status !== RequestStatus.CANCELED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid status. status should be ACCEPTED or CANCELED"
    );
  }

  const follow = await prisma.follow.findFirst({
    where: {
      id: followId,
      // followingId: userId,
      // modeType,
    },
  });


  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  if (follow.followerId === userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to accept or reject this request"
    );
  }

  if (follow.followingId !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to accept or reject this request"
    );
  }


  

  if (!follow) {
    throw new Error("Follow relationship not found");
  }

  const acceptOrReject = await prisma.follow.updateMany({
    where: {
      id: followId,
      modeType,
    },
    data: {
      requestStatus: status,
    },
  });

  return {massage: "Successfully updated"};
};



const getMyAllFriends = async (userId: string, type: string) => {

  if(type !== 'social' && type !== 'dating' && type !== 'all'){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid type. type should be social, dating or all, type muste be social or dating");
  }

  let modeType : ModeType | undefined = undefined;
  if(type === 'social'){
    modeType = ModeType.SOCIAL;
  }else if(type === 'dating'){
    modeType = ModeType.DATING;
  }

  // Friends are users who have accepted each other's follow requests
  const friends = await prisma.follow.findMany({
    where: {
      OR: [
        {
          followerId: userId,
          requestStatus: RequestStatus.ACCEPTED,
          modeType
        },  
        {
          followingId: userId,
          requestStatus: RequestStatus.ACCEPTED,
          modeType
        },
      ],
    },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true
        },
      },
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true
        },
      },
    },
  });

  return {
    friends: friends.map((f) =>
      f.followerId === userId ? f.following : f.follower
    ),
  };
};


const getMyAllFollwerRequest = async ({userId, type}: {userId: string, type: string}) => {

  if(type !== 'social' && type !== 'dating'){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid type. type should be social, dating, type muste be social or dating");
  }

  let modeType : ModeType | undefined = undefined;
  if(type === 'social'){
    modeType = ModeType.SOCIAL;
  }else if(type === 'dating'){
    modeType = ModeType.DATING;
  }

  const follwerRequests = await prisma.follow.findMany({
    where: {
      followerId: userId,
      requestStatus: RequestStatus.PENDING,
      modeType
    },
    include: {
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true
        },
      },
    },
  })


  return follwerRequests
}


const getMyAllFollwingRequest = async ({userId, type}: {userId: string, type: string}) => {

  if(type !== 'social' && type !== 'dating'){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid type. type should be social, dating, type muste be social or dating");
  }

  let modeType : ModeType | undefined = undefined;
  if(type === 'social'){
    modeType = ModeType.SOCIAL;
  }else if(type === 'dating'){
    modeType = ModeType.DATING;
  }

  const follwingRequests = await prisma.follow.findMany({
    where: {
      followingId: userId,
      requestStatus: RequestStatus.PENDING,
      modeType
    },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true
        },
      },
    },
  })


  return follwingRequests

}


export const follwerService = {
  createFollowerAndFollowingService,
  unfollowUserSocialService,
  unfollowUserDatingService,
  getMyFollowerService,
  getMyNetworkCount,
  getMyFollowingService,
  acceptOrRejectFollwershipRequestService,
  getMyAllFriends,
  getMyAllFollwerRequest,
  getMyAllFollwingRequest
};
