import httpStatus from 'http-status';

import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiErrors';
import { likeService } from './like.service';

const createEventLike = catchAsync(async (req, res) => {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ message: "userId and eventId are required." });
    }

    const result = await likeService.createEventLikeService(userId, eventId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Like created successfully',
    data: result,
  });
});


const createMemoryLike = catchAsync(async (req, res) => {
     const { userId, memoryId } = req.body;

    if (!userId || !memoryId) {
      throw new ApiError(400, "userId and memoryId are required." );
    }

    const result = await likeService.createMemoryLikeService(userId, memoryId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Like created successfully',
    data: result,
  });
});

// const getLikeList = catchAsync(async (req, res) => {
//   const result = await likeService.getListFromDb();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Like list retrieved successfully',
//     data: result,
//   });
// });

// const getLikeById = catchAsync(async (req, res) => {
//   const result = await likeService.getByIdFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Like details retrieved successfully',
//     data: result,
//   });
// });

// const updateLike = catchAsync(async (req, res) => {
//   const result = await likeService.updateIntoDb(req.params.id, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Like updated successfully',
//     data: result,
//   });
// });

// const deleteLike = catchAsync(async (req, res) => {
//   const result = await likeService.deleteItemFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Like deleted successfully',
//     data: result,
//   });
// });

export const likeController = {
  createEventLike,
  createMemoryLike,
  // getLikeList,
  // getLikeById,
  // updateLike,
  // deleteLike,
};