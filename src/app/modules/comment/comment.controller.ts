import httpStatus from 'http-status';
import { commentService } from './comment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiErrors';
import { Request, Response } from 'express';

const createComment = catchAsync(async (req:any, res: Response) => {
  const { comment, memoryId } = req.body;
  const userId = req.user.id


  if (!comment ||  !memoryId) {
    throw new ApiError(400, 'comment, and memoryId are required.');
  }

  const result = await commentService.createCommentService(comment, userId, memoryId);


  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment created successfully',
    data: result,
  });
});

const getCommentsByMemory = catchAsync(async (req: Request, res: Response) => {
  const { memoryId } = req.params;

  if (!memoryId) {
    throw new ApiError(400, 'memoryId is required.');
  }

  const result = await commentService.getCommentsByMemoryService(memoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comments fetched successfully',
    data: result,
  });
});


const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, 'commentId is required.');
  }

  const result = await commentService.deleteCommentService(commentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: result,
  });
});


export const commentController = {
  createComment,
  getCommentsByMemory,
  deleteComment,
};