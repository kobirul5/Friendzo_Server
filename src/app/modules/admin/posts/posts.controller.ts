import httpStatus from 'http-status';
import { postsService } from './posts.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';


const getPostsList = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, search, userId } = req.query;
    const result = await postsService.getPostsListFromDb({
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as "asc" | "desc",
    search: search as string,
    userId: userId as string,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts list retrieved successfully',
    data: result,
  });
});

const getPostsById = catchAsync(async (req, res) => {
  const result = await postsService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts details retrieved successfully',
    data: result,
  });
});

const updatePosts = catchAsync(async (req, res) => {
  const result = await postsService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts updated successfully',
    data: result,
  });
});

const deletePosts = catchAsync(async (req, res) => {
  const result = await postsService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts deleted successfully',
    data: result,
  });
});

export const postsController = {
  getPostsList,
  getPostsById,
  updatePosts,
  deletePosts,
};