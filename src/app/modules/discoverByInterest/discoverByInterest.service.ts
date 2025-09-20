
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import { haversine } from '../../../shared/haversine';
import ApiError from '../../../errors/ApiErrors';
import { UserRole } from '@prisma/client';



//  const getNearbyPeople = async (userId: string, lat: number, lng: number, radiusKm: number) => {
//   // Make sure user exists
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true },
//   });

//   if (!currentUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
//   }

//   // Get other users with coordinates
//   const users = await prisma.user.findMany({
//     where: {
//       id: { not: userId },
//       lat: { not: null },
//       lng: { not: null },
//     },
//   });



  
//   // Filter by distance from (lat, lng)
//  const nearbyUsers = users
//   .map(user => {
//     const { password, ...userWithoutPassword } = user;
//     const distance = haversine({ lat, lng }, { lat: user.lat!, lng: user.lng! });
//     return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
//   })
//   .filter(user => user.distanceInKm <= radiusKm);

//   return nearbyUsers;
// };



 const getNearbyPeople = async (
  userId: string,
  lat?: number,
  lng?: number,
  radiusKm?: number
) => {
  // 1️ Check user exists
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, lat: true, lng: true },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }


  // 2️ Determine base coordinates (argument or user's DB coords)
  const baseLat = lat ? lat : Number(currentUser.lat);
  const baseLng = lng ? lng : Number(currentUser.lng);


  if (baseLat == null || baseLng == null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No valid coordinates found.");
  }

   const following = await prisma.follow.findMany({
    where: {
      followerId: userId
    },
    select: { followingId: true },
  });

  const excludedIds = following.map(f => f.followingId);
 

  // 3️ Fetch other users with valid coordinates
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludedIds, userId] },
      lat: { not: null },
      lng: { not: null },
      role: {not: UserRole.ADMIN},
      
    },
  });

  // 4️ Calculate distance safely
  const usersWithDistance = users
    .map((user) => {
      if (user.lat == null || user.lng == null) return null; // skip invalid coords

      const { password, ...userWithoutPassword } = user as any;
      const distance = haversine(
        { lat: baseLat, lng: baseLng },
        { lat: user.lat, lng: user.lng }
      );

      return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
    })
    .filter(Boolean); // remove null entries

  // 5️ Apply radius filter if provided
  let nearbyUsers = usersWithDistance;
  if (radiusKm) {
    nearbyUsers = nearbyUsers.filter((u) => u.distanceInKm <= radiusKm);
  }

  // 6️ Sort by nearest first
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