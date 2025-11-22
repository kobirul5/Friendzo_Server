
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import { haversine } from '../../../shared/haversine';
import ApiError from '../../../errors/ApiErrors';
import { Gender, Prisma, RequestStatus, UserRole } from '@prisma/client';



const ifNoParameterGetNearbyPeople = async (
  userId: string,
) => {
  // 1️ Check user exists
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, lat: true, lng: true },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }



  // 2️ Determine base coordinates
  const baseLat =  Number(currentUser.lat);
  const baseLng =  Number(currentUser.lng);

  // if (baseLat == null || baseLng == null) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "No valid coordinates found.");
  // }

  // 3️ Get list of followed users to exclude
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const excludedIds = following.map((f) => f.followingId);

  // 4️ Build dynamic search filter
  const dynamicWhere: Prisma.UserWhereInput = {
    id: { notIn: [...excludedIds, userId] },
    lat: { not: null },
    lng: { not: null },
    role: { not: UserRole.ADMIN }
  };

  // 5️ Fetch users
  const users = await prisma.user.findMany({
    where: dynamicWhere,
  });

  // 6️ Calculate distance
  const usersWithDistance = users
    .map((user) => {
      if (user.lat == null || user.lng == null) return null;

      const { password, ...userWithoutPassword } = user as any;
      const distance = haversine(
        { lat: baseLat, lng: baseLng },
        { lat: user.lat, lng: user.lng }
      );

      return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
    })
    .filter(Boolean);

  // 7️ Apply radius filter
  let nearbyUsers = usersWithDistance;

  // 8️ Sort by nearest
  nearbyUsers.sort((a, b) => a.distanceInKm - b.distanceInKm);
  nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= 657018);

  return nearbyUsers;
};


const getNearbyPeople = async ( {
    userId,
    lat,
    lng,
    radiusKm,
    minDistance,
    maxDistance,
    search,
    gender,
  } : {
    userId: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    minDistance?: number;
    maxDistance?: number;
    search?: string;
    gender?: string;
  }
) => {
  // 1️ Check user exists
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, lat: true, lng: true },
  });
    if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  if( !lat && !lng && !radiusKm && !minDistance && !maxDistance){
   const result = await ifNoParameterGetNearbyPeople(userId)
   result.sort((a, b) => a.distanceInKm - b.distanceInKm);
   return result
  }




  // 2️ Determine base coordinates
  const baseLat = lat ?? Number(currentUser.lat);
  const baseLng = lng ?? Number(currentUser.lng);

  if (baseLat == null || baseLng == null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No valid coordinates found.");
  }

  // 3️ Find all following (exclude them)
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const excludedIds = following.map((f) => f.followingId);

  // 4️ Build dynamic where condition
  const dynamicWhere: Prisma.UserWhereInput = {
    id: { notIn: [...excludedIds, userId] },
    lat: { not: null },
    lng: { not: null },
    role: { not: UserRole.ADMIN },
    ...(gender ? { gender } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // 5️ Fetch other users
  const users = await prisma.user.findMany({ where: dynamicWhere });

  // 6️ Calculate distance
  const usersWithDistance = users
    .map((user) => {
      if (user.lat == null || user.lng == null) return null;
      const { password, ...userWithoutPassword } = user as any;
      const distance = haversine(
        { lat: baseLat, lng: baseLng },
        { lat: user.lat, lng: user.lng }
      );

      return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
    })
    .filter(Boolean);

  // 7️ Apply radius filter (old support)
  let nearbyUsers = usersWithDistance;
  if (radiusKm) {
    nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= radiusKm);
  }
  if (!radiusKm) {
    nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= 65);
  }

  // 8️ Apply distance range filter (new support)
  if (minDistance !== undefined && maxDistance !== undefined) {
    nearbyUsers = nearbyUsers.filter(
      (u) => u.distanceInKm >= minDistance && u.distanceInKm <= maxDistance
    );
  } else if (maxDistance !== undefined) {
    nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= maxDistance);
  } else if (minDistance !== undefined) {
    nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm >= minDistance);
  }

  // 9️ Sort by nearest first
  nearbyUsers.sort((a, b) => a.distanceInKm - b.distanceInKm);

  return [nearbyUsers];
};


const getTodaysBuzz = async (userId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Step 1: Fetch today's events
  const todaysEvents = await prisma.event.findMany({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    }
  });



  // Step 3: Fetch those users separately (without event relation)
  // const users = await prisma.user.findMany({
  //   where: {
  //   id: {
  //     not: userId,
  //   },
  //   lat: {
  //     not: null,        
  //   },
  //   lng: {
  //     not: null,       
  //   },
  //   role: {not: UserRole.ADMIN},
  // },
  //   select: {
  //     id: true,
  //     firstName: true,
  //     lastName: true,
  //     profileImage: true,
  //     email: true,
  //     lat: true,
  //     lng: true,
  //   },
  // });


  const allowedUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      lat: { not: null },
      lng: { not: null },
      role: { not: UserRole.ADMIN },

      OR: [
        // I follow them → accepted
        {
          followers: {
            some: {
              followerId: userId,
              requestStatus: "ACCEPTED"
            }
          }
        },
        // They follow me → accepted
        {
          following: {
            some: {
              followingId: userId,
              requestStatus: "ACCEPTED"
            }
          }
        }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      email: true,
      lat: true,
      lng: true,
    },
  });

  return {
    todaysEvents, // strip embedded user from event
    users: allowedUsers,
  };
};


// const getPeopleBySharedInterests = async ({userId, interest}: {userId: string, interest: string}) => {
//   // 1️ Get current user's interests
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       interests: true,
//     },
//   });

//   if (!currentUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
//   }

//    const currentUserInterests = interest? [interest] :  currentUser.interests;

//    if (currentUserInterests && currentUserInterests.length > 0) {
//     // Validate interests against fixed array

//     const interests = await prisma.interest.findMany({
//       select: { name: true },
//     });

//     const CategoriesArray = interests.map((interest) => interest.name);

//     const invalidNames = currentUserInterests.filter(
//       (name) =>
//         !CategoriesArray.includes(name as (typeof CategoriesArray)[number])
//     );

//     if (invalidNames.length > 0) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         `Invalid interest names: ${invalidNames.join(", ")}. ` +
//           `You must use one of the following names: ${CategoriesArray.join(
//             ", "
//           )}.`
//       );
//     }
//   }


//   if (!currentUserInterests || currentUserInterests.length === 0) {
//     return []; // or throw an error if interests are required
//   }

//    const following = await prisma.follow.findMany({
//     where: {
//       followerId: userId,
//     },
//     select: { followingId: true },
//   });

//   const excludedIds = following.map(f => f.followingId);
 

//   // 2️ Get other users who share at least one interest
//   const matchedUsers = await prisma.user.findMany({
//     where: {
//       id: { not: { in: [userId, ...excludedIds] } },
//       role: {not: UserRole.ADMIN},
//       interests: {
//         hasSome: currentUserInterests,
//       },
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       profileImage: true,
//       email: true,
//       role: true,
//       interests: true,
//       gender: true,
//       dob: true,
//       address: true,
//     },
//   });

//   // 3️ Calculate shared interests percentage
//   const usersWithMatchPercentage = matchedUsers.map((user) => {
//     const sharedCount = user.interests.filter((i) =>
//       currentUserInterests.includes(i)
//     ).length;

//     const matchPercentage =
//       currentUserInterests.length > 0
//         ? Math.round((sharedCount / currentUserInterests.length) * 100)
//         : 0;

//     return {
//       ...user,
//       interestPercentage: matchPercentage,
//     };
//   });

  

//   // Optional: sort by highest match first
//   usersWithMatchPercentage.sort(
//     (a, b) => b.interestPercentage - a.interestPercentage
//   );

//   return usersWithMatchPercentage;
// };

// const getPeopleBySharedInterests = async ({
//   userId,
//   interest,
// }: {
//   userId: string;
//   interest?: string;
// }) => {
//   // 1️⃣ Get current user's interests and location
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       interests: true,
//       lat: true,
//       lng: true,
//     },
//   });

//   if (!currentUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
//   }

//   const currentUserInterests = interest ? [interest] : currentUser.interests;

//   if (!currentUserInterests || currentUserInterests.length === 0) return [];

//   // 2️⃣ Validate interests against fixed array
//   const interests = await prisma.interest.findMany({ select: { name: true } });
//   const CategoriesArray = interests.map((i) => i.name);

//   const invalidNames = currentUserInterests.filter(
//     (name) => !CategoriesArray.includes(name as (typeof CategoriesArray)[number])
//   );

//   if (invalidNames.length > 0) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       `Invalid interest names: ${invalidNames.join(
//         ", "
//       )}. Use one of: ${CategoriesArray.join(", ")}`
//     );
//   }

//   // 3️⃣ Get already-followed users to exclude
//   const following = await prisma.follow.findMany({
//     where: { followerId: userId },
//     select: { followingId: true },
//   });
//   const excludedIds = following.map((f) => f.followingId);

//   // 4️⃣ Fetch matched users
//   const matchedUsers = await prisma.user.findMany({
//     where: {
//       id: { not: { in: [userId, ...excludedIds] } },
//       role: { not: UserRole.ADMIN },
//       interests: { hasSome: currentUserInterests },
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       profileImage: true,
//       email: true,
//       role: true,
//       interests: true,
//       gender: true,
//       dob: true,
//       lat: true,
//       lng: true,
//       address: true,
//     },
//   });

//   // 5️⃣ Calculate shared interests + distance
//   const usersWithMatchPercentage = matchedUsers.map((user) => {
//     const sharedCount = user.interests.filter((i) =>
//       currentUserInterests.includes(i)
//     ).length;

//     const matchPercentage =
//       currentUserInterests.length > 0
//         ? Math.round((sharedCount / currentUserInterests.length) * 100)
//         : 0;

//     let distanceKm: number | null = null;
//     if (
//       currentUser.lat != null &&
//       currentUser.lng != null &&
//       user.lat != null &&
//       user.lng != null
//     ) {
//       distanceKm = Math.round(
//         haversine(
//           { lat: currentUser.lat, lng: currentUser.lng },
//           { lat: user.lat, lng: user.lng }
//         ) * 100
//       ) / 100;
//     }

//     return {
//       ...user,
//       interestPercentage: matchPercentage,
//       distanceKm,
//     };
//   });

//   // 6️⃣ Sort by highest match first
//   usersWithMatchPercentage.sort(
//     (a, b) => b.interestPercentage - a.interestPercentage
//   );

//   return usersWithMatchPercentage;
// };


const getPeopleBySharedInterests = async ({
  userId,
  interest,
}: {
  userId: string;
  interest?: string;
}) => {
  // 1️⃣ Get current user's interests and location
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      interests: true,
      lat: true,
      lng: true,
    },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const currentUserInterests = interest ? [interest] : currentUser.interests;

  if (!currentUserInterests || currentUserInterests.length === 0) return [];

  // 2️⃣ Validate interests against fixed array
  const interests = await prisma.interest.findMany({ select: { name: true } });
  const CategoriesArray = interests.map((i) => i.name);

  const invalidNames = currentUserInterests.filter(
    (name) => !CategoriesArray.includes(name as (typeof CategoriesArray)[number])
  );

  if (invalidNames.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid interest names: ${invalidNames.join(
        ", "
      )}. Use one of: ${CategoriesArray.join(", ")}`
    );
  }

  // 3️⃣ 🚫 Get already-followed users AND ALL mutual friends (BOTH DIRECTIONS)
  const [following, acceptedFriendsBothWays] = await Promise.all([
    // 👤 Users YOU follow (any status)
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    
    // 🤝 ALL MUTUAL FRIENDS (BOTH DIRECTIONS - ACCEPTED ONLY)
    prisma.follow.findMany({
      where: { 
        requestStatus: RequestStatus.ACCEPTED,
        OR: [
          { followingId: userId }, // ✅ They accepted YOUR request
          { followerId: userId }   // ✅ YOU accepted THEIR request
        ]
      },
      select: { followerId: true, followingId: true },
    }),
  ]);

  // ✅ VALIDATION: Check if userId exists as follower
  const userAsFollowerCheck = await prisma.follow.findFirst({
    where: { followerId: userId },
    select: { id: true }
  });

  if (!userAsFollowerCheck) {
    console.log(` User ${userId} has no follow records as follower`);
  }

  // Get users YOU follow
  const usersIFollow = following.map((f) => f.followingId);

  // ✅ ALL mutual friends (BOTH directions - remove duplicates & yourself)
  const mutualFriends = [...new Set(
    acceptedFriendsBothWays
      .map(f => [f.followerId, f.followingId])
      .flat()
      .filter(id => id !== userId) // Remove yourself
      .filter(id => !usersIFollow.includes(id)) // Remove already-followed
  )];

  // ✅ EXCLUDE: Yourself + Users you follow + ALL Mutual friends
  const excludedIds = [...new Set([userId, ...usersIFollow, ...mutualFriends])];

  console.log(`🚫 Excluding ${excludedIds.length} users:`, excludedIds.slice(0, 5));

  // 4️⃣ Fetch matched users (EXCLUDING friends & followed)
  const matchedUsers = await prisma.user.findMany({
    where: {
      id: { not: { in: excludedIds } }, // ✅ Now excludes ALL friends!
      role: { not: UserRole.ADMIN },
      interests: { hasSome: currentUserInterests },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      email: true,
      role: true,
      interests: true,
      gender: true,
      dob: true,
      lat: true,
      lng: true,
      address: true,
      boosts: true,
    },
  });

  // 5️⃣ Calculate shared interests + distance + PROVIDE DEFAULTS FOR NULL FIELDS
  const usersWithMatchPercentage = matchedUsers.map((user) => {
    const sharedCount = (user.interests ?? []).filter((i) =>
      currentUserInterests.includes(i)
    ).length;

    const matchPercentage =
      currentUserInterests.length > 0
        ? Math.round((sharedCount / currentUserInterests.length) * 100)
        : 0;

    let distanceKm: number = 0.0; // Default to 0.0 if coords missing
    if (
      currentUser.lat != null &&
      currentUser.lng != null &&
      user.lat != null &&
      user.lng != null
    ) {
      distanceKm = Math.round(
        haversine(
          { lat: currentUser.lat, lng: currentUser.lng },
          { lat: user.lat, lng: user.lng }
        ) * 100
      ) / 100;
    }

    // ✅ SANITIZED USER WITH DEFAULT VALUES FOR NULL FIELDS
    const sanitizedUser = {
      id: user.id ?? '', // Should never be null, but safe
      firstName: user.firstName ?? 'Unknown', // Default name
      lastName: user.lastName ?? 'User',
      profileImage: user.profileImage,
      email: user.email ,
      role: user.role,
      interests: user.interests ?? [], // Empty array if null
      gender: user.gender ?? 'Prefer not to say', // Default gender string
      dob: user.dob ?? 0, // Keep null or set to new Date('1900-01-01') if needed
      lat: user.lat ?? 0, // Keep null (used for distance calc)
      lng: user.lng ?? 0, // Keep null
      address: user.address ?? 'Location not shared',
      boost: user.boosts , // Default address string
    };

    

    return {
      ...sanitizedUser,
      interestPercentage: matchPercentage,
      distanceKm,
    };
  });


  // 6️⃣ Sort by highest match first
usersWithMatchPercentage.sort((a, b) => {
  const aBoosted = a.boost > 1 ? 1 : 0;
  const bBoosted = b.boost > 1 ? 1 : 0;

  if (aBoosted !== bBoosted) return bBoosted - aBoosted; // boosted first
  if (b.interestPercentage !== a.interestPercentage)
    return b.interestPercentage - a.interestPercentage; // higher match first
  return a.distanceKm - b.distanceKm; // nearer first
});


  console.log(`✅ Found ${usersWithMatchPercentage.length} new matches!`);

  return usersWithMatchPercentage;
};
export const discoverByInterestService = {
getNearbyPeople,
getPeopleBySharedInterests,
getTodaysBuzz

};