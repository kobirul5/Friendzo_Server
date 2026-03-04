import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { RequestStatus, UserStatus } from "@prisma/client";

const createFollowerAndFollowingService = async (payload: {
  userId: string;
  followerId: string;

}) => {
  const { userId, followerId } = payload;

  if (userId === followerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");
  }

  // check target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: followerId },
  });

  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target user not found");
  }

  // check already following
  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId: userId, 
      followingId: followerId, 
     
    },
  });

  
  if (
    alreadyFollowing &&
    alreadyFollowing.requestStatus === RequestStatus.CANCELED
  ) {
    const result = await prisma.follow.update({
      where: { id: alreadyFollowing.id },
      data: { requestStatus: RequestStatus.PENDING },
    });

    return result;
  }
  
  if (alreadyFollowing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Already following this user with this mode"
    );
  }



  const follow = await prisma.follow.create({
    data: {
      followerId: userId, 
      followingId: followerId, 
 
      requestStatus: RequestStatus.PENDING, 
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const totalFollowers = await prisma.follow.count({
    where: { followingId: userId },
  });

  const followers = await prisma.follow.findMany({
    where: { followingId: userId, },
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
    totalFollowers: totalFollowers,
  };
};

const getMyFollowingService = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const totalFollowing = await prisma.follow.count({
    where: {
      followerId: userId,
      requestStatus: RequestStatus.ACCEPTED,
    },
  });

  const following = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      following: {
        where: { requestStatus: RequestStatus.ACCEPTED },  // 🔥 Only accepted
        select: {
          id: true,
          requestStatus: true,
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!following) {
    throw new ApiError(httpStatus.NOT_FOUND, "following not found");
  }

  const response = following.following.map((f) => ({
    id: f.following.id,
    firstName: f.following.firstName,
    lastName: f.following.lastName,
    profileImage: f.following.profileImage,
    requestStatus: f.requestStatus,
  }));

  return {
    following: response,
    totalFollowing,
  };
};


const unfollowUserSocialService = async (
  followerId: string,
  followingId: string
) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId,
      // modeType: ModeType.SOCIAL,
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  // Delete the follow relation
  await prisma.follow.delete({
    where: {
      id: follow.id,
    },
  });


  if (follow) {
  return { unfollowed: true };
};

const unfollowUserDatingService = async (followId: string, userId: string) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
      id: followId,
      //  modeType: ModeType.DATING
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  if (follow.followerId !== userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You are not authorized to unfollow this user"
    );
  }



  // Delete the follow relation
  await prisma.follow.deleteMany({
    where: {
      id: follow.id,
    },
  });

  if (follow) {
};

const acceptOrRejectFollwershipRequestService = async (
  userId: string,
  followId: string,
  status: "ACCEPTED" | "CANCELED"
) => {
  // Validate status
  if (![RequestStatus.ACCEPTED, RequestStatus.CANCELED].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid status. Status should be ACCEPTED or CANCELED"
    );
  }

  // Find the follow request
  const follow = await prisma.follow.findUnique({
    where: { id: followId },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  // Authorization: only the user being followed can accept/reject
  if (follow.followingId !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to accept or reject this request"
    );
  }

  // Optional: ensure modeType matches
  // if (follow.modeType !== modeType) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "Mode type mismatch for this follow request"
  //   );
  // }

  // Update single follow request
  const updatedFollow = await prisma.follow.update({
    where: { id: followId },
    data: { requestStatus: status },
  });

  if (status === RequestStatus.ACCEPTED) {
    const reverseFollow = await prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: follow.followerId,
      },
    });

    if (reverseFollow) {
      await prisma.follow.update({
        where: { id: reverseFollow.id },
        data: { requestStatus: RequestStatus.ACCEPTED },
      });
    } else {




      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: follow.followerId,
          requestStatus: RequestStatus.ACCEPTED,
        },
      });
    }
  }

  if (status === RequestStatus.ACCEPTED) {
    let room = await prisma.room.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: follow.followerId },
          { senderId: follow.followerId, receiverId: userId },
        ],
      },
    });

    if (!room) {
      room = await prisma.room.create({
        data: { senderId: userId, receiverId: follow.followerId },
      });
    }

    const autoMessage = await prisma.chat.create({
      data: {
        senderId: userId,
        receiverId: follow.followerId,
        roomId: room.id,
        message: `Hi , Thanks for following! Your request has been accepted.`,
      },
    });
  }

if (status === RequestStatus.CANCELED) {
  await prisma.follow.deleteMany({
    where: {
      OR: [
        {
          followerId: userId,
          followingId: follow.followerId,
        },
        {
          followerId: follow.followerId,
          followingId: userId,
        },
      ],
    },
  });

  await prisma.room.deleteMany({
    where: {
      OR: [
        {
          senderId: userId,
          receiverId: follow.followerId,
        },
        {
          senderId: follow.followerId,
          receiverId: userId,
        },
      ],
    },
  });
}

  return {
    message: `Follow request ${status.toLowerCase()} successfully`,
    follow: updatedFollow,
  };
};

// const getMyAllFriends = async (userId: string, type: string) => {
//   if (type !== "social" && type !== "dating" && type !== "all") {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Invalid type. type should be social, dating or all, type must be social or dating"
//     );
//   }

//   let modeType: ModeType | undefined = undefined;
//   if (type === "social") {
//     modeType = ModeType.SOCIAL;
//   } else if (type === "dating") {
//     modeType = ModeType.DATING;
//   }

//   // Friends are users who have accepted each other's follow requests
//   const friends = await prisma.follow.findMany({
//     where: {
//       OR: [
//         {
//           followerId: userId,
//           requestStatus: RequestStatus.ACCEPTED,
//           modeType,
//         },
//         {
//           followingId: userId,
//           requestStatus: RequestStatus.ACCEPTED,
//           modeType,
//         },
//       ],
//     },
//     include: {
//       follower: {
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           profileImage: true,
//           address: true,
//         },
//       },
//       following: {
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           profileImage: true,
//           address: true,
//         },
//       },
//     },
//   });

//  const rawFriends = friends.map((f) =>
//     f.followerId === userId ? f.following : f.follower
//   );

//   // 3️ Remove duplicates by user.id
//   const uniqueFriends = Array.from(
//     new Map(rawFriends.map((friend) => [friend.id, friend])).values()
//   );

//   return { friends: uniqueFriends };
// };

const getMyAllFriends = async (
  userId: string,
  type: string,
  search?: string
) => {
  if (!["social", "dating", "all"].includes(type)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type should be social, dating or all"
    );
  }

  const friends = await prisma.follow.findMany({
    where: {
      OR: [
        { followerId: userId, requestStatus: RequestStatus.ACCEPTED },
        {
          followingId: userId,
          requestStatus: RequestStatus.ACCEPTED,
          // modeType,
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
          address: true,
          blockedUsers: { where: { blockedUserId: userId } },
          blockedByUsers: { where: { blockerId: userId } },
        },
      },
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true,
          blockedUsers: { where: { blockedUserId: userId } },
          blockedByUsers: { where: { blockerId: userId } },
        },
      },
    },
  });

  let rawFriends = friends
    .map((f) => (f.followerId === userId ? f.following : f.follower))
    .filter(
      (friend) =>
        friend.blockedUsers.length === 0 && friend.blockedByUsers.length === 0
    );

  // Apply search in JS (simpler & avoids TypeScript Prisma type issues)
  if (search) {
    const lowerSearch = search.toLowerCase();
    rawFriends = rawFriends.filter(
      (friend) =>
        friend.firstName?.toLowerCase().includes(lowerSearch) ||
        friend.lastName?.toLowerCase().includes(lowerSearch)
    );
  }

  const uniqueFriends = Array.from(
    new Map(rawFriends.map((friend) => [friend.id, friend])).values()
  );

  return { friends: uniqueFriends };
};

const getMyAllFollwerRequest = async ({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) => {
  if (type !== "social" && type !== "dating") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type should be social, dating, type must be social or dating"
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      followers: {
        where: {
          requestStatus: RequestStatus.PENDING,
          //  modeType 
        },
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              address: true,
            },
          },
        },
      },
    },
  });

  return user?.followers;
};

const getMyAllFollwingRequest = async ({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) => {
  if (type !== "social" && type !== "dating") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type should be social, dating, type muste be social or dating"
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      following: {
        where: {
          requestStatus: RequestStatus.PENDING,
          // modeType: modeType 
        },
        include: {
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              address: true,
            },
          },
        },
      },
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // const follwingRequests = await prisma.follow.findMany({
  //   where: {
  //     followingId: userId,
  //     requestStatus: RequestStatus.PENDING,
  //     modeType,
  //   },
  //   include: {
  //     follower: {
  //       select: {
  //         id: true,
  //         firstName: true,
  //         lastName: true,
  //         profileImage: true,
  //         address: true,
  //       },
  //     },
  //   },
  // });

  return user.following;
};

//  getAllSuggestedUsers

// const getAllSuggestedUsers = async ({
//   userId,
//   type,
// }: {
//   userId: string;
//   type: string;
// }) => {
//   if (type !== "social" && type !== "dating") {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       'Invalid type. Type must be "social" or "dating"'
//     );
//   }

//   const modeType: ModeType =
//     type === "social" ? ModeType.SOCIAL : ModeType.DATING;

//   // 1️ Get the current user
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, datingInterests: true, lat: true, lng: true },
//   });

//   if (!currentUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   // // 1️⃣ Get already followed userIds in this mode
//   // const alreadyFollowedIds = await prisma.follow.findMany({
//   //   where: {
//   //     followerId: userId,
//   //     // requestStatus: RequestStatus.ACCEPTED,
//   //     modeType: modeType,
//   //   },
//   //   select: { followerId: true },
//   // });
//   const alreadyFollowed = await prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       following: {
//         where: {
//           requestStatus: RequestStatus.PENDING,
//           // modeType: modeType,
//         },
//         select: { followingId: true }, // ✅
//       },
//     },
//   });

//   const excludeIds = alreadyFollowed?.following.map((f) => f.followingId) || [];

//   const whereId =
//     excludeIds.length > 0 ? [currentUser.id, ...excludeIds] : [currentUser.id];

//   // 2️ Get all users except blocked & self
//   const users = await prisma.user.findMany({
//     where: {
//       id: { notIn: whereId },
//       // isDatingMode: type === "dating" ? true : undefined,
//       blockedByUsers: { none: { blockerId: userId } },
//       blockedUsers: { none: { blockerId: userId } },
//       status: UserStatus.ACTIVE,
//       // followers: {
//       //   none: {
//       //     followerId: userId,
//       //     requestStatus: RequestStatus.ACCEPTED,
//       //     modeType: modeType, // <-- only remove already followed in this mode
//       //   },
//       // },
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       profileImage: true,
//       address: true,
//       isDatingMode: true,
//       datingInterests: true,
//       createdAt: true,
//       lat: true,
//       lng: true,
//       followers: true,
//     },
//   });

//   if (users.length === 0) {
//     return [];
//   }

//   const suggestedUsers = users
//     .map((user) => {
//       let score = 0;

//       // Interest match score
//       const commonInterests = user.datingInterests.filter((i) =>
//         currentUser.datingInterests.includes(i)
//       );
//       score += commonInterests.length * 10;

//       // Proximity score
//       if (user.lat && user.lng && currentUser.lat && currentUser.lng) {
//         const distance = Math.sqrt(
//           (user.lat - currentUser.lat) ** 2 + (user.lng - currentUser.lng) ** 2
//         );
//         score += 1 / (distance + 0.01);
//       }

//       // New user boost
//       const isNew =
//         new Date().getTime() - new Date(user.createdAt).getTime() <
//         7 * 24 * 60 * 60 * 1000;
//       if (isNew) score += 5;

//       return { ...user, score };
//     })
//     .sort((a, b) => b.score - a.score);

//   return suggestedUsers.map((user) => ({
//     id: user.id,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     profileImage: user.profileImage,
//     address: user.address,
//     datingInterests: user.datingInterests,
//   }));
// };

const getAllSuggestedUsers = async ({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) => {
  if (type !== "social" && type !== "dating") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid type. Type must be "social" or "dating"'
    );
  }

  // 1️⃣ Get current user
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, interests: true, lat: true, lng: true },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2️⃣ Exclude already followed users
  const alreadyFollowed = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      following: {
        where: { requestStatus: RequestStatus.PENDING },
        select: { followingId: true },
      },
    },
  });

  const excludeIds = alreadyFollowed?.following.map((f) => f.followingId) || [];
  const whereId =
    excludeIds.length > 0 ? [currentUser.id, ...excludeIds] : [currentUser.id];

  // 3️⃣ Fetch users (exclude blocked/self)
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: whereId },
      blockedByUsers: { none: { blockerId: userId } },
      blockedUsers: { none: { blockerId: userId } },
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      address: true,
      interests: true,
      createdAt: true,
      lat: true,
      lng: true,
      boosts: true,
    },
  });

  if (users.length === 0) return [];

  // 4️⃣ Scoring system (interest + proximity + newness)
  const suggestedUsers = users
    .map((user) => {
      let score = 0;

      // Interest match score
      const commonInterests = (user.interests || []).filter((i: string) =>
        (currentUser.interests || []).includes(i)
      );
      score += commonInterests.length * 10;

      // Proximity score
      if (user.lat && user.lng && currentUser.lat && currentUser.lng) {
        const distance = Math.sqrt(
          (user.lat - currentUser.lat) ** 2 + (user.lng - currentUser.lng) ** 2
        );
        score += 1 / (distance + 0.01);
      }

      // New user bonus
      const isNew =
        new Date().getTime() - new Date(user.createdAt).getTime() <
        7 * 24 * 60 * 60 * 1000;
      if (isNew) score += 5;

      // ✅ Boost multiplier
      if (user.boosts && user.boosts > 1) {
        score *= user.boosts; // boosted users rank higher proportionally
      }

      return { ...user, score };
    })
    // ✅ Sort boosted + higher score first
    .sort((a, b) => {
      const aBoosted = a.boosts > 1 ? 1 : 0;
      const bBoosted = b.boosts > 1 ? 1 : 0;
      if (aBoosted !== bBoosted) return bBoosted - aBoosted;
      return b.score - a.score;
    });

  // 5️⃣ Return final result
  return suggestedUsers.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
    address: user.address,
    interests: user.interests,
  }));
};

// un friend
const unfriendUser = async ({
  userId,
  friendId,
  // type,
}: {
  userId: string;
  friendId: string;
  // type: string;
}) => {
  // if (type !== "dating" && type !== "social") {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "Invalid type. Type must be 'dating'"
  //   );
  // }

  // const modeType = type === "dating" ? ModeType.DATING : ModeType.SOCIAL;

  const follow = await prisma.follow.findFirst({
    where: {
      OR: [
        { followerId: userId, followingId: friendId },
        { followerId: friendId, followingId: userId },
      ],
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Friend relationship not found");
  }
  const result = await prisma.follow.update({
    where: {
      id: follow.id,
    },
    data: {
      requestStatus: RequestStatus.CANCELED,
    },
  });

  const myFollow = await prisma.follow.findMany({
    where: {
      followerId: userId,
      followingId: friendId,
      // requestStatus: RequestStatus.PENDING,
    },
  });

  if (myFollow.length > 0) {
    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: friendId,
        // requestStatus: RequestStatus.PENDING,
      },
    });

    if (follow) {
    return { message: "Follow request canceled (deleted)" };
  }

  return { message: "No pending follow request found" };


};

  userId,
  followerId,
  status,
}: {
  userId: string;
  followerId: string;
  status: "ACCEPTED" | "CANCELED";
}) => {
  // Validate status
  if (![RequestStatus.ACCEPTED, RequestStatus.CANCELED].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid status. Status should be ACCEPTED or CANCELED"
    );
  }

  const follow = await prisma.follow.findFirst({
    where: {
      followerId: followerId,
      followingId: userId,
      // modeType: modeType,
      requestStatus: RequestStatus.PENDING,
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow request not found");
  }

  const result = await prisma.follow.update({
    where: { id: follow.id },
    data: { requestStatus: status },
  });

  if (status === RequestStatus.ACCEPTED) {
    const reverseFollow = await prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: followerId,
      },
    });

    if (reverseFollow) {
      await prisma.follow.update({
        where: { id: reverseFollow.id },
        data: { requestStatus: RequestStatus.ACCEPTED },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: followerId,
          requestStatus: RequestStatus.ACCEPTED,
        },
      });
    }
  }

};

const unfollowUserByUserId = async ({ userId, followerId }: { userId: string; followerId: string }) => {

  const follow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: followerId,
    },
  })

  // if (!follow) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  // }

  if (follow) {
  const result = await prisma.follow.deleteMany({
    where: {
      followerId: userId,
      followingId: followerId,
    },
  });

  // const updatedFollow = await prisma.follow.deleteMany({
  //   where: {
  //     OR:[
  //       {
  //         followerId: followerId,
  //         followingId: userId,
  //       },
  //       {
  //         followerId: userId,
  //         followingId: followerId,
  //       },
  //     ]
  //   },
  // })

  // console.log(updatedFollow, "updatedFollow");

  return result;
}

const getSeeFollowerFollowing = async ({ userId, targetId }: { userId: string; targetId: string }) => {

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User are not authorized!");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");


  const followData = await prisma.user.findFirst({
    where: {
      id: targetId,
    },
    select: {
      followers: {
        select: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        }
      }
    }
  })

  if (!followData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  // ✅ Clean structure (remove duplicates and unwrap)
  const followers = Array.from(
    new Map(
      followData.followers.map((f) => [f.follower.id, f.follower])
    ).values()
  );




  return followers
}
const getSeeFollowing = async ({ userId, targetId }: { userId: string; targetId: string }) => {

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User are not authorized!");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");


  const followData = await prisma.user.findFirst({
    where: {
      id: targetId,
    },
    select: {
      following: {
        select: {
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        }
      },
    }
  })

  if (!followData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  // ✅ Clean structure (remove duplicates and unwrap)

  const following = Array.from(
    new Map(
      followData.following.map((f) => [f.following.id, f.following])
    ).values()
  );

  return following;

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
  getMyAllFollwingRequest,
  getAllSuggestedUsers,
  unfriendUser,
  acceptOrDeclineFollwerRequestByUserId,
  unfollowUserByUserId,
  getSeeFollowerFollowing,
  getSeeFollowing
};
