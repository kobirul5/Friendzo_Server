// import httpStatus from 'http-status';

// import { discoverByInterestService } from './discoverByInterest.service';
// import catchAsync from '../../../shared/catchAsync';
// import sendResponse from '../../../shared/sendResponse';

// const getNeerByPeple  = catchAsync(async (req, res) => {

//   const userId = req.user?.id;
//   const { lat, lng } = req.params;

//   if (!lat || !lng) {
//     throw new Error("Latitude and Longitude are required in params.");
//   }

//   const result = await discoverByInterestService.getNeerByPeple(userId, parseFloat(lat), parseFloat(lng));


//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Discover by interest list retrieved successfully',
//     data: result,
//   });



// })


// export const discoverByInterestController = {
 
// };