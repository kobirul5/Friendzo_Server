
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';


const createFollowerAndFollowingService = async (payload: {
  followerId: string;
  followingId: string;
}) => {
  const { followerId, followingId } = payload;

  if (followerId === followingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot follow yourself');
  }

  const alreadyFollowing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (alreadyFollowing) {
    throw new ApiError(httpStatus.CONFLICT, 'Already following this user');
  }

  const follow = await prisma.follow.create({
    data: {
      followerId,
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
    followers:followers.map(f => f.follower),
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
    following: following.map(f => f.following),
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
    throw new Error('Follow relationship not found');
  }

  // Delete the follow relation
  await prisma.follow.delete({
    where: {
      id: follow.id,
    },
  });

  return { unfollowed: true };
};

export const follwerService = {
  createFollowerAndFollowingService,
  unfollowUserService,
  getMyFollowerService,
  getMyNetworkCount,
  getMyFollowingService
};