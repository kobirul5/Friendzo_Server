import httpStatus from 'http-status';

import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiErrors';
import { likeService } from './like.service';
import { Request, Response} from 'express';
import prisma from '../../../shared/prisma';

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


const createMemoryLike = catchAsync(async (req:any, res:Response) => {
     const { memoryId } = req.body;
     const userId = req.user.id

    if (!memoryId) {
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


 const getMemoryLikeStats = async (req: Request, res: Response) => {

    const {id} = req.params;

    if (!id) {
      return res.status(400).json({ message: "memoryId is required." });
    }

    const [count, users] = await Promise.all([
      likeService.getMemoryLikeCountService(id),
      likeService.getMemoryLikedUsersService(id),
    ]);

    const result ={
      id,
      likeCount: count,
      likedBy: users,
    };

     sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Like created successfully',
    data: result,
  });

  }


const removeMemoryLike = catchAsync(async (req:any, res:Response) => {
  const { memoryId } = req.body;
  const userId = req.user.id

  if (!memoryId) {
    throw new ApiError(400, "userId and memoryId are required.");
  }

  const result = await likeService.removeMemoryLikeService(userId, memoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Like removed successfully',
    data: result,
  });
});

const getDayliMyLike = catchAsync(async (req:any, res:Response) => {

  const userId = req.user.id

  const result = await likeService.getDailyMyLikeService(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily Like Get successfully',
    data: result,
  });
})
const getWeeklyMyLike = catchAsync(async (req:any, res:Response) => {

  const userId = req.user.id

  const result = await likeService.getMyWeeklyService(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Weekly Like Get successfully',
    data: result,
  });
})

const createUserLikeService = catchAsync(async (req:any, res:Response) => {
  const { likedUserId } = req.body;
  const userId = req.user.id

  const result = await likeService.createUserLikeService(userId, likedUserId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User Like created successfully',
    data: result,
  });

})

const removeUserLike = catchAsync(async (req:any, res:Response) => {
  const { likedUserId } = req.body;
  const userId = req.user.id

  const result = await likeService.removeUserLikeService(userId, likedUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Like removed successfully',
    data: result,
  });
})

export const likeController = {
  createEventLike,
  createMemoryLike,
  getMemoryLikeStats,
  removeMemoryLike,
  getDayliMyLike,
  getWeeklyMyLike ,
  createUserLikeService,
  removeUserLike
};