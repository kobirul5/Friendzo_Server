import httpStatus from 'http-status';
import { commentService } from './comment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiErrors';
import { Response } from 'express';

const createComment = catchAsync(async (req:any, res: Response) => {
  const { comment, memoryId } = req.body;
  const userId = req.user.id

  console.log(userId)

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

const getCommentList = catchAsync(async (req, res) => {
  const result = await commentService.getListFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment list retrieved successfully',
    data: result,
  });
});


const deleteComment = catchAsync(async (req, res) => {
  const result = await commentService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: result,
  });
});

export const commentController = {
  createComment,
  getCommentList,
  deleteComment,
};