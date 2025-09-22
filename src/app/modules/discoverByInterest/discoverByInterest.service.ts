
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import { haversine } from '../../../shared/haversine';
import ApiError from '../../../errors/ApiErrors';
import { Gender, Prisma, UserRole } from '@prisma/client';



// const getNearbyPeople = async (
//   userId: string,
//   lat?: number,
//   lng?: number,
//   radiusKm?: number,
//   search?: string,
//   gender?: string
// ) => {
//   // 1️ Check user exists
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, lat: true, lng: true },
//   });

//   if (!currentUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
//   }

//   if(gender && gender !== Gender.HIM && gender !== Gender.HER && gender !== Gender.EVERYONE){
//     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid gender. gender must be one of: HIM, HER, EVERYONE");
//   }

//   // 2️ Determine base coordinates
//   const baseLat = lat ?? Number(currentUser.lat);
//   const baseLng = lng ?? Number(currentUser.lng);

//   if (baseLat == null || baseLng == null) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "No valid coordinates found.");
//   }

//   // 3️ Get list of followed users to exclude
//   const following = await prisma.follow.findMany({
//     where: { followerId: userId },
//     select: { followingId: true },
//   });
//   const excludedIds = following.map((f) => f.followingId);

//   // 4️ Build dynamic search filter
//   const dynamicWhere: Prisma.UserWhereInput = {
//     id: { notIn: [...excludedIds, userId] },
//     lat: { not: null },
//     lng: { not: null },
//     role: { not: UserRole.ADMIN },
//     ...(gender ? { gender } : {}),
//     ...(search
//       ? {
//           OR: [
//             { firstName: { contains: search, mode: "insensitive" } },
//             { lastName: { contains: search, mode: "insensitive" } },
//           ],
//         }
//       : {}),
//   };

//   // 5️ Fetch users
//   const users = await prisma.user.findMany({
//     where: dynamicWhere,
//   });

//   // 6️ Calculate distance
//   const usersWithDistance = users
//     .map((user) => {
//       if (user.lat == null || user.lng == null) return null;

//       const { password, ...userWithoutPassword } = user as any;
//       const distance = haversine(
//         { lat: baseLat, lng: baseLng },
//         { lat: user.lat, lng: user.lng }
//       );

//       return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
//     })
//     .filter(Boolean);

//   // 7️ Apply radius filter
//   let nearbyUsers = usersWithDistance;
//   if (radiusKm) {
//     nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= radiusKm);
//   }

//   // 8️ Sort by nearest
//   nearbyUsers.sort((a, b) => a.distanceInKm - b.distanceInKm);

//   return nearbyUsers;
// };


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

  console.log(lat," lat," , lng," lng," , radiusKm,    "radiusKm", search, "search", gender, "gender", minDistance, "minDistance", maxDistance, "maxDistance", "dfdaff---------------------");
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
      console.log(distance, "distance");
      return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
    })
    .filter(Boolean);

  // 7️ Apply radius filter (old support)
  let nearbyUsers = usersWithDistance;
  if (radiusKm) {
    nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= radiusKm);
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

  return nearbyUsers;
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
  const users = await prisma.user.findMany({
    where: {
    id: {
      not: userId,
    },
    lat: {
      not: null,        
    },
    lng: {
      not: null,       
    },
    role: {not: UserRole.ADMIN},
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
    users,
  };
};


// const getPeopleBySharedInterests = async (userId: string) => {
//   // Get current user's interests
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

//   const currentUserInterests = currentUser.interests;

//   if (!currentUserInterests || currentUserInterests.length === 0) {
//     return []; // or throw an error if interests are required
//   }

//   // Get other users who share at least one interest
//   const matchedUsers = await prisma.user.findMany({
//     where: {
//       id: { not: userId },
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
//       interests: true,
//       gender: true,
//       dob: true,
//     },
//   });

//   return matchedUsers;
// };


const getPeopleBySharedInterests = async ({userId, interest}: {userId: string, interest: string}) => {
  // 1️ Get current user's interests
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      interests: true,
    },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

   const currentUserInterests = interest? [interest] :  currentUser.interests;

   if (currentUserInterests && currentUserInterests.length > 0) {
    // Validate interests against fixed array

    const interests = await prisma.interest.findMany({
      select: { name: true },
    });

    const CategoriesArray = interests.map((interest) => interest.name);

    const invalidNames = currentUserInterests.filter(
      (name) =>
        !CategoriesArray.includes(name as (typeof CategoriesArray)[number])
    );

    if (invalidNames.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid interest names: ${invalidNames.join(", ")}. ` +
          `You must use one of the following names: ${CategoriesArray.join(
            ", "
          )}.`
      );
    }
  }


  if (!currentUserInterests || currentUserInterests.length === 0) {
    return []; // or throw an error if interests are required
  }

   const following = await prisma.follow.findMany({
    where: {
      followerId: userId,
    },
    select: { followingId: true },
  });

  const excludedIds = following.map(f => f.followingId);
 

  // 2️ Get other users who share at least one interest
  const matchedUsers = await prisma.user.findMany({
    where: {
      id: { not: { in: [userId, ...excludedIds] } },
      role: {not: UserRole.ADMIN},
      interests: {
        hasSome: currentUserInterests,
      },
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
    },
  });

  // 3️ Calculate shared interests percentage
  const usersWithMatchPercentage = matchedUsers.map((user) => {
    const sharedCount = user.interests.filter((i) =>
      currentUserInterests.includes(i)
    ).length;

    const matchPercentage =
      currentUserInterests.length > 0
        ? Math.round((sharedCount / currentUserInterests.length) * 100)
        : 0;

    return {
      ...user,
      interestPercentage: matchPercentage,
    };
  });

  // Optional: sort by highest match first
  usersWithMatchPercentage.sort(
    (a, b) => b.interestPercentage - a.interestPercentage
  );

  return usersWithMatchPercentage;
};


export const discoverByInterestService = {
getNearbyPeople,
getPeopleBySharedInterests,
getTodaysBuzz

};