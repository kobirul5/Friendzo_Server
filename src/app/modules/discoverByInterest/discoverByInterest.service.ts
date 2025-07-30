
// import httpStatus from 'http-status';
// import prisma from '../../../shared/prisma';
// import { haversine } from '../../../shared/haversine';
// import ApiError from '../../../errors/ApiErrors';



// const getNeerByPeple = (userId: string, lat: number, lng: number) {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { lat: true, lng: true },
//     });

//     if (!user?.lat || !user?.lng) {
//       throw new ApiError(httpStatus.BAD_REQUEST,"User location not found.");
//     }

//     const distance = haversine(
//       { lat: user.lat, lng: user.lng },
//       { lat, lng }
//     );

//     return {
//       from: user,
//       to: { lat, lng },
//       distanceInKm: +distance.toFixed(2),
//     };
//   },


// export const discoverByInterestService = {
// getNeerByPeple

// };